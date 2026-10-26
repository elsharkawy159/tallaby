// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// /**
//  * `library_sections` rows → editor presets (Task 10). Pure: the seller and
//  * admin editors list these in Add › Sections, so admin edits, hides and
//  * deletes show up without a deploy. A row seeded from a code design gives
//  * exactly that design's preset (same id, so ids saved by the editor still
//  * match) with its stored tree instead of the code design.
//  */
// import {
//   LIBRARY_CATEGORY_IDS,
//   presetDataNeeds,
//   presetIdFor,
//   type LibraryCategoryId,
//   type Localized,
//   type NodeTemplate,
//   type SectionPreset,
// } from "@workspace/store-sections/render";
//
// /** The columns the editor needs from a published `library_sections` row. */
// export type LibrarySectionRow = {
//   key: string;
//   category: string;
//   subcategory: string;
//   name: unknown;
//   description: unknown;
//   keywords: readonly string[] | null;
//   tree: unknown;
//   version: number;
// };
//
// const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
//
// function localized(value: unknown): Localized | null {
//   if (!isRecord(value) || typeof value.ar !== "string" || typeof value.en !== "string") return null;
//   return { ar: value.ar, en: value.en };
// }
//
// /**
//  * The preset of a row, or null when the editor could not list or insert it
//  * (unknown category, no name, or a tree that is not one `section` root).
//  * Capabilities and data needs come from the tree's data nodes.
//  */
// export function toLibraryPreset(row: LibrarySectionRow): SectionPreset | null {
//   if (!(LIBRARY_CATEGORY_IDS as readonly string[]).includes(row.category)) return null;
//   const name = localized(row.name);
//   if (!name) return null;
//   if (!isRecord(row.tree) || row.tree.type !== "section") return null;
//   const tree = row.tree as NodeTemplate;
//   const needs = presetDataNeeds(tree);
//   return {
//     id: presetIdFor(row.category, row.key),
//     sectionId: "custom-section",
//     category: row.category as LibraryCategoryId,
//     subcategory: row.subcategory,
//     name,
//     description: localized(row.description) ?? { ar: "", en: "" },
//     keywords: [...(row.keywords ?? [])],
//     capabilities: needs.length ? ["dynamic"] : ["static"],
//     ...(needs.length && { dataNeeds: needs }),
//     designKey: row.key,
//     tree,
//     version: row.version,
//   };
// }
//
