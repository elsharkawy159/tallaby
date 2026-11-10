import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuthUsers } from "../../../packages/db/src/testing/auth-users";

/**
 * Product slugs are not unique across sellers: a store opens a slug only among
 * its own seller's products. Runs against the STAGING database with two sellers
 * of its own, removed afterwards, and only when TEST_DATABASE_URL is the staging
 * project. Never point it at production.
 */
const STAGING_REF = "cxqjrwjianxskhzmrkla";
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const isStaging = Boolean(TEST_DATABASE_URL?.includes(STAGING_REF));
if (isStaging) process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.NEXT_PUBLIC_ROOT_DOMAIN = "tallaby.com";

/** A small Data Cache: entries by key with their tags, so a test can purge by tag. */
const cache = vi.hoisted(() => ({
  entries: new Map<string, { tags: string[]; value: unknown }>(),
  host: "",
}));

vi.mock("next/cache", () => ({
  unstable_cache:
    (fn: (...args: unknown[]) => Promise<unknown>, keyParts: string[], options?: { tags?: string[] }) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify(keyParts);
      const hit = cache.entries.get(key);
      if (hit) return hit.value;
      const value = await fn(...args);
      cache.entries.set(key, { tags: options?.tags ?? [], value });
      return value;
    },
  revalidateTag: () => {},
  revalidatePath: () => {},
}));
// The package resolves its own copy of next/cache, so its one helper is swapped here (same key parts).
vi.mock("@workspace/cache", async (original) => {
  const actual = await original<typeof import("@workspace/cache")>();
  return {
    ...actual,
    createCachedQuery:
      <A extends readonly unknown[], R>(cfg: { name: string; tags: (...args: A) => readonly string[]; query: (...args: A) => Promise<R> }) =>
      async (...args: A) => {
        const key = JSON.stringify([cfg.name, JSON.stringify(args)]);
        const hit = cache.entries.get(key);
        if (hit) return hit.value as R;
        const value = await cfg.query(...args);
        cache.entries.set(key, { tags: [...cfg.tags(...args)], value });
        return value;
      },
  };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: cache.host }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/actions/auth", () => ({ getUser: async () => null }));

describe.skipIf(!isStaging)("store product slugs (integration)", { timeout: 120_000 }, () => {
  const run = randomUUID().slice(0, 8);
  const sellerA = randomUUID();
  const sellerB = randomUUID();
  const sellerC = randomUUID();
  const subA = `slugdup-${run}-a`;
  const subB = `slugdup-${run}-b`;
  const subC = `slugdup-${run}-c`;
  // The same title gives both sellers this slug in both languages.
  const shared = `same-title-${run}`;
  const productA = randomUUID();
  const productB = randomUUID();
  const onlyA = `only-a-${run}`;
  const onlyAProduct = randomUUID();
  const arOnly = `ar-only-${run}`;
  const arOnlyProduct = randomUUID();
  const dupOlder = randomUUID();
  const dupYounger = randomUUID();
  const dup = `dup-${run}`;
  const draftShadow = randomUUID();
  const live = randomUUID();
  const shadowed = `shadow-${run}`;

  const load = async () => ({
    ...(await import("@workspace/db")),
    ...(await import("@/actions/products")),
    ...(await import("@/actions/i18n")),
    ...(await import("@/lib/product-translations")),
    ...(await import("@/lib/sitemap/sitemap.server")),
    ...(await import("@/lib/sitemap/store-sitemap.lib")),
    ...(await import("@/lib/product-feed/product-feed.server")),
    ...(await import("@/lib/storefront.server")),
    ...(await import("@workspace/cache")),
  });

  const subOf = (sellerId: string) => (sellerId === sellerA ? subA : sellerId === sellerB ? subB : subC);
  /** The seller's store (the one its subdomain resolves to), as a store page sees it. */
  const storeOf = async (sellerId: string) => {
    const { getStorefrontBySubdomain } = await load();
    const store = await getStorefrontBySubdomain(subOf(sellerId));
    if (!store) throw new Error(`no store for ${sellerId}`);
    return store;
  };
  /** The product id a store's page would get from the cached query. */
  const open = async (sellerId: string, slug: string, locale: "ar" | "en" = "en") => {
    const { getProductBySlug } = await load();
    const store = await storeOf(sellerId);
    const result = await getProductBySlug(store.id, store.storeId, slug, locale);
    return result.success ? (result.data as { id: string }).id : null;
  };

  const purge = (tags: readonly string[]) => {
    for (const [key, entry] of cache.entries) {
      if (entry.tags.some((tag) => tags.includes(tag))) cache.entries.delete(key);
    }
  };

  beforeAll(async () => {
    const { db, users, sellers, products, productTranslations, categories } = await load();
    await createAuthUsers(sellerA, sellerB, sellerC);
    await db.insert(users).values([sellerA, sellerB, sellerC].map((id) => ({ id, isGuest: false, role: "seller" as const })));
    await db.insert(sellers).values(
      [
        [sellerA, subA],
        [sellerB, subB],
        [sellerC, subC],
      ].map(([id, subdomain]) => ({
        id: id!,
        businessName: `Slug ${subdomain}`,
        displayName: `Slug ${subdomain}`,
        slug: subdomain!,
        subdomain: subdomain!,
        businessType: "individual" as const,
        legalAddress: { country: "EG" },
        supportEmail: "slug@example.test",
        status: "approved" as const,
      })),
    );
    const [category] = await db.select({ id: categories.id }).from(categories).limit(1);
    const base = { categoryId: category!.id, images: ["p/a.jpg"], quantity: "4", price: { base: 100, final: 100 } };
    await db.insert(products).values([
      // Seller A's is older, so a lookup across all sellers always finds it first.
      { ...base, id: productA, sellerId: sellerA, status: "active", createdAt: "2020-01-01T00:00:00Z" },
      { ...base, id: productB, sellerId: sellerB, status: "active", createdAt: "2020-06-01T00:00:00Z" },
      { ...base, id: onlyAProduct, sellerId: sellerA, status: "active", createdAt: "2020-01-02T00:00:00Z" },
      { ...base, id: arOnlyProduct, sellerId: sellerB, status: "active", createdAt: "2020-01-03T00:00:00Z" },
      { ...base, id: dupOlder, sellerId: sellerB, status: "active", createdAt: "2020-02-01T00:00:00Z" },
      { ...base, id: dupYounger, sellerId: sellerB, status: "active", createdAt: "2020-03-01T00:00:00Z" },
      { ...base, id: draftShadow, sellerId: sellerB, status: "draft", createdAt: "2020-01-04T00:00:00Z" },
      { ...base, id: live, sellerId: sellerB, status: "active", createdAt: "2020-04-01T00:00:00Z" },
    ]);
    const row = (productId: string, locale: "ar" | "en", slug: string, title = slug) => ({ productId, locale, title, slug });
    await db.insert(productTranslations).values([
      row(productA, "en", shared, "Seller A"),
      row(productA, "ar", `${shared}-a-ar`, "Seller A ar"),
      row(productB, "en", shared, "Seller B"),
      row(productB, "ar", `${shared}-b-ar`, "Seller B ar"),
      row(onlyAProduct, "en", onlyA),
      row(arOnlyProduct, "ar", arOnly),
      row(dupOlder, "en", dup),
      row(dupYounger, "en", dup),
      row(draftShadow, "en", shadowed),
      row(live, "en", shadowed),
    ]);
  }, 120_000);

  afterAll(async () => {
    const { db, adminNotifications, sellerNotifications, inArray } = await load();
    const ids = [sellerA, sellerB, sellerC];
    // Bell rows the product and seller triggers wrote. The auth rows cascade the rest (auth-users.ts).
    await db.delete(sellerNotifications).where(inArray(sellerNotifications.sellerId, ids));
    await db.delete(adminNotifications).where(inArray(adminNotifications.sellerId, ids));
  }, 120_000);

  it("each seller opens their own product on their own store, never the other's", async () => {
    expect(await open(sellerA, shared)).toBe(productA);
    expect(await open(sellerB, shared)).toBe(productB);
    // In this order too: the first seller's cache entry must not answer for the second.
    expect(await open(sellerA, shared)).toBe(productA);
  });

  it("the id lookup is scoped, and only the unscoped one still crosses sellers", async () => {
    const { getProductIdBySlug } = await load();
    const scope = async (sellerId: string) => ({ sellerId, storeId: (await storeOf(sellerId)).storeId, catalogSplit: false });
    expect(await getProductIdBySlug(shared, "en", await scope(sellerB))).toBe(productB);
    expect(await getProductIdBySlug(shared, "en", await scope(sellerC))).toBeNull();
    expect(await getProductIdBySlug(shared, "en")).toBe(productA);
  });

  it("a slug only another seller has is not found on this store", async () => {
    expect(await open(sellerB, onlyA)).toBeNull();
    expect(await open(sellerC, shared)).toBeNull();
  });

  it("keeps the language fallback, inside the seller", async () => {
    expect(await open(sellerB, arOnly, "ar")).toBe(arOnlyProduct);
    expect(await open(sellerB, arOnly, "en")).toBe(arOnlyProduct);
    expect(await open(sellerA, arOnly, "en")).toBeNull();
  });

  it("a draft does not shadow the live product, and a seller's own duplicate goes to the oldest", async () => {
    expect(await open(sellerB, shadowed)).toBe(live);
    expect(await open(sellerB, dup)).toBe(dupOlder);
  });

  it("the cache key and tags carry the seller and store, and a product change clears that seller only", async () => {
    const { db, productTranslations, productTags, storeTags, invalidateProduct, eq, and } = await load();
    cache.entries.clear();
    const stores = { [sellerA]: (await storeOf(sellerA)).storeId, [sellerB]: (await storeOf(sellerB)).storeId };
    expect(await open(sellerA, shared)).toBe(productA);
    expect(await open(sellerB, shared)).toBe(productB);

    const bySlug = [...cache.entries.entries()].filter(([key]) => key.includes("by-slug"));
    expect(bySlug).toHaveLength(2);
    for (const seller of [sellerA, sellerB]) {
      const entry = bySlug.find(([key]) => key.includes(seller));
      expect(entry).toBeDefined();
      expect(entry![0]).toContain(stores[seller]!);
      expect(entry![1].tags).toEqual([productTags.seller(seller), productTags.store(seller, stores[seller]!), storeTags.catalog(seller, stores[seller]!)]);
    }

    // Seller B renames the slug: the old link stops opening, the new one opens, A is untouched.
    const renamed = `${shared}-renamed`;
    expect(await open(sellerB, renamed)).toBeNull(); // now cached as not found under its own key
    await db
      .update(productTranslations)
      .set({ slug: renamed })
      .where(and(eq(productTranslations.productId, productB), eq(productTranslations.locale, "en")));
    const snapshot = (slug: string) => ({
      id: productB,
      sellerId: sellerB,
      categoryId: null,
      brandId: null,
      slugs: [{ locale: "en", slug }],
      status: "active" as const,
      isFeatured: false,
      isTrending: false,
      isSeasonal: false,
      isMostSelling: false,
      isPlatformChoice: false,
      sponsored: false,
      priceKey: "100",
    });
    // Until the purge both answers are the cached ones.
    expect(await open(sellerB, shared)).toBe(productB);
    expect(await open(sellerB, renamed)).toBeNull();
    purge(invalidateProduct(snapshot(shared), snapshot(renamed)).tags);
    expect(await open(sellerB, shared)).toBeNull();
    expect(await open(sellerB, renamed)).toBe(productB);
    expect(cache.entries.get(bySlug.find(([key]) => key.includes(sellerA))![0])).toBeDefined();

    await db
      .update(productTranslations)
      .set({ slug: shared })
      .where(and(eq(productTranslations.productId, productB), eq(productTranslations.locale, "en")));
    purge(invalidateProduct(snapshot(renamed), snapshot(shared)).tags);
  });

  it("the store sitemap lists a product another seller's older product shares a slug with", async () => {
    const { fetchActiveProductTranslations, buildStoreSitemapEntries } = await load();
    const rows = await fetchActiveProductTranslations({ sellerId: sellerB });
    expect(rows.some((r) => r.productId === productB && r.slug === shared)).toBe(true);
    expect(rows.every((r) => r.productId !== productA)).toBe(true);

    const entries = buildStoreSitemapEntries({ baseUrl: `https://${subB}.tallaby.com`, indexable: true, pages: [], products: rows });
    expect(entries.map((e) => e.url)).toContain(`https://${subB}.tallaby.com/en/products/${shared}`);
    // A seller's own duplicate is listed once, for the product the page opens.
    expect(entries.filter((e) => e.url.endsWith(`/en/products/${dup}`))).toHaveLength(1);
  });

  it("the store feed links a product another seller's older product shares a slug with", async () => {
    const { feedProductPages, getStorefrontBySubdomain } = await load();
    const store = await getStorefrontBySubdomain(subB);
    expect(store?.id).toBe(sellerB);
    const rows = [];
    for await (const page of feedProductPages(store!)) rows.push(...page);
    expect(rows.find((r) => r.id === productB)?.translations.en?.slug).toBe(shared);
  });

  it("the language switcher stays inside the store the request host names", async () => {
    const { resolveProductSlugForLocale } = await load();
    cache.host = `${subB}.tallaby.com`;
    expect(await resolveProductSlugForLocale(shared, "ar")).toBe(`${shared}-b-ar`);
    cache.host = `${subA}.tallaby.com`;
    expect(await resolveProductSlugForLocale(shared, "ar")).toBe(`${shared}-a-ar`);
    cache.host = `${subC}.tallaby.com`;
    expect(await resolveProductSlugForLocale(shared, "ar")).toBeNull();
    // An address that is no live store opens nothing; tallaby.com keeps the lookup across sellers.
    cache.host = `slugdup-${run}-gone.tallaby.com`;
    expect(await resolveProductSlugForLocale(shared, "ar")).toBeNull();
    cache.host = "tallaby.com";
    expect(await resolveProductSlugForLocale(shared, "ar")).toBe(`${shared}-a-ar`);
  });
});
