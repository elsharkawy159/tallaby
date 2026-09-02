import { Suspense } from "react";
import {
  getProductBySlug,
  getAllProductTranslationSlugs,
} from "@/actions/products";
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
import { redirect } from "@/i18n/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateProductMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProductStructuredData } from "./_components/product-structured-data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  getProductLocaleFromSlug,
  getProductSlugForLocaleStrict,
  type ProductLocale,
} from "@/lib/product-translations";

// ISR: pre-render product pages at build time, revalidate every 10 minutes
export const revalidate = 600;

// On-demand ISR for products not in the build-time set
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugsResult = await getAllProductTranslationSlugs();

  if (!slugsResult.success || !slugsResult.data) {
    return [];
  }

  return slugsResult.data.map(({ locale, slug }) => ({
    locale,
    slug,
  }));
}

/** locale is validated + the product resolved once, then reused by page/metadata. */
async function resolveProduct(locale: string, slug: string) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const productResult = await getProductBySlug(slug, locale as ProductLocale);
  if (productResult.success && productResult.data) {
    return { locale: locale as ProductLocale, product: productResult.data };
  }

  // Slug might belong to the other locale — redirect to the canonical URL
  // instead of 404ing, to avoid duplicate-content / wrong-hreflang situations.
  const actualLocale = await getProductLocaleFromSlug(slug);
  if (actualLocale !== locale) {
    const otherResult = await getProductBySlug(slug, actualLocale);
    if (otherResult.success && otherResult.data) {
      redirect({ href: `/products/${slug}`, locale: actualLocale });
    }
  }

  notFound();
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations("product");
  const { product } = await resolveProduct(locale, slug);

  const price = (product.price as any) || {};
  const category = (product as any).category;
  const categoryName = category
    ? locale === "ar"
      ? category.nameAr || category.name || ""
      : category.name || ""
    : "Products";
  const categorySlug = category?.slug || "products";

  const otherLocale: ProductLocale = locale === "en" ? "ar" : "en";
  const alternateSlug = await getProductSlugForLocaleStrict(
    product.id,
    otherLocale
  );

  return generateProductMetadata({
    locale: locale as ProductLocale,
    alternateSlug,
    product: {
      title: product.title,
      slug: product.slug,
      description: product.description ?? "",
      price: {
        final: Number(price.final ?? price.current ?? price.list ?? 0),
        list: Number(price.list ?? price.current ?? price.final ?? 0),
      },
      images: Array.isArray(product.images) ? (product.images as string[]) : [],
      brand: {
        name: product.brand?.name ?? "",
      },
      category: category
        ? {
            name: categoryName,
            slug: categorySlug,
          }
        : {
            name: "Products",
            slug: "products",
          },
      averageRating: Number(product.averageRating ?? 0),
      reviewCount: Number(product.reviewCount ?? 0),
    },
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("product");
  const { product } = await resolveProduct(locale, slug);

  const productWithCategory: Product = product;

  return (
    <main className="min-h-screen">
      <ProductStructuredData
        product={productWithCategory}
        locale={locale as ProductLocale}
      />
      <section className="bg-white">
        <DynamicBreadcrumb />
      </section>

      <section className="bg-white py-5 pb-10">
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
