import { createNavigation } from "next-intl/navigation";
import { getRequestStoreDefaultLocale } from "@/lib/storefront.server";
import { routing, storeEnglishRouting } from "./routing";

/**
 * Server-side redirects that follow the store's default language (owner,
 * 2026-11-14): on an English-default store's host "/x" is English and Arabic
 * is "/ar/x". On tallaby.com and Arabic-default stores this is next-intl's
 * `redirect`, exactly as before. The store comes from the request host only.
 */
const arabicFirst = createNavigation(routing);
const englishFirst = createNavigation(storeEnglishRouting);

type RedirectArgs = Parameters<typeof arabicFirst.redirect>[0];

export async function storeRedirect(args: RedirectArgs): Promise<never> {
  const nav = (await getRequestStoreDefaultLocale()) === "en" ? englishFirst : arabicFirst;
  return nav.redirect(args);
}
