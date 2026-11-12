import { redirect } from "next/navigation";
import { APPS, appPaths, getApp } from "@workspace/apps";
import { getStoreApp } from "@workspace/lib/integrations";
import { storeHostname } from "@workspace/lib/storefront";
import { PageContainer } from "@/components/seller-ui";
import { AppCenter } from "./app-center.client";
import { loadAppCenterPage } from "./app-center.data";
import { appState } from "./app-center.lib";

/**
 * Store › App Center (ROADMAP.md F-93): every app and integration from the
 * registry, with this store's install state. Per store (rule 5): the state
 * comes from this store's rows only and is never cached (rule 8).
 */
export default async function StoreAppCenterPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  const { store, state, readOnly } = await loadAppCenterPage(storeId);
  // Old Google OAuth round-trips came back to the Apps page (`?google=…`); the toast now lives on Google Sheets › Settings.
  const google = typeof query.google === "string" ? query.google : null;
  if (google) redirect(`${appPaths.settings(store.id, getApp("google_sheets")!)}?google=${encodeURIComponent(google)}`);
  const items = APPS.map((manifest) => ({ id: manifest.id, state: appState(getStoreApp(manifest.id)!, state) }));

  return (
    <PageContainer>
      <AppCenter
        storeId={store.id}
        store={{ name: store.name, logoUrl: store.logoUrl, hostname: storeHostname(store.subdomain), siteStatus: store.siteStatus }}
        items={items}
        readOnly={readOnly}
      />
    </PageContainer>
  );
}
