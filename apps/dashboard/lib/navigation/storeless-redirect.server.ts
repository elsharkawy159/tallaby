import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { isStorelessStorePath, storelessTarget } from "./storeless-routes.lib";

/**
 * Sends a store-less link (`/settings/payments`, `/website/design`,
 * `/stores/shipping`, …; `storeless-routes.lib.ts`) to the same page of the
 * store selected in the sidebar: only ever one of the session seller's own
 * stores, navigation, never a write target (CLAUDE.md rule 5). A path that is
 * not a store link 404s before any read. No store yet: My stores, to create
 * one. Like `/welcome` and `/products`: signed out → login, no seller → signup.
 */
export async function redirectStorelessPath(
  pathSegments: string[],
  query: Record<string, string | string[] | undefined>,
): Promise<never> {
  if (!isStorelessStorePath(pathSegments)) notFound();
  const stores = await getSellerStores().catch((error: unknown) => error);
  if (isAccessError(stores)) redirect({ href: stores.code === "no_seller" ? "/signup" : "/login", locale: await getLocale() });
  if (stores instanceof Error) throw stores;
  const { selected } = stores as Awaited<ReturnType<typeof getSellerStores>>;
  const href = selected ? storelessTarget(pathSegments, selected.id, query) : null;
  return redirect({ href: href ?? "/stores", locale: await getLocale() });
}
