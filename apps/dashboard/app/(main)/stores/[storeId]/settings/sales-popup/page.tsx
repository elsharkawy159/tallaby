import { parseStoreSalesPopup } from "@workspace/lib/stores/sales-popup";
import { storeUrl } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreSalesPopupSettings } from "./sales-popup.client";

/** Store settings › Sales pop-up (ROADMAP.md F-22): real recent orders as small toasts on the store website. */
export default async function StoreSalesPopupPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);

  return (
    <StoreSalesPopupSettings
      storeId={store.id}
      siteUrl={storeUrl(store.subdomain, null)}
      initial={parseStoreSalesPopup(store.settings)}
      readOnly={store.status !== "active"}
    />
  );
}
