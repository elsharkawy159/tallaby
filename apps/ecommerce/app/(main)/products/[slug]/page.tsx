import { Suspense } from "react";
import { getProduct } from "@/actions/products";
import { ProductDetails } from "./_components/product-details";
import { ProductTabs } from "./_components/product-tabs";
import { SimilarProducts } from "./_components/similar-products";
import { ProductHeroSkeleton } from "./_components/product-hero.skeleton";
import { ProductDetailsSkeleton } from "./_components/product-details.skeleton";
import { ProductTabsSkeleton } from "./_components/product-tabs.skeleton";
import { SimilarProductsSkeleton } from "./_components/similar-products.skeleton";
import {
  ServerBreadcrumb,
  createBreadcrumbSegments,
} from "@/components/layout/server-breadcrumb";
import type { ProductPageProps } from "./product-page.types";
import { ProductHero } from "./_components/product-hero";

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  console.log("product", product);
  const breadcrumbSegments = createBreadcrumbSegments([
    { label: "Products", href: "/products" },
    { label: product.name || "Product" },
  ]);

  return (
    <main className="min-h-screen space-y-4 bg-gray-50">


    </main>
  );
}
