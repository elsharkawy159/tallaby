import { notFound } from "next/navigation";
import { parseStoreCurrency } from "@workspace/lib";
import { STORE_CATALOG_MAX_PRODUCTS } from "@workspace/lib/stores";
import { getStoreCatalog } from "@workspace/lib/stores/server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreGeneralForm } from "./store-general.client";
import { loadCatalogProducts } from "./catalog.data";
import type { StoreGeneralFormValues } from "./store-settings.dto";

export default async function StoreGeneralSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const [catalog, catalogProducts] = await Promise.all([
    getStoreCatalog(store.sellerId, store.id),
    loadCatalogProducts(store.sellerId, store.id),
  ]);
  if (!catalog) notFound();
  const contact = (store.contact ?? {}) as Record<string, string | undefined>;
  const locales = store.supportedLocales.filter((l): l is "ar" | "en" => l === "ar" || l === "en");
  const readOnly = store.status !== "active";
  const currency = parseStoreCurrency(store.settings);

  const initial: StoreGeneralFormValues = {
    name: store.name,
    description: store.description ?? "",
    storeCategory: store.storeCategory ?? "",
    storeCategoryAr: store.storeCategoryAr ?? "",
    logoUrl: store.logoUrl ?? "",
    bannerUrl: store.bannerUrl ?? "",
    phone: contact.phone ?? "",
    whatsapp: contact.whatsapp ?? "",
    email: contact.email ?? "",
    defaultLocale: store.defaultLocale === "en" ? "en" : "ar",
    supportedLocales: locales.length ? locales : ["ar", "en"],
    currency: currency.currency,
    currencyLabel: currency.label,
  };

  return (
    <StoreGeneralForm
      storeId={store.id}
      initial={initial}
      readOnly={readOnly}
      // The logo is always edited here; builder sellers edit the banner (and
      // favicon) in Website › Design system.
      brandInSettings={!storeBuilderEnabled(store.sellerId)}
      // Which of the seller's products this store shows (D24); moved here from /catalog.
      catalog={{
        initialMode: catalog.mode,
        initialSelected: catalog.productIds,
        products: catalogProducts,
        maxProducts: STORE_CATALOG_MAX_PRODUCTS,
      }}
    />
  );
}
