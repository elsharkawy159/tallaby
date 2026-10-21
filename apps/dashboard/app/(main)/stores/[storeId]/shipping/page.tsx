import { getStoreShipping } from "@workspace/lib/stores/server";
import { defaultZoneGroups } from "@workspace/lib/shipping/store-zones";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { StoreShippingSettings } from "./shipping.client";

export default async function StoreShippingPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const shipping = await getStoreShipping(store.sellerId, store.id);
  if (!shipping) notFound();

  // Default seller-delivery rates = Tallaby's rates (owner, 2026-10-21). Zone
  // names are saved in both languages, so build them with both translators.
  const [tAr, tEn] = await Promise.all([
    getTranslations({ locale: "ar", namespace: "storeShipping" }),
    getTranslations({ locale: "en", namespace: "storeShipping" }),
  ]);
  const defaultZones = defaultZoneGroups().map((g) => ({
    ...g,
    nameAr: tAr("defaultZoneName", { price: g.price }),
    nameEn: tEn("defaultZoneName", { price: g.price }),
  }));

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <StoreShippingSettings
        storeId={store.id}
        initial={shipping}
        defaultZones={defaultZones}
        readOnly={store.status !== "active"}
      />
    </section>
  );
}
