import { describe, expect, it } from "vitest";
import { parseShippingMode, resolveShippingMode } from "./shipping-mode.lib";

describe("parseShippingMode", () => {
  it("reads a saved mode", () => {
    expect(parseShippingMode({ shippingMode: "self" })).toBe("self");
    expect(parseShippingMode({ shippingMode: "company", shipping: { method: "own" } })).toBe("company");
  });

  it("returns null for missing or unknown values", () => {
    expect(parseShippingMode(null)).toBeNull();
    expect(parseShippingMode(undefined)).toBeNull();
    expect(parseShippingMode([])).toBeNull();
    expect(parseShippingMode({})).toBeNull();
    expect(parseShippingMode({ shippingMode: "tallaby" })).toBeNull();
    expect(parseShippingMode({ shippingMode: 1 })).toBeNull();
    // Inside settings.shipping is not where it lives.
    expect(parseShippingMode({ shipping: { shippingMode: "self" } })).toBeNull();
  });
});

describe("resolveShippingMode", () => {
  it("keeps a saved mode whatever the store has", () => {
    expect(resolveShippingMode("self", { hasCarrier: true, hasZones: true })).toBe("self");
    expect(resolveShippingMode("company", { hasCarrier: false, hasZones: false })).toBe("company");
  });

  it("infers older stores: a carrier means company, zones mean self", () => {
    expect(resolveShippingMode(null, { hasCarrier: true, hasZones: true })).toBe("company");
    expect(resolveShippingMode(null, { hasCarrier: true, hasZones: false })).toBe("company");
    expect(resolveShippingMode(null, { hasCarrier: false, hasZones: true })).toBe("self");
  });

  it("leaves a new store unchosen", () => {
    expect(resolveShippingMode(null, { hasCarrier: false, hasZones: false })).toBeNull();
  });
});
