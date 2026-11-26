import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { storeHostname } from "@workspace/lib/storefront";
import { PageContainer, PageHeader, Tag } from "@/components/seller-ui";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { StoreSiteStatusNote } from "@/components/stores/store-site-status-note";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreSettingsTabs } from "./store-settings-tabs.client";

type StoreParams = Promise<{ storeId: string }>;

/**
 * Store settings frame: the page title is in the static shell; the store chip,
 * site status note and tabs stream in their own <Suspense> holes, so the layout
 * never blocks its pages (docs/plans/dashboard-performance.md B4). Not a guard:
 * every settings page loads the store itself (loadStorePage: a foreign,
 * deleted or forged store is a 404).
 */
export default async function StoreSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: StoreParams;
}) {
  const t = await getTranslations("storeSetup");

  return (
    <PageContainer narrow>
      <PageHeader
        title={t("settingsTitle")}
        description={t("settingsDescription")}
        actions={
          <Suspense fallback={<Skeleton className="h-10 w-52 max-w-full rounded-full" />}>
            <StoreChip params={params} />
          </Suspense>
        }
      />
      <Suspense fallback={null}>
        <StoreStatusNote params={params} />
      </Suspense>
      {/* PageTabs reads the pathname, which suspends for an unknown [storeId]. */}
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-full max-[720px]:rounded-[18px]" />}>
        <SettingsTabs params={params} />
      </Suspense>
      {children}
    </PageContainer>
  );
}

async function StoreChip({ params }: { params: StoreParams }) {
  const store = await loadStorePage((await params).storeId);
  const tSettings = await getTranslations("storeSettings");
  return (
    <div className="flex min-w-0 max-w-full items-center gap-2.5 rounded-full border border-(--s-line) bg-(--s-surface) py-1 ps-1 pe-3.5">
      <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-8 rounded-full" />
      <span className="min-w-0 leading-tight">
        <b className="block truncate text-[13px] font-bold text-(--s-ink)">
          <bdi>{store.name}</bdi>
        </b>
        <bdi dir="ltr" className="block truncate font-montserrat text-[11.5px] text-(--s-subtle)">
          {storeHostname(store.subdomain)}
        </bdi>
      </span>
      {store.status !== "active" && <Tag tone="warning">{tSettings("readOnlyBadge")}</Tag>}
    </div>
  );
}

async function StoreStatusNote({ params }: { params: StoreParams }) {
  const store = await loadStorePage((await params).storeId);
  return <StoreSiteStatusNote siteStatus={store.siteStatus} className="text-[13px]" />;
}

async function SettingsTabs({ params }: { params: StoreParams }) {
  const store = await loadStorePage((await params).storeId);
  return <StoreSettingsTabs storeId={store.id} />;
}
