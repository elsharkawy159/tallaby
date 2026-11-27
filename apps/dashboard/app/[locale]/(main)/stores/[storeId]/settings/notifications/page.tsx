import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Note } from "@/components/seller-ui";
import { getSellerPushPrefs, getVapidPublicKey } from "@/lib/push/push-alerts.server";
import { loadStorePageAccess } from "@/lib/stores/store-page.server";
import { PushAlertsSection } from "./push-alerts.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Store settings › Phone alerts (ROADMAP.md F-06; moved from /settings, owner
 * 2026-11-27). Alerts belong to the seller account: the store is only checked
 * (a foreign or deleted store is a 404), the seller comes from the session.
 * Without the VAPID keys the feature is off: the menu hides it, and a link here
 * (the bell's settings button, an old alert) opens General settings instead;
 * a failed read (e.g. 0124 not applied) shows a note, never an error page.
 */
export default async function StorePhoneAlertsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePageAccess(storeId);
  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) redirect({ href: `/stores/${encodeURIComponent(store.id)}/settings`, locale: await getLocale() });
  const prefs = await getSellerPushPrefs(store.sellerId).catch(() => null);
  if (!prefs) {
    const t = await getTranslations("pushAlerts.errors");
    return <Note tone="amber">{t("disabled")}</Note>;
  }

  return <PushAlertsSection publicKey={vapidPublicKey} initialPrefs={prefs} />;
}
