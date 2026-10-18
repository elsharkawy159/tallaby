"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreSite } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import {
  createStorePage,
  deleteStorePage,
  discardStoreDrafts,
  getStoreSiteStatus,
  listStoreRevisions,
  publishStoreSite,
  reorderStorePages,
  restoreRevisionToDraft,
  saveStoreChrome,
  saveStoreDesignSystem,
  saveStorePageDraft,
  unpublishStoreSite,
  updateStorePage,
  type StoreRevisionRow,
  getStoreDraftKey,
} from "@workspace/lib/store-sites/server";
import { signStorePreviewToken, storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { EDITOR_ERRORS, type EditorErrorKey, type EditorResult } from "./editor.dto";

/**
 * Website editor actions (PLAN.md P4-04). Every action takes the store id
 * from the editor URL and re-checks it with requireStore; nothing trusts a
 * seller or store id from the client. Content is validated against the
 * section library in @workspace/lib. Publish is rate-limited and only
 * invalidates this store's storefront.
 */

const ALLOWED = storeSectionRegistry.allowedSections();
const saveLimiter = createRateLimiter({ limit: 240, windowMs: 10 * 60_000 });
const publishLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });
const previewLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

type Access = Awaited<ReturnType<typeof requireStore>>;

function fail<T>(error: string | EditorErrorKey): EditorResult<T> {
  return { success: false, error: EDITOR_ERRORS[error] ?? (error as EditorErrorKey) ?? "generic" };
}

async function withStore<T>(
  storeId: string,
  options: { forWrite?: boolean; forPublish?: boolean; publishAction?: "publish" | "unpublish" },
  run: (access: Access) => Promise<EditorResult<T>>,
): Promise<EditorResult<T>> {
  try {
    const access = await requireStore(String(storeId), options);
    return await run(access);
  } catch (error) {
    if (isAccessError(error)) return fail(error.code === "store_read_only" ? "readOnly" : error.code === "publish_blocked" ? "publishBlocked" : "notFound");
    if (options.publishAction) {
      // P9-03: publish failures are searchable as [publish] (ids only).
      logServerError("publish", `${options.publishAction} failed`, { storeId: String(storeId) }, error);
    } else {
      console.error("[store-editor] action failed", (error as Error)?.message);
    }
    return fail("generic");
  }
}

async function invalidateStore(access: Access) {
  await applyInvalidation(invalidateStoreSite(access.seller.sellerId, access.store.id, access.store.subdomain), {
    from: "dashboard",
    mode: "action",
  });
}

export async function saveDraft(storeId: string, pageId: string, content: unknown, clientVersion: number) {
  return withStore<{ draftVersion: number }>(storeId, { forWrite: true }, async ({ seller, store }) => {
    if (!saveLimiter.check(`editor:${seller.sellerId}`)) return fail("rateLimited");
    const result = await saveStorePageDraft(seller.sellerId, store.id, String(pageId), content, Number(clientVersion), { allowedSections: ALLOWED });
    return result.success ? result : fail(result.error);
  });
}

export async function saveDesignSystem(storeId: string, designSystem: unknown, clientVersion: number) {
  return withStore<{ version: number }>(storeId, { forWrite: true }, async ({ seller, store }) => {
    if (!saveLimiter.check(`editor:${seller.sellerId}`)) return fail("rateLimited");
    const result = await saveStoreDesignSystem(seller.sellerId, store.id, designSystem, Number(clientVersion));
    return result.success ? result : fail(result.error);
  });
}

export async function saveChrome(storeId: string, part: "header" | "footer", instance: unknown) {
  return withStore<null>(storeId, { forWrite: true }, async ({ seller, store }) => {
    if (!saveLimiter.check(`editor:${seller.sellerId}`)) return fail("rateLimited");
    const result = await saveStoreChrome(seller.sellerId, store.id, part, instance, { allowedSections: ALLOWED });
    return result.success ? result : fail(result.error);
  });
}

export async function createPage(storeId: string, input: { name: { ar?: string; en?: string }; slug: string }) {
  return withStore<{ id: string; slug: string }>(storeId, { forWrite: true }, async ({ seller, store }) => {
    const result = await createStorePage(seller.sellerId, store.id, input);
    return result.success ? result : fail(result.error);
  });
}

export async function updatePage(
  storeId: string,
  pageId: string,
  input: { name?: { ar?: string; en?: string }; slug?: string; seo?: unknown; showInNav?: boolean },
) {
  return withStore<null>(storeId, { forWrite: true }, async ({ seller, store }) => {
    const result = await updateStorePage(seller.sellerId, store.id, String(pageId), input);
    return result.success ? result : fail(result.error);
  });
}

export async function deletePage(storeId: string, pageId: string) {
  return withStore<null>(storeId, { forWrite: true }, async ({ seller, store }) => {
    const result = await deleteStorePage(seller.sellerId, store.id, String(pageId));
    return result.success ? result : fail(result.error);
  });
}

export async function reorderPages(storeId: string, pageIds: string[]) {
  return withStore<null>(storeId, { forWrite: true }, async ({ seller, store }) => {
    const result = await reorderStorePages(seller.sellerId, store.id, pageIds);
    return result.success ? result : fail(result.error);
  });
}

export async function publish(storeId: string) {
  return withStore<{ revisionId: string; revisionNumber: number }>(storeId, { forPublish: true, publishAction: "publish" }, async (access) => {
    if (!publishLimiter.check(`publish:${access.seller.sellerId}`)) return fail("rateLimited");
    const result = await publishStoreSite(access.seller.sellerId, access.store.id, access.seller.userId, { allowedSections: ALLOWED });
    if (!result.success) return fail(result.error);
    await invalidateStore(access);
    revalidatePath(`/stores/${access.store.id}/website`);
    return result;
  });
}

export async function unpublish(storeId: string) {
  return withStore<null>(storeId, { forWrite: true, publishAction: "unpublish" }, async (access) => {
    const result = await unpublishStoreSite(access.seller.sellerId, access.store.id);
    if (!result.success) return fail(result.error);
    await invalidateStore(access);
    revalidatePath(`/stores/${access.store.id}/website`);
    return result;
  });
}

export async function discardDraft(storeId: string) {
  return withStore<{ pages: number }>(storeId, { forWrite: true }, async ({ seller, store }) => {
    const result = await discardStoreDrafts(seller.sellerId, store.id);
    return result.success ? result : fail(result.error);
  });
}

export async function listRevisions(storeId: string) {
  return withStore<StoreRevisionRow[]>(storeId, {}, async ({ seller, store }) => {
    const rows = await listStoreRevisions(seller.sellerId, store.id);
    return rows ? { success: true, data: rows } : fail("notFound");
  });
}

export async function restoreRevision(storeId: string, revisionId: string) {
  return withStore<{ pages: number }>(storeId, { forWrite: true }, async ({ seller, store }) => {
    const result = await restoreRevisionToDraft(seller.sellerId, store.id, String(revisionId));
    return result.success ? result : fail(result.error);
  });
}

export async function siteStatus(storeId: string) {
  return withStore<NonNullable<Awaited<ReturnType<typeof getStoreSiteStatus>>>>(storeId, {}, async ({ seller, store }) => {
    const status = await getStoreSiteStatus(seller.sellerId, store.id);
    return status ? { success: true, data: status } : fail("notFound");
  });
}

/**
 * "Preview on my store" (PLAN.md P4-08): a signed link to the store host that
 * shows the CURRENT drafts for up to 15 minutes. The token is bound to this
 * store and to the drafts as they are now, so a later edit needs a new link.
 * Fails closed when STORE_PREVIEW_SECRET is not configured.
 */
export async function previewLink(storeId: string) {
  return withStore<{ url: string; expiresAt: number }>(storeId, {}, async ({ seller, store }) => {
    const secret = storePreviewSecret();
    if (!secret) return fail("previewUnavailable");
    if (store.status !== "active") return fail("readOnly");
    if (!previewLimiter.check(`preview:${seller.sellerId}`)) return fail("rateLimited");
    const [draftKey, customDomain] = await Promise.all([
      getStoreDraftKey(seller.sellerId, store.id),
      findActiveCustomDomainForSubdomain(store.subdomain),
    ]);
    if (!draftKey) return fail("notFound");
    const { token, expiresAt } = signStorePreviewToken({ storeId: store.id, draftKey, secret });
    // The store host sets the preview cookie itself, so the link opens on the
    // address the store is served from (its own domain when one is active).
    const url = `${storeUrl(store.subdomain, customDomain)}/api/store-preview?token=${encodeURIComponent(token)}`;
    return { success: true, data: { url, expiresAt } };
  });
}
