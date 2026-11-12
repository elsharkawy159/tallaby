/**
 * Where a link inside a full-page template preview goes (tallaby.com
 * `/template-preview/<key>`), so the template can be browsed like a store
 * (owner, 2026-11-12): its pages, the product page with the product clicked,
 * and a catalog page for "all products", a category or a search. Anything
 * else (cart, account, other sites) is left as it is; the preview's
 * FrameGuard keeps those from leaving the preview.
 */

/** The preview's catalog page (a virtual page: templates have no page with this slug). */
export const PREVIEW_CATALOG_SLUG = "products";

export type PreviewLinkTarget = {
  /** The preview page; undefined is the home page. */
  slug?: string;
  /** Kept on the preview URL: `product` on the product page, `category` and `search` on the catalog. */
  params: Record<string, string>;
};

export function previewLinkTarget(
  href: string,
  opts: { pageSlugs: ReadonlySet<string>; productPageSlug: string | null },
): PreviewLinkTarget | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const url = new URL(href, "https://preview.invalid");
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return { params: {} };

  const product = path.match(/^\/products\/([^/]+)$/);
  if ((product || path === "/product") && opts.productPageSlug) {
    return { slug: opts.productPageSlug, params: product ? { product: decodeURIComponent(product[1]!) } : {} };
  }

  const slug = decodeURIComponent(path.slice(1));
  if (opts.pageSlugs.has(slug)) return { slug, params: {} };

  if (path === "/products" || path === "/search" || path === "/categories") {
    const params: Record<string, string> = {};
    const category = url.searchParams.get("category")?.trim();
    const search = (url.searchParams.get("search") ?? url.searchParams.get("q"))?.trim();
    if (category) params.category = category.slice(0, 100);
    if (search) params.search = search.slice(0, 100);
    return { slug: PREVIEW_CATALOG_SLUG, params };
  }
  return null;
}

/** `base` (a preview URL, maybe with `?edition=`) plus the target's params. */
export function withPreviewParams(base: string, params: Record<string, string>): string {
  const entries = Object.entries(params);
  if (!entries.length) return base;
  const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `${base}${base.includes("?") ? "&" : "?"}${query}`;
}
