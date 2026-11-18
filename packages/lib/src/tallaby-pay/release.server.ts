/**
 * Tallaby Pay release and refunds (ROADMAP.md F-100d; design §5 and the
 * owner's answers in §14, 2026-11-18). Server-only.
 *
 * Invariants:
 *   1. Balances move only through `postTallabyPayEntry`: a release posts
 *      `release` (−pending, +available), a refund `refund` (−pending). Each
 *      sale status change and its entry commit together or not at all.
 *   2. Every sale status change is a claim: `UPDATE … WHERE status =
 *      'pending'` (and, for a release, `refund_state IS NULL`). A rerun, a
 *      double click or a concurrent release and refund find no row; the entry
 *      claim (`release|refund`, `sale`, <saleId>) is the backstop.
 *   3. Lock order: wallet row, then order row, then sale row (as in
 *      payouts.server.ts), so these never deadlock with each other or with a
 *      withdrawal.
 *   4. Hold days are 0 (owner): the net is available as soon as the order is
 *      delivered. After delivery Tallaby changes nothing; the seller refunds
 *      the customer himself. A Tallaby refund is only for a sale whose order
 *      was never delivered.
 *   5. Admin writes re-check the actor in the database, refuse an admin's own
 *      account and write admin_audit_log in the same transaction. Never cached.
 */
import { db, sql } from "@workspace/db";

import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "../admin/admin.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit } from "../admin/guard.server";
import { amountToPiastres } from "./fee.lib";
import { postTallabyPayEntry } from "./ledger.server";
import { tallabyPayRefundBlock, tallabyPayReleaseBlock, type TallabyPayReleaseBlock } from "./release.lib";
import type { TallabyPayResult } from "./payouts.server";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

/** Thrown inside a transaction to roll it back and return a typed error. */
class Failure<E extends string> extends Error {
  constructor(readonly code: E) {
    super(code);
  }
}

// ---------------------------------------------------------------------------
// Release (order delivered)
// ---------------------------------------------------------------------------

export type ReleaseTallabyPaySaleOutcome =
  | { released: true; saleId: string }
  | { released: false; saleId: string; reason: TallabyPayReleaseBlock | "not_found" };

type SaleHead = { id: string; wallet_id: string; store_id: string; seller_id: string; order_id: string | null };

type ReleaseRow = {
  status: string;
  refund_state: string | null;
  hold_days: number;
  net: string;
  release_at: string | null;
  order_status: string | null;
  delivered_ms: number | null;
  now_ms: number;
};

/**
 * Moves one sale's net from pending to available when its order is delivered
 * and the sale's hold has passed. Idempotent: a second call, or a call for a
 * sale with a refund request, changes nothing.
 */
export async function releaseTallabyPaySale(saleId: string, q: typeof db = db): Promise<ReleaseTallabyPaySaleOutcome> {
  if (!isUuid(saleId)) return { released: false, saleId, reason: "not_found" };
  return q.transaction(async (tx) => {
    const [head] = await tx.execute<SaleHead>(sql`
      SELECT id, wallet_id, store_id, seller_id, order_id FROM tallaby_pay_sales WHERE id = ${saleId}
    `);
    if (!head) return { released: false as const, saleId, reason: "not_found" as const };

    // Wallet first (lock order), then read the sale and its order as they are now.
    await tx.execute(sql`SELECT id FROM tallaby_pay_wallets WHERE id = ${head.wallet_id} FOR UPDATE`);
    const [row] = await tx.execute<ReleaseRow>(sql`
      SELECT s.status, s.refund_state, s.hold_days, s.net::text AS net, s.release_at::text AS release_at,
             o.status::text AS order_status,
             (extract(epoch FROM o.delivered_at) * 1000)::float8 AS delivered_ms,
             (extract(epoch FROM now()) * 1000)::float8 AS now_ms
        FROM tallaby_pay_sales s
        LEFT JOIN orders o ON o.id = s.order_id
       WHERE s.id = ${saleId}
    `);
    const block = tallabyPayReleaseBlock({
      saleStatus: row!.status,
      refundState: row!.refund_state,
      orderStatus: row!.order_status,
      deliveredAtMs: row!.delivered_ms === null ? null : Number(row!.delivered_ms),
      holdDays: Number(row!.hold_days),
      nowMs: Number(row!.now_ms),
    });
    if (block) {
      // A future hold: remember when it releases (the seller's page shows it).
      if (block === "hold" && row!.release_at === null) await stampReleaseAt(tx, saleId);
      return { released: false as const, saleId, reason: block };
    }

    const [claimed] = await tx.execute<{ net: string }>(sql`
      UPDATE tallaby_pay_sales s
         SET status = 'available',
             release_at = coalesce(s.release_at, o.delivered_at + make_interval(days => s.hold_days)),
             released_at = now(),
             updated_at = now()
        FROM orders o
       WHERE s.id = ${saleId} AND o.id = s.order_id AND s.status = 'pending' AND s.refund_state IS NULL
      RETURNING s.net::text AS net
    `);
    if (!claimed) return { released: false as const, saleId, reason: "not_pending" as const };

    const net = amountToPiastres(claimed.net);
    if (net > 0) {
      await postTallabyPayEntry(tx, {
        storeId: head.store_id,
        sellerId: head.seller_id,
        kind: "release",
        pendingPiastres: -net,
        availablePiastres: net,
        saleId,
        referenceType: "sale",
        referenceId: saleId,
        description: "Order delivered",
        metadata: { orderId: head.order_id },
      });
    }
    return { released: true as const, saleId };
  });
}

async function stampReleaseAt(tx: Tx, saleId: string): Promise<void> {
  await tx.execute(sql`
    UPDATE tallaby_pay_sales s
       SET release_at = o.delivered_at + make_interval(days => s.hold_days), updated_at = now()
      FROM orders o
     WHERE s.id = ${saleId} AND o.id = s.order_id AND s.release_at IS NULL AND o.delivered_at IS NOT NULL
  `);
}

/**
 * The delivered hook (applySellerShipmentStatus, after its transaction
 * commits): releases the order's pending sales. Never throws, so it can never
 * undo or block the status change; the hourly cron retries anything missed.
 * A no-op for an order with no Tallaby Pay sale (one indexed read).
 */
export async function releaseTallabyPayOrderOnDelivery(orderId: string, q: typeof db = db): Promise<number> {
  if (!isUuid(orderId)) return 0;
  try {
    const sales = await q.execute<{ id: string }>(sql`
      SELECT id FROM tallaby_pay_sales WHERE order_id = ${orderId} AND status = 'pending' AND refund_state IS NULL
    `);
    let released = 0;
    for (const sale of sales) {
      if ((await releaseTallabyPaySale(sale.id, q)).released) released += 1;
    }
    return released;
  } catch (error) {
    console.error("[tallaby-pay] release on delivery failed; the cron will retry", {
      orderId,
      error: (error as Error)?.name,
    });
    return 0;
  }
}

export interface ReleaseDueTallabyPaySalesResult {
  due: number;
  released: number;
  failed: number;
}

/**
 * The hourly safety net (`/api/cron/tallaby-pay-release`, ecommerce): every
 * pending sale with no refund request whose order is delivered and whose
 * `delivered_at + hold_days` has passed is released, one transaction each.
 * Pending sales of delivered orders still on hold get their `release_at`.
 */
export async function releaseDueTallabyPaySales(
  options: { limit?: number } = {},
  q: typeof db = db,
): Promise<ReleaseDueTallabyPaySalesResult> {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 500), 1), 2_000);
  await q.execute(sql`
    UPDATE tallaby_pay_sales s
       SET release_at = o.delivered_at + make_interval(days => s.hold_days), updated_at = now()
      FROM orders o
     WHERE o.id = s.order_id AND s.status = 'pending' AND s.refund_state IS NULL AND s.release_at IS NULL
       AND o.status = 'delivered' AND o.delivered_at IS NOT NULL
  `);
  const due = await q.execute<{ id: string }>(sql`
    SELECT s.id
      FROM tallaby_pay_sales s
      JOIN orders o ON o.id = s.order_id
     WHERE s.status = 'pending' AND s.refund_state IS NULL
       AND o.status = 'delivered' AND o.delivered_at IS NOT NULL
       AND o.delivered_at + make_interval(days => s.hold_days) <= now()
     ORDER BY s.paid_at
     LIMIT ${limit}
  `);
  let released = 0;
  let failed = 0;
  for (const sale of due) {
    try {
      if ((await releaseTallabyPaySale(sale.id, q)).released) released += 1;
    } catch (error) {
      failed += 1;
      console.error("[tallaby-pay] release failed", { saleId: sale.id, error: (error as Error)?.name });
    }
  }
  return { due: due.length, released, failed };
}

// ---------------------------------------------------------------------------
// Seller: cancel and refund (a refund request for Admin)
// ---------------------------------------------------------------------------

/**
 * The order's pending Tallaby Pay sales of this seller that can still get a
 * refund request (no request yet). The dashboard uses it to route a cancel to
 * "cancel and refund".
 */
export async function countOpenTallabyPaySales(q: Queryable, orderId: string, sellerId: string): Promise<number> {
  if (!isUuid(orderId) || !isUuid(sellerId)) return 0;
  const [row] = await q.execute<{ n: number }>(sql`
    SELECT count(*)::int AS n FROM tallaby_pay_sales
     WHERE order_id = ${orderId} AND seller_id = ${sellerId.toLowerCase()}
       AND status = 'pending' AND refund_state IS NULL
  `);
  return Number(row?.n ?? 0);
}

/**
 * Opens a refund request on the order's pending sales, inside the caller's
 * transaction (the seller's cancel). The money stays pending, and can never
 * release, until an admin refunds the buyer. Returns the sale ids it flagged.
 */
export async function requestTallabyPayOrderRefund(
  tx: Tx,
  input: { orderId: string; sellerId: string; requestedBy: string | null; reason: string },
): Promise<string[]> {
  const rows = await tx.execute<{ id: string }>(sql`
    UPDATE tallaby_pay_sales
       SET refund_state = 'requested', refund_requested_at = now(), refund_requested_by = ${input.requestedBy},
           refund_reason = ${input.reason.slice(0, 500)}, updated_at = now()
     WHERE order_id = ${input.orderId} AND seller_id = ${input.sellerId.toLowerCase()}
       AND status = 'pending' AND refund_state IS NULL
    RETURNING id
  `);
  return rows.map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Admin: refund a sale before delivery
// ---------------------------------------------------------------------------

export type TallabyPayRefundError =
  | "not_admin"
  | "invalid_input"
  | "not_found"
  | "already_reviewed"
  | "own_account"
  | "delivered";

export const TALLABY_PAY_REFUND_ERROR_MESSAGES: Record<TallabyPayRefundError | "generic", string> = {
  not_admin: "You don't have permission to manage Tallaby Pay.",
  invalid_input: "Check the form: a reason (at least 3 characters) is required, and a reference is 2–120 characters.",
  not_found: "This sale no longer exists.",
  already_reviewed: "This sale was already refunded by someone else.",
  own_account: "You can't review your own account.",
  delivered: "This order was delivered, so the seller refunds the customer. Tallaby changes nothing.",
  generic: "Something went wrong. Try again.",
};

function cleanText(value: unknown, min: number, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().replace(/\s+/g, " ");
  return t.length >= min && t.length <= max ? t : null;
}

type RefundSaleRow = {
  id: string;
  wallet_id: string;
  store_id: string;
  seller_id: string;
  order_id: string | null;
  purpose: "order" | "deposit";
  easykash_ref: string;
  gross: string;
  net: string;
  status: string;
  refund_reason: string | null;
};

/**
 * Records a refund the team made in Tallaby's EasyKash account, before the
 * order was delivered: the sale becomes `refunded` (its fee leaves the Fees
 * box), the `refund` entry takes its net out of pending, the order's payment
 * and the EasyKash payment row become `refunded`, and admin_audit_log gets
 * the reason. Refused once the order was delivered (owner, 2026-11-18).
 */
export async function refundTallabyPaySale(
  args: { saleId: string; adminId: string; reason: string; reference?: string | null },
  q: typeof db = db,
): Promise<TallabyPayResult<{ saleId: string }, TallabyPayRefundError>> {
  const reason = cleanText(args.reason, ADMIN_REASON_MIN, ADMIN_REASON_MAX);
  const reference = args.reference == null || args.reference === "" ? null : cleanText(args.reference, 2, 120);
  if (!isUuid(args.saleId) || !isUuid(args.adminId) || !reason || (args.reference && !reference)) {
    return { success: false, error: "invalid_input" };
  }
  try {
    return await q.transaction(async (tx) => {
      await assertAdminActor(tx, args.adminId);
      const [sale] = await tx.execute<RefundSaleRow>(sql`
        SELECT id, wallet_id, store_id, seller_id, order_id, purpose, easykash_ref, gross::text AS gross, net::text AS net,
               status, refund_reason
          FROM tallaby_pay_sales WHERE id = ${args.saleId}
      `);
      if (!sale) throw new Failure<TallabyPayRefundError>("not_found");
      if (sale.seller_id === args.adminId.toLowerCase()) throw new Failure<TallabyPayRefundError>("own_account");

      // Lock order: wallet, order (a delivery committing now is seen), then the sale claim.
      await tx.execute(sql`SELECT id FROM tallaby_pay_wallets WHERE id = ${sale.wallet_id} FOR UPDATE`);
      const [order] = sale.order_id
        ? await tx.execute<{ status: string | null; delivered_at: string | null }>(sql`
            SELECT status::text AS status, delivered_at::text AS delivered_at FROM orders WHERE id = ${sale.order_id} FOR UPDATE
          `)
        : [];
      const [now] = await tx.execute<{ status: string }>(sql`SELECT status FROM tallaby_pay_sales WHERE id = ${sale.id}`);
      const block = tallabyPayRefundBlock({
        saleStatus: now!.status,
        orderStatus: order?.status ?? null,
        orderDeliveredAt: order?.delivered_at ?? null,
      });
      if (block === "already_refunded") throw new Failure<TallabyPayRefundError>("already_reviewed");
      if (block) throw new Failure<TallabyPayRefundError>(block);

      const [claimed] = await tx.execute<{ id: string }>(sql`
        UPDATE tallaby_pay_sales
           SET status = 'refunded', refunded_at = now(), refunded_by = ${args.adminId}, refund_reference = ${reference},
               refund_reason_admin = ${reason}, refund_state = NULL, updated_at = now()
         WHERE id = ${sale.id} AND status = 'pending'
        RETURNING id
      `);
      if (!claimed) throw new Failure<TallabyPayRefundError>("already_reviewed");

      const net = amountToPiastres(sale.net);
      if (net > 0) {
        await postTallabyPayEntry(tx, {
          storeId: sale.store_id,
          sellerId: sale.seller_id,
          kind: "refund",
          pendingPiastres: -net,
          saleId: sale.id,
          referenceType: "sale",
          referenceId: sale.id,
          description: "Refunded to the customer",
          metadata: { orderId: sale.order_id, reference },
          createdBy: args.adminId,
        });
      }

      if (sale.order_id) {
        if (sale.purpose === "order") {
          await tx.execute(sql`
            UPDATE orders SET payment_status = 'refunded', updated_at = now()
             WHERE id = ${sale.order_id} AND payment_status = 'paid'
          `);
        }
        // The EasyKash payment row (paid, or pending for review after a cancel).
        await tx.execute(sql`
          UPDATE payments SET status = 'refunded', updated_at = now()
           WHERE order_id = ${sale.order_id} AND transaction_id = ${`tallaby_pay:${sale.easykash_ref}`}
             AND status IN ('paid', 'pending')
        `);
      }

      await writeAdminAudit(tx, {
        actorId: args.adminId,
        sellerId: sale.seller_id,
        storeId: sale.store_id,
        action: "tallaby_pay_sale_refunded",
        before: { status: "pending", gross: sale.gross, net: sale.net, refundReason: sale.refund_reason },
        after: { status: "refunded", saleId: sale.id, orderId: sale.order_id, reference },
        reason,
      });
      return { success: true as const, data: { saleId: sale.id } };
    });
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof Failure) return { success: false, error: error.code as TallabyPayRefundError };
    throw error;
  }
}
