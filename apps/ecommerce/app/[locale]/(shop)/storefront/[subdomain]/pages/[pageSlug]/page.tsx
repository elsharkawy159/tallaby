import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isProductPage } from "@workspace/store-sections/config";
import { storeLocalePrefix } from "@workspace/lib/storefront";
import { getTranslations } from "next-intl/server";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { storePageFallback } from "@/lib/store-site/store-policy.lib";
import { loadStorePolicyText } from "@/lib/store-site/store-policy.server";
import { isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { resolveStorefront } from "@/lib/storefront.server";
import { storePageMetadata } from "@/lib/store-seo/store-seo.lib";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { StorePolicyPage } from "../../_components/store-policy-page";
import { StoreSitePage } from "../../_components/store-site";

type StorePageProps = {
  params: Promise<{ locale: string; subdomain: string; pageSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * A builder page of this store, e.g. /about (PLAN.md P5-01b). Only published
 * pages exist here. Without one, footer links stay on the store (F-46): a
 * policy or contact page shows the store's details, and /about and /faq go to
 * its home. Anything else is this store's 404: no store page leaves for
 * tallaby.com (owner, 2026-11-03).
 */
async function resolvePage(locale: string, subdomain: string, pageSlug: string) {
  const store = await resolveStorefront(subdomain);
  // In preview (P4-08) this is the verified draft, so unpublished pages open too.
  const { site, preview } = await getStorefrontSite(store.id, store.storeId, store.subdomain);
  const page = site?.pages.find((p) => p.slug === pageSlug && !p.isHome);
  // The product page is a template for /products/{slug}, never a page of its own.
  if (page && isProductPage(page)) notFound();
  if (!site || !page) {
    const prefix = storeLocalePrefix(locale, store.defaultLocale);
    const fallback = storePageFallback(pageSlug);
    if (fallback === "home") redirect(prefix || "/");
    if (fallback) return { store, policy: fallback.policy, preview } as const;
    notFound();
  }
  return { store, site, page, preview, policy: null } as const;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { locale, subdomain, pageSlug } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const resolved = await resolvePage(locale, subdomain, pageSlug);
  const { store, preview } = resolved;
  const paths = `/${pageSlug}`;
  if (resolved.policy) {
    const t = await getTranslations("storefront.policy");
    const text = await loadStorePolicyText(store.id, resolved.policy);
    return storePageMetadata(store, locale, {
      paths,
      // The store layout's title template adds the store's name.
      title: t(`${resolved.policy}.title`),
      // Nothing of the seller's own to rank, so only their written text is indexed.
      noindex: Boolean(preview) || (!text && resolved.policy !== "contact"),
    });
  }
  const { page } = resolved;
  return storePageMetadata(store, locale, {
    paths,
    title: page.seo.title || page.name,
    description: page.seo.description,
    image: page.seo.ogImage ? getPublicUrl(page.seo.ogImage, "sellers") : null,
    // Only ever adds a noindex, so the layout's store-wide one (P5-04) stays. Previews are never indexed (P4-08).
    noindex: Boolean(preview) || page.seo.noindex,
    // Its own keywords; without them the store keywords of the layout stay.
    keywords: page.seo.keywords,
  });
}

export default async function StoreBuilderPage({ params, searchParams }: StorePageProps) {
  const { locale, subdomain, pageSlug } = await params;
  const { page: pageParam } = await searchParams;
  // Website offline: the layout shows the offline page; no marketplace redirect.
  if (await isSubdomainOfflineForRequest(subdomain)) return null;
  const resolved = await resolvePage(locale, subdomain, pageSlug);
  if (resolved.policy) {
    const text = await loadStorePolicyText(resolved.store.id, resolved.policy);
    return <StorePolicyPage store={resolved.store} kind={resolved.policy} text={text} />;
  }
  const { store, site, page } = resolved;
  if (!page) notFound();
  // Paginated product lists show page `?page=N`.
  const productPage = Math.max(1, Math.floor(Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1));
  return <StoreSitePage store={store} site={site} page={page} locale={locale} productPage={productPage} />;
}
