import { z } from "zod";

export const IMPORT_FORMATS = [
  "url",
  "url_bulk",
  "json",
  "text",
  "unknown",
] as const;
export type ImportFormat = (typeof IMPORT_FORMATS)[number];

/** Max URLs accepted in one bulk paste. */
export const MAX_BULK_IMPORT_URLS = 25;

/** Max generated variant rows accepted in one import. */
export const MAX_IMPORT_VARIANTS = 60;

const localizedImportSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  bulletPoints: z.array(z.string()).max(10).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

const variantTypeLocalizedSchema = z.object({
  name: z.string().default(""),
  values: z.array(z.string()).default([]),
});

const variantOptionKindSchema = z.enum([
  "color",
  "size",
  "weight",
  "material",
  "style",
  "custom",
]);

const variantTypeImportSchema = z.object({
  kind: variantOptionKindSchema.optional(),
  /** Unit appended to values when `kind` is `weight` (e.g. `ml`). */
  unit: z.string().optional(),
  /** Hex swatches, index-aligned with `localized.en.values`. */
  swatches: z.array(z.string()).optional(),
  localized: z.object({
    en: variantTypeLocalizedSchema,
    ar: variantTypeLocalizedSchema,
  }),
});

const priceImportSchema = z.object({
  list: z.number().positive().optional(),
  final: z.number().positive().optional(),
  discountType: z.enum(["amount", "percent"]).optional(),
  discountValue: z.number().min(0).optional(),
});

/**
 * One concrete variant row. `options.en` holds one value per entry in
 * `variantTypes`, in the same order (e.g. `["Red", "L"]`).
 */
const variantImportSchema = z.object({
  options: z.object({
    en: z.array(z.string()).default([]),
    ar: z.array(z.string()).default([]),
  }),
  sku: z.string().optional(),
  barCode: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  price: priceImportSchema.optional(),
  image: z.string().url().optional(),
  isDefault: z.boolean().optional(),
});

const dimensionsImportSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  unit: z.enum(["cm", "in"]).optional(),
  weightUnit: z.enum(["kg", "g", "lb"]).optional(),
});

export const parsedProductImportSchema = z
  .object({
    version: z.string().optional(),
    localized: z
      .object({
        en: localizedImportSchema.optional(),
        ar: localizedImportSchema.optional(),
      })
      .optional(),
    price: priceImportSchema.optional(),
    sku: z.string().optional(),
    quantity: z.number().int().min(0).optional(),
    maxOrderQuantity: z.number().int().min(1).optional(),
    images: z.array(z.string().url()).max(8).optional(),
    variantTypes: z.array(variantTypeImportSchema).max(3).optional(),
    variants: z.array(variantImportSchema).max(MAX_IMPORT_VARIANTS).optional(),
    dimensions: dimensionsImportSchema.optional(),
    fulfillmentType: z
      .enum(["seller_fulfilled", "platform_fulfilled", "fba", "digital"])
      .optional(),
    freeDelivery: z.boolean().optional(),
    handlingTime: z.number().int().min(1).optional(),
    taxClass: z.enum(["standard", "reduced", "zero", "exempt"]).optional(),
    condition: z
      .enum([
        "new",
        "renewed",
        "refurbished",
        "used_like_new",
        "used_very_good",
        "used_good",
        "used_acceptable",
      ])
      .optional(),
    conditionDescription: z.string().optional(),
    isTrending: z.boolean().optional(),
    isSeasonal: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isPlatformChoice: z.boolean().optional(),
    isMostSelling: z.boolean().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const enTitle = (data.localized?.en?.title ?? "").trim();
    if (!enTitle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "English product title is required",
        path: ["localized", "en", "title"],
      });
    }

    const variants = data.variants ?? [];
    const variantTypes = data.variantTypes ?? [];

    if (variants.length > 0 && variantTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "`variants` requires `variantTypes` to be provided",
        path: ["variantTypes"],
      });
      return;
    }

    variants.forEach((variant, index) => {
      if (variant.options.en.length !== variantTypes.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Variant ${index + 1} must list exactly ${variantTypes.length} option value(s), one per variant type`,
          path: ["variants", index, "options", "en"],
        });
      }
    });
  });

export type ParsedProductImport = z.infer<typeof parsedProductImportSchema>;

export type LocalizedImportFields = z.infer<typeof localizedImportSchema>;

export type VariantTypeImport = z.infer<typeof variantTypeImportSchema>;

export type VariantImport = z.infer<typeof variantImportSchema>;

export interface ParseProductImportResult {
  success: true;
  data: ParsedProductImport;
  format: ImportFormat;
}

export interface ParseProductImportError {
  success: false;
  format: ImportFormat;
  error: string;
  details?: string[];
}

export type ParseProductImportOutput =
  | ParseProductImportResult
  | ParseProductImportError;
