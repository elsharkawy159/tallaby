import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * next-intl's navigation for tallaby.com (Arabic unprefixed). This app never
 * serves a store host, so it has no store-default-language links
 * (apps/ecommerce/i18n/store-navigation.client.tsx).
 */
export const { Link, redirect, permanentRedirect, getPathname, usePathname, useRouter } = createNavigation(routing);
