import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { MediaLibrary } from "@/components/media/media-library.client";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { loadMediaLibrary } from "./media.data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mediaLibrary");
  return { title: t("title") };
}

/**
 * Media library of one store (PLAN.md P4-09): this store's images plus the
 * seller's shared ones. The store id is checked by loadStorePage (404 for a
 * foreign store); every action checks it again.
 */
export default async function StoreMediaPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  if (!storeBuilderEnabled(store.sellerId)) notFound();
  const [library, t] = await Promise.all([loadMediaLibrary(store.sellerId, store.id), getTranslations("mediaLibrary")]);
  if (!library) notFound();

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <div>
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <MediaLibrary storeId={store.id} initial={library} readOnly={store.status !== "active"} />
    </section>
  );
}
