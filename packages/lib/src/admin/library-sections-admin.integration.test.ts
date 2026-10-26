// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
import { describe, it } from "vitest";

describe.skip("disabled: templates and sections are code-only (0109)", () => {
  it("is disabled", () => {});
});

// import { randomUUID } from "node:crypto";
// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import { and, eq, inArray } from "drizzle-orm";
// import { afterAll, beforeAll, describe, expect, it } from "vitest";
// import * as DB_SCHEMA from "@workspace/db/schema";
// import { listPublishedLibrarySections } from "../library-sections/server";
// import {
//   createLibrarySection,
//   deleteLibrarySection,
//   duplicateLibrarySection,
//   getLibrarySectionForEditor,
//   listLibrarySectionsForAdmin,
//   publishLibrarySection,
//   saveLibrarySectionDraft,
//   setLibrarySectionHidden,
//   updateLibrarySectionMeta,
// } from "./library-sections-admin.server";
//
// /**
//  * Admin section library (Task 11) against the staging copy. Every case runs
//  * in a transaction that is rolled back; only the two test users are real
//  * rows (removed afterwards). Skipped without TEST_DATABASE_URL.
//  */
// const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
// const ROLLBACK = new Error("rollback");
// const NAME = { ar: "قسم تجربة", en: "Test section" };
// const REASON = "integration test";
//
// describe.skipIf(!TEST_DATABASE_URL)("library sections admin (integration)", { timeout: 60_000 }, () => {
//   const client = postgres(TEST_DATABASE_URL ?? "postgres://unused", { prepare: false, max: 2 });
//   const db = drizzle(client, { schema: DB_SCHEMA });
//   const s = DB_SCHEMA;
//   const adminId = randomUUID();
//   const moderatorId = randomUUID();
//   type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
//
//   const inRollback = (run: (tx: Tx) => Promise<void>) =>
//     expect(
//       db.transaction(async (tx) => {
//         await run(tx);
//         throw ROLLBACK;
//       }),
//     ).rejects.toBe(ROLLBACK);
//
//   const create = async (tx: Tx, key: string) => {
//     const result = await createLibrarySection(adminId, { key, category: "hero", subcategory: "split", name: NAME, description: { ar: "", en: "" } }, REASON, tx as never);
//     if (!result.success) throw new Error(result.error);
//     return result.data;
//   };
//
//   const auditRows = (tx: Tx, key: string) =>
//     tx
//       .select()
//       .from(s.adminAuditLog)
//       .where(and(eq(s.adminAuditLog.targetType, "library_section"), eq(s.adminAuditLog.targetId, key)));
//
//   beforeAll(async () => {
//     await db.insert(s.users).values([
//       { id: adminId, isGuest: false, role: "admin", isVerified: true, fullName: "QA Admin" },
//       { id: moderatorId, isGuest: false, role: "moderator", isVerified: true, fullName: "QA Moderator" },
//     ]);
//   });
//
//   afterAll(async () => {
//     await db.delete(s.users).where(inArray(s.users.id, [adminId, moderatorId]));
//     await client.end();
//   });
//
//   it("refuses a moderator on every write", async () => {
//     await inRollback(async (tx) => {
//       const { id } = await create(tx, "zz-t11-mod");
//       const q = tx as never;
//       const tree = { type: "section", props: {}, children: [] };
//       expect(await createLibrarySection(moderatorId, { key: "zz-t11-mod2", category: "hero", subcategory: "", name: NAME, description: NAME }, REASON, q)).toEqual({ success: false, error: "not_admin" });
//       expect(await duplicateLibrarySection(moderatorId, id, "zz-t11-mod3", REASON, q)).toEqual({ success: false, error: "not_admin" });
//       expect(await saveLibrarySectionDraft(moderatorId, id, tree, 1, q)).toEqual({ success: false, error: "not_admin" });
//       expect(await publishLibrarySection(moderatorId, id, REASON, q)).toEqual({ success: false, error: "not_admin" });
//       expect(await setLibrarySectionHidden(moderatorId, id, true, REASON, q)).toEqual({ success: false, error: "not_admin" });
//       expect(await deleteLibrarySection(moderatorId, id, REASON, q)).toEqual({ success: false, error: "not_admin" });
//       expect(
//         await updateLibrarySectionMeta(moderatorId, id, { category: "hero", subcategory: "", name: NAME, description: NAME }, REASON, q),
//       ).toEqual({ success: false, error: "not_admin" });
//     });
//   });
//
//   it("rejects a stale clientVersion with version_conflict", async () => {
//     await inRollback(async (tx) => {
//       const { id } = await create(tx, "zz-t11-conflict");
//       const tree = { type: "section", props: {}, children: [{ type: "heading", props: { text: "Hi" }, children: [] }] };
//       const first = await saveLibrarySectionDraft(adminId, id, tree, 1, tx as never);
//       expect(first).toEqual({ success: true, data: { draftVersion: 2 } });
//       expect(await saveLibrarySectionDraft(adminId, id, tree, 1, tx as never)).toEqual({ success: false, error: "version_conflict" });
//       expect(await saveLibrarySectionDraft(adminId, id, { type: "div", props: {}, children: [] }, 2, tx as never)).toEqual({ success: false, error: "invalid_tree" });
//     });
//   });
//
//   it("publishes the draft, bumps the version and the seller listing shows it", async () => {
//     await inRollback(async (tx) => {
//       const { id } = await create(tx, "zz-t11-publish");
//       // A new section is not in the seller palette before its first publish.
//       expect((await listPublishedLibrarySections(tx as never)).map((r) => r.key)).not.toContain("zz-t11-publish");
//       const tree = { type: "section", props: {}, children: [{ type: "image", props: { src: "stock:photo:1", alt: "" }, children: [] }] };
//       expect((await saveLibrarySectionDraft(adminId, id, tree, 1, tx as never)).success).toBe(true);
//       expect(await publishLibrarySection(adminId, id, REASON, tx as never)).toEqual({ success: true, data: { version: 1 } });
//       const [row] = await tx.select().from(s.librarySections).where(eq(s.librarySections.id, id));
//       expect(row!.draftTree).toBeNull();
//       expect(row!.version).toBe(1);
//       const listed = (await listPublishedLibrarySections(tx as never)).find((r) => r.key === "zz-t11-publish");
//       expect(listed?.version).toBe(1);
//       expect(JSON.stringify(listed?.tree)).toContain("stock:photo:1");
//       // Nothing to publish now.
//       expect(await publishLibrarySection(adminId, id, REASON, tx as never)).toEqual({ success: false, error: "no_change" });
//       expect((await getLibrarySectionForEditor(id, tx as never))?.hasDraft).toBe(false);
//     });
//   });
//
//   it("leaves a hidden section out of the seller listing (admin sees it with includeHidden)", async () => {
//     await inRollback(async (tx) => {
//       const { id } = await create(tx, "zz-t11-hidden");
//       await publishLibrarySection(adminId, id, REASON, tx as never);
//       expect(await setLibrarySectionHidden(adminId, id, true, REASON, tx as never)).toEqual({ success: true, data: null });
//       expect((await listPublishedLibrarySections(tx as never)).map((r) => r.key)).not.toContain("zz-t11-hidden");
//       expect((await listLibrarySectionsForAdmin({ includeHidden: false }, tx as never)).map((r) => r.key)).not.toContain("zz-t11-hidden");
//       expect((await listLibrarySectionsForAdmin({ includeHidden: true, query: "t11-hid" }, tx as never)).map((r) => r.key)).toEqual(["zz-t11-hidden"]);
//     });
//   });
//
//   it("leaves a deleted section out of both lists", async () => {
//     await inRollback(async (tx) => {
//       const { id } = await create(tx, "zz-t11-deleted");
//       await publishLibrarySection(adminId, id, REASON, tx as never);
//       expect(await deleteLibrarySection(adminId, id, REASON, tx as never)).toEqual({ success: true, data: null });
//       expect((await listPublishedLibrarySections(tx as never)).map((r) => r.key)).not.toContain("zz-t11-deleted");
//       expect((await listLibrarySectionsForAdmin({ includeHidden: true }, tx as never)).map((r) => r.key)).not.toContain("zz-t11-deleted");
//       expect(await getLibrarySectionForEditor(id, tx as never)).toBeNull();
//     });
//   });
//
//   it("writes one audit row per audited action (platform row, seller_id null)", async () => {
//     await inRollback(async (tx) => {
//       const { id } = await create(tx, "zz-t11-audit");
//       expect(await createLibrarySection(adminId, { key: "zz-t11-audit", category: "hero", subcategory: "", name: NAME, description: NAME }, REASON, tx as never)).toEqual({
//         success: false,
//         error: "key_taken",
//       });
//       await saveLibrarySectionDraft(adminId, id, { type: "section", props: {}, children: [] }, 1, tx as never);
//       await publishLibrarySection(adminId, id, REASON, tx as never);
//       await updateLibrarySectionMeta(adminId, id, { category: "hero", subcategory: "split", name: { ar: "جديد", en: "New" }, description: NAME }, REASON, tx as never);
//       await setLibrarySectionHidden(adminId, id, true, REASON, tx as never);
//       const copy = await duplicateLibrarySection(adminId, id, "zz-t11-audit-copy", REASON, tx as never);
//       expect(copy.success).toBe(true);
//       await deleteLibrarySection(adminId, id, REASON, tx as never);
//
//       const rows = await auditRows(tx, "zz-t11-audit");
//       expect(rows.map((r) => r.action).sort()).toEqual(
//         ["create_library_section", "delete_library_section", "hide_library_section", "publish_library_section", "update_library_section"].sort(),
//       );
//       for (const row of rows) {
//         expect(row.sellerId).toBeNull();
//         expect(row.actorId).toBe(adminId);
//         expect(row.reason).toBe(REASON);
//       }
//       const [dup] = await auditRows(tx, "zz-t11-audit-copy");
//       expect(dup!.action).toBe("create_library_section");
//       expect((dup!.after as { duplicatedFrom?: string }).duplicatedFrom).toBe("zz-t11-audit");
//     });
//   });
// });
//
