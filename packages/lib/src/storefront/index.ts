/**
 * Seller storefront subdomains (`{subdomain}.tallaby.com`).
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

/** Public URL of a store, e.g. `https://faster.tallaby.com`. */
export function storeUrl(subdomain: string): string {
  const root = storefrontRootDomain();
  const protocol = root.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${subdomain}.${root}`;
}

/** Hostname only, for display: `faster.tallaby.com`. */
export function storeHostname(subdomain: string): string {
  return `${subdomain}.${storefrontRootDomain()}`;
}
