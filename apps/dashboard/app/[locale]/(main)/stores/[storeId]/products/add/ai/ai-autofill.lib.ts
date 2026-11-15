import { suggestCategories } from "../add-product.lib"
import { defaultValues, type AddProductFormData, type CategoryOption, type SupportedLocale } from "../add-product.schema"
import type { ParsedProductImport } from "../parse-product-import.types"
import { SELLER_REVIEWS_MAX } from "../../social-proof/social-proof.dto"
import { cairoToday, paragraphsToHtml, type ProductAutofillOutput } from "@workspace/lib/products/autofill"

/**
 * Dashboard helpers for the AI product autofill (PLAN.md AI-1): match the
 * category, turn the output into the import format the form already
 * understands, and merge it into the seller's form without clobbering what
 * they typed. Cleaning the model output is shared with Admin
 * (@workspace/lib/products/autofill) and re-exported here.
 */
export {
  cairoToday,
  cleanAutofillOutput,
  contentBlocksToHtml,
  paragraphsToHtml,
  seoDescription,
  seoTitle,
  sellerGaveFigures,
  type CleanContext,
} from "@workspace/lib/products/autofill"

const LOCALES: SupportedLocale[] = ["ar", "en"]

/**
 * The Tallaby category for the AI output, matched in code from the model's
 * English hint and both titles, so the prompt carries no category list.
 */
export function pickAutofillCategory(categories: CategoryOption[], output: ProductAutofillOutput): string | null {
  const [best] = suggestCategories(
    categories,
    {
      titles: [output.categoryHint ?? undefined, output.localized.en.title, output.localized.ar.title],
      description: output.localized.en.description,
    },
    1,
  )
  return best?.category.id ?? null
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
    // Made in code from the title and description; editing keeps the seller's own SEO lines.
    takeOnce(`${base}.metaTitle`, ai.metaTitle)
    takeOnce(`${base}.metaDescription`, ai.metaDescription)
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
 * The product as it is now, for the edit page's change requests. Text only
 * and trimmed (every character is billed on every call; docs/ai.md); the AI
 * returns the full listing with the requested change applied. No SEO title or
 * description: the AI does not write them.
 */
export function describeCurrentListing(values: AddProductFormData, maxLength: number): string {
  const localized = Object.fromEntries(
    LOCALES.map((locale) => {
      const fields = values.localized?.[locale]
      return [
        locale,
        {
          title: fields?.title ?? "",
          description: htmlToText(fields?.description, 800),
          bulletPoints: fields?.bulletPoints ?? [],
          detailedDescription: htmlToText(fields?.content, 1200),
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
