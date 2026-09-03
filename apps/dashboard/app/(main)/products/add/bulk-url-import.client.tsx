"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LoaderCircle, RefreshCw, Trash2, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Form } from "@workspace/ui/components/form"
import { Separator } from "@workspace/ui/components/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { cn, getPublicUrl } from "@/lib/utils"
import { bulkCreateProductsAction } from "@/actions/products"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type BrandOption,
  type CategoryOption,
  type SupportedLocale,
} from "./add-product.schema"
import { BasicInformationStep } from "./steps/basic-information-step"
import { PriceStockStep } from "./steps/price-stock-step"
import { SeoStep } from "./steps/seo-step"
import {
  createPendingBulkItems,
  retryBulkItem,
  scrapeBulkUrls,
  type BulkProductItem,
} from "./bulk-url-import.lib"

interface BulkUrlImportProps {
  urls: string[]
  categories: CategoryOption[]
  brands: BrandOption[]
  sellerPricing: SellerPricingSettings
  onExit: () => void
}

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  ar: "العربية",
}

function statusLabel (status: BulkProductItem["status"]): string {
  switch (status) {
    case "pending":
      return "Queued"
    case "fetching":
      return "Fetching"
    case "ready":
      return "Ready"
    case "error":
      return "Error"
    case "saving":
      return "Saving"
    case "saved":
      return "Saved"
    default:
      return status
  }
}

function statusClassName (status: BulkProductItem["status"]): string {
  switch (status) {
    case "ready":
    case "saved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "error":
      return "bg-red-50 text-red-700 border-red-200"
    case "fetching":
    case "saving":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return "bg-gray-50 text-gray-600 border-gray-200"
  }
}

function thumbnailSrc (pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) return undefined
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return getPublicUrl(pathOrUrl, "products")
}

interface BulkItemFormProps {
  item: BulkProductItem
  categories: CategoryOption[]
  brands: BrandOption[]
  sellerPricing: SellerPricingSettings
  activeLocale: SupportedLocale
  onValuesChange: (id: string, values: AddProductFormData) => void
  registerForm: (
    id: string,
    api: { trigger: () => Promise<boolean>; getValues: () => AddProductFormData }
  ) => void
  unregisterForm: (id: string) => void
}

function BulkItemForm ({
  item,
  categories,
  brands,
  sellerPricing,
  activeLocale,
  onValuesChange,
  registerForm,
  unregisterForm,
}: BulkItemFormProps) {
  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema) as any,
    defaultValues: (item.values ?? defaultValues) as any,
    mode: "onChange",
    shouldUnregister: false,
  })

  useEffect(() => {
    if (item.values) {
      form.reset(item.values)
    }
  }, [item.id]) // eslint-disable-line react-hooks/exhaustive-deps -- reset only when item identity changes after scrape

  useEffect(() => {
    registerForm(item.id, {
      trigger: () => form.trigger(),
      getValues: () => form.getValues(),
    })
    return () => unregisterForm(item.id)
  }, [form, item.id, registerForm, unregisterForm])

  useEffect(() => {
    const sub = form.watch((values) => {
      onValuesChange(item.id, values as AddProductFormData)
    })
    return () => sub.unsubscribe()
  }, [form, item.id, onValuesChange])

  return (
    <Form {...form}>
      <div className="space-y-6 pt-2">
        <BasicInformationStep
          categories={categories}
          brands={brands}
          sellerPricing={sellerPricing}
          activeLocale={activeLocale}
          hideImport
        />
        <Separator />
        <PriceStockStep
          sellerPricing={sellerPricing}
          activeLocale={activeLocale}
        />
        <Separator />
        <SeoStep activeLocale={activeLocale} />
      </div>
    </Form>
  )
}

export function BulkUrlImport ({
  urls,
  categories,
  brands,
  sellerPricing,
  onExit,
}: BulkUrlImportProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("en")
  const [items, setItems] = useState<BulkProductItem[]>([])
  const [openIds, setOpenIds] = useState<string[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const formsRef = useRef(
    new Map<
      string,
      { trigger: () => Promise<boolean>; getValues: () => AddProductFormData }
    >()
  )

  const updateItem = useCallback((next: BulkProductItem) => {
    setItems((prev) => prev.map((item) => (item.id === next.id ? next : item)))
  }, [])

  useEffect(() => {
    let cancelled = false
    const pending = createPendingBulkItems(urls)
    setItems(pending)
    setIsFetching(true)

    scrapeBulkUrls(
      pending,
      { sellerPricing, categories },
      (item) => {
        if (!cancelled) updateItem(item)
      }
    ).finally(() => {
      if (!cancelled) setIsFetching(false)
    })

    return () => {
      cancelled = true
    }
  }, [urls, sellerPricing, categories, updateItem])

  const fetchedCount = items.filter(
    (i) => i.status === "ready" || i.status === "error" || i.status === "saved"
  ).length
  const readyCount = items.filter((i) => i.status === "ready").length
  const errorCount = items.filter((i) => i.status === "error").length

  const registerForm = useCallback(
    (
      id: string,
      api: {
        trigger: () => Promise<boolean>
        getValues: () => AddProductFormData
      }
    ) => {
      formsRef.current.set(id, api)
    },
    []
  )

  const unregisterForm = useCallback((id: string) => {
    formsRef.current.delete(id)
  }, [])

  const handleValuesChange = useCallback(
    (id: string, values: AddProductFormData) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                values,
                title: values.localized?.en?.title || item.title,
                thumbnail: values.images?.[0] || item.thumbnail,
              }
            : item
        )
      )
    },
    []
  )

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setOpenIds((prev) => prev.filter((openId) => openId !== id))
    formsRef.current.delete(id)
  }

  const handleRetry = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    updateItem({ ...item, status: "fetching", error: undefined })
    const result = await retryBulkItem(item, { sellerPricing, categories })
    updateItem(result)
    if (result.status === "ready") {
      toast.success("Product fetched successfully")
    } else {
      toast.error(result.error || "Failed to fetch product")
    }
  }

  const handleSaveAll = () => {
    const readyItems = items.filter((i) => i.status === "ready")
    if (readyItems.length === 0) {
      toast.error("No ready products to save")
      return
    }

    startTransition(async () => {
      const validPayloads: AddProductFormData[] = []
      const validIds: string[] = []
      const invalidIds: string[] = []

      for (const item of readyItems) {
        const api = formsRef.current.get(item.id)
        const rawValues = api?.getValues() ?? item.values
        if (!rawValues) {
          invalidIds.push(item.id)
          continue
        }

        if (api) {
          await api.trigger()
        }

        const parsed = addProductFormSchema.safeParse(
          api?.getValues() ?? rawValues
        )
        if (!parsed.success) {
          invalidIds.push(item.id)
          continue
        }

        validPayloads.push(parsed.data)
        validIds.push(item.id)
        updateItem({ ...item, status: "saving", values: parsed.data })
      }

      if (invalidIds.length > 0) {
        setOpenIds((prev) => Array.from(new Set([...prev, ...invalidIds])))
        toast.error(
          `${invalidIds.length} product${invalidIds.length === 1 ? "" : "s"} need fixes before saving`
        )
      }

      if (validPayloads.length === 0) {
        return
      }

      const result = await bulkCreateProductsAction(validPayloads as any)

      if (!result.success && result.inserted === 0) {
        toast.error(result.errors[0]?.message || "Failed to create products")
        setItems((prev) =>
          prev.map((item) =>
            item.status === "saving" ? { ...item, status: "ready" } : item
          )
        )
        return
      }

      setItems((prev) =>
        prev.map((item) => {
          const saveIndex = validIds.indexOf(item.id)
          if (saveIndex < 0) {
            return item.status === "saving" ? { ...item, status: "ready" } : item
          }
          const failed = result.errors.some((e) => e.index === saveIndex)
          if (failed) {
            return {
              ...item,
              status: "error",
              error:
                result.errors.find((e) => e.index === saveIndex)?.message ||
                "Failed to create product",
            }
          }
          return { ...item, status: "saved" }
        })
      )

      const totalAttempted = validPayloads.length
      toast.success(
        `Created ${result.inserted} of ${totalAttempted} product${totalAttempted === 1 ? "" : "s"}`
      )

      if (
        result.inserted > 0 &&
        result.failed === 0 &&
        invalidIds.length === 0
      ) {
        router.push("/products")
      }
    })
  }

  const hostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-24">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Bulk URL Import
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isFetching
                ? `Fetching ${fetchedCount}/${items.length}…`
                : `${readyCount} ready · ${errorCount} failed · ${items.length} total`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {(["en", "ar"] as const).map((loc) => (
                <Button
                  key={loc}
                  type="button"
                  variant={activeLocale === loc ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLocale(loc)}
                  className="min-w-[4rem]"
                >
                  {LOCALE_LABELS[loc]}
                </Button>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onExit}>
              <X className="size-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-muted-foreground">
            No products left. Go back to paste URLs again.
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={openIds}
            onValueChange={setOpenIds}
            className="space-y-3"
          >
            {items.map((item, index) => {
              const thumb = thumbnailSrc(item.thumbnail)
              const label =
                item.title ||
                hostname(item.url) ||
                `Product ${index + 1}`

              return (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border border-gray-200 rounded-lg bg-white px-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <AccordionTrigger className="flex-1 hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left min-w-0">
                        <div className="size-12 rounded-md border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center text-[10px] text-gray-400">
                              {item.status === "fetching" ? "…" : "No img"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.url}
                          </p>
                          {item.error && (
                            <p className="text-xs text-red-600 mt-0.5 truncate">
                              {item.error}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            statusClassName(item.status)
                          )}
                        >
                          {item.status === "fetching" ||
                          item.status === "saving" ? (
                            <span className="inline-flex items-center gap-1">
                              <LoaderCircle className="size-3 animate-spin" />
                              {statusLabel(item.status)}
                            </span>
                          ) : (
                            statusLabel(item.status)
                          )}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.status === "error" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleRetry(item.id)}
                          aria-label="Retry fetch"
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-600"
                        onClick={() => handleRemove(item.id)}
                        aria-label="Remove product"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent>
                    {item.status === "ready" ||
                    item.status === "saving" ||
                    item.status === "saved" ? (
                      item.values ? (
                        <BulkItemForm
                          item={item}
                          categories={categories}
                          brands={brands}
                          sellerPricing={sellerPricing}
                          activeLocale={activeLocale}
                          onValuesChange={handleValuesChange}
                          registerForm={registerForm}
                          unregisterForm={unregisterForm}
                        />
                      ) : null
                    ) : item.status === "error" ? (
                      <div className="py-4 text-sm text-red-600">
                        {item.error || "Failed to fetch this URL."} Use retry
                        or remove this item.
                      </div>
                    ) : (
                      <div className="py-4 text-sm text-muted-foreground flex items-center gap-2">
                        <LoaderCircle className="size-4 animate-spin" />
                        Fetching product details…
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="px-6 py-4 flex items-center justify-between container gap-3">
          <p className="text-sm text-muted-foreground">
            Failed URLs are skipped. Only ready products are saved.
          </p>
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || isFetching || readyCount === 0}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Saving…
              </span>
            ) : (
              `Save all (${readyCount})`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
