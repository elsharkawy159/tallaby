// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// /**
//  * The admin template screen, section by section (owner, 2026-10-26): a
//  * template is opened in its stored form, every library section as a ref
//  * (`libraryRef: { key, props }`, `@workspace/store-sections` templates/
//  * library-ref.ts) with no tree, plus the library rows those refs build from,
//  * so the admin edits each section's values as a form and never the template's
//  * trees. A stored section that is still an exact copy of its seed is shown as
//  * a ref already (the `backfill:template-refs` conversion, in memory); saving
//  * stores it that way. Saves and publishes use the Template Studio's
//  * `saveTemplateDraft` / `publishTemplateVersion`.
//  *
//  * Platform data only. Read-only here; callers check the admin session.
//  */
// import { and, asc, db, eq, gt, inArray, isNull, librarySections, templateVersions, templates } from "@workspace/db";
// import { sanitizeSiteConfig, type SiteConfig } from "@workspace/store-sections";
// import type { NodeTemplate } from "@workspace/store-sections/render";
// import {
//   alignFieldNames,
//   codeLibraryDesign,
//   codeLibraryTree,
//   resolveTemplateMeta,
//   storedTemplateRefConfig,
//   templateRefKeys,
//   type TemplateMeta,
// } from "@workspace/store-sections/templates";
// import type { Queryable } from "./guard.server";
// import { prepareTemplateConfig, studioPageNames, type TemplatePageNames } from "./templates-studio-admin.lib";
//
// const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// const KEY_RE = /^[a-z0-9-]{1,100}$/;
//
// type Localized = { ar: string; en: string };
//
// /** A library section as the template screen needs it: the named published tree it builds from. */
// export type TemplateLibraryRow = { key: string; name: Localized; category: string; tree: NodeTemplate; hidden: boolean };
//
// /** One entry of the screen's "Add section" list (no tree). */
// export type TemplateLibraryEntry = { /** `library_sections.id` (the section editor route). */ id: string; key: string; name: Localized; category: string; subcategory: string; thumbnailUrl: string | null; hidden: boolean };
//
// export type TemplateForSections = {
//   id: string;
//   key: string;
//   name: unknown;
//   category: string;
//   isDefault: boolean;
//   isActive: boolean;
//   /** The stored form: library sections as refs without trees; other sections as stored. Null when it does not parse. */
//   config: SiteConfig | null;
//   hasDraft: boolean;
//   draftVersion: number;
//   version: number | null;
//   meta: TemplateMeta;
//   pageNames: TemplatePageNames;
//   /** Every library row the config's refs use (a key with no published row: its code design). */
//   rows: Record<string, TemplateLibraryRow>;
// };
//
// const isTree = (value: unknown): value is NodeTemplate =>
//   typeof value === "object" && value !== null && !Array.isArray(value) && (value as { type?: unknown }).type === "section";
//
// const localizedName = (value: unknown, fallback: string): Localized => {
//   const v = (value && typeof value === "object" ? value : {}) as { ar?: unknown; en?: unknown };
//   const ar = typeof v.ar === "string" && v.ar ? v.ar : fallback;
//   return { ar, en: typeof v.en === "string" && v.en ? v.en : ar };
// };
//
// /**
//  * The published library rows of these keys, field names lined up with the
//  * code design, and the code design for a key with no published row.
//  */
// export async function loadTemplateLibraryRows(keys: readonly string[], q: Queryable = db): Promise<Record<string, TemplateLibraryRow>> {
//   const wanted = [...new Set(keys)].filter((key) => KEY_RE.test(key));
//   const out: Record<string, TemplateLibraryRow> = {};
//   if (!wanted.length) return out;
//   const rows = await q
//     .select({ key: librarySections.key, name: librarySections.name, category: librarySections.category, tree: librarySections.tree, hidden: librarySections.isHidden })
//     .from(librarySections)
//     .where(and(inArray(librarySections.key, wanted), gt(librarySections.version, 0)));
//   for (const row of rows) {
//     if (!isTree(row.tree)) continue;
//     out[row.key] = {
//       key: row.key,
//       name: localizedName(row.name, row.key),
//       category: row.category,
//       tree: alignFieldNames(row.tree, codeLibraryTree(row.key)?.tree),
//       hidden: row.hidden,
//     };
//   }
//   for (const key of wanted) {
//     if (out[key]) continue;
//     const code = codeLibraryTree(key);
//     const design = codeLibraryDesign(key);
//     if (code && design) out[key] = { key, name: design.name, category: code.category, tree: code.tree, hidden: false };
//   }
//   return out;
// }
//
// /** One template for the section screen, or null (not found, deleted, bad id). */
// export async function getTemplateForSections(id: string, q: Queryable = db): Promise<TemplateForSections | null> {
//   if (typeof id !== "string" || !UUID_RE.test(id)) return null;
//   const [row] = await q
//     .select({ template: templates, version: templateVersions.version, config: templateVersions.config })
//     .from(templates)
//     .leftJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
//     .where(and(eq(templates.id, id), isNull(templates.deletedAt)))
//     .limit(1);
//   if (!row) return null;
//   const t = row.template;
//   const stored = t.draftConfig ?? row.config;
//   const prepared = stored ? prepareTemplateConfig(stored) : null;
//   // Exact seed copies become refs here too, so a template the backfill has not reached opens section by section.
//   const config = prepared?.ok ? storedTemplateRefConfig(prepared.config, { industry: t.category, normalize: sanitizeSiteConfig }) : null;
//   const meta = resolveTemplateMeta(t.meta, t.key);
//   return {
//     id: t.id,
//     key: t.key,
//     name: t.name,
//     category: t.category,
//     isDefault: t.isDefault,
//     isActive: t.isActive,
//     config,
//     hasDraft: t.draftConfig !== null,
//     draftVersion: t.draftVersion,
//     version: row.version ?? null,
//     meta,
//     pageNames: studioPageNames(t.meta, meta.pageNames, config?.pages ?? [], t.draftConfig !== null),
//     rows: config ? await loadTemplateLibraryRows(templateRefKeys(config), q) : {},
//   };
// }
//
// /** Every published, non-deleted library section (hidden ones too) for "Add section", in palette order. */
// export async function listTemplateLibraryEntries(q: Queryable = db): Promise<TemplateLibraryEntry[]> {
//   const rows = await q
//     .select({
//       id: librarySections.id,
//       key: librarySections.key,
//       name: librarySections.name,
//       category: librarySections.category,
//       subcategory: librarySections.subcategory,
//       thumbnailUrl: librarySections.thumbnailUrl,
//       hidden: librarySections.isHidden,
//     })
//     .from(librarySections)
//     .where(and(isNull(librarySections.deletedAt), gt(librarySections.version, 0)))
//     .orderBy(asc(librarySections.category), asc(librarySections.sortOrder), asc(librarySections.key));
//   return rows.map((row) => ({ ...row, name: localizedName(row.name, row.key) }));
// }
//
