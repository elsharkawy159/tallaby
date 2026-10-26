// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
import { describe, it } from "vitest";

describe.skip("disabled: templates and sections are code-only (0109)", () => {
  it("is disabled", () => {});
});

// import { beforeEach, describe, expect, it, vi } from "vitest";
//
// const upload = vi.fn(async () => ({ error: null }));
// vi.mock("@/supabase/client", () => ({ createClient: () => ({ storage: { from: vi.fn(() => ({ uploadToSignedUrl: upload })) } }) }));
// vi.mock("@/lib/library-media.server", () => ({
//   createLibraryUploadPath: vi.fn(async (mime: string) => ({ success: true, data: `library/x.${mime.split("/")[1]}` })),
//   createLibrarySignedUpload: vi.fn(async (path: string) => ({ success: true, data: { path, token: "tok" } })),
//   recordLibraryUpload: vi.fn(async () => ({ success: true, data: { url: "https://cdn/x.png" } })),
// }));
// vi.mock("./section-editor.server", () => ({
//   saveSectionDraft: vi.fn(async () => ({ success: true, data: { draftVersion: 5 } })),
//   publishSection: vi.fn(async () => ({ success: true, data: { revisionId: "id", revisionNumber: 3 } })),
// }));
//
// import { DESIGNS, designSlotTree } from "@workspace/store-sections/render";
// import { getCodeTemplate } from "@workspace/store-sections/templates";
// import { createLibrarySignedUpload } from "@/lib/library-media.server";
// import { createSectionAdapter, SECTION_CAPABILITIES } from "./section-adapter.client";
// import { demoCatalogSnapshot, sectionEditorInitial } from "./section-editor.lib";
// import { publishSection, saveSectionDraft } from "./section-editor.server";
//
// const demo = getCodeTemplate("tallaby-classic")!.demo;
// const catalog = demoCatalogSnapshot(demo);
// const SECTION_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
//
// describe("section adapter", () => {
//   beforeEach(() => vi.clearAllMocks());
//
//   it("has only the section-editing capabilities", () => {
//     expect(SECTION_CAPABILITIES).toEqual({
//       pages: false,
//       templates: false,
//       forms: false,
//       explore: false,
//       mediaLibrary: false,
//       revisions: false,
//       unpublish: false,
//       preview: false,
//       industrySwitcher: true,
//       designSystem: false,
//       publishLabel: "section",
//     });
//     const adapter = createSectionAdapter(SECTION_ID, "why", catalog);
//     expect(adapter.links).toMatchObject({ back: "/sections", design: null, settings: null, dataActions: false });
//     expect(adapter.pages).toBeUndefined();
//     expect(adapter.templates).toBeUndefined();
//     expect(adapter.draftVersions).toBeUndefined();
//   });
//
//   it("saves the section root as a slot template with the page version", async () => {
//     const tree = designSlotTree(DESIGNS.find((d) => d.id === "hero-classic")!);
//     const initial = sectionEditorInitial(
//       { id: SECTION_ID, key: "hero-classic", name: {}, tree, draftVersion: 4, version: 1, hasDraft: false },
//       { demo, designSystem: { colors: {}, typography: {}, spacing: {} }, fontClassName: "" },
//     );
//     const adapter = createSectionAdapter(SECTION_ID, "why", catalog);
//     const result = await adapter.saveDraft("section", initial.pages[0]!.content, 4);
//     expect(result).toEqual({ success: true, data: { draftVersion: 5 } });
//     expect(saveSectionDraft).toHaveBeenCalledWith(SECTION_ID, tree, 4);
//   });
//
//   it("refuses to save a page that is not one section, without calling the server", async () => {
//     const adapter = createSectionAdapter(SECTION_ID, "why", catalog);
//     expect(await adapter.saveDraft("section", { sections: [] }, 1)).toEqual({ success: false, error: "invalidContent" });
//     expect(saveSectionDraft).not.toHaveBeenCalled();
//   });
//
//   it("publishes with the session reason; design and chrome saves write nothing", async () => {
//     const adapter = createSectionAdapter(SECTION_ID, "fix the hero", catalog);
//     await adapter.publish();
//     expect(publishSection).toHaveBeenCalledWith(SECTION_ID, "fix the hero");
//     expect(await adapter.saveDesignSystem({}, 7)).toEqual({ success: true, data: { version: 7 } });
//     expect(await adapter.saveChrome("header", null, 2)).toEqual({ success: true, data: { version: 2 } });
//     expect(await adapter.refreshData()).toEqual({ success: true, data: catalog });
//   });
//
//   it("is upload-only: no listing, uploads go to library-media through a signed URL", async () => {
//     const adapter = createSectionAdapter(SECTION_ID, "why", catalog);
//     expect(await adapter.media.list()).toEqual({ success: false, error: "notFound" });
//     expect(await adapter.media.createUploadPaths({ shared: false, types: ["image/png"] })).toEqual({ success: true, data: ["library/x.png"] });
//     await adapter.media.uploadFile("library/x.png", new File(["x"], "x.png", { type: "image/png" }));
//     expect(createLibrarySignedUpload).toHaveBeenCalledWith("library/x.png");
//     expect(upload).toHaveBeenCalledWith("library/x.png", "tok", expect.any(File), expect.objectContaining({ contentType: "image/png" }));
//   });
// });
//
