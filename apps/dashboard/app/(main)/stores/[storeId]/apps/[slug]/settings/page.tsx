import { notFound, redirect } from "next/navigation";
import { appPaths, getAppBySlug } from "@workspace/apps";
import { loadAppCenterPage } from "../../app-center.data";
import { APP_SETTINGS_SCREENS } from "../../_settings/settings-routes.data";

/**
 * Store › App Center › <app> › Settings (ROADMAP.md F-93). The registry's
 * `settingsRoute` picks the app's existing settings screen; an app with none
 * (not built yet, or install-only) goes back to its overview.
 */
export default async function AppSettingsPage({ params }: { params: Promise<{ storeId: string; slug: string }> }) {
  const { storeId, slug } = await params;
  const manifest = getAppBySlug(slug);
  if (!manifest) notFound();
  const { store, state, readOnly } = await loadAppCenterPage(storeId);
  if (!manifest.settingsRoute) redirect(appPaths.detail(store.id, manifest));

  return <div className="flex flex-col gap-5">{await APP_SETTINGS_SCREENS[manifest.settingsRoute]({ store, manifest, state, readOnly })}</div>;
}
