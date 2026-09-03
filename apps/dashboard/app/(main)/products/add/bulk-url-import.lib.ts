import { buildFormValuesFromImport } from "./build-form-values-from-import.lib"
import { buildParsedImportFromScrape } from "./parse-product-import.lib"
import type { AddProductFormData, CategoryOption } from "./add-product.schema"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"

export type BulkItemStatus =
  | "pending"
  | "fetching"
  | "ready"
  | "error"
  | "saving"
  | "saved"

export interface BulkProductItem {
  id: string
  url: string
  status: BulkItemStatus
  error?: string
  values?: AddProductFormData
  title?: string
  thumbnail?: string
}

export interface BulkScrapeContext {
  sellerPricing: SellerPricingSettings
  categories: CategoryOption[]
}

const FETCH_CONCURRENCY = 3

async function scrapeOneUrl (
  url: string,
  ctx: BulkScrapeContext
): Promise<{
  values: AddProductFormData
  title: string
  thumbnail?: string
}> {
  const [resEn, resAr] = await Promise.all([
    fetch("/api/fetch-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, locale: "en" }),
    }),
    fetch("/api/fetch-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, locale: "ar" }),
    }),
  ])

  const dataEn = await resEn.json()
  const dataAr = await resAr.json()

  if (!resEn.ok) {
    throw new Error(
      typeof dataEn?.error === "string"
        ? dataEn.error
        : "Failed to fetch product data"
    )
  }

  const parsed = buildParsedImportFromScrape(dataEn, dataAr)
  const title = (parsed.localized?.en?.title || "").trim()
  if (!title) {
    throw new Error("No product title found on page")
  }

  const { values } = await buildFormValuesFromImport(parsed, ctx)
  values.productUrl = url

  const thumbnail =
    Array.isArray(values.images) && values.images.length > 0
      ? values.images[0]
      : Array.isArray(parsed.images) && parsed.images.length > 0
        ? parsed.images[0]
        : undefined

  return { values, title, thumbnail }
}

export function createPendingBulkItems (urls: string[]): BulkProductItem[] {
  return urls.map((url, index) => ({
    id: `bulk-${index}-${Date.now()}`,
    url,
    status: "pending" as const,
  }))
}

/** Scrape URLs with limited concurrency; calls onUpdate after each item finishes. */
export async function scrapeBulkUrls (
  items: BulkProductItem[],
  ctx: BulkScrapeContext,
  onUpdate: (item: BulkProductItem) => void
): Promise<void> {
  let cursor = 0

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++
      const item = items[index]
      if (!item) continue

      onUpdate({ ...item, status: "fetching", error: undefined })

      try {
        const scraped = await scrapeOneUrl(item.url, ctx)
        onUpdate({
          ...item,
          status: "ready",
          values: scraped.values,
          title: scraped.title,
          thumbnail: scraped.thumbnail,
          error: undefined,
        })
      } catch (err) {
        onUpdate({
          ...item,
          status: "error",
          error: err instanceof Error ? err.message : "Failed to fetch product",
          values: undefined,
          title: undefined,
          thumbnail: undefined,
        })
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(FETCH_CONCURRENCY, items.length) },
    () => worker()
  )
  await Promise.all(workers)
}

export async function retryBulkItem (
  item: BulkProductItem,
  ctx: BulkScrapeContext
): Promise<BulkProductItem> {
  try {
    const scraped = await scrapeOneUrl(item.url, ctx)
    return {
      ...item,
      status: "ready",
      values: scraped.values,
      title: scraped.title,
      thumbnail: scraped.thumbnail,
      error: undefined,
    }
  } catch (err) {
    return {
      ...item,
      status: "error",
      error: err instanceof Error ? err.message : "Failed to fetch product",
      values: undefined,
      title: undefined,
      thumbnail: undefined,
    }
  }
}
