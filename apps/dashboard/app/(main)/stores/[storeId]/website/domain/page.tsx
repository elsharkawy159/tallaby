import { getTranslations } from "next-intl/server";
import { Globe, Map as MapIcon, Search } from "lucide-react";
import { parseStoreSeo } from "@workspace/lib/stores";
import { storeHostname } from "@workspace/lib/storefront";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { loadCrawlStatus, loadDomainTab, loadLiveDomain } from "./domain-seo.data";
import { toSeoFormValues } from "./domain-seo.dto";
import { DomainTab } from "./domain-tab.client";
import { InPageNav, SectionGroup } from "./section-group";
import { StoreSeoForm } from "./seo/seo-form.client";
import { CrawlStatusView } from "./sitemap/crawl-status.client";

/**
 * Website › Domain & SEO (PLAN.md §7.3, P4-14): one page with three sections,
 * Domain (#domain), Search engine (#seo) and Sitemap & indexing (#sitemap).
 */
export default async function StoreDomainPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const [domainData, liveDomain, crawlStatus, t] = await Promise.all([
    loadDomainTab(store),
    loadLiveDomain(store),
    loadCrawlStatus(store),
    getTranslations("domainSeo.sections"),
  ]);
  const readOnly = store.status !== "active";

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <InPageNav
        label={t("label")}
        items={[
          { id: "domain", label: t("domain.title"), icon: Globe },
          { id: "seo", label: t("seo.title"), icon: Search },
          { id: "sitemap", label: t("sitemap.title"), icon: MapIcon },
        ]}
      />

      <SectionGroup id="domain" icon={Globe} title={t("domain.title")} description={t("domain.description")}>
        <DomainTab
          store={{ id: store.id, subdomain: store.subdomain, isPrimary: store.isPrimary, readOnly }}
          {...domainData}
        />
      </SectionGroup>

      <SectionGroup id="seo" icon={Search} title={t("seo.title")} description={t("seo.description")}>
        <StoreSeoForm
          storeId={store.id}
          storeName={store.name}
          storeHost={liveDomain ?? storeHostname(store.subdomain)}
          hasCustomDomain={Boolean(liveDomain)}
          initial={toSeoFormValues(parseStoreSeo(store.seo))}
          readOnly={readOnly}
        />
      </SectionGroup>

      <SectionGroup id="sitemap" icon={MapIcon} title={t("sitemap.title")} description={t("sitemap.description")}>
        <CrawlStatusView storeId={store.id} status={crawlStatus} />
      </SectionGroup>
    </section>
  );
}
