import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * The old Store settings › Sales pop-up URL (ROADMAP.md F-22). The settings are
 * an App Center app in Marketing tools since 2026-11-27 (owner); old links and
 * bookmarks land there. The app page checks the store against the session.
 */
export default async function StoreSalesPopupPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect({ href: `/stores/${encodeURIComponent(storeId)}/apps/sales-popup/settings`, locale: await getLocale() });
}
