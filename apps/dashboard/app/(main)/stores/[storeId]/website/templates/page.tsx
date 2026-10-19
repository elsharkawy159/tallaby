import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listStoreTemplates } from "@workspace/lib/store-sites/server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { storeFontVariables } from "../_components/store-fonts";
import { TemplateGallery } from "./templates.client";
import { toTemplateCardViews } from "./templates.lib";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websiteTemplates");
  return { title: t("title") };
}

/**
 * Website › Templates (PLAN.md §8.1, P4-05). Global templates with this
 * store's current one marked. "Use template" merges the template into the
 * drafts (seller text and images kept where sections match); the last apply
 * can be undone.
 */
export default async function WebsiteTemplatesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);
  const gallery = await listStoreTemplates(store.sellerId, store.id);
  if (!gallery) notFound();

  const templates = toTemplateCardViews(gallery.templates);

  return (
    <section className="mx-auto w-full space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <TemplateGallery
        storeId={store.id}
        currentKey={gallery.currentKey}
        templates={templates}
        lastInstall={gallery.lastInstall}
        readOnly={store.status !== "active"}
        fontClassName={storeFontVariables}
      />
    </section>
  );
}
