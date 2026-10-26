// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use client";
//
// import { useMemo } from "react";
// import type { EditorAdapter, EditorCapabilities, EditorLinkOverrides } from "@workspace/store-editor";
// import type { EditorCatalogSnapshot } from "@workspace/store-editor/editor.dto";
// import { createClient } from "@/supabase/client";
// import { LIBRARY_MEDIA_BUCKET } from "@/lib/library-media.lib";
// import { createLibrarySignedUpload, createLibraryUploadPath, recordLibraryUpload } from "@/lib/library-media.server";
// import { sectionTreeOf } from "./section-editor.lib";
// import { publishSection, saveSectionDraft } from "./section-editor.server";
//
// /** One section on a canvas: no pages, templates, forms, library or store links; photos can be previewed per industry. */
// export const SECTION_CAPABILITIES: EditorCapabilities = {
//   pages: false,
//   templates: false,
//   forms: false,
//   explore: false,
//   mediaLibrary: false,
//   revisions: false,
//   unpublish: false,
//   preview: false,
//   industrySwitcher: true,
//   designSystem: false,
//   publishLabel: "section",
// };
//
// const SECTION_LINKS: EditorLinkOverrides = {
//   back: "/sections",
//   design: null,
//   settings: null,
//   manageForms: null,
//   formSubmissions: null,
//   formEditBase: null,
//   dataActions: false,
// };
//
// const notAvailable = async () => ({ success: false as const, error: "notFound" as const });
//
// /**
//  * The EditorAdapter for one library section. Saves send the edited
//  * `section` root as a template (ids stripped, photo slots kept); the design
//  * system and header/footer are the platform default and never saved; images
//  * are uploaded into `library-media` (upload-only, no library listing).
//  */
// export function createSectionAdapter(sectionId: string, reason: string, catalog: EditorCatalogSnapshot): EditorAdapter {
//   return {
//     capabilities: SECTION_CAPABILITIES,
//     links: SECTION_LINKS,
//     saveDraft: async (_pageId, content, clientVersion) => {
//       const tree = sectionTreeOf(content);
//       if (!tree) return { success: false, error: "invalidContent" };
//       return saveSectionDraft(sectionId, tree, clientVersion);
//     },
//     // The canvas shows the default design system; nothing of it belongs to the section.
//     saveDesignSystem: async (_designSystem, clientVersion) => ({ success: true, data: { version: clientVersion } }),
//     saveChrome: async (_part, _instance, clientVersion) => ({ success: true, data: { version: clientVersion } }),
//     refreshData: async () => ({ success: true, data: catalog }),
//     publish: () => publishSection(sectionId, reason),
//     media: {
//       list: notAvailable,
//       createUploadPaths: async ({ types }) => {
//         const paths: string[] = [];
//         for (const type of types.slice(0, 20)) {
//           const result = await createLibraryUploadPath(type);
//           if (!result.success) return result;
//           paths.push(result.data);
//         }
//         return { success: true, data: paths };
//       },
//       uploadFile: async (path, file) => {
//         const signed = await createLibrarySignedUpload(path);
//         if (!signed.success) throw new Error(signed.error);
//         const { error } = await createClient()
//           .storage.from(LIBRARY_MEDIA_BUCKET)
//           .uploadToSignedUrl(signed.data.path, signed.data.token, file, { cacheControl: "31536000", contentType: file.type });
//         if (error) throw new Error(error.message);
//       },
//       recordUpload: (input) => recordLibraryUpload(input),
//       update: notAvailable,
//       remove: notAvailable,
//       createFolder: notAvailable,
//       renameFolder: notAvailable,
//       deleteFolder: notAvailable,
//     },
// };
// }
//
// export function useSectionAdapter(sectionId: string, reason: string, catalog: EditorCatalogSnapshot): EditorAdapter {
//   return useMemo(() => createSectionAdapter(sectionId, reason, catalog), [sectionId, reason, catalog]);
// }
//
