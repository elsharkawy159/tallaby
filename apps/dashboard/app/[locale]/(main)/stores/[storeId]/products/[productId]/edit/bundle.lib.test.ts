import { describe, expect, it } from "vitest";
import { bundleBlockedReason, bundleCheckError, bundleGuardMessageError, bundleItemProblem, bundleZeroReason } from "./bundle.lib";

const V1 = "11111111-1111-4111-8111-111111111111";
const plain = { isBundle: false, trashed: false, preorder: false, digital: false, variantIds: [] as string[], variantId: null };

describe("bundleBlockedReason", () => {
  it("refuses a product with variants or one that is already in a bundle", () => {
    expect(bundleBlockedReason({ hasVariants: false, isItemOfBundle: false })).toBeNull();
    expect(bundleBlockedReason({ hasVariants: true, isItemOfBundle: true })).toBe("hasVariants");
    expect(bundleBlockedReason({ hasVariants: false, isItemOfBundle: true })).toBe("isItem");
  });

  it("refuses a digital product, and accepts a physical one or an unknown type", () => {
    expect(bundleBlockedReason({ hasVariants: false, isItemOfBundle: false, productType: "digital" })).toBe("digital");
    expect(bundleBlockedReason({ hasVariants: true, isItemOfBundle: false, productType: "digital" })).toBe("hasVariants");
    expect(bundleBlockedReason({ hasVariants: false, isItemOfBundle: false, productType: "physical" })).toBeNull();
    expect(bundleBlockedReason({ hasVariants: false, isItemOfBundle: false, productType: null })).toBeNull();
  });
});

describe("bundleItemProblem", () => {
  it("accepts a plain product and a product with its own variant", () => {
    expect(bundleItemProblem(plain)).toBeNull();
    expect(bundleItemProblem({ ...plain, variantIds: [V1], variantId: V1 })).toBeNull();
  });

  it("refuses what the 0188 guard refuses", () => {
    expect(bundleItemProblem({ ...plain, isBundle: true })).toBe("itemIsBundle");
    expect(bundleItemProblem({ ...plain, trashed: true })).toBe("itemTrashed");
    expect(bundleItemProblem({ ...plain, preorder: true })).toBe("itemPreorder");
    expect(bundleItemProblem({ ...plain, digital: true })).toBe("itemDigital");
    expect(bundleItemProblem({ ...plain, variantIds: [V1] })).toBe("variantRequired");
    expect(bundleItemProblem({ ...plain, variantId: V1 })).toBe("invalid");
  });
});

describe("bundleCheckError", () => {
  it("maps 0188 guard messages, also when wrapped", () => {
    const raise = (message: string) => Object.assign(new Error(message), { code: "23514" });
    expect(bundleCheckError(raise("products: abc has variants and can't be a bundle"))).toBe("hasVariants");
    expect(bundleCheckError({ cause: raise("products: abc is an item of a bundle and can't be a bundle") })).toBe("isItem");
    expect(bundleCheckError(raise("product_bundle_items: item abc has variants; choose one"))).toBe("variantRequired");
    expect(bundleCheckError(raise("product_bundle_items: item abc is a bundle"))).toBe("itemIsBundle");
    expect(bundleCheckError(raise("product_bundle_items: item abc is in another store"))).toBe("notFound");
    expect(bundleCheckError(new Error("boom"))).toBeNull();
    expect(bundleCheckError(null)).toBeNull();
  });

  it("tells a trashed, pre-order or digital item apart, and falls back to invalid", () => {
    expect(bundleGuardMessageError("product_bundle_items: item abc is in Trash")).toBe("itemTrashed");
    expect(bundleGuardMessageError("product_bundle_items: item abc is a pre-order")).toBe("itemPreorder");
    expect(bundleGuardMessageError("product_bundle_items: item abc is digital")).toBe("itemDigital");
    expect(bundleGuardMessageError("product_bundle_items: a bundle can't contain itself")).toBe("self");
    expect(bundleGuardMessageError("something else")).toBe("invalid");
  });
});

describe("bundleZeroReason", () => {
  const ok = { hasVariants: false, variantId: null, trashed: false };
  it("explains a 0 and says nothing otherwise", () => {
    expect(bundleZeroReason(3, [ok])).toBeNull();
    expect(bundleZeroReason(null, [ok])).toBeNull();
    expect(bundleZeroReason(0, [])).toBe("noItems");
    expect(bundleZeroReason(0, [ok, { ...ok, trashed: true }])).toBe("itemTrashed");
    expect(bundleZeroReason(0, [{ ...ok, hasVariants: true }])).toBe("chooseVariant");
    expect(bundleZeroReason(0, [ok, { ...ok, preorder: true }])).toBe("itemPreorder");
    expect(bundleZeroReason(0, [{ ...ok, digital: true }])).toBe("itemDigital");
    expect(bundleZeroReason(0, [ok])).toBe("outOfStock");
  });
});
