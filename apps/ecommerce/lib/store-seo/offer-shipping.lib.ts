import { childrenOf } from "@workspace/lib/places";
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
 */

export type OfferShippingDetails = {
  "@type": "OfferShippingDetails";
  shippingRate: { "@type": "MonetaryAmount"; value: number; currency: string };
  shippingDestination: { "@type": "DefinedRegion"; addressCountry: string };
  deliveryTime: {
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
  if (digital || settings.method !== "own") return [];
  const zones = input.zones.filter((z) => z.enabled);
  if (!zones.length) return [];

  const ratePiastres = (zone: ZoneForQuote) =>
    sellerFreeDelivery ? 0 : quoteZone({ price: zone.price, freeOver: zone.freeOver ?? settings.freeShippingOver }, price).amountPiastres;

  const details: OfferShippingDetails[] = [];
  for (const country of zoneCountries(zones)) {
    const regions = childrenOf(country).filter((p) => p.level === "region").map((p) => p.key);
    const targets = regions.length ? regions : [country];
    const used = new Set<ZoneForQuote>();
    let covered = true;
    for (const target of targets) {
      const found = findZoneForPlace(zones, target);
      if (!found) {
        covered = false;
        break;
      }
      used.add(found.zone);
    }
    if (!covered) continue;
    // Zones for a smaller part of the country (a city, or a region of a
    // country without region data) charge there instead, so they count too.
    for (const zone of zones) {
      if (zone.places.some((p) => p.startsWith(`${country}/`) && !targets.includes(p))) used.add(zone);
    }
    const rates = new Set([...used].map(ratePiastres));
    if (rates.size !== 1) continue;
    const [rate] = rates;
    const list = [...used];
    details.push({
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: rate! / 100, currency },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: country },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: day(settings.handlingDays, settings.handlingDays),
        transitTime: day(Math.min(...list.map((z) => z.deliveryDaysMin)), Math.max(...list.map((z) => z.deliveryDaysMax))),
      },
    });
  }
  return details;
}
