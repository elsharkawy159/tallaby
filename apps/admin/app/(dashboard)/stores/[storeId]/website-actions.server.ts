"use server";

import type { EditorErrorKey, EditorResult } from "@workspace/store-editor/editor.dto";
import { discardDraft, restoreRevision, unpublish } from "@/app/(builder)/stores/[storeId]/editor/admin-store-editor.server";
import type { AdminActionResult } from "../../_lib/saas-admin.server";

/**
 * The store detail "Website" tab's site actions (spec §5.2): restore a
 * published revision into the drafts, discard the drafts, unpublish. Thin
 * wrappers for ReasonActionButton around the admin website editor's audited
 * actions, which do the checks themselves (admin / super_admin only, the
 * store and its seller resolved from the database, reason required, one
 * audit row in the same transaction).
 */

const MESSAGES: Partial<Record<EditorErrorKey, string>> = {
  notFound: "Only admins can do this, or the store no longer exists.",
  readOnly: "This store is not active, so its website cannot be changed.",
  notPublished: "The website has never been published.",
  invalidInput: "Enter a reason of 3–500 characters.",
  rateLimited: "Too many changes in a short time. Try again in a few minutes.",
};

type Input = { storeId?: unknown; revisionId?: unknown; reason?: unknown };
const record = (input: unknown): Input => (input && typeof input === "object" && !Array.isArray(input) ? (input as Input) : {});
const text = (value: unknown) => (typeof value === "string" ? value : "");

function toResult(result: EditorResult<unknown>, message: string): AdminActionResult {
  return result.success ? { success: true, message } : { success: false, error: MESSAGES[result.error] ?? "Something went wrong. Try again." };
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
