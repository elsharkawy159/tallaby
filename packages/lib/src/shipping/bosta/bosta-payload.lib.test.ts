import { describe, expect, it } from "vitest";

import {
  bostaCod,
  bostaFirstLine,
  buildBostaDeliveryRequest,
  splitReceiverName,
  type BostaOrderInput,
  type BostaShipSettings,
} from "./bosta-payload.lib";

const SETTINGS: BostaShipSettings = { size: "SMALL", allowToOpenPackage: false, note: null, pickupLocationId: "loc-1" };

function makeOrder(overrides: Partial<BostaOrderInput> = {}): BostaOrderInput {
  return {
    orderId: "0f8fad5b-d9cb-469f-a165-70867728950e",
    orderNumber: "TLB-100234",
    totalPiastres: 25_050,
    itemsPiastres: 20_000,
    prepaid: false,
    customerName: "Ahmed Mohamed Ali",
    phone: "+20 101 234 5678",
    email: "ahmed@example.com",
    addressLine1: "12 Abbas El Akkad St",
    addressLine2: "Floor 3",
    deliveryInstructions: "Call before arrival",
    orderNote: "Gift wrap",
    items: [
      { name: "Cotton shirt", quantity: 2, imageUrl: "https://cdn.example.com/a.jpg" },
      { name: "Mug", quantity: 1, imageUrl: null },
    ],
    destination: { city: "Cairo", districtId: "dist-1", zoneId: "zone-1" },
    ...overrides,
  };
}

describe("buildBostaDeliveryRequest", () => {
  it("builds a Deliver request with COD, receiver and references", () => {
    const result = buildBostaDeliveryRequest(makeOrder(), SETTINGS, { url: "https://api.example.com/webhooks/bosta/i1", token: "tok_123456789" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body).toMatchObject({
      type: 10,
      cod: 250.5,
      specs: { packageType: "Parcel", size: "SMALL", packageDetails: { itemsCount: 3, description: "2× Cotton shirt، Mug" } },
      dropOffAddress: {
        city: "Cairo",
        districtId: "dist-1",
        zoneId: "zone-1",
        firstLine: "12 Abbas El Akkad St",
        secondLine: "Floor 3 - Call before arrival",
      },
      receiver: { firstName: "Ahmed", lastName: "Mohamed Ali", phone: "01012345678", email: "ahmed@example.com" },
      businessReference: "TLB-100234",
      uniqueBusinessReference: "tallaby:0f8fad5b-d9cb-469f-a165-70867728950e",
      goodsInfo: { amount: 200 },
      escrowInfo: { isExcluded: true },
      allowToOpenPackage: false,
      notes: "Gift wrap",
      businessLocationId: "loc-1",
      webhookUrl: "https://api.example.com/webhooks/bosta/i1",
      webhookCustomHeaders: { Authorization: "Bearer tok_123456789" },
    });
    expect(result.body.deliveryImages).toBeUndefined();
  });

  it("collects nothing on prepaid orders", () => {
    const result = buildBostaDeliveryRequest(makeOrder({ prepaid: true }), SETTINGS);
    expect(result.ok && result.body.cod).toBe(0);
  });

  it("refuses COD above Bosta's 30,000 EGP limit", () => {
    expect(buildBostaDeliveryRequest(makeOrder({ totalPiastres: 3_000_001 }), SETTINGS)).toEqual({ ok: false, error: "cod_too_high" });
    expect(buildBostaDeliveryRequest(makeOrder({ totalPiastres: 3_000_000 }), SETTINGS).ok).toBe(true);
  });

  it("uses the fallback phone and rejects orders without a mobile", () => {
    expect(buildBostaDeliveryRequest(makeOrder({ phone: "123", fallbackPhone: "01112223334" }), SETTINGS).ok).toBe(true);
    expect(buildBostaDeliveryRequest(makeOrder({ phone: "123", fallbackPhone: null }), SETTINGS)).toEqual({ ok: false, error: "invalid_phone" });
  });

  it("sends product photos when the package may be opened", () => {
    const result = buildBostaDeliveryRequest(makeOrder(), { ...SETTINGS, allowToOpenPackage: true });
    expect(result.ok && result.body.deliveryImages).toEqual([
      { type: "ALLOW_TO_OPEN_THE_PACKAGE", images: ["https://cdn.example.com/a.jpg"] },
    ]);
    const noPhotos = makeOrder({ items: [{ name: "Mug", quantity: 1, imageUrl: "http://insecure.example.com/x.jpg" }] });
    expect(buildBostaDeliveryRequest(noPhotos, { ...SETTINGS, allowToOpenPackage: true })).toEqual({ ok: false, error: "images_required" });
  });

  it("sends districtName + cityId when no district id was matched", () => {
    const result = buildBostaDeliveryRequest(
      makeOrder({ destination: { city: "Giza", cityId: "city-giza", districtName: "Dokki" } }),
      SETTINGS,
    );
    expect(result.ok && result.body.dropOffAddress).toMatchObject({ city: "Giza", cityId: "city-giza", districtName: "Dokki" });
  });

  it("rejects missing names, addresses and empty orders", () => {
    expect(buildBostaDeliveryRequest(makeOrder({ customerName: "  " }), SETTINGS)).toEqual({ ok: false, error: "name_required" });
    expect(buildBostaDeliveryRequest(makeOrder({ items: [{ name: "x", quantity: 0 }] }), SETTINGS)).toEqual({ ok: false, error: "no_items" });
    expect(
      buildBostaDeliveryRequest(makeOrder({ addressLine1: "", destination: { city: "" } }), SETTINGS),
    ).toEqual({ ok: false, error: "address_required" });
  });
});

describe("helpers", () => {
  it("pads a short first line with the area", () => {
    expect(bostaFirstLine("12", { city: "Cairo", districtName: "Nasr City" })).toBe("12 Nasr City");
    expect(bostaFirstLine("  5 Tahrir   Square ", { city: "Cairo" })).toBe("5 Tahrir Square");
  });

  it("splits names and computes COD in integer piastres", () => {
    expect(splitReceiverName("منى")).toEqual({ firstName: "منى" });
    expect(splitReceiverName("")).toBeNull();
    expect(bostaCod({ prepaid: false, totalPiastres: 10_999 })).toBe(109.99);
  });
});
