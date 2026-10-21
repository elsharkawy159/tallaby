/**
 * The shipping quote for a store-website checkout: which of the seller's
 * zones (if any) covers the address, and what it costs. Pure; the Tallaby rate
 * is injected so this file has no dependency on the rate tables.
 */
import { EGYPT, resolveAddressPlace } from "../places";
import { cartFullyCoveredBySellerFreeDelivery, type calculateLocationShippingCost } from "./shipping.lib";
import { findZoneForPlace, quoteZone, type StoreShippingSettings, type ZoneForQuote } from "./store-zones";

export type ShippingCartItem = Parameters<typeof calculateLocationShippingCost>[0]["items"][number];

export type ShippingAddress = {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  addressLine1?: string | null;
};

export type StorefrontShipping =
  | {
      kind: "zone";
      shippingCost: number;
      free: boolean;
      zoneId: string;
      zoneName: { ar: string; en: string | null };
      place: string;
      daysMin: number;
      daysMax: number;
      codEnabled: boolean;
    }
  | { kind: "tallaby_rates"; shippingCost: number; place: string | null }
  | { kind: "not_covered"; place: string | null }
  | { kind: "outside_egypt"; place: string };

export function resolveStorefrontShipping(input: {
  settings: StoreShippingSettings;
  zones: ZoneForQuote[];
  address: ShippingAddress;
  items: ShippingCartItem[];
  subtotal: number;
  tallabyRate: (state: string | null) => number;
}): StorefrontShipping {
  const { settings, zones, address, subtotal, tallabyRate } = input;
  const place = resolveAddressPlace(address);

  // An unrecognised, non-empty country text is a foreign address (an empty one resolves to Egypt).
  if (place === null) return { kind: "outside_egypt", place: "" };
  if (place.split("/")[0] !== EGYPT) return { kind: "outside_egypt", place };

  const state = address.state ?? null;
  if (!zones.some((z) => z.enabled)) {
    return { kind: "tallaby_rates", shippingCost: tallabyRate(state), place };
  }

  const found = findZoneForPlace(zones, place);
  if (found) {
    const { zone } = found;
    const { amountPiastres, free } = quoteZone(zone, subtotal);
    return {
      kind: "zone",
      shippingCost: amountPiastres / 100,
      free,
      zoneId: zone.id,
      zoneName: { ar: zone.nameAr, en: zone.nameEn },
      place,
      daysMin: settings.handlingDays + zone.deliveryDaysMin,
      daysMax: settings.handlingDays + zone.deliveryDaysMax,
      codEnabled: zone.codEnabled,
    };
  }

  if (settings.otherPlaces === "refuse") return { kind: "not_covered", place };
  return { kind: "tallaby_rates", shippingCost: tallabyRate(state), place };
}

/**
 * Seller-funded free delivery for a zone quote: the whole cost is waived when
 * every physical item is from a seller flagged `free_delivery`. Other kinds
 * keep the existing seller discount path.
 */
export function zoneSellerFreeDeliveryDiscount(result: StorefrontShipping, items: ShippingCartItem[]): number {
  if (result.kind !== "zone") return 0;
  return cartFullyCoveredBySellerFreeDelivery(items) ? result.shippingCost : 0;
}
