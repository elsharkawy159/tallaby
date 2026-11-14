import type { Metadata } from "next";
import { cacheProfiles, createCachedQuery, productTags, storeTags } from "@workspace/cache";
import { redirect } from "next/navigation";
import { storeLocalePath } from "@workspace/lib/storefront";
import { getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { productPageOf } from "@workspace/store-sections/config";
import { cn } from "@workspace/ui/lib/utils";
import { socialShareImage } from "@/lib/metadata";
import { getProductBySlug } from "@/actions/products";
import { Link } from "@/i18n/navigation";
import { getProductIdBySlug, getProductSlugForLocaleStrict, type ProductLocale } from "@/lib/product-translations";
import { resolveStorefront } from "@/lib/storefront.server";
import { isSwitchOn } from "@/lib/platform-switches.server";
import { isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { storePageMetadata } from "@/lib/store-seo/store-seo.lib";
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

/**
 * The product's path in each language with a real translation, under the rule
 * the sitemap lists it: slugs differ per language, and a slug another product of
 * this seller holds would open that product. A page opened through the other
 * language's slug names the real one as canonical, so a product has one URL per language.
 */
/**
 * Cached per seller and store (every product write bumps `productTags.seller`
 * and the product's `productTags.store`), with the catalog-split switch in the
 * key (F-87c): it runs in the metadata of every product page view and is up to
 * six slug queries.
 */
const storeProductPaths = createCachedQuery({
  name: "storefront:product-paths:v2",
  ttl: cacheProfiles.detail,
  tags: (sellerId: string, storeId: string, _productId: string, _slug: string, _locale: string, _catalogSplit: boolean) => [
    productTags.seller(sellerId),
    productTags.store(sellerId, storeId),
    storeTags.catalog(sellerId, storeId),
  ],
  query: loadStoreProductPaths,
});

async function loadStoreProductPaths(sellerId: string, storeId: string, productId: string, slug: string, locale: string, catalogSplit: boolean) {
  const paths: Partial<Record<ProductLocale, string>> = {};
  const scope = { sellerId, storeId, catalogSplit };
  await Promise.all(
    (["ar", "en"] as const).map(async (l) => {
      const own = await getProductSlugForLocaleStrict(productId, l);
      if (own && (await getProductIdBySlug(own, l, scope)) === productId) paths[l] = `/products/${encodeURIComponent(own)}`;
    }),
  );
  return Object.keys(paths).length ? paths : { [locale === "en" ? "en" : "ar"]: `/products/${slug}` };
}

/**
 * Only this store's products open inside its storefront: the slug is looked up
 * in the store behind this host (the subdomain proxy.ts took from the request
 * host), as slugs repeat across sellers, and `getProductBySlug` returns only a
 * product the store shows (`productInStore`, scope `shown`: its picks in
 * selected catalog mode (D24), its own products after the catalog split). A slug
 * the store doesn't show (an old link, another seller's or store's product)
 * sends the shopper to the store's home, never to tallaby.com (owner, 2026-11-03).
 */
async function resolveStoreProduct(locale: string, subdomain: string, slug: string) {
  const store = await resolveStorefront(subdomain);
  const result = await getProductBySlug(store.id, store.storeId, slug, locale as ProductLocale);
  const product = result.success ? (result.data as Product | undefined) : undefined;

  // The store's home in this language ("/" in its default language).
  if (!product) redirect(storeLocalePath(locale, "/", store.defaultLocale));
  if (product.sellerId !== store.id) redirect(storeLocalePath(locale, "/", store.defaultLocale));
  return { store, product };
}

export async function generateMetadata({
  params,
}: StorefrontProductPageProps): Promise<Metadata> {
  const { locale, subdomain, slug } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { store, product } = await resolveStoreProduct(locale, subdomain, slug);
  const firstImage = (product.images as string[] | undefined)?.find((i) => i?.trim());
  // Seller-entered SEO (dashboard product form) wins over the name and short description.
  const seo = (product as { seo?: { metaTitle?: string; metaDescription?: string; metaKeywords?: string[] } }).seo;
  const keywords = seo?.metaKeywords?.filter((k) => typeof k === "string" && k.trim());

  return {
    // The store's own page is the real copy: there are no marketplace product pages.
    ...storePageMetadata(store, locale, {
      paths: await storeProductPaths(store.id, store.storeId, product.id, slug, locale, await isSwitchOn("stores_catalog_split")),
      title: seo?.metaTitle?.trim() || product.title,
      description: seo?.metaDescription?.trim() || product.description,
      // The first product photo, cropped to the 1200×630 share card; else the store's share image.
      image: firstImage ? socialShareImage(firstImage) : null,
      imageAlt: firstImage ? product.title : undefined,
      // The price shown on load (default variant, else the product), in the store's currency.
      price: { amount: productPricing(product, getDefaultProductVariant(product.productVariants)).price, currency: store.currency },
    }),
    ...(keywords?.length ? { keywords } : {}),
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
          store={store}
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
        store={store}
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
