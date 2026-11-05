import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { listStoreAppInstalls } from "@workspace/lib/billing/apps";
import { getBillingState } from "@workspace/lib/billing/server";
import { PageContainer } from "@/components/seller-ui";
import { listStoreAppRequests, listStoreIntegrations } from "@workspace/lib/integrations/server";
import { getAllCategories } from "@/actions/categories";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { isGoogleSheetsConfigured } from "@/lib/integrations/google-oauth.server";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { parseStoreSeo } from "@workspace/lib/stores";
import { StoreApps } from "./apps.client";
import { ProductFeeds } from "./product-feeds.client";
import { FEED_PLATFORMS, storeFeedUrls } from "./product-feeds.lib";
import type { AppCategoryOption } from "./apps.types";

type CategoryNode = { id: string; name: string | null; nameAr: string | null; categories?: CategoryNode[] };

/** Flattens the admin category tree into "Parent › Child" options (P7-07 mapping). */
function categoryOptions(nodes: CategoryNode[], locale: string, prefix = ""): AppCategoryOption[] {
  return nodes.flatMap((node) => {
    const name = (locale === "ar" ? node.nameAr || node.name : node.name || node.nameAr) ?? "";
    const label = prefix ? `${prefix} › ${name}` : name;
    return [{ id: node.id, label }, ...categoryOptions(node.categories ?? [], locale, label)];
  });
}

export default async function StoreAppsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const integrations = await listStoreIntegrations(store.sellerId, store.id);
  if (!integrations) notFound();

  const [locale, tree, customDomain, installs, requests, billing] = await Promise.all([
    getLocale(),
    getAllCategories(),
    findActiveCustomDomainForSubdomain(store.subdomain),
    listStoreAppInstalls(store.sellerId, store.id),
    listStoreAppRequests(store.sellerId, store.id),
    getBillingState(),
  ]);
  const categories = tree.success ? categoryOptions((tree.data ?? []) as CategoryNode[], locale) : [];
  // Product feeds (F-11b) live on the store's own address: its active custom domain, else its subdomain.
  const feedUrls = storeFeedUrls(storeUrl(store.subdomain, customDomain), store.supportedLocales);

  return (
    <PageContainer>
      <StoreApps
        storeId={store.id}
        store={{
          name: store.name,
          logoUrl: store.logoUrl,
          hostname: storeHostname(store.subdomain),
          siteStatus: store.siteStatus,
          hasCustomDomain: Boolean(customDomain),
          metaDomainToken: parseStoreSeo(store.seo).facebookDomainVerification,
        }}
        initial={integrations}
        installs={installs.map(({ appKey, cancelAtPeriodEnd }) => ({ appKey, cancelAtPeriodEnd }))}
        requests={requests}
        readOnly={store.status !== "active"}
        googleSheetsEnabled={isGoogleSheetsConfigured()}
        usdLive={billing.usdLive}
        feedsReady={store.siteStatus === "published" ? FEED_PLATFORMS.length : 0}
        categories={categories}
        feeds={<ProductFeeds key="feeds" urls={feedUrls} published={store.siteStatus === "published"} />}
      />
    </PageContainer>
  );
}
