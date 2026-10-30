/**
 * Store product feed data (ROADMAP.md F-11a): the store a feed request's
 * HOST serves, and its active products in cached pages.
 *
 * Tenant rules (CLAUDE.md rule 5): the store comes from the request host
 * only (never a query value); every product query is filtered by that
 * store's seller, and by the store's own picks in "selected" catalog mode.
 * Caching (rule 8): `createCachedQuery`, keys and tags carry the seller id
 * and store id; product edits purge `productTags.seller`, catalog picks
 * `storeTags.catalog`. Pages of PAGE_SIZE products keep every cache entry
 * well under the Data Cache's 2 MB limit (a whole feed would not fit).
 */
import { and, asc, db, desc, eq, inArray, isNull, sql } from "@workspace/db";
import { categories, products, productTranslations, productVariants, brands, sellerProductBrands, sellerProductCategories, stores } from "@workspace/db/schema";
import { cacheProfiles, categoryTags, createCachedQuery, productTags, sellerTags, storeTags } from "@workspace/cache";
import { parseStoreCurrency } from "@workspace/lib";
import { storeUrl } from "@workspace/lib/storefront";
import { richTextToPlainText } from "@workspace/tiptap/plain-text";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import {
  catalogStoreId,
  getRequestStoreSubdomain,
  getStorefrontBySubdomain,
  isStorefrontOffline,
  type Storefront,
} from "@/lib/storefront.server";
import { googleCategoryFor, type FeedCategoryNode } from "./google-category.lib";
import { FEED_ITEM_LIMIT, isVideoPath, type FeedProductRow, type FeedStoreInfo, type FeedTranslation } from "./product-feed.lib";

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
 * the cached wrapper below; the seller (and the store's picks) bound every row.
 */
export async function loadFeedPage(sellerId: string, selectedStoreId: string | null, page: number): Promise<PageRaw[]> {
  const rows = await db
    .select({
      id: products.id,
      price: products.price,
      quantity: products.quantity,
      condition: products.condition,
      images: products.images,
      categoryId: products.categoryId,
      brandName: brands.name,
      sellerBrandName: sellerProductBrands.name,
      sellerBrandNameAr: sellerProductBrands.nameAr,
      sellerCategoryName: sellerProductCategories.name,
      sellerCategoryNameAr: sellerProductCategories.nameAr,
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
        selectedStoreId
          ? sql`EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = ${selectedStoreId} AND sp.product_id = ${products.id})`
          : undefined,
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
        // As the store sitemap: a slug an older active product of ANOTHER seller
        // also uses opens that product on the store host, so it is no link here.
        claimedElsewhere: sql<boolean>`EXISTS (
          SELECT 1 FROM product_translations t2
          JOIN products p2 ON p2.id = t2.product_id
          JOIN products p1 ON p1.id = ${productTranslations.productId}
          WHERE t2.locale = ${productTranslations.locale} AND t2.slug = ${productTranslations.slug}
            AND p2.status = 'active' AND p2.seller_id <> ${sellerId}
            AND (p2.created_at < p1.created_at
                 OR (p2.created_at = p1.created_at AND p2.id < p1.id)
                 OR (p1.created_at IS NULL AND p2.created_at IS NOT NULL))
        )`,
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
      const slug = t.slug?.trim() && !/[\s/\\?#%]/.test(t.slug) && !t.claimedElsewhere ? t.slug : null;
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
      condition: row.condition,
      images: urls(gallery.filter((path) => !isVideoPath(path))),
      videos: urls(gallery.filter(isVideoPath)),
      brand: brandAr || brandEn ? { ar: brandAr ?? null, en: brandEn ?? null } : null,
      categoryId: row.categoryId,
      sellerCategory:
        row.sellerCategoryName || row.sellerCategoryNameAr
          ? { ar: row.sellerCategoryNameAr || row.sellerCategoryName, en: row.sellerCategoryName || row.sellerCategoryNameAr }
          : null,
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

const getCachedFeedPage = createCachedQuery({
  name: "store-feed:page:v1",
  ttl: cacheProfiles.seller,
  tags: (sellerId: string, storeId: string, _selectedStoreId: string | null, _page: number) => [
    productTags.seller(sellerId),
    storeTags.catalog(sellerId, storeId),
  ],
  // `storeId` is in the key and tags only; the products are the seller's (narrowed by `selectedStoreId`).
  query: (sellerId: string, _storeId: string, selectedStoreId: string | null, page: number) => loadFeedPage(sellerId, selectedStoreId, page),
});

/**
 * The store's feed rows, page by page (newest products first), with the
 * Google category and the store category name resolved. Stops after the
 * last page or FEED_MAX_PAGES.
 */
export async function* feedProductPages(store: Storefront): AsyncGenerator<FeedProductRow[]> {
  const categoryMap = await loadFeedCategoryMap();
  const selected = catalogStoreId(store) ?? null;
  for (let page = 0; page < FEED_MAX_PAGES; page += 1) {
    const rows = await getCachedFeedPage(store.id, store.storeId, selected, page);
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
