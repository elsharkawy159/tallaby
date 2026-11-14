import { childrenOf, EGYPT } from "@workspace/lib/places";
import { zoneCountries } from "@workspace/lib/shipping/store-quote";
import { findZoneForPlace, quoteZone, type StoreShippingSettings, type ZoneForQuote } from "@workspace/lib/shipping/store-zones";

/**
 * Google merchant listing `shippingDetails` for one product of a store, from
 * the store's own delivery zones (Store settings › Shipping).
 *
 * Google Search only reads a region (`addressRegion`) for the US, Australia
 * and Japan, so a destination here is a whole country. A country is listed
 * only when one price is true for every place in it: every region is covered
 * by an enabled zone, and every zone reaching it (region and city zones too)
 * costs the same for this product. A store with different prices per
 * governorate (Tallaby's default zone groups) therefore lists none for Egypt:
 * one per zone would give Google several prices for the same country, and the
 * cheapest would promise less than checkout bills. Places no zone covers that
 * checkout bills at Tallaby's weight-based rates are not known here either,
 * so they also leave the country out.
 *
 * The price is what checkout charges one unit (`resolveStorefrontShipping`):
 * the zone's flat price, free at or over its own free-over, else the store-wide
 * free delivery; free everywhere when the seller has free delivery on.
 *
 * Egyptian places billed at Tallaby's rates (a store with no zones, places no
 * zone covers with `otherPlaces: "tallaby_rates"`, or Tallaby delivery) cost
 * per governorate and per kilo, so they have one price only when the seller
 * has free delivery on (`sellers.free_delivery` waives the whole shipment at
 * checkout): Egypt is then listed free. Those places have no delivery days,
 * so such an entry has no `deliveryTime` rather than made-up days.
 */

export type OfferShippingDetails = {
  "@type": "OfferShippingDetails";
  shippingRate: { "@type": "MonetaryAmount"; value: number; currency: string };
  shippingDestination: { "@type": "DefinedRegion"; addressCountry: string };
  deliveryTime?: {
    "@type": "ShippingDeliveryTime";
    handlingTime: { "@type": "QuantitativeValue"; minValue: number; maxValue: number; unitCode: "DAY" };
    transitTime: { "@type": "QuantitativeValue"; minValue: number; maxValue: number; unitCode: "DAY" };
  };
};

export type OfferShippingInput = {
  settings: StoreShippingSettings;
  zones: ZoneForQuote[];
  /** The store's currency: zone prices are in it. */
  currency: string;
  /** The price of one unit as the offer shows it. */
  price: number;
  /** `sellers.free_delivery`: checkout waives a zone's price for the seller's physical items. */
  sellerFreeDelivery: boolean;
  /** Digital products ship nothing. */
  digital: boolean;
};

const day = (minValue: number, maxValue: number) =>
  ({ "@type": "QuantitativeValue", minValue, maxValue, unitCode: "DAY" }) as const;

export function offerShippingDetails(input: OfferShippingInput): OfferShippingDetails[] {
  const { settings, currency, price, sellerFreeDelivery, digital } = input;
  if (digital) return [];
  // Tallaby's rates are for Egypt in EGP; only the seller's free delivery gives them one price (0).
  const freeAtTallabyRates = sellerFreeDelivery && currency === "EGP";
  const freeEgypt = (): OfferShippingDetails => ({
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: EGYPT },
  });
  if (settings.method !== "own") return freeAtTallabyRates ? [freeEgypt()] : [];
  const zones = input.zones.filter((z) => z.enabled);
  // No zones: checkout bills Tallaby's rates for every Egyptian address.
  if (!zones.length) return freeAtTallabyRates ? [freeEgypt()] : [];

  const ratePiastres = (zone: ZoneForQuote) =>
    sellerFreeDelivery ? 0 : quoteZone({ price: zone.price, freeOver: zone.freeOver ?? settings.freeShippingOver }, price).amountPiastres;

  const details: OfferShippingDetails[] = [];
  for (const country of zoneCountries(zones)) {
    const regions = childrenOf(country).filter((p) => p.level === "region").map((p) => p.key);
    const targets = regions.length ? regions : [country];
    const used = new Set<ZoneForQuote>();
    // Some region no zone covers bills Tallaby's rates, waived by the seller's free delivery.
    let atTallabyRates = false;
    let covered = true;
    for (const target of targets) {
      const found = findZoneForPlace(zones, target);
      if (found) {
        used.add(found.zone);
        continue;
      }
      if (country === EGYPT && settings.otherPlaces === "tallaby_rates" && freeAtTallabyRates) {
        atTallabyRates = true;
        continue;
      }
      covered = false;
      break;
    }
    if (!covered) continue;
    // Zones for a smaller part of the country (a city, or a region of a
    // country without region data) charge there instead, so they count too.
    for (const zone of zones) {
      if (zone.places.some((p) => p.startsWith(`${country}/`) && !targets.includes(p))) used.add(zone);
    }
    const rates = new Set([...used].map(ratePiastres));
    if (atTallabyRates) rates.add(0);
    if (rates.size !== 1) continue;
    const [rate] = rates;
    const list = [...used];
    details.push({
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: rate! / 100, currency },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
      ...(atTallabyRates
        ? {}
        : {
            deliveryTime: {
              "@type": "ShippingDeliveryTime" as const,
              handlingTime: day(settings.handlingDays, settings.handlingDays),
              transitTime: day(Math.min(...list.map((z) => z.deliveryDaysMin)), Math.max(...list.map((z) => z.deliveryDaysMax))),
            },
          }),
    });
  }
  return details;
}
