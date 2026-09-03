import slugify from "slugify"
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib"
import {
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

async function importImagePaths (imageUrls: string[]): Promise<string[]> {
  const urlsToImport = imageUrls.slice(0, 5)
  const paths: string[] = []

  for (let i = 0; i < urlsToImport.length; i += 5) {
    const batch = urlsToImport.slice(i, i + 5)
    const importRes = await fetch("/api/import-product-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: batch }),
    })

    if (!importRes.ok) continue

    const importData = await importRes.json()
    const importedPaths = Array.isArray(importData?.paths)
      ? importData.paths.filter((p: unknown) => typeof p === "string")
      : []

    paths.push(...importedPaths)
  }

  return paths.slice(0, 8)
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

    const discountType = data.price.discountType ?? "amount"

    if (data.price.final) {
      values.price.final = data.price.final
      if (data.price.discountValue !== undefined) {
        values.price.discountValue = data.price.discountValue
        values.price.discountType = discountType
      } else {
        values.price.discountValue = calculateDiscountFromFinalPrice(
          listPrice,
          data.price.final,
          discountType,
          ctx.sellerPricing
        )
        values.price.discountType = discountType
      }
    } else if (data.price.discountValue !== undefined) {
      values.price.discountValue = data.price.discountValue
      values.price.discountType = discountType
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

  if (data.variantTypes && data.variantTypes.length > 0) {
    values.variantTypes = data.variantTypes.map((vt, index) => {
      const base = createEmptyVariantType(`import-type-${index}`)
      return {
        ...base,
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
    }) as VariantTypeFormValue[] as AddProductFormData["variantTypes"]
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

  if (data.condition) {
    values.condition = data.condition
  }

  if (data.isTrending !== undefined) values.isTrending = data.isTrending
  if (data.isSeasonal !== undefined) values.isSeasonal = data.isSeasonal
  if (data.isFeatured !== undefined) values.isFeatured = data.isFeatured
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
  if (
    data.images &&
    data.images.length > 0 &&
    !(Array.isArray(existingImages) && existingImages.length > 0)
  ) {
    const paths = await importImagePaths(data.images)
    values.images = paths
    imagesImported = paths.length
  } else if (Array.isArray(existingImages) && existingImages.length > 0) {
    values.images = existingImages
  }

  return { values, imagesImported, brandMatched, categoryMatched }
}
