import { redirectStorelessPath } from "@/lib/navigation/storeless-redirect.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Store-less `/analytics/…` link: the same page of the sidebar's selected store (storeless-routes.lib.ts). */
export default async function StorelessAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ path }, query] = await Promise.all([params, searchParams]);
  return redirectStorelessPath(["analytics", ...(path ?? [])], query);
}
