"use client";

import { useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { TOP_UP_TO_GO_ONLINE_HREF } from "@/lib/billing/top-up-to-go-online.lib";
import type { EditorAdapter, EditorCapabilities } from "@workspace/store-editor";
import { sellerMediaAdapter } from "@/components/media/media-adapter.client";
import { createFormFromTemplate } from "@/app/[locale]/(main)/stores/[storeId]/website/forms/forms.server";
import { applyTemplate, templatePreview, undoTemplate } from "@/app/[locale]/(main)/stores/[storeId]/website/templates/templates.server";
import {
  createPage,
  deletePage,
  discardDraft,
  listForms,
  listRevisions,
  previewLink,
  previewProduct,
  publish,
  refreshEditorData,
  draftVersions,
  fillTranslations,
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
import { previewCodeNode } from "./server/code-preview.server";
import { editorAgentTurn } from "./server/editor-agent.server";
import { translateSiteWithAi } from "./server/ai-translate.server";
import { requestWelcomeGiftCheck } from "@/components/layout/welcome-gift.lib";
import { usePublishNeedsProductToast } from "@/lib/stores/publish-needs-product.client";

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
  designSystem: true,
  publishLabel: "site",
};

/**
 * The seller dashboard's EditorAdapter: thin wrappers over the seller-scoped
 * server actions for one store. Built in the browser (server actions are
 * imported here), so no functions cross the server/client boundary. Every
 * action re-checks the store against the session seller; `storeId` is only
 * the URL's id. `codeSections`: the `code_sections` switch, read by the page;
 * only then the adapter has `code` (Add › Code section and the Code tab).
 */
export function useSellerEditorAdapter(storeId: string, capabilities?: Partial<EditorCapabilities>, codeSections = false): EditorAdapter {
  // Callers may pass a fresh object each render; the adapter changes only when a value does.
  const overridesKey = JSON.stringify(capabilities ?? {});
  // eslint-disable-next-line react-hooks/exhaustive-deps -- overridesKey stands for `capabilities`
  const merged = useMemo(() => ({ ...SELLER_CAPABILITIES, ...capabilities }), [overridesKey]);
  const router = useRouter();
  const needsProduct = usePublishNeedsProductToast(storeId);
  return useMemo<EditorAdapter>(
    () => ({
      capabilities: merged,
      saveDraft: (pageId, content, clientVersion) => saveDraft(storeId, pageId, content, clientVersion),
      saveDesignSystem: (designSystem, clientVersion) => saveDesignSystem(storeId, designSystem, clientVersion),
      saveChrome: (part, instance, clientVersion) => saveChrome(storeId, part, instance, clientVersion),
      draftVersions: () => draftVersions(storeId),
      refreshData: () => refreshEditorData(storeId),
      previewProduct: (productId, locale) => previewProduct(storeId, productId, locale),
      fillTranslations: () => fillTranslations(storeId),
      translateWithAi: () => translateSiteWithAi(storeId),
      publish: async () => {
        const result = await publish(storeId);
        // A new seller may have just earned the welcome gift (0119).
        if (result.success) requestWelcomeGiftCheck();
        // Offline for billing: the editor shows the message, and the seller lands on the wallet's top-up.
        else if (result.error === "topUpRequired") router.push(TOP_UP_TO_GO_ONLINE_HREF);
        // A never-published store needs a product first: our toast has the add button, so the editor shows none.
        else if (result.error === "noActiveProduct") {
          needsProduct();
          return { success: false, error: "cancelled" };
        }
        return result;
      },
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
        apply: (key, editionId) => applyTemplate(storeId, key, editionId),
        preview: (key, editionId) => templatePreview(storeId, key, editionId),
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
      // Always there for sellers; only its code ops need the `code_sections` switch (checked by the action).
      agent: { turn: (input) => editorAgentTurn(storeId, input) },
      ...(codeSections && { code: { preview: (input) => previewCodeNode(storeId, input) } }),
    }),
    [storeId, merged, router, needsProduct, codeSections],
  );
}
