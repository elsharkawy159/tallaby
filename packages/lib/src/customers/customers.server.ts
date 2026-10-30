import { type SQL } from "drizzle-orm";
import { db, sql } from "@workspace/db";
import {
  aggregateStoreCustomers,
  computeOrderRisks,
  customerKey,
  customerPhone,
  normalizeCustomerNote,
  parseCustomerKey,
  type CustomerNote,
  type CustomerOrderRow,
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

/** One row per customer of the seller's store, most recent buyer first. */
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
  const orders = (await loadStoreOrderRows(sellerId, storeId, q)).filter((row) => customerKey(row) === key);
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
      { note: str(r.note), tags: Array.isArray(r.tags) ? (r.tags as string[]) : [] },
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
