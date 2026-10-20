"use server";

import { revalidatePath } from "next/cache";
import { createTranslator } from "next-intl";
import { applyInvalidation, invalidateStoreSite } from "@workspace/cache";
import { db } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN, type AdminAuditAction } from "@workspace/lib/admin";
import { auditStoreSite, markSiteEditedByAdmin, resolveStoreForAdmin, type AdminStoreRef } from "@workspace/lib/admin/server";
import { buildTemplateForm, getFormTemplate } from "@workspace/lib/store-forms";
import { createStoreForm, listStoreForms } from "@workspace/lib/store-forms/server";
import {
  applyStoreTemplate,
  createStorePage,
  deleteStorePage,
  discardStoreDrafts,
  getStoreDraftKey,
  getStoreDraftVersions,
  getStoreSiteStatus,
  getStoreTemplateConfig,
  getTemplateMeta,
  listStoreRevisions,
  publishStoreSite,
  reorderStorePages,
  restoreRevisionToDraft,
  saveStoreChrome,
  saveStoreDesignSystem,
  saveStorePageDraft,
  undoStoreTemplate,
  unpublishStoreSite,
  updateStorePage,
  type StoreRevisionRow,
} from "@workspace/lib/store-sites/server";
import { signStorePreviewToken, storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { getStoreCatalog } from "@workspace/lib/stores/server";
import { contentOverrideKeys, storeSectionRegistry } from "@workspace/store-sections/render";
import {
  EDITOR_ERRORS,
  type EditorCatalogSnapshot,
  type EditorErrorKey,
  type EditorForm,
  type EditorFormSummary,
  type EditorResult,
  type FormsActionResult,
  type FormsErrorKey,
} from "@workspace/store-editor/editor.dto";
import type { DraftVersions } from "@workspace/store-editor";
import type { TemplateActionResult, TemplateErrorKey, TemplatePreviewView } from "@workspace/store-editor/templates.dto";
import editorAr from "@workspace/store-editor/messages/ar.json";
import editorEn from "@workspace/store-editor/messages/en.json";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { loadEditorForms, loadEditorSnapshot, storePageSlug, storeSiteMeta, type Queryable } from "./admin-store-editor.data";

/**
 * Admin website editor actions (spec 2026-10-20-admin-website-builder §5.2).
 * The same store-sites functions as the seller's editor, for any store:
 *   1. the signed-in admin must hold canManageUsers (admin / super_admin),
 *   2. the store and its real seller are resolved from the store id in the
 *      database (resolveStoreForAdmin re-checks the actor there too),
 *   3. the lib function runs with THAT sellerId; nothing from the client.
 * Saves mark the site as admin-edited (the seller's open editor then shows the
 * "admin updated" notice). Publish, unpublish, restore, discard, page changes
 * and templates are audited with the session's reason in the same transaction.
 * Autosaves are not audited one by one.
 */

const ALLOWED = storeSectionRegistry.allowedSections();
const OVERRIDE_KEYS = contentOverrideKeys(storeSectionRegistry);
// Keyed by the admin's user id.
const saveLimiter = createRateLimiter({ limit: 240, windowMs: 10 * 60_000 });
const writeLimiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });
const publishLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });
const readLimiter = createRateLimiter({ limit: 240, windowMs: 10 * 60_000 });

const TEMPLATE_ERRORS: Record<string, TemplateErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  template_not_found: "templateNotFound",
  premium_template: "premiumTemplate",
  invalid_template: "invalidTemplate",
  too_many_pages: "tooManyPages",
  nothing_to_undo: "nothingToUndo",
};
const FORM_ERRORS: Record<string, FormsErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  invalid_input: "invalidInput",
  limit_reached: "limitReached",
};

type Ctx = { actorId: string; ref: AdminStoreRef };
type Failure = { success: false; error: string };

function fail<T>(error: string | EditorErrorKey): EditorResult<T> {
  return { success: false, error: EDITOR_ERRORS[error] ?? (error as EditorErrorKey) ?? "generic" };
}

const isNotAdmin = (error: unknown) => (error as { code?: string } | null)?.code === "not_admin";

/** The trimmed reason when it fits the audit log's limits, else null. */
function cleanReason(reason: unknown): string | null {
  if (typeof reason !== "string") return null;
  const value = reason.trim();
  return value.length >= ADMIN_REASON_MIN && value.length <= ADMIN_REASON_MAX ? value : null;
}

/** Admin + store check, then `run`; any failure is "notFound" (or "generic", logged). */
async function withAdminStore<R extends { success: boolean }>(
  storeId: string,
  label: string,
  run: (ctx: Ctx) => Promise<R>,
  failure: (error: "notFound" | "generic") => R,
): Promise<R> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return failure("notFound");
  try {
    const ref = await resolveStoreForAdmin(actorId, String(storeId));
    if (!ref) return failure("notFound");
    return await run({ actorId, ref });
  } catch (error) {
    if (isNotAdmin(error)) return failure("notFound");
    logServerError("admin", `store editor ${label} failed`, { storeId: String(storeId) }, error);
    return failure("generic");
  }
}

const editorAction = <T>(storeId: string, label: string, run: (ctx: Ctx) => Promise<EditorResult<T>>) =>
  withAdminStore<EditorResult<T>>(storeId, label, run, (error) => fail(error));

class Rollback extends Error {
  constructor(readonly result: Failure) {
    super("rollback");
  }
}

/**
 * An audited write: the actor and store are re-resolved inside one
 * transaction, `run` makes the change with that transaction and returns the
 * audit before/after; a failed result rolls back and writes no audit row.
 */
async function auditedAction<T, R extends { success: true; data: T } | Failure>(
  storeId: string,
  reason: unknown,
  action: AdminAuditAction,
  run: (tx: Queryable, ctx: Ctx) => Promise<{ result: R; before: Record<string, unknown>; after: Record<string, unknown> }>,
  failure: (error: "notFound" | "generic" | "invalidInput" | "rateLimited") => R,
  options: { limiter?: typeof writeLimiter; onDone?: (ref: AdminStoreRef) => Promise<void> } = {},
): Promise<R> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return failure("notFound");
  const why = cleanReason(reason);
  if (!why) return failure("invalidInput");
  if (!(options.limiter ?? writeLimiter).check(`admin-editor:${actorId}`)) return failure("rateLimited");
  try {
    const { result, ref } = await db.transaction(async (tx) => {
      const ref = await resolveStoreForAdmin(actorId, String(storeId), tx);
      if (!ref) throw new Rollback({ success: false, error: "notFound" });
      const { result, before, after } = await run(tx, { actorId, ref });
      if (!result.success) throw new Rollback(result);
      await auditStoreSite(tx, { actorId, sellerId: ref.sellerId, storeId: ref.storeId, action, before, after, reason: why });
      return { result, ref };
    });
    // Post-commit steps (cache invalidation, revalidatePath) never turn a
    // committed write into a failure: the admin would retry and publish twice.
    if (options.onDone) await afterCommit(`${action} after commit`, String(storeId), () => options.onDone!(ref));
    return result;
  } catch (error) {
    if (error instanceof Rollback) return error.result as R;
    if (isNotAdmin(error)) return failure("notFound");
    logServerError("admin", `store editor ${action} failed`, { storeId: String(storeId) }, error);
    return failure("generic");
  }
}

const auditedEditor = <T>(
  storeId: string,
  reason: unknown,
  action: AdminAuditAction,
  run: (tx: Queryable, ctx: Ctx) => Promise<{ result: EditorResult<T>; before: Record<string, unknown>; after: Record<string, unknown> }>,
  options?: { limiter?: typeof writeLimiter; onDone?: (ref: AdminStoreRef) => Promise<void> },
) => auditedAction<T, EditorResult<T>>(storeId, reason, action, run, (error) => fail(error), options);

/** A lib result → an EditorResult (lib error codes become message keys). */
function toEditor<T>(result: { success: true; data: T } | { success: false; error: string }): EditorResult<T> {
  return result.success ? { success: true, data: result.data } : fail(result.error);
}

async function invalidate(ref: AdminStoreRef) {
  await applyInvalidation(invalidateStoreSite(ref.sellerId, ref.storeId, ref.subdomain), { from: "admin", mode: "action" });
}

/** Runs a step after a committed write; a failure is logged, never returned. */
async function afterCommit(label: string, storeId: string, step: () => Promise<void> | void): Promise<void> {
  try {
    await step();
  } catch (error) {
    logServerError("admin", `store editor ${label} failed`, { storeId }, error);
  }
}

/**
 * An autosave and the "admin edited" mark in ONE transaction: a seller's poll
 * never sees the new version without the admin notice, and a failing mark
 * rolls the save back (the retry sends the same version, no self-conflict)
 * instead of reporting an error for a committed save.
 */
function saveMarked<R extends { success: boolean }>(ref: AdminStoreRef, save: (q: Queryable) => Promise<R>): Promise<R> {
  return db.transaction(async (tx) => {
    const result = await save(tx);
    if (result.success) await markSiteEditedByAdmin(ref.storeId, tx);
    return result;
  });
}

const refreshAdminStore = (storeId: string) => revalidatePath(`/stores/${storeId}`);

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

/** Opening the editor is audited with the session's reason (asked once per session). */
export async function openStoreEditor(storeId: string, reason: string): Promise<EditorResult<null>> {
  return auditedEditor<null>(storeId, reason, "open_store_editor", async () => ({
    result: { success: true, data: null },
    before: {},
    after: {},
  }));
}

// ---------------------------------------------------------------------------
// Autosaves (not audited; they mark the site as admin-edited)
// ---------------------------------------------------------------------------

export async function saveDraft(storeId: string, pageId: string, content: unknown, clientVersion: number, _reason?: string) {
  return editorAction<{ draftVersion: number }>(storeId, "save draft", async ({ actorId, ref }) => {
    if (!saveLimiter.check(`admin-editor:${actorId}`)) return fail("rateLimited");
    const result = await saveMarked(ref, (q) =>
      saveStorePageDraft(ref.sellerId, ref.storeId, String(pageId), content, Number(clientVersion), { allowedSections: ALLOWED }, q),
    );
    return toEditor(result);
  });
}

export async function saveDesignSystem(storeId: string, designSystem: unknown, clientVersion: number, _reason?: string) {
  return editorAction<{ version: number }>(storeId, "save design", async ({ actorId, ref }) => {
    if (!saveLimiter.check(`admin-editor:${actorId}`)) return fail("rateLimited");
    const result = await saveMarked(ref, (q) => saveStoreDesignSystem(ref.sellerId, ref.storeId, designSystem, Number(clientVersion), q));
    return toEditor(result);
  });
}

export async function saveChrome(storeId: string, part: "header" | "footer", instance: unknown, clientVersion: number, _reason?: string) {
  return editorAction<{ version: number }>(storeId, "save chrome", async ({ actorId, ref }) => {
    if (!saveLimiter.check(`admin-editor:${actorId}`)) return fail("rateLimited");
    const result = await saveMarked(ref, (q) =>
      saveStoreChrome(ref.sellerId, ref.storeId, part, instance, Number(clientVersion), { allowedSections: ALLOWED }, q),
    );
    return toEditor(result);
  });
}

export async function reorderPages(storeId: string, pageIds: string[], _reason?: string) {
  return editorAction<null>(storeId, "reorder pages", async ({ actorId, ref }) => {
    if (!saveLimiter.check(`admin-editor:${actorId}`)) return fail("rateLimited");
    const result = await saveMarked(ref, (q) => reorderStorePages(ref.sellerId, ref.storeId, pageIds, q));
    return toEditor(result);
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Draft versions for noticing a seller editing at the same time. The admin
 * edit time is left out: this editor's own saves set it, and a seller's
 * change must read as a plain "changed elsewhere", not "an admin updated".
 */
export async function draftVersions(storeId: string) {
  return editorAction<DraftVersions>(storeId, "draft versions", async ({ ref }) => {
    const versions = await getStoreDraftVersions(ref.sellerId, ref.storeId);
    return versions ? { success: true, data: { ...versions, editedByAdminAt: null } } : fail("notFound");
  });
}

export async function refreshEditorData(storeId: string) {
  return editorAction<EditorCatalogSnapshot>(storeId, "refresh data", async ({ actorId, ref }) => {
    if (!readLimiter.check(`admin-editor-read:${actorId}`)) return fail("rateLimited");
    const catalog = await getStoreCatalog(ref.sellerId, ref.storeId);
    if (!catalog) return fail("notFound");
    return { success: true, data: await loadEditorSnapshot(ref.sellerId, ref.storeId, catalog.mode) };
  });
}

export async function listForms(storeId: string) {
  return editorAction<{ forms: EditorForm[]; summaries: EditorFormSummary[] }>(storeId, "list forms", async ({ ref }) => {
    const [forms, summaries] = await Promise.all([loadEditorForms(ref.sellerId, ref.storeId), listStoreForms(ref.sellerId, ref.storeId)]);
    return {
      success: true,
      data: {
        forms,
        summaries: summaries.map((s) => ({ id: s.id, fieldCount: s.fieldCount, submissionCount: s.submissionCount, newCount: s.newCount })),
      },
    };
  });
}

export async function listRevisions(storeId: string) {
  return editorAction<StoreRevisionRow[]>(storeId, "list revisions", async ({ ref }) => {
    const rows = await listStoreRevisions(ref.sellerId, ref.storeId);
    return rows ? { success: true, data: rows } : fail("notFound");
  });
}

export async function siteStatus(storeId: string) {
  return editorAction<NonNullable<Awaited<ReturnType<typeof getStoreSiteStatus>>>>(storeId, "site status", async ({ ref }) => {
    const status = await getStoreSiteStatus(ref.sellerId, ref.storeId);
    return status ? { success: true, data: status } : fail("notFound");
  });
}

/** "Preview on the store": a signed 15-minute link showing the current drafts (as in the seller editor). */
export async function previewLink(storeId: string) {
  return editorAction<{ url: string; expiresAt: number }>(storeId, "preview link", async ({ actorId, ref }) => {
    const secret = storePreviewSecret();
    if (!secret) return fail("previewUnavailable");
    if (ref.status !== "active") return fail("readOnly");
    if (!readLimiter.check(`admin-editor-read:${actorId}`)) return fail("rateLimited");
    const [draftKey, customDomain] = await Promise.all([
      getStoreDraftKey(ref.sellerId, ref.storeId),
      findActiveCustomDomainForSubdomain(ref.subdomain),
    ]);
    if (!draftKey) return fail("notFound");
    const { token, expiresAt } = signStorePreviewToken({ storeId: ref.storeId, draftKey, secret });
    const url = `${storeUrl(ref.subdomain, customDomain)}/api/store-preview?token=${encodeURIComponent(token)}`;
    return { success: true, data: { url, expiresAt } };
  });
}

// ---------------------------------------------------------------------------
// Audited writes
// ---------------------------------------------------------------------------

/** Publishes the store's drafts (the seller must be approved; the fee trial still starts). */
export async function publish(storeId: string, reason?: string) {
  return auditedEditor<{ revisionId: string; revisionNumber: number }>(
    storeId,
    reason,
    "publish_store_site",
    async (tx, { actorId, ref }) => {
      const before = await storeSiteMeta(tx, ref.storeId);
      const result = toEditor(await publishStoreSite(ref.sellerId, ref.storeId, actorId, { allowedSections: ALLOWED }, tx));
      return {
        result,
        before: { revisionId: before?.revisionId ?? null },
        after: { revisionId: result.success ? result.data.revisionId : null },
      };
    },
    {
      limiter: publishLimiter,
      onDone: async (ref) => {
        await invalidate(ref);
        refreshAdminStore(ref.storeId);
      },
    },
  );
}

export async function unpublish(storeId: string, reason?: string) {
  return auditedEditor<null>(
    storeId,
    reason,
    "unpublish_store_site",
    async (tx, { ref }) => {
      const before = await storeSiteMeta(tx, ref.storeId);
      const result = toEditor(await unpublishStoreSite(ref.sellerId, ref.storeId, tx));
      return { result, before: { revisionId: before?.revisionId ?? null }, after: { revisionId: null } };
    },
    {
      limiter: publishLimiter,
      onDone: async (ref) => {
        await invalidate(ref);
        refreshAdminStore(ref.storeId);
      },
    },
  );
}

export async function restoreRevision(storeId: string, revisionId: string, reason?: string) {
  return auditedEditor<{ pages: number }>(
    storeId,
    reason,
    "restore_store_revision",
    async (tx, { ref }) => {
      const result = toEditor(await restoreRevisionToDraft(ref.sellerId, ref.storeId, String(revisionId), tx));
      if (result.success) await markSiteEditedByAdmin(ref.storeId, tx);
      return { result, before: {}, after: { revisionId: String(revisionId) } };
    },
  );
}

export async function discardDraft(storeId: string, reason?: string) {
  return auditedEditor<{ pages: number }>(storeId, reason, "discard_store_draft", async (tx, { ref }) => {
    const live = await storeSiteMeta(tx, ref.storeId);
    const result = toEditor(await discardStoreDrafts(ref.sellerId, ref.storeId, tx));
    if (result.success) await markSiteEditedByAdmin(ref.storeId, tx);
    return { result, before: {}, after: { revisionId: live?.revisionId ?? null } };
  });
}

export async function createPage(storeId: string, input: { name: { ar?: string; en?: string }; slug: string }, reason?: string) {
  return auditedEditor<{ id: string; slug: string }>(storeId, reason, "change_store_page", async (tx, { ref }) => {
    const result = toEditor(await createStorePage(ref.sellerId, ref.storeId, input, tx));
    if (result.success) await markSiteEditedByAdmin(ref.storeId, tx);
    return { result, before: {}, after: result.success ? { pageId: result.data.id, slug: result.data.slug } : {} };
  });
}

export async function updatePage(
  storeId: string,
  pageId: string,
  input: { name?: { ar?: string; en?: string }; slug?: string; seo?: unknown; showInNav?: boolean },
  reason?: string,
) {
  return auditedEditor<null>(storeId, reason, "change_store_page", async (tx, { ref }) => {
    const id = String(pageId);
    const slugBefore = await storePageSlug(tx, ref.storeId, id);
    const result = toEditor(await updateStorePage(ref.sellerId, ref.storeId, id, input, tx));
    if (result.success) await markSiteEditedByAdmin(ref.storeId, tx);
    const slugAfter = result.success ? await storePageSlug(tx, ref.storeId, id) : null;
    return { result, before: { pageId: id, slug: slugBefore }, after: { pageId: id, slug: slugAfter } };
  });
}

export async function deletePage(storeId: string, pageId: string, reason?: string) {
  return auditedEditor<null>(storeId, reason, "change_store_page", async (tx, { ref }) => {
    const id = String(pageId);
    const slug = await storePageSlug(tx, ref.storeId, id);
    const result = toEditor(await deleteStorePage(ref.sellerId, ref.storeId, id, tx));
    if (result.success) await markSiteEditedByAdmin(ref.storeId, tx);
    return { result, before: { pageId: id, slug }, after: {} };
  });
}

// ---------------------------------------------------------------------------
// Templates (Add › Templates); applying writes drafts only
// ---------------------------------------------------------------------------

const EDITOR_MESSAGES = { ar: editorAr, en: editorEn };

/** A ready-made form a template needs, in the store's language (strings ship with @workspace/store-editor). */
function templateFormInput(kind: string, locale: "ar" | "en") {
  const template = getFormTemplate(kind);
  if (!template) return undefined;
  const t = createTranslator({ locale, messages: EDITOR_MESSAGES[locale], namespace: `storeForms.templates.${template.id}` as never });
  return buildTemplateForm(template, (key) => (t as (key: string) => string)(key));
}

const templateFail = <T>(error: string): TemplateActionResult<T> => ({ success: false, error: TEMPLATE_ERRORS[error] ?? (error as TemplateErrorKey) });

export async function applyTemplate(storeId: string, templateKey: string, reason?: string) {
  return auditedAction<{ pagesUpdated: number; pagesCreated: number }, TemplateActionResult<{ pagesUpdated: number; pagesCreated: number }>>(
    storeId,
    reason,
    "apply_store_template",
    async (tx, { actorId, ref }) => {
      const applied = await applyStoreTemplate(
        ref.sellerId,
        ref.storeId,
        String(templateKey),
        actorId,
        { allowedSections: ALLOWED, overrideKeys: OVERRIDE_KEYS, formInput: async (kind, locale) => templateFormInput(kind, locale) },
        tx,
      );
      if (!applied.success) return { result: templateFail(applied.error), before: {}, after: {} };
      await markSiteEditedByAdmin(ref.storeId, tx);
      return {
        result: { success: true, data: { pagesUpdated: applied.data.pagesUpdated, pagesCreated: applied.data.pagesCreated } },
        before: {},
        after: { templateKey: applied.data.templateKey, installId: applied.data.installId },
      };
    },
    (error) => ({ success: false, error: error === "invalidInput" ? "generic" : error }),
  );
}

export async function undoTemplate(storeId: string, reason?: string) {
  return auditedAction<{ templateKey: string }, TemplateActionResult<{ templateKey: string }>>(
    storeId,
    reason,
    "apply_store_template",
    async (tx, { ref }) => {
      const undone = await undoStoreTemplate(ref.sellerId, ref.storeId, tx);
      if (!undone.success) return { result: templateFail(undone.error), before: {}, after: {} };
      await markSiteEditedByAdmin(ref.storeId, tx);
      return { result: undone, before: { templateKey: undone.data.templateKey }, after: { undone: true } };
    },
    (error) => ({ success: false, error: error === "invalidInput" ? "generic" : error }),
  );
}

/** Read-only: the template's pages and look for the preview dialog. */
export async function templatePreview(storeId: string, templateKey: string): Promise<TemplateActionResult<TemplatePreviewView>> {
  return withAdminStore<TemplateActionResult<TemplatePreviewView>>(
    storeId,
    "template preview",
    async ({ ref }) => {
      const config = await getStoreTemplateConfig(ref.sellerId, ref.storeId, String(templateKey));
      if (!config) return { success: false, error: "templateNotFound" };
      return {
        success: true,
        data: {
          designSystem: config.designSystem,
          header: config.header,
          footer: config.footer,
          pages: config.pages.map((page) => ({ slug: page.slug, isHome: page.isHome, name: page.name, sections: page.content.sections, content: page.content })),
          demo: (await getTemplateMeta(String(templateKey)))?.demo ?? null,
        },
      };
    },
    (error) => ({ success: false, error }),
  );
}

// ---------------------------------------------------------------------------
// Forms (Forms tab): a ready-made form in the store's language
// ---------------------------------------------------------------------------

export async function createFormFromTemplate(storeId: string, templateId: unknown): Promise<FormsActionResult<{ id: string }>> {
  return withAdminStore<FormsActionResult<{ id: string }>>(
    storeId,
    "create form",
    async ({ actorId, ref }) => {
      if (!writeLimiter.check(`admin-editor:${actorId}`)) return { success: false, error: "rateLimited" };
      const meta = await storeSiteMeta(db, ref.storeId);
      const input = typeof templateId === "string" ? templateFormInput(templateId, meta?.defaultLocale ?? "ar") : undefined;
      if (!input) return { success: false, error: "invalidInput" };
      const result = await createStoreForm(ref.sellerId, ref.storeId, input);
      if (!result.success) return { success: false, error: FORM_ERRORS[result.error] ?? "generic" };
      return { success: true, data: result.data };
    },
    (error) => ({ success: false, error }),
  );
}
