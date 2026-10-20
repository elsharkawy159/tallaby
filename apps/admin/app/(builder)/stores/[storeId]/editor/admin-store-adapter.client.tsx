"use client";

import { useMemo } from "react";
import { MEDIA_BUCKET } from "@workspace/lib/media";
import type { EditorAdapter, EditorCapabilities, EditorLinkOverrides } from "@workspace/store-editor";
import { createClient } from "@/supabase/client";
import {
  applyTemplate,
  createFormFromTemplate,
  createPage,
  deletePage,
  discardDraft,
  draftVersions,
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
  templatePreview,
  undoTemplate,
  unpublish,
  updatePage,
} from "./admin-store-editor.server";
import {
  createFolder,
  createSignedUpload,
  createUploadPaths,
  deleteFolder,
  deleteMedia,
  listMedia,
  recordUpload,
  renameFolder,
  updateMedia,
} from "./admin-store-media.server";

/** Everything the seller has, except stock-photo import (seller tooling). */
const ADMIN_CAPABILITIES: EditorCapabilities = {
  pages: true,
  templates: true,
  forms: true,
  explore: false,
  mediaLibrary: true,
  revisions: true,
  unpublish: true,
  preview: true,
  industrySwitcher: false,
  designSystem: true,
  publishLabel: "site",
};

/** The seller dashboard's management pages do not exist here: back goes to the admin store page, the rest are hidden. */
function adminLinks(storeId: string): EditorLinkOverrides {
  return {
    back: `/stores/${storeId}`,
    design: null,
    settings: null,
    manageForms: null,
    formSubmissions: null,
    formEditBase: null,
    dataActions: false,
  };
}

/**
 * The admin app's EditorAdapter for one store: thin wrappers over the admin
 * server actions, which resolve the store's real seller on the server and
 * re-check the admin on every call. `reason` (asked once per editing session)
 * goes with every audited write.
 */
export function useAdminStoreAdapter(storeId: string, reason: string): EditorAdapter {
  return useMemo<EditorAdapter>(
    () => ({
      capabilities: ADMIN_CAPABILITIES,
      links: adminLinks(storeId),
      saveDraft: (pageId, content, clientVersion) => saveDraft(storeId, pageId, content, clientVersion),
      saveDesignSystem: (designSystem, clientVersion) => saveDesignSystem(storeId, designSystem, clientVersion),
      saveChrome: (part, instance, clientVersion) => saveChrome(storeId, part, instance, clientVersion),
      draftVersions: () => draftVersions(storeId),
      refreshData: () => refreshEditorData(storeId),
      publish: () => publish(storeId, reason),
      pages: {
        create: (input) => createPage(storeId, input, reason),
        update: (pageId, input) => updatePage(storeId, pageId, input, reason),
        remove: (pageId) => deletePage(storeId, pageId, reason),
        reorder: (pageIds) => reorderPages(storeId, pageIds),
      },
      revisions: {
        list: () => listRevisions(storeId),
        restore: (revisionId) => restoreRevision(storeId, revisionId, reason),
        discard: () => discardDraft(storeId, reason),
      },
      unpublish: () => unpublish(storeId, reason),
      siteStatus: () => siteStatus(storeId),
      previewLink: () => previewLink(storeId),
      templates: {
        apply: (key) => applyTemplate(storeId, key, reason),
        preview: (key) => templatePreview(storeId, key),
        undo: () => undoTemplate(storeId, reason),
      },
      forms: {
        list: () => listForms(storeId),
        createFromTemplate: (templateId) => createFormFromTemplate(storeId, templateId),
      },
      media: {
        list: (query) => listMedia(storeId, query),
        createUploadPaths: (input) => createUploadPaths(storeId, input),
        // The admin session cannot write to the seller's folder: the server signs a one-time upload for this path.
        uploadFile: async (path, file) => {
          const signed = await createSignedUpload(storeId, path);
          if (!signed.success) throw new Error(signed.error);
          const { error } = await createClient()
            .storage.from(MEDIA_BUCKET)
            .uploadToSignedUrl(signed.data.path, signed.data.token, file, { cacheControl: "31536000", contentType: file.type });
          if (error) throw new Error(error.message);
        },
        recordUpload: (input) => recordUpload(storeId, input),
        update: (assetId, input) => updateMedia(storeId, assetId, input),
        remove: (assetId) => deleteMedia(storeId, assetId),
        createFolder: (input) => createFolder(storeId, input),
        renameFolder: (folderId, name) => renameFolder(storeId, folderId, name),
        deleteFolder: (folderId) => deleteFolder(storeId, folderId),
      },
    }),
    [storeId, reason],
  );
}
