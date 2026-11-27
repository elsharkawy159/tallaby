import { redirectStorelessPath } from "@/lib/navigation/storeless-redirect.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Store-less `/settings/<store settings page>/…` link (`/settings/payments`):
 * the same page of the sidebar's selected store (storeless-routes.lib.ts).
 * `/settings` (a redirect to Store settings), `/settings/plan` and
 * `/settings/fulfillment` are their own pages and never reach here; any
 * other path 404s.
 */
export default async function StorelessStoreSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storePath: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ storePath }, query] = await Promise.all([params, searchParams]);
  return redirectStorelessPath(["settings", ...storePath], query);
}
