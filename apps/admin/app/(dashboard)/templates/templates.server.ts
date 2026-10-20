"use server";

import { logServerError } from "@workspace/db/log";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  restoreTemplateVersionToDraft,
  setDefaultTemplateByAdmin,
  updateTemplateByAdmin,
  type TemplateStudioError,
  type TemplateStudioResult,
} from "@workspace/lib/admin/server";
import { adminActorId, saasError, type AdminActionResult } from "../_lib/saas-admin.server";
import { refreshTemplateCatalog } from "./template-cache";

/**
 * Template actions (docs/admin-saas.md §3.6, spec 2026-10-20-admin-website-builder
 * §5.4). admin / super_admin only (canManageUsers; the lib re-checks the actor
 * inside each transaction, so a moderator is refused there too). Every write
 * is audited with its reason and refreshes the template catalog cache after
 * it commits; a failed refresh is logged, never reported as a failed write.
 */

const STUDIO_MESSAGES: Record<TemplateStudioError, string> = {
  not_admin: "Only admins can change templates.",
  invalid_input: "Check the fields and try again.",
  invalid_reason: "Enter a reason of 3–500 characters.",
  not_found: "This template or version no longer exists.",
  invalid_config: "The template content is not valid.",
  version_conflict: "The template changed in the meantime. Reload and try again.",
  template_key_taken: "That key is already used by another template (keys of deleted templates stay taken).",
  default_template: "The default template cannot be deleted. Make another template the default first.",
  no_change: "Nothing changed.",
};

export type TemplateActionResult = { success: true; message: string; id?: string } | { success: false; error: string };

type Input = Record<string, unknown>;
const record = (input: unknown): Input => (input && typeof input === "object" && !Array.isArray(input) ? (input as Input) : {});

async function studio<T>(
  label: string,
  write: (actorId: string) => Promise<TemplateStudioResult<T>>,
  message: string,
  id?: (data: T) => string,
): Promise<TemplateActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return { success: false, error: STUDIO_MESSAGES.not_admin };
  let data: T;
  try {
    const result = await write(actorId);
    if (!result.success) return { success: false, error: STUDIO_MESSAGES[result.error] ?? "Something went wrong. Try again." };
    data = result.data;
  } catch (error) {
    logServerError("admin", `template ${label} failed`, {}, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
  await refreshTemplateCatalog(label);
  return { success: true, message, ...(id && { id: id(data) }) };
}

/** A new inactive template: one empty home page and Classic's design system. Opens in the editor. */
export async function createTemplateAction(input: unknown): Promise<TemplateActionResult> {
  const { reason, ...fields } = record(input);
  return studio("create", (actorId) => createTemplate(actorId, fields, reason), "Template created (inactive) and logged", (data) => data.id);
}

/** A copy of a template's current version and meta under a new key; inactive. */
export async function duplicateTemplateAction(input: unknown): Promise<TemplateActionResult> {
  const { id, key, reason } = record(input);
  return studio("duplicate", (actorId) => duplicateTemplate(actorId, String(id), key, reason), "Template duplicated (inactive) and logged", (data) => data.id);
}

/** Soft delete; the default template is refused. */
export async function deleteTemplateAction(input: unknown): Promise<AdminActionResult> {
  const { id, reason } = record(input);
  const result = await studio("delete", (actorId) => deleteTemplate(actorId, String(id), reason), "Template deleted and logged");
  return result.success ? { success: true, message: result.message } : result;
}

/** Loads a published version into the template's draft (replacing any draft). Publish it from the editor. */
export async function restoreTemplateVersionToDraftAction(input: unknown): Promise<AdminActionResult> {
  const { id, versionId, reason } = record(input);
  const result = await studio(
    "restore",
    (actorId) => restoreTemplateVersionToDraft(actorId, String(id), String(versionId), reason),
    "Version restored to the draft and logged. Open the editor to review and publish it.",
  );
  return result.success ? { success: true, message: result.message } : result;
}

/** Active, premium, price and order of one template (docs/admin-saas.md §3.6). Audited. */
export async function updateTemplateAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await updateTemplateByAdmin(actorId, input);
    if (!result.success) return saasError(result.error);
  } catch (error) {
    logServerError("admin", "template update failed", {}, error);
    return saasError("generic");
  }
  await refreshTemplateCatalog("update");
  return { success: true, message: "Template updated and logged" };
}

/** Makes one template the default for new stores. Audited. */
export async function setDefaultTemplateAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await setDefaultTemplateByAdmin(actorId, input);
    if (!result.success) return saasError(result.error);
  } catch (error) {
    logServerError("admin", "template default change failed", {}, error);
    return saasError("generic");
  }
  await refreshTemplateCatalog("default change");
  return { success: true, message: "Default template changed and logged" };
}
