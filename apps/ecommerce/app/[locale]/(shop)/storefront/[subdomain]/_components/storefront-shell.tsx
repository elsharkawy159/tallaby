import { cn } from "@workspace/ui/lib/utils";
import { SITE_ROOT_CLASS, SiteTheme } from "@workspace/store-sections/render";
import { CarouselRuntime } from "@workspace/store-sections/client";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import { CurrencyLabelProvider } from "@/lib/currency-label.client";
import type { Storefront } from "@/lib/storefront.server";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { isStoreOfflineForRequest } from "@/lib/store-site/offline.server";
import { StorefrontHeader } from "./storefront-header";
import { StorefrontFooter } from "./storefront-footer";
import { MobileCartBar } from "./mobile-cart-bar.client";
import { ByTallabyBadge } from "./by-tallaby-badge";
import { storeFontVariables, storefrontFont } from "./storefront-font";
import { StorefrontTracking } from "./seller-tracking";
import { StoreSiteChrome } from "./store-site";
import { StorePreviewBanner } from "./store-preview-banner";
import { StoreOffline } from "./store-offline";
import s from "../storefront.module.css";

/**
 * The store's own look around a page: its published header, footer and
 * design system, or the default storefront chrome. Used by the storefront
 * layout and by the pages a store host shares with the marketplace (orders,
 * profile, checkout, sign-in), so a shopper never sees Tallaby's chrome on
 * a store's website.
 *
 * `shared`: a shared page (see StoreHostShell). It keeps working while the
 * store is offline (a shopper can still see or cancel an order), without
 * the store's chrome, and brings no tracking or cart bar (those pages load
 * HostStoreTracking themselves where they need it).
 */
export async function StorefrontShell({
  store,
  locale,
  shared = false,
  children,
}: {
  store: Storefront;
  locale: string;
  shared?: boolean;
  children: React.ReactNode;
}) {
  // A published builder site replaces the default header/footer (P5-01).
  // In "Preview on my store" (P4-08) this is the verified draft instead.
  const { site, preview } = await getStorefrontSite(store.id, store.storeId, store.subdomain);

  // Website switched off by the seller: storefront routes show the offline
  // page, without the store's header, footer, cart or tracking. A verified
  // draft preview still renders the store below.
  if (await isStoreOfflineForRequest(store)) {
    return (
      <CurrencyLabelProvider label={store.currencyLabel}>
        <div className={cn(storefrontFont.variable, s.root)}>
          {preview && <StorePreviewBanner state={preview} />}
          {shared ? <main className="flex-1">{children}</main> : <StoreOffline store={store} />}
        </div>
      </CurrencyLabelProvider>
    );
  }

  return (
    <CurrencyLabelProvider label={store.currencyLabel}>
      <div className={cn(storefrontFont.variable, s.root, site && [SITE_ROOT_CLASS, storeFontVariables])}>
        {preview && <StorePreviewBanner state={preview} />}
        {site && <SiteTheme designSystem={site.designSystem} />}
        {site ? <StoreSiteChrome store={store} site={site} locale={locale} part="header" /> : <StorefrontHeader store={store} />}
        <main className="flex-1">{children}</main>
        {site ? <StoreSiteChrome store={store} site={site} locale={locale} part="footer" /> : <StorefrontFooter store={store} />}
        {!shared && <MobileCartBar />}
        <ByTallabyBadge />
        <AuthDialogProvider />
        {site && <CarouselRuntime />}
        {!shared && <StorefrontTracking store={store} />}
      </div>
    </CurrencyLabelProvider>
  );
}
