import { listStoreBlockedPhones } from "@workspace/lib/stores/blocked-phones/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { parseOrderConfirmTemplate } from "../../../../orders/order-confirm.lib";
import { BlockedCustomersSettings } from "./protection.client";
import { OrderConfirmTemplateSettings } from "./order-confirm-template.client";

/** Store settings › Order protection (ROADMAP.md F-02): WhatsApp confirm message + phone blocklist. */
export default async function StoreOrderProtectionPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const rows = await listStoreBlockedPhones(store.id);
  const readOnly = store.status !== "active";

  return (
    <div className="space-y-5">
      <OrderConfirmTemplateSettings
        storeId={store.id}
        storeName={store.name}
        locale={store.defaultLocale === "en" ? "en" : "ar"}
        initial={parseOrderConfirmTemplate(store.settings)}
        readOnly={readOnly}
      />
      <BlockedCustomersSettings storeId={store.id} initial={rows} readOnly={readOnly} />
    </div>
  );
}
