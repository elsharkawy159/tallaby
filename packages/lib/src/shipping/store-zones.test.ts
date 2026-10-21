import { describe, expect, it } from "vitest";
import { calculateLocationShippingCost } from "./shipping.lib";
import {
  DEFAULT_PER_KG_SURCHARGE,
  ZONE_GOVERNORATES,
  defaultRateForGovernorate,
  defaultStoreShipping,
  defaultZoneGroups,
  findZoneForGovernorate,
  findZoneOverlap,
  parseStoreShipping,
  quoteZone,
  storeShippingSettingsSchema,
  uncoveredGovernorates,
  zoneInputSchema,
  type ZoneForQuote,
} from "./store-zones";

const zone = (over: Partial<ZoneForQuote> = {}): ZoneForQuote => ({
  id: "z1",
  governorates: ["CAIRO", "GIZA"],
  price: 50,
  perKgSurcharge: 0,
  freeOver: null,
  enabled: true,
  ...over,
});

const item = () => ({ quantity: 1, sellerId: "s1", product: { productType: "physical", dimensions: { weight: 1, weightUnit: "kg" } } });

const input = {
  nameAr: "القاهرة الكبرى",
  nameEn: "Greater Cairo",
  governorates: ["CAIRO", "GIZA"],
  price: 45.5,
  perKgSurcharge: 5,
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

  it("rejects unknown or duplicate governorates, bad money and bad day ranges", () => {
    expect(zoneInputSchema.safeParse({ ...input, governorates: ["ATLANTIS"] }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, governorates: ["CAIRO", "CAIRO"] }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, governorates: [] }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, price: -1 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, price: 10.123 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, deliveryDaysMin: 4, deliveryDaysMax: 2 }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, nameAr: "" }).success).toBe(false);
    expect(zoneInputSchema.safeParse({ ...input, extra: 1 }).success).toBe(false);
  });
});

describe("findZoneOverlap", () => {
  it("finds a governorate in two enabled zones, ignoring disabled ones", () => {
    const a = zone({ id: "a", governorates: ["CAIRO"] });
    const b = zone({ id: "b", governorates: ["GIZA", "CAIRO"] });
    expect(findZoneOverlap([a, b])).toEqual({ governorate: "CAIRO", zoneIds: ["a", "b"] });
    expect(findZoneOverlap([a, { ...b, enabled: false }])).toBeNull();
  });
});

describe("findZoneForGovernorate", () => {
  it("matches the enabled zone, normalising aliases", () => {
    const zones = [zone({ id: "a", governorates: ["ALEXANDRIA"], enabled: false }), zone({ id: "b", governorates: ["CAIRO"] })];
    expect(findZoneForGovernorate(zones, "cairo")?.id).toBe("b");
    expect(findZoneForGovernorate(zones, "ALEXANDRIA")).toBeNull();
    expect(findZoneForGovernorate(zones, "")).toBeNull();
  });
});

describe("uncoveredGovernorates", () => {
  it("lists governorates no enabled zone covers", () => {
    const left = uncoveredGovernorates([zone({ governorates: ["CAIRO", "GIZA"] })]);
    expect(left).not.toContain("CAIRO");
    expect(left).toContain("ASWAN");
    expect(left).toHaveLength(25);
  });
});

describe("quoteZone", () => {
  it("charges the flat price for the first kg, in piastres", () => {
    expect(quoteZone(zone({ price: 45.5 }), { subtotal: 200, weightGrams: 900 })).toEqual({ amountPiastres: 4550, free: false });
  });

  it("adds the per-kg surcharge for each started kg after the first", () => {
    expect(quoteZone(zone({ price: 50, perKgSurcharge: 7.25 }), { subtotal: 200, weightGrams: 2500 })).toEqual({
      amountPiastres: 5000 + 2 * 725,
      free: false,
    });
  });

  it("is free at or over the zone threshold", () => {
    expect(quoteZone(zone({ freeOver: 500 }), { subtotal: 500, weightGrams: 1000 })).toEqual({ amountPiastres: 0, free: true });
    expect(quoteZone(zone({ freeOver: 500 }), { subtotal: 499.99, weightGrams: 1000 }).free).toBe(false);
  });
});

describe("default seller rates (Tallaby's rates)", () => {
  it("matches what checkout bills for the first kg", () => {
    for (const g of ZONE_GOVERNORATES) {
      expect(defaultRateForGovernorate(g)).toBe(calculateLocationShippingCost({ items: [item()], destinationState: g }));
    }
    expect(defaultRateForGovernorate("CAIRO")).toBe(60);
    expect(defaultRateForGovernorate("SOUTH SINAI")).toBe(125);
  });

  it("groups every governorate exactly once into valid zones, cheapest first", () => {
    const groups = defaultZoneGroups();
    expect(groups.flatMap((g) => g.governorates).sort()).toEqual([...ZONE_GOVERNORATES].sort());
    expect(groups.map((g) => g.price)).toEqual([...groups.map((g) => g.price)].sort((a, b) => a - b));
    expect(DEFAULT_PER_KG_SURCHARGE).toBe(8);
    for (const g of groups) {
      const parsed = zoneInputSchema.safeParse({
        nameAr: "x",
        governorates: g.governorates,
        price: g.price,
        perKgSurcharge: g.perKgSurcharge,
        freeOver: null,
        deliveryDaysMin: 1,
        deliveryDaysMax: 3,
        codEnabled: true,
        enabled: true,
      });
      expect(parsed.success).toBe(true);
    }
    expect(findZoneOverlap(groups.map((g, i) => ({ id: String(i), governorates: g.governorates, enabled: true })))).toBeNull();
  });
});

describe("store shipping settings", () => {
  it("defaults to seller (own) delivery while Tallaby delivery is disabled", () => {
    expect(defaultStoreShipping()).toEqual({ method: "own", handlingDays: 1, freeShippingOver: null });
    expect(parseStoreShipping(undefined)).toEqual(defaultStoreShipping());
    expect(parseStoreShipping({ method: "drone" })).toEqual(defaultStoreShipping());
    // A store saved on Tallaby delivery before 2026-10-21 reads as own delivery, keeping its other settings.
    expect(parseStoreShipping({ method: "tallaby", handlingDays: 3, freeShippingOver: 500 })).toEqual({
      method: "own",
      handlingDays: 3,
      freeShippingOver: 500,
    });
  });

  it("validates the settings strictly", () => {
    expect(storeShippingSettingsSchema.safeParse({ method: "own", handlingDays: 2, freeShippingOver: 750 }).success).toBe(true);
    expect(storeShippingSettingsSchema.safeParse({ method: "own", handlingDays: 99, freeShippingOver: null }).success).toBe(false);
  });
});
