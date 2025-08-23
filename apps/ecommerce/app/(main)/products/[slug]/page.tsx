import { Suspense } from "react";
import { getProduct } from "@/actions/products";
import { ProductDetails } from "./_components/product-details";
import { ProductTabs } from "./_components/product-tabs";
import { SimilarProducts } from "./_components/similar-products";
import { ProductHeroSkeleton } from "./_components/product-hero.skeleton";
import { ProductDetailsSkeleton } from "./_components/product-details.skeleton";
import { ProductTabsSkeleton } from "./_components/product-tabs.skeleton";
import { SimilarProductsSkeleton } from "./_components/similar-products.skeleton";
import type { ProductPageProps } from "./product-page.types";
import { ProductHero } from "./_components/product-hero";

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" className="hover:text-primary transition-colors">
              Home
            </a>
            <span>/</span>
            <a
              href="/products"
              className="hover:text-primary transition-colors"
            >
              Products
            </a>
            <span>/</span>
            <span className="text-primary font-medium">{product.name}</span>
          </div>
        </div>
      </nav>

      {/* Product Hero Section */}
      <div className="flex container">
        <Suspense fallback={<ProductHeroSkeleton />}>
          <ProductHero product={product} />
        </Suspense>

        {/* Product Details Section */}
        <Suspense fallback={<ProductDetailsSkeleton />}>
          <ProductDetails product={product} />
        </Suspense>
      </div>
      {/* Product Tabs Section */}
      <Suspense fallback={<ProductTabsSkeleton />}>
        <ProductTabs product={product} />
      </Suspense>

      {/* Similar Products Section */}
      <Suspense fallback={<SimilarProductsSkeleton />}>
        <SimilarProducts productId={product.id} />
      </Suspense>
    </main>
  );
}
