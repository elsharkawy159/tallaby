import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { storeUrl } from "@workspace/lib/storefront";
import { isProductPage } from "@workspace/store-sections/config";
import { routing } from "@/i18n/routing";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { resolveStorefront } from "@/lib/storefront.server";
import { marketplaceOrigin } from "@/lib/storefront-routing";
import { STORE_NOINDEX } from "@/lib/store-seo/store-seo.lib";
import { StoreSitePage } from "../../_components/store-site";

type StorePageProps = {
  params: Promise<{ locale: string; subdomain: string; pageSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * A builder page of this store, e.g. /about (PLAN.md P5-01b). Only published
 * pages exist here; anything else on a store host goes to the marketplace,
 * as unknown paths did before builder pages existed.
 */
async function resolvePage(locale: string, subdomain: string, pageSlug: string) {
  const store = await resolveStorefront(subdomain);
  // In preview (P4-08) this is the verified draft, so unpublished pages open too.
  const { site, preview } = await getStorefrontSite(store.id, store.storeId, store.subdomain);
  const page = site?.pages.find((p) => p.slug === pageSlug && !p.isHome);
  // The product page is a template for /products/{slug}, never a page of its own.
  if (page && isProductPage(page)) notFound();
  if (!site || !page) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    redirect(`${marketplaceOrigin()}${prefix}/${pageSlug}`);
  }
  return { store, site, page, preview };
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { locale, subdomain, pageSlug } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { store, page, preview } = await resolvePage(locale, subdomain, pageSlug);
  const url = `${storeUrl(store.subdomain, store.customDomain)}${locale === routing.defaultLocale ? "" : `/${locale}`}/${page.slug}`;
  return {
    title: page.seo.title || page.name,
    description: page.seo.description || undefined,
    alternates: { canonical: url },
    // Only set when needed: an explicit value would also replace the
    // layout's store-wide noindex (P5-04). Previews are never indexed (P4-08).
    ...((preview || page.seo.noindex) && { robots: STORE_NOINDEX }),
    openGraph: page.seo.ogImage ? { images: [{ url: page.seo.ogImage }] } : undefined,
  };
}

export default async function StoreBuilderPage({ params, searchParams }: StorePageProps) {
  const { locale, subdomain, pageSlug } = await params;
  const { page: pageParam } = await searchParams;
  // Website offline: the layout shows the offline page; no marketplace redirect.
  if (await isSubdomainOfflineForRequest(subdomain)) return null;
  const { store, site, page } = await resolvePage(locale, subdomain, pageSlug);
  if (!page) notFound();
  // Paginated product lists show page `?page=N`.
  const productPage = Math.max(1, Math.floor(Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1));
  return <StoreSitePage store={store} site={site} page={page} locale={locale} productPage={productPage} />;
}
