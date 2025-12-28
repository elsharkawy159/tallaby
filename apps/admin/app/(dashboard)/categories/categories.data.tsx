import { Suspense } from "react";
import { getAllCategories } from "@/actions/categories";
import type { Category, CategoriesPageProps } from "./categories.types";
import { CategoriesContent } from "./categories.client";
import { CategoriesSkeleton } from "./categories.skeleton";

async function CategoriesDataContent({
  searchParamsObject,
}: {
  searchParamsObject: CategoriesPageProps["searchParams"];
}) {
  const locale = (searchParamsObject?.locale as "en" | "ar") || "en";
  const limit = searchParamsObject?.limit
    ? parseInt(searchParamsObject.limit)
    : 1000;
  const offset = searchParamsObject?.page
    ? (parseInt(searchParamsObject.page) - 1) * limit
    : 0;

  // Only fetch root categories initially for better performance
  const categoriesResult = await getAllCategories({
    locale,
    parentId: null, // Only root categories
    search: searchParamsObject?.search,
    limit,
    offset,
  });

  if (!categoriesResult.success) {
    throw new Error(categoriesResult.error || "Failed to fetch categories");
  }

  const rootCategories = (categoriesResult.data || []) as Category[];

  return <CategoriesContent rootCategories={rootCategories} locale={locale} />;
}

interface CategoriesDataProps {
  searchParams?: CategoriesPageProps["searchParams"];
}

export async function CategoriesData({ searchParams }: CategoriesDataProps) {
  const searchParamsObject = await searchParams;
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesDataContent searchParamsObject={searchParamsObject} />
    </Suspense>
  );
}
