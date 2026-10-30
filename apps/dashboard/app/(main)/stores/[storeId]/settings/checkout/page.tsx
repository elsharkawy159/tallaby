import { parseStoreCheckoutForm, parseStoreThankYou } from "@workspace/lib/stores/checkout-form";
import { parseStoreMinOrder } from "@workspace/lib/stores/min-order";
import { storeUrl } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreCheckoutSettingsForm } from "./checkout-settings.client";
import { StoreMinOrderForm } from "./min-order.client";

/** Store settings › Checkout (ROADMAP.md F-25, F-13b): minimum order, extra checkout fields and the thank-you page. */
export default async function StoreCheckoutSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const contact = (store.contact ?? {}) as { whatsapp?: string; phone?: string };
  const readOnly = store.status !== "active";

  return (
    <div className="space-y-5">
      <StoreMinOrderForm storeId={store.id} initial={parseStoreMinOrder(store.settings)} readOnly={readOnly} />
      <StoreCheckoutSettingsForm
        storeId={store.id}
        siteUrl={storeUrl(store.subdomain, null)}
        initial={{ checkoutForm: parseStoreCheckoutForm(store.settings), thankYou: parseStoreThankYou(store.settings) }}
        hasWhatsapp={Boolean(contact.whatsapp || contact.phone)}
        readOnly={readOnly}
      />
    </div>
  );
}
