import { cleanKeywords } from "../meta-keywords.lib"
import { defaultValues, type AddProductFormData, type SupportedLocale } from "../add-product.schema"
import type { ParsedProductImport } from "../parse-product-import.types"
import { SELLER_REVIEWS_MAX } from "../../social-proof/social-proof.dto"
import {
  AUTOFILL_MAX_REVIEWS,
  CONDITIONS,
  CONTENT_BLOCK_KINDS,
  MISSING_FIELDS,
  VARIANT_KINDS,
  type ProductAutofillOutput,
  type ProductAutofillRawOutput,
} from "./ai-autofill.dto"

type ContentBlockKind = (typeof CONTENT_BLOCK_KINDS)[number]

/** The value when it is one of `allowed`, else null (the schema sends these as plain strings). */
const oneOf = <T extends string>(allowed: readonly T[], value: string | null | undefined): T | null => {
  const key = (value ?? "").trim().toLowerCase()
  return (allowed as readonly string[]).includes(key) ? (key as T) : null
}

/**
 * Pure helpers for the AI product autofill (PLAN.md AI-1): clean the model's
 * output, turn it into the import format the form already understands, and
 * merge it into the seller's form without clobbering what they typed.
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
  /** Every Tallaby category id the seller may pick. */
  categoryIds: ReadonlySet<string>
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

/** The sale price for a percent off, rounded to whole piastres. */
const priceAfterPercent = (list: number, percent: number) => Math.round(Math.round(list * 100) * (100 - percent) / 100) / 100

/**
 * Defence in depth on top of the prompt: lengths clamped, an unknown category
 * dropped, and price / stock / SKU dropped when the seller gave no figures at
 * all (the model must never invent them).
 */
export function cleanAutofillOutput(output: ProductAutofillRawOutput, ctx: CleanContext): ProductAutofillOutput {
  const figures = sellerGaveFigures(ctx.sellerText, ctx.hasPdf)
  const missing = new Set(output.missing.map((field) => oneOf(MISSING_FIELDS, field)).filter((field) => field !== null))

  const localized = Object.fromEntries(
    LOCALES.map((locale) => {
      const fields = output.localized[locale]
      return [
        locale,
        {
          title: clip(fields.title, 120),
          description: (fields.description ?? "").trim().slice(0, 3000),
          bulletPoints: clipLines(fields.bulletPoints, 6, 200),
          metaTitle: clip(fields.metaTitle, 60),
          metaDescription: clip(fields.metaDescription, 160),
          metaKeywords: cleanKeywords(fields.metaKeywords),
          contentBlocks: cleanContentBlocks(fields.contentBlocks),
        },
      ]
    }),
  ) as ProductAutofillOutput["localized"]

  const categoryId = output.categoryId && ctx.categoryIds.has(output.categoryId) ? output.categoryId : null
  if (!categoryId) missing.add("category")

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
    categoryId,
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

/** The cleaned output in the import format, so `buildFormValuesFromImport` does prices and variants. */
export function toParsedImport(output: ProductAutofillOutput): ParsedProductImport {
  const localized = Object.fromEntries(
    LOCALES.map((locale) => {
      const fields = output.localized[locale]
      return [
        locale,
        {
          title: fields.title || undefined,
          description: fields.description ? paragraphsToHtml(fields.description) : undefined,
          bulletPoints: fields.bulletPoints,
          metaTitle: fields.metaTitle || undefined,
          metaDescription: fields.metaDescription || undefined,
        },
      ]
    }),
  ) as ParsedProductImport["localized"]

  const dims = output.dimensions
  const hasDims = [dims.length, dims.width, dims.height, dims.weight].some((v) => v !== null)
  return {
    localized,
    price: output.price.list ? { list: output.price.list, final: output.price.final ?? undefined } : undefined,
    sku: output.sku ?? undefined,
    quantity: output.quantity ?? undefined,
    condition: output.condition ?? undefined,
    dimensions: hasDims
      ? {
          length: dims.length ?? undefined,
          width: dims.width ?? undefined,
          height: dims.height ?? undefined,
          weight: dims.weight ?? undefined,
          unit: dims.unit ?? undefined,
          weightUnit: dims.weightUnit ?? undefined,
        }
      : undefined,
    variantTypes: output.variantTypes.length
      ? output.variantTypes.map((type) => ({
          kind: type.kind,
          localized: {
            en: { name: type.nameEn || type.nameAr, values: type.valuesEn },
            ar: { name: type.nameAr || type.nameEn, values: type.valuesAr },
          },
        }))
      : undefined,
    brand: output.brandName ?? undefined,
  } as ParsedProductImport
}

/**
 * "empty" fills only blank fields, "replace" overwrites them, and "edit"
 * (the edit product page) applies the seller's change request: it overwrites,
 * but skips a field the AI returned unchanged.
 */
export type AutofillMode = "empty" | "replace" | "edit"

/** A form path the autofill may set, with the value to set. */
export type AutofillChange = { path: string; value: unknown }

const getPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined), source)

const isBlank = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "") ||
  (Array.isArray(value) && value.length === 0)

/** Untouched means blank or still the form's default (quantity 12, condition new…). */
const isUntouched = (current: unknown, path: string) => {
  if (isBlank(current)) return true
  const fallback = getPath(defaultValues, path)
  return fallback !== undefined && JSON.stringify(current) === JSON.stringify(fallback)
}

/**
 * The fields to set: `filled` is the form built from the AI output, `output`
 * says which parts the AI actually gave. In "empty" mode a field the seller
 * already filled is kept; "replace" overwrites. Price fields move as a group.
 */
export function planAutofillChanges(
  current: AddProductFormData,
  filled: AddProductFormData,
  output: ProductAutofillOutput,
  mode: AutofillMode,
  extra: {
    categoryId: string | null
    brandId?: string
    storeCategoryName: string | null
    /** The detailed description per language, built by contentBlocksToHtml. */
    contentHtml?: Partial<Record<SupportedLocale, string>>
  },
): AutofillChange[] {
  const changes: AutofillChange[] = []
  const take = (path: string, value: unknown, gate: string = path) => {
    if (isBlank(value)) return
    if (mode === "empty" && !isUntouched(getPath(current, gate), gate)) return
    if (mode === "edit" && JSON.stringify(getPath(current, path)) === JSON.stringify(value)) return
    changes.push({ path, value })
  }
  // Editing never moves a live product's link or category unless it has none yet.
  const takeOnce = (path: string, value: unknown) => {
    if (mode === "edit" && !isBlank(getPath(current, path))) return
    take(path, value)
  }

  for (const locale of LOCALES) {
    const ai = output.localized[locale]
    const base = `localized.${locale}`
    if (ai.title) {
      take(`${base}.title`, filled.localized[locale].title)
      if (mode === "edit") takeOnce(`${base}.slug`, filled.localized[locale].slug)
      else take(`${base}.slug`, filled.localized[locale].slug, `${base}.title`)
    }
    take(`${base}.description`, filled.localized[locale].description)
    take(`${base}.bulletPoints`, filled.localized[locale].bulletPoints)
    take(`${base}.content`, extra.contentHtml?.[locale])
    take(`${base}.metaTitle`, ai.metaTitle)
    take(`${base}.metaDescription`, ai.metaDescription)
    take(`${base}.metaKeywords`, ai.metaKeywords)
  }

  takeOnce("categoryId", extra.categoryId)
  if (extra.brandId) takeOnce("brandId", extra.brandId)
  if (extra.storeCategoryName && !current.sellerCategoryId) takeOnce("sellerCategoryName", extra.storeCategoryName)

  if (output.price.list) {
    for (const key of ["list", "base", "final", "discountValue", "discountType"] as const) {
      take(`price.${key}`, filled.price[key as keyof typeof filled.price], "price.list")
    }
  }
  // The last day of the sale, to its last minute in the seller's time (the expiry field's default time).
  const currentEnd = current.price?.discountEndsAt
  const sameEndDay = currentEnd && cairoToday(new Date(currentEnd)) === output.price.discountEndsAt
  if (output.price.final && output.price.discountEndsAt && !sameEndDay) {
    take("price.discountEndsAt", new Date(`${output.price.discountEndsAt}T23:59:00`))
  }
  if (output.showLiveViews !== null && output.showLiveViews !== undefined) take("showLiveViews", output.showLiveViews)
  if (output.quantity !== null) take("quantity", filled.quantity)
  if (output.sku) take("sku", filled.sku)
  if (output.condition) take("condition", filled.condition)

  const dims = output.dimensions
  for (const key of ["length", "width", "height", "weight"] as const) {
    if (dims[key] !== null) take(`dimensions.${key}`, filled.dimensions?.[key])
  }
  if (dims.unit && [dims.length, dims.width, dims.height].some((v) => v !== null)) take("dimensions.unit", dims.unit, "dimensions.length")
  if (dims.weightUnit && dims.weight !== null) take("dimensions.weightUnit", dims.weightUnit, "dimensions.weight")

  if (output.variantTypes.length) take("variantTypes", filled.variantTypes)

  // Reviews are always added to the seller's list, never replace it; a comment already there is skipped.
  const existing = current.sellerReviews ?? []
  const known = new Set(existing.map((review) => (review.comment ?? "").trim()))
  const added = (output.reviews ?? []).filter((review) => !known.has(review.comment.trim()))
  if (added.length) {
    changes.push({ path: "sellerReviews", value: [...existing, ...added].slice(0, SELLER_REVIEWS_MAX) })
  }

  return changes
}

/** The form section that shows a field, so it can be opened after the AI fills it. */
export function sectionForPath(path: string): string {
  if (/^localized\.\w+\.(bulletPoints|content)$/.test(path)) return "sec-content"
  if (/^localized\.\w+\.meta/.test(path)) return "sec-visibility"
  if (path.startsWith("price.")) return "sec-price"
  if (path === "quantity" || path === "sku" || path.startsWith("variant")) return "sec-stock"
  if (path.startsWith("dimensions.")) return "sec-shipping"
  if (path === "sellerReviews" || path === "showLiveViews") return "sec-social-proof"
  return "sec-basic"
}

const htmlToText = (html: string | undefined, max: number) =>
  (html ?? "").replace(/<\/(p|h\d|li)>/g, "\n").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*/g, "\n").trim().slice(0, max)

/**
 * The product as it is now, for the edit page's change requests. Text only,
 * so it fits the request limit; the AI returns the full listing with the
 * requested change applied.
 */
export function describeCurrentListing(values: AddProductFormData, maxLength: number): string {
  const localized = Object.fromEntries(
    LOCALES.map((locale) => {
      const fields = values.localized?.[locale]
      return [
        locale,
        {
          title: fields?.title ?? "",
          description: htmlToText(fields?.description, 1500),
          bulletPoints: fields?.bulletPoints ?? [],
          detailedDescription: htmlToText(fields?.content, 2500),
          metaTitle: fields?.metaTitle ?? "",
          metaDescription: fields?.metaDescription ?? "",
          metaKeywords: fields?.metaKeywords ?? [],
        },
      ]
    }),
  )
  const listing = {
    localized,
    price: {
      list: values.price?.list ?? null,
      final: values.price?.final ?? null,
      discountEndsAt: values.price?.discountEndsAt ? cairoToday(new Date(values.price.discountEndsAt)) : null,
    },
    showLiveViews: Boolean(values.showLiveViews),
    quantity: values.quantity ?? null,
    sku: values.sku || null,
    condition: values.condition ?? null,
    dimensions: values.dimensions ?? null,
    variantTypes: (values.variantTypes ?? []).map((type) => ({
      kind: type.kind,
      en: type.localized?.en,
      ar: type.localized?.ar,
    })),
  }
  return JSON.stringify(listing).slice(0, maxLength)
}
