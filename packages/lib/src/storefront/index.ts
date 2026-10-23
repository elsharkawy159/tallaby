/**
 * Seller storefront subdomains (`{subdomain}.tallaby.com`) and custom
 * domains (`faster-eg.com`, migration 0048).
 *
 * Edge-safe: no database or Node imports, so the ecommerce proxy can use it.
 * The same rules are enforced in SQL by migration 0044 — keep both in sync.
 */

export const SUBDOMAIN_MIN_LENGTH = 3;
export const SUBDOMAIN_MAX_LENGTH = 32;

/** Lowercase letters, digits and inner hyphens; 3–32 characters. */
export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

/** Hosts Tallaby uses itself or may need later. Mirrored in `reserved_subdomains`. */
export const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "app", "admin", "dashboard", "seller", "sellers", "shipping",
  "driver", "drivers", "store", "stores", "shop", "shops", "mail", "email",
  "smtp", "imap", "pop", "ftp", "cdn", "static", "assets", "media", "img",
  "images", "files", "blog", "help", "support", "docs", "status", "auth",
  "login", "account", "accounts", "checkout", "cart", "pay", "payment",
  "payments", "billing", "affiliate", "affiliates", "dev", "staging", "test",
  "preview", "beta", "demo", "ns1", "ns2", "tallaby",
]);

export type SubdomainProblem = "tooShort" | "tooLong" | "invalid" | "reserved";

export function normalizeSubdomain(input: string): string {
  return input.trim().toLowerCase();
}

/** Returns why `subdomain` can't be used, or null when it is valid. */
export function validateSubdomain(subdomain: string): SubdomainProblem | null {
  if (subdomain.length < SUBDOMAIN_MIN_LENGTH) return "tooShort";
  if (subdomain.length > SUBDOMAIN_MAX_LENGTH) return "tooLong";
  if (!SUBDOMAIN_PATTERN.test(subdomain) || subdomain.includes("--")) {
    return "invalid";
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) return "reserved";
  return null;
}

// Rough Arabic → Latin letters, so an Arabic store name still suggests an address.
const ARABIC_TO_LATIN: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "e", "آ": "a", "ء": "", "ؤ": "o", "ئ": "e", "ب": "b",
  "ت": "t", "ث": "th", "ج": "g", "ح": "h", "خ": "kh", "د": "d", "ذ": "z", "ر": "r",
  "ز": "z", "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a",
  "غ": "gh", "ف": "f", "ق": "k", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h",
  "ة": "a", "و": "w", "ي": "y", "ى": "a",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/**
 * A subdomain suggestion from a store name: "متجر فاستر" → "mtgr-fastr",
 * "Faster Store!" → "faster-store". Only a starting point; the result may
 * still be too short, reserved or taken, so callers validate it as usual.
 */
export function subdomainFromName(name: string): string {
  return Array.from(name.normalize("NFKD").toLowerCase())
    .map((ch) => ARABIC_TO_LATIN[ch] ?? ch)
    .join("")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "") // Latin accents, Arabic harakat, tatweel
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, SUBDOMAIN_MAX_LENGTH)
    .replace(/-+$/, "");
}

/** The domain storefronts live under, e.g. `tallaby.com` (`localhost:3000` in dev). */
export function storefrontRootDomain(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tallaby.com")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

/**
 * The store subdomain a request host points at, or null for the main site.
 * `faster.tallaby.com` → "faster"; `faster.localhost:3000` works in dev.
 */
export function storeSubdomainFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.toLowerCase().replace(/:\d+$/, "");

  const root = storefrontRootDomain().replace(/:\d+$/, "");
  for (const candidate of new Set([root, "localhost"])) {
    if (!hostname.endsWith(`.${candidate}`)) continue;
    const sub = hostname.slice(0, -(candidate.length + 1));
    if (sub.includes(".") || validateSubdomain(sub)) return null;
    return sub;
  }
  return null;
}

/** True when storefronts run on `*.localhost` (local development). */
export function isLocalStorefrontRoot(): boolean {
  return storefrontRootDomain().startsWith("localhost");
}

/** A `*.localhost` request host (local development). */
export function isLocalHost(host: string | null | undefined): boolean {
  const hostname = hostnameOf(host);
  return hostname === "localhost" || hostname.endsWith(".localhost");
}

/**
 * Public URL of a store, e.g. `https://faster.tallaby.com`, or its own
 * domain (`https://faster-eg.com`) once one is active. In local development
 * a store keeps its `*.localhost` subdomain: its custom domain is production.
 */
export function storeUrl(subdomain: string, customDomain?: string | null): string {
  const local = isLocalStorefrontRoot();
  if (customDomain && (!local || !subdomain)) return `https://${customDomain}`;
  const root = storefrontRootDomain();
  return `${local ? "http" : "https"}://${subdomain}.${root}`;
}

/** Hostname only, for display: `faster.tallaby.com` or `faster-eg.com` (the subdomain in local development). */
export function storeHostname(subdomain: string, customDomain?: string | null): string {
  if (customDomain && (!isLocalStorefrontRoot() || !subdomain)) return customDomain;
  return `${subdomain}.${storefrontRootDomain()}`;
}

/* Custom domains (faster-eg.com). Same rules as migration 0048. */

export type CustomDomainProblem = "invalid" | "platform";

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/** Request host without port, lowercased: `Faster-EG.com:443` → `faster-eg.com`. */
export function hostnameOf(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/**
 * What a seller typed, reduced to the apex we store:
 * `https://www.Faster-EG.com/shop` → `faster-eg.com`.
 */
export function normalizeCustomDomain(input: string): string {
  const host = input
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/[/?#].*$/, "");
  return hostnameOf(host).replace(/^www\./, "");
}

/** tallaby.com, anything under it, and other hosts Tallaby itself answers on. */
function isTallabyHostname(hostname: string): boolean {
  const roots = new Set([hostnameOf(storefrontRootDomain()), "tallaby.com"]);
  for (const root of roots) {
    if (hostname === root || hostname.endsWith(`.${root}`)) return true;
  }
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".vercel.app")
  );
}

/** Returns why `domain` (already normalized) can't be used, or null when valid. */
export function validateCustomDomain(domain: string): CustomDomainProblem | null {
  if (domain.length > 253 || !DOMAIN_PATTERN.test(domain)) return "invalid";
  if (isTallabyHostname(domain)) return "platform";
  return null;
}

/**
 * Hosts that belong to Tallaby itself: the marketplace, its store subdomains,
 * Vercel preview URLs, localhost and bare IPs. Any other host is a seller's
 * custom domain.
 */
export function isPlatformHost(host: string | null | undefined): boolean {
  const hostname = hostnameOf(host);
  if (!hostname) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return true;
  return isTallabyHostname(hostname);
}

/**
 * The marketplace itself (tallaby.com, previews, localhost), not a seller
 * storefront subdomain or custom domain. Tallaby's own tracking (Meta pixel,
 * CAPI) runs only here (PLAN.md P5-05).
 */
export function isMarketplaceHost(host: string | null | undefined): boolean {
  return isPlatformHost(host) && !storeSubdomainFromHost(host);
}
