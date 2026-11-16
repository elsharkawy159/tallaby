import { calculateProductFinalPrice, normalizePrice, type SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import type { AddProductFormData, SupportedLocale } from "../add-product.schema"

/**
 * The quick AI product uploader (welcome page, owner 2026-11-16): photos, a
 * description and the seller's price become a saved product in one click.
 * Pure helpers, unit-tested; the component is ai-product-uploader.client.tsx.
 */

/** What the button still waits for, in the order the inputs show. */
export type QuickProductMissing = "img" | "desc" | "price"

export function quickProductMissing (input: { images: number; description: string; price: number | null | undefined }): QuickProductMissing | null {
  if (input.images < 1) return "img"
  if (!input.description.trim()) return "desc"
  if (!(typeof input.price === "number" && Number.isFinite(input.price) && input.price > 0)) return "price"
  return null
}

/**
 * The price fields for the seller's own price, which always wins over a price the
 * AI read: no sale, no end date. The same values the pricing section keeps when
 * the discount switch is off (base = list, final = list through the form's pricing).
 */
export function sellerPriceFields (price: number, sellerPricing: SellerPricingSettings): AddProductFormData["price"] {
  const list = normalizePrice(price)
  return {
    list,
    base: list,
    final: calculateProductFinalPrice(list, undefined, "percent", sellerPricing),
    discountValue: undefined,
    discountType: "percent",
    discountEndsAt: null,
  }
}

/** What the "created" card shows. */
export type QuickProductCard = {
  id: string
  title: string
  /** The first product image's storage path, or null. */
  image: string | null
  price: number | null
  /** `active` is live; anything else is saved but not live (no publish right yet). */
  status: string
}

/** The product's name in the page language, else the other language. */
export function quickProductTitle (localized: Partial<Record<SupportedLocale, { title?: string | null }>>, locale: string): string {
  const own: SupportedLocale = locale === "en" ? "en" : "ar"
  const other: SupportedLocale = own === "en" ? "ar" : "en"
  return localized[own]?.title?.trim() || localized[other]?.title?.trim() || ""
}

/** The card of a product saved from the form values the uploader sent. */
export function quickProductCardFrom (values: AddProductFormData, created: { id: string; status: string }, locale: string): QuickProductCard {
  const price = values.price?.final ?? values.price?.list
  return {
    id: created.id,
    title: quickProductTitle(values.localized, locale),
    image: values.images?.[0] ?? null,
    price: typeof price === "number" ? price : null,
    status: created.status,
  }
}
