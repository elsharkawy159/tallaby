import { Suspense } from "react";
import { getProductBySlug, getAllProductSlugs } from "@/actions/products";
import { ProductTabsWrapper } from "./_components/product-tabs-wrapper.client";
import { SimilarProducts } from "./_components/similar-products";
import { SimilarProductsSkeleton } from "./_components/similar-products.skeleton";

import type {
  Product,
  ProductPageProps,
} from "./_components/product-page.types";
import { ProductDisplay } from "./_components/product-display.client";
import { notFound } from "next/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateProductMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProductStructuredData } from "./_components/product-structured-data";
import { getLocale, getTranslations } from "next-intl/server";

// ISR: pre-render product pages at build time, revalidate every 10 minutes
export const revalidate = 600;

// On-demand ISR for products not in the build-time set
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugsResult = await getAllProductSlugs();

  if (!slugsResult.success || !slugsResult.data) {
    return [];
  }

  return slugsResult.data.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const t = await getTranslations("product")
  const locale = (await getLocale()) as "en" | "ar"
  const productResult = await getProductBySlug(slug, locale)
  if (!productResult.success || !productResult.data) {
    return {
      title: `${t("productNotFound")} | Tallaby.com`,
      description: t("productNotFoundDescription"),
    };
  }

  const product = productResult.data;
  const price = (product.price as any) || {};
  // Category is not included in the query, so we use categoryId if needed
  // For metadata, we'll use a fallback
  const category = (product as any).category;
  const categoryName = category
    ? locale === "ar"
      ? category.nameAr || category.name || ""
      : category.name || ""
    : "Products";
  const categorySlug = category?.slug || "products";

  return generateProductMetadata({
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
  const { slug } = await params
  const locale = (await getLocale()) as "en" | "ar"
  const productResult = await getProductBySlug(slug, locale)
  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const product = productResult.data;

  // Type assertion needed because category might not be included in query
  const productWithCategory: Product = {
    ...product,
    category: (product as any).category || null,
  };

  return (
    <main className="min-h-screen">
      <ProductStructuredData product={productWithCategory} locale={locale} />
      <section className="bg-white">
        <DynamicBreadcrumb />
      </section>

      <section className="bg-white py-5 pb-10">
        <div className="container">
          <ProductDisplay product={productWithCategory} />
        </div>
      </section>

      <section>
        <ProductTabsWrapper product={productWithCategory} />
      </section>

      {Array.isArray(productWithCategory.relatedProducts) &&
        productWithCategory.relatedProducts.length > 0 && (
          <section>
            <Suspense fallback={<SimilarProductsSkeleton />}>
              <SimilarProducts products={productWithCategory.relatedProducts} />
            </Suspense>
          </section>
        )}
    </main>
  );
}
