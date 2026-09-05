import { Suspense } from "react";
import { getTopCategories } from "@/actions/categories";
import { CategoryShowcaseClient } from "./category/category-showcase.client";
import { CategoryShowcaseSkeleton } from "./category/category-showcase.skeleton";
import type {
  CategoryShowcaseProps,
  CategoryWithRequiredFields,
} from "./category-showcase.types";

export const CategoryShowcaseData = async ({
  className,
  limit = 12,
}: CategoryShowcaseProps) => {
  const result = await getTopCategories();
  if (!result.success || !result.data) {
    return null;
  }

  // Query already returns product_count > 0; keep name/slug guards and limit
  const categories: CategoryWithRequiredFields[] = result.data
    .filter(
      (category): category is CategoryWithRequiredFields =>
        category.name !== null && category.slug !== null
    )
    .map((category) => ({
      id: category.id,
      name: category.name!,
      nameAr: category.nameAr ?? null,
      slug: category.slug!,
      productCount: category.productCount,
      fallbackImageUrl: category.fallbackImageUrl ?? null,
      imageUrl: category.imageUrl ?? null,
    }))
    .slice(0, limit);

  if (categories.length === 0) {
    return null;
  }

  return (
    <CategoryShowcaseClient categories={categories} className={className} />
  );
};

export const CategoryShowcaseWithSuspense = (props: CategoryShowcaseProps) => {
  return (
    <Suspense fallback={<CategoryShowcaseSkeleton />}>
      <CategoryShowcaseData {...props} />
    </Suspense>
  );
};
