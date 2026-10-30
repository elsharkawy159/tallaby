import { z } from "zod";

/**
 * Manual product order inside a seller category (ROADMAP.md F-24d, 0128).
 * The store's category pages use it as their default sort ("Featured").
 */

/** Most products one category's order holds (the rest follow, newest first). */
export const CATEGORY_ORDER_MAX_PRODUCTS = 1000;

export const saveCategoryOrderSchema = z
  .object({
    categoryId: z.uuid(),
    /** The category's products, first to last. */
    productIds: z
      .array(z.uuid())
      .max(CATEGORY_ORDER_MAX_PRODUCTS)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();

export type CategoryOrderProduct = {
  id: string;
  title: string;
  image: string | null;
  status: "draft" | "pending" | "active" | "rejected";
  /** Customer price in pounds, or null. */
  price: number | null;
  /** True when the seller placed it (else it follows the placed ones, newest first). */
  placed: boolean;
};

export type CategoryOrderError = "invalidInput" | "notFound" | "readOnly" | "generic";

export type CategoryOrderLoadResult =
  | { success: true; products: CategoryOrderProduct[]; truncated: boolean }
  | { success: false; error: CategoryOrderError };

export type CategoryOrderSaveResult = { success: true } | { success: false; error: CategoryOrderError };
