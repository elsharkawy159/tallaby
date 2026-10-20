/**
 * Store-host sitemap building blocks (PLAN.md §10.4, P5-04). Pure, like
 * sitemap.lib.ts, whose URL, hreflang and XML rules it reuses: a store host
 * serves the same locales the same way ("as-needed", ar unprefixed).
 */
import {
  buildProductEntries,
  dedupeEntries,
  isValidSlug,
  sharedPathEntries,
  type ChangeFrequency,
  type ProductTranslationRow,
  type SitemapEntry,
} from "./sitemap.lib";

/** A published builder page of the store (from the published snapshot only). */
export interface StoreSitemapPage {
  slug: string;
  isHome: boolean;
  seo?: { noindex?: boolean };
}

/**
 * An extra public URL of the store, from a registered provider (blog posts,
 * CMS items; see STORE_SITEMAP_URL_PROVIDERS). `path` is relative to the
 * locale root, e.g. "/blog/summer-sale", and exists in both locales.
 */
export interface StoreSitemapUrl {
  path: string;
  lastModified: string | null;
  changeFrequency?: ChangeFrequency;
  priority?: number;
  /** Display name for the HTML sitemap; never written to the XML. */
  label?: string | null;
}

export interface StoreSitemapInput {
  /** Canonical origin: the custom domain when live, else the subdomain. */
  baseUrl: string;
  /** False for a store with no visible products or indexing switched off. */
  indexable: boolean;
  pages: StoreSitemapPage[];
  /** Translation rows of the store's visible, active products. */
  products: ProductTranslationRow[];
  extra?: StoreSitemapUrl[];
}

/** One or more lowercase path segments, nothing that could leave the host. */
const SAFE_PATH = /^(?:\/[a-z0-9][a-z0-9-]*){1,4}$/;

/**
 * Every indexable URL of one store: home, published builder pages (except
 * the home page, which is "/", and pages marked noindex), the store's own
 * products, then provider URLs. Nothing at all for a store kept out of
 * search, so the sitemap never contradicts the pages' `noindex`.
 */
export function buildStoreSitemapEntries(input: StoreSitemapInput): SitemapEntry[] {
  if (!input.indexable) return [];
  const { baseUrl } = input;
  const page = (path: string, fields: Pick<SitemapEntry, "lastModified" | "changeFrequency" | "priority">, label: string | null = null) =>
    sharedPathEntries(baseUrl, path, { type: "page", ...fields }, () => label);

  const pageEntries = input.pages
    .filter((p) => !p.isHome && !p.seo?.noindex && isValidSlug(p.slug) && SAFE_PATH.test(`/${p.slug}`))
    .flatMap((p) => page(`/${p.slug}`, { lastModified: null, changeFrequency: "weekly", priority: 0.6 }));

  const extraEntries = (input.extra ?? [])
    .filter((u) => SAFE_PATH.test(u.path))
    .flatMap((u) =>
      page(
        u.path,
        { lastModified: u.lastModified, changeFrequency: u.changeFrequency ?? "weekly", priority: u.priority ?? 0.5 },
        u.label ?? null,
      ),
    );

  return dedupeEntries([
    ...page("", { lastModified: null, changeFrequency: "daily", priority: 1 }),
    ...pageEntries,
    ...buildProductEntries(baseUrl, input.products).entries,
    ...extraEntries,
  ]).entries;
}
