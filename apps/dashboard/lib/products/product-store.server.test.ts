import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The dashboard's product store guard (ROADMAP.md F-87c slice 1): the store
 * comes from requireStore (session seller), the switch picks the rule, and a
 * product outside the store is not_found. The DB side is in
 * packages/lib/src/stores/store-separation.integration.test.ts.
 */
const mocks = vi.hoisted(() => ({
  requireStore: vi.fn(),
  isSwitchOn: vi.fn(async () => false),
  storeHasProduct: vi.fn(async () => true),
  productInStore: vi.fn(() => "IN_STORE"),
}));

vi.mock("@/lib/auth/require-seller.server", async () => {
  class AccessError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return { AccessError, requireStore: mocks.requireStore };
});
vi.mock("@/lib/stores/platform-switches.server", () => ({ isSwitchOn: mocks.isSwitchOn }));
vi.mock("@workspace/lib/stores/scope/server", () => ({
  storeHasProduct: mocks.storeHasProduct,
  productInStore: mocks.productInStore,
}));

const { requireProductStore, requireStoreProduct } = await import("./product-store.server");

const STORE = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "33333333-3333-4333-8333-333333333333";
const owned = { seller: { sellerId: "s1" }, store: { id: STORE } };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireStore.mockResolvedValue(owned);
});

describe("requireProductStore", () => {
  it("checks the store against the session and builds the managed condition", async () => {
    const ctx = await requireProductStore(STORE);
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE, {});
    expect(mocks.productInStore).toHaveBeenCalledWith(STORE, { catalogSplit: false, scope: "managed" });
    expect(ctx).toMatchObject({ store: { id: STORE }, catalogSplit: false, inStore: "IN_STORE" });
  });

  it("uses the split rule once the switch is on", async () => {
    mocks.isSwitchOn.mockResolvedValueOnce(true);
    await requireProductStore(STORE);
    expect(mocks.productInStore).toHaveBeenCalledWith(STORE, { catalogSplit: true, scope: "managed" });
  });

  it("passes anything that is not a string on as '' (requireStore then refuses it)", async () => {
    mocks.requireStore.mockRejectedValueOnce(new Error("not_found"));
    await expect(requireProductStore({ id: STORE })).rejects.toThrow("not_found");
    expect(mocks.requireStore).toHaveBeenCalledWith("", {});
  });

  it("a foreign or forged store fails before any product check", async () => {
    mocks.requireStore.mockRejectedValueOnce(new Error("not_found"));
    await expect(requireStoreProduct(STORE, PRODUCT)).rejects.toThrow("not_found");
    expect(mocks.storeHasProduct).not.toHaveBeenCalled();
  });
});

describe("requireStoreProduct", () => {
  it("accepts a product of the store", async () => {
    await expect(requireStoreProduct(STORE, PRODUCT)).resolves.toMatchObject({ store: { id: STORE } });
    expect(mocks.storeHasProduct).toHaveBeenCalledWith(STORE, PRODUCT, { catalogSplit: false, scope: "managed" });
  });

  it("refuses a product outside the store with not_found", async () => {
    mocks.storeHasProduct.mockResolvedValueOnce(false);
    await expect(requireStoreProduct(STORE, PRODUCT)).rejects.toMatchObject({ code: "not_found" });
  });

  it("refuses a product id that is not a string without a query", async () => {
    await expect(requireStoreProduct(STORE, 42)).rejects.toMatchObject({ code: "not_found" });
    expect(mocks.storeHasProduct).not.toHaveBeenCalled();
  });
});
