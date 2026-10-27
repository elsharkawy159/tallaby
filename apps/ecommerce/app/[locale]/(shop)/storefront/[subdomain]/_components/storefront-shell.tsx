import { cn } from "@workspace/ui/lib/utils";
import { SITE_ROOT_CLASS, SiteTheme, bottomNavOn, chromeHasThemeToggle, siteMotionAttrs } from "@workspace/store-sections/render";
import { CarouselRuntime, MotionRuntime } from "@workspace/store-sections/client";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import { CurrencyLabelProvider } from "@/lib/currency-label.client";
import type { Storefront } from "@/lib/storefront.server";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { isStoreOfflineForRequest } from "@/lib/store-site/offline.server";
import { StorefrontHeader } from "./storefront-header";
import { StorefrontFooter } from "./storefront-footer";
import { MobileCartBar } from "./mobile-cart-bar.client";
import { StoreCartSheet } from "./cart-sheet.client";
import { storeFontVariables, storefrontFont } from "./storefront-font";
import { StorefrontTracking } from "./seller-tracking";
import { StoreViewsTag } from "@/components/storefront/store-views-tag.client";
import { readStoreViewsGtmId } from "@/lib/store-views.server";
import { StoreSiteBottomNav, StoreSiteChrome } from "./store-site";
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

  const storeViewsGtmId = readStoreViewsGtmId();

  return (
    <CurrencyLabelProvider label={store.currencyLabel}>
      {/* The theme toggle's init script may set `data-sf-theme` before hydration. */}
      <div className={cn(storefrontFont.variable, s.root, site && [SITE_ROOT_CLASS, storeFontVariables])}
        {...(site && siteMotionAttrs(site.designSystem.motion))}
        suppressHydrationWarning
      >
        {site && <SiteTheme designSystem={site.designSystem} dark={chromeHasThemeToggle(site.header, site.footer)} />}
        {preview && <StorePreviewBanner state={preview} />}
        {site ? <StoreSiteChrome store={store} site={site} locale={locale} part="header" /> : <StorefrontHeader store={store} />}
        <main className="flex-1">{children}</main>
        {site ? <StoreSiteChrome store={store} site={site} locale={locale} part="footer" /> : <StorefrontFooter store={store} />}
        {/* Phones: the bottom navigation (on by default; its cart badge replaces the floating cart bar). */}
        {site && bottomNavOn(site.header) ? <StoreSiteBottomNav site={site} locale={locale} /> : !shared && <MobileCartBar />}
        {/* The cart opens as a sheet from every cart link and after add-to-cart (not on shared pages: orders, checkout). */}
        {!shared && <StoreCartSheet storeName={store.displayName} fontClassName={storefrontFont.variable} />}
        <AuthDialogProvider />
        {site && <CarouselRuntime />}
        {site && <MotionRuntime />}
        {!shared && <StorefrontTracking store={store} />}
        {/* Tallaby's store-views tag (SA-01): published pages only, never a draft preview. */}
        {!shared && !preview && storeViewsGtmId && <StoreViewsTag containerId={storeViewsGtmId} storeId={store.storeId} />}
      </div>
    </CurrencyLabelProvider>
  );
}
