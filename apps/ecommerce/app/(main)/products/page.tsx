import ProductsFilterWrapper from "@/app/(main)/products/_components/ProductsFilterWrapper";
import ProductsList from "@/app/(main)/products/_components/ProductsList";
import ProductsSorting from "@/app/(main)/products/_components/ProductsSorting";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { generateCategoryMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams.category as string;

  if (category) {
    // Generate category-specific metadata
    const categoryData = {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      slug: category,
      description: `Shop ${category} products on Tallaby.com with great prices and fast shipping.`,
    };

    return generateCategoryMetadata({ category: categoryData });
  }

  // Default products page metadata
  return {
    title: "All Products | Shop Online | Tallaby.com",
    description:
      "Browse thousands of products across all categories on Tallaby.com. Find electronics, fashion, home essentials, beauty products and more with fast shipping.",
    openGraph: {
      type: "website",
      title: "All Products | Shop Online | Tallaby.com",
      description:
        "Browse thousands of products across all categories on Tallaby.com. Find electronics, fashion, home essentials, beauty products and more with fast shipping.",
      url: "https://www.tallaby.com/products",
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
      title: "All Products | Shop Online | Tallaby.com",
      description:
        "Browse thousands of products across all categories on Tallaby.com. Find electronics, fashion, home essentials, beauty products and more with fast shipping.",
      images: ["/og-image.jpg"],
      site: "@tallaby",
    },
    alternates: {
      canonical: "https://www.tallaby.com/products",
    },
  };
}

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;

  return (
    <>
      <DynamicBreadcrumb />
      <main className="container py-2.5  sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Filter Sidebar - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <ProductsFilterWrapper />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            {/* Mobile Filters and Sorting */}
            <div className="flex sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Mobile filter button */}
              <div className="lg:hidden w-full sm:w-auto">
                <ProductsFilterWrapper />
              </div>

              {/* Sorting */}
              <div className="w-full sm:w-auto flex justify-end">
                <ProductsSorting />
              </div>
            </div>

            {/* Products Grid - Responsive columns */}
            <ProductsList searchParams={resolvedSearchParams} />
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductsPage;
