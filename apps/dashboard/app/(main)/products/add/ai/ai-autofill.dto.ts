import { z } from "zod"
import { META_KEYWORDS_MAX } from "../meta-keywords.lib"

/**
 * AI product autofill (PLAN.md AI-1): what the seller sends and what the model
 * must return. The output schema is sent to Gemini as structured output, so it
 * stays flat and nullable (no unions); lengths are clamped again on our side.
 */

export const AUTOFILL_FEATURE = "product_autofill"

/**
 * Input limits. Every image, PDF page and character is billed on every call,
 * so these stay small on purpose (docs/ai.md); the seller adds more photos in
 * the normal image uploader.
 */
export const AUTOFILL_LIMITS = {
  /** Each image costs ~560 input tokens at medium resolution. */
  maxImages: 4,
  /** Per resized image, as sent to the model (the browser shrinks them first). */
  maxImageBytes: 1.5 * 1024 * 1024,
  maxPdfBytes: 4 * 1024 * 1024,
  /** Each PDF page is billed like an image. */
  maxPdfPages: 5,
  /** Under Vercel's 4.5 MB request body limit. */
  maxTotalBytes: 4.4 * 1024 * 1024,
  /** Enough for a description or a spec list, not a whole pasted web page. */
  maxTextLength: 1500,
  /** The current listing sent along when editing a product (JSON). */
  maxCurrentLength: 6000,
} as const

export const AUTOFILL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const AUTOFILL_PDF_TYPE = "application/pdf"

export type AutofillFile = { mediaType: string; data: Uint8Array; size: number }

export type AutofillInput = {
  text: string
  images: AutofillFile[]
  pdf: AutofillFile | null
  /** Edit mode: the product as it is now (JSON), so the text is a change request. */
  current?: string | null
}

/** Error codes returned by the route; the client maps them to `productForm.ai.errors.*`. */
export type AutofillErrorCode =
  | "unauthorized"
  | "disabled"
  | "empty"
  | "tooLarge"
  | "pdfTooLong"
  | "badFile"
  | "rateLimited"
  | "dailyLimit"
  | "busy"
  | "timeout"
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

export const CONTENT_BLOCK_KINDS = ["heading", "paragraph", "list"] as const

/** Most reviews one AI run may add (the form allows SELLER_REVIEWS_MAX). */
export const AUTOFILL_MAX_REVIEWS = 20

/** Field keys the model can report as missing; each has a `productForm.ai.missing.*` string. */
export const MISSING_FIELDS = ["price", "stock", "category", "brand", "dimensions", "weight"] as const
export type MissingField = (typeof MISSING_FIELDS)[number]

// No SEO title or description here: the code makes them from the title and
// the short description (docs/ai.md, "the code does what it can").
const localizedOutputSchema = z.object({
  title: z.string().describe("Product name, clear and specific, at most 120 characters. No price, no emojis."),
  description: z
    .string()
    .describe("Short sales description: 2 or 3 short paragraphs of plain text separated by a blank line. No markdown, no HTML."),
  bulletPoints: z.array(z.string()).max(6).describe("3 to 6 key features or benefits, one short line each."),
  metaKeywords: z
    .array(z.string())
    .max(META_KEYWORDS_MAX)
    .describe(
      "8 to 10 search keywords shoppers would type: the product type, its synonyms and common spellings, brand, material, color, use. Each 1 to 4 words, all different.",
    ),
  // No enum and no maxItems here: with them the whole schema is over Gemini's
  // complexity limit ("Request contains an invalid argument"). cleanContentBlocks
  // checks the kind and caps the counts instead.
  contentBlocks: z
    .array(
      z.object({
        kind: z.string().describe(`One of: ${CONTENT_BLOCK_KINDS.join(", ")}.`),
        text: z.string().describe("The heading or paragraph text. For a list, an optional short lead-in, else empty."),
        items: z.array(z.string()).describe("Bullet items for a list block, at most 8, one short line each. Empty for other kinds."),
      }),
    )
    .describe(
      "Follow DETAILED_DESCRIPTION. The detailed description on the product page, as blocks: a heading, a short intro paragraph, then 2 to 4 headed parts (what it is and why it is useful, specs and materials, how to use or care for it, what is in the box) using paragraphs and lists. Facts only from the input. Plain text, no markdown.",
    ),
})

/**
 * What the model returns. Gemini rejects a response schema over its complexity
 * limit with a bare "Request contains an invalid argument", and this schema is
 * right at that limit (checked live 2026-10-28): enums cost the most, so the
 * fixed lists below are plain strings that cleanAutofillOutput checks. Test a
 * real call after adding any field.
 */
export const productAutofillOutputSchema = z.object({
  localized: z.object({
    ar: localizedOutputSchema.describe("Arabic copy for Egyptian shoppers, clear and natural."),
    en: localizedOutputSchema.describe("English copy."),
  }),
  // A hint, not an id: sending the 541-category list cost ~24k input tokens a
  // call (2026-10-29). The form matches the category from the titles and this hint.
  categoryHint: z.string().nullable().describe("The product type in plain English, 1 to 4 words (e.g. running shoes). Null if unclear."),
  brandName: z.string().nullable().describe("Brand only when it is written in the input or clearly visible on the product. Else null."),
  storeCategoryName: z
    .string()
    .nullable()
    .describe("The best matching name from STORE CATEGORIES, or a short new category name (Arabic) if none fits. Null if unsure."),
  price: z.object({
    list: z.number().nullable().describe("Regular price in EGP, only when the seller stated it. Else null."),
    final: z.number().nullable().describe("Sale price in EGP, only when the seller stated a lower sale price. Else null."),
    discountPercent: z
      .number()
      .nullable()
      .describe("Percent off (1 to 90) when the seller asked for a discount as a percentage and gave no sale price. Else null."),
    discountEndsAt: z
      .string()
      .nullable()
      .describe("Last day of the discount as YYYY-MM-DD, from an end date or duration the seller gave (count from TODAY). Else null."),
  }),
  showLiveViews: z
    .boolean()
    .nullable()
    .describe("true or false only when the seller asks to turn the live views counter on or off. Else null."),
  quantity: z.number().int().nullable().describe("Stock quantity, only when the seller stated it. Else null."),
  sku: z.string().nullable().describe("The seller's own stock code, only when the input labels it as SKU or item code. A model number is not a SKU. Else null."),
  condition: z.string().nullable().describe(`One of: ${CONDITIONS.join(", ")}. Null if unsure.`),
  dimensions: z.object({
    length: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    unit: z.string().nullable().describe("cm or in."),
    weight: z.number().nullable(),
    weightUnit: z.string().nullable().describe("kg, g or lb."),
  }).describe("Only values stated in the input. Else null."),
  variantTypes: z
    .array(
      z.object({
        kind: z.string().describe(`One of: ${VARIANT_KINDS.join(", ")}.`),
        nameEn: z.string(),
        nameAr: z.string(),
        valuesEn: z.array(z.string()).max(20),
        valuesAr: z.array(z.string()).max(20).describe("Same order and count as valuesEn."),
      }),
    )
    .max(3)
    .describe("Options the buyer chooses (colors, sizes…), only when the input lists them."),
  reviews: z
    .array(
      z.object({
        reviewerName: z.string().describe("The customer's name as shown, or empty."),
        rating: z.number().int().describe("1 to 5: the stars shown; else 5 for a clearly happy customer, 3 for mixed, 1 or 2 for unhappy."),
        comment: z.string().describe("The customer's words as written (fix only obvious typos)."),
      }),
    )
    .max(AUTOFILL_MAX_REVIEWS)
    .describe(
      "Real customer reviews that appear in the input: screenshots of customer messages, comments or ratings, or reviews the seller pasted. Never write a review yourself. Empty when the input has none.",
    ),
  productPhotos: z
    .array(z.number().int())
    .describe(
      "The numbers (from 0, in the order attached) of the attached images that are photos of the product itself. Leave out screenshots of reviews, chats, price lists or spec sheets.",
    ),
  missing: z.array(z.string()).describe(`Important fields the input did not give, from: ${MISSING_FIELDS.join(", ")}.`),
  warnings: z.array(z.string()).max(3).describe("Short notes for the seller in Arabic, e.g. the photos show different products."),
})

/** The model's raw answer, before cleanAutofillOutput. */
export type ProductAutofillRawOutput = z.infer<typeof productAutofillOutputSchema>

type RawVariantType = ProductAutofillRawOutput["variantTypes"][number]

type RawLocalized = ProductAutofillRawOutput["localized"]["ar"]
/** One language of the cleaned answer, with the SEO title and description the code wrote. */
export type AutofillLocalizedOutput = RawLocalized & { metaTitle: string; metaDescription: string }

/** The cleaned answer: the plain-string fields narrowed to their fixed lists. */
export type ProductAutofillOutput = Omit<
  ProductAutofillRawOutput,
  "localized" | "condition" | "missing" | "variantTypes" | "dimensions"
> & {
  localized: { ar: AutofillLocalizedOutput; en: AutofillLocalizedOutput }
  condition: (typeof CONDITIONS)[number] | null
  missing: MissingField[]
  variantTypes: Array<Omit<RawVariantType, "kind"> & { kind: (typeof VARIANT_KINDS)[number] }>
  dimensions: Omit<ProductAutofillRawOutput["dimensions"], "unit" | "weightUnit"> & {
    unit: "cm" | "in" | null
    weightUnit: "kg" | "g" | "lb" | null
  }
}

/** What the route returns on success: the cleaned output plus the seller's remaining calls today. */
export type ProductAutofillResult = {
  output: ProductAutofillOutput
  remainingToday: number
}

export type ProductAutofillResponse =
  | { ok: true; result: ProductAutofillResult }
  | { ok: false; error: AutofillErrorCode }

const sizeOf = (files: AutofillFile[]) => files.reduce((sum, file) => sum + file.size, 0)

/**
 * Page count read from the PDF's page objects, or null when they are packed
 * in compressed object streams (then only the byte limit applies). Cheap and
 * dependency-free; it only has to catch a long catalogue sent by mistake.
 */
export function countPdfPages(data: Uint8Array): number | null {
  const text = new TextDecoder("latin1").decode(data)
  const pages = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g)?.length ?? 0
  return pages > 0 ? pages : null
}

/** Checks the request limits; returns an error code or null when the input is usable. */
export function validateAutofillInput(input: AutofillInput): AutofillErrorCode | null {
  const text = input.text.trim()
  if (!text && input.images.length === 0 && !input.pdf) return "empty"
  if (input.text.length > AUTOFILL_LIMITS.maxTextLength) return "tooLarge"
  if ((input.current?.length ?? 0) > AUTOFILL_LIMITS.maxCurrentLength) return "tooLarge"
  if (input.images.length > AUTOFILL_LIMITS.maxImages) return "tooLarge"
  for (const image of input.images) {
    if (!(AUTOFILL_IMAGE_TYPES as readonly string[]).includes(image.mediaType)) return "badFile"
    if (image.size > AUTOFILL_LIMITS.maxImageBytes) return "tooLarge"
  }
  if (input.pdf) {
    if (input.pdf.mediaType !== AUTOFILL_PDF_TYPE) return "badFile"
    if (input.pdf.size > AUTOFILL_LIMITS.maxPdfBytes) return "tooLarge"
    if ((countPdfPages(input.pdf.data) ?? 0) > AUTOFILL_LIMITS.maxPdfPages) return "pdfTooLong"
  }
  const total = sizeOf(input.images) + (input.pdf?.size ?? 0) + input.text.length + (input.current?.length ?? 0)
  if (total > AUTOFILL_LIMITS.maxTotalBytes) return "tooLarge"
  return null
}
