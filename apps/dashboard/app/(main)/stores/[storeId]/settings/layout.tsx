import { getTranslations } from "next-intl/server";
import { storeHostname } from "@workspace/lib/storefront";
import { PageContainer, PageHeader, Tag } from "@/components/seller-ui";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { StoreSiteStatusNote } from "@/components/stores/store-site-status-note";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreSettingsTabs } from "./store-settings-tabs.client";

export default async function StoreSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const [t, tSettings] = await Promise.all([getTranslations("storeSetup"), getTranslations("storeSettings")]);

  return (
    <PageContainer narrow>
      <PageHeader
        title={t("settingsTitle")}
        description={t("settingsDescription")}
        actions={
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
        }
      />
      <StoreSiteStatusNote siteStatus={store.siteStatus} className="text-[13px]" />
      <StoreSettingsTabs storeId={store.id} />
      {children}
    </PageContainer>
  );
}
