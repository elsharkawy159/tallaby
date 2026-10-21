import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Globe, PencilRuler, ShoppingCart } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { STORE_DETAIL_TABS, isAdminWriteRole } from "@workspace/lib/admin";
import { getStoreForAdmin, getStoreTabCounts } from "@workspace/lib/admin/server";
import { storeUrl } from "@workspace/lib/storefront";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { ordersHref } from "../../_components/entity/entity-href.lib";
import { IdentityHeader } from "../../_components/entity/identity-header";
import { accountChips } from "../../_components/entity/relation-chips.lib";
import { getAccountRelations } from "../../_components/entity/relations.server";
import { UrlTabs, pickTab } from "../../_components/url-tabs";
import { SiteStatusBadge, StoreStatusBadge } from "../stores.lib";
import {
  StoreAuditTab,
  StoreCatalogTab,
  StoreCommerceTab,
  StoreContentTab,
  StoreFormsTab,
  StoreIntegrationsTab,
  StoreMediaTab,
  StoreOverviewTab,
  StoreWebsiteTab,
} from "./store-tabs";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * One store, tab by tab (docs/admin-saas.md §3.3). Only the open tab's data
 * is fetched; the header and the tab badges are two small queries.
 */
export default async function StoreDetailPage({ params, searchParams }: PageProps) {
  const [{ storeId }, raw] = await Promise.all([params, searchParams]);
  const admin = await getCurrentAdminUser();
  const [store, counts] = await Promise.all([getStoreForAdmin(storeId), getStoreTabCounts(storeId).catch(() => null)]);
  if (!store) notFound();
  const owner = await getAccountRelations(store.sellerId).catch(() => null);

  const tab = pickTab(raw.tab, STORE_DETAIL_TABS);
  const activeDomain = store.domains.find((domain) => domain.status === "active")?.domain ?? null;

  return (
    <div className="space-y-6">
      <IdentityHeader
        back={{ href: "/stores", label: "Stores" }}
        title={store.name}
        avatar={{ kind: "store", name: store.name, src: store.logoUrl, seed: store.id }}
        badges={
          <>
            <SiteStatusBadge status={store.siteStatus} />
            <StoreStatusBadge status={store.status} />
          </>
        }
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Globe className="size-3.5" aria-hidden />
              {activeDomain ?? store.subdomain}
            </span>
            <span className="capitalize">{store.plan} plan</span>
            {store.isPrimary ? <span>Primary store</span> : null}
          </span>
        }
        relations={
          owner
            ? accountChips(owner, { personRole: "Owner", excludeStoreId: store.id, omit: ["orders"] }).concat({
                href: ordersHref({ store: store.id }),
                role: "Orders",
                name: "Placed in this store",
                icon: ShoppingCart,
              })
            : []
        }
        actions={
          <>
            {isAdminWriteRole(admin.role) && (
              <Button asChild size="sm">
                <Link href={`/stores/${storeId}/editor`}>
                  <PencilRuler className="mr-1 h-3.5 w-3.5" />
                  Edit website
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <a href={storeUrl(store.subdomain, activeDomain)} target="_blank" rel="noreferrer">
                Open storefront
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          </>
        }
      />

      <UrlTabs
        baseHref={`/stores/${storeId}`}
        active={tab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "website", label: "Website", count: counts?.pages },
          { key: "catalog", label: "Catalog" },
          { key: "commerce", label: "Payments & shipping" },
          { key: "integrations", label: "Integrations", count: counts?.integrationErrors },
          { key: "forms", label: "Forms", count: counts?.forms },
          { key: "content", label: "Blog & CMS", count: counts?.content },
          { key: "media", label: "Media", count: counts?.media },
          { key: "audit", label: "Audit" },
        ]}
      />

      <Suspense key={tab} fallback={<TabSkeleton />}>
        {tab === "overview" && <StoreOverviewTab store={store} />}
        {tab === "website" && <StoreWebsiteTab store={store} canWrite={isAdminWriteRole(admin.role)} />}
        {tab === "catalog" && <StoreCatalogTab store={store} />}
        {tab === "commerce" && <StoreCommerceTab store={store} />}
        {tab === "integrations" && <StoreIntegrationsTab store={store} />}
        {tab === "forms" && <StoreFormsTab store={store} />}
        {tab === "content" && <StoreContentTab store={store} />}
        {tab === "media" && <StoreMediaTab store={store} />}
        {tab === "audit" && <StoreAuditTab store={store} />}
      </Suspense>
    </div>
  );
}

function TabSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
