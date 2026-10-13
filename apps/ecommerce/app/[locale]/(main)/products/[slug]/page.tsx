import { Suspense } from "react";
import { getProductBySlug } from "@/actions/products";
import { ProductTabsWrapper } from "./_components/product-tabs-wrapper.client";
import { SimilarProducts } from "./_components/similar-products";
import { SimilarProductsSkeleton } from "./_components/similar-products.skeleton";

import type {
  Product,
  ProductPageProps,
} from "./_components/product-page.types";
import { ProductDisplay } from "./_components/product-display.client";
import { ProductContent } from "./_components/product-content";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import {
  generateProductMetadata,
  productOpenGraphTags,
} from "@/lib/metadata";
import type { Metadata } from "next";
import { ProductStructuredData } from "./_components/product-structured-data";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  getProductIdBySlug,
  getProductLocaleFromSlug,
  getProductSlugForLocaleStrict,
  type ProductLocale,
} from "@/lib/product-translations";
import { AffiliateCouponCapture } from "@/components/product/affiliate-coupon-capture.client";
import { parsePriceJson } from "@workspace/lib";

// ISR: render product pages on first request, cache for 10 minutes
export const revalidate = 600;

// All product pages are generated on demand (see generateStaticParams below)
// and cached per dynamicParams, instead of at build time.
export const dynamicParams = true;

// Pre-rendering every product x locale at build time doesn't scale with the
// catalog and dominates Vercel Build CPU minutes. Rely on dynamicParams +
// ISR instead: the first request (including a crawler) renders and caches
// the page, so SEO/discoverability is unaffected (products remain in the
// sitemap via getAllProductTranslationSlugs), but the build itself no
// longer has to render every product.
export async function generateStaticParams() {
  return [];
}

/** locale is validated + the product resolved once, then reused by page/metadata. */
async function resolveProduct(locale: string, slug: string) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const productResult = await getProductBySlug(slug, locale as ProductLocale);
  if (productResult.success && productResult.data) {
    const product = productResult.data;
    // Reached through a non-canonical slug (the other locale's slug, or an
    // old one): 308 to the canonical URL instead of serving a duplicate.
    if (product.slug && product.slug !== decodeURIComponent(slug)) {
      permanentRedirect({
        href: `/products/${product.slug}`,
        locale: locale as ProductLocale,
      });
    }
    return { locale: locale as ProductLocale, product };
  }

  // Slug might belong to the other locale — permanently redirect to the
  // canonical URL so search engines consolidate signals there (a temporary
  // redirect keeps the wrong URL indexed).
  const actualLocale = await getProductLocaleFromSlug(slug);
  if (actualLocale !== locale) {
    const otherResult = await getProductBySlug(slug, actualLocale);
    if (otherResult.success && otherResult.data) {
      permanentRedirect({ href: `/products/${slug}`, locale: actualLocale });
    }
  }

  // Unknown / deleted product: a real 404. Redirecting to the catalog was a
  // soft-404 to Google, which kept dead URLs around instead of dropping them.
  notFound();
}

/** Shared SEO input for the <head> metadata and the in-page Open Graph product tags. */
function productSeoInput(product: Product, locale: ProductLocale) {
  const price = parsePriceJson(product.price);
  const category = product.category;
  const categoryName = category
    ? locale === "ar"
      ? category.nameAr || category.name || ""
      : category.name || ""
    : "Products";

  return {
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    price: {
      final: price.final,
      list: price.list ?? price.final,
    },
    images: Array.isArray(product.images) ? (product.images as string[]) : [],
    brand: {
      name: product.brand?.name ?? "",
    },
    category: {
      name: categoryName,
      slug: category?.slug || "products",
    },
    averageRating: Number(product.averageRating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    // Same rule as the JSON-LD offer availability.
    inStock: product.status === "active" && Number(product.quantity ?? 0) > 0,
    metaTitle: product.seo?.metaTitle,
    metaDescription: product.seo?.metaDescription,
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { product } = await resolveProduct(locale, slug);

  const otherLocale: ProductLocale = locale === "en" ? "ar" : "en";
  const translatedSlug = await getProductSlugForLocaleStrict(
    product.id,
    otherLocale
  );
  // Slugs aren't unique: if another product owns that slug in the other
  // locale, the URL renders that product, so it is not this page's
  // translation (the sitemap applies the same rule).
  const alternateSlug =
    translatedSlug &&
    (await getProductIdBySlug(translatedSlug, otherLocale)) === product.id
      ? translatedSlug
      : null;

  return generateProductMetadata({
    locale: locale as ProductLocale,
    alternateSlug,
    product: productSeoInput(product, locale as ProductLocale),
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations("product");
  const tBreadcrumb = await getTranslations("breadcrumb");
  const { product } = await resolveProduct(locale, slug);

  const productWithCategory: Product = product;

  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <AffiliateCouponCapture />
      </Suspense>
      <ProductStructuredData
        product={productWithCategory}
        locale={locale as ProductLocale}
        homeLabel={tBreadcrumb("home")}
      />
      {/* Open Graph product:* tags need property=, which the Metadata API's
          `other` can't emit (it renders name=); React hoists these into <head>. */}
      {Object.entries(
        productOpenGraphTags(productSeoInput(product, locale as ProductLocale))
      ).map(([property, content]) => (
        <meta key={property} property={property} content={content} />
      ))}
      <section className="bg-white">
        {/* Label the slug segment with the localized product title (the
            pathname segment may arrive percent-encoded for Arabic slugs). */}
        <DynamicBreadcrumb
          customLabels={{
            [decodeURIComponent(slug)]: product.title,
            [encodeURIComponent(decodeURIComponent(slug))]: product.title,
          }}
        />
      </section>

      <section className="bg-white pb-10 lg:pt-5">
        <div className="container">
          <ProductDisplay product={productWithCategory} />
        </div>
      </section>

      <ProductContent
        html={productWithCategory.content}
        dir={locale === "ar" ? "rtl" : "ltr"}
      />

      <section>
        <ProductTabsWrapper product={productWithCategory} />
      </section>

      {Array.isArray(productWithCategory.relatedProducts) &&
        productWithCategory.relatedProducts.length > 0 && (
          <section>
            <Suspense fallback={<SimilarProductsSkeleton />}>
              <SimilarProducts
                products={productWithCategory.relatedProducts}
                title={t("relatedProducts")}
              />
            </Suspense>
          </section>
        )}
    </main>
  );
}
