import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { storeUrl } from "@workspace/lib/storefront";
import { routing } from "@/i18n/routing";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { catalogStoreId, getStorefrontCategories, resolveStorefront } from "@/lib/storefront.server";
import { marketplaceOrigin } from "@/lib/storefront-routing";
import { StoreSitePage } from "../../_components/store-site";

type StorePageProps = {
  params: Promise<{ locale: string; subdomain: string; pageSlug: string }>;
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
  if (!site || !page) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    redirect(`${marketplaceOrigin()}${prefix}/${pageSlug}`);
  }
  return { store, site, page, preview };
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { locale, subdomain, pageSlug } = await params;
  const { store, page, preview } = await resolvePage(locale, subdomain, pageSlug);
  const url = `${storeUrl(store.subdomain, store.customDomain)}${locale === routing.defaultLocale ? "" : `/${locale}`}/${page.slug}`;
  return {
    title: page.seo.title || page.name,
    description: page.seo.description || undefined,
    alternates: { canonical: url },
    robots: preview ? { index: false, follow: false } : page.seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: page.seo.ogImage ? { images: [{ url: page.seo.ogImage }] } : undefined,
  };
}

export default async function StoreBuilderPage({ params }: StorePageProps) {
  const { locale, subdomain, pageSlug } = await params;
  const { store, site, page } = await resolvePage(locale, subdomain, pageSlug);
  if (!page) notFound();
  const categories = await getStorefrontCategories(store.id, catalogStoreId(store));
  return (
    <StoreSitePage
      store={store}
      site={site}
      page={page}
      locale={locale}
      classic={{ categories, query: { page: 1 } }}
    />
  );
}
