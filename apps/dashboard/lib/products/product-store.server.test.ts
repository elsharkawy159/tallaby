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
  taxonomyItemsInStore: vi.fn(async () => true),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));

vi.mock("@/lib/auth/require-seller.server", async () => {
  class AccessError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return {
    AccessError,
    requireStore: mocks.requireStore,
    isAccessError: (error: unknown) => error instanceof AccessError,
  };
});
vi.mock("@/lib/stores/platform-switches.server", () => ({ isSwitchOn: mocks.isSwitchOn }));
vi.mock("@workspace/lib/stores/scope/server", () => ({
  storeHasProduct: mocks.storeHasProduct,
  productInStore: mocks.productInStore,
  taxonomyItemsInStore: mocks.taxonomyItemsInStore,
}));

const { AccessError } = (await import("@/lib/auth/require-seller.server")) as unknown as {
  AccessError: new (code: string) => Error & { code: string };
};
const { assertProductTaxonomyInStore, loadProductStorePage, requireProductStore, requireStoreProduct, taxonomyScopeOf } = await import(
  "./product-store.server"
);

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

describe("archived or suspended stores (slice 2)", () => {
  it("does not ask for an active store before the split: products are still the account's", async () => {
    await requireProductStore(STORE);
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE, {});
  });

  it("asks for an active store (forWrite) on writes once the split is on", async () => {
    mocks.isSwitchOn.mockResolvedValueOnce(true);
    await requireProductStore(STORE);
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE, { forWrite: true });
  });

  it("never asks it on reads, even after the split", async () => {
    mocks.isSwitchOn.mockResolvedValueOnce(true);
    await requireProductStore(STORE, { read: true });
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE, {});
  });
});

describe("loadProductStorePage (the /stores/[storeId]/products pages)", () => {
  it("returns the store context for the session's own store", async () => {
    await expect(loadProductStorePage(STORE)).resolves.toMatchObject({ store: { id: STORE }, inStore: "IN_STORE" });
    expect(mocks.requireStore).toHaveBeenCalledWith(STORE, {});
  });

  it("is a 404 for a forged, foreign or deleted storeId segment", async () => {
    mocks.requireStore.mockRejectedValueOnce(new AccessError("not_found"));
    await expect(loadProductStorePage("not-a-store")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalled();
  });

  it("sends a signed-out visitor to login and a non-seller to signup", async () => {
    mocks.requireStore.mockRejectedValueOnce(new AccessError("unauthorized"));
    await expect(loadProductStorePage(STORE)).rejects.toThrow("NEXT_REDIRECT /login");
    mocks.requireStore.mockRejectedValueOnce(new AccessError("no_seller"));
    await expect(loadProductStorePage(STORE)).rejects.toThrow("NEXT_REDIRECT /signup");
  });

  it("lets other errors through", async () => {
    mocks.requireStore.mockRejectedValueOnce(new Error("db down"));
    await expect(loadProductStorePage(STORE)).rejects.toThrow("db down");
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});

describe("taxonomy per store (F-87d)", () => {
  const CATEGORY = "44444444-4444-4444-8444-444444444444";
  const ctx = (catalogSplit: boolean) => ({ ...owned, catalogSplit }) as never;

  it("taxonomyScopeOf is the session seller, the checked store and the switch", () => {
    expect(taxonomyScopeOf(ctx(true))).toEqual({ sellerId: "s1", storeId: STORE, catalogSplit: true });
  });

  it("a payload with no category or brand needs no check", async () => {
    await assertProductTaxonomyInStore(ctx(true), { sellerCategoryId: "", sellerBrandId: null });
    await assertProductTaxonomyInStore(ctx(true), {});
    expect(mocks.taxonomyItemsInStore).not.toHaveBeenCalled();
  });

  it("checks the ids against the store's list, and refuses one outside it", async () => {
    await assertProductTaxonomyInStore(ctx(true), { sellerCategoryId: CATEGORY });
    expect(mocks.taxonomyItemsInStore).toHaveBeenCalledWith(
      { sellerId: "s1", storeId: STORE, catalogSplit: true },
      { sellerCategoryId: CATEGORY, sellerBrandId: null },
    );
    mocks.taxonomyItemsInStore.mockResolvedValueOnce(false);
    await expect(assertProductTaxonomyInStore(ctx(true), { sellerCategoryId: CATEGORY })).rejects.toMatchObject({ code: "not_found" });
  });

  it("refuses an id that is not a string without a query", async () => {
    await expect(assertProductTaxonomyInStore(ctx(false), { sellerBrandId: 42 })).rejects.toMatchObject({ code: "not_found" });
    expect(mocks.taxonomyItemsInStore).not.toHaveBeenCalled();
  });
});
