import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoryTags, productTags, reviewTags, storeTags } from "@workspace/cache";

/**
 * Store catalog caches (ROADMAP.md F-87c slice 4): every storefront product,
 * category and review read is keyed by the store AND the `stores_catalog_split`
 * switch, which is read outside the cached function, and carries the store's
 * tags (plus the seller's, rule 8). No database: the cached function is
 * recorded, never run.
 */
const recorded = vi.hoisted(() => ({
  queries: [] as { name: string; args: unknown[]; tags: string[] }[],
  unstable: [] as { keyParts: string[]; tags: string[] }[],
  switchOn: false,
  switchReads: 0,
}));

vi.mock("@workspace/cache", async (original) => {
  const actual = await original<typeof import("@workspace/cache")>();
  return {
    ...actual,
    createCachedQuery:
      (cfg: { name: string; tags: (...args: unknown[]) => readonly string[] }) =>
      async (...args: unknown[]) => {
        recorded.queries.push({ name: cfg.name, args, tags: [...cfg.tags(...args)] });
        return { success: true, data: [], totalCount: 0 };
      },
  };
});
vi.mock("next/cache", () => ({
  unstable_cache: (_fn: unknown, keyParts: string[], options?: { tags?: string[] }) => async () => {
    recorded.unstable.push({ keyParts, tags: options?.tags ?? [] });
    return false;
  },
  revalidateTag: () => {},
  revalidatePath: () => {},
}));
vi.mock("@/lib/platform-switches.server", () => ({
  isSwitchOn: async (key: string) => {
    recorded.switchReads += 1;
    return key === "stores_catalog_split" && recorded.switchOn;
  },
}));
vi.mock("@/actions/auth", () => ({ getUser: async () => null }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }));

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE_A = "22222222-2222-4222-8222-222222222222";
const STORE_B = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  recorded.queries.length = 0;
  recorded.unstable.length = 0;
  recorded.switchOn = false;
  recorded.switchReads = 0;
});

describe("getProducts on a store host", { timeout: 30_000 }, () => {
  it("puts the switch in the key, read outside the cached function", async () => {
    const { getProducts } = await import("@/lib/products/product-list.server");
    await getProducts({ sellerId: SELLER, storeId: STORE_A, limit: 4 });
    recorded.switchOn = true;
    await getProducts({ sellerId: SELLER, storeId: STORE_A, limit: 4 });
    const [off, on] = recorded.queries;
    expect(off!.args).toEqual([{ sellerId: SELLER, storeId: STORE_A, limit: 4 }, false]);
    expect(on!.args).toEqual([{ sellerId: SELLER, storeId: STORE_A, limit: 4 }, true]);
    expect(recorded.switchReads).toBe(2);
  });

  it("tags a store read with the seller, the store's products and its catalog, never another store", async () => {
    const { getProducts } = await import("@/lib/products/product-list.server");
    await getProducts({ sellerId: SELLER, storeId: STORE_B });
    const { tags } = recorded.queries[0]!;
    expect(tags).toEqual(
      expect.arrayContaining([productTags.seller(SELLER), productTags.store(SELLER, STORE_B), storeTags.catalog(SELLER, STORE_B)]),
    );
    expect(tags).not.toContain(productTags.store(SELLER, STORE_A));
    expect(tags).not.toContain(productTags.listing());
  });

  it("a read without a store (tallaby.com leftovers) doesn't read the switch", async () => {
    const { getProducts } = await import("@/lib/products/product-list.server");
    await getProducts({ limit: 2 });
    expect(recorded.switchReads).toBe(0);
    expect(recorded.queries[0]!.args[1]).toBe(false);
  });
});

describe("getProductBySlug", () => {
  it("is keyed by seller, store and switch, and tagged by seller, store and catalog", async () => {
    const { getProductBySlug } = await import("@/actions/products");
    recorded.switchOn = true;
    await getProductBySlug(SELLER, STORE_A, "lamp", "ar");
    const query = recorded.queries[0]!;
    expect(query.name).toBe("ecommerce:products:by-slug:v2");
    expect(query.args).toEqual([SELLER, STORE_A, "lamp", "ar", true]);
    expect(query.tags).toEqual([productTags.seller(SELLER), productTags.store(SELLER, STORE_A), storeTags.catalog(SELLER, STORE_A)]);
  });
});

describe("storefront.server caches", { timeout: 30_000 }, () => {
  it("getStorefrontCategories keys by store and catalog mode", async () => {
    const { getStorefrontCategories } = await import("@/lib/storefront.server");
    await getStorefrontCategories(SELLER, STORE_A);
    recorded.switchOn = true;
    await getStorefrontCategories(SELLER, STORE_A);
    await getStorefrontCategories(SELLER, STORE_B);
    const keys = recorded.unstable.map((u) => u.keyParts.join("|"));
    expect(new Set(keys).size).toBe(3);
    expect(keys[0]).toContain(STORE_A);
    expect(keys[0]).toContain("shared");
    expect(keys[1]).toContain("split");
    expect(recorded.unstable[2]!.tags).toEqual(
      expect.arrayContaining([productTags.seller(SELLER), productTags.store(SELLER, STORE_B), storeTags.catalog(SELLER, STORE_B), categoryTags.all()]),
    );
  });

  it("storeHasProducts keys by store and catalog mode", async () => {
    const { storeHasProducts } = await import("@/lib/storefront.server");
    await storeHasProducts({ id: SELLER, storeId: STORE_A });
    recorded.switchOn = true;
    await storeHasProducts({ id: SELLER, storeId: STORE_A });
    const [off, on] = recorded.unstable;
    expect(off!.keyParts.join()).not.toBe(on!.keyParts.join());
    expect(on!.tags).toContain(productTags.store(SELLER, STORE_A));
  });

  it("store reviews are keyed by store and switch and carry the store tags", async () => {
    const { getCachedStoreReviews, getCachedStoreReviewStats } = await import("@/lib/store-site/store-data.server");
    await getCachedStoreReviews(SELLER, STORE_A, 6, 0, true);
    await getCachedStoreReviewStats(SELLER, STORE_A, false);
    const [list, stats] = recorded.queries;
    expect(list!.args).toEqual([SELLER, STORE_A, 6, 0, true]);
    expect(stats!.args).toEqual([SELLER, STORE_A, false]);
    for (const q of [list!, stats!]) {
      expect(q.tags).toEqual(expect.arrayContaining([reviewTags.seller(SELLER), productTags.store(SELLER, STORE_A), storeTags.catalog(SELLER, STORE_A)]));
    }
  });

  it("the store's brand list (F-87d) is keyed by store and switch, tagged by seller and that store only", async () => {
    const { getCachedSellerBrands } = await import("@/lib/store-site/store-data.server");
    await getCachedSellerBrands(SELLER, STORE_A, false);
    await getCachedSellerBrands(SELLER, STORE_A, true);
    await getCachedSellerBrands(SELLER, STORE_B, true);
    const [off, on, other] = recorded.queries;
    expect(off!.name).toBe("storefront:seller-brands:v3");
    expect(off!.args).toEqual([SELLER, STORE_A, false]);
    expect(on!.args).toEqual([SELLER, STORE_A, true]);
    expect(on!.tags).toEqual([productTags.seller(SELLER), productTags.store(SELLER, STORE_A)]);
    expect(other!.tags).toContain(productTags.store(SELLER, STORE_B));
    expect(other!.tags).not.toContain(productTags.store(SELLER, STORE_A));
  });
});
