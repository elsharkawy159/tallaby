import { Suspense } from "react";
import { getProductBySlug } from "@/actions/products";
import { ProductDetails } from "./_components/product-details";
import { ProductTabs } from "./_components/product-tabs";
import { SimilarProducts } from "./_components/similar-products";
import { ProductHeroSkeleton } from "./_components/product-hero.skeleton";
import { ProductTabsSkeleton } from "./_components/product-tabs.skeleton";
import { SimilarProductsSkeleton } from "./_components/similar-products.skeleton";

import type { Product, ProductPageProps } from "./product-page.types";
import { ProductHero } from "./_components/product-hero";
import { notFound } from "next/navigation";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateProductMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProductStructuredData } from "./_components/product-structured-data";

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

  const raw = productResult.data as any;
  const product = {
    title: raw.title,
    slug: raw.slug,
    description: raw.description ?? "",
    price: {
      final: Number(
        raw.price?.final ?? raw.price?.current ?? raw.price?.list ?? 0
      ),
      list: Number(
        raw.price?.list ?? raw.price?.current ?? raw.price?.final ?? 0
      ),
    },
    images: Array.isArray(raw.images) ? raw.images : [],
    brand: {
      name: raw.brand?.name ?? "",
    },
    category: {
      name: raw.category?.name ?? "",
      slug: raw.category?.slug ?? "",
    },
    averageRating: Number(raw.averageRating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
  };

  return generateProductMetadata({ product });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productResult = await getProductBySlug(slug);
  if (!productResult.success || !productResult.data) {
    notFound();
  }
  const raw = productResult.data as any;
  const product: Product = {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    price: {
      base: Number(
        raw.price?.base ?? raw.price?.current ?? raw.price?.final ?? 0
      ),
      list: Number(
        raw.price?.list ?? raw.price?.current ?? raw.price?.final ?? 0
      ),
      final: Number(
        raw.price?.final ?? raw.price?.current ?? raw.price?.list ?? 0
      ),
      discountType: raw.price?.discountType,
      discountValue: raw.price?.discountValue,
    },
    averageRating: Number(raw.averageRating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    description: raw.description ?? "",
    bulletPoints: Array.isArray(raw.bulletPoints) ? raw.bulletPoints : [],
    images: Array.isArray(raw.images) ? (raw.images as string[]) : [],
    isActive: Boolean(raw.isActive),
    isBuyBox: Boolean(raw.isBuyBox ?? false),
    isFeatured: Boolean(raw.isFeatured ?? false),
    isBestSeller: Boolean(raw.isBestSeller ?? raw.isMostSelling ?? false),
    isPlatformChoice: Boolean(raw.isPlatformChoice ?? false),
    brand: {
      id: raw.brand?.id ?? raw.brandId ?? "",
      name: raw.brand?.name ?? "",
      logoUrl: raw.brand?.logoUrl ?? undefined,
    },
    category: {
      id: raw.category?.id ?? raw.categoryId ?? "",
      name: raw.category?.name ?? "",
      slug: raw.category?.slug ?? "",
    },
    seller: {
      id: raw.seller?.id ?? raw.sellerId ?? "",
      name: raw.seller?.displayName ?? raw.seller?.name ?? "",
      slug: raw.seller?.slug ?? "",
      reviewsCount: raw.seller?.reviewCount ?? undefined,
      isVerified: raw.seller?.isVerified ?? undefined,
      totalRatings: raw.seller?.totalRatings ?? undefined,
      positiveRatingPercent: raw.seller?.positiveRatingPercent ?? undefined,
    },
    quantity: Boolean(Number(raw.quantity ?? 0) > 0),
    stockCount: raw.quantity ? Number(raw.quantity) : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags : undefined,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };

  return (
    <main className="min-h-screen">
      <ProductStructuredData product={product} />
      <section className="bg-white">
        <DynamicBreadcrumb />
      </section>

      <section className="bg-white py-6 lg:py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <Suspense fallback={<ProductHeroSkeleton />}>
              {/* Product images + hero info */}
              <ProductHero product={product as any} />
            </Suspense>
            <Suspense fallback={null}>
              <ProductDetails product={product as any} />
            </Suspense>
          </div>
        </div>
      </section>

      <section>
        <Suspense fallback={<ProductTabsSkeleton />}>
          <ProductTabs product={product as any} />
        </Suspense>
      </section>

      {Array.isArray((productResult.data as any)?.relatedProducts) &&
        (productResult.data as any).relatedProducts.length > 0 && (
          <section>
            <Suspense fallback={<SimilarProductsSkeleton />}>
              <SimilarProducts
                products={(productResult.data as any).relatedProducts as any}
              />
            </Suspense>
          </section>
        )}
    </main>
  );
}
