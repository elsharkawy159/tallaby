import { cleanKeywords } from "../meta-keywords.lib"
import { defaultValues, type AddProductFormData, type SupportedLocale } from "../add-product.schema"
import type { ParsedProductImport } from "../parse-product-import.types"
import type { ProductAutofillOutput } from "./ai-autofill.dto"

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
}

/**
 * Defence in depth on top of the prompt: lengths clamped, an unknown category
 * dropped, and price / stock / SKU dropped when the seller gave no figures at
 * all (the model must never invent them).
 */
export function cleanAutofillOutput(output: ProductAutofillOutput, ctx: CleanContext): ProductAutofillOutput {
  const figures = sellerGaveFigures(ctx.sellerText, ctx.hasPdf)
  const missing = new Set(output.missing)

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
          metaKeywords: cleanKeywords(fields.metaKeywords).slice(0, 10),
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
  if (!list) missing.add("price")

  const quantity = figures && typeof output.quantity === "number" && output.quantity >= 0 ? Math.floor(output.quantity) : null
  if (quantity === null) missing.add("stock")

  const variantTypes = output.variantTypes
    .map((type) => {
      const valuesEn = clipLines(type.valuesEn, 20, 60)
      const valuesAr = clipLines(type.valuesAr, 20, 60)
      const length = Math.max(valuesEn.length, valuesAr.length)
      return {
        kind: type.kind,
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
    price: { list, final },
    quantity,
    sku: figures ? clip(output.sku, 64) || null : null,
    condition: output.condition,
    dimensions: {
      length: positive(dims.length),
      width: positive(dims.width),
      height: positive(dims.height),
      unit: dims.unit,
      weight: positive(dims.weight),
      weightUnit: dims.weightUnit,
    },
    variantTypes,
    missing: [...missing],
    warnings: clipLines(output.warnings, 3, 200),
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

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

export type AutofillMode = "empty" | "replace"

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
  extra: { categoryId: string | null; brandId?: string; storeCategoryName: string | null },
): AutofillChange[] {
  const changes: AutofillChange[] = []
  const take = (path: string, value: unknown, gate: string = path) => {
    if (isBlank(value)) return
    if (mode === "empty" && !isUntouched(getPath(current, gate), gate)) return
    changes.push({ path, value })
  }

  for (const locale of LOCALES) {
    const ai = output.localized[locale]
    const base = `localized.${locale}`
    if (ai.title) {
      take(`${base}.title`, filled.localized[locale].title)
      take(`${base}.slug`, filled.localized[locale].slug, `${base}.title`)
    }
    take(`${base}.description`, filled.localized[locale].description)
    take(`${base}.bulletPoints`, filled.localized[locale].bulletPoints)
    take(`${base}.metaTitle`, ai.metaTitle)
    take(`${base}.metaDescription`, ai.metaDescription)
    take(`${base}.metaKeywords`, ai.metaKeywords)
  }

  take("categoryId", extra.categoryId)
  if (extra.brandId) take("brandId", extra.brandId)
  if (extra.storeCategoryName && !current.sellerCategoryId) take("sellerCategoryName", extra.storeCategoryName)

  if (output.price.list) {
    for (const key of ["list", "base", "final", "discountValue", "discountType"] as const) {
      take(`price.${key}`, filled.price[key as keyof typeof filled.price], "price.list")
    }
  }
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

  return changes
}
