import { z } from "zod"

/**
 * AI product autofill (PLAN.md AI-1): what the seller sends and what the model
 * must return. The output schema is sent to Gemini as structured output, so it
 * stays flat and nullable (no unions); lengths are clamped again on our side.
 */

export const AUTOFILL_FEATURE = "product_autofill"

export const AUTOFILL_LIMITS = {
  maxImages: 6,
  /** Per resized image, as sent to the model (the browser shrinks them first). */
  maxImageBytes: 1.5 * 1024 * 1024,
  maxPdfBytes: 4 * 1024 * 1024,
  /** Under Vercel's 4.5 MB request body limit. */
  maxTotalBytes: 4.4 * 1024 * 1024,
  maxTextLength: 4000,
} as const

export const AUTOFILL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const AUTOFILL_PDF_TYPE = "application/pdf"

export type AutofillFile = { mediaType: string; data: Uint8Array; size: number }

export type AutofillInput = {
  text: string
  images: AutofillFile[]
  pdf: AutofillFile | null
}

/** Error codes returned by the route; the client maps them to `productForm.ai.errors.*`. */
export type AutofillErrorCode =
  | "unauthorized"
  | "disabled"
  | "empty"
  | "tooLarge"
  | "badFile"
  | "rateLimited"
  | "dailyLimit"
  | "failed"

export const CONDITIONS = [
  "new",
  "renewed",
  "refurbished",
  "used_like_new",
  "used_very_good",
  "used_good",
  "used_acceptable",
] as const

export const VARIANT_KINDS = ["color", "size", "weight", "material", "style", "custom"] as const

/** Field keys the model can report as missing; each has a `productForm.ai.missing.*` string. */
export const MISSING_FIELDS = ["price", "stock", "category", "brand", "dimensions", "weight"] as const
export type MissingField = (typeof MISSING_FIELDS)[number]

const localizedOutputSchema = z.object({
  title: z.string().describe("Product name, clear and specific, at most 120 characters. No price, no emojis."),
  description: z
    .string()
    .describe("Short sales description: 2 or 3 short paragraphs of plain text separated by a blank line. No markdown, no HTML."),
  bulletPoints: z.array(z.string()).max(6).describe("3 to 6 key features or benefits, one short line each."),
  metaTitle: z.string().describe("SEO title, at most 60 characters."),
  metaDescription: z.string().describe("SEO description, at most 160 characters."),
  metaKeywords: z.array(z.string()).max(10).describe("5 to 10 search keywords shoppers would type."),
})

export const productAutofillOutputSchema = z.object({
  localized: z.object({
    ar: localizedOutputSchema.describe("Arabic copy for Egyptian shoppers, clear and natural."),
    en: localizedOutputSchema.describe("English copy."),
  }),
  categoryId: z.string().nullable().describe("The id of the best category from the CATEGORIES list, or null."),
  brandName: z.string().nullable().describe("Brand only when it is written in the input or clearly visible on the product. Else null."),
  storeCategoryName: z
    .string()
    .nullable()
    .describe("The best matching name from STORE CATEGORIES, or a short new category name (Arabic) if none fits. Null if unsure."),
  price: z.object({
    list: z.number().nullable().describe("Regular price in EGP, only when the seller stated it. Else null."),
    final: z.number().nullable().describe("Sale price in EGP, only when the seller stated a lower sale price. Else null."),
  }),
  quantity: z.number().int().nullable().describe("Stock quantity, only when the seller stated it. Else null."),
  sku: z.string().nullable().describe("The seller's own stock code, only when the input labels it as SKU or item code. A model number is not a SKU. Else null."),
  condition: z.enum(CONDITIONS).nullable(),
  dimensions: z.object({
    length: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    unit: z.enum(["cm", "in"]).nullable(),
    weight: z.number().nullable(),
    weightUnit: z.enum(["kg", "g", "lb"]).nullable(),
  }).describe("Only values stated in the input. Else null."),
  variantTypes: z
    .array(
      z.object({
        kind: z.enum(VARIANT_KINDS),
        nameEn: z.string(),
        nameAr: z.string(),
        valuesEn: z.array(z.string()).max(20),
        valuesAr: z.array(z.string()).max(20).describe("Same order and count as valuesEn."),
      }),
    )
    .max(3)
    .describe("Options the buyer chooses (colors, sizes…), only when the input lists them."),
  missing: z.array(z.enum(MISSING_FIELDS)).describe("Important fields the input did not give."),
  warnings: z.array(z.string()).max(3).describe("Short notes for the seller in Arabic, e.g. the photos show different products."),
})

export type ProductAutofillOutput = z.infer<typeof productAutofillOutputSchema>

/** What the route returns on success: the cleaned output plus the seller's remaining calls today. */
export type ProductAutofillResult = {
  output: ProductAutofillOutput
  remainingToday: number
}

export type ProductAutofillResponse =
  | { ok: true; result: ProductAutofillResult }
  | { ok: false; error: AutofillErrorCode }

const sizeOf = (files: AutofillFile[]) => files.reduce((sum, file) => sum + file.size, 0)

/** Checks the request limits; returns an error code or null when the input is usable. */
export function validateAutofillInput(input: AutofillInput): AutofillErrorCode | null {
  const text = input.text.trim()
  if (!text && input.images.length === 0 && !input.pdf) return "empty"
  if (input.text.length > AUTOFILL_LIMITS.maxTextLength) return "tooLarge"
  if (input.images.length > AUTOFILL_LIMITS.maxImages) return "tooLarge"
  for (const image of input.images) {
    if (!(AUTOFILL_IMAGE_TYPES as readonly string[]).includes(image.mediaType)) return "badFile"
    if (image.size > AUTOFILL_LIMITS.maxImageBytes) return "tooLarge"
  }
  if (input.pdf) {
    if (input.pdf.mediaType !== AUTOFILL_PDF_TYPE) return "badFile"
    if (input.pdf.size > AUTOFILL_LIMITS.maxPdfBytes) return "tooLarge"
  }
  const total = sizeOf(input.images) + (input.pdf?.size ?? 0) + input.text.length
  if (total > AUTOFILL_LIMITS.maxTotalBytes) return "tooLarge"
  return null
}
