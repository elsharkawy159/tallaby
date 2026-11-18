/**
 * Tallaby Pay sales reads for the seller dashboard (ROADMAP.md F-100f; design
 * §8). Server-only, read-only, never cached (CLAUDE.md rule 8).
 *
 * Tenant isolation (rule 5): the seller is always the session's seller, passed
 * by the caller. A store is read only when `stores.seller_id` matches, and
 * every sale read is filtered by both store and seller. Money stays the
 * `numeric(10,2)` text of the row; nothing here does arithmetic.
 */
import { db, sql } from "@workspace/db";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

export type TallabyPaySaleStatus = "pending" | "available" | "refunded";

export interface TallabyPaySaleView {
  id: string;
  storeId: string;
  /** Null only after the order row was deleted. */
  orderId: string | null;
  orderNumber: string | null;
  /** The order's own status now (e.g. `delivered`, `returned`), null without an order. */
  orderStatus: string | null;
  purpose: "order" | "deposit";
  gross: string;
  fee: string;
  net: string;
  status: TallabyPaySaleStatus;
  /** `requested` while a refund waits for Tallaby; `declined` once refused. */
  refundState: "requested" | "declined" | null;
  /** EasyKash's name for how the customer paid (card, wallet, Fawry…), as sent. */
  paymentMethod: string | null;
  paidAt: string;
  /** When the net becomes available (set once the order is delivered). */
  releaseAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
}

type SaleRow = {
  id: string;
  store_id: string;
  order_id: string | null;
  order_number: string | null;
  order_status: string | null;
  purpose: "order" | "deposit";
  gross: string;
  fee: string;
  net: string;
  status: TallabyPaySaleStatus;
  refund_state: "requested" | "declined" | null;
  payment_method: string | null;
  paid_at: string;
  release_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
};

const SALE_COLUMNS = sql`s.id, s.store_id, s.order_id, o.order_number, o.status::text AS order_status, s.purpose,
  s.gross::text, s.fee::text, s.net::text, s.status, s.refund_state, s.payment_method,
  s.paid_at::text, s.release_at::text, s.released_at::text, s.refunded_at::text`;

function toSaleView(row: SaleRow): TallabyPaySaleView {
  return {
    id: row.id,
    storeId: row.store_id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    orderStatus: row.order_status,
    purpose: row.purpose,
    gross: row.gross,
    fee: row.fee,
    net: row.net,
    status: row.status,
    refundState: row.refund_state,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at,
    releaseAt: row.release_at,
    releasedAt: row.released_at,
    refundedAt: row.refunded_at,
  };
}

/** The store, only when it is a live store of this seller (rule 5). */
async function ownedStore(q: Queryable, sellerId: string, storeId: string): Promise<boolean> {
  if (!isUuid(sellerId) || !isUuid(storeId)) return false;
  const rows = await q.execute<{ id: string }>(sql`
    SELECT id FROM stores WHERE id = ${storeId} AND seller_id = ${sellerId} AND deleted_at IS NULL
  `);
  return rows.length > 0;
}

export const TALLABY_PAY_SALES_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** The store's Tallaby Pay sales, newest payment first. Empty when the store is not this seller's. */
export async function listTallabyPaySales(
  args: { sellerId: string; storeId: string; page?: number; pageSize?: number },
  q: Queryable = db,
): Promise<{ rows: TallabyPaySaleView[]; total: number; page: number; pageSize: number }> {
  const seller = String(args.sellerId).toLowerCase();
  const pageSize = Math.min(Math.max(Math.trunc(args.pageSize ?? TALLABY_PAY_SALES_PAGE_SIZE) || 1, 1), MAX_PAGE_SIZE);
  const page = Math.max(Math.trunc(args.page ?? 1) || 1, 1);
  if (!(await ownedStore(q, seller, args.storeId))) return { rows: [], total: 0, page, pageSize };

  const [rows, [count]] = await Promise.all([
    q.execute<SaleRow>(sql`
      SELECT ${SALE_COLUMNS}
        FROM tallaby_pay_sales s
        LEFT JOIN orders o ON o.id = s.order_id
       WHERE s.store_id = ${args.storeId} AND s.seller_id = ${seller}
       ORDER BY s.paid_at DESC, s.id DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `),
    q.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM tallaby_pay_sales WHERE store_id = ${args.storeId} AND seller_id = ${seller}
    `),
  ]);
  return { rows: rows.map(toSaleView), total: count?.n ?? 0, page, pageSize };
}

/**
 * The Tallaby Pay sales of one order (the order itself and/or its COD
 * deposit), for the order panel. Only this seller's rows; empty otherwise.
 */
export async function getTallabyPayOrderSales(
  args: { sellerId: string; orderId: string },
  q: Queryable = db,
): Promise<TallabyPaySaleView[]> {
  const seller = String(args.sellerId).toLowerCase();
  if (!isUuid(seller) || !isUuid(args.orderId)) return [];
  const rows = await q.execute<SaleRow>(sql`
    SELECT ${SALE_COLUMNS}
      FROM tallaby_pay_sales s
      JOIN stores st ON st.id = s.store_id AND st.seller_id = ${seller}
      LEFT JOIN orders o ON o.id = s.order_id
     WHERE s.order_id = ${args.orderId} AND s.seller_id = ${seller}
     ORDER BY s.purpose
  `);
  return rows.map(toSaleView);
}

/**
 * Whether the store shows the Earnings page: Tallaby Pay is turned on for it
 * (its integration row is not disconnected) or it already has an earnings
 * wallet (money may be owed after Tallaby Pay was turned off).
 */
export async function storeHasTallabyPay(sellerId: string, storeId: string, q: Queryable = db): Promise<boolean> {
  const seller = String(sellerId).toLowerCase();
  if (!isUuid(seller) || !isUuid(storeId)) return false;
  const rows = await q.execute<{ has_it: boolean }>(sql`
    SELECT (
      EXISTS (SELECT 1 FROM tallaby_pay_wallets WHERE store_id = ${storeId} AND seller_id = ${seller})
      OR EXISTS (
        SELECT 1 FROM store_integrations
         WHERE store_id = ${storeId} AND seller_id = ${seller}
           AND provider = 'tallaby_pay' AND status <> 'disconnected'
      )
    ) AS has_it
  `);
  return rows[0]?.has_it === true;
}
