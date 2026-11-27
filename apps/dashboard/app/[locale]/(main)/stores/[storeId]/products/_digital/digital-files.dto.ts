import { z } from "zod";
import { DIGITAL_FILES_MAX } from "./digital-files.lib";

/**
 * The product form's "Product type" part (ROADMAP.md F-108a): physical or
 * digital, and a digital product's files. Saved by `saveProductDigital` after
 * createProduct / updateProduct, so actions/products.ts stays untouched.
 */

export const PRODUCT_TYPES = ["physical", "digital"] as const;
export type ProductTypeValue = (typeof PRODUCT_TYPES)[number];

/** One file in the form: its storage path (never a URL) and what the seller sees. */
export const digitalFormFileSchema = z.object({
  path: z.string().min(1).max(300),
  name: z.string().trim().min(1).max(255),
  size: z.number().int().min(0),
  type: z.string().max(255).default(""),
});

export type DigitalFormFile = z.infer<typeof digitalFormFileSchema>;

/**
 * What the save action accepts. Only the path and the name are used: the size
 * and type of a new file are read from storage, never from the client.
 */
export const productDigitalInputSchema = z
  .object({
    productType: z.enum(PRODUCT_TYPES),
    files: z
      .array(z.object({ path: z.string().min(1).max(300), name: z.string().trim().min(1).max(255) }))
      .max(DIGITAL_FILES_MAX)
      .default([]),
  })
  .refine((data) => new Set(data.files.map((file) => file.path)).size === data.files.length, {
    message: "duplicateFile",
    path: ["files"],
  });

export type ProductDigitalInput = z.infer<typeof productDigitalInputSchema>;

export type SaveProductDigitalError =
  | "invalidInput"
  | "notFound"
  | "readOnly"
  /** A path that isn't this seller's store folder, or a file over the limits. */
  | "badFile"
  /** A path that was never uploaded. */
  | "missingFile"
  /** A bundle (0188) can't be digital. */
  | "bundle"
  /** A product with options can't be digital. */
  | "hasVariants"
  /** The product's Tallaby category is of the other kind (F-108e). */
  | "category_kind_mismatch"
  | "generic";

export type SaveProductDigitalResult =
  | {
      success: true;
      /** A live digital product saved with no files went back to draft. */
      unpublished: boolean;
    }
  | { success: false; error: SaveProductDigitalError };

export type DigitalUploadUrlResult =
  | { success: true; token: string; path: string }
  | { success: false; error: "notAllowed" | "invalidFile" | "generic" };

/** The edit form's starting values. */
export type ProductDigitalState = { productType: ProductTypeValue; files: DigitalFormFile[] };
