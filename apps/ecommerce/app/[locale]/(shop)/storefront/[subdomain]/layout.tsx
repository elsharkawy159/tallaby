import type { Metadata } from "next";
import { cn } from "@workspace/ui/lib/utils";
import { AuthDialogProvider } from "@/components/auth/auth-dialog-provider";
import { isStorefrontIndexable, resolveStorefront } from "@/lib/storefront.server";
import { buildStoreMetadata } from "@/lib/store-seo/store-seo.lib";
import { StorefrontHeader } from "./_components/storefront-header";
import { StorefrontFooter } from "./_components/storefront-footer";
import { MobileCartBar } from "./_components/mobile-cart-bar.client";
import { ByTallabyBadge } from "./_components/by-tallaby-badge";
import { storeFontVariables, storefrontFont } from "./_components/storefront-font";
import { StorefrontTracking } from "./_components/seller-tracking";
import { StoreSiteChrome } from "./_components/store-site";
import { SITE_ROOT_CLASS, SiteTheme } from "@workspace/store-sections/render";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { isStoreOfflineForRequest, STORE_OFFLINE_ROBOTS } from "@/lib/store-site/offline.server";
import { StorePreviewBanner } from "./_components/store-preview-banner";
import { StoreOffline } from "./_components/store-offline";
import { CurrencyLabelProvider } from "@/lib/currency-label.client";
import s from "./storefront.module.css";

type StorefrontLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; subdomain: string }>;
};

export async function generateMetadata({
  params,
}: StorefrontLayoutProps): Promise<Metadata> {
  const { locale, subdomain } = await params;
  const store = await resolveStorefront(subdomain);
  const { preview } = await getStorefrontSite(store.id, store.storeId, store.subdomain);
  // The seller took the website offline: never indexed, whatever the page.
  if (await isStoreOfflineForRequest(store)) {
    return { ...buildStoreMetadata(store, locale, { indexable: false }), robots: STORE_OFFLINE_ROBOTS };
  }
  // SEO settings (P4-14) apply at once; noindex while the store shows no
  // products, the seller switched indexing off (P5-04), or in a draft preview (§10.5).
  return buildStoreMetadata(store, locale, { indexable: !preview && (await isStorefrontIndexable(store)) });
}

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps) {
  const { locale, subdomain } = await params;
  const store = await resolveStorefront(subdomain);
  // A published builder site replaces the default header/footer (P5-01).
  // In "Preview on my store" (P4-08) this is the verified draft instead.
  const { site, preview } = await getStorefrontSite(store.id, store.storeId, store.subdomain);

  // Website switched off by the seller: every route shows the offline page,
  // without the store's header, footer, cart or tracking. A verified draft
  // preview still renders the store below.
  if (await isStoreOfflineForRequest(store)) {
    return (
      <div className={cn(storefrontFont.variable, s.root)}>
        {preview && <StorePreviewBanner state={preview} />}
        <StoreOffline store={store} />
      </div>
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
        <MobileCartBar />
        <ByTallabyBadge />
        <AuthDialogProvider />
        <StorefrontTracking store={store} />
      </div>
    </CurrencyLabelProvider>
  );
}
