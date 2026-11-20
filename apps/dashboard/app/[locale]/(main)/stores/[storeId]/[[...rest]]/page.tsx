import { notFound } from "next/navigation";
import { isUuid } from "@/lib/auth/access.lib";
import { redirectStorelessPath } from "@/lib/navigation/storeless-redirect.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * A `/stores/<x>/…` URL that matches no store page. When `<x>` is a store
 * section rather than a store id (`/stores/website`, `/stores/settings/payments`)
 * it is a store-less link: the same page of the sidebar's selected store
 * (storeless-routes.lib.ts). Everything else, `/stores/<uuid>` and unknown
 * pages of a store included, is a 404 with no read, as before.
 */
export default async function StoresFallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string; rest?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ storeId, rest }, query] = await Promise.all([params, searchParams]);
  if (isUuid(storeId)) notFound();
  return redirectStorelessPath(["stores", storeId, ...(rest ?? [])], query);
}
