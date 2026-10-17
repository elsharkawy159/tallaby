import { cache } from "react";
import { db, orderItems } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { createClient } from "@/supabase/server";
import type { HomeChannel, HomeRange } from "./home.shared";
import type { SetupFlags } from "./setup-checklist.lib";
import { getSellerStores } from "@/lib/stores/current-store.server";

/**
 * Read-only loaders for the dashboard home. Kept out of `actions/` on purpose:
 * these are not callable from the client, they only feed server components.
 *
 * Every loader is wrapped in React `cache()` so sections that stream in
 * parallel share one auth lookup and one query per request. Sales figures use
 * the Cairo calendar day, not the server's UTC day.
 */

/** Line items that never turned into revenue. */
const NON_REVENUE = sql`('cancelled', 'refunded', 'returned')`;
/** Line items the seller still has to prepare. */
const AWAITING_PREP = sql`('pending', 'confirmed')`;
export const LOW_STOCK_THRESHOLD = 10;

const rowsOf = <T,>(result: unknown): T[] =>
  (Array.isArray(result) ? result : ((result as { rows?: T[] }).rows ?? [])) as T[];

/** Signed-in seller id; the (main) layout already gated access. */
export const getHomeSellerId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
});

/** Public URL for a `products` bucket path; full URLs pass through. */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

// ---------------------------------------------------------------------------
// Snapshot: profile, setup progress and open tasks in one round-trip.
// ---------------------------------------------------------------------------

export type HomeSnapshot = {
  displayName: string;
  /** Hour of day in Cairo, for the greeting. */
  localHour: number;
  walletBalance: number;
  storeRating: number | null;
  positiveRatingPercent: number | null;
  totalRatings: number;
  /** Setup flags for the store selected in the sidebar (setup-checklist.lib.ts). */
  setup: SetupFlags;
  setupStoreId: string | null;
  hasOrders: boolean;
  attention: {
    pendingOrders: number;
    lowStock: number;
    unansweredQuestions: number;
    newReviews: number;
  };
};

export const getHomeSnapshot = cache(async (): Promise<HomeSnapshot | null> => {
  const sellerId = await getHomeSellerId();
  if (!sellerId) return null;
  const { selected } = await getSellerStores();
  // Only ever one of this seller's stores (getSellerStores ignores foreign ids).
  const storeId = selected?.id ?? null;

  const result = await db.execute(sql`
    SELECT
      s.display_name,
      extract(hour FROM now() AT TIME ZONE 'Africa/Cairo')::int AS local_hour,
      coalesce(s.wallet_balance, 0)::float8 AS wallet_balance,
      s.store_rating::float8 AS store_rating,
      s.positive_rating_percent::float8 AS positive_rating_percent,
      coalesce(s.total_ratings, 0)::int AS total_ratings,
      coalesce(st.logo_url IS NOT NULL AND nullif(st.description, '') IS NOT NULL, false) AS setup_profile,
      coalesce(st.contact ? 'phone' OR st.contact ? 'email', false) AS setup_contact,
      coalesce(st.policies ? 'return' AND st.policies ? 'shipping', false) AS setup_policies,
      EXISTS (SELECT 1 FROM products p WHERE p.seller_id = s.id AND p.status = 'active') AS setup_product,
      (nullif(s.legal_address->>'street', '') IS NOT NULL AND nullif(s.legal_address->>'state', '') IS NOT NULL) AS setup_legal,
      coalesce(s.payment_details ? 'method', false) AS setup_payout,
      EXISTS (SELECT 1 FROM coupons c WHERE c.seller_id = s.id) AS setup_coupon,
      EXISTS (SELECT 1 FROM ad_campaign_requests a WHERE a.seller_id = s.id) AS setup_campaign,
      EXISTS (SELECT 1 FROM order_items oi WHERE oi.seller_id = s.id) AS has_orders,
      (SELECT count(DISTINCT oi.order_id)::int FROM order_items oi
        WHERE oi.seller_id = s.id AND oi.status IN ${AWAITING_PREP}) AS pending_orders,
      (SELECT count(*)::int FROM products p
        WHERE p.seller_id = s.id AND p.status = 'active' AND p.quantity < ${LOW_STOCK_THRESHOLD}) AS low_stock,
      (SELECT count(*)::int FROM product_questions q JOIN products p ON p.id = q.product_id
        WHERE p.seller_id = s.id AND q.is_answered = false) AS unanswered_questions,
      (SELECT count(*)::int FROM reviews r
        WHERE r.created_at >= now() - interval '7 days'
          AND (r.seller_id = s.id
            OR r.product_id IN (SELECT p.id FROM products p WHERE p.seller_id = s.id))) AS new_reviews
    FROM sellers s
    LEFT JOIN stores st ON st.id = ${storeId}::uuid AND st.seller_id = s.id
    WHERE s.id = ${sellerId}
  `);

  const row = rowsOf<Record<string, any>>(result)[0];
  if (!row) return null;

  return {
    displayName: row.display_name,
    localHour: Number(row.local_hour),
    walletBalance: Number(row.wallet_balance),
    storeRating: row.store_rating == null ? null : Number(row.store_rating),
    positiveRatingPercent:
      row.positive_rating_percent == null ? null : Number(row.positive_rating_percent),
    totalRatings: Number(row.total_ratings),
    setup: {
      profile: Boolean(row.setup_profile),
      contact: Boolean(row.setup_contact),
      policies: Boolean(row.setup_policies),
      product: Boolean(row.setup_product),
      legal: Boolean(row.setup_legal),
      payout: Boolean(row.setup_payout),
      coupon: Boolean(row.setup_coupon),
      campaign: Boolean(row.setup_campaign),
    },
    setupStoreId: storeId,
    hasOrders: Boolean(row.has_orders),
    attention: {
      pendingOrders: Number(row.pending_orders),
      lowStock: Number(row.low_stock),
      unansweredQuestions: Number(row.unanswered_questions),
      newReviews: Number(row.new_reviews),
    },
  };
});

// ---------------------------------------------------------------------------
// Sales: daily series for the range plus totals for the period before it.
// ---------------------------------------------------------------------------

/** Start of the range as a timestamptz: Cairo midnight `range - 1` days ago. */
const rangeStartLocal = (range: HomeRange) =>
  sql`(date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') - make_interval(days => ${range - 1}::int))`;

export type SalesPoint = { day: string; revenue: number; orders: number };
export type SalesOverview = {
  series: SalesPoint[];
  revenue: number;
  orders: number;
  previousRevenue: number;
  previousOrders: number;
};

/**
 * Restricts order items to a sales channel (PLAN.md P3-04). The channel was
 * already checked against the seller's own stores (resolveHomeChannel); the
 * store id is a bound parameter.
 */
function channelFilter(channel: HomeChannel) {
  if (channel === "all") return sql``;
  if (channel === "marketplace") {
    return sql`AND EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.order_id AND o.store_id IS NULL)`;
  }
  return sql`AND EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.order_id AND o.store_id = ${channel}::uuid)`;
}

export const getSalesOverview = cache(async (range: HomeRange, channel: HomeChannel = "all"): Promise<SalesOverview> => {
  const sellerId = await getHomeSellerId();
  const empty = { series: [], revenue: 0, orders: 0, previousRevenue: 0, previousOrders: 0 };
  if (!sellerId) return empty;

  const result = await db.execute(sql`
    WITH bounds AS (SELECT ${rangeStartLocal(range)} AS start_local),
    days AS (
      SELECT generate_series(b.start_local, b.start_local + make_interval(days => ${range - 1}::int), interval '1 day')::date AS day
      FROM bounds b
    ),
    items AS (
      SELECT (oi.created_at AT TIME ZONE 'Africa/Cairo')::date AS day, oi.order_id, oi.total
      FROM order_items oi, bounds b
      WHERE oi.seller_id = ${sellerId}
        AND oi.status NOT IN ${NON_REVENUE}
        AND coalesce(oi.is_refunded, false) = false
        AND oi.created_at >= ((b.start_local - make_interval(days => ${range}::int)) AT TIME ZONE 'Africa/Cairo')
        ${channelFilter(channel)}
    ),
    cur AS (SELECT i.* FROM items i, bounds b WHERE i.day >= b.start_local::date),
    prev AS (SELECT i.* FROM items i, bounds b WHERE i.day < b.start_local::date)
    SELECT
      d.day::text AS day,
      coalesce(sum(c.total), 0)::float8 AS revenue,
      count(DISTINCT c.order_id)::int AS orders,
      (SELECT coalesce(sum(total), 0)::float8 FROM cur) AS total_revenue,
      (SELECT count(DISTINCT order_id)::int FROM cur) AS total_orders,
      (SELECT coalesce(sum(total), 0)::float8 FROM prev) AS prev_revenue,
      (SELECT count(DISTINCT order_id)::int FROM prev) AS prev_orders
    FROM days d
    LEFT JOIN cur c ON c.day = d.day
    GROUP BY d.day
    ORDER BY d.day
  `);

  const rows = rowsOf<Record<string, any>>(result);
  if (rows.length === 0) return empty;

  return {
    series: rows.map((r) => ({
      day: String(r.day),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),
    revenue: Number(rows[0].total_revenue),
    orders: Number(rows[0].total_orders),
    previousRevenue: Number(rows[0].prev_revenue),
    previousOrders: Number(rows[0].prev_orders),
  };
});

// ---------------------------------------------------------------------------
// Top products by revenue in the range.
// ---------------------------------------------------------------------------

export type TopProduct = {
  productId: string;
  title: string;
  image: string | null;
  units: number;
  revenue: number;
};

export const getTopProducts = cache(
  async (range: HomeRange, locale: string, channel: HomeChannel = "all"): Promise<TopProduct[]> => {
    const sellerId = await getHomeSellerId();
    if (!sellerId) return [];

    const result = await db.execute(sql`
      SELECT
        oi.product_id,
        sum(oi.quantity)::int AS units,
        sum(oi.total)::float8 AS revenue,
        max(oi.product_name) AS product_name,
        (SELECT p.images->>0 FROM products p WHERE p.id = oi.product_id) AS image,
        (SELECT t.title FROM product_translations t
          WHERE t.product_id = oi.product_id
          ORDER BY (t.locale = ${locale}) DESC, (t.locale = 'ar') DESC
          LIMIT 1) AS title
      FROM order_items oi
      WHERE oi.seller_id = ${sellerId}
        AND oi.status NOT IN ${NON_REVENUE}
        AND coalesce(oi.is_refunded, false) = false
        AND oi.created_at >= (${rangeStartLocal(range)} AT TIME ZONE 'Africa/Cairo')
        ${channelFilter(channel)}
      GROUP BY oi.product_id
      ORDER BY revenue DESC
      LIMIT 4
    `);

    return rowsOf<Record<string, any>>(result).map((r) => ({
      productId: r.product_id,
      title: r.title ?? r.product_name,
      image: productImageUrl(r.image),
      units: Number(r.units),
      revenue: Number(r.revenue),
    }));
  }
);

// ---------------------------------------------------------------------------
// Recent orders (line items, newest first) — same shape the orders page uses.
// ---------------------------------------------------------------------------

export const getRecentOrders = cache(async (locale: string) => {
  const sellerId = await getHomeSellerId();
  if (!sellerId) return [];

  const rows = await db.query.orderItems.findMany({
    where: eq(orderItems.sellerId, sellerId),
    columns: {
      id: true,
      orderId: true,
      productName: true,
      quantity: true,
      total: true,
      status: true,
      createdAt: true,
    },
    with: {
      order: {
        columns: { id: true, orderNumber: true, status: true },
        with: {
          user: { columns: { email: true, fullName: true, isGuest: true } },
          shipments: { columns: { status: true } },
          userAddress_shippingAddressId: { columns: { fullName: true } },
        },
      },
      product: {
        columns: { id: true },
        with: { productTranslations: { columns: { locale: true, title: true } } },
      },
    },
    orderBy: [desc(orderItems.createdAt)],
    limit: 6,
  });

  // `product_name` is a snapshot in whatever language the product had when it
  // was ordered; show the title in the viewer's language when there is one.
  return rows.map(({ product, ...item }) => {
    const titles = product?.productTranslations ?? [];
    const title =
      titles.find((t) => t.locale === locale)?.title ??
      titles.find((t) => t.locale === "ar")?.title ??
      item.productName;
    return { ...item, productTitle: title };
  });
});

export type RecentOrder = Awaited<ReturnType<typeof getRecentOrders>>[number];

// ---------------------------------------------------------------------------
// Unanswered product questions.
// ---------------------------------------------------------------------------

export type HomeQuestion = {
  id: string;
  question: string;
  createdAt: string | null;
  productTitle: string;
  image: string | null;
};

export const getUnansweredQuestions = cache(async (locale: string): Promise<HomeQuestion[]> => {
  const sellerId = await getHomeSellerId();
  if (!sellerId) return [];

  const result = await db.execute(sql`
    SELECT
      q.id,
      q.question,
      q.created_at::text AS created_at,
      p.images->>0 AS image,
      (SELECT t.title FROM product_translations t
        WHERE t.product_id = p.id
        ORDER BY (t.locale = ${locale}) DESC, (t.locale = 'ar') DESC
        LIMIT 1) AS title
    FROM product_questions q
    JOIN products p ON p.id = q.product_id
    WHERE p.seller_id = ${sellerId} AND q.is_answered = false
    ORDER BY q.created_at DESC
    LIMIT 5
  `);

  return rowsOf<Record<string, any>>(result).map((r) => ({
    id: r.id,
    question: r.question,
    createdAt: r.created_at,
    productTitle: r.title ?? "",
    image: productImageUrl(r.image),
  }));
});
