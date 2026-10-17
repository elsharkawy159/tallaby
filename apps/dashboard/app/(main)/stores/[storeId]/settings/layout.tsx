import { getTranslations } from "next-intl/server";
import { storeHostname } from "@workspace/lib/storefront";
import { Badge } from "@workspace/ui/components/badge";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreLogo } from "@/components/stores/store-logo.client";
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
  const t = await getTranslations("storeSettings");

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-11 rounded-xl" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{store.name}</h1>
          <p dir="ltr" className="truncate text-start text-sm text-muted-foreground rtl:text-end">
            {storeHostname(store.subdomain)}
          </p>
        </div>
        {store.status !== "active" && (
          <Badge variant="outline" className="ms-auto">
            {t("readOnlyBadge")}
          </Badge>
        )}
      </div>
      <StoreSettingsTabs storeId={store.id} />
      {children}
    </section>
  );
}
