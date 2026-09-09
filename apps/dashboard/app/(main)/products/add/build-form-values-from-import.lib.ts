import slugify from "slugify"
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib"
import {
  buildVariantLocalizedFromCombo,
  createEmptyVariantType,
  type VariantTypeFormValue,
} from "@/lib/utils/variant-types.lib"
import { searchBrands } from "@/actions/brands"
import {
  flattenCategories,
  searchCategoriesByProductName,
} from "./add-product.lib"
import {
  defaultLocalizedFields,
  defaultValues,
  type AddProductFormData,
  type CategoryOption,
  type SupportedLocale,
} from "./add-product.schema"
import type { ParsedProductImport } from "./parse-product-import.types"

export interface BuildFormValuesContext {
  sellerPricing: SellerPricingSettings
  categories: CategoryOption[]
}

export interface BuildFormValuesOptions {
  /** Skip image import when form already has images (single-product path). */
  existingImages?: string[]
}

export interface BuildFormValuesResult {
  values: AddProductFormData
  imagesImported: number
  brandMatched: boolean
  categoryMatched: boolean
}

const LOCALES: SupportedLocale[] = ["en", "ar"]

/** Cap on remote variant images pulled into the media library per import. */
const MAX_VARIANT_IMAGE_IMPORTS = 10

function cloneDefaultValues (): AddProductFormData {
  return {
    ...defaultValues,
    dimensions: { ...defaultValues.dimensions },
    price: { ...defaultValues.price },
    images: [],
    variantTypes: [],
    variants: [],
    localized: {
      en: defaultLocalizedFields(),
      ar: defaultLocalizedFields(),
    },
  } as AddProductFormData
}

async function resolveBrandId (brandName: string): Promise<string | undefined> {
  try {
    const res = await searchBrands(brandName.trim())
    if (!res.success || !res.data?.length) return undefined

    const normalized = brandName.trim().toLowerCase()
    const exact = res.data.find((b) => b.name.toLowerCase() === normalized)
    return (exact ?? res.data[0])?.id
  } catch {
    return undefined
  }
}

function resolveCategoryId (
  categories: CategoryOption[],
  categoryName: string
): string | undefined {
  const normalized = categoryName.trim().toLowerCase()
  const flat = flattenCategories(categories)

  const exact = flat.find(
    (c) =>
      c.name.toLowerCase() === normalized ||
      (c.nameAr && c.nameAr.toLowerCase() === normalized)
  )
  if (exact) return exact.id

  const partial = flat.find(
    (c) =>
      c.name.toLowerCase().includes(normalized) ||
      normalized.includes(c.name.toLowerCase()) ||
      (c.nameAr &&
        (c.nameAr.toLowerCase().includes(normalized) ||
          normalized.includes(c.nameAr.toLowerCase())))
  )
  if (partial) return partial.id

  const suggestions = searchCategoriesByProductName(categories, categoryName, 1)
  return suggestions[0]?.id
}

/** Import remote images into storage, keyed by their original URL. */
async function importImageMap (
  imageUrls: string[]
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(imageUrls))
  const map = new Map<string, string>()

  for (let i = 0; i < unique.length; i += 5) {
    const batch = unique.slice(i, i + 5)
    const importRes = await fetch("/api/import-product-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: batch }),
    })

    if (!importRes.ok) continue

    const importData = await importRes.json()
    const importedPaths: string[] = Array.isArray(importData?.paths)
      ? importData.paths.filter((p: unknown) => typeof p === "string")
      : []
    const skipped = new Set<string>(
      Array.isArray(importData?.skipped)
        ? importData.skipped
            .map((item: { url?: unknown }) => item?.url)
            .filter((url: unknown): url is string => typeof url === "string")
        : []
    )

    // The API uploads in request order, so the non-skipped URLs line up
    // with the returned paths.
    const uploaded = batch.filter((url) => !skipped.has(url))
    uploaded.forEach((url, index) => {
      const path = importedPaths[index]
      if (path) map.set(url, path)
    })
  }

  return map
}

/** Resolve the value index of each variant type for one imported variant. */
function resolveOptionValueIndexes (
  variantTypes: VariantTypeFormValue[],
  variant: NonNullable<ParsedProductImport["variants"]>[number]
): number[] {
  const normalize = (value: string) => value.trim().toLowerCase()

  return variantTypes.map((type, typeIndex) => {
    const enValue = variant.options.en[typeIndex]
    const arValue = variant.options.ar[typeIndex]

    if (enValue) {
      const enIndex = type.localized.en.values.findIndex(
        (value) => normalize(value) === normalize(enValue)
      )
      if (enIndex >= 0) return enIndex
    }

    if (arValue) {
      const arIndex = type.localized.ar.values.findIndex(
        (value) => normalize(value) === normalize(arValue)
      )
      if (arIndex >= 0) return arIndex
    }

    return 0
  })
}

/** Turn imported variant rows into form variants (stock, SKU, price, image). */
function buildVariantRows (
  importedVariants: NonNullable<ParsedProductImport["variants"]>,
  variantTypes: VariantTypeFormValue[],
  values: AddProductFormData,
  imageMap: Map<string, string>,
  sellerPricing: SellerPricingSettings
): NonNullable<AddProductFormData["variants"]> {
  const baseSku = values.sku || "PROD"
  const productList = values.price.list
  const productDiscountType = values.price.discountType ?? "percent"
  const defaultIndex = Math.max(
    importedVariants.findIndex((variant) => variant.isDefault === true),
    0
  )

  return importedVariants.map((variant, index) => {
    const valueIndexes = resolveOptionValueIndexes(variantTypes, variant)
    const localized = buildVariantLocalizedFromCombo(variantTypes, valueIndexes)

    const listPrice = variant.price?.list ?? productList
    const discountType =
      variant.price?.discountType ?? productDiscountType ?? "percent"

    let discountValue = variant.price?.discountValue
    if (
      discountValue === undefined &&
      listPrice &&
      variant.price?.final !== undefined
    ) {
      discountValue = calculateDiscountFromFinalPrice(
        listPrice,
        variant.price.final,
        discountType,
        sellerPricing
      )
    }
    if (discountValue === undefined && variant.price?.final === undefined) {
      discountValue = values.price.discountValue
    }

    const finalPrice =
      variant.price?.final ??
      (listPrice
        ? calculateProductFinalPrice(
            listPrice,
            discountValue,
            discountType,
            sellerPricing
          )
        : values.price.final)

    const comboSlug = valueIndexes
      .map(
        (valueIndex, typeIndex) =>
          variantTypes[typeIndex]?.localized.en.values[valueIndex]
            ?.toLowerCase()
            .replace(/\s+/g, "-") ?? "value"
      )
      .join("-")

    const importedImage = variant.image ? imageMap.get(variant.image) : undefined
    const isDefault = index === defaultIndex
    const images = isDefault
      ? values.images
      : importedImage
        ? [importedImage]
        : []

    return {
      title: localized.en.title,
      sku: variant.sku || `${baseSku}-${comboSlug}`.toUpperCase(),
      listPrice,
      discountValue: discountValue ?? 0,
      discountType,
      price: finalPrice,
      discountEndsAt: null,
      stock: variant.stock ?? 0,
      isDefault,
      images,
      imageUrl: images[0],
      localized,
      optionValueIndexes: valueIndexes,
      option1: localized.en.option1,
      option2: localized.en.option2,
      option3: localized.en.option3,
      barCode: variant.barCode ?? "",
      position: index + 1,
    }
  }) as NonNullable<AddProductFormData["variants"]>
}

/** Build complete AddProductFormData from a parsed import (URL scrape / JSON / text). */
export async function buildFormValuesFromImport (
  data: ParsedProductImport,
  ctx: BuildFormValuesContext,
  options: BuildFormValuesOptions = {}
): Promise<BuildFormValuesResult> {
  const values = cloneDefaultValues()
  let brandMatched = false
  let categoryMatched = false
  let imagesImported = 0

  for (const locale of LOCALES) {
    const fields = data.localized?.[locale]
    if (!fields) continue

    if (fields.title) {
      values.localized[locale].title = fields.title
      values.localized[locale].slug = slugify(fields.title, {
        lower: true,
        strict: true,
      })
    }

    if (fields.description) {
      values.localized[locale].description = fields.description
    }

    if (fields.content) {
      values.localized[locale].content = fields.content
    }

    if (fields.bulletPoints && fields.bulletPoints.length > 0) {
      values.localized[locale].bulletPoints = fields.bulletPoints.slice(0, 10)
    }

    if (fields.metaTitle) {
      values.localized[locale].metaTitle = fields.metaTitle.slice(0, 60)
    } else if (fields.title) {
      values.localized[locale].metaTitle = fields.title.slice(0, 60)
    }

    if (fields.metaDescription) {
      values.localized[locale].metaDescription = fields.metaDescription.slice(
        0,
        160
      )
    } else if (fields.description) {
      values.localized[locale].metaDescription = fields.description.slice(
        0,
        160
      )
    }
  }

  if (data.price?.list) {
    const listPrice = data.price.list
    values.price.list = listPrice
    values.price.base = listPrice

    // Prefer the type from JSON (`percent` / `percentage` → percent).
    const discountType = data.price.discountType ?? "amount"

    values.price.discountType = discountType

    if (data.price.final) {
      values.price.final = data.price.final
      if (data.price.discountValue !== undefined) {
        values.price.discountValue = data.price.discountValue
      } else {
        values.price.discountValue = calculateDiscountFromFinalPrice(
          listPrice,
          data.price.final,
          discountType,
          ctx.sellerPricing
        )
      }
    } else if (data.price.discountValue !== undefined) {
      values.price.discountValue = data.price.discountValue
      values.price.final = calculateProductFinalPrice(
        listPrice,
        data.price.discountValue,
        discountType,
        ctx.sellerPricing
      )
    } else {
      values.price.final = calculateProductFinalPrice(
        listPrice,
        undefined,
        discountType,
        ctx.sellerPricing
      )
    }
  } else if (data.price?.final) {
    values.price.final = data.price.final
  }

  if (data.sku) {
    values.sku = data.sku
  }

  values.quantity =
    data.quantity !== undefined &&
    typeof data.quantity === "number" &&
    Number.isFinite(data.quantity) &&
    data.quantity > 0
      ? data.quantity
      : 25

  let importedVariantTypes: VariantTypeFormValue[] = []

  if (data.variantTypes && data.variantTypes.length > 0) {
    importedVariantTypes = data.variantTypes.map((vt, index) => {
      const base = createEmptyVariantType(`import-type-${index}`)
      const swatches = vt.swatches?.filter((s) => typeof s === "string")
      return {
        ...base,
        kind: vt.kind ?? base.kind,
        unit: vt.unit ?? base.unit,
        swatches: swatches && swatches.length > 0 ? swatches : base.swatches,
        localized: {
          en: {
            name: vt.localized.en.name,
            values: vt.localized.en.values,
          },
          ar: {
            name: vt.localized.ar.name,
            values: vt.localized.ar.values,
          },
        },
      }
    })

    values.variantTypes =
      importedVariantTypes as AddProductFormData["variantTypes"]
  }

  if (data.dimensions) {
    const dims = data.dimensions
    values.dimensions = {
      ...values.dimensions,
      length: dims.length ?? values.dimensions?.length,
      width: dims.width ?? values.dimensions?.width,
      height: dims.height ?? values.dimensions?.height,
      weight: dims.weight ?? values.dimensions?.weight,
      unit: dims.unit ?? values.dimensions?.unit ?? "cm",
      weightUnit: dims.weightUnit ?? values.dimensions?.weightUnit ?? "g",
    }
  }

  if (data.fulfillmentType) {
    values.fulfillmentType = data.fulfillmentType
  }

  if (data.freeDelivery !== undefined) {
    values.freeDelivery = data.freeDelivery
  }

  if (data.handlingTime !== undefined) {
    values.handlingTime = data.handlingTime
  }

  if (data.taxClass) {
    values.taxClass = data.taxClass
  }

  if (data.maxOrderQuantity !== undefined) {
    values.maxOrderQuantity = data.maxOrderQuantity
  }

  if (data.condition) {
    values.condition = data.condition
  }

  if (data.conditionDescription) {
    values.conditionDescription = data.conditionDescription
  }

  if (data.isTrending !== undefined) values.isTrending = data.isTrending
  if (data.isSeasonal !== undefined) values.isSeasonal = data.isSeasonal
  if (data.isFeatured !== undefined) values.isFeatured = data.isFeatured
  if (data.isPlatformChoice !== undefined)
    values.isPlatformChoice = data.isPlatformChoice
  if (data.isMostSelling !== undefined)
    values.isMostSelling = data.isMostSelling
  if (data.notes) values.notes = data.notes

  if (data.brand) {
    const brandId = await resolveBrandId(data.brand)
    if (brandId) {
      values.brandId = brandId
      brandMatched = true
    }
  }

  if (data.category) {
    const categoryId = resolveCategoryId(ctx.categories, data.category)
    if (categoryId) {
      values.categoryId = categoryId
      categoryMatched = true
    }
  } else {
    const title = data.localized?.en?.title
    if (title) {
      const suggestions = searchCategoriesByProductName(
        ctx.categories,
        title,
        1
      )
      if (suggestions.length > 0) {
        values.categoryId = suggestions[0]!.id
        categoryMatched = true
      }
    }
  }

  const existingImages = options.existingImages
  const hasExistingImages =
    Array.isArray(existingImages) && existingImages.length > 0
  const productImageUrls = hasExistingImages ? [] : (data.images ?? []).slice(0, 5)
  const variantImageUrls = Array.from(
    new Set(
      (data.variants ?? [])
        .map((variant) => variant.image)
        .filter((url): url is string => typeof url === "string")
    )
  )
    .filter((url) => !productImageUrls.includes(url))
    .slice(0, MAX_VARIANT_IMAGE_IMPORTS)

  const imageMap =
    productImageUrls.length > 0 || variantImageUrls.length > 0
      ? await importImageMap([...productImageUrls, ...variantImageUrls])
      : new Map<string, string>()

  if (hasExistingImages) {
    values.images = existingImages
  } else {
    const paths = productImageUrls
      .map((url) => imageMap.get(url))
      .filter((path): path is string => Boolean(path))
      .slice(0, 8)
    values.images = paths
    imagesImported = paths.length
  }

  if (importedVariantTypes.length > 0 && data.variants?.length) {
    const variantRows = buildVariantRows(
      data.variants,
      importedVariantTypes,
      values,
      imageMap,
      ctx.sellerPricing
    )
    values.variants = variantRows

    const defaultVariant = variantRows.find((variant) => variant.isDefault)
    if (data.quantity === undefined && defaultVariant) {
      values.quantity = defaultVariant.stock
    }
  }

  return { values, imagesImported, brandMatched, categoryMatched }
}
