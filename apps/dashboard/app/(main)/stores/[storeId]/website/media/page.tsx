import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { MediaAdapterProvider } from "@/components/media/media-adapter.client";
import { PageContainer } from "@/components/seller-ui";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { SiteOfflineNote } from "../_components/site-offline-note";
import { loadMediaLibrary } from "./media.data";
import { MediaManager } from "./media-manager.client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mediaLibrary");
  return { title: t("title") };
}

/**
 * Media library of one store (PLAN.md P4-09): this store's images plus the
 * seller's shared ones. The store id is checked by loadStorePage (404 for a
 * foreign store); every action checks it again. The picker and the editor's
 * panel keep the shared `MediaLibrary` from @workspace/store-editor.
 */
export default async function StoreMediaPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  if (!storeBuilderEnabled(store.sellerId)) notFound();
  const library = await loadMediaLibrary(store.sellerId, store.id);
  if (!library) notFound();

  return (
    <PageContainer>
      <MediaAdapterProvider storeId={store.id}>
        <MediaManager initial={library} readOnly={store.status !== "active"}>
          <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />
        </MediaManager>
      </MediaAdapterProvider>
    </PageContainer>
  );
}
