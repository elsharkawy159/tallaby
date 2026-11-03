import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { storeUrl } from "@workspace/lib/storefront";
import { productPageOf } from "@workspace/store-sections/config";
import { cn } from "@workspace/ui/lib/utils";
import { socialShareImageUrl } from "@/lib/metadata";
import { getProductBySlug } from "@/actions/products";
import { Link } from "@/i18n/navigation";
import type { ProductLocale } from "@/lib/product-translations";
import { resolveStorefront, storeShowsProduct } from "@/lib/storefront.server";
import { isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { getStorefrontSite } from "@/lib/store-site/preview.server";
import { getDefaultProductVariant } from "@/lib/product-variants";
import { MetaViewContent } from "@/components/meta/meta-view-content.client";
import { ProductDisplay } from "@/components/product-page/product-display.client";
import { ProductContent } from "@/components/product-page/product-content";
import { ProductTabsWrapper } from "@/components/product-page/product-tabs-wrapper.client";
import { ProductPageDeepLink, ProductPageProvider } from "@/components/product-page/product-page-provider.client";
import { productPricing } from "@/components/product-page/product-page.lib";
import { ProductStructuredData } from "@/components/product-page/product-structured-data";
import type { Product } from "@/components/product-page/product-page.types";
import { StoreProductPage } from "../../_components/store-product-page";
import s from "../../storefront.module.css";

type StorefrontProductPageProps = {
  params: Promise<{ locale: string; subdomain: string; slug: string }>;
};

/** This store's own address for the product, in one language. */
function storeProductUrl(store: { subdomain: string; customDomain?: string | null }, locale: string, slug: string) {
  return `${storeUrl(store.subdomain, store.customDomain)}${locale === "ar" ? "" : `/${locale}`}/products/${slug}`;
}

/**
 * Only this seller's products open inside their storefront; another seller's
 * product (an old link, a related item) or an unknown one sends the shopper to
 * the store's home, never to tallaby.com (owner, 2026-11-03).
 */
async function resolveStoreProduct(locale: string, subdomain: string, slug: string) {
  const store = await resolveStorefront(subdomain);
  const result = await getProductBySlug(slug, locale as ProductLocale);
  const product = result.success ? (result.data as Product | undefined) : undefined;

  if (!product) redirect(locale === "ar" ? "/" : `/${locale}`);
  if (product.sellerId !== store.id) redirect(locale === "ar" ? "/" : `/${locale}`);
  // A store with a selected catalog (D24) only opens its picks.
  if (!(await storeShowsProduct(store, product.id))) redirect(locale === "ar" ? "/" : `/${locale}`);
  return { store, product };
}

export async function generateMetadata({
  params,
}: StorefrontProductPageProps): Promise<Metadata> {
  const { locale, subdomain, slug } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { store, product } = await resolveStoreProduct(locale, subdomain, slug);
  const canonical = storeProductUrl(store, locale, slug);
  const firstImage = (product.images as string[] | undefined)?.find((i) => i?.trim());
  // Seller-entered SEO (dashboard product form) wins over the name and short description.
  const seo = (product as { seo?: { metaTitle?: string; metaDescription?: string; metaKeywords?: string[] } }).seo;
  const keywords = seo?.metaKeywords?.filter((k) => typeof k === "string" && k.trim());

  return {
    title: seo?.metaTitle?.trim() || product.title,
    description: seo?.metaDescription?.trim() || product.description || undefined,
    ...(keywords?.length ? { keywords } : {}),
    // The store's own page is the real copy: there are no marketplace product pages.
    alternates: {
      canonical,
      languages: {
        ar: storeProductUrl(store, "ar", slug),
        en: storeProductUrl(store, "en", slug),
        "x-default": storeProductUrl(store, "ar", slug),
      },
    },
    openGraph: {
      url: canonical,
      ...(firstImage && { images: [{ url: socialShareImageUrl(firstImage), alt: product.title }] }),
    },
  };
}

export default async function StorefrontProductPage({ params }: StorefrontProductPageProps) {
  const { locale, subdomain, slug } = await params;
  // Website offline: the layout shows the offline page instead.
  if (await isSubdomainOfflineForRequest(subdomain)) return null;
  const [{ store, product }, t, tBreadcrumb] = await Promise.all([
    resolveStoreProduct(locale, subdomain, slug),
    getTranslations("storefront"),
    getTranslations("breadcrumb"),
  ]);

  // The site's own product page (spec §5.4): the published site, or the
  // verified draft in a builder preview, as every other store page.
  const { site } = await getStorefrontSite(store.id, store.storeId, store.subdomain);
  if (site && productPageOf(site)) {
    // ViewContent carries the price shown on load: the default variant's, else the product's.
    const { price } = productPricing(product, getDefaultProductVariant(product.productVariants));
    return (
      <ProductPageProvider product={product}>
        <ProductStructuredData
          product={product}
          locale={locale as ProductLocale}
          homeLabel={tBreadcrumb("home")}
          store={{ url: storeUrl(store.subdomain, store.customDomain), name: store.displayName }}
        />
        <MetaViewContent productId={product.id} value={price} />
        <ProductPageDeepLink />
        <StoreProductPage store={store} site={site} locale={locale} product={product} />
      </ProductPageProvider>
    );
  }

  return (
    <>
      <ProductStructuredData
        product={product}
        locale={locale as ProductLocale}
        homeLabel={tBreadcrumb("home")}
        store={{ url: storeUrl(store.subdomain, store.customDomain), name: store.displayName }}
      />
      <div className={cn(s.wrap, "pt-6 pb-10")}>
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-(--sf-muted) hover:text-(--sf-ink)"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("backToStore", { store: store.displayName })}
        </Link>
        <ProductDisplay product={product} />
      </div>
      <ProductContent html={product.content} dir={locale === "ar" ? "rtl" : "ltr"} />
      <ProductTabsWrapper product={product} />
    </>
  );
}
