import { notFound } from "next/navigation";
import { getStoreForEditor, getStoreSiteStatus, listStoreRevisions } from "@workspace/lib/store-sites/server";
import { storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import type { StoreRow } from "@workspace/lib/stores/server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePage } from "@/lib/stores/store-page.server";
import type { WebsiteOverviewData, WebsitePageRow } from "./website.types";

/**
 * A /stores/[storeId]/website/… page: the store must be the session seller's
 * (404 otherwise, via loadStorePage) and the website builder must be rolled
 * out to this seller (STORE_BUILDER_SELLER_IDS, same flag as the editor).
 */
export async function loadWebsiteStore(storeId: string): Promise<StoreRow> {
  const store = await loadStorePage(storeId);
  if (!storeBuilderEnabled(store.sellerId)) notFound();
  return store;
}

const toIso = (value: Date | string | null | undefined) =>
  value ? (value instanceof Date ? value.toISOString() : new Date(value).toISOString()) : null;

/** The store's draft pages, in menu order (seeds the scaffold for a new store). */
export async function loadWebsitePages(store: StoreRow): Promise<WebsitePageRow[]> {
  const editor = await getStoreForEditor(store.sellerId, store.id);
  if (!editor) notFound();
  return editor.pages.map((page) => ({
    id: page.id,
    slug: page.slug,
    isHome: page.isHome,
    ...(page.kind === "product" && { kind: "product" as const }),
    name: (page.name ?? {}) as { ar?: string; en?: string },
    seo: (page.seo ?? {}) as WebsitePageRow["seo"],
    showInNav: page.showInNav,
    updatedAt: toIso(page.updatedAt),
  }));
}

export async function loadWebsiteOverview(store: StoreRow): Promise<WebsiteOverviewData> {
  // First, so a store that never opened the editor gets its draft scaffold
  // before the status compares drafts with the live revision.
  const pages = await loadWebsitePages(store);
  const [status, revisions, customDomain] = await Promise.all([
    getStoreSiteStatus(store.sellerId, store.id),
    listStoreRevisions(store.sellerId, store.id, 10),
    findActiveCustomDomainForSubdomain(store.subdomain),
  ]);
  if (!status || !revisions) notFound();

  return {
    storeId: store.id,
    readOnly: store.status !== "active",
    liveUrl: storeUrl(store.subdomain, customDomain),
    hostname: storeHostname(store.subdomain, customDomain),
    siteStatus: status.siteStatus,
    isLive: status.isLive,
    hasUnpublishedChanges: status.hasUnpublishedChanges,
    templateChosen: status.templateChosen,
    lastPublishedAt: toIso(status.lastPublishedAt),
    previewEnabled: storePreviewSecret() !== null,
    pageCount: pages.length,
    revisions: revisions.map((revision) => ({
      id: revision.id,
      revisionNumber: revision.revisionNumber,
      createdAt: toIso(revision.createdAt)!,
      isLive: revision.isLive,
    })),
  };
}
