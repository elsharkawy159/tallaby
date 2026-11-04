import { db, sql } from "@workspace/db";
import {
  cartVariantTitle,
  PENDING_CART_LINES_SHOWN,
  PENDING_CART_MAX_AGE_DAYS,
  pickProductTitle,
  resolvePendingCartContact,
  type PendingCartContact,
  type PendingCartsFilters,
} from "./pending-carts.lib";

/**
 * Orders › Pending carts (ROADMAP.md F-67). Every query takes the session
 * seller's id and an explicit store id, and joins `stores` on both (CLAUDE.md
 * rule 5), so a foreign store just returns nothing. Personal data: read fresh,
 * never cached or logged (rule 8).
 */

export type PendingCartLine = {
  /** In the dashboard's language; null when the product has no title. */
  title: string | null;
  /** In the store's language, for the WhatsApp message. */
  storeTitle: string | null;
  variant: string | null;
  quantity: number;
};

export type PendingCartRow = PendingCartContact & {
  id: string;
  itemCount: number;
  lineCount: number;
  /** Sum of the lines, 2 dp decimal string. */
  value: string;
  /** The cart's own currency. */
  currency: string;
  lastActivity: string;
  lines: PendingCartLine[];
};

export type PendingCartsPage = { carts: PendingCartRow[]; total: number; page: number; pages: number; size: number };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const str = (value: unknown) => (value == null ? null : String(value));

/**
 * The store's active carts with at least one line not saved for later, and
 * activity within the age limit. `carts.last_activity` isn't updated when a line
 * changes (it stays at the cart's creation), so the lines' own times count too.
 */
const pendingCartsFrom = (sellerId: string, storeId: string) => sql`
    FROM carts c
    JOIN stores st ON st.id = c.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
    JOIN LATERAL (
      SELECT SUM(ci.quantity)::int AS item_count,
             COUNT(*)::int AS line_count,
             SUM(ci.price * ci.quantity)::numeric(12, 2)::text AS value,
             GREATEST(MAX(ci.created_at), MAX(ci.updated_at)) AS touched
        FROM cart_items ci
       WHERE ci.cart_id = c.id AND ci.seller_id = ${sellerId} AND ci.saved_for_later IS NOT TRUE
      HAVING COUNT(*) > 0
    ) a ON TRUE
   WHERE c.store_id = ${storeId}
     AND c.status = 'active'
     AND GREATEST(c.created_at, c.updated_at, c.last_activity, a.touched) >= now() - make_interval(days => ${PENDING_CART_MAX_AGE_DAYS}::int)
`;

/** One page of rows; the contact and line lookups run only for these. */
const pendingCartsPageSql = (sellerId: string, storeId: string, limit: number, offset: number) => sql`
  SELECT p.id, p.item_count, p.line_count, p.value, p.currency,
         to_json(p.activity) #>> '{}' AS last_activity,
         u.is_guest, u.full_name AS user_name, u.phone AS user_phone, u.email AS user_email,
         lead.full_name AS lead_name, lead.phone AS lead_phone,
         lines.lines
    FROM (
      SELECT c.id, c.user_id, c.store_id, c.currency, st.default_locale, a.item_count, a.line_count, a.value,
             GREATEST(c.created_at, c.updated_at, c.last_activity, a.touched) AS activity
        ${pendingCartsFrom(sellerId, storeId)}
       ORDER BY activity DESC, c.id DESC
       LIMIT ${limit} OFFSET ${offset}
    ) p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN LATERAL (
      -- A checkout on this store only: this cart's first, then an open one, then the newest.
      SELECT l.full_name, l.phone
        FROM store_checkout_leads l
       WHERE l.store_id = p.store_id AND l.seller_id = ${sellerId}
         AND (l.cart_id = p.id OR l.user_id = p.user_id)
       ORDER BY (l.cart_id = p.id) IS TRUE DESC, l.order_id IS NULL DESC, l.updated_at DESC
       LIMIT 1
    ) lead ON TRUE
    CROSS JOIN LATERAL (
      SELECT json_agg(line) AS lines FROM (
        SELECT ci.quantity, ci.variant, p.default_locale AS store_locale,
               (SELECT jsonb_object_agg(pt.locale::text, pt.title)
                  FROM product_translations pt WHERE pt.product_id = ci.product_id) AS titles
          FROM cart_items ci
         WHERE ci.cart_id = p.id AND ci.seller_id = ${sellerId} AND ci.saved_for_later IS NOT TRUE
         ORDER BY ci.created_at DESC NULLS LAST, ci.id
         LIMIT ${PENDING_CART_LINES_SHOWN}
      ) line
    ) lines
   ORDER BY p.activity DESC, p.id DESC
`;

type RawLine = { quantity: number; variant: unknown; store_locale: string | null; titles: Record<string, string> | null };

/** One page of the store's pending carts, newest activity first. */
export async function listStorePendingCarts(
  sellerId: string,
  storeId: string,
  filters: PendingCartsFilters,
  locale: string,
): Promise<PendingCartsPage> {
  const empty = { carts: [], total: 0, page: 1, pages: 1, size: filters.size };
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return empty;

  const [count] = rowsOf(
    await db.execute(sql`SELECT COUNT(*)::int AS total ${pendingCartsFrom(sellerId, storeId)}`),
  );
  const total = Number(count?.total ?? 0);
  if (total === 0) return empty;

  const pages = Math.max(Math.ceil(total / filters.size), 1);
  const page = Math.min(filters.page, pages);
  const rows = rowsOf(await db.execute(pendingCartsPageSql(sellerId, storeId, filters.size, (page - 1) * filters.size)));

  return {
    total,
    page,
    pages,
    size: filters.size,
    carts: rows.map((r) => ({
      id: String(r.id),
      itemCount: Number(r.item_count),
      lineCount: Number(r.line_count),
      value: String(r.value ?? "0"),
      currency: str(r.currency) ?? "EGP",
      lastActivity: String(r.last_activity),
      lines: ((r.lines as RawLine[] | null) ?? []).map((line) => {
        const title = pickProductTitle(line.titles, locale);
        return {
          title,
          storeTitle: pickProductTitle(line.titles, line.store_locale === "en" ? "en" : "ar"),
          variant: cartVariantTitle(line.variant, title),
          quantity: Number(line.quantity),
        };
      }),
      ...resolvePendingCartContact({
        isGuest: r.is_guest === true,
        userName: str(r.user_name),
        userPhone: str(r.user_phone),
        userEmail: str(r.user_email),
        leadName: str(r.lead_name),
        leadPhone: str(r.lead_phone),
      }),
    })),
  };
}
