import { beforeEach, describe, expect, it, vi } from "vitest";
import { productTags, storeTags } from "@workspace/cache";

/**
 * Product feed and store sitemap caches (ROADMAP.md F-87c slice 6): the
 * product rows are keyed by seller, store AND the `stores_catalog_split`
 * switch, which is read outside the cached function, and carry the store's
 * catalog tags (plus the seller's, rule 8). No database: the cached function
 * is recorded, never run.
 */
const recorded = vi.hoisted(() => ({
  queries: [] as { name: string; args: unknown[]; tags: string[] }[],
  pages: [] as { rows: unknown[]; next: string | null }[],
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
        if (cfg.name === "store-sitemap:products:v1") return recorded.pages.shift() ?? { rows: [], next: null };
        return [];
      },
  };
});
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
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

const storeTagsOf = (storeId: string) => [productTags.seller(SELLER), productTags.store(SELLER, storeId), storeTags.catalog(SELLER, storeId)];

beforeEach(() => {
  recorded.queries.length = 0;
  recorded.pages.length = 0;
  recorded.switchOn = false;
  recorded.switchReads = 0;
});

describe("product feed pages", { timeout: 30_000 }, () => {
  const storefront = (storeId: string) => ({ id: SELLER, storeId }) as Parameters<typeof import("@/lib/product-feed/product-feed.server").feedProductPages>[0];

  it("keys every page by seller, store and switch, read once outside the cache", async () => {
    const { feedProductPages } = await import("@/lib/product-feed/product-feed.server");
    for await (const _ of feedProductPages(storefront(STORE_A))) void _;
    recorded.switchOn = true;
    for await (const _ of feedProductPages(storefront(STORE_A))) void _;
    const pages = recorded.queries.filter((q) => q.name === "store-feed:page:v3");
    expect(pages.map((q) => q.args)).toEqual([
      [SELLER, STORE_A, false, 0],
      [SELLER, STORE_A, true, 0],
    ]);
    expect(recorded.switchReads).toBe(2);
  });

  it("tags a page with the seller, its store's products and catalog, never another store", async () => {
    const { feedProductPages } = await import("@/lib/product-feed/product-feed.server");
    for await (const _ of feedProductPages(storefront(STORE_B))) void _;
    const page = recorded.queries.find((q) => q.name === "store-feed:page:v3")!;
    expect(page.tags).toEqual(storeTagsOf(STORE_B));
    expect(page.tags).not.toContain(productTags.store(SELLER, STORE_A));
  });
});

describe("store sitemap product rows", { timeout: 30_000 }, () => {
  it("keys each page by seller, store, switch and cursor, and follows the cursor", async () => {
    const { fetchStoreProductTranslations } = await import("@/lib/sitemap/sitemap.server");
    const row = (productId: string) => ({ productId, locale: "en", slug: productId, title: productId, updatedAt: null, createdAt: null });
    recorded.pages.push({ rows: [row("a")], next: "t1" }, { rows: [row("b")], next: null });
    const rows = await fetchStoreProductTranslations(SELLER, { storeId: STORE_A, catalogSplit: true });
    expect(rows.map((r) => r.productId)).toEqual(["a", "b"]);
    expect(recorded.queries.map((q) => q.args)).toEqual([
      [SELLER, STORE_A, true, null],
      [SELLER, STORE_A, true, "t1"],
    ]);
  });

  it("different stores and catalog modes never share an entry, and each carries its store's tags", async () => {
    const { fetchStoreProductTranslations } = await import("@/lib/sitemap/sitemap.server");
    await fetchStoreProductTranslations(SELLER, { storeId: STORE_A, catalogSplit: false });
    await fetchStoreProductTranslations(SELLER, { storeId: STORE_A, catalogSplit: true });
    await fetchStoreProductTranslations(SELLER, { storeId: STORE_B, catalogSplit: true });
    const keys = recorded.queries.map((q) => JSON.stringify(q.args));
    expect(new Set(keys).size).toBe(3);
    expect(recorded.queries[2]!.tags).toEqual(storeTagsOf(STORE_B));
  });
});
