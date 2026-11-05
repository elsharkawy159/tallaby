import { parseStoreCheckoutForm, parseStoreThankYou } from "@workspace/lib/stores/checkout-form";
import { parseStoreCurrency } from "@workspace/lib";
import { parseStoreMinOrder } from "@workspace/lib/stores/min-order";
import { storeUrl } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreCheckoutSettingsForm } from "./checkout-settings.client";
import { StoreCrossSellSwitch } from "./cross-sell-switch.client";

/** Store settings › Checkout (ROADMAP.md F-25, F-13b): minimum order, extra checkout fields and the thank-you page. */
export default async function StoreCheckoutSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const contact = (store.contact ?? {}) as { whatsapp?: string; phone?: string };
  const readOnly = store.status !== "active";

  return (
    <div className="flex flex-col gap-4">
      <StoreCheckoutSettingsForm
        storeId={store.id}
        siteUrl={storeUrl(store.subdomain, null)}
        money={parseStoreCurrency(store.settings)}
        initialMinOrder={parseStoreMinOrder(store.settings)}
        initial={{ checkoutForm: parseStoreCheckoutForm(store.settings), thankYou: parseStoreThankYou(store.settings) }}
        hasWhatsapp={Boolean(contact.whatsapp || contact.phone)}
        readOnly={readOnly}
      />
      {/* Saves at once, as it always did, so it stays outside the save bar's form. */}
      <StoreCrossSellSwitch storeId={store.id} initial={store.crossSellEnabled} readOnly={readOnly} />
    </div>
  );
}
