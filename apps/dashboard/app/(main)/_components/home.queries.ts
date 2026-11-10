import { cache } from "react";
import { db, orderItems, products } from "@workspace/db";
import { desc, eq, sql, type SQL } from "drizzle-orm";
import { productInStore } from "@workspace/lib/stores/scope/server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { getSessionUser } from "@/lib/auth/session.server";
import type { HomeChannel, HomeRange } from "./home.shared";
import type { SetupFlags } from "./setup-checklist.lib";
import type { FeeTrialFields } from "@workspace/lib/sellers";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getHomeTraffic } from "@/lib/analytics/home-traffic.server";
import { MIXED_CURRENCIES, splitHeadline } from "@/lib/i18n/format";
import { loadAccountMoney, loadStoreMoney } from "@/lib/stores/account-money.server";
import { countOrdersAwaitingPrep } from "../orders/orders-list.query";

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
export const LOW_STOCK_THRESHOLD = 10;

const rowsOf = <T,>(result: unknown): T[] =>
  (Array.isArray(result) ? result : ((result as { rows?: T[] }).rows ?? [])) as T[];

/** Signed-in seller id; the (main) layout already gated access. */
export const getHomeSellerId = async (): Promise<string | null> => (await getSessionUser())?.id ?? null;

/** Public URL for a `products` bucket path; full URLs pass through. */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

/**
 * "Product `p` is in this store" for the raw SQL below (F-87c): the shared
 * `productInStore` condition, scope `managed` (before the split: the store's
 * seller, so the same rows as `p.seller_id = s.id`), on the bare `products`
 * table it renders for. No store (a seller without one): no filter, the
 * account as before. `storeId` is only ever one of the session seller's stores
 * (getSellerStores, or a caller that checked it).
 */
async function productScopeSql(storeId: string | null): Promise<SQL> {
  if (!storeId) return sql``;
  const inStore = productInStore(storeId, { catalogSplit: await isSwitchOn("stores_catalog_split"), scope: "managed" });
  return sql` AND EXISTS (SELECT 1 FROM ${products} WHERE ${products.id} = p.id AND ${inStore})`;
}

/** The setup flags, for `sellers s LEFT JOIN stores st` with st limited to this seller. */
const setupFlagColumns = (productScope: SQL) => sql`
      EXISTS (SELECT 1 FROM products p WHERE p.seller_id = s.id AND p.status = 'active'${productScope}) AS setup_product,
      -- st is already limited to this seller (join below), so st.id scopes the child rows.
      -- Same rule as storeTemplateChosen (@workspace/lib): the Classic placeholder drafts are not a choice.
      coalesce(st.first_published_at IS NOT NULL OR st.site_status IN ('published', 'unpublished')
        OR EXISTS (SELECT 1 FROM template_installs ti WHERE ti.store_id = st.id AND ti.undone_at IS NULL), false) AS setup_template,
      -- Brand identity: a logo, or the design system saved after the latest template install
      -- (an install rewrites the design system in the same transaction, so it is not "after").
      coalesce(nullif(st.logo_url, '') IS NOT NULL
        OR EXISTS (SELECT 1 FROM store_design_systems ds WHERE ds.store_id = st.id
          AND ds.updated_at > (SELECT max(ti.installed_at) FROM template_installs ti
            WHERE ti.store_id = st.id AND ti.undone_at IS NULL)), false) AS setup_brand,
      coalesce(st.settings ? 'shipping'
        OR EXISTS (SELECT 1 FROM store_shipping_zones z WHERE z.store_id = st.id), false) AS setup_shipping,
      -- settings.payments is written only by the seller's own save (Store settings › Payment methods);
      -- a new store has none and checkout falls back to the defaults. A connected card gateway counts too.
      coalesce(st.settings ? 'payments'
        OR EXISTS (SELECT 1 FROM store_integrations si WHERE si.store_id = st.id AND si.seller_id = s.id
          AND si.provider IN ('paymob', 'kashier') AND si.status = 'connected'), false) AS setup_payments,
      coalesce(st.site_status = 'published', false) AS setup_publish
`;

const toSetupFlags = (row: Record<string, unknown>): SetupFlags => ({
  template: Boolean(row.setup_template),
  brand: Boolean(row.setup_brand),
  product: Boolean(row.setup_product),
  publish: Boolean(row.setup_publish),
  shipping: Boolean(row.setup_shipping),
  payments: Boolean(row.setup_payments),
});

// ---------------------------------------------------------------------------
// Snapshot: profile, setup progress and open tasks in one round-trip.
// ---------------------------------------------------------------------------

export type HomeSnapshot = {
  displayName: string;
  /** Hour of day in Cairo, for the greeting. */
  localHour: number;
  walletBalance: number;
  /** The wallet's currency, or what a new wallet would open in (0136). */
  walletCurrency: string;
  storeRating: number | null;
  positiveRatingPercent: number | null;
  totalRatings: number;
  /** Setup flags for the store selected in the sidebar (setup-checklist.lib.ts). */
  setup: SetupFlags;
  setupStoreId: string | null;
  /** Platform fee trial (0059), for the trial banner. */
  feeTrial: FeeTrialFields;
  hasOrders: boolean;
  /** Any order that isn't a store-owner test order (0155), across every store: the home keeps its metrics. */
  hasRealOrders: boolean;
  attention: {
    lowStock: number;
    unansweredQuestions: number;
    newReviews: number;
  };
};

/** The setup flags alone, plus the saved prompt progress (setup-prompts.lib.ts): one light read. */
export async function getSetupPromptRow(
  sellerId: string,
  storeId: string | null,
): Promise<{ flags: SetupFlags; state: unknown } | null> {
  const productScope = await productScopeSql(storeId);
  const result = await db.execute(sql`
    SELECT
      s.seller_metrics -> 'setupPrompts' AS setup_prompts,
      ${setupFlagColumns(productScope)}
    FROM sellers s
    LEFT JOIN stores st ON st.id = ${storeId}::uuid AND st.seller_id = s.id
    WHERE s.id = ${sellerId}
  `);
  const row = rowsOf<Record<string, unknown>>(result)[0];
  return row ? { flags: toSetupFlags(row), state: row.setup_prompts } : null;
}

export const getHomeSnapshot = cache(async (): Promise<HomeSnapshot | null> => {
  const sellerId = await getHomeSellerId();
  if (!sellerId) return null;
  const { selected } = await getSellerStores();
  // Only ever one of this seller's stores (getSellerStores ignores foreign ids).
  const storeId = selected?.id ?? null;
  // Product counts (setup, low stock, questions) are the selected store's, like the Products link (F-87c).
  const productScope = await productScopeSql(storeId);

  const result = await db.execute(sql`
    SELECT
      s.display_name,
      extract(hour FROM now() AT TIME ZONE 'Africa/Cairo')::int AS local_hour,
      coalesce(s.wallet_balance, 0)::float8 AS wallet_balance,
      coalesce((SELECT w.currency FROM seller_wallet w WHERE w.seller_id = s.id), billing_wallet_currency()) AS wallet_currency,
      s.store_rating::float8 AS store_rating,
      s.positive_rating_percent::float8 AS positive_rating_percent,
      coalesce(s.total_ratings, 0)::int AS total_ratings,
      s.fee_trial_eligible,
      s.fee_trial_started_at,
      s.fee_trial_ends_at,
      ${setupFlagColumns(productScope)},
      EXISTS (SELECT 1 FROM order_items oi WHERE oi.seller_id = s.id) AS has_orders,
      EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.seller_id = s.id AND NOT o.is_test) AS has_real_orders,
      (SELECT count(*)::int FROM products p
        WHERE p.seller_id = s.id AND p.status = 'active' AND p.track_stock AND p.quantity < ${LOW_STOCK_THRESHOLD}${productScope}) AS low_stock,
      (SELECT count(*)::int FROM product_questions q JOIN products p ON p.id = q.product_id
        WHERE p.seller_id = s.id AND q.is_answered = false${productScope}) AS unanswered_questions,
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
    walletCurrency: String(row.wallet_currency),
    storeRating: row.store_rating == null ? null : Number(row.store_rating),
    positiveRatingPercent:
      row.positive_rating_percent == null ? null : Number(row.positive_rating_percent),
    totalRatings: Number(row.total_ratings),
    setup: toSetupFlags(row),
    setupStoreId: storeId,
    feeTrial: {
      feeTrialEligible: Boolean(row.fee_trial_eligible),
      feeTrialStartedAt: row.fee_trial_started_at ?? null,
      feeTrialEndsAt: row.fee_trial_ends_at ?? null,
    },
    hasOrders: Boolean(row.has_orders),
    hasRealOrders: Boolean(row.has_real_orders),
    attention: {
      lowStock: Number(row.low_stock),
      unansweredQuestions: Number(row.unanswered_questions),
      newReviews: Number(row.new_reviews),
    },
  };
});

/** Orders still to prepare in the channel, counted like the Orders page (isAwaitingPrep). */
export const getPendingOrdersCount = cache(async (channel: HomeChannel): Promise<number> => {
  const sellerId = await getHomeSellerId();
  return sellerId ? countOrdersAwaitingPrep(sellerId, channel) : 0;
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
  /** The currency revenue, series and previousRevenue are in. Orders count every currency. */
  currency: string;
  /** Orders in `currency`, for the average order. */
  currencyOrders: number;
  /** Other currencies' totals for the range. Never added to `revenue`. */
  otherTotals: { currency: string; total: number }[];
};

/**
 * Restricts order items to a sales channel (PLAN.md P3-04). The channel was
 * already checked against the seller's own stores (resolveHomeChannel); the
 * store id is a bound parameter.
 */
function channelFilter(channel: HomeChannel) {
  return sql`${channelOnly(channel)} ${NOT_TEST_ORDER}`;
}

/** Test orders (0155, ROADMAP.md F-76) never count in the home figures. */
const NOT_TEST_ORDER = sql`AND NOT EXISTS (SELECT 1 FROM orders t WHERE t.id = oi.order_id AND t.is_test)`;

function channelOnly(channel: HomeChannel) {
  if (channel === "all") return sql``;
  if (channel === "marketplace") {
    return sql`AND EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.order_id AND o.store_id IS NULL)`;
  }
  return sql`AND EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.order_id AND o.store_id = ${channel}::uuid)`;
}

export const getSalesOverview = cache(async (range: HomeRange, channel: HomeChannel = "all"): Promise<SalesOverview> => {
  const sellerId = await getHomeSellerId();
  const empty = { series: [], revenue: 0, orders: 0, previousRevenue: 0, previousOrders: 0, currency: "EGP", currencyOrders: 0, otherTotals: [] };
  if (!sellerId) return empty;

  // A store leads with its own currency, the others with EGP. Revenue is only ever summed within one.
  const [{ unit: accountUnit }, storeMoney] = await Promise.all([loadAccountMoney(sellerId), loadStoreMoney(sellerId)]);
  const totalsResult = await db.execute(sql`
    SELECT coalesce(o.currency, 'EGP') AS currency, sum(oi.total)::float8 AS total
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.seller_id = ${sellerId}
      AND oi.status NOT IN ${NON_REVENUE}
      AND coalesce(oi.is_refunded, false) = false
      AND oi.created_at >= (${rangeStartLocal(range)} AT TIME ZONE 'Africa/Cairo')
      ${channelFilter(channel)}
    GROUP BY 1
  `);
  const totals = rowsOf<{ currency: string; total: number }>(totalsResult).map((r) => ({ currency: String(r.currency), total: Number(r.total) }));
  const headline = splitHeadline(totals, {
    preferred: storeMoney[channel]?.currency,
    fallback: channel === "marketplace" || accountUnit.currency === MIXED_CURRENCIES ? "EGP" : accountUnit.currency,
  });
  const inCurrency = sql`i.currency = ${headline.currency}`;

  const result = await db.execute(sql`
    WITH bounds AS (SELECT ${rangeStartLocal(range)} AS start_local),
    days AS (
      SELECT generate_series(b.start_local, b.start_local + make_interval(days => ${range - 1}::int), interval '1 day')::date AS day
      FROM bounds b
    ),
    items AS (
      SELECT (oi.created_at AT TIME ZONE 'Africa/Cairo')::date AS day, oi.order_id, oi.total,
        coalesce((SELECT o.currency FROM orders o WHERE o.id = oi.order_id), 'EGP') AS currency
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
      coalesce(sum(c.total) FILTER (WHERE c.currency = ${headline.currency}), 0)::float8 AS revenue,
      count(DISTINCT c.order_id)::int AS orders,
      (SELECT coalesce(sum(i.total), 0)::float8 FROM cur i WHERE ${inCurrency}) AS total_revenue,
      (SELECT count(DISTINCT order_id)::int FROM cur) AS total_orders,
      (SELECT count(DISTINCT i.order_id)::int FROM cur i WHERE ${inCurrency}) AS currency_orders,
      (SELECT coalesce(sum(i.total), 0)::float8 FROM prev i WHERE ${inCurrency}) AS prev_revenue,
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
    currency: headline.currency,
    currencyOrders: Number(rows[0].currency_orders),
    otherTotals: headline.others,
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
    // Ranked in the currency the sales card leads with: no product's revenue adds two currencies.
    const { currency } = await getSalesOverview(range, channel);

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
        AND EXISTS (SELECT 1 FROM orders o WHERE o.id = oi.order_id AND coalesce(o.currency, 'EGP') = ${currency})
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
        columns: { id: true, orderNumber: true, status: true, currency: true },
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

/** The selected store's unanswered questions (F-87c; no store = the account). */
export const getUnansweredQuestions = cache(async (locale: string): Promise<HomeQuestion[]> => {
  const sellerId = await getHomeSellerId();
  if (!sellerId) return [];
  const { selected } = await getSellerStores();
  const productScope = await productScopeSql(selected?.id ?? null);

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
    WHERE p.seller_id = ${sellerId} AND q.is_answered = false${productScope}
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

// ---------------------------------------------------------------------------
// Store-website traffic (GA4), customer journey and new customers.
// ---------------------------------------------------------------------------

/**
 * The seller's stores a home channel covers: every store for "all", none for
 * "marketplace", or the one store (already checked by resolveHomeChannel).
 */
export const getHomeChannelStores = cache(async (channel: HomeChannel) => {
  const { stores, selected } = await getSellerStores();
  const live = stores.filter((s) => s.status !== "archived");
  const ids =
    channel === "all" ? live.map((s) => s.id) : channel === "marketplace" ? [] : live.filter((s) => s.id === channel).map((s) => s.id);
  // Where "Store views" opens: the channel's store, else the sidebar's.
  const analyticsStoreId = channel !== "all" && channel !== "marketplace" ? channel : (selected?.id ?? null);
  return { storeIds: ids, analyticsStoreId };
});

export const getHomeTrafficFor = cache(async (range: HomeRange, channel: HomeChannel) => {
  const [sellerId, { storeIds }] = await Promise.all([getHomeSellerId(), getHomeChannelStores(channel)]);
  if (!sellerId) return null;
  return getHomeTraffic(sellerId, storeIds, range);
});

const idList = (ids: string[]) => sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `);

export type StoreFunnel = {
  /** Store carts that got an item in the range (or turned into an order in it). */
  carts: number;
  orders: number;
  previousOrders: number;
};

/** Carts and orders of the seller's store websites, for the customer journey and conversion. */
export const getStoreFunnel = cache(async (range: HomeRange, channel: HomeChannel): Promise<StoreFunnel> => {
  const [sellerId, { storeIds }] = await Promise.all([getHomeSellerId(), getHomeChannelStores(channel)]);
  const empty = { carts: 0, orders: 0, previousOrders: 0 };
  if (!sellerId || storeIds.length === 0) return empty;

  const result = await db.execute(sql`
    WITH bounds AS (SELECT ${rangeStartLocal(range)} AS start_local),
    items AS (
      SELECT DISTINCT (oi.created_at AT TIME ZONE 'Africa/Cairo')::date AS day, oi.order_id
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id, bounds b
      WHERE oi.seller_id = ${sellerId}
        AND o.store_id IN (${idList(storeIds)})
        AND NOT o.is_test
        AND oi.status NOT IN ${NON_REVENUE}
        AND coalesce(oi.is_refunded, false) = false
        AND oi.created_at >= ((b.start_local - make_interval(days => ${range}::int)) AT TIME ZONE 'Africa/Cairo')
    )
    SELECT
      (SELECT count(DISTINCT x.order_id)::int FROM items x, bounds b WHERE x.day >= b.start_local::date) AS total_orders,
      (SELECT count(DISTINCT x.order_id)::int FROM items x, bounds b WHERE x.day < b.start_local::date) AS prev_orders,
      (SELECT count(*)::int FROM carts c, bounds b
        WHERE c.store_id IN (${idList(storeIds)})
          AND (
            (c.status = 'completed' AND c.updated_at >= (b.start_local AT TIME ZONE 'Africa/Cairo'))
            OR EXISTS (SELECT 1 FROM cart_items ci
              WHERE ci.cart_id = c.id AND ci.created_at >= (b.start_local AT TIME ZONE 'Africa/Cairo'))
          )) AS carts
  `);

  const row = rowsOf<Record<string, any>>(result)[0];
  if (!row) return empty;
  return {
    carts: Number(row.carts),
    orders: Number(row.total_orders),
    previousOrders: Number(row.prev_orders),
  };
});

/** Customers whose first order from this seller (in the channel) falls in the range. */
export const getNewCustomers = cache(async (range: HomeRange, channel: HomeChannel = "all"): Promise<number> => {
  const sellerId = await getHomeSellerId();
  if (!sellerId) return 0;
  const result = await db.execute(sql`
    SELECT count(*)::int AS n FROM (
      SELECT o.user_id, min(oi.created_at) AS first_at
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.seller_id = ${sellerId}
        AND oi.status NOT IN ${NON_REVENUE}
        ${channelFilter(channel)}
      GROUP BY o.user_id
    ) f
    WHERE f.first_at >= (${rangeStartLocal(range)} AT TIME ZONE 'Africa/Cairo')
  `);
  return Number(rowsOf<{ n: number }>(result)[0]?.n ?? 0);
});
