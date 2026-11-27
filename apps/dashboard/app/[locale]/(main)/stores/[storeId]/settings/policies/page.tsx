import { getSellerProfile } from "@/lib/sellers/seller-profile.server";
import { loadStorePageAccess } from "@/lib/stores/store-page.server";
import { PoliciesSection } from "./policies.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Store settings › Policies (F-46c; moved from /settings, owner 2026-11-27).
 * The text is the seller account's (`sellers.return_policy` …), shown on every
 * store; the action writes the session seller only. The store is checked first
 * (a foreign or deleted store is a 404).
 */
export default async function StorePoliciesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await loadStorePageAccess(storeId);
  const profile = await getSellerProfile();
  if (!profile.success || !profile.data) throw new Error("Failed to load the seller's policies");
  const { returnPolicy, shippingPolicy, privacyPolicy } = profile.data;

  return <PoliciesSection returnPolicy={returnPolicy} shippingPolicy={shippingPolicy} privacyPolicy={privacyPolicy} />;
}
