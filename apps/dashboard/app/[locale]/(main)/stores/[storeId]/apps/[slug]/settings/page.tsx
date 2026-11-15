import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { appPaths, getAppBySlug } from "@workspace/apps";
import { loadAppCenterPage } from "../../app-center.data";
import { APP_SETTINGS_SCREENS } from "../../_settings/settings-routes.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
  if (!manifest.settingsRoute) redirect({ href: appPaths.detail(store.id, manifest), locale: await getLocale() });

  return <div className="flex flex-col gap-5">{await APP_SETTINGS_SCREENS[manifest.settingsRoute]({ store, manifest, state, readOnly })}</div>;
}
