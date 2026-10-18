import { and, asc, db, eq, gt, isNotNull, sql } from "@workspace/db";
import { products, productTranslations } from "@workspace/db/schema";
import { SITEMAP_BASE_URL } from "@/lib/constants";
import {
  buildProductEntries,
  buildSharedSlugEntries,
  buildStaticEntries,
  dedupeEntries,
  type ProductTranslationRow,
  type SharedSlugRow,
  type SitemapEntry,
} from "./sitemap.lib";

/** Rows per keyset page when scanning product translations. */
const PRODUCT_BATCH_SIZE = 5_000;


const ISO_SECONDS = 'YYYY-MM-DD"T"HH24:MI:SS"Z"';
const ISO_MICROS = 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"';

/** One store's catalog (P5-04): its seller's products, narrowed to its picks in "selected" mode. */
export interface ProductScope {
  sellerId: string;
  /** Set only for a store in "selected" catalog mode (catalogStoreId). */
  selectedStoreId?: string;
}

/**
 * Store scope: the store's own products, minus any (locale, slug) that an
 * older active product of ANOTHER seller claims. The store host resolves a
 * product slug marketplace-wide (compareSlugClaim order) and sends other
 * sellers' products to tallaby.com, so such a URL would not render here.
 */
function productScopeFilter(scope: ProductScope | undefined) {
  if (!scope) return undefined;
  return and(
    eq(products.sellerId, scope.sellerId),
    scope.selectedStoreId
      ? sql`EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = ${scope.selectedStoreId} AND sp.product_id = ${products.id})`
      : undefined,
    sql`NOT EXISTS (
      SELECT 1 FROM product_translations t2
      JOIN products p2 ON p2.id = t2.product_id
      WHERE t2.locale = ${productTranslations.locale} AND t2.slug = ${productTranslations.slug}
        AND p2.status = 'active' AND p2.seller_id <> ${scope.sellerId}
        AND (p2.created_at < ${products.createdAt}
             OR (p2.created_at = ${products.createdAt} AND p2.id < ${products.id})
             OR (${products.createdAt} IS NULL AND p2.created_at IS NOT NULL))
    )`,
  );
}

/**
 * Every translation row of every storefront-visible product, paged by
 * translation id so no query is unbounded and nothing is skipped or
 * repeated between pages (ids are unique and the cursor is strict).
 * Without `scope` (the marketplace) the query is exactly the original one.
 */
export async function fetchActiveProductTranslations(scope?: ProductScope): Promise<ProductTranslationRow[]> {
  const rows: ProductTranslationRow[] = [];
  let cursor: string | null = null;

  for (;;) {
    const page: Array<ProductTranslationRow & { id: string }> = await db
      .select({
        id: productTranslations.id,
        productId: productTranslations.productId,
        locale: productTranslations.locale,
        slug: productTranslations.slug,
        title: productTranslations.title,
        updatedAt: sql<string | null>`to_char(${products.updatedAt} at time zone 'UTC', ${ISO_SECONDS})`,
        createdAt: sql<string | null>`to_char(${products.createdAt} at time zone 'UTC', ${ISO_MICROS})`,
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
      .limit(PRODUCT_BATCH_SIZE);

    for (const { id: _id, ...row } of page) rows.push(row);
    if (page.length < PRODUCT_BATCH_SIZE) break;
    cursor = page[page.length - 1]!.id;
  }

  return rows;
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
