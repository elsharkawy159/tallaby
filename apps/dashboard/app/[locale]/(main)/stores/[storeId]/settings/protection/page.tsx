import { listStoreBlockedPhones } from "@workspace/lib/stores/blocked-phones/server";
import { parseStoreOrderCountries, storeSellingCountries } from "@workspace/lib/stores/order-countries";
import { db, eq, storeShippingZones } from "@workspace/db";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { parseOrderConfirmTemplate } from "../../../../orders/order-confirm.lib";
import { BlockedCustomersSettings } from "./protection.client";
import { OrderConfirmTemplateSettings } from "./order-confirm-template.client";
import { StoreOrderCountriesSettings } from "./order-countries.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Store settings › Order protection (ROADMAP.md F-02): WhatsApp confirm message, phone blocklist, orders from my country only (F-115 A5). */
export default async function StoreOrderProtectionPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  // The store was checked against the session by loadStorePage; zones are read by its id.
  const [rows, zones] = await Promise.all([
    listStoreBlockedPhones(store.id),
    db.select({ places: storeShippingZones.places, enabled: storeShippingZones.enabled }).from(storeShippingZones).where(eq(storeShippingZones.storeId, store.id)),
  ]);
  const readOnly = store.status !== "active";

  return (
    <div className="flex flex-col gap-4">
      <OrderConfirmTemplateSettings
        storeId={store.id}
        storeName={store.name}
        locale={store.defaultLocale === "en" ? "en" : "ar"}
        initial={parseOrderConfirmTemplate(store.settings)}
        readOnly={readOnly}
      />
      <BlockedCustomersSettings storeId={store.id} initial={rows} readOnly={readOnly} />
      <StoreOrderCountriesSettings
        storeId={store.id}
        initial={parseStoreOrderCountries(store.settings).enabled}
        countries={storeSellingCountries(zones)}
        readOnly={readOnly}
      />
    </div>
  );
}
