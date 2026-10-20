"use server";

import { logServerError } from "@workspace/db/log";
import {
  createLibrarySection,
  deleteLibrarySection,
  duplicateLibrarySection,
  setLibrarySectionHidden,
  updateLibrarySectionMeta,
  type LibraryAdminResult,
  type LibrarySectionAdminError,
} from "@workspace/lib/admin/server";
import { adminActorId, type AdminActionResult } from "../_lib/saas-admin.server";
import { refreshLibrarySections } from "./section-cache";

/**
 * Section library actions (spec §5.3, Task 11). admin / super_admin only
 * (canManageUsers; the lib re-checks the actor inside each transaction).
 * Every write is audited with the reason and refreshes the seller palette
 * cache (`library:sections`) after it commits.
 */

const MESSAGES: Record<LibrarySectionAdminError, string> = {
  not_admin: "Only admins can change the section library.",
  invalid_input: "Check the fields and try again.",
  invalid_reason: "Enter a reason of 3–500 characters.",
  key_taken: "That key is already used by another section (keys of deleted sections stay taken).",
  not_found: "This section no longer exists.",
  version_conflict: "The section changed in the meantime. Reload and try again.",
  invalid_tree: "The section content is not valid.",
  no_change: "Nothing changed.",
};

export type SectionActionResult = { success: true; message: string; id?: string } | { success: false; error: string };

type Input = Record<string, unknown>;
const record = (input: unknown): Input => (input && typeof input === "object" && !Array.isArray(input) ? (input as Input) : {});

async function run<T>(
  label: string,
  write: (actorId: string) => Promise<LibraryAdminResult<T>>,
  message: string,
  id?: (data: T) => string,
): Promise<SectionActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return { success: false, error: MESSAGES.not_admin };
  let result: LibraryAdminResult<T>;
  try {
    result = await write(actorId);
  } catch (error) {
    logServerError("admin", `library section ${label} failed`, {}, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
  if (!result.success) return { success: false, error: MESSAGES[result.error] ?? "Something went wrong. Try again." };
  // Committed: a failing refresh is logged inside and never reported as a failed write.
  await refreshLibrarySections(`section ${label}`);
  return { success: true, message, ...(id && { id: id(result.data) }) };
}

/** A blank section (unpublished until its first Publish). */
export async function createSectionAction(input: unknown): Promise<SectionActionResult> {
  const { reason, ...fields } = record(input);
  return run("create", (actorId) => createLibrarySection(actorId, fields, reason), "Section created and logged", (data) => data.id);
}

export async function duplicateSectionAction(input: unknown): Promise<SectionActionResult> {
  const { id, key, reason } = record(input);
  return run("duplicate", (actorId) => duplicateLibrarySection(actorId, String(id), key, reason), "Section duplicated and logged", (data) => data.id);
}

export async function updateSectionMetaAction(input: unknown): Promise<SectionActionResult> {
  const { id, reason, ...fields } = record(input);
  return run("update", (actorId) => updateLibrarySectionMeta(actorId, String(id), fields, reason), "Section details saved and logged");
}

export async function setSectionHiddenAction(input: unknown): Promise<AdminActionResult> {
  const { id, hidden, reason } = record(input);
  const result = await run(
    "hide",
    (actorId) => setLibrarySectionHidden(actorId, String(id), hidden === true, reason),
    hidden === true ? "Section hidden from sellers and logged" : "Section shown to sellers and logged",
  );
  return result.success ? { success: true, message: result.message } : result;
}

export async function deleteSectionAction(input: unknown): Promise<AdminActionResult> {
  const { id, reason } = record(input);
  const result = await run("delete", (actorId) => deleteLibrarySection(actorId, String(id), reason), "Section deleted and logged");
  return result.success ? { success: true, message: result.message } : result;
}
