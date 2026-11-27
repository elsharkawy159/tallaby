import { redirectStorelessPath } from "@/lib/navigation/storeless-redirect.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * The old account settings page (owner, 2026-11-27): there is one settings
 * area now, the store's. `/settings` opens Store settings of the sidebar's
 * selected store (no store yet: My stores). Policies, contact and phone
 * alerts are pages of that menu; an old `/settings#policies` link keeps its
 * hash and the menu sends it on (store-settings-tabs.client.tsx).
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return redirectStorelessPath(["stores", "settings"], await searchParams);
}
