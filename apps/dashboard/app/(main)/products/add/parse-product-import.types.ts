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

const variantTypeImportSchema = z.object({
  localized: z.object({
    en: variantTypeLocalizedSchema,
    ar: variantTypeLocalizedSchema,
  }),
});

const dimensionsImportSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  unit: z.enum(["cm", "in"]).optional(),
  weightUnit: z.enum(["kg", "g", "lb"]).optional(),
});

const priceImportSchema = z.object({
  list: z.number().positive().optional(),
  final: z.number().positive().optional(),
  discountType: z.enum(["amount", "percent"]).optional(),
  discountValue: z.number().min(0).optional(),
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
    images: z.array(z.string().url()).max(8).optional(),
    variantTypes: z.array(variantTypeImportSchema).max(3).optional(),
    dimensions: dimensionsImportSchema.optional(),
    fulfillmentType: z
      .enum(["seller_fulfilled", "platform_fulfilled", "fba", "digital"])
      .optional(),
    freeDelivery: z.boolean().optional(),
    handlingTime: z.number().int().min(1).optional(),
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
  });

export type ParsedProductImport = z.infer<typeof parsedProductImportSchema>;

export type LocalizedImportFields = z.infer<typeof localizedImportSchema>;

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
