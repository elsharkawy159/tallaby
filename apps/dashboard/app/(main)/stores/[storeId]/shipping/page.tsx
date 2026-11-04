import { DEFAULT_CURRENCY, parseStoreCurrency } from "@workspace/lib";
import { getStoreShipping } from "@workspace/lib/stores/server";
import { getBostaOverview, getWassalhaOverview } from "@workspace/lib/integrations/server";
import { childrenOf, EGYPT, placeChain, placeLabel } from "@workspace/lib/places";
import {
  findZoneForPlace,
  templateZones,
  ZONE_GOVERNORATES,
  type ShippingTemplate,
} from "@workspace/lib/shipping/store-zones";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { StoreShippingSettings } from "./shipping.client";
import { currencyCountry, type CoverageItem, type TemplateOption, type ZoneView } from "./shipping.dto";

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
  const money = parseStoreCurrency(store.settings);
  // Egypt's governorates and Tallaby's rates are Egyptian: another currency starts from its own country.
  const egyptian = money.currency === DEFAULT_CURRENCY;
  const country = currencyCountry(money.currency);
  // Template zone names are saved in both languages, so build them with both translators.
  const [tAr, tEn] = await Promise.all([
    getTranslations({ locale: "ar", namespace: "storeShipping" }),
    getTranslations({ locale: "en", namespace: "storeShipping" }),
  ]);

  const templates: TemplateOption[] = (egyptian ? (["tallaby_rates", "egypt_flat", "cairo_giza"] as const satisfies ShippingTemplate[]) : []).map(
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

  const enabledZones = shipping.zones.filter((z) => z.enabled);
  const coverageKeys = egyptian ? ZONE_GOVERNORATES.map((g) => `${EGYPT}/${g}`) : country ? childrenOf(country).map((p) => p.key) : [];
  const coverage: CoverageItem[] = coverageKeys.map((key) => {
    const found = findZoneForPlace(enabledZones, key);
    return {
      key,
      label: placeLabel(key, locale),
      price: found ? found.zone.price : null,
      zoneName: found ? (!locale.startsWith("ar") && found.zone.nameEn) || found.zone.nameAr : null,
      partial: !found && enabledZones.some((z) => z.places.some((place) => place.startsWith(`${key}/`))),
    };
  });

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <StoreShippingSettings
        storeId={store.id}
        settings={shipping.settings}
        money={money}
        country={country}
        countryName={country && !egyptian ? placeLabel(country, locale) : null}
        zones={zones}
        coverage={coverage}
        templates={templates}
        bosta={bosta}
        wassalha={wassalha}
        readOnly={store.status !== "active"}
      />
    </section>
  );
}
