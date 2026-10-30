import { getStoreShipping } from "@workspace/lib/stores/server";
import { getBostaOverview, getWassalhaOverview } from "@workspace/lib/integrations/server";
import { placeChain, placeLabel } from "@workspace/lib/places";
import {
  findZoneForPlace,
  templateZones,
  uncoveredGovernorates,
  type ShippingTemplate,
} from "@workspace/lib/shipping/store-zones";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { StoreShippingSettings } from "./shipping.client";
import type { TemplateOption, ZoneView } from "./shipping.dto";

export default async function StoreShippingPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const [shipping, bosta, wassalha] = await Promise.all([
    getStoreShipping(store.sellerId, store.id),
    getBostaOverview(store.sellerId, store.id),
    getWassalhaOverview(store.sellerId, store.id),
  ]);
  if (!shipping) notFound();

  const locale = await getLocale();
  // Template zone names are saved in both languages, so build them with both translators.
  const [tAr, tEn] = await Promise.all([
    getTranslations({ locale: "ar", namespace: "storeShipping" }),
    getTranslations({ locale: "en", namespace: "storeShipping" }),
  ]);

  const templates: TemplateOption[] = (["tallaby_rates", "egypt_flat", "cairo_giza"] as const satisfies ShippingTemplate[]).map(
    (id) => {
      if (id === "egypt_flat") {
        return { id, names: [{ nameAr: tAr("templates.egyptFlat.zoneName"), nameEn: tEn("templates.egyptFlat.zoneName") }], prices: null };
      }
      const groups = templateZones(id, {});
      const names = groups.map((g) =>
        id === "tallaby_rates"
          ? { nameAr: tAr("defaultZoneName", { price: g.price }), nameEn: tEn("defaultZoneName", { price: g.price }) }
          : { nameAr: tAr("templates.cairoGiza.zoneName"), nameEn: tEn("templates.cairoGiza.zoneName") },
      );
      const prices = groups.map((g) => g.price);
      return { id, names, prices: { min: Math.min(...prices), max: Math.max(...prices) } };
    },
  );

  // Labels and "overrides" hints are computed here so the list needs no place data in the browser.
  const zones: ZoneView[] = shipping.zones.map((zone) => {
    let overrides: string | null = null;
    if (zone.enabled) {
      const others = shipping.zones.filter((z) => z.id !== zone.id);
      for (const place of zone.places) {
        const parent = placeChain(place)[1];
        const found = parent ? findZoneForPlace(others, parent) : null;
        if (found) {
          overrides = (!locale.startsWith("ar") && found.zone.nameEn) || found.zone.nameAr;
          break;
        }
      }
    }
    return { zone, chips: zone.places.map((key) => ({ key, label: placeLabel(key, locale) })), overrides };
  });
  const uncovered = shipping.zones.some((z) => z.enabled)
    ? uncoveredGovernorates(shipping.zones).map((g) => placeLabel(`EG/${g}`, locale))
    : [];

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <StoreShippingSettings
        storeId={store.id}
        settings={shipping.settings}
        zones={zones}
        uncovered={uncovered}
        templates={templates}
        bosta={bosta}
        wassalha={wassalha}
        readOnly={store.status !== "active"}
      />
    </section>
  );
}
