import { describe, expect, it } from "vitest";
import { bundleContentItems, formatBundleIncludes, overlayBundleAvailability } from "./bundles.lib";

describe("overlayBundleAvailability", () => {
  const rows = [
    { id: "plain", isBundle: false, trackStock: true, quantity: "4" },
    { id: "counted", isBundle: true, trackStock: false, quantity: "0" },
    { id: "unlimited", isBundle: true, trackStock: false, quantity: "0" },
    { id: "missing", isBundle: true, trackStock: false, quantity: "0" },
    { id: "numeric", isBundle: true, trackStock: false, quantity: 0 },
  ];
  const availability = new Map<string, number | null>([
    ["counted", 3],
    ["unlimited", null],
    ["numeric", 7],
  ]);

  it("sets a bundle's computed stock and leaves other rows untouched", () => {
    const out = overlayBundleAvailability(rows, availability);
    expect(out[0]).toBe(rows[0]);
    expect(out[1]).toEqual({ id: "counted", isBundle: true, trackStock: true, quantity: "3" });
    expect(out[2]).toEqual({ id: "unlimited", isBundle: true, trackStock: false, quantity: "0" });
    expect(out[3]).toEqual({ id: "missing", isBundle: true, trackStock: true, quantity: "0" });
    expect(out[4]).toEqual({ id: "numeric", isBundle: true, trackStock: true, quantity: 7 });
  });

  it("never mutates the input rows (they may be cached)", () => {
    overlayBundleAvailability(rows, availability);
    expect(rows[1]).toEqual({ id: "counted", isBundle: true, trackStock: false, quantity: "0" });
  });
});

describe("formatBundleIncludes", () => {
  const items = [
    { name: "Oud", variantName: "50 ml", quantity: 1 },
    { name: " Box ", variantName: null, quantity: 2 },
  ];
  it("lists each item with its variant and count", () => {
    expect(formatBundleIncludes(items, "en")).toBe("Oud (50 ml) ×1, Box ×2");
  });
  it("uses the Arabic comma in Arabic", () => {
    expect(formatBundleIncludes(items, "ar")).toBe("Oud (50 ml) ×1، Box ×2");
  });
  it("is empty without items", () => {
    expect(formatBundleIncludes([], "en")).toBe("");
  });
});

describe("bundleContentItems", () => {
  const base = { productId: "p", name: "A", variantName: null, quantity: 1, image: null, slug: "a", status: "active", trashed: false };
  it("links only an active item with a slug", () => {
    expect(bundleContentItems([base])[0]?.slug).toBe("a");
    expect(bundleContentItems([{ ...base, status: "draft" }])[0]?.slug).toBeNull();
    expect(bundleContentItems([{ ...base, trashed: true }])[0]?.slug).toBeNull();
    expect(bundleContentItems([{ ...base, slug: null }])[0]?.slug).toBeNull();
  });
});
