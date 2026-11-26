import { sql } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { logServerError } from "../log";
import { AGED_FEE_CLOSED_LINE_STATUSES, AGED_FEE_CLOSED_ORDER_STATUSES, agedFeeCutoff } from "./aged-fee.lib";
import { chargeAgedOrderFee } from "./credit-seller-on-delivery";
import { readFeeOnDeliverySwitch } from "./fee-switch";
import { STORE_WALLET_REFERENCE_TYPES } from "./store-wallet";

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];
type Queryable = typeof dbType | Tx;

export const AGED_FEE_BATCH_SIZE = 500;
export const AGED_FEE_MAX_ORDERS_PER_RUN = 2000;

export type AgedOrderFeesResult = {
  switchOn: boolean;
  /** Orders the query picked. */
  scanned: number;
  /** Orders that posted at least one fee entry. */
  charged: number;
  /** Fee entries posted (one per seller). */
  entries: number;
  /** Orders that posted nothing (closed or already charged since the query ran). */
  unchanged: number;
  failed: number;
};

type Candidate = { id: string; created_at: string };

const list = (values: readonly string[]) => sql.join(values.map((value) => sql`${value}`), sql`, `);

/**
 * One page of orders that should pay through the job, oldest first: created
 * on or after the switch went on and at least 14 days ago, not a test order,
 * not closed (aged-fee.lib.ts), with at least one seller whose open part pays
 * a fee (a USD snapshot above zero, so Pro, exempt and trial parts are left
 * out), isn't held, and has no fee entry under the `order:<id>` claim yet.
 * Leaving out what can never pay keeps each run from re-reading it every day.
 * `chargeAgedOrderFee` checks everything again under a lock.
 */
async function nextCandidates(
  q: Queryable,
  since: string,
  cutoff: Date,
  after: Candidate | null,
  limit: number
): Promise<Candidate[]> {
  const held = sql`(o.metadata -> 'feeHolds' -> (oi.seller_id::text))`;
  const rows = await q.execute<Candidate>(sql`
    SELECT o.id, o.created_at::text AS created_at
      FROM orders o
     WHERE o.created_at >= ${since}::timestamptz
       AND o.created_at <= ${cutoff.toISOString()}::timestamptz
       ${after ? sql`AND (o.created_at, o.id) > (${after.created_at}::timestamptz, ${after.id}::uuid)` : sql``}
       AND o.is_test = false
       AND coalesce(o.status::text, 'pending') NOT IN (${list(AGED_FEE_CLOSED_ORDER_STATUSES)})
       AND coalesce(o.payment_status::text, 'pending') <> 'refunded'
       AND coalesce(o.metadata -> 'manualOrder' ->> 'awaitingCustomer', 'false') <> 'true'
       AND EXISTS (
         SELECT 1
           FROM order_items oi
          WHERE oi.order_id = o.id
            AND coalesce(oi.status::text, 'pending') NOT IN (${list(AGED_FEE_CLOSED_LINE_STATUSES)})
            AND coalesce(oi.is_refunded, false) = false
            AND coalesce((oi.metadata -> 'platformFee' ->> 'feeUsdCents')::numeric, 0) > 0
            AND (CASE WHEN jsonb_typeof(${held}) = 'array' THEN jsonb_array_length(${held}) > 0 ELSE false END) = false
            AND NOT EXISTS (
              SELECT 1 FROM seller_wallet w
               WHERE w.seller_id = oi.seller_id AND coalesce(w.currency, 'EGP') <> 'USD'
            )
            AND NOT EXISTS (
              SELECT 1 FROM wallet_transactions t
               WHERE t.seller_id = oi.seller_id
                 AND t.type = 'fee'
                 AND t.reference_type = ${STORE_WALLET_REFERENCE_TYPES.order}
                 AND t.reference_id = o.id::text
            )
       )
     ORDER BY o.created_at, o.id
     LIMIT ${limit}
  `);
  return [...rows];
}

/**
 * The daily 14-day job (owner, 2026-11-26; PLAN.md §13.3). While
 * `fee_on_delivery` is on, every order created since the switch went on that
 * is still not cancelled, returned or refunded 14 days after it was created
 * pays its fee, as if it had been delivered. Held (fake or duplicate) parts
 * still pay only on delivery. Does nothing while the switch is off.
 *
 * Each order runs in its own transaction (a savepoint when `q` is a
 * transaction), so one failure is logged as `[fee]` and the run goes on.
 * Idempotent: the `order:<id>` claim means a second run, or a delivery
 * meanwhile, never charges a seller twice.
 */
export async function chargeAgedOrderFees(
  q: Queryable,
  {
    now = new Date(),
    batchSize = AGED_FEE_BATCH_SIZE,
    maxOrders = AGED_FEE_MAX_ORDERS_PER_RUN,
  }: { now?: Date; batchSize?: number; maxOrders?: number } = {}
): Promise<AgedOrderFeesResult> {
  const result: AgedOrderFeesResult = { switchOn: false, scanned: 0, charged: 0, entries: 0, unchanged: 0, failed: 0 };
  const feeSwitch = await readFeeOnDeliverySwitch(q);
  if (!feeSwitch.on) return result;
  result.switchOn = true;
  // No time on the row: nothing is known to be created under the switch, so nothing is charged.
  if (!feeSwitch.changedAt) return result;

  const cutoff = agedFeeCutoff(now);
  let after: Candidate | null = null;
  while (result.scanned < maxOrders) {
    const page = await nextCandidates(q, feeSwitch.changedAt, cutoff, after, Math.min(batchSize, maxOrders - result.scanned));
    if (page.length === 0) break;
    for (const order of page) {
      result.scanned += 1;
      try {
        const posted = await q.transaction((tx) => chargeAgedOrderFee(tx as Tx, order.id));
        if (posted > 0) {
          result.charged += 1;
          result.entries += posted;
        } else {
          result.unchanged += 1;
        }
      } catch (error) {
        result.failed += 1;
        logServerError("fee", "aged fee failed", { orderId: order.id }, error);
      }
    }
    after = page[page.length - 1]!;
    if (page.length < batchSize) break;
  }
  return result;
}
