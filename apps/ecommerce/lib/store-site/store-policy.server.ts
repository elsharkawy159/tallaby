import { db, eq, sellers } from "@workspace/db";
import { policyTextFor, type StorePolicyKind } from "./store-policy.lib";

/**
 * The seller's saved policy text (Settings; sellers.return_policy and
 * shipping_policy, kept per account since 0065). Read fresh: these pages get
 * little traffic, and a seller's edit should show straight away.
 */
export async function loadStorePolicyText(sellerId: string, kind: StorePolicyKind): Promise<string | null> {
  if (kind !== "returns" && kind !== "shipping") return null;
  const [row] = await db
    .select({ returnPolicy: sellers.returnPolicy, shippingPolicy: sellers.shippingPolicy })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);
  return policyTextFor(kind, row);
}
