import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { storeHostname } from "@workspace/lib/storefront";
import { PageContainer, PageHeader, Tag } from "@/components/seller-ui";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { StoreSiteStatusNote } from "@/components/stores/store-site-status-note";
import { getVapidPublicKey } from "@/lib/push/push-alerts.server";
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
    // Wider than the 960px form column so the settings menu fits beside it from 1100px (owner, 2026-11-27).
    <PageContainer className="max-w-[1280px]">
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
      {/* The settings menu: a pill row on phones and tablets, a vertical list beside the page from 1100px. */}
      <div className="flex flex-col gap-5 max-[600px]:gap-3.5 min-[1100px]:grid min-[1100px]:grid-cols-[272px_minmax(0,1fr)] min-[1100px]:items-start min-[1100px]:gap-6">
        {/* The menu reads the pathname, which suspends for an unknown [storeId]. */}
        <Suspense
          fallback={<Skeleton className="h-12 w-full rounded-full max-[720px]:rounded-[18px] min-[1100px]:h-[460px] min-[1100px]:rounded-[18px]" />}
        >
          <SettingsTabs params={params} />
        </Suspense>
        <div className="flex min-w-0 flex-col gap-5 max-[600px]:gap-3.5">{children}</div>
      </div>
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
  // Phone alerts (F-06) is listed only when push is configured (VAPID keys set).
  return <StoreSettingsTabs storeId={store.id} phoneAlerts={getVapidPublicKey() !== null} />;
}
