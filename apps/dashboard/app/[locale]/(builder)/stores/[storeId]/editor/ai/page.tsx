import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getStoreSiteStatus } from "@workspace/lib/store-sites/server";
import { storePreviewSecret } from "@workspace/lib/store-sites/preview";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePageAccess } from "@/lib/stores/store-page.server";
import { editorAiEnabled } from "../server/editor-entry.data";
import { previewLink } from "../server/editor.server";
import { EditWithAiSkeleton } from "./edit-with-ai-skeleton";
import { editWithAiGate } from "./edit-with-ai-page.lib";
import { EditWithAiWorkspace } from "./edit-with-ai-workspace.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("editWithAi");
  return { title: t("title") };
}

/**
 * Edit the website with AI (owner request 2026-11-26): a chat that changes
 * the site's drafts, products and settings, beside a live preview. The store
 * is checked like the editor's (404 for a foreign or missing store); with AI
 * off the seller goes to the editor. Every action checks the store again.
 */
export default async function StoreEditorAiPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <Suspense fallback={<EditWithAiSkeleton />}>
      <EditWithAiLoader storeId={storeId} />
    </Suspense>
  );
}

async function EditWithAiLoader({ storeId }: { storeId: string }) {
  const [store, aiEnabled] = await Promise.all([loadStorePageAccess(storeId), editorAiEnabled()]);
  const gate = editWithAiGate({ builderEnabled: storeBuilderEnabled(store.sellerId), aiEnabled });
  if (gate === "notFound") notFound();
  if (gate === "editor") redirect({ href: `/stores/${encodeURIComponent(store.id)}/editor`, locale: await getLocale() });

  const previewEnabled = storePreviewSecret() !== null;
  const [status, preview] = await Promise.all([
    getStoreSiteStatus(store.sellerId, store.id).catch(() => null),
    // The same seller-checked action the editor uses; the browser signs one itself if this fails.
    previewEnabled ? previewLink(store.id).catch(() => null) : null,
  ]);

  return (
    <EditWithAiWorkspace
      storeId={store.id}
      storeName={store.name}
      readOnly={store.status !== "active"}
      previewEnabled={previewEnabled}
      initialPreviewUrl={preview?.success ? preview.data.url : null}
      initialUnpublished={status?.hasUnpublishedChanges ?? true}
    />
  );
}
