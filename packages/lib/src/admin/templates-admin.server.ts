// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// /**
//  * Admin template gallery (docs/admin-saas.md §3.6). Metadata only (D-A5):
//  * active, premium, price, order and the default. Template content stays in
//  * migrations. Deactivating a template never changes stores already on it.
//  * Changes are audited as platform rows (seller_id NULL), which needs 0069.
//  */
// import { db, desc, eq, isNull, sql, stores, templateInstalls, templates, templateVersions } from "@workspace/db";
// import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
// import { templateDefaultSchema, templateUpdateSchema } from "./saas.lib";
//
// /** Every template with its current version, install count and the stores using it now. */
// export async function listTemplatesForAdmin(q: Queryable = db) {
//   return q
//     .select({
//       id: templates.id,
//       key: templates.key,
//       name: templates.name,
//       category: templates.category,
//       thumbnailUrl: templates.thumbnailUrl,
//       previewUrl: templates.previewUrl,
//       isDefault: templates.isDefault,
//       isActive: templates.isActive,
//       isPremium: templates.isPremium,
//       price: templates.price,
//       sortOrder: templates.sortOrder,
//       updatedAt: templates.updatedAt,
//       hasDraft: sql<boolean>`${templates.draftConfig} IS NOT NULL`,
//       currentVersion: sql<number | null>`(SELECT ${templateVersions.version} FROM ${templateVersions} WHERE ${templateVersions.id} = ${templates.currentVersionId})`,
//       versions: sql<number>`(SELECT count(*)::int FROM ${templateVersions} WHERE ${templateVersions.templateId} = ${templates.id})`,
//       installs: sql<number>`(SELECT count(*)::int FROM ${templateInstalls} WHERE ${templateInstalls.templateId} = ${templates.id} AND ${templateInstalls.undoneAt} IS NULL)`,
//       storesUsing: sql<number>`(SELECT count(*)::int FROM ${stores} WHERE ${stores.templateKey} = ${templates.key} AND ${stores.deletedAt} IS NULL)`,
//     })
//     .from(templates)
//     .where(isNull(templates.deletedAt))
//     .orderBy(templates.sortOrder, templates.key);
// }
//
// export type AdminTemplateRow = Awaited<ReturnType<typeof listTemplatesForAdmin>>[number];
//
// export async function listTemplateVersionsForAdmin(templateId: string, q: Queryable = db) {
//   return q
//     .select({
//       id: templateVersions.id,
//       version: templateVersions.version,
//       schemaVersion: templateVersions.schemaVersion,
//       changelog: templateVersions.changelog,
//       publishedAt: templateVersions.publishedAt,
//     })
//     .from(templateVersions)
//     .where(eq(templateVersions.templateId, templateId))
//     .orderBy(desc(templateVersions.version));
// }
//
// export type TemplateAdminError = "not_admin" | "invalid_input" | "not_found" | "no_change" | "default_inactive" | "default_template" | "migration_required";
//
// function isMissingAuditColumns(error: unknown): boolean {
//   const code = (error as { code?: string })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
//   // undefined_column (target_type) or not_null_violation (seller_id) before 0069.
//   return code === "42703" || code === "23502";
// }
//
// export async function updateTemplateByAdmin(
//   actorId: string,
//   input: unknown,
//   q: Queryable = db,
// ): Promise<{ success: true } | { success: false; error: TemplateAdminError }> {
//   const parsed = templateUpdateSchema.safeParse(input);
//   if (!parsed.success) return { success: false, error: "invalid_input" };
//   const { templateId, isActive, isPremium, price, sortOrder, reason } = parsed.data;
//   try {
//     const outcome = await q.transaction(async (tx): Promise<TemplateAdminError | null> => {
//       await assertAdminActor(tx, actorId);
//       const [row] = await tx
//         .select({ id: templates.id, key: templates.key, isActive: templates.isActive, isPremium: templates.isPremium, price: templates.price, sortOrder: templates.sortOrder, isDefault: templates.isDefault, deletedAt: templates.deletedAt })
//         .from(templates)
//         .where(eq(templates.id, templateId))
//         .for("update");
//       if (!row || row.deletedAt) return "not_found";
//       if (row.isDefault && !isActive) return "default_template";
//       const before = { isActive: row.isActive, isPremium: row.isPremium, price: row.price, sortOrder: row.sortOrder };
//       const after = { isActive, isPremium, price, sortOrder };
//       if (JSON.stringify(before) === JSON.stringify(after)) return "no_change";
//       await tx.update(templates).set({ ...after, updatedAt: sql`now()` }).where(eq(templates.id, row.id));
//       await writeAdminAudit(tx, {
//         actorId,
//         sellerId: null,
//         targetType: "template",
//         targetId: row.key,
//         action: "update_template",
//         before,
//         after,
//         reason,
//       });
//       return null;
//     });
//     return outcome ? { success: false, error: outcome } : { success: true };
//   } catch (error) {
//     if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
//     if (isMissingAuditColumns(error)) return { success: false, error: "migration_required" };
//     throw error;
//   }
// }
//
// /** Moves the single default flag (partial unique index templates_one_default) in one transaction. */
// export async function setDefaultTemplateByAdmin(
//   actorId: string,
//   input: unknown,
//   q: Queryable = db,
// ): Promise<{ success: true } | { success: false; error: TemplateAdminError }> {
//   const parsed = templateDefaultSchema.safeParse(input);
//   if (!parsed.success) return { success: false, error: "invalid_input" };
//   const { templateId, reason } = parsed.data;
//   try {
//     const outcome = await q.transaction(async (tx): Promise<TemplateAdminError | null> => {
//       await assertAdminActor(tx, actorId);
//       const [row] = await tx
//         .select({ id: templates.id, key: templates.key, isActive: templates.isActive, isDefault: templates.isDefault, deletedAt: templates.deletedAt })
//         .from(templates)
//         .where(eq(templates.id, templateId))
//         .for("update");
//       if (!row || row.deletedAt) return "not_found";
//       if (row.isDefault) return "no_change";
//       if (!row.isActive) return "default_inactive";
//       const [previous] = await tx
//         .select({ key: templates.key })
//         .from(templates)
//         .where(eq(templates.isDefault, true))
//         .for("update");
//       await tx.update(templates).set({ isDefault: false, updatedAt: sql`now()` }).where(eq(templates.isDefault, true));
//       await tx.update(templates).set({ isDefault: true, updatedAt: sql`now()` }).where(eq(templates.id, row.id));
//       await writeAdminAudit(tx, {
//         actorId,
//         sellerId: null,
//         targetType: "template",
//         targetId: row.key,
//         action: "set_default_template",
//         before: { defaultTemplate: previous?.key ?? null },
//         after: { defaultTemplate: row.key },
//         reason,
//       });
//       return null;
//     });
//     return outcome ? { success: false, error: outcome } : { success: true };
//   } catch (error) {
//     if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
//     if (isMissingAuditColumns(error)) return { success: false, error: "migration_required" };
//     throw error;
//   }
// }
//
