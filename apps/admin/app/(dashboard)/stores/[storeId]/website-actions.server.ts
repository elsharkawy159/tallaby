"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "@workspace/lib/admin";
import { getStoreForAdmin } from "@workspace/lib/admin/server";
import type { EditorErrorKey, EditorResult } from "@workspace/store-editor/editor.dto";
import type { TemplateActionResult, TemplateErrorKey } from "@workspace/store-editor/templates.dto";
import {
  applyTemplate,
  discardDraft,
  publish,
  restoreRevision,
  undoTemplate,
  unpublish,
} from "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server";
import type { AdminActionResult } from "../../_lib/saas-admin.server";

/**
 * The store page's Website section actions (spec §5.2): apply or undo a
 * theme, restore a published revision into the drafts, discard the drafts,
 * unpublish. Thin wrappers for the store page's dialogs around the admin
 * website editor's audited actions, which do the checks themselves (admin /
 * super_admin only, the store and its seller resolved from the database,
 * reason required, one audit row in the same transaction).
 */

const MESSAGES: Partial<Record<EditorErrorKey, string>> = {
  notFound: "Only admins can do this, or the store no longer exists.",
  readOnly: "This store is not active, so its website cannot be changed.",
  notPublished: "The website has never been published.",
  invalidInput: "Enter a reason of 3–500 characters.",
  rateLimited: "Too many changes in a short time. Try again in a few minutes.",
  publishBlocked: "The seller account is not approved, so the website cannot be published.",
  nothingToPublish: "There is nothing new to publish.",
};

const TEMPLATE_MESSAGES: Partial<Record<TemplateErrorKey, string>> = {
  notFound: MESSAGES.notFound,
  readOnly: MESSAGES.readOnly,
  templateNotFound: "That theme is no longer offered. Reload the page and pick another.",
  premiumTemplate: "Premium themes cannot be applied yet.",
  invalidTemplate: "That theme is broken and cannot be applied.",
  tooManyPages: "The theme would take the store over its page limit. Delete a few pages first.",
  nothingToUndo: "There is no theme change to undo.",
  rateLimited: MESSAGES.rateLimited,
};

type Input = { storeId?: unknown; revisionId?: unknown; templateKey?: unknown; publishNow?: unknown; reason?: unknown };
const record = (input: unknown): Input => (input && typeof input === "object" && !Array.isArray(input) ? (input as Input) : {});
const text = (value: unknown) => (typeof value === "string" ? value : "");
const validReason = (reason: string) => reason.trim().length >= ADMIN_REASON_MIN && reason.trim().length <= ADMIN_REASON_MAX;

function toResult(result: EditorResult<unknown>, message: string): AdminActionResult {
  return result.success ? { success: true, message } : { success: false, error: MESSAGES[result.error] ?? "Something went wrong. Try again." };
}

function templateError(result: TemplateActionResult<unknown> & { success: false }): AdminActionResult {
  return { success: false, error: TEMPLATE_MESSAGES[result.error] ?? "Something went wrong. Try again." };
}

export async function restoreSiteRevisionAction(input: unknown): Promise<AdminActionResult> {
  const { storeId, revisionId, reason } = record(input);
  return toResult(await restoreRevision(text(storeId), text(revisionId), text(reason)), "Revision restored to the drafts and logged");
}

export async function discardSiteDraftAction(input: unknown): Promise<AdminActionResult> {
  const { storeId, reason } = record(input);
  return toResult(await discardDraft(text(storeId), text(reason)), "Drafts discarded and logged");
}

export async function unpublishSiteAction(input: unknown): Promise<AdminActionResult> {
  const { storeId, reason } = record(input);
  return toResult(await unpublish(text(storeId), text(reason)), "Website unpublished and logged");
}

/**
 * Applies a theme (template) to the store's drafts, like the seller's
 * Website › Templates. With `publishNow` the drafts are then published, but
 * only when the site is already live: a store that was never published, or
 * that was taken offline, stays offline.
 */
export async function applyStoreThemeAction(input: unknown): Promise<AdminActionResult> {
  const { storeId, templateKey, publishNow, reason } = record(input);
  const id = text(storeId);
  const why = text(reason);
  if (!validReason(why)) return { success: false, error: MESSAGES.invalidInput! };
  const applied = await applyTemplate(id, text(templateKey), why);
  if (!applied.success) return templateError(applied);
  revalidatePath(`/stores/${id}`);
  if (publishNow !== true) return { success: true, message: "Theme applied to the drafts and logged" };
  const store = await getStoreForAdmin(id);
  if (store?.siteStatus !== "published") {
    return { success: true, message: "Theme applied to the drafts and logged. The website is offline, so it was not published." };
  }
  const published = await publish(id, why);
  if (!published.success) {
    return { success: false, error: `Theme applied to the drafts, but publishing failed. ${MESSAGES[published.error] ?? "Publish it from the editor."}` };
  }
  return { success: true, message: "Theme applied, published and logged" };
}

/** Puts back the drafts the last theme change replaced. */
export async function undoStoreThemeAction(input: unknown): Promise<AdminActionResult> {
  const { storeId, reason } = record(input);
  const id = text(storeId);
  const why = text(reason);
  if (!validReason(why)) return { success: false, error: MESSAGES.invalidInput! };
  const undone = await undoTemplate(id, why);
  if (!undone.success) return templateError(undone);
  revalidatePath(`/stores/${id}`);
  return { success: true, message: "Theme change undone and logged" };
}
