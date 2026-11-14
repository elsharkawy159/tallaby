import { and, asc, db, eq, gt, isNotNull, sql } from "@workspace/db";
import { products, productTranslations } from "@workspace/db/schema";
import { cacheProfiles, createCachedQuery } from "@workspace/cache";
import { productShownInStore, type StoreCatalogScope } from "@workspace/lib/stores/scope/server";
import { storefrontCatalogTags } from "@/lib/storefront.server";
import { notAStoreCopy } from "@/lib/products/product-list.server";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { SITEMAP_BASE_URL } from "@/lib/constants";
import {
  buildProductEntries,
  buildSharedSlugEntries,
  buildStaticEntries,
  dedupeEntries,
  sitemapImageUrls,
  type ProductTranslationRow,
  type SharedSlugRow,
  type SitemapEntry,
} from "./sitemap.lib";

/** Rows per keyset page when scanning product translations. */
const PRODUCT_BATCH_SIZE = 5_000;


const ISO_SECONDS = 'YYYY-MM-DD"T"HH24:MI:SS"Z"';
const ISO_MICROS = 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"';

/**
 * One store's catalog (P5-04, F-87c slice 6): its seller's products that the
 * store shows (`productShownInStore`: before the catalog split its mode and
 * picks, after it its own products). The store comes from the request host.
 */
export interface ProductScope {
  sellerId: string;
  catalog: StoreCatalogScope;
}

/**
 * Store scope: what the store shows, of its seller only, so another seller's
 * use of a slug changes nothing here. Without a scope (tallaby.com) a store
 * copy is left out, so one product is listed once (stores-separation.md §2.1.5).
 */
function productScopeFilter(scope: ProductScope | undefined) {
  if (!scope) return notAStoreCopy();
  return and(eq(products.sellerId, scope.sellerId), productShownInStore(scope.catalog));
}

type TranslationPage = { rows: ProductTranslationRow[]; next: string | null };

/**
 * One keyset page (translation ids after `cursor`). `withImages`: each row
 * also carries the product's first photos as public URLs (store sitemaps).
 */
async function loadTranslationPage(
  scope: ProductScope | undefined,
  cursor: string | null,
  size: number,
  { withImages = false }: { withImages?: boolean } = {},
): Promise<TranslationPage> {
  const page = await db
      .select({
        id: productTranslations.id,
        productId: productTranslations.productId,
        locale: productTranslations.locale,
        slug: productTranslations.slug,
        title: productTranslations.title,
        updatedAt: sql<string | null>`to_char(${products.updatedAt} at time zone 'UTC', ${ISO_SECONDS})`,
        createdAt: sql<string | null>`to_char(${products.createdAt} at time zone 'UTC', ${ISO_MICROS})`,
        gallery: withImages ? products.images : sql<null>`null`,
      })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(
        and(
          eq(products.status, "active"),
          isNotNull(productTranslations.slug),
          productScopeFilter(scope),
          cursor ? gt(productTranslations.id, cursor) : undefined
        )
      )
      .orderBy(asc(productTranslations.id))
      .limit(size);

  return {
    rows: page.map(({ id: _id, gallery, ...row }): ProductTranslationRow =>
      withImages ? { ...row, images: sitemapImageUrls(gallery, (path) => getPublicUrl(path, "products")) } : row,
    ),
    next: page.length < size ? null : page[page.length - 1]!.id,
  };
}

/**
 * Every translation row of every storefront-visible product, paged by
 * translation id so no query is unbounded and nothing is skipped or
 * repeated between pages (ids are unique and the cursor is strict).
 * Without `scope` (tallaby.com) it is the original query, less store copies.
 */
export async function fetchActiveProductTranslations(scope?: ProductScope): Promise<ProductTranslationRow[]> {
  const rows: ProductTranslationRow[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page = await loadTranslationPage(scope, cursor, PRODUCT_BATCH_SIZE);
    rows.push(...page.rows);
    if (!page.next) return rows;
    cursor = page.next;
  }
}

/**
 * Rows per cached page of a store sitemap: small enough for the Data Cache's
 * 2 MB entry limit with up to five photo URLs on every row.
 */
const STORE_PAGE_SIZE = 1_000;

/**
 * One cached page of a store's sitemap product rows (rule 8): keyed by
 * seller, store, the catalog-split switch and the page cursor, so an entry
 * never mixes stores or catalog modes; tagged with the store's catalog tags
 * (`productTags.seller`, `productTags.store`, `storeTags.catalog`), so a
 * product edit or a change of picks refreshes it.
 */
export const getCachedStoreTranslationPage = createCachedQuery({
  // v2: rows carry the product's photos (`images`); pages of 1,000 rows.
  name: "store-sitemap:products:v2",
  ttl: cacheProfiles.seller,
  tags: (sellerId: string, storeId: string, _catalogSplit: boolean, _cursor: string | null) => storefrontCatalogTags(sellerId, storeId),
  query: (sellerId: string, storeId: string, catalogSplit: boolean, cursor: string | null) =>
    loadTranslationPage({ sellerId, catalog: { storeId, catalogSplit } }, cursor, STORE_PAGE_SIZE, { withImages: true }),
});

/** The store sitemap's product rows: every cached page in order. `catalog` comes from the request host (`storefrontCatalog`). */
export async function fetchStoreProductTranslations(sellerId: string, catalog: StoreCatalogScope): Promise<ProductTranslationRow[]> {
  const rows: ProductTranslationRow[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page = await getCachedStoreTranslationPage(sellerId, catalog.storeId, catalog.catalogSplit, cursor);
    rows.push(...page.rows);
    if (!page.next) return rows;
    cursor = page.next;
  }
}

/**
 * Categories whose page would list at least one product. The category page
 * lists active products of every category sharing its name (names repeat
 * across parents), falling back to its own id — mirrored here so an empty
 * "No products in this category yet" page never enters the sitemap.
 * lastmod is the later of the category row and its newest listed product.
 */
async function fetchListedCategories(): Promise<SharedSlugRow[]> {
  const rows = await db.execute(sql`
    SELECT c.slug, c.name, c.name_ar AS "nameAr",
           to_char(GREATEST(c.updated_at, MAX(p.updated_at AT TIME ZONE 'UTC')), ${ISO_SECONDS}) AS "lastModified"
    FROM categories c
    JOIN categories pc
      ON (NULLIF(c.name, '') IS NOT NULL AND pc.name = c.name)
      OR (NULLIF(c.name, '') IS NULL AND pc.id = c.id)
    JOIN products p ON p.category_id = pc.id AND p.status = 'active'
    WHERE c.slug IS NOT NULL
    GROUP BY c.id, c.slug, c.name, c.name_ar, c.updated_at
    ORDER BY c.slug
  `);
  return [...rows] as unknown as SharedSlugRow[];
}

/** Brands with at least one active product (an empty brand page is thin content). */
async function fetchListedBrands(): Promise<SharedSlugRow[]> {
  const rows = await db.execute(sql`
    SELECT b.slug, b.name,
           to_char(GREATEST(b.updated_at, MAX(p.updated_at)) AT TIME ZONE 'UTC', ${ISO_SECONDS}) AS "lastModified"
    FROM brands b
    JOIN products p ON p.brand_id = b.id AND p.status = 'active'
    GROUP BY b.id, b.slug, b.name, b.updated_at
    ORDER BY b.slug
  `);
  return [...rows] as unknown as SharedSlugRow[];
}

/**
 * Approved sellers whose /stores/[slug] page renders in place. A seller with
 * a subdomain is redirected to {subdomain}.tallaby.com (another host), so
 * that URL is redirect-only and stays out of this sitemap.
 */
async function fetchInPlaceStores(): Promise<SharedSlugRow[]> {
  const rows = await db.execute(sql`
    SELECT s.slug, s.display_name AS name,
           to_char(s.updated_at AT TIME ZONE 'UTC', ${ISO_SECONDS}) AS "lastModified"
    FROM sellers s
    WHERE s.status = 'approved' AND COALESCE(s.subdomain, '') = ''
    ORDER BY s.slug
  `);
  return [...rows] as unknown as SharedSlugRow[];
}

export interface SitemapDataset {
  /** When this dataset was built (not a page's lastmod). */
  generatedAt: string;
  baseUrl: string;
  entries: SitemapEntry[];
  diagnostics: {
    productTranslationRows: number;
    invalidProductSlugs: number;
    productSlugCollisions: number;
    duplicateUrls: number;
  };
}

/**
 * The full, deduplicated set of public indexable URLs, built from the
 * database and known routes only — nothing here makes an HTTP request.
 * Callers (the XML route handlers, the /sitemap page) are ISR-cached, so this runs at
 * most once per revalidate window per route. It is intentionally not put in
 * unstable_cache: for a large catalog the dataset exceeds the data cache's
 * per-entry size limit.
 */
export async function getSitemapDataset(): Promise<SitemapDataset> {
  const baseUrl = SITEMAP_BASE_URL;
  const [translations, categories, brands, stores] = await Promise.all([
    fetchActiveProductTranslations(),
    fetchListedCategories(),
    fetchListedBrands(),
    fetchInPlaceStores(),
  ]);

  const products = buildProductEntries(baseUrl, translations);
  const { entries, duplicates } = dedupeEntries([
    ...buildStaticEntries(baseUrl),
    ...buildSharedSlugEntries(baseUrl, categories, {
      type: "category",
      prefix: "/categories",
      changeFrequency: "daily",
      priority: 0.8,
    }),
    ...buildSharedSlugEntries(baseUrl, brands, {
      type: "brand",
      prefix: "/brands",
      changeFrequency: "weekly",
      priority: 0.6,
    }),
    ...buildSharedSlugEntries(baseUrl, stores, {
      type: "store",
      prefix: "/stores",
      changeFrequency: "weekly",
      priority: 0.5,
    }),
    ...products.entries,
  ]);

  return {
    generatedAt: new Date().toISOString(),
    baseUrl,
    entries,
    diagnostics: {
      productTranslationRows: translations.length,
      invalidProductSlugs: products.stats.invalidSlug,
      productSlugCollisions: products.stats.slugCollisions,
      duplicateUrls: duplicates,
    },
  };
}
