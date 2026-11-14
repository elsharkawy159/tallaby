import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * `redirect`, `permanentRedirect` and `getPathname` are next-intl's (Arabic
 * unprefixed). On a store host, server code redirects with `storeRedirect`
 * (i18n/store-navigation.server.ts), which follows the store's default
 * language.
 */
export const { redirect, permanentRedirect, getPathname } = createNavigation(routing);

/**
 * Links and the router follow the store's default language on a store host
 * (an English-default store's unprefixed address is English), and are
 * next-intl's everywhere else (store-navigation.client.tsx).
 */
export { Link, StoreDefaultLocaleProvider, usePathname, useRouter, useStoreDefaultLocale } from "./store-navigation.client";
