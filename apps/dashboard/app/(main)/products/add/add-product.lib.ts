import type { CategoryOption } from "./add-product.schema";

interface FlattenedCategory {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId?: string;
}

// Category with nested structure (as returned from getAllCategories)
interface NestedCategory extends CategoryOption {
  categories?: NestedCategory[];
}

/**
 * Flattens nested category structure into a flat array
 */
export function flattenCategories(
  categories: (CategoryOption | NestedCategory)[],
  parentPath: string[] = []
): FlattenedCategory[] {
  const result: FlattenedCategory[] = [];

  for (const category of categories) {
    result.push({
      id: category.id,
      name: category.name,
      slug: category.slug || "",
      level: category.level,
      parentId: category.parentId,
    });

    // Recursively flatten children if they exist
    const nestedCategory = category as NestedCategory;
    if (nestedCategory.categories && Array.isArray(nestedCategory.categories)) {
      result.push(
        ...flattenCategories(nestedCategory.categories, [
          ...parentPath,
          category.name,
        ])
      );
    }
  }

  return result;
}

/**
 * Scores a category based on how well it matches the product name
 */
function scoreCategoryMatch(categoryName: string, productName: string): number {
  const normalizedCategory = categoryName.toLowerCase().trim();
  const normalizedProduct = productName.toLowerCase().trim();

  if (!normalizedProduct || normalizedProduct.length < 2) return 0;

  let score = 0;

  // Exact match gets highest score
  if (normalizedProduct.includes(normalizedCategory)) {
    score += normalizedCategory.length * 10;
  }

  // Check if category name is included in product text
  if (normalizedCategory.includes(normalizedProduct)) {
    score += normalizedProduct.length * 5;
  }

  // Check word-by-word matching
  const productWords = normalizedProduct
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const categoryWords = normalizedCategory
    .split(/\s+/)
    .filter((w) => w.length > 2);

  for (const productWord of productWords) {
    for (const categoryWord of categoryWords) {
      if (
        categoryWord.includes(productWord) ||
        productWord.includes(categoryWord)
      ) {
        score += Math.min(productWord.length, categoryWord.length);
      }
    }
  }

  return score;
}

/**
 * Searches categories based on product name and returns matching categories sorted by relevance
 */
export function searchCategoriesByProductName(
  categories: (CategoryOption | NestedCategory)[],
  productName: string,
  maxResults: number = 8
): CategoryOption[] {
  if (!productName || productName.trim().length < 2) {
    return [];
  }

  const flattened = flattenCategories(categories);
  const scored = flattened
    .map((category) => ({
      ...category,
      score: scoreCategoryMatch(category.name, productName),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  // Convert back to CategoryOption format
  return scored.map(
    ({ score, ...category }) =>
      ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        level: category.level,
        parentId: category.parentId,
      }) as CategoryOption
  );
}
