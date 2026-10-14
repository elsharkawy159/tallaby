import type {
  FieldErrors,
  FormState,
  UseFormGetFieldState,
} from "react-hook-form";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";

/* ───────────────────────── Wizard steps (edit page) ───────────────────────── */

export const ADD_PRODUCT_STEPS = [
  // title is a "productForm.steps" key
  { id: 1, title: "basic", key: "basic" },
  { id: 2, title: "priceStock", key: "priceStock" },
  { id: 3, title: "seo", key: "seo" },
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

export function getErrorAtPath(
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

/* ───────────────────────── Single-page form sections ───────────────────────── */

export const PRODUCT_SECTIONS = [
  // nav is a "productForm.page.nav" key
  { id: "sec-basic", nav: "basic" },
  { id: "sec-media", nav: "media" },
  { id: "sec-content", nav: "content" },
  { id: "sec-price", nav: "price" },
  { id: "sec-stock", nav: "stock" },
  { id: "sec-shipping", nav: "shipping" },
  { id: "sec-visibility", nav: "visibility" },
] as const;

export type ProductSectionId = (typeof PRODUCT_SECTIONS)[number]["id"];

/** Form fields whose errors belong to each section — used to flag and scroll. */
export const SECTION_ERROR_FIELDS: Record<ProductSectionId, readonly string[]> = {
  "sec-basic": [
    "localized.en.title",
    "localized.en.slug",
    "localized.ar.title",
    "categoryId",
  ],
  "sec-media": ["images"],
  "sec-content": [],
  "sec-price": ["price"],
  "sec-stock": ["quantity", "sku", "variants"],
  "sec-shipping": ["handlingTime", "dimensions"],
  "sec-visibility": ["localized.en.metaTitle", "localized.ar.metaTitle"],
};

export interface SectionProgress {
  id: ProductSectionId;
  nav: (typeof PRODUCT_SECTIONS)[number]["nav"];
  /** Required checks in this section; 0 means the section is optional. */
  total: number;
  done: number;
  /** Required ones all done, or an optional section with something filled in. */
  complete: boolean;
  hasError: boolean;
}

const filled = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 : value != null;

const htmlHasText = (html: string | undefined) =>
  !!html && html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;

/**
 * Publish readiness per section, mirroring the schema's required fields so the
 * checklist never says "ready" for something the server would reject.
 */
export function getSectionProgress(
  values: Partial<AddProductFormData>,
  errors: FieldErrors<AddProductFormData>,
  showErrors: boolean
): SectionProgress[] {
  const en = values.localized?.en;
  const ar = values.localized?.ar;
  const positive = (n: unknown) => typeof n === "number" && n > 0;

  const checks: Record<ProductSectionId, boolean[]> = {
    "sec-basic": [filled(en?.title), filled(values.categoryId)],
    "sec-media": [(values.images?.length ?? 0) > 0],
    "sec-content": [],
    "sec-price": [positive(values.price?.list)],
    "sec-stock": [typeof values.quantity === "number" && values.quantity >= 0],
    "sec-shipping": [
      positive(values.handlingTime),
      positive(values.dimensions?.weight),
    ],
    "sec-visibility": [],
  };

  const optionalFilled: Partial<Record<ProductSectionId, boolean>> = {
    "sec-content":
      [...(en?.bulletPoints ?? []), ...(ar?.bulletPoints ?? [])].some(filled) ||
      htmlHasText(en?.content) ||
      htmlHasText(ar?.content),
    "sec-visibility":
      filled(en?.metaTitle) ||
      filled(en?.metaDescription) ||
      filled(ar?.metaTitle) ||
      filled(ar?.metaDescription) ||
      !!values.isTrending ||
      !!values.isSeasonal,
  };

  return PRODUCT_SECTIONS.map(({ id, nav }) => {
    const list = checks[id];
    const done = list.filter(Boolean).length;
    const hasError =
      showErrors &&
      SECTION_ERROR_FIELDS[id].some((field) => Boolean(getErrorAtPath(errors, field)));
    return {
      id,
      nav,
      total: list.length,
      done,
      complete: list.length ? done === list.length : !!optionalFilled[id],
      hasError,
    };
  });
}

/** First section (in page order) holding a validation error. */
export function getFirstInvalidSection(
  errors: FieldErrors<AddProductFormData>
): ProductSectionId | null {
  for (const { id } of PRODUCT_SECTIONS) {
    if (SECTION_ERROR_FIELDS[id].some((field) => Boolean(getErrorAtPath(errors, field)))) {
      return id;
    }
  }
  return null;
}

/** Bottom edge of the sticky page header (marked `data-sticky-head`), plus breathing room. */
export function getStickyOffset() {
  const head = document.querySelector<HTMLElement>("[data-sticky-head]");
  return (head ? head.getBoundingClientRect().bottom : 64) + 16;
}

export function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  window.scrollTo({
    top: section.getBoundingClientRect().top + window.scrollY - getStickyOffset(),
    behavior: "smooth",
  });
}

/** "ABC-12345" from the English title, for sellers without their own SKUs. */
export function generateSku(title: string | undefined): string {
  const letters = (title ?? "").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "TL";
  return `${letters}-${Math.floor(10000 + Math.random() * 89999)}`;
}

/* ───────────────────────── Categories ───────────────────────── */

// Category with nested structure (as returned from getAllCategories)
interface NestedCategory extends CategoryOption {
  categories?: NestedCategory[];
}

export interface CategoryPathEntry {
  category: CategoryOption;
  /** Root → this category. */
  path: CategoryOption[];
  isLeaf: boolean;
}

/** Every category with its ancestry, depth-first. */
export function flattenCategoryTree(
  categories: (CategoryOption | NestedCategory)[],
  parentPath: CategoryOption[] = []
): CategoryPathEntry[] {
  const result: CategoryPathEntry[] = [];

  for (const category of categories) {
    const children = (category as NestedCategory).categories ?? [];
    const node: CategoryOption = {
      id: category.id,
      name: category.name,
      nameAr: category.nameAr ?? null,
      slug: category.slug || "",
      level: category.level,
      parentId: category.parentId,
    };
    const path = [...parentPath, node];
    result.push({ category: node, path, isLeaf: children.length === 0 });
    if (children.length > 0) {
      result.push(...flattenCategoryTree(children, path));
    }
  }

  return result;
}

/** Backwards-compatible flat list (no paths). */
export function flattenCategories(
  categories: (CategoryOption | NestedCategory)[]
): CategoryOption[] {
  return flattenCategoryTree(categories).map((entry) => entry.category);
}

const ARABIC_PREFIXES = ["وال", "بال", "فال", "كال", "لل", "ال"];

/**
 * Lowercases and folds the spellings sellers mix freely: Arabic hamza/alef
 * forms, taa marbuta, alef maqsura and diacritics; Latin accents.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rough stem so "shirts" meets "shirt" and "القمصان" meets "قمصان". */
function stem(token: string): string {
  if (/[؀-ۿ]/.test(token)) {
    for (const prefix of ARABIC_PREFIXES) {
      if (token.startsWith(prefix) && token.length - prefix.length >= 3) {
        token = token.slice(prefix.length);
        break;
      }
    }
    if (token.length > 4 && /(ات|ين|ون)$/.test(token)) token = token.slice(0, -2);
    return token;
  }
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && /(ches|shes|xes|sses)$/.test(token)) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

const STOP_WORDS = new Set([
  "and", "for", "the", "with", "set", "of", "in", "on", "new", "pcs", "pack",
  "من", "مع", "في", "على", "او", "و", "ل", "قطعه", "قطع", "جديد",
]);

function tokenize(value: string | null | undefined): string[] {
  if (!value) return [];
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
    .map(stem);
}

function tokenScore(productTokens: string[], categoryTokens: string[]): number {
  let score = 0;
  for (const categoryToken of categoryTokens) {
    let best = 0;
    for (const productToken of productTokens) {
      if (productToken === categoryToken) {
        best = Math.max(best, 10);
      } else if (
        Math.min(productToken.length, categoryToken.length) >= 3 &&
        (productToken.startsWith(categoryToken) || categoryToken.startsWith(productToken))
      ) {
        best = Math.max(best, 6);
      } else if (
        categoryToken.length >= 4 &&
        productToken.length >= 4 &&
        (productToken.includes(categoryToken) || categoryToken.includes(productToken))
      ) {
        best = Math.max(best, 3);
      }
    }
    score += best;
  }
  return score;
}

export interface CategoryMatch {
  category: CategoryOption;
  path: CategoryOption[];
  score: number;
}

/**
 * Ranks selectable (leaf) categories against what the seller has written so
 * far. The category's own name in either language counts most; its parents add
 * context (a "Shirts" under "Men" beats one under "Kids" for "men's shirt"),
 * and the description is a weaker tiebreaker.
 */
export function suggestCategories(
  categories: (CategoryOption | NestedCategory)[],
  input: { titles: (string | undefined)[]; description?: string },
  maxResults = 4
): CategoryMatch[] {
  const titleTokens = Array.from(new Set(input.titles.flatMap((title) => tokenize(title))));
  if (titleTokens.length === 0) return [];
  const descriptionTokens = Array.from(new Set(tokenize(input.description))).slice(0, 40);

  return flattenCategoryTree(categories)
    .filter((entry) => entry.isLeaf)
    .map(({ category, path }) => {
      const ownTokens = Array.from(
        new Set([...tokenize(category.name), ...tokenize(category.nameAr)])
      );
      const parentTokens = Array.from(
        new Set(path.slice(0, -1).flatMap((p) => [...tokenize(p.name), ...tokenize(p.nameAr)]))
      );
      if (ownTokens.length === 0) return { category, path, score: 0 };

      const own = tokenScore(titleTokens, ownTokens);
      // Without a hit on the category itself, parent matches alone would
      // suggest every leaf under a broad department.
      if (own === 0) return { category, path, score: 0 };

      const parents = tokenScore(titleTokens, parentTokens) * 0.4;
      const description = tokenScore(descriptionTokens, ownTokens) * 0.15;
      // Long multi-word names shouldn't win just by having more words to hit.
      const score = (own / Math.sqrt(ownTokens.length / 2 + 0.5) + parents + description);
      return { category, path, score };
    })
    .filter((match) => match.score >= 5)
    .sort((a, b) => b.score - a.score || a.path.length - b.path.length)
    .slice(0, maxResults);
}

/**
 * @deprecated kept for older callers — use `suggestCategories`.
 */
export function searchCategoriesByProductName(
  categories: (CategoryOption | NestedCategory)[],
  productName: string,
  maxResults: number = 8
): CategoryOption[] {
  return suggestCategories(categories, { titles: [productName] }, maxResults).map(
    (match) => match.category
  );
}
