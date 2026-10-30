import { appShortName, parseStoreApp } from "@workspace/lib/stores/app";
import { storeUrl } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { StoreAppSettings } from "./app.client";

/** Store settings › App (ROADMAP.md F-36): the store website as an installable app. */
export default async function StoreAppPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);

  return (
    <StoreAppSettings
      storeId={store.id}
      name={store.name}
      shortName={appShortName(store.name)}
      icon={store.faviconUrl || store.logoUrl || null}
      usesLogo={!store.faviconUrl && Boolean(store.logoUrl)}
      siteUrl={storeUrl(store.subdomain, null)}
      initial={parseStoreApp(store.settings)}
      readOnly={store.status !== "active"}
    />
  );
}
