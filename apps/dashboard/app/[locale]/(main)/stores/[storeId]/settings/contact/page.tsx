import { getSellerProfile } from "@/lib/sellers/seller-profile.server";
import { loadStorePageAccess } from "@/lib/stores/store-page.server";
import { ContactSettingsForm } from "./contact.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Store settings › Business & contact (moved from /settings, owner 2026-11-27):
 * the seller account's business name and support email and phone. The store is
 * checked first (a foreign or deleted store is a 404); only these three fields
 * reach the browser.
 */
export default async function StoreContactPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await loadStorePageAccess(storeId);
  const profile = await getSellerProfile();
  if (!profile.success || !profile.data) throw new Error("Failed to load the seller's contact details");
  const { businessName, supportEmail, supportPhone } = profile.data;

  return <ContactSettingsForm initial={{ businessName, supportEmail, supportPhone }} />;
}
