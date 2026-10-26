// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use client";
//
// import { useState } from "react";
// import type { EditorAdapter, EditorCapabilities, EditorLinkOverrides } from "@workspace/store-editor";
// import type { EditorCatalogSnapshot, EditorResult } from "@workspace/store-editor/editor.dto";
// import type { SiteConfig } from "@workspace/store-sections";
// import { createClient } from "@/supabase/client";
// import { LIBRARY_MEDIA_BUCKET } from "@/lib/library-media.lib";
// import { createLibrarySignedUpload, createLibraryUploadPath, recordLibraryUpload } from "@/lib/library-media.server";
// import { applyEditorChange, templateWorking, TEMPLATE_CHANGE_ERRORS, type TemplateEditorChange } from "./template-adapter.lib";
// import { listTemplateVersionsAction, publishTemplateAction, restoreTemplateVersionAction, saveTemplateDraftAction } from "./template-editor.server";
//
// /** A whole template: pages, its design system and header/footer; no store data, forms, gallery or stock photos. */
// export const TEMPLATE_CAPABILITIES: EditorCapabilities = {
//   pages: true,
//   templates: false,
//   forms: false,
//   explore: false,
//   mediaLibrary: false,
//   revisions: true,
//   unpublish: false,
//   preview: false,
//   industrySwitcher: false,
//   designSystem: true,
//   publishLabel: "templateVersion",
// };
//
// /** Seller-only destinations do not exist here. */
// const TEMPLATE_LINKS: EditorLinkOverrides = {
//   back: "/templates",
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
// export type TemplateAdapterOptions = {
//   templateId: string;
//   /** Asked once when the editor opens; sent with Publish and Restore (audited). */
//   reason: string;
//   /** The config the editor opened with (draft, or the published version). */
//   config: SiteConfig;
//   /** The pages' names in both languages, keyed by slug (missing: the page's own name). */
//   pageNames?: Record<string, { ar?: string; en?: string }>;
//   draftVersion: number;
//   catalog: EditorCatalogSnapshot;
//   /** Asks for the optional changelog before publishing: the text (may be empty), or null when cancelled. */
//   askChangelog: () => Promise<string | null>;
//   /** After a version was restored into the draft: the editor's state is stale (reload). */
//   onRestored: () => void;
// };
//
// /**
//  * The EditorAdapter for one library template. It keeps the working
//  * `SiteConfig` (the last saved one), the pages' names in both languages and the template's `draft_version`
//  * itself: every editor save (page, design system, header/footer, page list)
//  * is applied with `applyEditorChange` and the whole config is saved as the
//  * draft, one save at a time. The editor's own per-page / design / chrome
//  * versions are ignored; another admin's save makes the next one conflict,
//  * which shows the editor's reload banner. Images are uploaded into
//  * `library-media` (upload-only).
//  */
// export function createTemplateAdapter(options: TemplateAdapterOptions): EditorAdapter {
//   const { templateId, reason } = options;
//   let working = templateWorking(options.config, options.pageNames);
//   let draftVersion = options.draftVersion;
//   let queue: Promise<unknown> = Promise.resolve();
//
//   /** Runs `task` after every earlier save finished (each save needs the previous draft version). */
//   function serial<T>(task: () => Promise<T>): Promise<T> {
//     const run = queue.then(task, task);
//     queue = run.catch(() => undefined);
//     return run;
//   }
//
//   const commit = (change: TemplateEditorChange): Promise<EditorResult<{ draftVersion: number; page: { id: string; slug: string } | null }>> =>
//     serial(async () => {
//       const next = applyEditorChange(working, change);
//       if (!next.ok) return { success: false, error: TEMPLATE_CHANGE_ERRORS[next.error] };
//       const result = await saveTemplateDraftAction(templateId, next.working.config, draftVersion, next.working.pageNames);
//       if (!result.success) return result;
//       working = next.working;
//       draftVersion = result.data.draftVersion;
//       return { success: true, data: { draftVersion, page: next.page } };
//     });
//
//   const asVersion = async (change: TemplateEditorChange): Promise<EditorResult<{ version: number }>> => {
//     const result = await commit(change);
//     return result.success ? { success: true, data: { version: result.data.draftVersion } } : result;
//   };
//
//   const asNull = async (change: TemplateEditorChange): Promise<EditorResult<null>> => {
//     const result = await commit(change);
//     return result.success ? { success: true, data: null } : result;
//   };
//
//   return {
//     capabilities: TEMPLATE_CAPABILITIES,
//     links: TEMPLATE_LINKS,
//     saveDraft: async (pageId, content) => {
//       const result = await commit({ kind: "page", pageId, content });
//       return result.success ? { success: true, data: { draftVersion: result.data.draftVersion } } : result;
//     },
//     saveDesignSystem: (designSystem) => asVersion({ kind: "design", designSystem }),
//     saveChrome: (part, instance) => asVersion({ kind: "chrome", part, instance }),
//     refreshData: async () => ({ success: true, data: options.catalog }),
//     publish: async () => {
//       const changelog = await options.askChangelog();
//       if (changelog === null) return { success: false, error: "cancelled" };
//       return serial(async () => {
//         const result = await publishTemplateAction(templateId, changelog.trim() || null, reason);
//         // Publishing clears the draft and bumps draft_version once.
//         if (result.success) draftVersion += 1;
//         return result;
//       });
//     },
//     pages: {
//       create: async (input) => {
//         const result = await commit({ kind: "pages", op: "create", name: input.name, slug: input.slug });
//         if (!result.success) return result;
//         return { success: true, data: result.data.page ?? { id: `page:${input.slug}`, slug: input.slug } };
//       },
//       update: (pageId, input) => asNull({ kind: "pages", op: "update", pageId, ...input }),
//       remove: (pageId) => asNull({ kind: "pages", op: "remove", pageId }),
//       reorder: (pageIds) => asNull({ kind: "pages", op: "reorder", pageIds }),
//     },
//     revisions: {
//       list: () => listTemplateVersionsAction(templateId),
//       restore: (versionId) =>
//         serial(async () => {
//           const result = await restoreTemplateVersionAction(templateId, versionId, reason);
//           if (result.success) options.onRestored();
//           return result;
//         }),
//       discard: notAvailable,
//     },
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
//   };
// }
//
// /** One adapter per mounted editor; the working config lives in it, not in React state. */
// export function useTemplateAdapter(options: TemplateAdapterOptions): EditorAdapter {
//   const [adapter] = useState(() => createTemplateAdapter(options));
//   return adapter;
// }
//
