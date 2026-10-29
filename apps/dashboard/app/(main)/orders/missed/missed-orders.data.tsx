import { getTranslations } from "next-intl/server";
import { listStoreCheckoutLeads, listStoreLeadSettings } from "@workspace/lib/checkout-leads/server";
import type { LeadRange, LeadStatus } from "@workspace/lib/checkout-leads";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { MissedOrdersView } from "./missed-orders.client";

/**
 * Orders › Not completed (0120, ROADMAP.md F-03): open missed-order leads of
 * every store the session's seller owns, newest first. Read fresh on every
 * request (personal data, never cached).
 */
export async function MissedOrdersData({
  storeId,
  range,
  status,
}: {
  storeId: string | null;
  range: LeadRange;
  status: LeadStatus;
}) {
  const [seller, t] = await Promise.all([requireSeller(), getTranslations("missedOrders")]);
  const stores = await listStoreLeadSettings(seller.sellerId);
  // A store id from the URL counts only if it is one of this seller's stores.
  const selectedStore = storeId && stores.some((s) => s.storeId === storeId) ? storeId : null;
  const leads = await listStoreCheckoutLeads(seller.sellerId, { storeId: selectedStore, range, status });

  return (
    <section aria-label={t("title")} className="space-y-5">
      {/* No page title: the header breadcrumb already names the page. */}
      <p className="text-pretty text-sm text-muted-foreground">{t("description")}</p>
      <MissedOrdersView leads={leads} stores={stores} storeId={selectedStore} range={range} status={status} />
    </section>
  );
}
