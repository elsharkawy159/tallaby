import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ kind: null as string | null, productType: "physical" as string | null }));

vi.mock("@workspace/lib/products/category-kind/server", () => ({ loadCategoryKind: async () => state.kind }));
vi.mock("@workspace/db", async (importOriginal) => {
  const chain = { from: () => chain, where: () => chain, limit: async () => (state.productType ? [{ productType: state.productType }] : []) };
  return { ...(await importOriginal<typeof import("@workspace/db")>()), db: { select: () => chain } };
});

const { assertCategoryKindForProduct } = await import("./category-kind.server");
const existing = { productId: "p", sellerId: "s" };

beforeEach(() => {
  state.kind = null;
  state.productType = "physical";
});

describe("assertCategoryKindForProduct (F-108e)", () => {
  it("skips a payload with no category, or an unknown one", async () => {
    await expect(assertCategoryKindForProduct({})).resolves.toBeUndefined();
    await expect(assertCategoryKindForProduct({ categoryId: "c", categoryKind: "digital" })).resolves.toBeUndefined();
  });

  it("a new product is physical unless the form says digital", async () => {
    state.kind = "digital";
    await expect(assertCategoryKindForProduct({ categoryId: "c" })).rejects.toThrow("category_kind_mismatch");
    await expect(assertCategoryKindForProduct({ categoryId: "c", categoryKind: "physical" })).rejects.toThrow("category_kind_mismatch");
    await expect(assertCategoryKindForProduct({ categoryId: "c", categoryKind: "digital" })).resolves.toBeUndefined();
    state.kind = "physical";
    await expect(assertCategoryKindForProduct({ categoryId: "c" })).resolves.toBeUndefined();
    await expect(assertCategoryKindForProduct({ categoryId: "c", categoryKind: "digital" })).rejects.toThrow("category_kind_mismatch");
  });

  it("an update with no kind from the form uses the product's stored type", async () => {
    state.kind = "physical";
    state.productType = "digital";
    await expect(assertCategoryKindForProduct({ categoryId: "c" }, existing)).rejects.toThrow("category_kind_mismatch");
    state.kind = "digital";
    await expect(assertCategoryKindForProduct({ categoryId: "c" }, existing)).resolves.toBeUndefined();
  });
});
