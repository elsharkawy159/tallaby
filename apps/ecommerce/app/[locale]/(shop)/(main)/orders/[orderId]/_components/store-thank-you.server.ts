import type { ProductSummary } from "@workspace/store-sections/render";
import { thankYouWhatsAppUrl, type StoreThankYou } from "@workspace/lib/stores/checkout-form";
import { resolveStoreCatalog } from "@/lib/store-site/catalog.server";
import { getStorefrontThankYou } from "@/lib/storefront-checkout-form.server";
import {
  catalogStoreId,
  getRequestStoreSubdomain,
  getStorefrontBySubdomain,
  type Storefront,
} from "@/lib/storefront.server";

/** Products suggested on the thank-you page. */
const SUGGESTED_COUNT = 4;

export type StoreThankYouView = {
  message: string;
  whatsappUrl: string | null;
  products: ProductSummary[];
  /** The store website's currency label, for the suggested prices. */
  currencyLabel: Storefront["currencyLabel"];
};

/**
 * The store's thank-you block for an order page (ROADMAP.md F-25b), or null
 * on the marketplace, for an order of another store, or when the seller
 * changed nothing (the page then stays exactly as before). The store comes
 * from the request host; the order must belong to it. The caller has already
 * checked the visitor may see the order.
 */
export async function getStoreThankYouView(input: {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderedProductIds: string[];
  locale: string;
}): Promise<StoreThankYouView | null> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return null;
  const store = await getStorefrontBySubdomain(subdomain);
  if (!store) return null;
  const found = await getStorefrontThankYou(input.orderId);
  if (!found || found.storeId !== store.storeId) return null;
  const settings: StoreThankYou = found.thankYou;

  // Confirming only makes sense while the order still waits for the store.
  const whatsappUrl =
    settings.whatsappButton && input.orderStatus === "pending"
      ? thankYouWhatsAppUrl({
          storePhone: store.supportWhatsapp || store.supportPhone,
          storeName: store.displayName,
          orderNumber: input.orderNumber,
          locale: input.locale,
        })
      : null;

  let products: ProductSummary[] = [];
  if (settings.suggestedProducts) {
    try {
      const ordered = new Set(input.orderedProductIds);
      const limit = SUGGESTED_COUNT + ordered.size;
      // The store's own best sellers first, then its newest products.
      const catalog = await resolveStoreCatalog(
        store.id,
        store.storeId,
        catalogStoreId(store),
        { best: { kind: "products", source: "best-sellers", limit }, newest: { kind: "products", source: "newest", limit } },
        input.locale,
      );
      const seen = new Set(ordered);
      for (const product of [...(catalog.products.best ?? []), ...(catalog.products.newest ?? [])]) {
        if (seen.has(product.id) || !product.inStock) continue;
        seen.add(product.id);
        products.push(product);
        if (products.length >= SUGGESTED_COUNT) break;
      }
    } catch (error) {
      // Suggestions never break the order page.
      console.error("[store-thank-you] suggestions failed", (error as Error)?.message);
      products = [];
    }
  }

  if (!settings.message && !whatsappUrl && products.length === 0) return null;
  return { message: settings.message, whatsappUrl, products, currencyLabel: store.currencyLabel };
}
