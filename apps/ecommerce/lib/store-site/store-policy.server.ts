import { db, eq, sellers } from "@workspace/db";
import { policyTextFor, type StorePolicyKind } from "./store-policy.lib";

/**
 * The seller's saved policy text (Settings; sellers.return_policy,
 * shipping_policy and privacy_policy, kept per account). Read fresh: these pages get
 * little traffic, and a seller's edit should show straight away.
 */
export async function loadStorePolicyText(sellerId: string, kind: StorePolicyKind): Promise<string | null> {
  if (kind === "contact" || kind === "terms") return null;
  const [row] = await db
    .select({ returnPolicy: sellers.returnPolicy, shippingPolicy: sellers.shippingPolicy, privacyPolicy: sellers.privacyPolicy })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);
  return policyTextFor(kind, row);
}
