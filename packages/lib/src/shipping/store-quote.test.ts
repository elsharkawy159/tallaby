import { describe, expect, it } from "vitest";
import { resolveStorefrontShipping, zoneSellerFreeDeliveryDiscount, type ShippingCartItem } from "./store-quote";
import type { StoreShippingSettings, ZoneForQuote } from "./store-zones";

const settings = (over: Partial<StoreShippingSettings> = {}): StoreShippingSettings => ({
  method: "own",
  handlingDays: 2,
  freeShippingOver: null,
  otherPlaces: "tallaby_rates",
  ...over,
});

const zone = (over: Partial<ZoneForQuote> = {}): ZoneForQuote => ({
  id: "z1",
  nameAr: "القاهرة",
  nameEn: "Cairo",
  places: ["EG/CAIRO"],
  price: 55,
  freeOver: 1000,
  deliveryDaysMin: 1,
  deliveryDaysMax: 3,
  codEnabled: true,
  enabled: true,
  ...over,
});

const items: ShippingCartItem[] = [{ quantity: 1, sellerId: "s1", product: { productType: "physical" } }];
const flagged: ShippingCartItem[] = [{ quantity: 1, sellerId: "s1", product: { productType: "physical", seller: { freeDelivery: true } } }];
const tallabyRate = () => 70;

const base = { settings: settings(), zones: [zone()], items, subtotal: 200, tallabyRate };

describe("resolveStorefrontShipping", () => {
  it("applies the store-wide free delivery to zones without their own free-over", () => {
    const cairo = { country: "Egypt", state: "Cairo" };
    const noZoneOffer = [zone({ freeOver: null })];
    const over = (threshold: number | null, subtotal: number) =>
      resolveStorefrontShipping({ ...base, settings: settings({ freeShippingOver: threshold }), zones: noZoneOffer, subtotal, address: cairo });
    expect(over(null, 5000)).toMatchObject({ shippingCost: 55, free: false });
    expect(over(500, 499.99)).toMatchObject({ shippingCost: 55, free: false });
    expect(over(500, 500)).toMatchObject({ shippingCost: 0, free: true });
    expect(over(0, 1)).toMatchObject({ shippingCost: 0, free: true });
    // The zone's own threshold wins over the store's.
    const zoneWins = resolveStorefrontShipping({ ...base, settings: settings({ freeShippingOver: 0 }), subtotal: 200, address: cairo });
    expect(zoneWins).toMatchObject({ shippingCost: 55, free: false });
    // Tallaby's rates (no zone covers the place) are never made free by the store offer.
    const other = resolveStorefrontShipping({ ...base, settings: settings({ freeShippingOver: 0 }), address: { country: "Egypt", state: "Aswan" } });
    expect(other).toMatchObject({ kind: "tallaby_rates", shippingCost: 70 });
  });

  it("is outside_egypt for a foreign address", () => {
    expect(resolveStorefrontShipping({ ...base, address: { country: "Saudi Arabia", city: "Riyadh" } })).toMatchObject({ kind: "outside_egypt" });
  });

  it("is outside_egypt for an unrecognised country", () => {
    expect(resolveStorefrontShipping({ ...base, address: { country: "Narnia" } })).toEqual({ kind: "outside_egypt", place: "" });
  });

  it("treats an empty country as Egypt", () => {
    const r = resolveStorefrontShipping({ ...base, address: { country: "", state: "Cairo" } });
    expect(r.kind).toBe("zone");
  });

  it("uses the injected Tallaby rate when the store has no enabled zones", () => {
    const r = resolveStorefrontShipping({ ...base, zones: [zone({ enabled: false })], address: { country: "Egypt", state: "Cairo" } });
    expect(r).toEqual({ kind: "tallaby_rates", shippingCost: 70, place: "EG/CAIRO" });
  });

  it("quotes the matching zone, adding handling days", () => {
    const r = resolveStorefrontShipping({ ...base, address: { country: "Egypt", state: "Cairo" } });
    expect(r).toEqual({
      kind: "zone",
      shippingCost: 55,
      free: false,
      zoneId: "z1",
      zoneName: { ar: "القاهرة", en: "Cairo" },
      place: "EG/CAIRO",
      daysMin: 3,
      daysMax: 5,
      codEnabled: true,
    });
  });

  it("is free over the zone threshold", () => {
    const r = resolveStorefrontShipping({ ...base, subtotal: 1000, address: { country: "Egypt", state: "Cairo" } });
    expect(r).toMatchObject({ kind: "zone", shippingCost: 0, free: true });
  });

  it("is not_covered for an uncovered place when other places are refused", () => {
    const r = resolveStorefrontShipping({ ...base, settings: settings({ otherPlaces: "refuse" }), address: { country: "Egypt", state: "Aswan" } });
    expect(r).toEqual({ kind: "not_covered", place: "EG/ASWAN" });
  });

  it("falls back to Tallaby rates for an uncovered place by default", () => {
    const r = resolveStorefrontShipping({ ...base, address: { country: "Egypt", state: "Aswan" } });
    expect(r).toEqual({ kind: "tallaby_rates", shippingCost: 70, place: "EG/ASWAN" });
  });
});

describe("zoneSellerFreeDeliveryDiscount", () => {
  const zoneResult = resolveStorefrontShipping({ ...base, address: { country: "Egypt", state: "Cairo" } });

  it("equals the shipping cost for a fully flagged cart", () => {
    expect(zoneSellerFreeDeliveryDiscount(zoneResult, flagged)).toBe(55);
  });

  it("is 0 for an unflagged cart and for other kinds", () => {
    expect(zoneSellerFreeDeliveryDiscount(zoneResult, items)).toBe(0);
    expect(zoneSellerFreeDeliveryDiscount({ kind: "tallaby_rates", shippingCost: 70, place: null }, flagged)).toBe(0);
  });
});
