import { and, db, eq, storeIntegrations } from "@workspace/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether the sidebar shows Finance › Tallaby Pay earnings for this store: only while the store has
 * Tallaby Pay turned on as a payment method (its `tallaby_pay` row is `connected`; turning it off keeps
 * the row as `disconnected`). The earnings page itself stays open by URL (owner, 2026-11-27).
 * Scoped to the seller and the store (CLAUDE.md rule 5); never cached (rule 8).
 */
export async function storeHasTallabyPayOn(sellerId: string, storeId: string): Promise<boolean> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return false;
  const [row] = await db
    .select({ id: storeIntegrations.id })
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.sellerId, sellerId),
        eq(storeIntegrations.provider, "tallaby_pay"),
        eq(storeIntegrations.status, "connected"),
      ),
    )
    .limit(1);
  return Boolean(row);
}
