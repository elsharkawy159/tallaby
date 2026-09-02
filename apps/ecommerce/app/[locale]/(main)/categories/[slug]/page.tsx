import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getCategoryBySlug } from "@/actions/categories";
import { getProducts, getFilterOptions } from "@/actions/products";
import { getWishlistItems } from "@/actions/wishlist";
import { generateCategoryMetadata } from "@/lib/metadata";
import { generateCategoryStructuredData } from "@/lib/structured-data";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import Pagination from "@/app/[locale]/(main)/products/_components/Pagination";
import { ProductsGridSkeleton } from "@/components/home/products-grid.skeleton";
import type { ProductCardProps } from "@/components/product";
import { routing } from "@/i18n/routing";
import type { ProductLocale } from "@/lib/product-translations";

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const result = await getFilterOptions();
  if (!result.success || !result.data) return [];

  return result.data.categories.map((category) => ({ slug: category.slug }));
}

async function resolveCategory(locale: string, slug: string) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const result = await getCategoryBySlug(slug);
  if (!result.success || !result.data) {
    notFound();
  }

  return { locale: locale as ProductLocale, category: result.data };
}

function localizedCategoryName(
  category: { name: string | null; nameAr: string | null },
  locale: ProductLocale
) {
  if (locale === "ar") return category.nameAr || category.name || "";
  return category.name || category.nameAr || "";
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { category } = await resolveCategory(locale, slug);

  return generateCategoryMetadata({
    locale: locale as ProductLocale,
    category: {
      name: localizedCategoryName(category, locale as ProductLocale),
      slug: category.slug ?? slug,
      productCount: category.productCount,
    },
  });
}

const PAGE_SIZE = 24;

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const resolvedSearchParams = await searchParams;
  const { category } = await resolveCategory(locale, slug);

  const page = Number(resolvedSearchParams.page) || 1;
  const productsResult = await getProducts({
    categoryId: category.id,
    locale: locale as ProductLocale,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const wishlistResult = await getWishlistItems();
  const wishlistItems = wishlistResult.success ? (wishlistResult.data ?? []) : [];
  const wishlistMap = new Map(
    wishlistItems.map((item: any) => [item.productId, item])
  );

  const products = productsResult.success ? (productsResult.data ?? []) : [];
  const totalCount = productsResult.success ? productsResult.totalCount : 0;
  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);
  const displayName = localizedCategoryName(category, locale as ProductLocale);

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateCategoryStructuredData(
              {
                name: displayName,
                slug: category.slug ?? slug,
                productCount: category.productCount,
              },
              locale as ProductLocale
            )
          ),
        }}
      />
      <section className="bg-white">
        <DynamicBreadcrumb customLabels={{ [slug]: displayName }} />
      </section>

      <section className="container py-6">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">{displayName}</h1>
        <p className="text-muted-foreground mb-6">
          {category.productCount ?? 0}{" "}
          {locale === "ar" ? "منتج" : "products"}
        </p>

        <Suspense fallback={<ProductsGridSkeleton />}>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد منتجات في هذا القسم حاليًا."
                  : "No products in this category yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 lg:gap-5 2xl:gap-6 sm:grid-cols-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    {...(product as ProductCardProps)}
                    isInWishlist={wishlistMap.has(product.id)}
                    wishlistItemId={wishlistMap.get(product.id)?.id}
                  />
                ))}
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={totalCount || 0}
                totalPages={totalPages}
              />
            </>
          )}
        </Suspense>
      </section>
    </main>
  );
}
