import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ProductSection from "@/components/home/ProductSection";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const t = await getTranslations("search");

  return {
    title: query ? t("resultsForTitle", { query }) : t("searchPageTitle"),
    description: query
      ? t("resultsForDescription", { query })
      : t("searchPageDescription"),
    // Query-driven results pages create unbounded near-duplicate URLs —
    // keep them crawlable for the query but out of the index.
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const t = await getTranslations("search");

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        {query ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("resultsForHeading", { query })}
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                {t("resultsForSubheading")}
              </p>
            </div>

            <Suspense fallback={<div>{t("searching")}</div>}>
              <ProductSection
                title=""
                filters={{
                  searchQuery: query,
                  limit: 30,
                }}
              />
            </Suspense>
          </>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {t("searchPageTitle")}
            </h1>
            <p className="text-gray-600">{t("enterSearchTerm")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
