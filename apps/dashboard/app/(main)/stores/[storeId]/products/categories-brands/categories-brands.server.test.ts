import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * F-87d: the seller categories and brands are per store. Every action takes an
 * explicit `storeId`, asks `requireProductStore` for it (stubbed here; the
 * guard is tested in lib/products/product-store.server.test.ts and against a
 * database in packages/lib/src/stores/store-separation.integration.test.ts),
 * and matches every item with `taxonomyInStore` (real) in the same WHERE:
 * - a refused store (foreign, deleted, forged) is notFound with no query;
 * - switch on: every WHERE carries `store_id` = the checked store;
 * - switch off: the seller's list, no `store_id` (today's behaviour);
 * - new rows write `store_id` = the checked store in both modes.
 * The database is a fake that records each WHERE and insert values.
 */

const STORE = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const ITEM = "33333333-3333-4333-8333-333333333333";
const PRODUCT = "44444444-4444-4444-8444-444444444444";
const SELLER_ID = "55555555-5555-4555-8555-555555555555";
const SELLER = { userId: "u1", sellerId: SELLER_ID, status: "approved", plan: "free", maxStoresOverride: null };

const dialect = new PgDialect();
const render = (where: unknown) => dialect.sqlToQuery(where as SQL);

const mocks = vi.hoisted(() => ({
  requireProductStore: vi.fn(),
  invalidateStoreProducts: vi.fn((sellerId: string, storeId: string) => ({ tags: [`store:${sellerId}:${storeId}`], paths: [] })),
}));

const fake = vi.hoisted(() => {
  const state = {
    wheres: [] as unknown[],
    values: [] as unknown[],
    calls: [] as string[],
    results: { select: [] as unknown[][], update: [] as unknown[][], insert: [] as unknown[][], delete: [] as unknown[][] },
  };
  const chain = (result: unknown[]): unknown => {
    const proxy: unknown = new Proxy(() => undefined, {
      get(_t, prop) {
        if (prop === "then") return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
        if (prop === "where") return (arg: unknown) => (state.wheres.push(arg), proxy);
        if (prop === "values") return (arg: unknown) => (state.values.push(arg), proxy);
        return () => proxy;
      },
    });
    return proxy;
  };
  const kind = (name: keyof typeof state.results) => () => {
    state.calls.push(name);
    return chain(state.results[name].shift() ?? []);
  };
  const db = { select: kind("select"), update: kind("update"), insert: kind("insert"), delete: kind("delete") };
  const reset = () => {
    state.wheres.length = 0;
    state.values.length = 0;
    state.calls.length = 0;
    for (const list of Object.values(state.results)) list.length = 0;
  };
  return { state, db, reset };
});

vi.mock("@workspace/db", async () => {
  const drizzle = await import("drizzle-orm");
  const schema = await import("@workspace/db/schema");
  return { ...schema, ...drizzle, db: fake.db };
});
vi.mock("@workspace/cache", () => ({
  applyInvalidation: async () => {},
  invalidateStoreProducts: mocks.invalidateStoreProducts,
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/auth/require-seller.server", () => {
  class AccessError extends Error {
    constructor(readonly code: string) {
      super(code);
    }
  }
  return { AccessError, isAccessError: (e: unknown) => e instanceof AccessError, requireSeller: async () => SELLER };
});
vi.mock("@/lib/products/product-store.server", () => ({
  requireProductStore: mocks.requireProductStore,
  taxonomyScopeOf: (ctx: { seller: { sellerId: string }; store: { id: string }; catalogSplit: boolean }) => ({
    sellerId: ctx.seller.sellerId,
    storeId: ctx.store.id,
    catalogSplit: ctx.catalogSplit,
  }),
}));

const { AccessError } = (await import("@/lib/auth/require-seller.server")) as unknown as {
  AccessError: new (code: string) => Error & { code: string };
};
const { sql } = await import("drizzle-orm");
const actions = await import("./categories-brands.server");

const MARKER = "PRODUCT_IN_STORE_MARKER";
const allowed = (catalogSplit: boolean) => ({ seller: SELLER, store: { id: STORE }, catalogSplit, inStore: sql.raw(`${MARKER} = ${MARKER}`) });
const wheres = () => fake.state.wheres.map(render);

beforeEach(() => {
  vi.clearAllMocks();
  fake.reset();
  mocks.requireProductStore.mockResolvedValue(allowed(true));
});

describe("a refused store (foreign, deleted, forged)", () => {
  it("is notFound for every action, with no query", async () => {
    mocks.requireProductStore.mockRejectedValue(new AccessError("not_found"));
    const notFound = { success: false, error: "notFound" };
    expect(await actions.addTaxonomyItem(OTHER, "category", { name: "Shoes" })).toEqual(notFound);
    expect(await actions.ensureTaxonomyItem(OTHER, "brand", { name: "Acme" })).toEqual(notFound);
    expect(await actions.updateTaxonomyItem(OTHER, "category", ITEM, { name: "Shoes" })).toEqual(notFound);
    expect(await actions.deleteTaxonomyItem(OTHER, "brand", ITEM)).toEqual(notFound);
    expect(await actions.reorderTaxonomyItems(OTHER, "category", [ITEM])).toEqual(notFound);
    expect(await actions.setProductSellerTaxonomy(OTHER, PRODUCT, { sellerCategoryId: ITEM, sellerBrandId: null })).toEqual(notFound);
    expect(mocks.requireProductStore).toHaveBeenCalledWith(OTHER);
    expect(fake.state.calls).toEqual([]);
  });

  it("an archived store after the split is readOnly", async () => {
    mocks.requireProductStore.mockRejectedValue(new AccessError("store_read_only"));
    expect(await actions.deleteTaxonomyItem(STORE, "category", ITEM)).toEqual({ success: false, error: "readOnly" });
  });
});

describe("switch on: the store's own list", () => {
  it("update, delete and reorder match store_id = the checked store", async () => {
    fake.state.results.update.push([]);
    expect(await actions.updateTaxonomyItem(STORE, "category", ITEM, { name: "Shoes" })).toEqual({ success: false, error: "notFound" });
    fake.state.results.delete.push([]);
    expect(await actions.deleteTaxonomyItem(STORE, "brand", ITEM)).toEqual({ success: false, error: "notFound" });
    fake.state.results.select.push([]); // the store owns no items, so the list sent is stale
    expect(await actions.reorderTaxonomyItems(STORE, "category", [ITEM])).toEqual({ success: false, error: "notFound" });
    const [update, del, owned] = wheres();
    expect(update!.sql).toContain(`"seller_product_categories"."store_id"`);
    expect(update!.params).toEqual([ITEM, SELLER_ID, STORE]);
    expect(del!.sql).toContain(`"seller_product_brands"."store_id"`);
    expect(del!.params).toEqual([ITEM, SELLER_ID, STORE]);
    expect(owned!.params).toEqual([SELLER_ID, STORE]);
    expect(fake.state.calls).not.toContain("insert");
  });

  it("add counts and positions within the store and writes store_id", async () => {
    fake.state.results.select.push([{ total: 0 }]);
    fake.state.results.insert.push([{ id: ITEM }]);
    const result = await actions.addTaxonomyItem(STORE, "category", { name: "Shoes" });
    expect(result).toMatchObject({ success: true, data: { id: ITEM, name: "Shoes" } });
    expect(wheres()[0]!.params).toEqual([SELLER_ID, STORE]);
    const values = fake.state.values[0] as { sellerId: string; storeId: string; position: SQL };
    expect(values).toMatchObject({ sellerId: SELLER_ID, storeId: STORE });
    expect(render(values.position).sql).toContain("t.store_id");
    // A plain own-name category doesn't change a storefront; a brand purges this store (and the seller tags).
    expect(mocks.invalidateStoreProducts).not.toHaveBeenCalled();
    fake.state.results.select.push([{ total: 0 }]);
    fake.state.results.insert.push([{ id: ITEM }]);
    await actions.addTaxonomyItem(STORE, "brand", { name: "Acme" });
    expect(mocks.invalidateStoreProducts).toHaveBeenCalledWith(SELLER_ID, STORE);
  });

  it("ensure looks only in the store's list before adding there", async () => {
    fake.state.results.select.push([{ id: ITEM, name: "Shoes", nameAr: null, sourceId: null }]);
    expect(await actions.ensureTaxonomyItem(STORE, "category", { name: "shoes" })).toEqual({
      success: true,
      data: { id: ITEM, name: "Shoes", nameAr: null, sourceId: null },
    });
    expect(wheres()[0]!.sql).toContain(`"seller_product_categories"."store_id"`);
    expect(fake.state.calls).toEqual(["select"]);
  });

  it("a product can't be given another store's category: notFound, and the product is untouched", async () => {
    fake.state.results.select.push([]); // the category is not in this store's list
    expect(await actions.setProductSellerTaxonomy(STORE, PRODUCT, { sellerCategoryId: ITEM, sellerBrandId: null })).toEqual({
      success: false,
      error: "notFound",
    });
    expect(wheres()[0]!.params).toEqual([ITEM, SELLER_ID, STORE]);
    expect(fake.state.calls).not.toContain("update");
  });

  it("a product outside the store is notFound (inStore in the UPDATE)", async () => {
    fake.state.results.select.push([{ id: ITEM }]);
    fake.state.results.update.push([]);
    expect(await actions.setProductSellerTaxonomy(STORE, PRODUCT, { sellerCategoryId: ITEM, sellerBrandId: null })).toEqual({
      success: false,
      error: "notFound",
    });
    expect(wheres()[1]!.sql).toContain(MARKER);
  });
});

describe("switch off: today's per-seller list", () => {
  beforeEach(() => mocks.requireProductStore.mockResolvedValue(allowed(false)));

  it("matches by seller only, never store_id", async () => {
    fake.state.results.update.push([{ id: ITEM }]);
    expect(await actions.updateTaxonomyItem(STORE, "brand", ITEM, { name: "Acme" })).toEqual({ success: true });
    fake.state.results.select.push([{ id: ITEM }]);
    fake.state.results.update.push([{ id: PRODUCT }]);
    expect(await actions.setProductSellerTaxonomy(STORE, PRODUCT, { sellerCategoryId: ITEM, sellerBrandId: null })).toEqual({ success: true });
    for (const where of wheres().slice(0, 2)) {
      expect(where.sql).not.toContain("store_id");
      expect(where.params).toEqual([ITEM, SELLER_ID]);
    }
    expect(mocks.invalidateStoreProducts).toHaveBeenCalledWith(SELLER_ID, STORE);
  });

  it("still writes store_id on a new row (nothing reads it until the split)", async () => {
    fake.state.results.select.push([{ total: 0 }]);
    fake.state.results.insert.push([{ id: ITEM }]);
    await actions.addTaxonomyItem(STORE, "brand", { name: "Acme" });
    expect(wheres()[0]!.sql).not.toContain("store_id");
    expect(fake.state.values[0]).toMatchObject({ sellerId: SELLER_ID, storeId: STORE });
  });
});
