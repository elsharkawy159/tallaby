import { Suspense } from "react";
import { getProducts } from "@/actions/products";
import ProductSection from "@/components/home/ProductSection";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const query = searchParams.q || "";

  return {
    title: query ? `Search Results for "${query}"` : "Search Products",
    description: query
      ? `Search results for "${query}". Find the products you're looking for.`
      : "Search for products across our marketplace.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        {query ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results for &quot;{query}&quot;
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Find the products you&apos;re looking for
              </p>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
              <ProductSection
                title=""
                filters={{
                  searchQuery: query,
                  isActive: true,
                  limit: 30,
                }}
              />
            </Suspense>
          </>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Search Products
            </h1>
            <p className="text-gray-600">
              Enter a search term to find products
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
