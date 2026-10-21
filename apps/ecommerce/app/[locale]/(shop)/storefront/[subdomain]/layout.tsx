import type { Metadata } from "next";
import { isStorefrontIndexable, resolveStorefront } from "@/lib/storefront.server";
import { buildStoreMetadata } from "@/lib/store-seo/store-seo.lib";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { isStoreOfflineForRequest, STORE_OFFLINE_ROBOTS } from "@/lib/store-site/offline.server";
import { StorefrontShell } from "./_components/storefront-shell";

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
  return (
    <StorefrontShell store={store} locale={locale}>
      {children}
    </StorefrontShell>
  );
}
