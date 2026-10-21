import type { ReactNode } from "react";
import { getRequestStoreSubdomain, getStorefrontBySubdomain } from "@/lib/storefront.server";
import { StorefrontShell } from "@/app/[locale]/(shop)/storefront/[subdomain]/_components/storefront-shell";

/**
 * Pages a store host shares with the marketplace (orders, profile, checkout,
 * sign-in, policies): on a store's website they wear that store's header,
 * footer and design system; anywhere else, `fallback` (Tallaby's chrome).
 * The store comes from the request host only.
 */
export async function StoreHostShell({
  locale,
  fallback,
  children,
}: {
  locale: string;
  fallback: (children: ReactNode) => ReactNode;
  children: ReactNode;
}) {
  const subdomain = await getRequestStoreSubdomain();
  const store = subdomain ? await getStorefrontBySubdomain(subdomain) : null;
  if (!store) return fallback(children);
  return (
    <StorefrontShell store={store} locale={locale} shared>
      {children}
    </StorefrontShell>
  );
}
