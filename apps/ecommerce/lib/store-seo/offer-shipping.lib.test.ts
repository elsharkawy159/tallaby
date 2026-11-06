import { describe, expect, it } from "vitest";
import { childrenOf } from "@workspace/lib/places";
import type { StoreShippingSettings, ZoneForQuote } from "@workspace/lib/shipping/store-zones";
import { offerShippingDetails, type OfferShippingInput } from "./offer-shipping.lib";

const settings: StoreShippingSettings = { method: "own", handlingDays: 1, freeShippingOver: null, otherPlaces: "tallaby_rates" };
const zone = (id: string, places: string[], price: number, extra: Partial<ZoneForQuote> = {}): ZoneForQuote => ({
  id,
  nameAr: id,
  nameEn: id,
  places,
  price,
  freeOver: null,
  deliveryDaysMin: 2,
  deliveryDaysMax: 4,
  codEnabled: true,
  enabled: true,
  ...extra,
});
const base: OfferShippingInput = { settings, zones: [], currency: "EGP", price: 300, sellerFreeDelivery: false, digital: false };

describe("offerShippingDetails", () => {
  it("lists Egypt with the flat rate and delivery days of a whole-country zone", () => {
    expect(offerShippingDetails({ ...base, zones: [zone("all", ["EG"], 60)] })).toEqual([
      {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: 60, currency: "EGP" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "EG" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 4, unitCode: "DAY" },
        },
      },
    ]);
  });

  it("lists nothing for a country whose places cost different amounts", () => {
    const zones = [zone("cairo", ["EG/CAIRO"], 50), zone("rest", ["EG"], 80)];
    expect(offerShippingDetails({ ...base, zones })).toEqual([]);
    // A city zone at another price breaks it too.
    expect(offerShippingDetails({ ...base, zones: [zone("all", ["EG"], 60), zone("nasr", ["EG/CAIRO/nasr-city"], 40)] })).toEqual([]);
  });

  it("lists a country when every region is covered at one price, with the widest days", () => {
    const regions = childrenOf("EG").map((p) => p.key);
    const half = Math.floor(regions.length / 2);
    const zones = [
      zone("a", regions.slice(0, half), 70),
      zone("b", regions.slice(half), 70, { deliveryDaysMin: 3, deliveryDaysMax: 6 }),
    ];
    const [detail] = offerShippingDetails({ ...base, zones });
    expect(detail?.shippingRate.value).toBe(70);
    expect(detail?.deliveryTime.transitTime).toMatchObject({ minValue: 2, maxValue: 6 });
  });

  it("lists nothing when some region has no zone (Tallaby's rates or refused there)", () => {
    expect(offerShippingDetails({ ...base, zones: [zone("cairo", ["EG/CAIRO", "EG/GIZA"], 50)] })).toEqual([]);
  });

  it("is free at the zone's free-over, the store-wide offer, or the seller's free delivery", () => {
    expect(offerShippingDetails({ ...base, zones: [zone("all", ["EG"], 60, { freeOver: 250 })] })[0]?.shippingRate.value).toBe(0);
    expect(
      offerShippingDetails({ ...base, settings: { ...settings, freeShippingOver: 300 }, zones: [zone("all", ["EG"], 60)] })[0]?.shippingRate.value,
    ).toBe(0);
    expect(offerShippingDetails({ ...base, price: 100, zones: [zone("all", ["EG"], 60, { freeOver: 250 })] })[0]?.shippingRate.value).toBe(60);
    expect(offerShippingDetails({ ...base, sellerFreeDelivery: true, zones: [zone("all", ["EG"], 60)] })[0]?.shippingRate.value).toBe(0);
  });

  it("lists each country abroad in the store currency, skips disabled zones, digital goods and Tallaby delivery", () => {
    const zones = [zone("sa", ["SA"], 25), zone("off", ["AE"], 10, { enabled: false })];
    const details = offerShippingDetails({ ...base, currency: "SAR", zones });
    expect(details.map((d) => [d.shippingDestination.addressCountry, d.shippingRate.value, d.shippingRate.currency])).toEqual([["SA", 25, "SAR"]]);
    expect(offerShippingDetails({ ...base, digital: true, zones })).toEqual([]);
    expect(offerShippingDetails({ ...base, settings: { ...settings, method: "tallaby" }, zones })).toEqual([]);
  });
});
