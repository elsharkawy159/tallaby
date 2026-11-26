import { eq } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { platformSwitches } from "../drizzle/schema";

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];
type Queryable = Tx | typeof dbType;

/**
 * The `fee_on_delivery` platform switch (owner, 2026-11-26; PLAN.md §13.3).
 * The same key is listed in `PLATFORM_SWITCHES` (packages/lib, which this
 * package can't import; a lib test checks they match). Off (no row, the
 * default): the fee is taken when the order is created, or when a card order
 * is paid. On: those charges are skipped, and the fee is taken when the order
 * is delivered, or by the daily job 14 days after an order created since
 * `changed_at` that was never closed.
 */
export const FEE_ON_DELIVERY_SWITCH = "fee_on_delivery";

export type FeeOnDeliverySwitch = { on: boolean; changedAt: string | null };

/**
 * Read fresh, never cached (CLAUDE.md rule 8). Pass the caller's transaction
 * so the read sees the same snapshot as the fee it decides. Only a stored
 * `true` is on; a missing row is off.
 */
export async function readFeeOnDeliverySwitch(q: Queryable): Promise<FeeOnDeliverySwitch> {
  const [row] = await q
    .select({ enabled: platformSwitches.enabled, changedAt: platformSwitches.changedAt })
    .from(platformSwitches)
    .where(eq(platformSwitches.key, FEE_ON_DELIVERY_SWITCH))
    .limit(1);
  return { on: row?.enabled === true, changedAt: row?.changedAt ?? null };
}
