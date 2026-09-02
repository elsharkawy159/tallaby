import { Suspense } from "react";
import ProductsFilterWrapper from "@/app/[locale]/(main)/products/_components/ProductsFilterWrapper";
import ProductsList from "@/app/[locale]/(main)/products/_components/ProductsList";
import ProductsSorting from "@/app/[locale]/(main)/products/_components/ProductsSorting";
import {
  ProductsFilterSkeleton,
  ProductsListSkeleton,
} from "@/app/[locale]/(main)/products/_components/products-list.skeleton";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateNoIndexMetadata, localizedUrl, type SeoLocale } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  // The canonical, indexable URLs for browsing a single category/brand are
  // now /categories/[slug] and /brands/[slug] — this query-param form stays
  // as a filter entry point but shouldn't compete with those for ranking.
  if (resolvedSearchParams.category || resolvedSearchParams.brands) {
    return generateNoIndexMetadata();
  }

  const title = "All Products | Shop Online | Tallaby.com";
  const description =
    "Browse thousands of products across all categories on Tallaby.com. Find electronics, fashion, home essentials, beauty products and more with fast shipping.";
  const productsUrl = localizedUrl(locale as SeoLocale, "/products");

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      url: productsUrl,
      siteName: "Tallaby.com",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "All Products on Tallaby.com",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
      site: "@tallaby",
    },
    alternates: {
      canonical: productsUrl,
    },
  };
}

// The listing is driven entirely by `searchParams` (filters, sort, page), so
// the route itself is request-time by definition. The two database-backed
// regions are streamed instead of awaited inline, so the shell — breadcrumb,
// layout, sorting control — reaches the browser without waiting on either
// query.
const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;

  return (
    <>
      <DynamicBreadcrumb />
      <main className="container">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Filter Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <Suspense fallback={<ProductsFilterSkeleton />}>
              <ProductsFilterWrapper />
            </Suspense>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            {/* Mobile Filters and Sorting */}
            <div className="flex sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Mobile filter button */}
              <div className="lg:hidden w-full sm:w-auto">
                <Suspense fallback={null}>
                  <ProductsFilterWrapper />
                </Suspense>
              </div>

              {/* Sorting */}
              <div className="w-full sm:w-auto flex justify-end">
                <ProductsSorting />
              </div>
            </div>

            {/* Products Grid - Responsive columns */}
            <Suspense
              key={JSON.stringify(resolvedSearchParams)}
              fallback={<ProductsListSkeleton />}
            >
              <ProductsList searchParams={resolvedSearchParams} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductsPage;
