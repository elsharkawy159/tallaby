import type {
  FieldErrors,
  FormState,
  UseFormGetFieldState,
} from "react-hook-form";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";

export const ADD_PRODUCT_STEPS = [
  { id: 1, title: "Basic Information", key: "basic" },
  { id: 2, title: "Price and Stock", key: "priceStock" },
  { id: 3, title: "Search Engine", key: "seo" },
] as const;

export type AddProductStepId = (typeof ADD_PRODUCT_STEPS)[number]["id"];

export const STEP_VALIDATION_FIELDS: Record<
  AddProductStepId,
  readonly (keyof AddProductFormData | string)[]
> = {
  1: [
    "localized.en.title",
    "localized.en.slug",
    "localized.ar.title",
    "categoryId",
    "images",
  ],
  2: ["price.list", "price.final", "quantity", "dimensions.weight"],
  3: [],
};

export type StepValidationStatus = "valid" | "error" | "default";

function getErrorAtPath(
  errors: FieldErrors<AddProductFormData>,
  fieldPath: string
): unknown {
  return fieldPath.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, errors);
}

export function getStepValidationStatus(
  stepId: AddProductStepId,
  formState: FormState<AddProductFormData>,
  getFieldState: UseFormGetFieldState<AddProductFormData>
): StepValidationStatus {
  const { errors } = formState;
  const fields = STEP_VALIDATION_FIELDS[stepId];

  if (fields.length === 0) {
    return "valid";
  }

  const hasError = fields.some((fieldPath) => {
    const fieldError = getErrorAtPath(errors, fieldPath);
    return Boolean(fieldError);
  });

  if (hasError) {
    return "error";
  }

  const allValid = fields.every((fieldPath) => {
    const { invalid } = getFieldState(
      fieldPath as keyof AddProductFormData,
      formState
    );

    return !invalid;
  });

  return allValid ? "valid" : "default";
}

export function scrollToStepSection(stepKey: string) {
  const section = document.getElementById(`step-${stepKey}`);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface FlattenedCategory {
  id: string;
  name: string;
  nameAr?: string | null;
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
      nameAr: category.nameAr ?? null,
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

function isArabicText(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value)
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

  const shouldUseArabic = isArabicText(productName);
  const flattened = flattenCategories(categories);
  const scored = flattened
    .map((category) => ({
      ...category,
      score: scoreCategoryMatch(
        shouldUseArabic ? category.nameAr || category.name : category.name,
        productName
      ),
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
        nameAr: category.nameAr ?? null,
        slug: category.slug,
        level: category.level,
        parentId: category.parentId,
      }) as CategoryOption
  );
}
