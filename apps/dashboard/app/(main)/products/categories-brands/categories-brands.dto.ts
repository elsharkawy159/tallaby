import { z } from "zod";

/** Products › Categories and Products › Brands: the seller's own lists (0068). */

export type TaxonomyKind = "category" | "brand";

/** Most items one seller can keep in each list. */
export const SELLER_TAXONOMY_MAX_ITEMS = 300;
export const TAXONOMY_NAME_MAX = 80;
export const TAXONOMY_IMAGE_URL_MAX = 1000;

/** An item in the seller's own list. */
export type SellerTaxonomyItem = {
  id: string;
  name: string;
  nameAr: string | null;
  /** The pack item it was picked from; null for the seller's own. */
  sourceId: string | null;
  image: string | null;
  productCount: number;
};

/** A slim item for the product form's "My category" / "My brand" pickers. */
export type SellerTaxonomyOption = { id: string; name: string; nameAr: string | null };

/** A Tallaby pack suggestion shown while the seller types. */
export type PackSuggestion = {
  id: string;
  name: string;
  nameAr: string | null;
  image: string | null;
  /** Parent category name, to tell apart same-named categories. */
  parentName: string | null;
  parentNameAr: string | null;
};

const name = z.string().trim().min(1).max(TAXONOMY_NAME_MAX);
const optionalName = z
  .string()
  .trim()
  .max(TAXONOMY_NAME_MAX)
  .optional()
  .transform((v) => v || null);
/**
 * An uploaded image's public URL, or null to remove it. Leaving it out keeps
 * the current image. The server also checks it points at the seller uploads
 * folder (isSellerTaxonomyImage).
 */
const image = z.string().trim().max(TAXONOMY_IMAGE_URL_MAX).nullable().optional();

/** Add: either a pack item (sourceId) or the seller's own name. */
export const addTaxonomyItemSchema = z.union([
  z.object({ sourceId: z.uuid() }).strict(),
  z.object({ name, nameAr: optionalName, image }).strict(),
]);

export const updateTaxonomyItemSchema = z.object({ name, nameAr: optionalName, image }).strict();

/** The full list of the seller's item ids, in the new order. */
export const reorderTaxonomySchema = z
  .array(z.uuid())
  .max(SELLER_TAXONOMY_MAX_ITEMS)
  .refine((ids) => new Set(ids).size === ids.length);

export const productTaxonomySchema = z
  .object({
    sellerCategoryId: z.uuid().nullable(),
    sellerBrandId: z.uuid().nullable(),
  })
  .strict();

/** Error keys live under `categoriesBrands.errors`. */
export type TaxonomyErrorKey = "invalidInput" | "invalidImage" | "duplicate" | "limit" | "notFound" | "readOnly" | "generic";

export type TaxonomyResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: TaxonomyErrorKey };
