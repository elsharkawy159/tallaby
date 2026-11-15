import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn(async () => [] as unknown[]);
const cachedCalls: unknown[][] = [];

vi.mock("@workspace/db", () => {
  const sql = Object.assign(() => ({ as: () => ({}) }), { raw: () => ({}) });
  const op = () => ({});
  return {
    db: { query: { products: { findMany } }, select: () => ({ from: () => ({ where: async () => [] }) }) },
    products: {},
    productVariants: {},
    categories: {},
    brands: {},
    sellerCategoryProductPositions: {},
    eq: op,
    and: op,
    or: op,
    gte: op,
    sql,
    desc: op,
    asc: op,
    isNull: op,
    inArray: op,
  };
});
vi.mock("@workspace/lib/stores/scope/server", () => ({ productShownInStore: () => ({}) }));
vi.mock("@/lib/platform-switches.server", () => ({ isSwitchOn: async () => true }));
vi.mock("@/lib/product-translations", () => ({ mergeProductWithTranslation: (p: unknown) => p, pickTranslationFromArray: () => null }));
vi.mock("@workspace/cache", () => ({
  cacheProfiles: { listing: 60 },
  productTags: { listing: () => "l", category: () => "c", brand: () => "b", seller: () => "s", store: () => "st", featured: () => "f", trending: () => "t", seasonal: () => "se", sponsored: () => "sp" },
  storeTags: { catalog: () => "cat" },
  createCachedQuery:
    (cfg: { query: (...args: unknown[]) => Promise<unknown> }) =>
    (...args: unknown[]) => {
      cachedCalls.push(args);
      return cfg.query(...args);
    },
}));

const { getProducts } = await import("./product-list.server");

describe("getProducts", () => {
  beforeEach(() => {
    cachedCalls.length = 0;
    findMany.mockClear();
  });

  it("reads a store search straight from the database, with the store's scope", async () => {
    const result = await getProducts({ sellerId: "seller", storeId: "store", searchQuery: "red shoes" });
    expect(cachedCalls).toHaveLength(0);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ success: true, data: [], totalCount: 0 });
  });

  it("keeps a store list without search, and every cross-store list, cached", async () => {
    await getProducts({ sellerId: "seller", storeId: "store", sortBy: "newest" });
    await getProducts({ searchQuery: "red shoes" });
    expect(cachedCalls).toHaveLength(2);
    expect(cachedCalls[0]).toEqual([{ sellerId: "seller", storeId: "store", sortBy: "newest" }, true]);
    expect(cachedCalls[1]).toEqual([{ searchQuery: "red shoes" }, false]);
  });
});
