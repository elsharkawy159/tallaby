/**
 * Pure sitemap building blocks — no database, no Next.js APIs — so the XML
 * route handlers, the /sitemap page and the tests all share one set of URL
 * rules. Data access lives in sitemap.server.ts.
 */

export const SITEMAP_LOCALES = ["en", "ar"] as const;
export type SitemapLocale = (typeof SITEMAP_LOCALES)[number];
/** Unprefixed locale (next-intl "as-needed"); mirrors i18n/routing.ts. */
export const SITEMAP_DEFAULT_LOCALE: SitemapLocale = "ar";

export type SitemapPageType = "page" | "product" | "category" | "brand" | "store";

export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  url: string;
  locale: SitemapLocale;
  type: SitemapPageType;
  /** Path relative to the locale root, e.g. "/about" — static pages only. */
  path: string;
  /**
   * Display name in this entry's locale (product title, category name…),
   * for the HTML /sitemap page. Null for static pages, which are labelled
   * from messages. Never written to the XML.
   */
  label: string | null;
  /** ISO timestamp from the database, or null when no reliable one exists. */
  lastModified: string | null;
  changeFrequency: ChangeFrequency;
  priority: number;
  /** hreflang -> absolute URL, including x-default. Only real translations. */
  alternates: Record<string, string>;
}

/** Sitemap protocol limits (sitemaps.org): per file, uncompressed. */
export const MAX_URLS_PER_SITEMAP = 50_000;
export const MAX_BYTES_PER_SITEMAP = 50 * 1024 * 1024;

/** Renders the XML as a readable table when opened in a browser. */
export const SITEMAP_STYLESHEET_PATH = "/sitemap.xsl";

export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** Absolute, locale-prefixed URL ("as-needed": default locale unprefixed). */
export function buildLocalizedUrl(
  baseUrl: string,
  locale: SitemapLocale,
  path: string
): string {
  const prefix = locale === SITEMAP_DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${normalizeBaseUrl(baseUrl)}${prefix}${path}`;
}

/**
 * hreflang map for a page that exists in the given locales. `x-default`
 * points at the default-locale URL when it exists, else the first available.
 */
export function buildAlternates(
  urls: Partial<Record<SitemapLocale, string>>,
  fallback = ""
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of SITEMAP_LOCALES) {
    const url = urls[locale];
    if (url) languages[locale] = url;
  }
  languages["x-default"] =
    urls[SITEMAP_DEFAULT_LOCALE] ?? Object.values(languages)[0] ?? fallback;
  return languages;
}

/**
 * A slug that can round-trip through a single path segment and match the
 * exact-equality DB lookup on the product/category/brand page. Anything with
 * surrounding whitespace, separators or control characters would either 404
 * or resolve to a different route, so it never enters the sitemap.
 */
export function isValidSlug(slug: string | null | undefined): slug is string {
  if (typeof slug !== "string" || slug.length === 0) return false;
  if (slug !== slug.trim()) return false;
  // eslint-disable-next-line no-control-regex
  return !/[\s/\\?#%\u0000-\u001f\u007f]/.test(slug);
}

function slugPath(prefix: string, slug: string): string {
  return `${prefix}/${encodeURIComponent(slug)}`;
}

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------

export interface StaticPageDef {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/**
 * Public, indexable pages that exist identically in both locales, each
 * verified against app/[locale]: self-canonical, no noindex, no redirect.
 * Deliberately absent: /search and filtered /products (noindex), cart,
 * checkout, auth, profile, wishlist, orders, onboarding (private/transactional).
 */
export const STATIC_PAGES: StaticPageDef[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.8 },
  { path: "/brands", changeFrequency: "weekly", priority: 0.6 },
  { path: "/stores", changeFrequency: "weekly", priority: 0.6 },
  { path: "/sell", changeFrequency: "weekly", priority: 0.7 },
  { path: "/affiliate", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help", changeFrequency: "weekly", priority: 0.6 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.5 },
  { path: "/shipping", changeFrequency: "monthly", priority: 0.5 },
  { path: "/returns", changeFrequency: "monthly", priority: 0.5 },
  { path: "/payment", changeFrequency: "monthly", priority: 0.4 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.2 },
  { path: "/follow-us", changeFrequency: "monthly", priority: 0.4 },
  { path: "/sitemap", changeFrequency: "daily", priority: 0.3 },
];

/** Entries for a path that exists in every locale under the same slug. */
function sharedPathEntries(
  baseUrl: string,
  path: string,
  fields: Pick<SitemapEntry, "type" | "lastModified" | "changeFrequency" | "priority">,
  labelFor: (locale: SitemapLocale) => string | null
): SitemapEntry[] {
  const urls = Object.fromEntries(
    SITEMAP_LOCALES.map((l) => [l, buildLocalizedUrl(baseUrl, l, path)])
  ) as Record<SitemapLocale, string>;
  const alternates = buildAlternates(urls);
  return SITEMAP_LOCALES.map((locale) => ({
    ...fields,
    url: urls[locale],
    locale,
    path,
    label: labelFor(locale),
    alternates,
  }));
}

export function buildStaticEntries(
  baseUrl: string,
  pages: StaticPageDef[] = STATIC_PAGES
): SitemapEntry[] {
  // Static page content has no stored update time, so no lastmod at all
  // rather than a fabricated "now".
  return pages.flatMap((p) =>
    sharedPathEntries(
      baseUrl,
      p.path,
      { type: "page", lastModified: null, changeFrequency: p.changeFrequency, priority: p.priority },
      () => null
    )
  );
}

// ---------------------------------------------------------------------------
// Categories / brands / stores — one slug shared across locales
// ---------------------------------------------------------------------------

export interface SharedSlugRow {
  slug: string | null;
  lastModified: string | null;
  name: string | null;
  /** Arabic display name, where the entity has one (categories). */
  nameAr?: string | null;
}

export function buildSharedSlugEntries(
  baseUrl: string,
  rows: SharedSlugRow[],
  opts: {
    type: Exclude<SitemapPageType, "page" | "product">;
    prefix: string;
    changeFrequency: ChangeFrequency;
    priority: number;
  }
): SitemapEntry[] {
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];
  for (const row of rows) {
    if (!isValidSlug(row.slug) || seen.has(row.slug)) continue;
    const slug = row.slug;
    seen.add(slug);
    entries.push(
      ...sharedPathEntries(
        baseUrl,
        slugPath(opts.prefix, slug),
        {
          type: opts.type,
          lastModified: row.lastModified,
          changeFrequency: opts.changeFrequency,
          priority: opts.priority,
        },
        (locale) =>
          (locale === "ar" ? row.nameAr || row.name : row.name || row.nameAr) || slug
      )
    );
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Products — slug differs per locale
// ---------------------------------------------------------------------------

export interface ProductTranslationRow {
  productId: string;
  locale: string;
  slug: string | null;
  /** Product title in this translation's locale. */
  title: string | null;
  /** products.updated_at as ISO. */
  updatedAt: string | null;
  /**
   * products.created_at as fixed-width UTC "YYYY-MM-DDTHH:MM:SS.ffffffZ" —
   * the slug-collision tie-breaker.
   */
  createdAt: string | null;
}

export interface ProductBuildStats {
  /** Translation rows that produced a URL. */
  accepted: number;
  /** Rows dropped for an empty/malformed slug or unsupported locale. */
  invalidSlug: number;
  /** Rows whose (locale, slug) was already claimed by another product. */
  slugCollisions: number;
}

/**
 * Same order getProductIdBySlug() uses to pick between active products that
 * share a (locale, slug): oldest created_at first (NULLs last, as Postgres
 * ASC does), then id. Keeping the sitemap on the same rule means every URL
 * it lists renders the product whose hreflang it advertises.
 */
export function compareSlugClaim(
  a: Pick<ProductTranslationRow, "createdAt" | "productId">,
  b: Pick<ProductTranslationRow, "createdAt" | "productId">
): number {
  if (a.createdAt !== b.createdAt) {
    if (a.createdAt === null) return 1;
    if (b.createdAt === null) return -1;
    // Fixed-width UTC ISO with microseconds (see sitemap.server.ts), so a
    // string compare keeps Postgres' microsecond precision that Date drops.
    return a.createdAt < b.createdAt ? -1 : 1;
  }
  return a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0;
}

function isSitemapLocale(value: string): value is SitemapLocale {
  return (SITEMAP_LOCALES as readonly string[]).includes(value);
}

type ClaimedRow = ProductTranslationRow & { locale: SitemapLocale; slug: string };

/**
 * One entry per (locale, slug) the storefront actually serves. Rows must be
 * active products only. A product gets a URL in a locale only when it has a
 * real translation row with a usable slug there — the product page renders
 * fallback content for a missing translation, but that is not a separate
 * page worth indexing, and page metadata only advertises real translations.
 */
export function buildProductEntries(
  baseUrl: string,
  rows: ProductTranslationRow[]
): { entries: SitemapEntry[]; stats: ProductBuildStats } {
  const stats: ProductBuildStats = { accepted: 0, invalidSlug: 0, slugCollisions: 0 };

  // (locale, slug) -> winning row
  const claims = new Map<string, ClaimedRow>();
  for (const row of rows) {
    if (!isSitemapLocale(row.locale) || !isValidSlug(row.slug)) {
      stats.invalidSlug++;
      continue;
    }
    const key = `${row.locale}\u0000${row.slug}`;
    const current = claims.get(key);
    if (!current) {
      claims.set(key, row as ClaimedRow);
      continue;
    }
    stats.slugCollisions++;
    if (compareSlugClaim(row, current) < 0) claims.set(key, row as ClaimedRow);
  }

  // productId -> locale -> url, only for slugs the product actually won.
  // A product has at most one translation per locale (unique constraint).
  const byProduct = new Map<string, Partial<Record<SitemapLocale, string>>>();
  for (const row of claims.values()) {
    const urls = byProduct.get(row.productId) ?? {};
    urls[row.locale] ??= buildLocalizedUrl(baseUrl, row.locale, slugPath("/products", row.slug));
    byProduct.set(row.productId, urls);
  }

  const entries: SitemapEntry[] = [];
  for (const row of claims.values()) {
    const urls = byProduct.get(row.productId)!;
    const path = slugPath("/products", row.slug);
    const url = buildLocalizedUrl(baseUrl, row.locale, path);
    if (urls[row.locale] !== url) continue;
    stats.accepted++;
    entries.push({
      url,
      locale: row.locale,
      type: "product",
      path,
      label: row.title?.trim() || row.slug,
      lastModified: row.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: buildAlternates(urls),
    });
  }

  // Stable order regardless of DB scan order, so sitemap chunking is
  // deterministic between the index and the chunk files.
  entries.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  return { entries, stats };
}

// ---------------------------------------------------------------------------
// Assembly, dedupe, chunking, XML
// ---------------------------------------------------------------------------

/** First occurrence of each URL wins; returns how many were dropped. */
export function dedupeEntries(entries: SitemapEntry[]): {
  entries: SitemapEntry[];
  duplicates: number;
} {
  const seen = new Set<string>();
  const out: SitemapEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    out.push(entry);
  }
  return { entries: out, duplicates: entries.length - out.length };
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]!);
}

export function serializeUrlEntry(entry: SitemapEntry): string {
  const lines = ["<url>", `<loc>${escapeXml(entry.url)}</loc>`];
  for (const [lang, href] of Object.entries(entry.alternates)) {
    lines.push(
      `<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`
    );
  }
  if (entry.lastModified) lines.push(`<lastmod>${escapeXml(entry.lastModified)}</lastmod>`);
  lines.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
  lines.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
  lines.push("</url>");
  return lines.join("\n");
}

// Crawlers ignore the stylesheet instruction; browsers use it to render.
const XML_HEAD = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="${SITEMAP_STYLESHEET_PATH}"?>\n`;
const URLSET_OPEN = `${XML_HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
const URLSET_CLOSE = "\n</urlset>\n";

const encoder = new TextEncoder();
const byteLength = (s: string) => encoder.encode(s).length;

export function serializeUrlset(entries: SitemapEntry[]): string {
  return URLSET_OPEN + entries.map(serializeUrlEntry).join("\n") + URLSET_CLOSE;
}

export function serializeSitemapIndex(
  sitemaps: Array<{ url: string; lastModified: string | null }>
): string {
  const body = sitemaps
    .map((s) =>
      [
        "<sitemap>",
        `<loc>${escapeXml(s.url)}</loc>`,
        ...(s.lastModified ? [`<lastmod>${escapeXml(s.lastModified)}</lastmod>`] : []),
        "</sitemap>",
      ].join("\n")
    )
    .join("\n");
  return `${XML_HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

/**
 * Splits entries into files that each respect both protocol limits.
 * Deterministic for a given entry order, so /sitemap.xml (the index) and
 * /sitemaps/[n].xml always agree on what goes where.
 */
export function chunkEntries(
  entries: SitemapEntry[],
  limits: { maxUrls?: number; maxBytes?: number } = {}
): SitemapEntry[][] {
  const maxUrls = limits.maxUrls ?? MAX_URLS_PER_SITEMAP;
  const maxBytes = limits.maxBytes ?? MAX_BYTES_PER_SITEMAP;
  const overhead = byteLength(URLSET_OPEN + URLSET_CLOSE);

  const chunks: SitemapEntry[][] = [];
  let current: SitemapEntry[] = [];
  let bytes = overhead;
  for (const entry of entries) {
    const size = byteLength(serializeUrlEntry(entry)) + 1;
    if (current.length > 0 && (current.length >= maxUrls || bytes + size > maxBytes)) {
      chunks.push(current);
      current = [];
      bytes = overhead;
    }
    current.push(entry);
    bytes += size;
  }
  if (current.length > 0 || chunks.length === 0) chunks.push(current);
  return chunks;
}

export function latestModified(entries: SitemapEntry[]): string | null {
  let latest: string | null = null;
  for (const e of entries) {
    if (e.lastModified && (!latest || Date.parse(e.lastModified) > Date.parse(latest))) {
      latest = e.lastModified;
    }
  }
  return latest;
}
