"use client";

import { useMemo } from "react";
import type { EditorAdapter, EditorCapabilities } from "@workspace/store-editor";
import { sellerMediaAdapter } from "@/components/media/media-adapter.client";
import { createFormFromTemplate } from "@/app/(main)/stores/[storeId]/website/forms/forms.server";
import { applyTemplate, templatePreview, undoTemplate } from "@/app/(main)/stores/[storeId]/website/templates/templates.server";
import {
  createPage,
  deletePage,
  discardDraft,
  listForms,
  listRevisions,
  previewLink,
  publish,
  refreshEditorData,
  reorderPages,
  restoreRevision,
  saveChrome,
  saveDesignSystem,
  saveDraft,
  siteStatus,
  unpublish,
  updatePage,
} from "./server/editor.server";
import { importStockPhoto, searchStockPhotos } from "./server/explore.server";

/** The seller's editor has everything. */
const SELLER_CAPABILITIES: EditorCapabilities = {
  pages: true,
  templates: true,
  forms: true,
  explore: true,
  mediaLibrary: true,
  revisions: true,
  unpublish: true,
  preview: true,
  industrySwitcher: false,
  publishLabel: "site",
};

/**
 * The seller dashboard's EditorAdapter: thin wrappers over the seller-scoped
 * server actions for one store. Built in the browser (server actions are
 * imported here), so no functions cross the server/client boundary. Every
 * action re-checks the store against the session seller; `storeId` is only
 * the URL's id.
 */
export function useSellerEditorAdapter(storeId: string, capabilities?: Partial<EditorCapabilities>): EditorAdapter {
  // Callers may pass a fresh object each render; the adapter changes only when a value does.
  const overridesKey = JSON.stringify(capabilities ?? {});
  // eslint-disable-next-line react-hooks/exhaustive-deps -- overridesKey stands for `capabilities`
  const merged = useMemo(() => ({ ...SELLER_CAPABILITIES, ...capabilities }), [overridesKey]);
  return useMemo<EditorAdapter>(
    () => ({
      capabilities: merged,
      saveDraft: (pageId, content, clientVersion) => saveDraft(storeId, pageId, content, clientVersion),
      saveDesignSystem: (designSystem, clientVersion) => saveDesignSystem(storeId, designSystem, clientVersion),
      saveChrome: (part, instance, clientVersion) => saveChrome(storeId, part, instance, clientVersion),
      refreshData: () => refreshEditorData(storeId),
      publish: () => publish(storeId),
      pages: {
        create: (input) => createPage(storeId, input),
        update: (pageId, input) => updatePage(storeId, pageId, input),
        remove: (pageId) => deletePage(storeId, pageId),
        reorder: (pageIds) => reorderPages(storeId, pageIds),
      },
      revisions: {
        list: () => listRevisions(storeId),
        restore: (revisionId) => restoreRevision(storeId, revisionId),
        discard: () => discardDraft(storeId),
      },
      unpublish: () => unpublish(storeId),
      siteStatus: () => siteStatus(storeId),
      previewLink: () => previewLink(storeId),
      templates: {
        apply: (key) => applyTemplate(storeId, key),
        preview: (key) => templatePreview(storeId, key),
        undo: () => undoTemplate(storeId),
      },
      forms: {
        list: () => listForms(storeId),
        createFromTemplate: (templateId) => createFormFromTemplate(storeId, templateId),
      },
      explore: {
        search: (query, page) => searchStockPhotos(storeId, query, page),
        import: (photoId) => importStockPhoto(storeId, photoId),
      },
      media: sellerMediaAdapter(storeId),
    }),
    [storeId, merged],
  );
}
