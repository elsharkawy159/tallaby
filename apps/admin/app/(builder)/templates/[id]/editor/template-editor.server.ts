"use server";

import { logServerError } from "@workspace/db/log";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "@workspace/lib/admin";
import {
  getTemplateForStudio,
  listTemplateVersionsForStudio,
  publishTemplateVersion,
  restoreTemplateVersionToDraft,
  saveTemplateDraft,
  type TemplateStudioError,
} from "@workspace/lib/admin/server";
import type { EditorErrorKey, EditorResult, StoreRevisionRow } from "@workspace/store-editor/editor.dto";
import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
import { refreshTemplateCatalog } from "@/app/(dashboard)/templates/template-cache";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * The admin template editor's actions (spec §5.4, Task 15). The signed-in
 * admin must hold canManageUsers (admin / super_admin, never a moderator);
 * the lib re-checks the actor in the database inside each transaction.
 * Autosaves write `templates.draft_config` (optimistic on `draft_version`,
 * not audited). Publish and restore are audited with the session's reason
 * and then refresh the template catalog cache.
 */

const saveLimiter = createRateLimiter({ limit: 240, windowMs: 10 * 60_000 });
const publishLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

const ERRORS: Record<TemplateStudioError, EditorErrorKey> = {
  not_admin: "notFound",
  not_found: "notFound",
  version_conflict: "versionConflict",
  invalid_config: "invalidContent",
  invalid_input: "invalidInput",
  invalid_reason: "invalidInput",
  no_change: "nothingToPublish",
  template_key_taken: "invalidInput",
  default_template: "invalidInput",
};

const fail = <T,>(error: TemplateStudioError | EditorErrorKey): EditorResult<T> => ({
  success: false,
  error: ERRORS[error as TemplateStudioError] ?? (error as EditorErrorKey),
});

const reasonOk = (reason: unknown): reason is string =>
  typeof reason === "string" && reason.trim().length >= ADMIN_REASON_MIN && reason.trim().length <= ADMIN_REASON_MAX;

/** Autosave: the whole working SiteConfig (pages, design system, header, footer). */
export async function saveTemplateDraftAction(id: string, config: unknown, clientVersion: number): Promise<EditorResult<{ draftVersion: number }>> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return fail("notFound");
  if (!saveLimiter.check(`template-editor:${actorId}`)) return fail("rateLimited");
  try {
    const result = await saveTemplateDraft(actorId, String(id), config, Number(clientVersion));
    return result.success ? result : fail(result.error);
  } catch (error) {
    logServerError("admin", "template editor save failed", { templateId: String(id) }, error);
    return fail("generic");
  }
}

/** Publish: the draft becomes the next version. Audited with `reason`; `changelog` is optional. */
export async function publishTemplateAction(
  id: string,
  changelog: string | null,
  reason: string,
): Promise<EditorResult<{ revisionId: string; revisionNumber: number }>> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return fail("notFound");
  if (!reasonOk(reason)) return fail("invalidInput");
  if (!publishLimiter.check(`template-editor:${actorId}`)) return fail("rateLimited");
  const note = typeof changelog === "string" && changelog.trim() ? changelog.trim() : null;
  let published: { version: number; versionId: string };
  try {
    const result = await publishTemplateVersion(actorId, String(id), note, reason.trim());
    if (!result.success) return fail(result.error);
    published = result.data;
  } catch (error) {
    logServerError("admin", "template editor publish failed", { templateId: String(id) }, error);
    return fail("generic");
  }
  await refreshTemplateCatalog("publish", { templateId: String(id) });
  return { success: true, data: { revisionId: published.versionId, revisionNumber: published.version } };
}

/** The template's published versions, newest first, as editor revisions. */
export async function listTemplateVersionsAction(id: string): Promise<EditorResult<StoreRevisionRow[]>> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return fail("notFound");
  try {
    const [versions, template] = await Promise.all([listTemplateVersionsForStudio(String(id)), getTemplateForStudio(String(id))]);
    return {
      success: true,
      data: versions.map((row) => ({
        id: row.id,
        revisionNumber: row.version,
        createdAt: new Date(row.publishedAt).toISOString(),
        publishedBy: null,
        isLive: row.version === template?.version,
      })),
    };
  } catch (error) {
    logServerError("admin", "template versions failed to load", { templateId: String(id) }, error);
    return fail("generic");
  }
}

/** Loads a published version into the draft (replacing it). Audited with `reason`. */
export async function restoreTemplateVersionAction(id: string, versionId: string, reason: string): Promise<EditorResult<{ pages: number }>> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return fail("notFound");
  if (!reasonOk(reason)) return fail("invalidInput");
  if (!publishLimiter.check(`template-editor:${actorId}`)) return fail("rateLimited");
  try {
    const result = await restoreTemplateVersionToDraft(actorId, String(id), String(versionId), reason.trim());
    if (!result.success) return fail(result.error);
  } catch (error) {
    logServerError("admin", "template version restore failed", { templateId: String(id) }, error);
    return fail("generic");
  }
  await refreshTemplateCatalog("restore", { templateId: String(id) });
  const template = await getTemplateForStudio(String(id)).catch(() => null);
  return { success: true, data: { pages: template?.config?.pages.length ?? 0 } };
}
