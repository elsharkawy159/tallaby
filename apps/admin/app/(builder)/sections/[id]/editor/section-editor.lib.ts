// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// /**
//  * The admin section editor's single-section "page" (spec §5.3, Task 11).
//  * Pure: the page builds the editor's initial state from a library row, and
//  * the adapter turns the edited page back into the tree it saves.
//  */
// import type { DesignSystem } from "@workspace/store-sections";
// import { instantiateTemplate, toTemplate, type NodeTemplate } from "@workspace/store-sections/render";
// import type { TemplateDemo } from "@workspace/store-sections/templates";
// import type { EditorInitial } from "@workspace/store-editor/editor.client";
// import type { EditorCatalogSnapshot } from "@workspace/store-editor/editor.dto";
//
// export const SECTION_PAGE_ID = "section";
//
// export type SectionEditorRow = {
//   id: string;
//   key: string;
//   /** Library category; a `product-page` section is edited on a product page (product elements, ctx.product). */
//   category?: string;
//   name: unknown;
//   /** draft_tree ?? tree (slot form). */
//   tree: NodeTemplate;
//   draftVersion: number;
//   version: number;
//   hasDraft: boolean;
// };
//
// const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
//
// function localized(value: unknown): { ar?: string; en?: string } {
//   if (!isRecord(value)) return {};
//   return {
//     ...(typeof value.ar === "string" && { ar: value.ar }),
//     ...(typeof value.en === "string" && { en: value.en }),
//   };
// }
//
// /** The demo store's products and categories as the canvas catalog (no forms, posts, reviews…). */
// export function demoCatalogSnapshot(demo: TemplateDemo): EditorCatalogSnapshot {
//   return {
//     products: demo.products,
//     categories: demo.categories,
//     forms: [],
//     posts: [],
//     brands: [],
//     reviews: [],
//     reviewStats: null,
//     coupons: [],
//     failed: [],
//   };
// }
//
// /**
//  * The editor state for one library section: one synthetic home page holding
//  * the section as a tree section. `keepSlots` leaves the photo slots in the
//  * tree (the industry switcher only picks the photos the canvas shows).
//  */
// export function sectionEditorInitial(
//   row: SectionEditorRow,
//   opts: { demo: TemplateDemo; designSystem: DesignSystem; fontClassName: string },
// ): EditorInitial {
//   const name = localized(row.name);
//   const section = instantiateTemplate(row.tree, { id: row.key, keepSlots: true });
//   return {
//     storeId: row.id,
//     storeUrl: "",
//     readOnly: false,
//     store: { name: opts.demo.store.name.ar, description: opts.demo.store.description.ar, url: "/" },
//     pages: [
//       {
//         id: SECTION_PAGE_ID,
//         slug: "section",
//         isHome: true,
//         // Product page sections draw the demo product and may hold product elements.
//         ...(row.category === "product-page" && { kind: "product" as const }),
//         name: { ar: name.ar ?? row.key, en: name.en ?? row.key },
//         seo: {},
//         showInNav: false,
//         content: { sections: [section] },
//         version: row.draftVersion,
//       },
//     ],
//     header: null,
//     footer: null,
//     designSystem: opts.designSystem,
//     designVersion: 1,
//     chromeVersion: 1,
//     defaultLocale: "ar",
//     locales: ["ar", "en"],
//     catalog: demoCatalogSnapshot(opts.demo),
//     catalogMode: "all",
//     isLive: row.version > 0,
//     hasUnpublishedChanges: row.hasDraft || row.version === 0,
//     previewEnabled: false,
//     templates: { currentKey: "", items: [] },
//     fontClassName: opts.fontClassName,
//     category: { en: null, ar: null },
//     // Add › Sections stays empty: a section holds no other sections.
//     presets: [],
//     // One section only: drops and inserts that would add a second one are refused with a clear message.
//     maxSections: 1,
//     title: name.en ?? row.key,
//   };
// }
//
// /**
//  * The tree to save from the edited page: exactly one tree section with one
//  * `section` root, without ids; null for anything else (the save then fails as
//  * invalid content instead of dropping what was added).
//  */
// export function sectionTreeOf(content: unknown): NodeTemplate | null {
//   if (!isRecord(content) || !Array.isArray(content.sections) || content.sections.length !== 1) return null;
//   const section = content.sections[0] as { sectionId?: unknown; componentTree?: unknown };
//   if (!isRecord(section) || section.sectionId !== "custom-section" || !Array.isArray(section.componentTree)) return null;
//   if (section.componentTree.length !== 1) return null;
//   const root = section.componentTree[0];
//   if (!isRecord(root) || root.type !== "section" || !Array.isArray(root.children)) return null;
//   return toTemplate(root as Parameters<typeof toTemplate>[0]);
// }
//
