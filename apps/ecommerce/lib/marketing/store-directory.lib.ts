import { routing } from "@/i18n/routing";
import { type MarketingSitemapEntry, sitemapEntries } from "./seo.lib";
import { storeIndustryId, type StoreIndustryId } from "./recent-stores.lib";

/**
 * tallaby.com's public store list: the home page's logo strip and /stores
 * (owner, 2026-11-14: store logos on the home page, overriding F-73's "no store
 * names" for this section only). Only public store data: name, logo, address,
 * listed industry and how many products it shows. Nothing about the seller.
 */

/** "+10 published products" (owner): a store needs at least this many to join the home strip. */
export const LOGO_STRIP_MIN_PRODUCTS = 10;
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

/**
 * The home strip: stores with a logo and at least LOGO_STRIP_MIN_PRODUCTS
 * products, most products first, at most LOGO_STRIP_MAX. Empty when fewer than
 * LOGO_STRIP_MIN_SHOWN qualify, so the section hides.
 */
export function selectLogoStrip(stores: readonly DirectoryStore[]): DirectoryStore[] {
  const picked = stores
    .filter((store) => store.logoUrl && store.productCount >= LOGO_STRIP_MIN_PRODUCTS)
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
 * Sitemap rows for the directory: its later pages (page 1 is `/stores`, a
 * static path) in every locale, and each store's home address (absolute, on
 * the store's own host, so no tallaby.com alternates).
 */
export function directorySitemapEntries(stores: readonly DirectoryStore[]): MarketingSitemapEntry[] {
  const listed = directoryStores(stores);
  const pages = directoryPageCount(listed.length);
  const pageEntries = Array.from({ length: pages - 1 }, (_, i) => sitemapEntries(directoryPagePath(i + 2), routing.locales)).flat();
  return [...pageEntries, ...listed.map((store) => ({ url: store.url, alternates: { languages: {} } }))];
}
