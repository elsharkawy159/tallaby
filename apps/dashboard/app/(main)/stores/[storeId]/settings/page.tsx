import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreGeneralForm } from "./store-general.client";
import type { StoreGeneralFormValues } from "./store-settings.dto";

export default async function StoreGeneralSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const contact = (store.contact ?? {}) as Record<string, string | undefined>;
  const locales = store.supportedLocales.filter((l): l is "ar" | "en" => l === "ar" || l === "en");

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
  };

  return <StoreGeneralForm storeId={store.id} initial={initial} readOnly={store.status !== "active"} />;
}
