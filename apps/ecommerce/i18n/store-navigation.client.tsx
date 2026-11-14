"use client";

/**
 * Locale-aware links that follow the store's default language (owner,
 * 2026-11-14). On an English-default store's host the unprefixed address is
 * English and Arabic lives under /ar, so `Link`, `useRouter` and
 * `usePathname` switch to that routing inside `StoreDefaultLocaleProvider`
 * (mounted by the storefront shell, which knows the store). Everywhere else
 * (tallaby.com, Arabic-default stores) they are next-intl's, exactly as before.
 *
 * Imported through `@/i18n/navigation`; never import this file directly.
 */
import { createNavigation } from "next-intl/navigation";
import { createContext, forwardRef, useContext, type ComponentProps, type ReactNode } from "react";
import { routing, storeEnglishRouting, type AppLocale } from "./routing";

const arabicFirst = createNavigation(routing);
const englishFirst = createNavigation(storeEnglishRouting);

const StoreDefaultLocaleContext = createContext<AppLocale>(routing.defaultLocale);

/** The store's default language (what its unprefixed address shows) for every link below it. */
export function StoreDefaultLocaleProvider({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  return <StoreDefaultLocaleContext.Provider value={locale}>{children}</StoreDefaultLocaleContext.Provider>;
}

/** The store's default language (Arabic outside a store, and on Arabic-default stores). */
export function useStoreDefaultLocale(): AppLocale {
  return useContext(StoreDefaultLocaleContext);
}

/** The navigation of the current store host: both implementations call the same hooks in the same order. */
function useStoreNavigation() {
  return useContext(StoreDefaultLocaleContext) === "en" ? englishFirst : arabicFirst;
}

type LinkProps = Omit<ComponentProps<typeof arabicFirst.Link>, "ref">;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function StoreAwareLink(props, ref) {
  const { Link: NavLink } = useStoreNavigation();
  return <NavLink ref={ref} {...props} />;
});

export function useRouter(): ReturnType<typeof arabicFirst.useRouter> {
  return useStoreNavigation().useRouter();
}

export function usePathname(): ReturnType<typeof arabicFirst.usePathname> {
  return useStoreNavigation().usePathname();
}
