import { STORE_ID_DIMENSION } from "./store-views.lib";

/**
 * Per-product views (ROADMAP.md F-15b), read from the same GA4 property as
 * Store views (SA-01, docs/store-views.md). Pure: the runReport body, its
 * parsing, and mapping store product page paths back to the seller's products.
 *
 * Store product pages live at `/products/<slug>` (Arabic, the default locale)
 * or `/en/products/<slug>` on the store's subdomain or custom domain
 * (apps/ecommerce/lib/storefront-routing.ts). The host never matters: every
 * hit carries the `store_id` of the store that sent it, and the report only
 * asks for the seller's own store ids.
 */

/** The period shown on the products list and the product page. */
export const PRODUCT_VIEWS_DAYS = 30;

/** GA4 RE2 regex for a store product page path (optional locale prefix, optional trailing slash). */
export const PRODUCT_PAGE_PATH_REGEX = "^(/(en|ar))?/products/[^/]+/?$";

/** runReport body: page views per page path of the seller's store product pages. */
export function productViewsReportBody(storeIds: string[], days: number) {
  return {
    dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: STORE_ID_DIMENSION, inListFilter: { values: storeIds, caseSensitive: true } } },
          { filter: { fieldName: "pagePath", stringFilter: { matchType: "FULL_REGEXP", value: PRODUCT_PAGE_PATH_REGEX } } },
        ],
      },
    },
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10000,
  };
}

export type PathViews = { path: string; views: number };

type Ga4Row = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };

const toInt = (value: string | undefined) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** The (path, views) rows of a runReport response; empty or malformed rows are dropped. */
export function parseProductViewsReport(json: unknown): PathViews[] {
  const rows = ((json ?? {}) as { rows?: Ga4Row[] }).rows ?? [];
  const out: PathViews[] = [];
  for (const row of rows) {
    const path = row.dimensionValues?.[0]?.value ?? "";
    const views = toInt(row.metricValues?.[0]?.value);
    if (path && views > 0) out.push({ path, views });
  }
  return out;
}

export type ProductLocale = "ar" | "en";

/** Locale and decoded slug of a store product page path, or null for any other path. */
export function parseProductPagePath(path: string): { locale: ProductLocale; slug: string } | null {
  const match = /^(?:\/(en|ar))?\/products\/([^/?#]+)\/?$/.exec(path.trim());
  if (!match) return null;
  let slug = match[2]!;
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // A malformed escape: keep the raw segment.
  }
  slug = slug.trim();
  if (!slug) return null;
  return { locale: match[1] === "en" ? "en" : "ar", slug };
}

export type SlugRow = { productId: string; locale: string; slug: string | null; createdAt: string | null };

/**
 * `locale:slug` → product id over the seller's own products. Slugs are not
 * unique, so ties go to the oldest product, then id (the storefront's rule).
 */
export function buildSlugIndex(rows: SlugRow[]): Map<string, string> {
  const sorted = [...rows].sort(
    (a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.productId.localeCompare(b.productId),
  );
  const index = new Map<string, string>();
  for (const row of sorted) {
    const slug = row.slug?.trim();
    if (!slug || (row.locale !== "ar" && row.locale !== "en")) continue;
    const key = `${row.locale}:${slug}`;
    if (!index.has(key)) index.set(key, row.productId);
  }
  return index;
}

/**
 * Views per product id. A path is matched in its own locale first, then the
 * other one, as the storefront resolves it; paths that match none of the
 * seller's products are ignored.
 */
export function mapViewsToProducts(paths: PathViews[], slugIndex: Map<string, string>): Map<string, number> {
  const views = new Map<string, number>();
  for (const { path, views: n } of paths) {
    const parsed = parseProductPagePath(path);
    if (!parsed) continue;
    const other: ProductLocale = parsed.locale === "ar" ? "en" : "ar";
    const productId = slugIndex.get(`${parsed.locale}:${parsed.slug}`) ?? slugIndex.get(`${other}:${parsed.slug}`);
    if (!productId) continue;
    views.set(productId, (views.get(productId) ?? 0) + n);
  }
  return views;
}

/** Orders per view as a percentage, or null when there were no views. */
export function viewsToOrdersPercent(views: number, orders: number): number | null {
  if (!(views > 0)) return null;
  return (Math.max(0, orders) / views) * 100;
}

export type ProductViewStat = { views: number; orders: number };
/** Per product id; null when GA4 is not set up or failed. */
export type ProductViewStats = { days: number; byProduct: Record<string, ProductViewStat> } | null;
