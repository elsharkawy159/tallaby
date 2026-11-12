import { cleanKeywords } from "./keywords.lib"
import {
  CONDITIONS,
  CONTENT_BLOCK_KINDS,
  AUTOFILL_MAX_REVIEWS,
  MISSING_FIELDS,
  VARIANT_KINDS,
  type ProductAutofillOutput,
  type ProductAutofillRawOutput,
} from "./autofill.dto"

type ContentBlockKind = (typeof CONTENT_BLOCK_KINDS)[number]
type SupportedLocale = "ar" | "en"

/** The value when it is one of `allowed`, else null (the schema sends these as plain strings). */
const oneOf = <T extends string>(allowed: readonly T[], value: string | null | undefined): T | null => {
  const key = (value ?? "").trim().toLowerCase()
  return (allowed as readonly string[]).includes(key) ? (key as T) : null
}

/**
 * Pure helpers for the AI product autofill (PLAN.md AI-1), shared by the
 * seller dashboard and Admin: clean the model output and turn its content
 * blocks into the rich-text editor HTML.
 */

const LOCALES: SupportedLocale[] = ["ar", "en"]

const clip = (value: string | null | undefined, max: number) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max).trim()

const clipLines = (values: readonly string[] | null | undefined, maxItems: number, maxLength: number) =>
  (values ?? []).map((value) => clip(value, maxLength)).filter(Boolean).slice(0, maxItems)

const positive = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null

/** True when the seller's own words could contain a price, stock count or code. */
export function sellerGaveFigures(text: string, hasPdf: boolean): boolean {
  return hasPdf || /[0-9٠-٩]/.test(text)
}

export type CleanContext = {
  sellerText: string
  hasPdf: boolean
  /** How many images were attached, to check the product photo numbers. */
  imageCount?: number
  /** Today in Cairo as YYYY-MM-DD; a discount end date before it is dropped. */
  today?: string
}

/** Today's date in Cairo as YYYY-MM-DD (the date the prompt and the end-date check use). */
export const cairoToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** A real calendar day from today up to a year ahead, else null. */
function cleanEndDay(value: string | null | undefined, today: string): string | null {
  const day = (value ?? "").trim()
  if (!ISO_DAY.test(day)) return null
  const date = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) return null
  const limit = new Date(`${today}T00:00:00Z`)
  limit.setUTCFullYear(limit.getUTCFullYear() + 1)
  return day >= today && date <= limit ? day : null
}

/** Cut at the last word break that fits, so an SEO line never ends mid-word. */
function clipWords(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max + 1)
  const space = cut.lastIndexOf(" ")
  return (space > max * 0.6 ? cut.slice(0, space) : text.slice(0, max)).replace(/[\s,.،;:–-]+$/, "")
}

/** SEO title from the product title (the model no longer writes one; docs/ai.md). */
export const seoTitle = (title: string) => clipWords(title, 60)

/** SEO description from the first sentences of the short description. */
export const seoDescription = (description: string) => clipWords(description.replace(/\n+/g, " "), 160)

/** The sale price for a percent off, rounded to whole piastres. */
const priceAfterPercent = (list: number, percent: number) => Math.round(Math.round(list * 100) * (100 - percent) / 100) / 100

/**
 * Defence in depth on top of the prompt: lengths clamped, price / stock / SKU
 * dropped when the seller gave no figures at all (the model must never invent
 * them), and the SEO title and description written here from the copy. The
 * category is matched later, on the client (pickAutofillCategory).
 */
export function cleanAutofillOutput(output: ProductAutofillRawOutput, ctx: CleanContext): ProductAutofillOutput {
  const figures = sellerGaveFigures(ctx.sellerText, ctx.hasPdf)
  const missing = new Set(output.missing.map((field) => oneOf(MISSING_FIELDS, field)).filter((field) => field !== null))
  // Only the category match knows whether a category was found.
  missing.delete("category")

  const localized = Object.fromEntries(
    LOCALES.map((locale) => {
      const fields = output.localized[locale]
      const title = clip(fields.title, 120)
      const description = (fields.description ?? "").trim().slice(0, 3000)
      return [
        locale,
        {
          title,
          description,
          bulletPoints: clipLines(fields.bulletPoints, 6, 200),
          metaTitle: seoTitle(title),
          metaDescription: seoDescription(description),
          metaKeywords: cleanKeywords(fields.metaKeywords),
          contentBlocks: cleanContentBlocks(fields.contentBlocks),
        },
      ]
    }),
  ) as ProductAutofillOutput["localized"]

  let list = figures ? positive(output.price.list) : null
  let final = figures ? positive(output.price.final) : null
  // A lone sale price is the price; a "sale" above the regular price is noise.
  if (!list && final) [list, final] = [final, null]
  if (list && final && final >= list) final = null
  const percent = figures ? positive(output.price.discountPercent) : null
  if (list && !final && percent && percent < 100) final = priceAfterPercent(list, Math.min(percent, 90))
  if (list && final && final >= list) final = null
  if (!list) missing.add("price")
  // An end date only means something on a real sale.
  const discountEndsAt = list && final ? cleanEndDay(output.price.discountEndsAt, ctx.today ?? cairoToday()) : null

  const quantity = figures && typeof output.quantity === "number" && output.quantity >= 0 ? Math.floor(output.quantity) : null
  if (quantity === null) missing.add("stock")

  const variantTypes = output.variantTypes
    .map((type) => {
      const valuesEn = clipLines(type.valuesEn, 20, 60)
      const valuesAr = clipLines(type.valuesAr, 20, 60)
      const length = Math.max(valuesEn.length, valuesAr.length)
      return {
        kind: oneOf(VARIANT_KINDS, type.kind) ?? "custom",
        nameEn: clip(type.nameEn, 40),
        nameAr: clip(type.nameAr, 40),
        // Both languages need the same values in the same order; fill a gap from the other language.
        valuesEn: Array.from({ length }, (_, i) => valuesEn[i] ?? valuesAr[i] ?? ""),
        valuesAr: Array.from({ length }, (_, i) => valuesAr[i] ?? valuesEn[i] ?? ""),
      }
    })
    .filter((type) => (type.nameEn || type.nameAr) && type.valuesEn.length > 0)
    .slice(0, 3)

  const dims = output.dimensions
  return {
    localized,
    categoryHint: clip(output.categoryHint, 60) || null,
    brandName: clip(output.brandName, 80) || null,
    // A name, not a path: "Beauty > Makeup" keeps its last part.
    storeCategoryName: clip(output.storeCategoryName?.split(">").pop(), 80) || null,
    price: { list, final, discountPercent: null, discountEndsAt },
    showLiveViews: typeof output.showLiveViews === "boolean" ? output.showLiveViews : null,
    quantity,
    sku: figures ? clip(output.sku, 64) || null : null,
    condition: oneOf(CONDITIONS, output.condition),
    dimensions: {
      length: positive(dims.length),
      width: positive(dims.width),
      height: positive(dims.height),
      unit: oneOf(["cm", "in"], dims.unit),
      weight: positive(dims.weight),
      weightUnit: oneOf(["kg", "g", "lb"], dims.weightUnit),
    },
    variantTypes,
    reviews: (output.reviews ?? [])
      .map((review) => ({
        reviewerName: clip(review.reviewerName, 80),
        rating: Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5))),
        comment: (review.comment ?? "").trim().slice(0, 1000),
      }))
      .filter((review) => review.comment || review.reviewerName)
      .slice(0, AUTOFILL_MAX_REVIEWS),
    productPhotos: [...new Set(output.productPhotos ?? [])]
      .filter((index) => Number.isInteger(index) && index >= 0 && index < (ctx.imageCount ?? 0))
      .sort((a, b) => a - b),
    missing: [...missing],
    warnings: clipLines(output.warnings, 3, 200),
  }
}

type ContentBlock = ProductAutofillOutput["localized"]["ar"]["contentBlocks"][number]

const asBlockKind = (kind: string | null | undefined): ContentBlockKind | null => {
  const value = (kind ?? "").trim().toLowerCase()
  return (CONTENT_BLOCK_KINDS as readonly string[]).includes(value) ? (value as ContentBlockKind) : null
}

function cleanContentBlocks(blocks: readonly ContentBlock[] | null | undefined): ContentBlock[] {
  // The schema sends kind as a plain string (Gemini's size limit), so unknown kinds are dropped here.
  return (blocks ?? [])
    .flatMap((block) => {
      const kind = asBlockKind(block.kind)
      return kind ? [{ ...block, kind }] : []
    })
    .map((block) => ({
      kind: block.kind,
      text: block.kind === "paragraph" ? (block.text ?? "").trim().slice(0, 1200) : clip(block.text, 160),
      items: block.kind === "list" ? clipLines(block.items, 8, 200) : [],
    }))
    .filter((block) => (block.kind === "list" ? block.items.length > 0 : block.text))
    .slice(0, 14)
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/**
 * Content blocks → the rich-text editor's HTML: the first heading is an h2,
 * the rest h3. Product photos go after the intro and before the second half,
 * so the page reads like a short article.
 */
export function contentBlocksToHtml(blocks: readonly ContentBlock[], imageUrls: readonly string[] = [], alt = ""): string {
  if (blocks.length === 0) return ""
  const images = imageUrls.filter((url) => /^https?:\/\//.test(url)).slice(0, 2)
  const firstParagraph = blocks.findIndex((block) => block.kind === "paragraph")
  const slots = new Map<number, string>()
  if (images[0]) slots.set(firstParagraph >= 0 ? firstParagraph : 0, images[0])
  if (images[1]) {
    const half = blocks.findIndex((block, i) => i > blocks.length / 2 && block.kind === "heading")
    if (half > 0) slots.set(half - 1, images[1])
  }

  let headings = 0
  return blocks
    .map((block, index) => {
      let html: string
      if (block.kind === "heading") {
        const tag = headings++ === 0 ? "h2" : "h3"
        html = `<${tag}>${escapeHtml(block.text)}</${tag}>`
      } else if (block.kind === "paragraph") html = paragraphsToHtml(block.text)
      else {
        const lead = block.text ? `<p><strong>${escapeHtml(block.text)}</strong></p>` : ""
        html = `${lead}<ul>${block.items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join("")}</ul>`
      }
      const image = slots.get(index)
      return image ? `${html}<img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}">` : html
    })
    .join("")
}

/** Plain paragraphs (blank-line separated) → the rich-text editor's HTML. */
export function paragraphsToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("")
}
