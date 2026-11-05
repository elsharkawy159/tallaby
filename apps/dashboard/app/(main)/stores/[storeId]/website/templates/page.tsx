import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { SiteOfflineNote } from "../_components/site-offline-note";
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
    <PageContainer>
      <TemplateGallery storeId={store.id} readOnly={store.status !== "active"} fontClassName={storeFontVariables}>
        <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />
      </TemplateGallery>
    </PageContainer>
  );
}
