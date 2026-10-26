// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
import { describe, it } from "vitest";

describe.skip("disabled: templates and sections are code-only (0109)", () => {
  it("is disabled", () => {});
});

// import { describe, expect, it } from "vitest";
// import { DESIGNS, designSlotTree, type NodeTemplate } from "@workspace/store-sections/render";
// import { assignFieldNames } from "@workspace/store-sections/templates";
// import {
//   blankSectionTree,
//   libraryReason,
//   librarySectionCreateSchema,
//   librarySectionMetaSchema,
//   prepareLibraryTree,
// } from "./library-sections-admin.lib";
//
// const NAME = { ar: "قسم", en: "Section" };
//
// describe("prepareLibraryTree", () => {
//   it("accepts every seeded design tree, keeps its photo slots and is stable", () => {
//     const slotsOf = (tree: NodeTemplate) => JSON.stringify(tree).match(/stock:(photo|person):\d+/g) ?? [];
//     for (const design of DESIGNS) {
//       // As seeded: the slot tree with its field names (the sanitizer keeps them).
//       const tree = assignFieldNames(designSlotTree(design));
//       const prepared = prepareLibraryTree(tree);
//       expect(prepared.ok, design.id).toBe(true);
//       if (!prepared.ok) continue;
//       expect(slotsOf(prepared.tree), design.id).toEqual(slotsOf(tree));
//       // Nothing of a seeded design is dropped by the sanitizer (styles included).
//       expect(prepared.tree, design.id).toEqual(tree);
//       // Saving the stored form again changes nothing (the sanitizer already ran).
//       expect(prepareLibraryTree(prepared.tree), design.id).toEqual(prepared);
//     }
//   });
//
//   it("names new nodes and renames a duplicated one", () => {
//     const tree = assignFieldNames(designSlotTree(DESIGNS[1]!));
//     const first = tree.children![0]!;
//     const prepared = prepareLibraryTree({ ...tree, children: [...tree.children!, first, { type: "heading", props: { text: "x", level: "h2" }, children: [] }] });
//     expect(prepared.ok).toBe(true);
//     if (!prepared.ok) return;
//     const fields = prepared.tree.children!.map((child) => (child.props as { field?: string }).field);
//     expect(fields[0]).toBe((first.props as { field?: string }).field);
//     expect(new Set(fields).size).toBe(fields.length);
//     expect(fields.at(-1)).toMatch(/^heading/);
//   });
//
//   it("keeps a slot src (stock:photo:N) and a fixed uploaded URL", () => {
//     const tree: NodeTemplate = {
//       type: "section",
//       props: {},
//       children: [
//         { type: "image", props: { src: "stock:photo:3", alt: "" }, children: [] },
//         { type: "image", props: { src: "https://x.supabase.co/storage/v1/object/public/library-media/library/a.webp", alt: "" }, children: [] },
//       ],
//     };
//     const prepared = prepareLibraryTree(tree);
//     expect(prepared.ok && prepared.tree.children?.map((c) => c.props.src)).toEqual([
//       "stock:photo:3",
//       "https://x.supabase.co/storage/v1/object/public/library-media/library/a.webp",
//     ]);
//   });
//
//   it("rejects anything that is not one section root of known elements", () => {
//     expect(prepareLibraryTree(null).ok).toBe(false);
//     expect(prepareLibraryTree([]).ok).toBe(false);
//     expect(prepareLibraryTree({ type: "div", props: {}, children: [] }).ok).toBe(false);
//     expect(prepareLibraryTree({ type: "section", props: {}, children: [{ type: "script", props: {}, children: [] }] }).ok).toBe(false);
//     expect(prepareLibraryTree({ type: "section", props: {}, children: "nope" }).ok).toBe(false);
//   });
//
//   it("sanitizes dangerous values", () => {
//     const prepared = prepareLibraryTree({
//       type: "section",
//       props: {},
//       children: [{ type: "link", props: { href: "javascript:alert(1)", text: "x" }, children: [] }],
//     });
//     expect(prepared.ok).toBe(true);
//     if (prepared.ok) expect(prepared.tree.children?.[0]?.props.href).toBe("");
//   });
// });
//
// describe("blankSectionTree", () => {
//   it("is an empty section root that passes validation", () => {
//     const tree = blankSectionTree();
//     expect(tree.type).toBe("section");
//     expect(tree.children).toEqual([]);
//     expect(prepareLibraryTree(tree).ok).toBe(true);
//   });
// });
//
// describe("inputs", () => {
//   it("validates keys", () => {
//     const base = { category: "hero", subcategory: "split", name: NAME, description: NAME };
//     expect(librarySectionCreateSchema.safeParse({ ...base, key: "hero-new-1" }).success).toBe(true);
//     for (const key of ["Hero", "hero_new", "hero new", "", "a", "x".repeat(49), "héro"]) {
//       expect(librarySectionCreateSchema.safeParse({ ...base, key }).success, key).toBe(false);
//     }
//   });
//
//   it("needs a known library category and both names", () => {
//     const base = { key: "k-1", subcategory: "", name: NAME, description: { ar: "", en: "" } };
//     expect(librarySectionCreateSchema.safeParse({ ...base, category: "hero" }).success).toBe(true);
//     expect(librarySectionCreateSchema.safeParse({ ...base, category: "nope" }).success).toBe(false);
//     expect(librarySectionCreateSchema.safeParse({ ...base, category: "hero", name: { ar: "", en: "x" } }).success).toBe(false);
//     expect(librarySectionMetaSchema.safeParse({ category: "hero", subcategory: "a-b", name: NAME, description: NAME }).success).toBe(true);
//     expect(librarySectionMetaSchema.safeParse({ category: "hero", subcategory: "A B", name: NAME, description: NAME }).success).toBe(false);
//   });
//
//   it("checks the reason length (3–500, trimmed)", () => {
//     expect(libraryReason("  ok ")).toBeNull();
//     expect(libraryReason("fine")).toBe("fine");
//     expect(libraryReason(" x".repeat(300))).toBeNull();
//     expect(libraryReason(42)).toBeNull();
//   });
// });
//
