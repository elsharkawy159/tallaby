/**
 * Public URLs of the other Tallaby apps, for "open on site" links. Server
 * only (reads non-public env vars); pass the result to client components.
 */

/** The ecommerce app (tallaby.com marketing site, marketplace, template gallery). */
export function ecommerceBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_ECOMMERCE_URL ??
    process.env.NEXT_PUBLIC_ECOMMERCE_DOMAIN ??
    process.env.ECOMMERCE_URL ??
    process.env.ECOMMERCE_DOMAIN ??
    "http://localhost:3000";
  return baseUrl.replace(/\/+$/, "");
}

/** A template's page in the tallaby.com gallery (`/templates/<key>`). */
export function templateGalleryUrl(templateKey: string): string {
  return `${ecommerceBaseUrl()}/templates/${encodeURIComponent(templateKey)}`;
}
