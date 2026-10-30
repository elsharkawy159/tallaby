import { appIconVersion } from "@workspace/lib/stores/app";
import { getRequestStoreSubdomain, getStorefrontBySubdomain, isStorefrontOffline } from "@/lib/storefront.server";

/**
 * The store app (PWA, ROADMAP.md F-36) of the request's host: the published
 * store a subdomain or custom domain serves, or null on tallaby.com and for an
 * offline store (CLAUDE.md rule 12), which then get the Tallaby manifest.
 */
export async function getRequestStoreApp() {
  const subdomain = await getRequestStoreSubdomain();
  if (!subdomain) return null;
  const store = await getStorefrontBySubdomain(subdomain);
  if (!store || isStorefrontOffline(store)) return null;
  // The icon is the favicon (owner, 2026-10-29), else the logo, else initials.
  const image = store.faviconUrl || store.logoUrl || null;
  return {
    store,
    image,
    iconVersion: appIconVersion(image, store.displayName),
    locale: store.supportedLocales?.[0] === "en" ? ("en" as const) : ("ar" as const),
  };
}
