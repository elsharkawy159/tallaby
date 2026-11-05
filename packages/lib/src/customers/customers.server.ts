import { type SQL } from "drizzle-orm";
import { db, sql } from "@workspace/db";
import {
  aggregateStoreCustomers,
  computeOrderRisks,
  customerKey,
  customerPhone,
  customerSearchDigits,
  normalizeCustomerNote,
  parseCustomerKey,
  parseCustomerTags,
  type CustomerNote,
  type CustomerOrderRow,
  type CustomersListFilters,
  type OrderRisk,
  type StoreCustomer,
} from "./customers.lib";

/**
 * Store customers (ROADMAP.md F-01a) and order risk (F-02d). Server-only.
 * Phones and addresses are personal data: never logged, never cached, only
 * returned to the store's own seller. Every query takes the session's
 * sellerId and joins `stores` on it (CLAUDE.md rule 5), so a foreign storeId
 * just returns nothing.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Newest store orders read per request; older ones are left out of the counts. */
export const CUSTOMER_ORDERS_MAX = 5000;

const str = (value: unknown) => (value == null ? null : String(value));

/** Orders of this seller's (not deleted) stores matching `where`, newest first. */
async function queryOrderRows(sellerId: string, where: SQL, q: Queryable, limit = CUSTOMER_ORDERS_MAX): Promise<CustomerOrderRow[]> {
  if (!UUID_RE.test(sellerId)) return [];
  const rows = rowsOf(
    await q.execute(sql`
      SELECT o.id, o.order_number, o.store_id, o.user_id, o.created_at::text AS created_at,
             o.status::text AS status, o.total_amount::text AS total_amount, o.payment_method,
             a.full_name AS address_name, a.phone AS address_phone, a.state AS governorate, a.city,
             u.full_name AS user_name, u.phone AS user_phone,
             CASE WHEN u.is_guest THEN NULL ELSE u.email END AS email,
             EXISTS (SELECT 1 FROM shipments sh
                      WHERE sh.order_id = o.id AND sh.status IN ('failed', 'returned')) AS shipment_refused
        FROM orders o
        JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
        LEFT JOIN user_addresses a ON a.id = o.shipping_address_id
        LEFT JOIN users u ON u.id = o.user_id
       WHERE ${where}
       ORDER BY o.created_at DESC
       LIMIT ${Math.min(Math.max(limit, 1), CUSTOMER_ORDERS_MAX)}
    `),
  );

  return rows.map((r) => ({
    orderId: String(r.id),
    orderNumber: String(r.order_number),
    storeId: String(r.store_id),
    userId: String(r.user_id),
    createdAt: String(r.created_at),
    status: str(r.status),
    totalAmount: String(r.total_amount ?? "0"),
    paymentMethod: String(r.payment_method ?? "cash"),
    addressName: str(r.address_name),
    addressPhone: str(r.address_phone),
    governorate: str(r.governorate),
    city: str(r.city),
    userName: str(r.user_name),
    userPhone: str(r.user_phone),
    email: str(r.email),
    shipmentRefused: r.shipment_refused === true,
  }));
}

/** The store's orders (newest first), only when the store is this seller's and not deleted. */
function loadStoreOrderRows(sellerId: string, storeId: string, q: Queryable): Promise<CustomerOrderRow[]> {
  if (!UUID_RE.test(storeId)) return Promise.resolve([]);
  return queryOrderRows(sellerId, sql`o.store_id = ${storeId}`, q);
}

/* ---------- The grouping of customers.lib.ts, in SQL (ROADMAP.md F-43e). ---------- */

// JS trim() whitespace that shows up in real data.
const WS = String.raw`E' \t\n\r\f\u000B '`;
const trimmedSql = (col: string) => `NULLIF(btrim(${col}, ${WS}), '')`;

/** normalizeEgyptianMobile(): every spelling of an Egyptian mobile becomes 01XXXXXXXXX, else NULL. */
const mobileSql = (col: string) => `(
  SELECT CASE WHEN s2 ~ '^01[0125][0-9]{8}$' THEN s2 END FROM (
    SELECT CASE WHEN length(s1) = 10 AND s1 LIKE '1%' THEN '0' || s1 ELSE s1 END AS s2 FROM (
      SELECT CASE WHEN d LIKE '0020%' THEN substr(d, 5)
                  WHEN d LIKE '20%' AND length(d) = 12 THEN substr(d, 3)
                  ELSE d END AS s1 FROM (
        SELECT regexp_replace(translate(${col}, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'), '[^0-9]', '', 'g') AS d
      ) p0
    ) p1
  ) p2
)`;

/** The ASCII digits typed, when there are at least 6. As in customerPhone(), Arabic digits don't count here. */
const typedDigitsSql = (col: string) => `(
  SELECT CASE WHEN length(d) >= 6 THEN d END FROM (SELECT regexp_replace(${col}, '[^0-9]', '', 'g') AS d) p0
)`;

/** customerPhone(), over `user_addresses a` and `users u`. */
const CUSTOMER_PHONE_SQL = sql.raw(
  `COALESCE(${mobileSql("a.phone")}, ${typedDigitsSql("a.phone")}, ${mobileSql("u.phone")}, ${typedDigitsSql("u.phone")})`,
);

const realNameSql = (col: string) => `NULLIF(${trimmedSql(col)}, 'Guest User')`;

/** One row per customer of the store: the CTEs every list query starts from. */
const customersCte = (sellerId: string, storeId: string) => sql`
  WITH order_rows AS (
    SELECT o.user_id, o.created_at, o.total_amount, o.status::text AS status,
           ${CUSTOMER_PHONE_SQL} AS phone,
           COALESCE(${sql.raw(realNameSql("a.full_name"))}, ${sql.raw(realNameSql("u.full_name"))}) AS name,
           CASE WHEN u.is_guest OR u.email LIKE '%@temp.local%' THEN NULL ELSE ${sql.raw(trimmedSql("u.email"))} END AS email,
           ${sql.raw(trimmedSql("a.state"))} AS governorate,
           ${sql.raw(trimmedSql("a.city"))} AS city,
           EXISTS (SELECT 1 FROM shipments sh
                    WHERE sh.order_id = o.id AND sh.status IN ('failed', 'returned')) AS shipment_refused
      FROM orders o
      JOIN stores st ON st.id = o.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
      LEFT JOIN user_addresses a ON a.id = o.shipping_address_id
      LEFT JOIN users u ON u.id = o.user_id
     WHERE o.store_id = ${storeId}
  ),
  keyed AS (
    SELECT order_rows.*,
           COALESCE('p:' || phone, 'u:' || user_id::text) AS key,
           CASE WHEN status = 'delivered' THEN 'delivered'
                WHEN status = 'returned' OR shipment_refused THEN 'refused'
                WHEN status IN ('cancelled', 'refunded', 'refund_requested') THEN 'cancelled'
                ELSE 'open' END AS outcome
      FROM order_rows
  ),
  customers AS (
    SELECT key,
           max(phone) AS phone,
           (array_agg(user_id ORDER BY created_at DESC))[1]::text AS user_id,
           COALESCE((array_agg(name ORDER BY created_at DESC) FILTER (WHERE name IS NOT NULL))[1], '') AS name,
           (array_agg(email ORDER BY created_at DESC) FILTER (WHERE email IS NOT NULL))[1] AS email,
           (array_agg(governorate ORDER BY created_at DESC) FILTER (WHERE governorate IS NOT NULL))[1] AS governorate,
           (array_agg(city ORDER BY created_at DESC) FILTER (WHERE city IS NOT NULL))[1] AS city,
           count(*)::int AS order_count,
           (count(*) FILTER (WHERE outcome = 'delivered'))::int AS delivered_count,
           (count(*) FILTER (WHERE outcome = 'refused'))::int AS refused_count,
           (count(*) FILTER (WHERE outcome = 'cancelled'))::int AS cancelled_count,
           COALESCE(sum(total_amount) FILTER (WHERE outcome IN ('delivered', 'open')), 0)::numeric(14, 2)::text AS spent,
           min(created_at)::text AS first_at,
           max(created_at)::text AS last_at,
           max(created_at) AS last_ts,
           COALESCE(sum(total_amount) FILTER (WHERE outcome IN ('delivered', 'open')), 0) AS spent_sort
      FROM keyed
     GROUP BY key
  )`;

const customersFrom = (storeId: string) => sql`
  FROM customers c
  LEFT JOIN store_customer_notes n ON n.store_id = ${storeId} AND n.customer_key = c.key`;

type CustomersQuery = Pick<CustomersListFilters, "q" | "filter" | "sort" | "tag">;

const escapeLike = (text: string) => `%${text.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

/** selectStoreCustomers() plus the seller's own notes and tags, in SQL. */
function customersWhere(filters: CustomersQuery): SQL {
  const parts: SQL[] = [];
  const text = filters.q.trim();
  if (text) {
    const pattern = escapeLike(text);
    const digits = customerSearchDigits(text);
    parts.push(sql`(
      c.name ILIKE ${pattern}
      OR COALESCE(c.email, '') ILIKE ${pattern}
      OR COALESCE(n.note, '') ILIKE ${pattern}
      OR EXISTS (SELECT 1 FROM unnest(n.tags) AS t WHERE t ILIKE ${pattern})
      ${digits.length >= 3 ? sql`OR COALESCE(c.phone, '') LIKE ${escapeLike(digits)}` : sql``}
    )`);
  }
  if (filters.filter === "repeat") parts.push(sql`c.order_count >= 2`);
  if (filters.filter === "refused") parts.push(sql`c.refused_count > 0`);
  if (filters.tag) {
    parts.push(sql`EXISTS (SELECT 1 FROM unnest(n.tags) AS t WHERE lower(t) = lower(${filters.tag}))`);
  }
  return parts.length ? sql.join(parts, sql` AND `) : sql`TRUE`;
}

function customersOrder(sort: CustomersQuery["sort"]): SQL {
  // The key keeps paging stable when times repeat.
  const recent = sql`c.last_ts DESC, c.key`;
  if (sort === "orders") return sql`c.order_count DESC, ${recent}`;
  if (sort === "spent") return sql`c.spent_sort DESC, ${recent}`;
  return recent;
}

function toStoreCustomer(r: Record<string, unknown>, storeId: string): StoreCustomer {
  const delivered = Number(r.delivered_count);
  const refused = Number(r.refused_count);
  const ended = delivered + refused;
  return {
    key: String(r.key),
    storeId,
    phone: str(r.phone),
    userId: String(r.user_id),
    name: String(r.name ?? ""),
    email: str(r.email),
    governorate: str(r.governorate),
    city: str(r.city),
    orderCount: Number(r.order_count),
    deliveredCount: delivered,
    refusedCount: refused,
    cancelledCount: Number(r.cancelled_count),
    totalSpent: String(r.spent),
    firstOrderAt: String(r.first_at),
    lastOrderAt: String(r.last_at),
    successRate: ended > 0 ? Math.round((delivered / ended) * 100) : null,
  };
}

const isListable = (sellerId: string, storeId: string) => UUID_RE.test(sellerId) && UUID_RE.test(storeId);

/** Every customer matching the filters (no paging): the .xlsx export. */
export async function listFilteredStoreCustomers(
  sellerId: string,
  storeId: string,
  filters: CustomersQuery,
  q: Queryable = db,
): Promise<StoreCustomer[]> {
  if (!isListable(sellerId, storeId)) return [];
  const rows = rowsOf(
    await q.execute(sql`
      ${customersCte(sellerId, storeId)}
      SELECT c.*
      ${customersFrom(storeId)}
      WHERE ${customersWhere(filters)}
      ORDER BY ${customersOrder(filters.sort)}
    `),
  );
  return rows.map((r) => toStoreCustomer(r, storeId));
}

/**
 * One page of the store's customers, grouped in SQL so nothing but this page
 * leaves the database, with no cut-off on how many orders are counted. The
 * stats ignore the filters, as the Customers page always has.
 */
export async function listStoreCustomersPage(
  sellerId: string,
  storeId: string,
  filters: CustomersListFilters,
  q: Queryable = db,
): Promise<{
  customers: StoreCustomer[];
  stats: { customers: number; repeat: number; refused: number };
  matched: number;
  page: number;
  pages: number;
}> {
  if (!isListable(sellerId, storeId)) {
    return { customers: [], stats: { customers: 0, repeat: 0, refused: 0 }, matched: 0, page: 1, pages: 1 };
  }

  const [stats] = rowsOf(
    await q.execute(sql`
      ${customersCte(sellerId, storeId)}
      SELECT count(*)::int AS customers,
             (count(*) FILTER (WHERE c.order_count >= 2))::int AS repeat_customers,
             (count(*) FILTER (WHERE c.refused_count > 0))::int AS refused_customers,
             (count(*) FILTER (WHERE ${customersWhere(filters)}))::int AS matched
      ${customersFrom(storeId)}
    `),
  );
  const matched = Number(stats?.matched ?? 0);
  const pages = Math.max(1, Math.ceil(matched / filters.size));
  // A filter change or an old link can point past the end.
  const page = Math.min(filters.page, pages);
  const rows = matched
    ? rowsOf(
        await q.execute(sql`
          ${customersCte(sellerId, storeId)}
          SELECT c.*
          ${customersFrom(storeId)}
          WHERE ${customersWhere(filters)}
          ORDER BY ${customersOrder(filters.sort)}
          LIMIT ${filters.size} OFFSET ${(page - 1) * filters.size}
        `),
      )
    : [];

  return {
    customers: rows.map((r) => toStoreCustomer(r, storeId)),
    stats: {
      customers: Number(stats?.customers ?? 0),
      repeat: Number(stats?.repeat_customers ?? 0),
      refused: Number(stats?.refused_customers ?? 0),
    },
    matched,
    page,
    pages,
  };
}

/**
 * One row per customer of the seller's store, most recent buyer first. Reads
 * the newest CUSTOMER_ORDERS_MAX orders: audiences and email campaigns use it.
 * The Customers page uses listStoreCustomersPage.
 */
export async function listStoreCustomers(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<StoreCustomer[]> {
  return aggregateStoreCustomers(await loadStoreOrderRows(sellerId, storeId, q));
}

/**
 * One customer of the seller's store and their orders, newest first, for the
 * customer drawer. Null when the key matches no order of this store.
 */
export async function getStoreCustomer(
  sellerId: string,
  storeId: string,
  key: string,
  q: Queryable = db,
): Promise<{ customer: StoreCustomer; orders: CustomerOrderRow[] } | null> {
  const parsed = parseCustomerKey(key);
  if (!parsed || !UUID_RE.test(storeId)) return null;
  // Only this customer's rows leave the database. The key check in code stays the rule.
  const rows = await queryOrderRows(
    sellerId,
    "phone" in parsed
      ? sql`o.store_id = ${storeId} AND ${CUSTOMER_PHONE_SQL} = ${parsed.phone}`
      : sql`o.store_id = ${storeId} AND ${CUSTOMER_PHONE_SQL} IS NULL AND o.user_id = ${parsed.userId}`,
    q,
  );
  const orders = rows.filter((row) => customerKey(row) === key);
  const [customer] = aggregateStoreCustomers(orders);
  return customer ? { customer, orders } : null;
}

/** Notes and tags of the seller's store customers (0121, F-01c), by customer key. */
export async function listStoreCustomerNotes(
  sellerId: string,
  storeId: string,
  q: Queryable = db,
): Promise<Map<string, CustomerNote>> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return new Map();
  const rows = rowsOf(
    await q.execute(sql`
      SELECT n.customer_key, n.note, n.tags
        FROM store_customer_notes n
        JOIN stores st ON st.id = n.store_id AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
       WHERE n.store_id = ${storeId}
    `),
  );
  return new Map(
    rows.map((r) => [
      String(r.customer_key),
      { note: str(r.note), tags: parseCustomerTags(r.tags) },
    ]),
  );
}

/**
 * Saves (or, when both are empty, deletes) the note and tags of one customer
 * of the seller's store. False when the store is not this seller's or the key
 * is malformed. The caller checked the store with requireStore as well.
 */
export async function saveStoreCustomerNote(
  sellerId: string,
  input: { storeId: string; key: string; note?: unknown; tags?: unknown; userId: string },
  q: Queryable = db,
): Promise<{ saved: boolean; value: CustomerNote }> {
  const value = normalizeCustomerNote(input);
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(input.storeId) || !parseCustomerKey(input.key)) {
    return { saved: false, value };
  }

  if (!value.note && value.tags.length === 0) {
    await q.execute(sql`
      DELETE FROM store_customer_notes n
       USING stores st
       WHERE n.store_id = ${input.storeId} AND n.customer_key = ${input.key}
         AND st.id = n.store_id AND st.seller_id = ${sellerId}
    `);
    const owned = rowsOf(
      await q.execute(sql`SELECT 1 FROM stores WHERE id = ${input.storeId} AND seller_id = ${sellerId} AND deleted_at IS NULL`),
    );
    return { saved: owned.length === 1, value };
  }

  const tags = sql`ARRAY[${sql.join(value.tags.map((t) => sql`${t}`), sql`, `)}]::text[]`;
  const rows = rowsOf(
    await q.execute(sql`
      INSERT INTO store_customer_notes (store_id, customer_key, note, tags, updated_by)
      SELECT st.id, ${input.key}, ${value.note}, ${value.tags.length ? tags : sql`'{}'::text[]`}, ${UUID_RE.test(input.userId) ? input.userId : null}
        FROM stores st
       WHERE st.id = ${input.storeId} AND st.seller_id = ${sellerId} AND st.deleted_at IS NULL
      ON CONFLICT (store_id, customer_key) DO UPDATE SET
        note = EXCLUDED.note,
        tags = EXCLUDED.tags,
        updated_by = EXCLUDED.updated_by,
        updated_at = now()
      RETURNING id
    `),
  );
  return { saved: rows.length === 1, value };
}

/**
 * Risk of the given store orders (F-02d): the customer's refusals on that
 * store and near-duplicate orders. Reads only the seller's stores' orders
 * whose phone ends in the same 10 digits, then matches the exact customer in
 * code. Orders without a store or a usable phone get no entry.
 */
export async function loadStoreOrderRisks(
  sellerId: string,
  orders: { orderId: string; storeId: string | null; addressPhone: string | null; userPhone: string | null }[],
  q: Queryable = db,
): Promise<Map<string, OrderRisk>> {
  const targets = orders.filter(
    (o): o is typeof o & { storeId: string } => Boolean(o.storeId && UUID_RE.test(o.storeId) && customerPhone(o)),
  );
  if (targets.length === 0) return new Map();

  const storeIds = [...new Set(targets.map((o) => o.storeId))];
  const tails = [...new Set(targets.map((o) => customerPhone(o)!.slice(-10)))];
  const rows = await queryOrderRows(
    sellerId,
    sql`o.store_id IN (${sql.join(storeIds.map((id) => sql`${id}::uuid`), sql`, `)})
        AND right(regexp_replace(coalesce(nullif(trim(a.phone), ''), u.phone, ''), '[^0-9]', '', 'g'), 10)
            IN (${sql.join(tails.map((tail) => sql`${tail}`), sql`, `)})`,
    q,
  );

  const all = computeOrderRisks(rows);
  const wanted = new Set(targets.map((o) => o.orderId));
  return new Map([...all].filter(([orderId]) => wanted.has(orderId)));
}
