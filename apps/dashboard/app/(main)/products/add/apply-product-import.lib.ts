import type { UseFormReturn } from "react-hook-form"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import type {
  AddProductFormData,
  CategoryOption,
} from "./add-product.schema"
import type { ParsedProductImport } from "./parse-product-import.types"
import { buildFormValuesFromImport } from "./build-form-values-from-import.lib"

export interface ApplyProductImportContext {
  sellerPricing: SellerPricingSettings
  categories: CategoryOption[]
}

export interface ApplyProductImportResult {
  imagesImported: number
  brandMatched: boolean
  categoryMatched: boolean
}

export async function applyProductImportToForm (
  form: UseFormReturn<AddProductFormData>,
  data: ParsedProductImport,
  ctx: ApplyProductImportContext
): Promise<ApplyProductImportResult> {
  const productUrl = form.getValues("productUrl")
  const existingImages = form.getValues("images") || []

  const { values, imagesImported, brandMatched, categoryMatched } =
    await buildFormValuesFromImport(data, ctx, { existingImages })

  form.reset({
    ...values,
    productUrl: productUrl ?? "",
  })

  if (imagesImported > 0) {
    await form.trigger("images")
  }

  return { imagesImported, brandMatched, categoryMatched }
}
