import { describe, expect, it } from "vitest";
import { calculateLocationShippingCost } from "./shipping.lib";
import {
  ZONE_GOVERNORATES,
  defaultRateForGovernorate,
  defaultStoreShipping,
  defaultZoneGroups,
  findZoneForPlace,
  findZoneOverlap,
  parseStoreShipping,
  quoteZone,
  storeShippingSettingsSchema,
  templateZones,
  uncoveredGovernorates,
  zoneInputSchema,
  type ZoneForQuote,
} from "./store-zones";

const zone = (over: Partial<ZoneForQuote> = {}): ZoneForQuote => ({
  id: "z1",
  nameAr: "منطقة",
  nameEn: null,
  places: ["EG/CAIRO", "EG/GIZA"],
  price: 50,
  freeOver: null,
  deliveryDaysMin: 1,
  deliveryDaysMax: 3,
  codEnabled: true,
  enabled: true,
  ...over,
});

const item = () => ({ quantity: 1, sellerId: "s1", product: { productType: "physical", dimensions: { weight: 1, weightUnit: "kg" } } });

const input = {
  nameAr: "القاهرة الكبرى",
  nameEn: "Greater Cairo",
  places: ["EG/CAIRO", "EG/GIZA/dokki"],
  price: 45.5,
  freeOver: 1000,
  deliveryDaysMin: 1,
  deliveryDaysMax: 3,
  codEnabled: true,
  enabled: true,
};

describe("zoneInputSchema", () => {
  it("accepts a valid zone", () => {
    expect(zoneInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects unknown or duplicate places, bad money and bad day ranges", () => {
    expect(zoneInputSchema.safeParse({ ...input, places: ["EG/ATLANTIS"] }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, places: ["EG/CAIRO", "EG/CAIRO"] }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, places: [] }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, price: -1 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, price: 10.123 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, deliveryDaysMin: 4, deliveryDaysMax: 2 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, nameAr: "" }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, extra: 1 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, perKgSurcharge: 5 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, governorates: ["CAIRO"] }).success).toBe(false);
  });
});

describe("findZoneOverlap", () => {
  it("finds an identical place key in two enabled zones, ignoring disabled ones", () => {
    const a = zone({ id: "a", places: ["EG/CAIRO"] });
    const b = zone({ id: "b", places: ["EG/GIZA", "EG/CAIRO"] });
    expect(findZoneOverlap([a, b])).toEqual({ place: "EG/CAIRO", zoneIds: ["a", "b"] });
    expect(findZoneOverlap([a, { ...b, enabled: false }])).toBeNull();
  });

  it("allows a place and its child in different zones", () => {
    const a = zone({ id: "a", places: ["EG/CAIRO"] });
    const b = zone({ id: "b", places: ["EG/CAIRO/nasr-city"] });
    expect(findZoneOverlap([a, b])).toBeNull();
  });
});

describe("findZoneForPlace", () => {
  it("picks the most specific enabled zone and skips disabled ones", () => {
    const country = zone({ id: "eg", places: ["EG"] });
    const region = zone({ id: "cairo", places: ["EG/CAIRO"] });
    const city = zone({ id: "nasr", places: ["EG/CAIRO/nasr-city"] });
    const zones = [country, region, city];
    expect(findZoneForPlace(zones, "EG/CAIRO/nasr-city")).toEqual({ zone: city, matched: "EG/CAIRO/nasr-city" });
    expect(findZoneForPlace(zones, "EG/CAIRO/heliopolis")?.zone.id).toBe("cairo");
    expect(findZoneForPlace(zones, "EG/ASWAN")).toEqual({ zone: country, matched: "EG" });
    expect(findZoneForPlace([country, region, { ...city, enabled: false }], "EG/CAIRO/nasr-city")?.zone.id).toBe("cairo");
    expect(findZoneForPlace([{ ...region, enabled: false }], "EG/CAIRO")).toBeNull();
    expect(findZoneForPlace(zones, null)).toBeNull();
  });
});

describe("uncoveredGovernorates", () => {
  it("lists governorates no enabled zone covers", () => {
    const left = uncoveredGovernorates([zone({ places: ["EG/CAIRO", "EG/GIZA"] })]);
    expect(left).not.toContain("CAIRO");
    expect(left).toContain("ASWAN");
    expect(left).toHaveLength(25);
  });

  it("treats EG and EG/<g> as covering, and ignores deeper or disabled zones", () => {
    expect(uncoveredGovernorates([zone({ places: ["EG"] })])).toEqual([]);
    expect(uncoveredGovernorates([zone({ places: ["EG/CAIRO/nasr-city"] })])).toContain("CAIRO");
    expect(uncoveredGovernorates([zone({ places: ["EG"], enabled: false })])).toHaveLength(27);
  });
});

describe("quoteZone", () => {
  it("charges the flat price in piastres", () => {
    expect(quoteZone(zone({ price: 45.5 }), 200)).toEqual({ amountPiastres: 4550, free: false });
  });

  it("is free at or over the zone threshold", () => {
    expect(quoteZone({ price: 55, freeOver: 1000 }, 1000)).toEqual({ amountPiastres: 0, free: true });
    expect(quoteZone({ price: 55, freeOver: 1000 }, 999.99)).toEqual({ amountPiastres: 5500, free: false });
  });
});

describe("default seller rates (Tallaby rates)", () => {
  it("matches what checkout bills for the first kg", () => {
    for (const g of ZONE_GOVERNORATES) {
      expect(defaultRateForGovernorate(g)).toBe(calculateLocationShippingCost({ items: [item()], destinationState: g }));
    }
    expect(defaultRateForGovernorate("CAIRO")).toBe(60);
    expect(defaultRateForGovernorate("SOUTH SINAI")).toBe(125);
  });

  it("groups every governorate exactly once into valid zones, cheapest first", () => {
    const groups = defaultZoneGroups();
    expect(groups.flatMap((g) => g.places).sort()).toEqual(ZONE_GOVERNORATES.map((g) => `EG/${g}`).sort());
    expect(groups.map((g) => g.price)).toEqual([...groups.map((g) => g.price)].sort((a, b) => a - b));
    for (const g of groups) {
      const parsed = zoneInputSchema.safeParse({
        nameAr: "x",
        places: g.places,
        price: g.price,
        freeOver: null,
        deliveryDaysMin: 1,
        deliveryDaysMax: 3,
        codEnabled: true,
        enabled: true,
      });
      expect(parsed.success).toBe(true);
    }
    expect(findZoneOverlap(groups.map((g, i) => ({ id: String(i), places: g.places, enabled: true })))).toBeNull();
  });
});

describe("templateZones", () => {
  it("tallaby_rates covers all 27 governorates once", () => {
    const zones = templateZones("tallaby_rates", {});
    expect(zones).toEqual(defaultZoneGroups());
    expect(zones.flatMap((z) => z.places)).toHaveLength(27);
    expect(new Set(zones.flatMap((z) => z.places)).size).toBe(27);
  });

  it("egypt_flat is one zone for all of Egypt", () => {
    expect(templateZones("egypt_flat", { price: 60 })).toEqual([{ price: 60, places: ["EG"] }]);
    expect(templateZones("egypt_flat", {})).toEqual([]);
  });

  it("cairo_giza uses the Cairo rate", () => {
    expect(templateZones("cairo_giza", {})).toEqual([{ price: 60, places: ["EG/CAIRO", "EG/GIZA"] }]);
  });
});

describe("store shipping settings", () => {
  it("defaults to seller (own) delivery while Tallaby delivery is disabled", () => {
    expect(defaultStoreShipping()).toEqual({ method: "own", handlingDays: 1, freeShippingOver: null, otherPlaces: "tallaby_rates" });
    expect(parseStoreShipping(undefined)).toEqual(defaultStoreShipping());
    expect(parseStoreShipping({ method: "drone" })).toEqual(defaultStoreShipping());
    // A store saved on Tallaby delivery before 2026-10-21 reads as own delivery, keeping its other settings.
    expect(parseStoreShipping({ method: "tallaby", handlingDays: 3, freeShippingOver: 500 })).toEqual({
      method: "own",
      handlingDays: 3,
      freeShippingOver: 500,
      otherPlaces: "tallaby_rates",
    });
  });

  it("fills otherPlaces when missing and keeps a saved value", () => {
    expect(parseStoreShipping({ method: "own", handlingDays: 2, freeShippingOver: null }).otherPlaces).toBe("tallaby_rates");
    expect(parseStoreShipping({ method: "own", handlingDays: 2, freeShippingOver: null, otherPlaces: "refuse" }).otherPlaces).toBe("refuse");
  });

  it("validates the settings strictly", () => {
    expect(
      storeShippingSettingsSchema.safeParse({ method: "own", handlingDays: 2, freeShippingOver: 750, otherPlaces: "refuse" }).success,
    ).toBe(true);
    expect(
      storeShippingSettingsSchema.safeParse({ method: "own", handlingDays: 99, freeShippingOver: null, otherPlaces: "refuse" }).success,
    ).toBe(false);
    expect(
      storeShippingSettingsSchema.safeParse({ method: "own", handlingDays: 2, freeShippingOver: null, otherPlaces: "nope" }).success,
    ).toBe(false);
  });
});
