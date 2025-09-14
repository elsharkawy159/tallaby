import { getTopCategories } from "@/actions/categories";
import type {
  CategoryShowcaseProps,
  CategoryWithRequiredFields,
} from "./category-showcase.types";
import { CategoryShowcaseClient } from "./category-showcase.client";

const CategoryShowcase = async (props: CategoryShowcaseProps) => {
  const { className = "" } = props;
  const result = await getTopCategories();
console.log("result", result)
  if (!result.success || !result.data) {
    return null;
  }

  if (result.data.length === 0) {
    return null;
  }

  return (
    <CategoryShowcaseClient
      categories={result.data as CategoryWithRequiredFields[]}
      className={className}
    />
  );
};

export default CategoryShowcase;
