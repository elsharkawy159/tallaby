/**
 * Admin › Tallaby Pay reads and the writes F-100e and F-100d did not cover
 * (ROADMAP.md F-100g; design §7, §8 and the owner's answers in §14,
 * 2026-11-18). Server-only.
 *
 * Callers check the admin session first (the admin app's validateAdminAccess).
 * The writes re-check the actor in the database (`assertAdminActor`), refuse
 * an admin acting on their own account, and write admin_audit_log in the same
 * transaction:
 *   - freeze / unfreeze a store's earnings (status columns of 0175; no balance moves);
 *   - an adjustment of available earnings, only through `postTallabyPayEntry`
 *     kind `adjustment` (owner Q8: the seller pays chargeback fees);
 *   - a second EasyKash payment for an already paid order ("paid twice",
 *     F-100d) marked refunded once the team refunded it in EasyKash. That money
 *     never reached the seller, so no ledger entry is posted;
 *   - the fee, hold days, minimum withdrawal and the `tallaby_pay_live` switch.
 *     The fee is snapshotted on each order when placed, so a change never
 *     affects a past order.
 *
 * Reads: platform-wide, admin only, never cached (rule 8). Destinations are
 * returned in full: admins pay from them. Money stays the numeric(10,2) text
 * of the row; sums are done by Postgres in numeric.
 */
import { db, sql } from "@workspace/db";

import { AdminActorError, assertAdminActor, writeAdminAudit } from "../admin/guard.server";
import { piastresToAmount } from "./fee.lib";
import { TallabyPayBalanceError, postTallabyPayEntry } from "./ledger.server";
import {
  adjustmentPiastres,
  likePattern,
  tallabyPayDeclineBlock,
  tallabyPayAdjustmentInputSchema,
  tallabyPaySettingsInputSchema,
  tallabyPayWalletNoteSchema,
  type TallabyPayDateRange,
  type TallabyPaySaleFilter,
  type TallabyPayWalletFilter,
} from "./admin.lib";
import {
  tallabyPayDestinationSchema,
  type TallabyPayDestination,
  type TallabyPayKycIdType,
  type TallabyPayKycStatus,
  type TallabyPayPayoutMethod,
  type TallabyPayPayoutStatus,
} from "./payouts.lib";
import type { TallabyPayResult } from "./payouts.server";
import { releaseTallabyPaySale } from "./release.server";
import { getTallabyPaySettings } from "./settings.server";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

export const TALLABY_PAY_ADMIN_PAGE_SIZE = 25;
/** The queues are short by nature; past this the oldest show first and the rest wait. */
const QUEUE_LIMIT = 100;

/** Start of a Cairo day as timestamptz, or NULL. */
const dayStart = (day: string | null) => sql`(${day}::date)::timestamp AT TIME ZONE 'Africa/Cairo'`;
/** Start of the Cairo day after `day`, or NULL. */
const dayEnd = (day: string | null) => sql`((${day}::date) + 1)::timestamp AT TIME ZONE 'Africa/Cairo'`;

function inRange(column: ReturnType<typeof sql.raw>, range: TallabyPayDateRange) {
  return sql`(${range.from}::date IS NULL OR ${column} >= ${dayStart(range.from)})
         AND (${range.to}::date IS NULL OR ${column} < ${dayEnd(range.to)})`;
}

const SELLER_NAME = sql`coalesce(nullif(se.display_name, ''), se.business_name)`;

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface TallabyPayAdminOverview {
  range: TallabyPayDateRange;
  /** Sales paid in the range. */
  sales: number;
  /** Everything customers paid in the range, refunded sales included. */
  gross: string;
  /** Gross of the range's sales that were refunded to the customer. */
  refunded: string;
  refundedCount: number;
  /** The Fees box: Σ fee of the range's sales that were not refunded. */
  fees: string;
  /** The Fees box this Cairo month and all time (no date filter). */
  feesThisMonth: string;
  feesAllTime: string;
  /** Withdrawals marked paid in the range (reversed ones excluded). */
  paidOut: string;
  paidOutCount: number;
  /** Now, across every store. */
  owed: {
    pending: string;
    available: string;
    reserved: string;
    /** pending + available − reserved: what Tallaby still owes sellers, open requests aside. */
    total: string;
  };
  wallets: number;
  negativeWallets: number;
  frozenWallets: number;
}

export async function getTallabyPayAdminOverview(range: TallabyPayDateRange, q: Queryable = db): Promise<TallabyPayAdminOverview> {
  // One statement: the serverless pool is small.
  const [row] = await q.execute<Record<string, string | number>>(sql`
    WITH ranged AS (
      SELECT gross, fee, status FROM tallaby_pay_sales s WHERE ${inRange(sql.raw("s.paid_at"), range)}
    ),
    fees AS (
      SELECT coalesce(sum(fee) FILTER (WHERE status <> 'refunded'), 0) AS all_time,
             coalesce(sum(fee) FILTER (
               WHERE status <> 'refunded'
                 AND paid_at >= (date_trunc('month', now() AT TIME ZONE 'Africa/Cairo') AT TIME ZONE 'Africa/Cairo')
             ), 0) AS this_month
        FROM tallaby_pay_sales
    ),
    paid AS (
      SELECT coalesce(sum(amount), 0) AS amount, count(*)::int AS n
        FROM tallaby_pay_payouts p WHERE p.status = 'paid' AND ${inRange(sql.raw("p.reviewed_at"), range)}
    ),
    w AS (
      SELECT coalesce(sum(pending), 0) AS pending, coalesce(sum(available), 0) AS available,
             coalesce(sum(reserved), 0) AS reserved, count(*)::int AS n,
             (count(*) FILTER (WHERE available < 0))::int AS negative,
             (count(*) FILTER (WHERE status = 'frozen'))::int AS frozen
        FROM tallaby_pay_wallets
    )
    SELECT
      (SELECT count(*)::int FROM ranged) AS sales,
      (SELECT coalesce(sum(gross), 0)::text FROM ranged) AS gross,
      (SELECT coalesce(sum(gross) FILTER (WHERE status = 'refunded'), 0)::text FROM ranged) AS refunded,
      (SELECT (count(*) FILTER (WHERE status = 'refunded'))::int FROM ranged) AS refunded_count,
      (SELECT coalesce(sum(fee) FILTER (WHERE status <> 'refunded'), 0)::text FROM ranged) AS fees,
      fees.this_month::text AS fees_month, fees.all_time::text AS fees_all,
      paid.amount::text AS paid_out, paid.n AS paid_out_count,
      w.pending::text AS pending, w.available::text AS available, w.reserved::text AS reserved,
      (w.pending + w.available - w.reserved)::numeric(14,2)::text AS owed,
      w.n AS wallets, w.negative, w.frozen
    FROM fees, paid, w
  `);
  const s = (k: string) => String(row?.[k] ?? "0");
  const n = (k: string) => Number(row?.[k] ?? 0);
  return {
    range,
    sales: n("sales"),
    gross: s("gross"),
    refunded: s("refunded"),
    refundedCount: n("refunded_count"),
    fees: s("fees"),
    feesThisMonth: s("fees_month"),
    feesAllTime: s("fees_all"),
    paidOut: s("paid_out"),
    paidOutCount: n("paid_out_count"),
    owed: { pending: s("pending"), available: s("available"), reserved: s("reserved"), total: s("owed") },
    wallets: n("wallets"),
    negativeWallets: n("negative"),
    frozenWallets: n("frozen"),
  };
}

export interface TallabyPayQueueCounts {
  openPayouts: number;
  /** Sales with a refund request plus "paid twice" payments waiting for a refund. */
  refunds: number;
  kyc: number;
}

/** The open work of the section (tabs and the sidebar badge). */
export async function getTallabyPayQueueCounts(q: Queryable = db): Promise<TallabyPayQueueCounts> {
  const [row] = await q.execute<{ open_payouts: number; refunds: number; kyc: number }>(sql`
    SELECT
      (SELECT count(*)::int FROM tallaby_pay_payouts WHERE status = 'requested') AS open_payouts,
      ((SELECT count(*) FROM tallaby_pay_sales WHERE status = 'pending' AND refund_state = 'requested')
        + (SELECT count(*) FROM payments
            WHERE status = 'pending' AND transaction_id LIKE 'tallaby_pay:%' AND payment_data->>'review' = 'paid_twice'))::int AS refunds,
      (SELECT count(*)::int FROM tallaby_pay_kyc WHERE status = 'submitted') AS kyc
  `);
  return { openPayouts: Number(row?.open_payouts ?? 0), refunds: Number(row?.refunds ?? 0), kyc: Number(row?.kyc ?? 0) };
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export interface TallabyPayAdminSaleRow {
  id: string;
  storeId: string;
  storeName: string;
  sellerId: string;
  orderId: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  purpose: "order" | "deposit";
  gross: string;
  fee: string;
  net: string;
  feeBps: number;
  status: "pending" | "available" | "refunded";
  refundState: "requested" | "declined" | null;
  paymentMethod: string | null;
  easykashRef: string;
  paidAt: string;
  releasedAt: string | null;
  refundedAt: string | null;
}

export interface TallabyPayAdminPage<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

type SaleDbRow = {
  id: string;
  store_id: string;
  store_name: string;
  seller_id: string;
  order_id: string | null;
  order_number: string | null;
  order_status: string | null;
  purpose: "order" | "deposit";
  gross: string;
  fee: string;
  net: string;
  fee_bps: number;
  status: "pending" | "available" | "refunded";
  refund_state: "requested" | "declined" | null;
  payment_method: string | null;
  easykash_ref: string;
  paid_at: string;
  released_at: string | null;
  refunded_at: string | null;
  total: number;
};

function saleFilterSql(filter: TallabyPaySaleFilter) {
  switch (filter) {
    case "pending":
      return sql`s.status = 'pending' AND s.refund_state IS NULL`;
    case "available":
      return sql`s.status = 'available'`;
    case "refunded":
      return sql`s.status = 'refunded'`;
    case "refund_requested":
      return sql`s.status = 'pending' AND s.refund_state = 'requested'`;
    default:
      return sql`true`;
  }
}

export async function listTallabyPayAdminSales(
  args: { range: TallabyPayDateRange; filter: TallabyPaySaleFilter; search: string | null; storeId: string | null; page: number },
  q: Queryable = db,
): Promise<TallabyPayAdminPage<TallabyPayAdminSaleRow>> {
  const size = TALLABY_PAY_ADMIN_PAGE_SIZE;
  const storeId = isUuid(args.storeId) ? args.storeId : null;
  const pattern = args.search ? likePattern(args.search) : null;
  const rows = await q.execute<SaleDbRow>(sql`
    SELECT s.id, s.store_id, st.name AS store_name, s.seller_id, s.order_id, o.order_number, o.status::text AS order_status,
           s.purpose, s.gross::text, s.fee::text, s.net::text, s.fee_bps, s.status, s.refund_state, s.payment_method,
           s.easykash_ref, s.paid_at::text, s.released_at::text, s.refunded_at::text,
           count(*) OVER ()::int AS total
      FROM tallaby_pay_sales s
      JOIN stores st ON st.id = s.store_id
      LEFT JOIN orders o ON o.id = s.order_id
     WHERE ${inRange(sql.raw("s.paid_at"), args.range)}
       AND ${saleFilterSql(args.filter)}
       AND (${storeId}::uuid IS NULL OR s.store_id = ${storeId}::uuid)
       AND (${pattern}::text IS NULL
            OR st.name ILIKE ${pattern} OR o.order_number ILIKE ${pattern} OR s.easykash_ref ILIKE ${pattern})
     ORDER BY s.paid_at DESC, s.id
     LIMIT ${size} OFFSET ${(args.page - 1) * size}
  `);
  return {
    rows: rows.map((r) => ({
      id: r.id,
      storeId: r.store_id,
      storeName: r.store_name,
      sellerId: r.seller_id,
      orderId: r.order_id,
      orderNumber: r.order_number,
      orderStatus: r.order_status,
      purpose: r.purpose,
      gross: r.gross,
      fee: r.fee,
      net: r.net,
      feeBps: Number(r.fee_bps),
      status: r.status,
      refundState: r.refund_state,
      paymentMethod: r.payment_method,
      easykashRef: r.easykash_ref,
      paidAt: r.paid_at,
      releasedAt: r.released_at,
      refundedAt: r.refunded_at,
    })),
    total: Number(rows[0]?.total ?? 0),
    page: args.page,
    pageSize: size,
  };
}

// ---------------------------------------------------------------------------
// Withdrawals
// ---------------------------------------------------------------------------

export interface TallabyPayAdminPayoutRow {
  id: string;
  storeId: string;
  storeName: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string | null;
  amount: string;
  method: TallabyPayPayoutMethod;
  /** The full destination, or null when the stored JSON no longer parses. */
  destination: TallabyPayDestination | null;
  status: TallabyPayPayoutStatus;
  reference: string | null;
  rejectionReason: string | null;
  reversalReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reversedAt: string | null;
  wallet: { pending: string; available: string; reserved: string; status: string };
  kyc: { status: TallabyPayKycStatus; legalName: string } | null;
  /** The store's refunded sales so far (risk signal). */
  refundedSales: number;
}

type PayoutDbRow = {
  id: string;
  store_id: string;
  store_name: string;
  seller_id: string;
  seller_name: string;
  seller_email: string | null;
  amount: string;
  method: TallabyPayPayoutMethod;
  destination: unknown;
  status: TallabyPayPayoutStatus;
  reference: string | null;
  rejection_reason: string | null;
  reversal_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reversed_at: string | null;
  pending: string;
  available: string;
  reserved: string;
  wallet_status: string;
  kyc_status: TallabyPayKycStatus | null;
  kyc_legal_name: string | null;
  refunded_sales: number;
  total: number;
};

const PAYOUT_SELECT = sql`
  SELECT p.id, p.store_id, st.name AS store_name, p.seller_id, ${SELLER_NAME} AS seller_name, u.email AS seller_email,
         p.amount::text, p.method, p.destination, p.status, p.reference, p.rejection_reason, p.reversal_reason,
         p.created_at::text, p.reviewed_at::text, p.reversed_at::text,
         w.pending::text, w.available::text, w.reserved::text, w.status AS wallet_status,
         k.status AS kyc_status, k.legal_name AS kyc_legal_name,
         (SELECT count(*)::int FROM tallaby_pay_sales rs WHERE rs.store_id = p.store_id AND rs.status = 'refunded') AS refunded_sales,
         count(*) OVER ()::int AS total
    FROM tallaby_pay_payouts p
    JOIN tallaby_pay_wallets w ON w.id = p.wallet_id
    JOIN stores st ON st.id = p.store_id
    JOIN sellers se ON se.id = p.seller_id
    LEFT JOIN users u ON u.id = p.seller_id
    LEFT JOIN tallaby_pay_kyc k ON k.seller_id = p.seller_id`;

function toPayoutRow(r: PayoutDbRow): TallabyPayAdminPayoutRow {
  const parsed = tallabyPayDestinationSchema.safeParse(r.destination);
  return {
    id: r.id,
    storeId: r.store_id,
    storeName: r.store_name,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    sellerEmail: r.seller_email,
    amount: r.amount,
    method: r.method,
    destination: parsed.success ? parsed.data : null,
    status: r.status,
    reference: r.reference,
    rejectionReason: r.rejection_reason,
    reversalReason: r.reversal_reason,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reversedAt: r.reversed_at,
    wallet: { pending: r.pending, available: r.available, reserved: r.reserved, status: r.wallet_status },
    kyc: r.kyc_status ? { status: r.kyc_status, legalName: r.kyc_legal_name ?? "" } : null,
    refundedSales: Number(r.refunded_sales ?? 0),
  };
}

/** Open requests, oldest first (design §7). */
export async function listTallabyPayPayoutQueue(q: Queryable = db): Promise<TallabyPayAdminPayoutRow[]> {
  const rows = await q.execute<PayoutDbRow>(sql`
    ${PAYOUT_SELECT}
     WHERE p.status = 'requested'
     ORDER BY p.created_at ASC
     LIMIT ${QUEUE_LIMIT}
  `);
  return rows.map(toPayoutRow);
}

/** Handled requests, newest first. */
export async function listTallabyPayPayoutHistory(page: number, q: Queryable = db): Promise<TallabyPayAdminPage<TallabyPayAdminPayoutRow>> {
  const size = TALLABY_PAY_ADMIN_PAGE_SIZE;
  const rows = await q.execute<PayoutDbRow>(sql`
    ${PAYOUT_SELECT}
     WHERE p.status <> 'requested'
     ORDER BY coalesce(p.reversed_at, p.reviewed_at, p.created_at) DESC, p.id
     LIMIT ${size} OFFSET ${(page - 1) * size}
  `);
  return { rows: rows.map(toPayoutRow), total: Number(rows[0]?.total ?? 0), page, pageSize: size };
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

export interface TallabyPayRefundQueueSale {
  saleId: string;
  storeId: string;
  storeName: string;
  orderId: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  /** True once the order was delivered: Tallaby can't refund it any more. */
  delivered: boolean;
  purpose: "order" | "deposit";
  gross: string;
  net: string;
  fee: string;
  easykashRef: string;
  customerReference: string | null;
  /** `seller_cancelled`, `paid_after_cancel` or the seller's own text. */
  refundReason: string | null;
  requestedAt: string | null;
}

export interface TallabyPayRefundQueueDuplicate {
  paymentId: string;
  orderId: string;
  orderNumber: string | null;
  storeId: string | null;
  storeName: string | null;
  amount: string;
  /** `online_payment` or `cod_deposit`. */
  method: string;
  /** The EasyKash reference (after the `tallaby_pay:` prefix). */
  easykashRef: string;
  note: string | null;
  createdAt: string | null;
}

export interface TallabyPayRefundQueue {
  sales: TallabyPayRefundQueueSale[];
  duplicates: TallabyPayRefundQueueDuplicate[];
}

export async function getTallabyPayRefundQueue(q: Queryable = db): Promise<TallabyPayRefundQueue> {
  const sales = await q.execute<{
    id: string;
    store_id: string;
    store_name: string;
    order_id: string | null;
    order_number: string | null;
    order_status: string | null;
    delivered: boolean;
    purpose: "order" | "deposit";
    gross: string;
    net: string;
    fee: string;
    easykash_ref: string;
    customer_reference: string | null;
    refund_reason: string | null;
    refund_requested_at: string | null;
  }>(sql`
    SELECT s.id, s.store_id, st.name AS store_name, s.order_id, o.order_number, o.status::text AS order_status,
           (o.status::text = 'delivered' OR o.delivered_at IS NOT NULL) IS TRUE AS delivered,
           s.purpose, s.gross::text, s.net::text, s.fee::text, s.easykash_ref, s.customer_reference, s.refund_reason,
           s.refund_requested_at::text
      FROM tallaby_pay_sales s
      JOIN stores st ON st.id = s.store_id
      LEFT JOIN orders o ON o.id = s.order_id
     WHERE s.status = 'pending' AND s.refund_state = 'requested'
     ORDER BY s.refund_requested_at ASC NULLS FIRST
     LIMIT ${QUEUE_LIMIT}
  `);
  const duplicates = await q.execute<{
    id: string;
    order_id: string;
    order_number: string | null;
    store_id: string | null;
    store_name: string | null;
    amount: string;
    method: string;
    transaction_id: string;
    error_message: string | null;
    created_at: string | null;
  }>(sql`
    SELECT pm.id, pm.order_id, o.order_number, o.store_id, st.name AS store_name, pm.amount::text, pm.method,
           pm.transaction_id, pm.error_message, pm.created_at::text
      FROM payments pm
      JOIN orders o ON o.id = pm.order_id
      LEFT JOIN stores st ON st.id = o.store_id
     WHERE pm.status = 'pending' AND pm.transaction_id LIKE 'tallaby_pay:%' AND pm.payment_data->>'review' = 'paid_twice'
     ORDER BY pm.created_at ASC
     LIMIT ${QUEUE_LIMIT}
  `);
  return {
    sales: sales.map((r) => ({
      saleId: r.id,
      storeId: r.store_id,
      storeName: r.store_name,
      orderId: r.order_id,
      orderNumber: r.order_number,
      orderStatus: r.order_status,
      delivered: r.delivered === true,
      purpose: r.purpose,
      gross: r.gross,
      net: r.net,
      fee: r.fee,
      easykashRef: r.easykash_ref,
      customerReference: r.customer_reference,
      refundReason: r.refund_reason,
      requestedAt: r.refund_requested_at,
    })),
    duplicates: duplicates.map((r) => ({
      paymentId: r.id,
      orderId: r.order_id,
      orderNumber: r.order_number,
      storeId: r.store_id,
      storeName: r.store_name,
      amount: r.amount,
      method: r.method,
      easykashRef: r.transaction_id.slice("tallaby_pay:".length),
      note: r.error_message,
      createdAt: r.created_at,
    })),
  };
}

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------

export interface TallabyPayAdminKycRow {
  sellerId: string;
  sellerName: string;
  sellerEmail: string | null;
  legalName: string;
  idType: TallabyPayKycIdType;
  /** In full: the admin compares it with the documents. */
  idNumber: string;
  status: TallabyPayKycStatus;
  submittedAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
  /** Payout requests waiting on this identity. */
  openPayouts: number;
}

/** Waiting identities (oldest first), then the latest reviewed ones. */
export async function listTallabyPayKyc(view: "submitted" | "reviewed", q: Queryable = db): Promise<TallabyPayAdminKycRow[]> {
  const rows = await q.execute<{
    seller_id: string;
    seller_name: string;
    seller_email: string | null;
    legal_name: string;
    id_type: TallabyPayKycIdType;
    id_number: string;
    status: TallabyPayKycStatus;
    submitted_at: string;
    verified_at: string | null;
    rejection_reason: string | null;
    open_payouts: number;
  }>(sql`
    SELECT k.seller_id, ${SELLER_NAME} AS seller_name, u.email AS seller_email, k.legal_name, k.id_type, k.id_number,
           k.status, k.submitted_at::text, k.verified_at::text, k.rejection_reason,
           (SELECT count(*)::int FROM tallaby_pay_payouts p WHERE p.seller_id = k.seller_id AND p.status = 'requested') AS open_payouts
      FROM tallaby_pay_kyc k
      JOIN sellers se ON se.id = k.seller_id
      LEFT JOIN users u ON u.id = k.seller_id
     WHERE ${view === "submitted" ? sql`k.status = 'submitted'` : sql`k.status <> 'submitted'`}
     ORDER BY ${view === "submitted" ? sql`k.submitted_at ASC` : sql`k.updated_at DESC`}
     LIMIT ${QUEUE_LIMIT}
  `);
  return rows.map((r) => ({
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    sellerEmail: r.seller_email,
    legalName: r.legal_name,
    idType: r.id_type,
    idNumber: r.id_number,
    status: r.status,
    submittedAt: r.submitted_at,
    verifiedAt: r.verified_at,
    rejectionReason: r.rejection_reason,
    openPayouts: Number(r.open_payouts ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------

export interface TallabyPayAdminWalletRow {
  walletId: string;
  storeId: string;
  storeName: string;
  sellerId: string;
  sellerName: string;
  pending: string;
  available: string;
  reserved: string;
  status: "active" | "frozen";
  frozenReason: string | null;
  frozenAt: string | null;
  sales: number;
  updatedAt: string;
}

function walletFilterSql(filter: TallabyPayWalletFilter) {
  switch (filter) {
    case "negative":
      return sql`w.available < 0`;
    case "frozen":
      return sql`w.status = 'frozen'`;
    case "has_money":
      return sql`(w.pending <> 0 OR w.available <> 0 OR w.reserved <> 0)`;
    default:
      return sql`true`;
  }
}

export async function listTallabyPayAdminWallets(
  args: { filter: TallabyPayWalletFilter; search: string | null; page: number },
  q: Queryable = db,
): Promise<TallabyPayAdminPage<TallabyPayAdminWalletRow>> {
  const size = TALLABY_PAY_ADMIN_PAGE_SIZE;
  const pattern = args.search ? likePattern(args.search) : null;
  const rows = await q.execute<{
    id: string;
    store_id: string;
    store_name: string;
    seller_id: string;
    seller_name: string;
    pending: string;
    available: string;
    reserved: string;
    status: "active" | "frozen";
    frozen_reason: string | null;
    frozen_at: string | null;
    sales: number;
    updated_at: string;
    total: number;
  }>(sql`
    SELECT w.id, w.store_id, st.name AS store_name, w.seller_id, ${SELLER_NAME} AS seller_name,
           w.pending::text, w.available::text, w.reserved::text, w.status, w.frozen_reason, w.frozen_at::text,
           (SELECT count(*)::int FROM tallaby_pay_sales s WHERE s.wallet_id = w.id) AS sales,
           w.updated_at::text, count(*) OVER ()::int AS total
      FROM tallaby_pay_wallets w
      JOIN stores st ON st.id = w.store_id
      JOIN sellers se ON se.id = w.seller_id
     WHERE ${walletFilterSql(args.filter)}
       AND (${pattern}::text IS NULL OR st.name ILIKE ${pattern} OR se.business_name ILIKE ${pattern}
            OR se.display_name ILIKE ${pattern})
     ORDER BY (w.status = 'frozen') DESC, w.available ASC, w.updated_at DESC, w.id
     LIMIT ${size} OFFSET ${(args.page - 1) * size}
  `);
  return {
    rows: rows.map((r) => ({
      walletId: r.id,
      storeId: r.store_id,
      storeName: r.store_name,
      sellerId: r.seller_id,
      sellerName: r.seller_name,
      pending: r.pending,
      available: r.available,
      reserved: r.reserved,
      status: r.status,
      frozenReason: r.frozen_reason,
      frozenAt: r.frozen_at,
      sales: Number(r.sales ?? 0),
      updatedAt: r.updated_at,
    })),
    total: Number(rows[0]?.total ?? 0),
    page: args.page,
    pageSize: size,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type TallabyPayWalletAdminError =
  | "not_admin"
  | "invalid_input"
  | "not_found"
  | "already_reviewed"
  | "own_account"
  | "insufficient_balance";

export const TALLABY_PAY_WALLET_ADMIN_ERROR_MESSAGES: Record<TallabyPayWalletAdminError | "generic", string> = {
  not_admin: "You don't have permission to manage Tallaby Pay.",
  invalid_input: "Check the form: a reason (at least 3 characters) is required, and an amount above zero.",
  not_found: "This record no longer exists.",
  already_reviewed: "This was already changed by someone else. Refresh the page.",
  own_account: "You can't change your own account.",
  insufficient_balance: "This would take the pending earnings below zero.",
  generic: "Something went wrong. Try again.",
};

/** Thrown inside a transaction to roll it back and return a typed error. */
class Failure extends Error {
  constructor(readonly code: TallabyPayWalletAdminError) {
    super(code);
  }
}

async function runWalletAdmin<T>(fn: () => Promise<T>): Promise<TallabyPayResult<T, TallabyPayWalletAdminError>> {
  try {
    return { success: true, data: await fn() };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof Failure) return { success: false, error: error.code };
    if (error instanceof TallabyPayBalanceError) return { success: false, error: "insufficient_balance" };
    throw error;
  }
}

type LockedWallet = {
  id: string;
  store_id: string;
  seller_id: string;
  status: string;
  available: string;
  frozen_reason: string | null;
};

async function lockWalletForAdmin(tx: Tx, adminId: string, walletId: string): Promise<LockedWallet> {
  await assertAdminActor(tx, adminId);
  const [wallet] = await tx.execute<LockedWallet>(sql`
    SELECT id, store_id, seller_id, status, available::text, frozen_reason FROM tallaby_pay_wallets WHERE id = ${walletId} FOR UPDATE
  `);
  if (!wallet) throw new Failure("not_found");
  if (wallet.seller_id === adminId.toLowerCase()) throw new Failure("own_account");
  return wallet;
}

/** Stops money leaving the store (withdrawal requests and Mark paid). Sales and refunds still post. */
export async function freezeTallabyPayWallet(
  args: { adminId: string; input: unknown },
  q: typeof db = db,
): Promise<TallabyPayResult<{ walletId: string }, TallabyPayWalletAdminError>> {
  const parsed = tallabyPayWalletNoteSchema.safeParse(args.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { walletId, reason } = parsed.data;
  return runWalletAdmin(() =>
    q.transaction(async (tx) => {
      const wallet = await lockWalletForAdmin(tx, args.adminId, walletId);
      const [row] = await tx.execute<{ id: string }>(sql`
        UPDATE tallaby_pay_wallets
           SET status = 'frozen', frozen_reason = ${reason}, frozen_by = ${args.adminId}, frozen_at = now(), updated_at = now()
         WHERE id = ${wallet.id} AND status = 'active'
        RETURNING id
      `);
      if (!row) throw new Failure("already_reviewed");
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: wallet.seller_id,
        storeId: wallet.store_id,
        action: "tallaby_pay_wallet_frozen",
        before: { status: "active" },
        after: { status: "frozen", walletId: wallet.id },
        reason,
      });
      return { walletId: wallet.id };
    }),
  );
}

export async function unfreezeTallabyPayWallet(
  args: { adminId: string; input: unknown },
  q: typeof db = db,
): Promise<TallabyPayResult<{ walletId: string }, TallabyPayWalletAdminError>> {
  const parsed = tallabyPayWalletNoteSchema.safeParse(args.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { walletId, reason } = parsed.data;
  return runWalletAdmin(() =>
    q.transaction(async (tx) => {
      const wallet = await lockWalletForAdmin(tx, args.adminId, walletId);
      const [row] = await tx.execute<{ id: string }>(sql`
        UPDATE tallaby_pay_wallets
           SET status = 'active', frozen_reason = NULL, frozen_by = NULL, frozen_at = NULL, updated_at = now()
         WHERE id = ${wallet.id} AND status = 'frozen'
        RETURNING id
      `);
      if (!row) throw new Failure("already_reviewed");
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: wallet.seller_id,
        storeId: wallet.store_id,
        action: "tallaby_pay_wallet_unfrozen",
        before: { status: "frozen", frozenReason: wallet.frozen_reason },
        after: { status: "active", walletId: wallet.id },
        reason,
      });
      return { walletId: wallet.id };
    }),
  );
}

/**
 * Adds to or takes from a store's available earnings, with a reason (for
 * example a chargeback fee, owner Q8). Available may go below zero: the
 * seller's next sales cover it. The form's key makes a double submit post one
 * entry; a replay writes no second audit row.
 */
export async function adjustTallabyPayWallet(
  args: { adminId: string; input: unknown },
  q: typeof db = db,
): Promise<TallabyPayResult<{ walletId: string; availableAfter: string; replayed: boolean }, TallabyPayWalletAdminError>> {
  const parsed = tallabyPayAdjustmentInputSchema.safeParse(args.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const input = parsed.data;
  const delta = adjustmentPiastres(input);
  return runWalletAdmin(() =>
    q.transaction(async (tx) => {
      const wallet = await lockWalletForAdmin(tx, args.adminId, input.walletId);
      const entry = await postTallabyPayEntry(tx, {
        storeId: wallet.store_id,
        sellerId: wallet.seller_id,
        kind: "adjustment",
        availablePiastres: delta,
        referenceType: "admin_adjustment",
        referenceId: input.key.toLowerCase(),
        description: input.direction === "debit" ? "Adjustment by Tallaby (charge)" : "Adjustment by Tallaby (credit)",
        reason: input.reason,
        createdBy: args.adminId,
      });
      if (!entry.replayed) {
        await writeAdminAudit(tx, {
          actorId: args.adminId,
          sellerId: wallet.seller_id,
          storeId: wallet.store_id,
          action: "tallaby_pay_wallet_adjusted",
          before: { available: wallet.available },
          after: { available: entry.availableAfter, delta: piastresToAmount(delta), entryId: entry.entryId },
          reason: input.reason,
        });
      }
      return { walletId: wallet.id, availableAfter: entry.availableAfter, replayed: entry.replayed };
    }),
  );
}

/**
 * A second EasyKash payment for an order that was already paid ("paid twice",
 * F-100d) was refunded by the team in Tallaby's EasyKash account: the
 * `payments` row becomes `refunded`. The money never reached the seller, so
 * no earnings move. `UPDATE … WHERE status = 'pending'` is the claim.
 */
export async function markTallabyPayDuplicateRefunded(
  args: { adminId: string; paymentId: string; reason: string; reference?: string | null },
  q: typeof db = db,
): Promise<TallabyPayResult<{ paymentId: string }, TallabyPayWalletAdminError>> {
  const clean = (v: unknown, min: number, max: number) => {
    if (typeof v !== "string") return null;
    const t = v.trim().replace(/\s+/g, " ");
    return t.length >= min && t.length <= max ? t : null;
  };
  const reason = clean(args.reason, 3, 500);
  const reference = args.reference == null || args.reference === "" ? null : clean(args.reference, 2, 120);
  if (!isUuid(args.paymentId) || !reason || (args.reference && !reference)) return { success: false, error: "invalid_input" };
  return runWalletAdmin(() =>
    q.transaction(async (tx) => {
      await assertAdminActor(tx, args.adminId);
      const [payment] = await tx.execute<{ id: string; order_id: string; amount: string; seller_id: string | null; store_id: string | null }>(sql`
        SELECT pm.id, pm.order_id, pm.amount::text, st.seller_id, o.store_id
          FROM payments pm
          JOIN orders o ON o.id = pm.order_id
          LEFT JOIN stores st ON st.id = o.store_id
         WHERE pm.id = ${args.paymentId} AND pm.transaction_id LIKE 'tallaby_pay:%' AND pm.payment_data->>'review' = 'paid_twice'
      `);
      if (!payment || !payment.seller_id) throw new Failure("not_found");
      if (payment.seller_id === args.adminId.toLowerCase()) throw new Failure("own_account");
      const [row] = await tx.execute<{ id: string }>(sql`
        UPDATE payments
           SET status = 'refunded',
               payment_data = coalesce(payment_data, '{}'::jsonb) || jsonb_build_object(
                 'refundedBy', ${args.adminId}::text, 'refundReference', ${reference}::text,
                 'refundReason', ${reason}::text, 'refundedAt', now()),
               updated_at = now()
         WHERE id = ${payment.id} AND status = 'pending'
        RETURNING id
      `);
      if (!row) throw new Failure("already_reviewed");
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: payment.seller_id,
        storeId: payment.store_id,
        action: "tallaby_pay_duplicate_refunded",
        before: { status: "pending", amount: payment.amount },
        after: { status: "refunded", paymentId: payment.id, orderId: payment.order_id, reference },
        reason,
      });
      return { paymentId: payment.id };
    }),
  );
}

export type TallabyPayDeclineError =
  | "not_admin"
  | "invalid_input"
  | "not_found"
  | "own_account"
  | "not_requested"
  | "already_refunded"
  | "must_refund";

export const TALLABY_PAY_DECLINE_ERROR_MESSAGES: Record<TallabyPayDeclineError | "generic", string> = {
  not_admin: "You don't have permission to manage Tallaby Pay.",
  invalid_input: "Add a reason (at least 3 characters).",
  not_found: "This sale no longer exists.",
  own_account: "You can't review your own account.",
  not_requested: "This refund request was already handled. Refresh the page.",
  already_refunded: "This sale was already refunded.",
  must_refund: "This payment arrived after the order was cancelled. It must be refunded to the customer, not declined.",
  generic: "Something went wrong. Try again.",
};

/**
 * Declines a seller's refund request (design §8): the money stays the
 * seller's. `refund_state` goes back to NULL, so the sale releases on
 * delivery as usual; the request's who, when and why stay on the row
 * (refund_requested_*, refund_reason) and the decline reason goes to
 * `refund_reason_admin`. The admin and time are in admin_audit_log
 * (`tallaby_pay_refund_declined`); 0176 rings the seller's bell. Refused for
 * a payment made after the cancel (it must be refunded). If the order was
 * already delivered, the sale is released right after the commit.
 */
export async function declineTallabyPayRefund(
  args: { saleId: string; adminId: string; reason: string },
  q: typeof db = db,
): Promise<TallabyPayResult<{ saleId: string; released: boolean }, TallabyPayDeclineError>> {
  const reason = typeof args.reason === "string" ? args.reason.trim().replace(/\s+/g, " ") : "";
  if (!isUuid(args.saleId) || reason.length < 3 || reason.length > 500) return { success: false, error: "invalid_input" };
  let declined: { id: string };
  try {
    declined = await q.transaction(async (tx) => {
      await assertAdminActor(tx, args.adminId);
      const [head] = await tx.execute<{ id: string; wallet_id: string; seller_id: string }>(sql`
        SELECT id, wallet_id, seller_id FROM tallaby_pay_sales WHERE id = ${args.saleId}
      `);
      if (!head) throw new DeclineFailure("not_found");
      if (head.seller_id === args.adminId.toLowerCase()) throw new DeclineFailure("own_account");
      // Lock order as everywhere: wallet, then the sale (an admin refund of the same sale waits here).
      await tx.execute(sql`SELECT id FROM tallaby_pay_wallets WHERE id = ${head.wallet_id} FOR UPDATE`);
      const [sale] = await tx.execute<{
        status: string;
        refund_state: string | null;
        refund_reason: string | null;
        refund_requested_at: string | null;
        store_id: string;
        order_id: string | null;
        gross: string;
      }>(sql`
        SELECT status, refund_state, refund_reason, refund_requested_at::text, store_id, order_id, gross::text
          FROM tallaby_pay_sales WHERE id = ${head.id} FOR UPDATE
      `);
      const block = tallabyPayDeclineBlock({ saleStatus: sale!.status, refundState: sale!.refund_state, refundReason: sale!.refund_reason });
      if (block) throw new DeclineFailure(block);
      const [row] = await tx.execute<{ id: string }>(sql`
        UPDATE tallaby_pay_sales
           SET refund_state = NULL, refund_reason_admin = ${reason}, updated_at = now()
         WHERE id = ${head.id} AND status = 'pending' AND refund_state = 'requested'
           AND refund_reason IS DISTINCT FROM 'paid_after_cancel'
        RETURNING id
      `);
      if (!row) throw new DeclineFailure("not_requested");
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: head.seller_id,
        storeId: sale!.store_id,
        action: "tallaby_pay_refund_declined",
        before: {
          refundState: "requested",
          refundReason: sale!.refund_reason,
          refundRequestedAt: sale!.refund_requested_at,
          gross: sale!.gross,
        },
        after: { refundState: null, saleId: head.id, orderId: sale!.order_id },
        reason,
      });
      return { id: head.id };
    });
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof DeclineFailure) return { success: false, error: error.code };
    throw error;
  }
  // Its own transaction, after the commit: a delivered order releases now; otherwise
  // this is a no-op and the delivery hook (or the hourly cron) releases it later.
  const outcome = await releaseTallabyPaySale(declined.id, q).catch(() => null);
  return { success: true, data: { saleId: declined.id, released: outcome?.released === true } };
}

class DeclineFailure extends Error {
  constructor(readonly code: TallabyPayDeclineError) {
    super(code);
  }
}

export type TallabyPaySettingsAdminError = "not_admin" | "invalid_input" | "no_change";

export const TALLABY_PAY_SETTINGS_ERROR_MESSAGES: Record<TallabyPaySettingsAdminError | "generic", string> = {
  not_admin: "You don't have permission to change Tallaby Pay settings.",
  invalid_input: "Check the form: fee 0–2000 bps, hold 0–60 days, minimum at least EGP 1, and a reason.",
  no_change: "Nothing to save: these are the current settings.",
  generic: "Something went wrong. Try again.",
};

/**
 * Fee (bps), hold days, minimum withdrawal and the launch switch, with one
 * audit row, in one transaction. New orders snapshot the new fee; past
 * orders keep theirs (tallaby_pay_sales.fee_bps).
 */
export async function updateTallabyPaySettings(
  args: { adminId: string; input: unknown },
  q: typeof db = db,
): Promise<TallabyPayResult<{ changed: string[] }, TallabyPaySettingsAdminError>> {
  const parsed = tallabyPaySettingsInputSchema.safeParse(args.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const next = parsed.data;
  try {
    return await q.transaction(async (tx) => {
      await assertAdminActor(tx, args.adminId);
      // Serialize concurrent saves on the single settings row.
      await tx.execute(sql`SELECT id FROM billing_settings WHERE id = true FOR UPDATE`);
      const before = await getTallabyPaySettings(tx);
      const changed: string[] = [];
      if (before.feeBps !== next.feeBps) changed.push("feeBps");
      if (before.holdDays !== next.holdDays) changed.push("holdDays");
      if (before.minPayoutPiastres !== next.minPayout) changed.push("minPayout");
      if (before.live !== next.live) changed.push("live");
      if (changed.length === 0) return { success: false as const, error: "no_change" as const };

      const updated = await tx.execute<{ id: boolean }>(sql`
        UPDATE billing_settings
           SET tallaby_pay_fee_bps = ${next.feeBps}, tallaby_pay_hold_days = ${next.holdDays},
               tallaby_pay_min_payout = ${piastresToAmount(next.minPayout)}::numeric
         WHERE id = true
        RETURNING id
      `);
      if (!updated.length) throw new Error("billing_settings row missing");
      if (before.live !== next.live) {
        await tx.execute(sql`
          INSERT INTO platform_switches (key, enabled, changed_at, changed_by)
          VALUES ('tallaby_pay_live', ${next.live}, now(), ${args.adminId})
          ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, changed_at = now(), changed_by = EXCLUDED.changed_by
        `);
      }
      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: null,
        targetType: "billing_settings",
        targetId: "tallaby_pay",
        action: "tallaby_pay_settings_updated",
        before: {
          feeBps: before.feeBps,
          holdDays: before.holdDays,
          minPayout: piastresToAmount(before.minPayoutPiastres),
          live: before.live,
        },
        after: { feeBps: next.feeBps, holdDays: next.holdDays, minPayout: piastresToAmount(next.minPayout), live: next.live },
        reason: next.reason,
      });
      return { success: true as const, data: { changed } };
    });
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }
}
