import { db, sql } from "@workspace/db";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type FeeTrialTrigger = "publish" | "product_active" | "admin";

/**
 * Starts the seller's 30-day no-fee trial if it is eligible and has not started
 * (PLAN.md §13.5, D20, P6-03). Runs in the caller's transaction. Returns true
 * only for the call that started it; republishing, later stores and retries
 * never restart it.
 *
 * The rule lives in the SQL function `start_fee_trial_if_needed` (0059), which
 * a products trigger also calls when a product first becomes active, so every
 * activation path (dashboard, admin approval, imports) is covered.
 */
export async function startFeeTrialIfNeeded(
  q: Queryable,
  sellerId: string,
  trigger: FeeTrialTrigger,
): Promise<boolean> {
  const rows = await q.execute<{ started: boolean }>(
    sql`SELECT start_fee_trial_if_needed(${sellerId}::uuid, ${trigger}) AS started`,
  );
  return rows[0]?.started === true;
}
