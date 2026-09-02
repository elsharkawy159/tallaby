import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { Star, BadgeCheck } from "lucide-react";
import { getSellerBySlug } from "@/actions/seller";
import { getProducts } from "@/actions/products";
import { getWishlistItems } from "@/actions/wishlist";
import { generateStoreMetadata } from "@/lib/metadata";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import ProductCard from "@/app/[locale]/(main)/products/[slug]/_components/ProductCard";
import Pagination from "@/app/[locale]/(main)/products/_components/Pagination";
import { ProductsGridSkeleton } from "@/components/home/products-grid.skeleton";
import type { ProductCardProps } from "@/components/product";
import { routing } from "@/i18n/routing";
import type { ProductLocale } from "@/lib/product-translations";

interface StorePageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const revalidate = 3600;
export const dynamicParams = true;

async function resolveStore(locale: string, slug: string) {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const result = await getSellerBySlug(slug);
  // Only approved sellers get a public storefront — a pending/suspended
  // seller's slug should 404 rather than leak an unapproved profile.
  if (!result.success || !result.data || result.data.status !== "approved") {
    notFound();
  }

  return { locale: locale as ProductLocale, seller: result.data };
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { seller } = await resolveStore(locale, slug);

  return generateStoreMetadata({
    locale: locale as ProductLocale,
    store: {
      name: seller.displayName,
      slug: seller.slug,
      description: seller.description,
      logoUrl: seller.logoUrl,
      productCount: seller.productCount,
    },
  });
}

const PAGE_SIZE = 24;

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.stores");
  const resolvedSearchParams = await searchParams;
  const { seller } = await resolveStore(locale, slug);

  const page = Number(resolvedSearchParams.page) || 1;
  const productsResult = await getProducts({
    sellerId: seller.id,
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

  const storeStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seller.displayName,
    description: seller.description || undefined,
    logo: seller.logoUrl || undefined,
    ...(seller.storeRating && seller.totalRatings && seller.totalRatings > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: seller.storeRating,
            reviewCount: seller.totalRatings,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeStructuredData) }}
      />
      <section className="bg-white">
        <DynamicBreadcrumb customLabels={{ [slug]: seller.displayName }} />
      </section>

      <section className="container py-6">
        <div className="flex items-center gap-4 mb-6">
          {seller.logoUrl ? (
            <Image
              src={seller.logoUrl}
              alt={seller.displayName}
              width={64}
              height={64}
              className="rounded-full border object-cover bg-white"
            />
          ) : null}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold">{seller.displayName}</h1>
              {seller.isVerified && (
                <span className="inline-flex items-center gap-1 text-sm text-primary">
                  <BadgeCheck className="h-4 w-4" />
                  {t("verifiedBadge")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-sm mt-1">
              <span>{t("productsCount", { count: seller.productCount ?? 0 })}</span>
              {seller.storeRating != null && seller.totalRatings && seller.totalRatings > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current text-accent" />
                  {seller.storeRating.toFixed(1)} ({seller.totalRatings})
                </span>
              )}
            </div>
          </div>
        </div>

        {seller.description && (
          <p className="text-muted-foreground mb-6 max-w-3xl">{seller.description}</p>
        )}

        <Suspense fallback={<ProductsGridSkeleton />}>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("noProducts")}</p>
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
