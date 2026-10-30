import { cn } from "@workspace/ui/lib/utils";
import { SITE_ROOT_CLASS, SiteTheme, bottomNavOn, chromeHasThemeToggle, designSystemToCss, siteMotionAttrs } from "@workspace/store-sections/render";
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
import { pickStoreCouponOffer } from "@workspace/lib/orders/coupon-popup";
import { StoreOfferProvider } from "@/components/storefront/store-offer.client";
import { getCachedSellerPopupCoupons } from "@/lib/store-site/store-data.server";
import { CouponOfferPopup } from "./coupon-offer-popup.client";
import { loadStoreSalesFeed } from "@/lib/store-site/sales-popup.server";
import { SalesPopup } from "./sales-popup.client";
import { StoreOffline } from "./store-offline";
import { CampaignCapture } from "./campaign-capture.client";
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
  // The seller's coupon pop-up (0114); a failed read only loses the pop-up.
  const offer = shared
    ? null
    : pickStoreCouponOffer(
        await getCachedSellerPopupCoupons(store.id).catch((error) => {
          console.error("Store coupon pop-up failed to load:", error);
          return [];
        }),
      );
  // Sales pop-up (F-22): real recent orders of this store. Not on shared pages
  // (checkout, orders, account) and never in a builder draft preview.
  const salesFeed = shared || preview ? [] : await loadStoreSalesFeed(store, locale);

  return (
    <CurrencyLabelProvider label={store.currencyLabel}>
    <StoreOfferProvider offer={offer}>
      {/* The theme toggle's init script may set `data-sf-theme` before hydration. */}
      <div className={cn(storefrontFont.variable, s.root, site && [SITE_ROOT_CLASS, storeFontVariables])}
        {...(site && siteMotionAttrs(site.designSystem.motion))}
        suppressHydrationWarning
      >
        {site && <SiteTheme designSystem={site.designSystem} dark={chromeHasThemeToggle(site.header, site.footer)} />}
        {/* Dialogs, popovers and toasts render in <body>, outside the site root: give them the store's colors too. */}
        {site && <style dangerouslySetInnerHTML={{ __html: designSystemToCss(site.designSystem, "body").replace(/</g, "\\3c ") }} />}
        {preview && <StorePreviewBanner state={preview} />}
        {site ? <StoreSiteChrome store={store} site={site} locale={locale} part="header" /> : <StorefrontHeader store={store} />}
        <main className="flex-1">{children}</main>
        {site ? <StoreSiteChrome store={store} site={site} locale={locale} part="footer" /> : <StorefrontFooter store={store} />}
        {/* Phones: the bottom navigation (on by default; its cart badge replaces the floating cart bar). */}
        {site && bottomNavOn(site.header) ? <StoreSiteBottomNav site={site} locale={locale} /> : !shared && <MobileCartBar />}
        {/* The cart opens as a sheet from every cart link and after add-to-cart (not on shared pages: orders, checkout). */}
        {!shared && <StoreCartSheet storeName={store.displayName} minOrder={store.minOrder} fontClassName={cn(storefrontFont.variable, site && [SITE_ROOT_CLASS, storeFontVariables])} />}
        <AuthDialogProvider />
        {site && <CarouselRuntime />}
        {site && <MotionRuntime />}
        {!shared && <StorefrontTracking store={store} />}
        {/* First-touch UTM cookie for the Campaigns report (ROADMAP.md F-26a); client-only, pages stay cached. */}
        {!shared && !preview && <CampaignCapture />}
        {/* Tallaby's store-views tag (SA-01): published pages only, never a draft preview. */}
        {!shared && !preview && storeViewsGtmId && <StoreViewsTag containerId={storeViewsGtmId} storeId={store.storeId} />}
        {salesFeed.length > 0 && (
          <SalesPopup items={salesFeed} delaySeconds={store.salesPopup.delaySeconds} pages={store.salesPopup.pages} />
        )}
        {offer && <CouponOfferPopup fontClassName={cn(storefrontFont.variable, site && [SITE_ROOT_CLASS, storeFontVariables])} />}
      </div>
    </StoreOfferProvider>
    </CurrencyLabelProvider>
  );
}
