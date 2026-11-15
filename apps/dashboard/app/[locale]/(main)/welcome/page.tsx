import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { storeWelcomeHref } from "../stores/[storeId]/welcome/welcome.lib";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * `/welcome`: the welcome page of the store selected in the sidebar (only
 * ever one of the session seller's own stores; navigation, never a write
 * target). No store yet: My stores, to create one.
 */
export default async function WelcomeRedirectPage({ searchParams }: { searchParams: Promise<{ welcome?: string | string[]; signup?: string | string[] }> }) {
  const query = await searchParams;
  const stores = await getSellerStores().catch((error: unknown) => error);
  if (isAccessError(stores)) redirect({ href: stores.code === "no_seller" ? "/signup" : "/login", locale: await getLocale() });
  if (stores instanceof Error) throw stores;
  const { selected } = stores as Awaited<ReturnType<typeof getSellerStores>>;
  redirect({ href: selected ? storeWelcomeHref(selected.id, query) : "/stores", locale: await getLocale() });
}
