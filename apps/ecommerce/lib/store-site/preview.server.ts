import { cache } from "react";
import { cookies, draftMode } from "next/headers";
import {
  STORE_PREVIEW_COOKIE,
  storePreviewSecret,
  verifyStorePreviewToken,
} from "@workspace/lib/store-sites/preview";
import { getStoreDraftSiteForPreview } from "@workspace/lib/store-sites/server";
import type { SiteConfig } from "@workspace/store-sections";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { getCachedPublishedSite } from "./published-site.server";

/**
 * "Preview on my store" (PLAN.md P4-08). /api/store-preview turns on Next's
 * Draft Mode (which bypasses every cache and serves the page
 * `Cache-Control: private, no-store`) and stores the signed token in an
 * httpOnly cookie on this host. Here the token is checked again on every
 * request against the store of the HOST (never an id from the request), and
 * only then is the store's draft read, uncached.
 *
 *   active  → the draft is rendered with a "Preview, not live" banner;
 *   invalid → the token expired, is for another store, or the draft changed:
 *             the live site is rendered with a banner explaining why.
 */
export type StorePreviewState = "active" | "invalid";

export type StorefrontSite = { site: SiteConfig | null; preview: StorePreviewState | null };

async function readPreview(storeId: string): Promise<{ state: StorePreviewState; site: SiteConfig | null } | null> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  const token = (await cookies()).get(STORE_PREVIEW_COOKIE)?.value;
  if (!token) return null;
  const secret = storePreviewSecret();
  if (!secret) return { state: "invalid", site: null };

  const verified = verifyStorePreviewToken(token, { secret, storeId });
  if (!verified.ok) return { state: "invalid", site: null };
  const draft = await getStoreDraftSiteForPreview(storeId, verified.draftKey, {
    allowedSections: storeSectionRegistry.allowedSections(),
  });
  return draft.success ? { state: "active", site: draft.site } : { state: "invalid", site: null };
}

/**
 * The site the storefront renders for this request: the verified draft in
 * preview, else the published revision (cached). One read per request.
 */
export const getStorefrontSite = cache(
  async (sellerId: string, storeId: string, subdomain: string): Promise<StorefrontSite> => {
    const preview = await readPreview(storeId);
    if (preview?.site) return { site: preview.site, preview: "active" };
    const site = await getCachedPublishedSite(sellerId, storeId, subdomain);
    return { site, preview: preview?.state ?? null };
  },
);
