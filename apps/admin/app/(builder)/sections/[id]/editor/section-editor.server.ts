// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use server";
//
// import { logServerError } from "@workspace/db/log";
// import { publishLibrarySection, saveLibrarySectionDraft, type LibrarySectionAdminError } from "@workspace/lib/admin/server";
// import type { EditorErrorKey, EditorResult } from "@workspace/store-editor/editor.dto";
// import { adminActorId } from "@/app/(dashboard)/_lib/saas-admin.server";
// import { refreshLibrarySections } from "@/app/(dashboard)/sections/section-cache";
// import { createRateLimiter } from "@/lib/rate-limit.lib";
//
// /**
//  * The admin section editor's actions (spec §5.3, Task 11). The signed-in
//  * admin must hold canManageUsers (admin / super_admin, never a moderator);
//  * the lib functions re-check the actor in the database inside their
//  * transaction. Saves write `draft_tree` only (not audited); Publish is
//  * audited with the session's reason and refreshes the seller palette cache.
//  */
//
// const saveLimiter = createRateLimiter({ limit: 240, windowMs: 10 * 60_000 });
// const publishLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });
//
// const ERRORS: Partial<Record<LibrarySectionAdminError, EditorErrorKey>> = {
//   not_admin: "notFound",
//   not_found: "notFound",
//   version_conflict: "versionConflict",
//   invalid_tree: "invalidContent",
//   invalid_input: "invalidInput",
//   invalid_reason: "invalidInput",
//   no_change: "nothingToPublish",
// };
//
// const fail = <T,>(error: LibrarySectionAdminError | EditorErrorKey): EditorResult<T> => ({
//   success: false,
//   error: ERRORS[error as LibrarySectionAdminError] ?? (error as EditorErrorKey),
// });
//
// /** Autosave: the edited `section` root (ids stripped by the adapter). */
// export async function saveSectionDraft(id: string, tree: unknown, clientVersion: number): Promise<EditorResult<{ draftVersion: number }>> {
//   const actorId = await adminActorId("canManageUsers");
//   if (!actorId) return fail("notFound");
//   if (!saveLimiter.check(`section-editor:${actorId}`)) return fail("rateLimited");
//   try {
//     const result = await saveLibrarySectionDraft(actorId, String(id), tree, Number(clientVersion));
//     return result.success ? result : fail(result.error);
//   } catch (error) {
//     logServerError("admin", "section editor save failed", { sectionId: String(id) }, error);
//     return fail("generic");
//   }
// }
//
// /** Publish: the draft becomes the published tree (version + 1). Audited with `reason`. */
// export async function publishSection(id: string, reason: string): Promise<EditorResult<{ revisionId: string; revisionNumber: number }>> {
//   const actorId = await adminActorId("canManageUsers");
//   if (!actorId) return fail("notFound");
//   if (!publishLimiter.check(`section-editor:${actorId}`)) return fail("rateLimited");
//   let result: Awaited<ReturnType<typeof publishLibrarySection>>;
//   try {
//     result = await publishLibrarySection(actorId, String(id), reason);
//   } catch (error) {
//     logServerError("admin", "section editor publish failed", { sectionId: String(id) }, error);
//     return fail("generic");
//   }
//   if (!result.success) return fail(result.error);
//   // Committed: a failing refresh is logged inside, never a failed publish (a retry would publish again).
//   await refreshLibrarySections("section publish", { sectionId: String(id) });
//   return { success: true, data: { revisionId: String(id), revisionNumber: result.data.version } };
// }
//
