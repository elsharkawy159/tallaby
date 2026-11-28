import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/**
 * The store welcome page was removed (owner, 2026-11-28): the home's setup
 * steps replace it. Old links (bookmarks, emails) land on the home.
 */
export default async function StoreWelcomeRemovedPage() {
  redirect({ href: "/", locale: await getLocale() });
}
