import { hostnameOf, isLocalStorefrontRoot, storefrontRootDomain } from "./index";

/**
 * Two reserved subdomains the storefront app (apps/ecommerce) serves for
 * pages that used to live on tallaby.com, now served by apps/marketing
 * (docs/plans/hetzner-migration.md, "Marketing split"; owner, 2026-11-19):
 *
 * - `account.<root>`: the shared customer pages (/auth, /cart, /orders,
 *   /profile …) and their API routes (OAuth start and callback for custom
 *   domains, digital downloads, payment returns).
 * - `preview.<root>`: the full-page template preview (/template-preview,
 *   /dev-library) and its card screenshots (/template-previews/*.webp).
 *
 * Both names are in RESERVED_SUBDOMAINS, so they are never a store.
 * `<root>` is NEXT_PUBLIC_ROOT_DOMAIN (`tallaby.com`; `localhost:3000` in
 * development, where the origin is `http://account.localhost:3000`, like
 * `storeUrl`). Edge-safe: the ecommerce proxy and client code import it.
 */

export const ACCOUNT_SUBDOMAIN = "account";
export const TEMPLATE_PREVIEW_SUBDOMAIN = "preview";

function platformOrigin(subdomain: string): string {
  return `${isLocalStorefrontRoot() ? "http" : "https"}://${subdomain}.${storefrontRootDomain()}`;
}

function isPlatformSubdomainHost(host: string | null | undefined, subdomain: string): boolean {
  const hostname = hostnameOf(host);
  return hostname !== "" && hostname === hostnameOf(`${subdomain}.${storefrontRootDomain()}`);
}

/** `https://account.tallaby.com` (no trailing slash). */
export function accountOrigin(): string {
  return platformOrigin(ACCOUNT_SUBDOMAIN);
}

/** `https://preview.tallaby.com` (no trailing slash). */
export function templatePreviewOrigin(): string {
  return platformOrigin(TEMPLATE_PREVIEW_SUBDOMAIN);
}

/** True for a request to `account.<root>` (any port). */
export function isAccountHost(host: string | null | undefined): boolean {
  return isPlatformSubdomainHost(host, ACCOUNT_SUBDOMAIN);
}

/** True for a request to `preview.<root>` (any port). */
export function isTemplatePreviewHost(host: string | null | undefined): boolean {
  return isPlatformSubdomainHost(host, TEMPLATE_PREVIEW_SUBDOMAIN);
}
