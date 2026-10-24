import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { storeFontVariables } from "../_components/store-fonts";
import { TemplateGallery } from "./templates.client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websiteTemplates");
  return { title: t("title") };
}

/**
 * Website › Templates (PLAN.md §8.1, P4-05). Global templates with this
 * store's current one marked. "Use template" merges the template into the
 * drafts (seller text and images kept where sections match); the last apply
 * can be undone. The page renders the header at once; the gallery loads one
 * page of templates at a time on the client (`listTemplatesPage`, React
 * Query), with the page and category in the URL (owner request 2026-10-24).
 */
export default async function WebsiteTemplatesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);

  return (
    <section className="mx-auto w-full space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <TemplateGallery storeId={store.id} readOnly={store.status !== "active"} fontClassName={storeFontVariables} />
    </section>
  );
}
