import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FileText, Map as MapIcon, Search } from "lucide-react";
import { parseStoreSeo, storeSeoDefaults } from "@workspace/lib/stores";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { PageContainer, PageHeader } from "@/components/seller-ui";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { InPageNav, SectionGroup } from "../_components/section-group";
import { SiteOfflineNote } from "../_components/site-offline-note";
import { loadLiveDomain } from "../domain/domain.data";
import { CrawlStatusView } from "./crawl-status.client";
import { PagesSeo } from "./pages-seo.client";
import { loadCrawlStatus, loadSeoDefaults, loadSeoPages } from "./seo.data";
import { toSeoFormValues } from "./seo.dto";
import { StoreSeoForm } from "./seo-form.client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellerWebsite.seoPage");
  return { title: t("title") };
}

/**
 * Website › SEO (owner, 2026-11-09): the store's own SEO (#store), every
 * page's SEO (#pages) and Sitemap & indexing (#sitemap). Split from the old
 * Domain & SEO page, which is now Website › Domain.
 */
export default async function StoreSeoPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const liveDomain = await loadLiveDomain(store);
  const [crawlStatus, defaults, pages, t, tp] = await Promise.all([
    loadCrawlStatus(store, liveDomain),
    loadSeoDefaults(store),
    loadSeoPages(store),
    getTranslations("domainSeo.sections"),
    getTranslations("sellerWebsite.seoPage"),
  ]);
  const readOnly = store.status !== "active";
  const seo = parseStoreSeo(store.seo);
  // What a page with no SEO of its own falls back to: the store's saved SEO, else its defaults.
  const effective = storeSeoDefaults(
    { name: store.name, description: store.description, storeCategory: store.storeCategory, storeCategoryAr: store.storeCategoryAr },
    seo,
    defaults.locale,
  );

  return (
    <PageContainer narrow>
      <PageHeader className="sui-rise" title={tp("title")} description={tp("description")} />
      <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />
      <InPageNav
        label={t("label")}
        items={[
          { id: "store", label: t("store.title"), icon: Search },
          { id: "pages", label: t("pages.title"), icon: FileText },
          { id: "sitemap", label: t("sitemap.title"), icon: MapIcon },
        ]}
      />

      <SectionGroup id="store" icon={Search} title={t("store.title")} description={t("store.description")}>
        <StoreSeoForm
          storeId={store.id}
          storeName={store.name}
          storeHost={liveDomain ?? storeHostname(store.subdomain)}
          hasCustomDomain={Boolean(liveDomain)}
          initial={toSeoFormValues(seo)}
          defaults={defaults}
          readOnly={readOnly}
        />
      </SectionGroup>

      <SectionGroup id="pages" icon={FileText} title={t("pages.title")} description={t("pages.description")}>
        <PagesSeo
          storeId={store.id}
          initial={pages}
          readOnly={readOnly}
          ctx={{
            storeName: store.name,
            storeUrl: storeUrl(store.subdomain, liveDomain),
            template: effective.titleTemplate,
            homeDefault: effective.homeTitle,
            description: effective.description,
            keywords: effective.keywords,
            locale: defaults.locale,
          }}
        />
      </SectionGroup>

      <SectionGroup id="sitemap" icon={MapIcon} title={t("sitemap.title")} description={t("sitemap.description")}>
        <CrawlStatusView storeId={store.id} status={crawlStatus} />
      </SectionGroup>
    </PageContainer>
  );
}
