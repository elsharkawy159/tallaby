/**
 * Store product feed data (ROADMAP.md F-11a): the store a feed request's
 * HOST serves, and its active products in cached pages.
 *
 * Tenant rules (CLAUDE.md rule 5): the store comes from the request host
 * only (never a query value); every product query is filtered by that
 * store's seller and by what the store shows (`productShownInStore`: before
 * the catalog split its mode and picks, after it its own products; F-87c
 * slice 6). The switch is read once per request, outside the cache.
 * Caching (rule 8): `createCachedQuery`, keys carry the seller id, store id
 * and the switch; tags are the store catalog tags (`productTags.seller`,
 * `productTags.store`, `storeTags.catalog`). Pages of PAGE_SIZE products keep
 * every cache entry well under the Data Cache's 2 MB limit (a whole feed
 * would not fit).
 */
import { and, asc, db, desc, eq, inArray, isNull, sql } from "@workspace/db";
import { categories, products, productTranslations, productVariants, brands, sellerProductBrands, sellerProductCategories, stores } from "@workspace/db/schema";
import { cacheProfiles, categoryTags, createCachedQuery, sellerTags, storeTags } from "@workspace/cache";
import { parseStoreCurrency } from "@workspace/lib";
import { productShownInStore, type StoreCatalogScope } from "@workspace/lib/stores/scope/server";
import { storeUrl } from "@workspace/lib/storefront";
import { richTextToPlainText } from "@workspace/tiptap/plain-text";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import {
  getRequestStoreSubdomain,
  getStorefrontBySubdomain,
  isStorefrontOffline,
  storefrontCatalog,
  storefrontCatalogTags,
  type Storefront,
} from "@/lib/storefront.server";
import { googleCategoryFor, type FeedCategoryNode } from "./google-category.lib";
import { FEED_ITEM_LIMIT, feedSellerCategory, isVideoPath, type FeedProductRow, type FeedStoreInfo, type FeedTranslation } from "./product-feed.lib";

/** Products per cached page. */
const PAGE_SIZE = 100;
/** Pages read at most: enough products for FEED_ITEM_LIMIT items without variants. */
export const FEED_MAX_PAGES = Math.ceil(FEED_ITEM_LIMIT / PAGE_SIZE);
/** Plain-text description kept per language (the feed cuts at 5000; this bounds the cache entry). */
const DESCRIPTION_CACHE_MAX = 5000;

export interface FeedStore {
  store: Storefront;
  info: FeedStoreInfo;
}

/**
 * The published store this request's host serves, or `{ subdomain }` alone
 * when the host is a store subdomain that resolves to no live store (a
 * renamed one is redirected by the route), or null on tallaby.com.
 * Offline stores (never published, or switched off) have no feed.
 */
export async function getRequestFeedStore(): Promise<{ subdomain: string; feed: FeedStore | null } | null> {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return null;
  const store = await getStorefrontBySubdomain(subdomain);
  if (!store || isStorefrontOffline(store)) return { subdomain, feed: null };
  return {
    subdomain,
    feed: {
      store,
      info: {
        baseUrl: storeUrl(store.subdomain, store.customDomain).replace(/\/$/, ""),
        name: store.displayName,
        description: store.description,
        currency: await getStoreCurrency(store.id, store.storeId, store.subdomain),
      },
    },
  };
}

/** The store's currency code (Store settings › General; display only, amounts are not converted). */
const getStoreCurrency = createCachedQuery({
  name: "store-feed:currency:v2",
  ttl: cacheProfiles.seller,
  // Store settings › General saves purge the store's subdomain tag (invalidateStorefront).
  tags: (sellerId: string, storeId: string, subdomain: string) => [storeTags.catalog(sellerId, storeId), sellerTags.subdomain(subdomain)],
  query: async (sellerId: string, storeId: string, _subdomain: string) => {
    const [row] = await db
      .select({ settings: stores.settings })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)))
      .limit(1);
    return parseStoreCurrency(row?.settings).currency;
  },
});

/** Every Tallaby category's slug and parent, for the Google category mapping. Platform data. */
const getFeedCategoryTree = createCachedQuery({
  name: "store-feed:category-tree:v1",
  ttl: cacheProfiles.taxonomy,
  tags: () => [categoryTags.all(), categoryTags.tree()],
  query: async () => {
    const rows = await db.select({ id: categories.id, slug: categories.slug, parentId: categories.parentId, name: categories.name, nameAr: categories.nameAr }).from(categories);
    return rows;
  },
});

export async function loadFeedCategoryMap(): Promise<Map<string, FeedCategoryNode & { name: string | null; nameAr: string | null }>> {
  const rows = await getFeedCategoryTree();
  return new Map(rows.map((row) => [row.id, { slug: row.slug, parentId: row.parentId, name: row.name, nameAr: row.nameAr }]));
}

/** Gallery entries are storage paths, URLs or `{ url | path | src }`. */
function galleryPaths(images: unknown): string[] {
  const list = typeof images === "string" ? [images] : Array.isArray(images) ? images : [];
  const paths: string[] = [];
  for (const entry of list) {
    const value =
      typeof entry === "string"
        ? entry
        : entry && typeof entry === "object"
          ? ((entry as { url?: unknown }).url ?? (entry as { path?: unknown }).path ?? (entry as { src?: unknown }).src)
          : null;
    if (typeof value === "string" && value.trim()) paths.push(value.trim());
  }
  return paths;
}

const publicUrl = (path: string) => getPublicUrl(path, "products") || null;
const urls = (paths: string[]) => paths.map(publicUrl).filter((url): url is string => Boolean(url));

type PageRaw = Omit<FeedProductRow, "googleCategory" | "productType"> & {
  categoryId: string;
  sellerCategory: { ar: string | null; en: string | null } | null;
};

/**
 * One page of the store's active products, newest first. Read only through
 * the cached wrapper below; the seller and what the store shows bound every row.
 */
export async function loadFeedPage(sellerId: string, catalog: StoreCatalogScope, page: number): Promise<PageRaw[]> {
  const rows = await db
    .select({
      id: products.id,
      price: products.price,
      quantity: products.quantity,
      trackStock: products.trackStock,
      condition: products.condition,
      images: products.images,
      categoryId: products.categoryId,
      brandName: brands.name,
      sellerBrandName: sellerProductBrands.name,
      sellerBrandNameAr: sellerProductBrands.nameAr,
      sellerCategoryName: sellerProductCategories.name,
      sellerCategoryNameAr: sellerProductCategories.nameAr,
      // A sub-category's main category (0171), for product_type "Main > Sub".
      parentCategoryName: sql<string | null>`(SELECT pc.name FROM ${sellerProductCategories} pc WHERE pc.id = ${sellerProductCategories.parentId} AND pc.seller_id = ${sellerId})`,
      parentCategoryNameAr: sql<string | null>`(SELECT pc.name_ar FROM ${sellerProductCategories} pc WHERE pc.id = ${sellerProductCategories.parentId} AND pc.seller_id = ${sellerId})`,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(sellerProductBrands, and(eq(sellerProductBrands.id, products.sellerBrandId), eq(sellerProductBrands.sellerId, sellerId)))
    .leftJoin(sellerProductCategories, and(eq(sellerProductCategories.id, products.sellerCategoryId), eq(sellerProductCategories.sellerId, sellerId)))
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(products.status, "active"),
        // Trashed products are drafts already (0123, F-35); this keeps them out regardless.
        isNull(products.deletedAt),
        productShownInStore(catalog),
      ),
    )
    .orderBy(sql`${products.createdAt} DESC NULLS LAST`, desc(products.id))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);
  if (!rows.length) return [];

  const ids = rows.map((row) => row.id);
  const [translations, variants] = await Promise.all([
    db
      .select({
        productId: productTranslations.productId,
        locale: productTranslations.locale,
        title: productTranslations.title,
        description: productTranslations.description,
        slug: productTranslations.slug,
      })
      .from(productTranslations)
      .where(inArray(productTranslations.productId, ids)),
    db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        price: productVariants.price,
        stock: productVariants.stock,
        images: productVariants.images,
        imageUrl: productVariants.imageUrl,
        title: productVariants.title,
        option1: productVariants.option1,
        option2: productVariants.option2,
        option3: productVariants.option3,
        localized: productVariants.localized,
      })
      .from(productVariants)
      .where(inArray(productVariants.productId, ids))
      .orderBy(asc(productVariants.position), asc(productVariants.createdAt)),
  ]);

  return rows.map((row): PageRaw => {
    const gallery = galleryPaths(row.images);
    const byLocale: PageRaw["translations"] = {};
    for (const t of translations) {
      if (t.productId !== row.id || (t.locale !== "ar" && t.locale !== "en")) continue;
      const slug = t.slug?.trim() && !/[\s/\\?#%]/.test(t.slug) ? t.slug : null;
      const translation: FeedTranslation = {
        title: t.title ?? "",
        description: richTextToPlainText(t.description).replace(/\s+/g, " ").trim().slice(0, DESCRIPTION_CACHE_MAX),
        slug,
      };
      byLocale[t.locale] = translation;
    }
    const brandAr = row.sellerBrandNameAr || row.sellerBrandName || row.brandName;
    const brandEn = row.sellerBrandName || row.brandName || row.sellerBrandNameAr;
    return {
      id: row.id,
      price: row.price,
      quantity: Number(row.quantity ?? 0) || 0,
      trackStock: row.trackStock,
      condition: row.condition,
      images: urls(gallery.filter((path) => !isVideoPath(path))),
      videos: urls(gallery.filter(isVideoPath)),
      brand: brandAr || brandEn ? { ar: brandAr ?? null, en: brandEn ?? null } : null,
      categoryId: row.categoryId,
      sellerCategory: feedSellerCategory(
        { name: row.sellerCategoryName, nameAr: row.sellerCategoryNameAr },
        { name: row.parentCategoryName, nameAr: row.parentCategoryNameAr },
      ),
      translations: byLocale,
      variants: variants
        .filter((v) => v.productId === row.id)
        .map((v) => {
          const variantImages = Array.isArray(v.images) ? galleryPaths(v.images) : [];
          return {
            id: v.id,
            price: v.price,
            stock: Number(v.stock ?? 0) || 0,
            images: urls(variantImages.length ? variantImages : v.imageUrl ? [v.imageUrl] : []),
            title: v.title,
            option1: v.option1,
            option2: v.option2,
            option3: v.option3,
            localized: v.localized,
          };
        }),
    };
  });
}

/** Keyed by seller, store, switch and page, so an entry never mixes stores or catalog modes. */
export const getCachedFeedPage = createCachedQuery({
  name: "store-feed:page:v4",
  ttl: cacheProfiles.seller,
  tags: (sellerId: string, storeId: string, _catalogSplit: boolean, _page: number) => storefrontCatalogTags(sellerId, storeId),
  query: (sellerId: string, storeId: string, catalogSplit: boolean, page: number) => loadFeedPage(sellerId, { storeId, catalogSplit }, page),
});

/**
 * The store's feed rows, page by page (newest products first), with the
 * Google category and the store category name resolved. Stops after the
 * last page or FEED_MAX_PAGES.
 */
export async function* feedProductPages(store: Storefront): AsyncGenerator<FeedProductRow[]> {
  const categoryMap = await loadFeedCategoryMap();
  const { catalogSplit } = await storefrontCatalog(store);
  for (let page = 0; page < FEED_MAX_PAGES; page += 1) {
    const rows = await getCachedFeedPage(store.id, store.storeId, catalogSplit, page);
    if (rows.length) {
      yield rows.map(({ categoryId, sellerCategory, ...row }): FeedProductRow => {
        const category = categoryMap.get(categoryId);
        const tallabyName = category ? { ar: category.nameAr || category.name, en: category.name || category.nameAr } : null;
        return {
          ...row,
          googleCategory: googleCategoryFor(categoryId, categoryMap),
          productType: sellerCategory ?? (tallabyName?.ar || tallabyName?.en ? tallabyName : null),
        };
      });
    }
    if (rows.length < PAGE_SIZE) return;
  }
}
