import type { TaxonomyKind } from "./categories-brands.dto";

/** Tidy a name before saving: trim and collapse inner whitespace. */
export function cleanTaxonomyName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** The key the DB keeps unique per seller (lower(btrim(name))), applied to a cleaned name. */
export function taxonomyNameKey(name: string): string {
  return cleanTaxonomyName(name).toLowerCase();
}

/** The label to show: Arabic when the UI is Arabic and one exists. */
export function taxonomyLabel(item: { name: string; nameAr: string | null }, locale: string): string {
  return locale === "ar" && item.nameAr?.trim() ? item.nameAr : item.name;
}

/** Escape `%`, `_` and `\` so a search term is matched literally by ILIKE. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Postgres unique violation, also when wrapped by the driver or Drizzle. */
export function isUniqueViolation(error: unknown): boolean {
  for (let e = error, depth = 0; e && typeof e === "object" && depth < 4; depth++) {
    if ((e as { code?: unknown }).code === "23505") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Take the seller's own category / brand off the product form values. They
 * are saved by setProductSellerTaxonomy, never through createProduct /
 * updateProduct (which write form keys straight to the row). "" means none.
 */
export function splitSellerTaxonomy<T extends { sellerCategoryId?: string; sellerBrandId?: string }>(
  data: T,
): { rest: Omit<T, "sellerCategoryId" | "sellerBrandId">; taxonomy: { sellerCategoryId: string | null; sellerBrandId: string | null } } {
  const { sellerCategoryId, sellerBrandId, ...rest } = data;
  return { rest, taxonomy: { sellerCategoryId: sellerCategoryId || null, sellerBrandId: sellerBrandId || null } };
}

/** Storage bucket that holds the pack images for a kind. */
export const TAXONOMY_IMAGE_BUCKET: Record<TaxonomyKind, string> = {
  category: "categories",
  brand: "brands",
};

/** Each list's own page. */
export const TAXONOMY_PAGE_HREF: Record<TaxonomyKind, string> = {
  category: "/products/categories",
  brand: "/products/brands",
};

/** Bucket and folder seller uploads go to (useSellerUpload; the bucket's policies already allow it). */
export const TAXONOMY_UPLOAD_BUCKET = "sellers";
export const TAXONOMY_UPLOAD_FOLDER = "logos";

/**
 * Whether an image URL is a public file in the seller uploads folder of this
 * project's storage, so a client can't point an item at any other URL.
 */
export function isSellerTaxonomyImage(url: string, supabaseUrl: string | undefined): boolean {
  if (!supabaseUrl) return false;
  const prefix = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${TAXONOMY_UPLOAD_BUCKET}/${TAXONOMY_UPLOAD_FOLDER}/`;
  if (!url.startsWith(prefix)) return false;
  const file = url.slice(prefix.length);
  return /^[\w%.-]+$/.test(file) && !file.startsWith(".") && !file.includes("..");
}

/** The list order sorted A–Z by the label shown in this locale. */
export function sortTaxonomyByLabel<T extends { name: string; nameAr: string | null }>(items: T[], locale: string): T[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return [...items].sort((a, b) => collator.compare(taxonomyLabel(a, locale), taxonomyLabel(b, locale)));
}
