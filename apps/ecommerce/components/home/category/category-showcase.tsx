import { getTopCategories } from "@/actions/categories";
import type {
  CategoryShowcaseProps,
  CategoryWithRequiredFields,
} from "./category-showcase.types";
import { CategoryShowcaseClient } from "./category-showcase.client";

const CategoryShowcase = async (props: CategoryShowcaseProps) => {
  const { className = "" } = props;
  const result = await getTopCategories();

  if (!result.success || !result.data) {
    throw new Error("Failed to load categories");
  }

  const categories = (result.data as CategoryWithRequiredFields[]).filter(
    (category) => category.name !== null && category.slug !== null,
  );

  if (categories.length === 0) {
    return null;
  }

  return (
    <CategoryShowcaseClient categories={categories} className={className} />
  );
};

export default CategoryShowcase;
