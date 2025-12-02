import { Suspense } from "react";
import { getProductBySlug, getAllProductSlugs } from "@/actions/products";
import { ProductDetails } from "./_components/product-details";
import { ProductTabs } from "./_components/product-tabs";
import { SimilarProducts } from "./_components/similar-products";
import { ProductHeroSkeleton } from "./_components/product-hero.skeleton";
import { ProductTabsSkeleton } from "./_components/product-tabs.skeleton";
import { SimilarProductsSkeleton } from "./_components/similar-products.skeleton";

import type {
  Product,
  ProductPageProps,
} from "./_components/product-page.types";
import { ProductHero } from "./_components/product-hero";
import { notFound } from "next/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateProductMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProductStructuredData } from "./_components/product-structured-data";

// ISR: Revalidate every 10 minutes
export const revalidate = 600;

// Generate static params for all product slugs
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
  const { slug } = await params;
  const productResult = await getProductBySlug(slug);
  if (!productResult.success || !productResult.data) {
    return {
      title: "Product Not Found | Tallaby.com",
      description: "The requested product could not be found on Tallaby.com",
    };
  }

  const product = productResult.data;
  const price = (product.price as any) || {};
  // Category is not included in the query, so we use categoryId if needed
  // For metadata, we'll use a fallback
  const category = (product as any).category;

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
            name: category.name ?? "",
            slug: category.slug ?? "",
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
  const { slug } = await params;
  const productResult = await getProductBySlug(slug);
  if (!productResult.success || !productResult.data) {
    notFound();
  }

  const product = productResult.data;

  return (
    <main className="min-h-screen">
      <ProductStructuredData product={product} />
      <section className="bg-white">
        <DynamicBreadcrumb />
      </section>

      <section className="bg-white py-6 lg:py-10">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 md:gap-8 gap-5">
            {/* Product images + hero info */}
            <ProductHero product={product} />
            <ProductDetails product={product} />
          </div>
        </div>
      </section>

      <section>
        {/* <Suspense fallback={<ProductTabsSkeleton />}> */}
        <ProductTabs product={product} />
        {/* </Suspense> */}
      </section>

      {Array.isArray(product.relatedProducts) &&
        product.relatedProducts.length > 0 && (
          <section>
            <Suspense fallback={<SimilarProductsSkeleton />}>
              <SimilarProducts products={product.relatedProducts} />
            </Suspense>
          </section>
        )}
    </main>
  );
}
