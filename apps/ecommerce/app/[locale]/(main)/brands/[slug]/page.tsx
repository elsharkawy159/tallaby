import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getBrandBySlug, getAllBrands } from "@/actions/brands";
import { getProducts } from "@/actions/products";
import { generateBrandMetadata } from "@/lib/metadata";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import Pagination from "@/app/[locale]/(main)/products/_components/Pagination";
import { ProductsGridSkeleton } from "@/components/home/products-grid.skeleton";
import type { ProductCardProps } from "@/components/product";
import { routing } from "@/i18n/routing";
import type { ProductLocale } from "@/lib/product-translations";
import Image from "next/image";

interface BrandPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const result = await getAllBrands({ limit: 1000 });
  if (!result.success || !result.data) return [];

  return result.data.map((brand) => ({ slug: brand.slug }));
}

async function resolveBrand(locale: string, slug: string) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const result = await getBrandBySlug(slug);
  if (!result.success || !result.data) {
    notFound();
  }

  return { locale: locale as ProductLocale, brand: result.data };
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { brand } = await resolveBrand(locale, slug);

  return generateBrandMetadata({
    locale: locale as ProductLocale,
    brand: {
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      productCount: brand.productCount,
    },
  });
}

const PAGE_SIZE = 24;

export default async function BrandPage({
  params,
  searchParams,
}: BrandPageProps) {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const { brand } = await resolveBrand(locale, slug);

  const page = Number(resolvedSearchParams.page) || 1;
  const productsResult = await getProducts({
    brandId: brand.id,
    locale: locale as ProductLocale,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const products = productsResult.success ? (productsResult.data ?? []) : [];
  const totalCount = productsResult.success ? productsResult.totalCount : 0;
  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

  return (
    <main className="min-h-screen">
      <section className="bg-white">
        <DynamicBreadcrumb customLabels={{ [slug]: brand.name }} />
      </section>

      <section className="container py-6">
        <div className="flex items-center gap-4 mb-6">
          {brand.logoUrl && (
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              width={64}
              height={64}
              className="rounded-md border object-contain bg-white"
            />
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{brand.name}</h1>
            <p className="text-muted-foreground">
              {brand.productCount ?? 0}{" "}
              {locale === "ar" ? "منتج" : "products"}
            </p>
          </div>
        </div>
        {brand.description && (
          <p className="text-muted-foreground mb-6 max-w-3xl">
            {brand.description}
          </p>
        )}

        <Suspense fallback={<ProductsGridSkeleton />}>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {locale === "ar"
                  ? "لا توجد منتجات لهذه العلامة التجارية حاليًا."
                  : "No products from this brand yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 lg:gap-5 2xl:gap-6 sm:grid-cols-2 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    {...(product as ProductCardProps)}
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
