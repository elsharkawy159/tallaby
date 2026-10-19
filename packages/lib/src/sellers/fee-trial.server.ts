import { db, sql } from "@workspace/db";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type FeeTrialTrigger = "publish" | "product_active" | "admin";

/**
 * Starts the seller's 7-day no-fee trial if it is eligible and has not started
 * (PLAN.md §13.5). Runs in the caller's transaction. Returns true only for the
 * call that started it; republishing, later stores and retries never restart it.
 *
 * The rule lives in the SQL function `start_fee_trial_if_needed` (0067): the
 * window is always [first store created_at, + 7 days). A stores insert trigger
 * calls it, so the trial normally starts with the first store at signup; the
 * publish and product-active callers are no-ops after that.
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
