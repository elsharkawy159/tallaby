import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeader } from "@/components/seller-ui";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { SiteOfflineNote } from "../_components/site-offline-note";
import { loadDomainTab } from "./domain.data";
import { DomainTab } from "./domain-tab.client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellerWebsite.domain");
  return { title: t("title") };
}

/**
 * Website › Domain (PLAN.md §7.3, P4-14): the store's Tallaby address
 * (subdomain), its own custom domain and how to buy one. SEO and the sitemap
 * live on Website › SEO since 2026-11-09 (owner).
 */
export default async function StoreDomainPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const [domainData, tw] = await Promise.all([loadDomainTab(store), getTranslations("sellerWebsite.domain")]);
  const readOnly = store.status !== "active";

  return (
    <PageContainer narrow>
      <PageHeader className="sui-rise" title={tw("title")} description={tw("description")} />
      <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />
      <DomainTab store={{ id: store.id, subdomain: store.subdomain, isPrimary: store.isPrimary, readOnly }} {...domainData} />
    </PageContainer>
  );
}
