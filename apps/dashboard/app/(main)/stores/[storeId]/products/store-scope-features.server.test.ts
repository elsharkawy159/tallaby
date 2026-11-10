import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * F-87c slice 3: the secondary product features take an explicit store and
 * check every product against it. The store guard itself
 * (`requireProductStore` / `requireStoreProduct`) is unit-tested in
 * lib/products/product-store.server.test.ts and against a database in
 * packages/lib/src/stores/store-separation.integration.test.ts. Here it is
 * stubbed, and each action is checked to
 * - ask the guard for the store (and product) the client named,
 * - return its not-found answer without touching the database when the guard
 *   refuses (a foreign, deleted or forged store, or a product outside it),
 * - put the guard's `inStore` condition in the WHERE of the product read or
 *   write it makes, so a product of another store matches nothing.
 * The database is a fake that records every WHERE and never connects.
 */

const STORE = "11111111-1111-4111-8111-111111111111";
const PRODUCT = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const ROW = "44444444-4444-4444-8444-444444444444";
const SELLER = { userId: "u1", sellerId: "s1", status: "approved", plan: "free", maxStoresOverride: null };

const dialect = new PgDialect();
const render = (where: unknown) => dialect.sqlToQuery(where as SQL).sql;

const mocks = vi.hoisted(() => ({
  requireProductStore: vi.fn(),
  requireStoreProduct: vi.fn(),
  getUser: vi.fn(async () => ({ user: { id: "s1" } })),
}));

/** The fake db: each call pops the next result for its kind; every WHERE (and findFirst where) is recorded. */
const fake = vi.hoisted(() => {
  const state = {
    wheres: [] as unknown[],
    calls: [] as string[],
    results: { select: [] as unknown[][], update: [] as unknown[][], insert: [] as unknown[][], delete: [] as unknown[][] },
  };
  const chain = (result: unknown[]): unknown => {
    const target = () => undefined;
    const proxy: unknown = new Proxy(target, {
      get(_t, prop) {
        if (prop === "then") return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
        if (prop === "where") {
          return (arg: unknown) => {
            state.wheres.push(arg);
            return proxy;
          };
        }
        return () => proxy;
      },
    });
    return proxy;
  };
  const kind = (name: keyof typeof state.results) => () => {
    state.calls.push(name);
    return chain(state.results[name].shift() ?? []);
  };
  const db = {
    select: kind("select"),
    update: kind("update"),
    insert: kind("insert"),
    delete: kind("delete"),
    transaction: async (fn: (tx: unknown) => unknown) => {
      state.calls.push("transaction");
      return fn(db);
    },
    query: {
      products: {
        findFirst: async ({ where }: { where: unknown }) => {
          state.calls.push("findFirst");
          state.wheres.push(where);
          return (state.results.select.shift() ?? [])[0];
        },
      },
    },
  };
  const reset = () => {
    state.wheres.length = 0;
    state.calls.length = 0;
    for (const list of Object.values(state.results)) list.length = 0;
  };
  return { state, db, reset };
});

vi.mock("@workspace/db", async () => {
  const drizzle = await import("drizzle-orm");
  const schema = await import("@workspace/db/schema");
  return {
    ...schema,
    eq: drizzle.eq,
    and: drizzle.and,
    or: drizzle.or,
    isNull: drizzle.isNull,
    isNotNull: drizzle.isNotNull,
    inArray: drizzle.inArray,
    notInArray: drizzle.notInArray,
    asc: drizzle.asc,
    desc: drizzle.desc,
    sql: drizzle.sql,
    exists: drizzle.exists,
    ilike: drizzle.ilike,
    db: fake.db,
  };
});
vi.mock("@workspace/db/inventory", () => ({ setStockContext: async () => {} }));
vi.mock("@workspace/db/reviews", () => ({ syncProductRating: async () => {} }));
vi.mock("@workspace/db/wallet", () => ({
  StoreWalletLimitError: class extends Error {},
  StoreWalletNotActiveError: class extends Error {},
  postStoreWalletEntry: vi.fn(),
}));
vi.mock("@workspace/cache", () => ({
  applyInvalidation: async () => {},
  invalidateProductQuantityOffers: () => ({ tags: [], paths: [] }),
  invalidateStoreCrossSells: () => ({ tags: [], paths: [] }),
  invalidateProductInventory: () => ({ tags: [], paths: [] }),
  invalidateProduct: () => ({ tags: [], paths: [] }),
  invalidateSellerProducts: () => ({ tags: [], paths: [] }),
  invalidateSellerCoupons: () => ({ tags: [], paths: [] }),
  mergeInvalidations: () => ({ tags: [], paths: [] }),
  reviewTags: { seller: () => "", product: () => "" },
}));
vi.mock("@workspace/lib", () => ({ getPriceFinal: () => 100, parsePriceJson: () => ({ final: 100 }) }));
vi.mock("@workspace/lib/billing/server", () => ({ getBillingState: async () => ({ usdLive: false, marketRate: 50 }) }));
vi.mock("@workspace/lib/fulfillment/server", () => ({ uniqueViolationConstraint: () => null }));
vi.mock("@workspace/ai", () => ({ countAiUsageSince: async () => 1 }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/actions/auth", () => ({ getUser: mocks.getUser }));
vi.mock("@/lib/stores/current-store.server", () => ({ getSellerStores: async () => ({ stores: [], selected: null }) }));
vi.mock("@/lib/auth/require-seller.server", () => {
  class AccessError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return {
    AccessError,
    isAccessError: (error: unknown) => error instanceof AccessError,
    loadOrderLock: async () => ({ ordersLocked: false }),
  };
});
vi.mock("@/lib/products/product-store.server", () => ({
  requireProductStore: mocks.requireProductStore,
  requireStoreProduct: mocks.requireStoreProduct,
}));

const { AccessError } = (await import("@/lib/auth/require-seller.server")) as unknown as {
  AccessError: new (code: string) => Error & { code: string };
};
const { sql } = await import("drizzle-orm");
const quantityOffers = await import("./[productId]/edit/quantity-offers.server");
const crossSell = await import("./[productId]/edit/cross-sell.server");
const inventory = await import("./inventory/inventory.server");
const socialProof = await import("./social-proof/social-proof.server");
const aiSource = await import("./add/ai/ai-source.server");
const coupons = await import("@/actions/coupons");
const ads = await import("@/actions/ads");

const MARKER = "STORE_SCOPE_MARKER";
const allowed = () => ({ seller: SELLER, store: { id: STORE }, catalogSplit: false, inStore: sql.raw(`${MARKER} = ${MARKER}`) });
const refuse = (code = "not_found") => {
  const error = new AccessError(code);
  mocks.requireProductStore.mockRejectedValue(error);
  mocks.requireStoreProduct.mockRejectedValue(error);
};
const productWheres = () => fake.state.wheres.map(render);

beforeEach(() => {
  vi.clearAllMocks();
  fake.reset();
  mocks.requireProductStore.mockResolvedValue(allowed());
  mocks.requireStoreProduct.mockResolvedValue(allowed());
});

describe("quantity offers (F-07b)", () => {
  const tiers = [{ minQuantity: 2, discountType: "percent", discountValue: 10, isActive: true }];

  it("checks the named store and product, and refuses without touching the database", async () => {
    refuse();
    expect(await quantityOffers.saveQuantityOffers({ storeId: OTHER, productId: PRODUCT, tiers })).toEqual({ success: false, error: "notFound" });
    expect(mocks.requireStoreProduct).toHaveBeenCalledWith(OTHER, PRODUCT);
    expect(fake.state.calls).toEqual([]);
    expect(await quantityOffers.listQuantityOffers(OTHER, PRODUCT)).toEqual([]);
    expect(fake.state.calls).toEqual([]);
  });

  it("reads the product inside the store, and writes nothing when it isn't there", async () => {
    fake.state.results.select.push([]);
    expect(await quantityOffers.saveQuantityOffers({ storeId: STORE, productId: PRODUCT, tiers })).toEqual({ success: false, error: "notFound" });
    expect(productWheres()[0]).toContain(MARKER);
    expect(fake.state.calls).not.toContain("transaction");
  });
});

describe("cross-sells (F-32c)", () => {
  const offer = { storeId: STORE, productId: PRODUCT, offerProductId: OTHER, discountType: "percent", discountValue: 10 };

  it("refuses a store or product the guard rejects", async () => {
    refuse();
    expect(await crossSell.addCrossSell(offer)).toEqual({ success: false, error: "notFound" });
    expect(await crossSell.setCrossSellActive({ storeId: STORE, id: ROW, productId: PRODUCT, isActive: true })).toEqual({ success: false, error: "notFound" });
    expect(await crossSell.removeCrossSell({ storeId: STORE, id: ROW, productId: PRODUCT })).toEqual({ success: false, error: "notFound" });
    expect(await crossSell.listCrossSells(STORE, PRODUCT)).toEqual([]);
    expect(fake.state.calls).toEqual([]);
  });

  it("needs both products in the store: an offered product from another store is notFound", async () => {
    fake.state.results.select.push([{ id: PRODUCT }]); // only one of the two is in the store
    expect(await crossSell.addCrossSell(offer)).toEqual({ success: false, error: "notFound" });
    expect(mocks.requireStoreProduct).toHaveBeenCalledWith(STORE, PRODUCT);
    expect(productWheres()[0]).toContain(MARKER);
    expect(fake.state.calls).not.toContain("insert");
  });

  it("changes an offer only through its checked product", async () => {
    fake.state.results.update.push([]);
    expect(await crossSell.setCrossSellActive({ storeId: STORE, id: ROW, productId: PRODUCT, isActive: false })).toEqual({ success: false, error: "notFound" });
    expect(mocks.requireStoreProduct).toHaveBeenCalledWith(STORE, PRODUCT);
    expect(productWheres()[0]).toMatch(/"product_cross_sells"\."product_id" = \$/);
  });
});

describe("inventory restock (F-10c)", () => {
  const input = { productId: PRODUCT, variantId: null, add: 3 };

  it("maps the guard's refusals", async () => {
    refuse("not_found");
    expect(await inventory.restockAction(OTHER, input)).toEqual({ success: false, error: "notFound" });
    refuse("store_read_only");
    expect(await inventory.restockAction(STORE, input)).toEqual({ success: false, error: "readOnly" });
    expect(fake.state.calls).toEqual([]);
  });

  it("finds the product only inside the store", async () => {
    fake.state.results.select.push([]);
    expect(await inventory.restockAction(STORE, input)).toEqual({ success: false, error: "notFound" });
    expect(mocks.requireProductStore).toHaveBeenCalledWith(STORE);
    expect(productWheres()[0]).toContain(MARKER);
    expect(fake.state.calls).not.toContain("update");
  });
});

describe("seller-added reviews and social proof (0111)", () => {
  const input = { showLiveViews: true, reviews: [{ reviewerName: "Mona", rating: 5, comment: "" }] };

  it("refuses without touching the database", async () => {
    refuse();
    expect(await socialProof.saveProductSocialProof(OTHER, PRODUCT, input)).toEqual({ success: false, error: "notFound" });
    expect(fake.state.calls).toEqual([]);
  });

  it("updates the product inside the store, and adds no review when it isn't there", async () => {
    fake.state.results.update.push([]);
    expect(await socialProof.saveProductSocialProof(STORE, PRODUCT, input)).toEqual({ success: false, error: "notFound" });
    expect(productWheres()[0]).toContain(MARKER);
    expect(fake.state.calls).not.toContain("insert");
    expect(fake.state.calls).not.toContain("delete");
  });
});

describe("AI source mark (0112)", () => {
  it("marks only a product of the named store", async () => {
    refuse();
    expect(await aiSource.markProductAiAssisted(OTHER, PRODUCT, "add")).toEqual({ success: false });
    expect(fake.state.calls).toEqual([]);

    mocks.requireProductStore.mockResolvedValue(allowed());
    fake.state.results.update.push([]);
    expect(await aiSource.markProductAiAssisted(STORE, PRODUCT, "edit")).toEqual({ success: false });
    expect(productWheres()[0]).toContain(MARKER);
  });
});

describe("coupon product targets (F-87c, per-store coupons are F-87k)", () => {
  const coupon = {
    code: "SAVE10",
    name: "Save",
    discountType: "percentage" as const,
    discountValue: 10,
    minimumPurchase: null,
    maximumDiscount: null,
    usageLimit: null,
    perUserLimit: null,
    productIds: [PRODUCT, OTHER],
    channels: ["storefront" as const],
    showInCart: false,
    popup: null,
    startsAt: "2026-11-10T00:00:00Z",
    expiresAt: "2026-12-10T00:00:00Z",
  };

  it("the picker lists nothing for a store the guard rejects", async () => {
    refuse();
    expect(await coupons.searchCouponProducts({ storeId: OTHER, query: "mug" })).toEqual([]);
    expect(fake.state.calls).toEqual([]);
  });

  it("the picker reads only the store's products", async () => {
    fake.state.results.select.push([], []);
    // The chosen products and the newest ones (a text search adds a subquery the fake db can't render).
    await coupons.searchCouponProducts({ storeId: STORE, query: "", selectedIds: [PRODUCT] });
    expect(fake.state.wheres).toHaveLength(2);
    expect(mocks.requireProductStore).toHaveBeenCalledWith(STORE, { read: true });
    expect(productWheres().every((where) => where.includes(MARKER))).toBe(true);
  });

  it("a product target outside the store, or a rejected store, is invalid_products and nothing is saved", async () => {
    fake.state.results.select.push([{ id: PRODUCT }]);
    expect(await coupons.saveSellerCoupon(STORE, coupon)).toEqual({ success: false, error: "invalid_products" });
    expect(productWheres()[0]).toContain(MARKER);

    refuse();
    expect(await coupons.saveSellerCoupon(OTHER, coupon)).toEqual({ success: false, error: "invalid_products" });
    expect(fake.state.calls).not.toContain("insert");
    expect(fake.state.calls).not.toContain("update");
  });

  it("a coupon without product targets doesn't need a store (unchanged)", async () => {
    fake.state.results.insert.push([{ id: ROW, code: "SAVE10", name: "Save", discountType: "percentage", discountValue: "10", applicableTo: {}, startsAt: "", expiresAt: "" }]);
    const saved = await coupons.saveSellerCoupon(null, { ...coupon, productIds: null });
    expect(saved.success).toBe(true);
    expect(mocks.requireProductStore).not.toHaveBeenCalled();
  });
});

describe("paid ads product (F-87c; the price and wallet charge are unchanged)", () => {
  const request = { storeId: OTHER, paymentMethod: "wallet" as const, packageKey: "weekly_full", productId: PRODUCT };

  it("a rejected store is product_not_found before any write", async () => {
    refuse();
    expect(await ads.createAdRequest(request)).toEqual({ success: false, error: "product_not_found" });
    expect(fake.state.calls).toEqual([]);
  });

  it("the product is read inside the store", async () => {
    fake.state.results.select.push([]);
    expect(await ads.createAdRequest({ ...request, storeId: STORE })).toEqual({ success: false, error: "product_not_found" });
    expect(mocks.requireProductStore).toHaveBeenCalledWith(STORE);
    expect(productWheres()[0]).toContain(MARKER);
    expect(fake.state.calls).not.toContain("transaction");
  });
});
