import { routing } from "@/i18n/routing";
import { type MarketingSitemapEntry, sitemapEntries } from "./seo.lib";
import { storeIndustryId, type StoreIndustryId } from "./recent-stores.lib";

/**
 * tallaby.com's public store list: the home page's logo strip and /stores
 * (owner, 2026-11-14: store logos on the home page, overriding F-73's "no store
 * names" for this section only). Only public store data: name, logo, address,
 * listed industry and how many products it shows. Nothing about the seller.
 */

/** "At least 5 products" (owner, 2026-11-16; was 10): a store needs this many to join the home strip. */
export const LOGO_STRIP_MIN_PRODUCTS = 5;
/** The most logos the strip shows. */
export const LOGO_STRIP_MAX = 30;
/** Fewer qualifying stores than this and the strip is not shown at all (no near-empty line). */
export const LOGO_STRIP_MIN_SHOWN = 4;
/** Stores per /stores page. */
export const DIRECTORY_PAGE_SIZE = 60;

/** A live, indexable store with at least one product, as tallaby.com may show it. */
export type DirectoryStore = {
  name: string;
  /** The store's plain home address (its live custom domain, else its subdomain). */
  url: string;
  /** A public https logo URL, or null. */
  logoUrl: string | null;
  /** One of the listed industries, never a seller's free text. */
  industry: StoreIndustryId | null;
  productCount: number;
};

/** One row of the directory query (stores.server.ts). */
export type DirectoryStoreRow = {
  name: unknown;
  subdomain: unknown;
  custom_domain: unknown;
  logo_url: unknown;
  store_category: unknown;
  store_category_ar: unknown;
  product_count: unknown;
};

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * A query row ready to show, or null when it can't be linked (no subdomain) or
 * has nothing to sell. `toUrl` builds the store address, `toLogo` the public
 * logo URL; a logo that isn't an https URL afterwards is dropped.
 */
export function shapeDirectoryStore(
  row: DirectoryStoreRow,
  toUrl: (subdomain: string, customDomain: string | null) => string,
  toLogo: (logo: string) => string,
): DirectoryStore | null {
  const name = str(row.name);
  const subdomain = str(row.subdomain);
  const productCount = Number(row.product_count);
  if (!name || !subdomain || !Number.isFinite(productCount) || productCount < 1) return null;
  const rawLogo = str(row.logo_url);
  const logo = rawLogo ? toLogo(rawLogo) : "";
  return {
    name,
    url: toUrl(subdomain, str(row.custom_domain) || null),
    logoUrl: logo.startsWith("https://") ? logo : null,
    industry: storeIndustryId({ en: row.store_category as string | null, ar: row.store_category_ar as string | null }),
    productCount: Math.floor(productCount),
  };
}

/** Name order, the same in both languages so a page number always means the same stores. */
function byName(a: DirectoryStore, b: DirectoryStore): number {
  return a.name.localeCompare(b.name, "ar", { sensitivity: "base" }) || a.url.localeCompare(b.url);
}

/** Names a stock or empty image rather than the seller's own upload. */
const PLACEHOLDER_LOGO = /placeholder|no[-_]?image|default[-_]?logo/i;

/**
 * True when `logoUrl` is a seller's real uploaded logo (owner, 2026-11-16): an
 * https URL with a file path, and not a placeholder. `shapeDirectoryStore`
 * already drops empty and non-https logos; this also stops a bare or relative
 * value that `getPublicUrl` turned into a storage URL with an empty path.
 */
export function isUploadedLogo(logoUrl: string | null): logoUrl is string {
  if (!logoUrl) return false;
  let url: URL;
  try {
    url = new URL(logoUrl);
  } catch {
    return false;
  }
  return url.protocol === "https:" && /\/[^/]+\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.includes("//") && !PLACEHOLDER_LOGO.test(url.pathname);
}

/**
 * The home strip: stores with an uploaded logo (isUploadedLogo) and at least LOGO_STRIP_MIN_PRODUCTS
 * products, most products first, at most LOGO_STRIP_MAX. Empty when fewer than
 * LOGO_STRIP_MIN_SHOWN qualify, so the section hides.
 */
export function selectLogoStrip(stores: readonly DirectoryStore[]): DirectoryStore[] {
  const picked = stores
    .filter((store) => isUploadedLogo(store.logoUrl) && store.productCount >= LOGO_STRIP_MIN_PRODUCTS)
    .sort((a, b) => b.productCount - a.productCount || byName(a, b))
    .slice(0, LOGO_STRIP_MAX);
  return picked.length >= LOGO_STRIP_MIN_SHOWN ? picked : [];
}

/** Every directory store in name order (one entry per address). */
export function directoryStores(stores: readonly DirectoryStore[]): DirectoryStore[] {
  const seen = new Set<string>();
  return [...stores].sort(byName).filter((store) => (seen.has(store.url) ? false : (seen.add(store.url), true)));
}

/** How many /stores pages there are (at least one, for the empty page). */
export function directoryPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE));
}

/** The path of directory page `page`: `/stores`, then `/stores/page/2`, … */
export function directoryPagePath(page: number): string {
  return page <= 1 ? "/stores" : `/stores/page/${page}`;
}

/** The stores of one page (1-based), or null when the page doesn't exist. */
export function directoryPage(stores: readonly DirectoryStore[], page: number): DirectoryStore[] | null {
  if (!Number.isInteger(page) || page < 1 || page > directoryPageCount(stores.length)) return null;
  return stores.slice((page - 1) * DIRECTORY_PAGE_SIZE, page * DIRECTORY_PAGE_SIZE);
}

/**
 * The page number in `/stores/page/<n>`: a plain positive integer without
 * leading zeros (so each page has one address), else null.
 */
export function parseDirectoryPage(segment: string): number | null {
  return /^[1-9]\d{0,4}$/.test(segment) ? Number(segment) : null;
}

/**
 * Sitemap rows for the directory: every page (`/stores`, then
 * `/stores/page/2`, …) in every locale, all on tallaby.com. Store home
 * addresses are left out: a sitemap may list only its own host (Search
 * Console rejects `*.tallaby.com` and custom domains here), so stores are
 * found through their own sitemaps and the directory's links (owner,
 * 2026-11-15).
 */
export function directorySitemapEntries(stores: readonly DirectoryStore[]): MarketingSitemapEntry[] {
  const pages = directoryPageCount(directoryStores(stores).length);
  return Array.from({ length: pages }, (_, i) => sitemapEntries(directoryPagePath(i + 1), routing.locales)).flat();
}
