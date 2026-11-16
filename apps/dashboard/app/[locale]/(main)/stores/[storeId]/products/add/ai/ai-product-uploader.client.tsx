"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useForm, useWatch } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Check, ImageIcon, ImagePlus, LoaderCircle, Pencil, Sparkles, X } from "lucide-react"
import { Form } from "@workspace/ui/components/form"
import { createProduct } from "@/actions/products"
import { useAccountMoney } from "@/components/account-money.client"
import { Money } from "@/components/money"
import { Field, Note, SellerButton, Tag, TextArea } from "@/components/seller-ui"
import { Link } from "@/i18n/navigation"
import { storeProductsHref } from "@/lib/products/product-routes.lib"
import { cn, getPublicUrl } from "@/lib/utils"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import { ProductStoreProvider } from "../../_components/product-store.client"
import { ensureTaxonomyItem, setProductSellerTaxonomy } from "../../categories-brands/categories-brands.server"
import { saveProductSocialProof } from "../../social-proof/social-proof.server"
import { addProductFormSchema, defaultValues, type AddProductFormData, type CategoryOption } from "../add-product.schema"
import { toProductPayload } from "../prepare-product-submit.lib"
import { MoneyField } from "../sections/fields"
import { storeProductDraft } from "../use-product-draft"
import { AUTOFILL_IMAGE_TYPES, AUTOFILL_LIMITS } from "./ai-autofill.dto"
import { quickProductCardFrom, quickProductMissing, sellerPriceFields, type QuickProductCard } from "./ai-product-uploader.lib"
import { markProductAiAssisted } from "./ai-source.server"
import { useAiAutofill, type AutofillProgress } from "./use-ai-autofill"

/**
 * The quick AI product uploader (owner, 2026-11-16): product photos, a short
 * description and the seller's price become a product in one click, on any
 * screen (first used by the welcome page's first-product step).
 *
 * It runs the add page's own pipeline on a private form: `useAiAutofill` (the
 * same route, prompt and cost rules, docs/ai.md), then the add page's publish
 * path (add-product.tsx handleSubmit): createProduct, the store category link,
 * the social-proof row and the AI-assisted mark. The seller's price always wins
 * over a price the AI read. Every action takes `storeId` and checks it against
 * the session; this value is only the target.
 *
 * Never publishes an invalid product: when the filled form doesn't pass the
 * product schema (no category matched, no product photo kept…), nothing is
 * saved; the values go to the add page as its stored draft and the seller
 * finishes there (`finishHref`). The AI's variant options are not saved here
 * (the variants editor builds rows from them), so the seller adds those on edit.
 */
export function AiProductUploader (props: {
  storeId: string
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  /** The add form that restores the stored draft (`?method=manual`). */
  finishHref: string
  disabled?: boolean
  onCreated?: (product: QuickProductCard) => void
}) {
  return (
    <ProductStoreProvider storeId={props.storeId}>
      <Uploader {...props} />
    </ProductStoreProvider>
  )
}

type Phase =
  | { kind: "input" }
  | { kind: "reading" }
  | { kind: "photos" }
  | { kind: "saving" }
  /** The AI fill is in the form, but the save failed: retry saves again, with no new AI call. */
  | { kind: "saveFailed" }
  /** The fill isn't a valid product. `stored`: the add page will open with it. */
  | { kind: "incomplete"; stored: boolean }
  | { kind: "created"; product: QuickProductCard }

const PHOTO_ACCEPT = AUTOFILL_IMAGE_TYPES.join(",")

function Uploader ({
  storeId,
  categories,
  sellerPricing,
  finishHref,
  disabled = false,
  onCreated,
}: Parameters<typeof AiProductUploader>[0]) {
  const t = useTranslations("productForm.aiQuick")
  const tAi = useTranslations("productForm.ai")
  const tHint = useTranslations("productForm.aiStage.hint")
  const tReq = useTranslations("productForm.aiStage.req")
  const tPricing = useTranslations("productForm.sections.pricing")
  const tToast = useTranslations("toast")
  const tTaxonomy = useTranslations("categoriesBrands.productForm")
  const tSocialProof = useTranslations("productForm.sections.socialProof")
  const locale = useLocale()

  const form = useForm<AddProductFormData>({
    defaultValues: defaultValues as unknown as AddProductFormData,
    shouldUnregister: false,
  })
  const [phase, setPhase] = useState<Phase>({ kind: "input" })
  const outcome = useRef<AutofillProgress | null>(null)
  const pickerRef = useRef<HTMLInputElement | null>(null)
  const working = useRef(false)

  const ai = useAiAutofill({
    form,
    categories,
    sellerPricing,
    mode: "add",
    onProgress: (progress) => {
      outcome.current = progress
      if (progress.phase === "answered") setPhase({ kind: "photos" })
    },
  })
  const price = useWatch({ control: form.control, name: "price.list" })
  const missing = quickProductMissing({ images: ai.images.length, description: ai.prompt, price })
  const busy = phase.kind === "reading" || phase.kind === "photos" || phase.kind === "saving"
  const locked = disabled || busy
  const { ref: promptRef, ...promptField } = ai.promptField

  /** The add page's publish path for a new product (add-product.tsx handleSubmit), on the validated values. */
  const save = async () => {
    setPhase({ kind: "saving" })
    const values = form.getValues()
    const parsed = addProductFormSchema.safeParse(values)
    if (!parsed.success) {
      setPhase({ kind: "incomplete", stored: storeProductDraft(values) })
      return
    }
    const data = parsed.data
    const { payload, taxonomy } = toProductPayload(data)
    let created: { id: string; status: string }
    try {
      const result = await createProduct(storeId, payload as Parameters<typeof createProduct>[1])
      if (!result.success || !result.data?.id) {
        toast.error(("error" in result && result.error) || tToast("failedToCreateProduct"))
        setPhase({ kind: "saveFailed" })
        return
      }
      created = { id: result.data.id, status: result.data.status ?? "draft" }
    } catch (error) {
      console.error("Quick AI product save failed", error)
      toast.error(tToast("somethingWentWrong"))
      setPhase({ kind: "saveFailed" })
      return
    }

    // The product exists from here on: a failed extra only warns, as on the add page, and never saves again.
    await linkStoreCategory(created.id, data, taxonomy)
    await saveSocialProof(created.id, data)
    await markProductAiAssisted(storeId, created.id, "add").catch(() => null)

    const product = quickProductCardFrom(data, created, locale)
    setPhase({ kind: "created", product })
    onCreated?.(product)
  }

  const linkStoreCategory = async (
    productId: string,
    data: AddProductFormData,
    taxonomy: { sellerCategoryId: string | null; sellerBrandId: string | null },
  ) => {
    try {
      const name = data.sellerCategoryName?.trim()
      let sellerCategoryId: string | null = null
      if (!name && data.sellerCategoryId) sellerCategoryId = data.sellerCategoryId
      else if (name || data.categoryId) {
        const ensured = await ensureTaxonomyItem(storeId, "category", name ? { name } : { sourceId: data.categoryId })
        sellerCategoryId = ensured.success ? ensured.data.id : null
      }
      const linked = await setProductSellerTaxonomy(storeId, productId, { ...taxonomy, sellerCategoryId })
      if (!linked.success || (Boolean(name || data.sellerCategoryId) && !sellerCategoryId)) toast.warning(tTaxonomy("linkFailed"))
    } catch {
      toast.warning(tTaxonomy("linkFailed"))
    }
  }

  const saveSocialProof = async (productId: string, data: AddProductFormData) => {
    try {
      const saved = await saveProductSocialProof(storeId, productId, {
        showLiveViews: data.showLiveViews ?? false,
        trackStock: data.trackStock ?? true,
        showLowStockBadge: data.showLowStockBadge ?? false,
        lowStockThreshold: data.lowStockThreshold ?? null,
        minOrderQuantity: data.minOrderQuantity ?? 1,
        reviews: data.sellerReviews ?? [],
      })
      if (!saved.success) toast.warning(tSocialProof("saveFailed"))
    } catch {
      toast.warning(tSocialProof("saveFailed"))
    }
  }

  const create = async () => {
    if (working.current || locked || missing || ai.outOfCalls) return
    working.current = true
    try {
      const sellerPrice = form.getValues("price.list")
      const previews = ai.images.map((item) => item.preview)
      outcome.current = null
      setPhase({ kind: "reading" })
      await ai.submit()
      // Set by onProgress during the run (TypeScript still sees the null above).
      const result = outcome.current as AutofillProgress | null
      // Failed: the hook showed the translated error, and the photos and text are still in place.
      if (result?.phase !== "applied") {
        setPhase({ kind: "input" })
        return
      }
      // With onProgress the hook leaves the local previews to the screen.
      previews.forEach((url) => URL.revokeObjectURL(url))
      form.setValue("price", sellerPriceFields(sellerPrice, sellerPricing))
      await save()
    } finally {
      working.current = false
    }
  }

  const retrySave = async () => {
    if (working.current) return
    working.current = true
    try {
      await save()
    } finally {
      working.current = false
    }
  }

  if (phase.kind === "created") return <AiProductCreatedCard storeId={storeId} product={phase.product} />

  if (phase.kind === "incomplete") {
    return (
      <Note tone="amber">
        <span className="flex flex-col items-start gap-2">
          <span>{t(phase.stored ? "incomplete" : "incompleteNoDraft")}</span>
          <Link href={finishHref} className="font-bold text-(--s-link) underline-offset-4 hover:underline">
            {t(phase.stored ? "finish" : "openForm")}
          </Link>
        </span>
      </Note>
    )
  }

  if (phase.kind === "saveFailed") {
    return (
      <Note tone="danger">
        <span className="flex flex-col items-start gap-2">
          <span>{t("saveFailed")}</span>
          <SellerButton type="button" size="sm" variant="solid" onClick={retrySave}>
            {t("retry")}
          </SellerButton>
        </span>
      </Note>
    )
  }

  const steps: Array<{ key: string; label: string; state: "done" | "run" | "wait" }> = [
    { key: "read", label: t("steps.read"), state: phase.kind === "reading" ? "run" : "done" },
    { key: "photos", label: t("steps.photos"), state: phase.kind === "photos" ? "run" : phase.kind === "reading" ? "wait" : "done" },
    { key: "save", label: t("steps.save"), state: phase.kind === "saving" ? "run" : "wait" },
  ]

  return (
    <Form {...form}>
      <div className="flex flex-col gap-4 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-4 max-[600px]:p-3.5">
        <Field label={t("photos")} hint={tReq("imgBody", { max: AUTOFILL_LIMITS.maxImages })} required>
          <ul className="flex flex-wrap gap-2" aria-label={tAi("attachments")}>
            {ai.images.map((item) => (
              <li key={item.id} className="relative size-[72px] overflow-hidden rounded-[14px] border border-(--s-line) bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={item.preview} alt="" className="size-full object-cover" />
                {!locked && (
                  <button
                    type="button"
                    onClick={() => ai.removeImage(item.id)}
                    aria-label={tAi("remove")}
                    className="absolute end-1 top-1 grid size-6 cursor-pointer place-items-center rounded-full bg-black/60 text-white after:absolute after:-inset-2 [&_svg]:size-3.5"
                  >
                    <X aria-hidden />
                  </button>
                )}
              </li>
            ))}
            {ai.images.length < AUTOFILL_LIMITS.maxImages && (
              <li>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => pickerRef.current?.click()}
                  className="flex size-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] border-dashed border-(--s-field-strong) bg-(--s-surface-2) text-[11.5px] font-semibold text-(--s-muted) transition-colors hover:border-(--s-primary) hover:text-(--s-ink) disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-5"
                >
                  <ImagePlus aria-hidden />
                  {t("addPhoto")}
                </button>
              </li>
            )}
          </ul>
          <input
            ref={pickerRef}
            type="file"
            accept={PHOTO_ACCEPT}
            multiple
            hidden
            onChange={(event) => {
              // Photos only here: the add page's AI stage also takes a PDF.
              const files = Array.from(event.target.files ?? []).filter((file) => (AUTOFILL_IMAGE_TYPES as readonly string[]).includes(file.type))
              if (files.length) ai.addFiles(files)
              event.target.value = ""
            }}
          />
        </Field>

        <Field label={t("description")} htmlFor="ai-quick-description" required>
          <TextArea
            id="ai-quick-description"
            {...promptField}
            ref={promptRef}
            rows={3}
            dir="auto"
            maxLength={AUTOFILL_LIMITS.maxTextLength}
            // readOnly, not disabled: the run reads this field while the screen locks.
            readOnly={locked}
            placeholder={tReq("descBody")}
          />
        </Field>

        <Field label={tPricing("productPrice")} htmlFor="ai-quick-price" required note={t("priceNote")}>
          <MoneyField id="ai-quick-price" name="price.list" disabled={locked} className="max-w-[260px] max-[600px]:max-w-none" />
        </Field>

        {busy ? (
          <ol className="flex flex-col gap-2 rounded-[14px] bg-(--s-fill)/60 px-3.5 py-3" aria-live="polite">
            {steps.map((step) => (
              <li key={step.key} className={cn("flex items-center gap-2.5 text-[13px]", step.state === "wait" ? "text-(--s-faint)" : "text-(--s-ink)")}>
                <span className="grid size-5 shrink-0 place-items-center [&_svg]:size-4">
                  {step.state === "run" ? (
                    <LoaderCircle className="animate-spin text-(--s-primary)" aria-hidden />
                  ) : step.state === "done" ? (
                    <Check className="stroke-3 text-success" aria-hidden />
                  ) : (
                    <span className="size-1.5 rounded-full bg-(--s-line)" aria-hidden />
                  )}
                </span>
                {step.label}
              </li>
            ))}
            <li className="ps-7.5 text-xs text-(--s-muted)">{t("wait")}</li>
          </ol>
        ) : (
          <div className="flex flex-col gap-1.5">
            <SellerButton type="button" onClick={create} disabled={disabled || Boolean(missing) || ai.outOfCalls} className="self-start max-[600px]:w-full">
              <Sparkles aria-hidden />
              {t("create")}
            </SellerButton>
            {ai.outOfCalls ? (
              <p className="text-xs text-destructive">{tAi("errors.dailyLimit")}</p>
            ) : missing ? (
              <p className="text-xs text-(--s-muted)">{tHint(missing)}</p>
            ) : (
              ai.remaining !== null && ai.remaining > 0 && ai.remaining <= 5 && <p className="text-xs text-(--s-muted)">{tAi("remaining", { count: ai.remaining })}</p>
            )}
          </div>
        )}
      </div>
    </Form>
  )
}

/** A saved product: its photo, name and price, with links to edit it and to the products list. */
export function AiProductCreatedCard ({ storeId, product }: { storeId: string; product: QuickProductCard }) {
  const t = useTranslations("productForm.aiQuick")
  const locale = useLocale()
  const { unit } = useAccountMoney()
  const live = product.status === "active"
  const image = product.image ? getPublicUrl(product.image, "products") : ""
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-3.5">
      <div className="flex items-center gap-3.5">
        <span className="relative grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-[14px] border border-(--s-line) bg-white text-(--s-faint) [&_svg]:size-6">
          {image ? <Image src={image} alt="" fill sizes="72px" className="object-contain p-1" /> : <ImageIcon aria-hidden />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="line-clamp-2 text-[14px] font-bold leading-normal text-(--s-ink)" dir="auto">
            {product.title}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {product.price !== null && (
              <span className="text-[13.5px] font-semibold text-(--s-body)">
                <Money value={product.price} locale={locale} unit={unit} />
              </span>
            )}
            <Tag tone={live ? "success" : undefined}>{t(live ? "live" : "draft")}</Tag>
          </div>
        </div>
      </div>
      {!live && <p className="text-pretty text-xs text-(--s-muted)">{t("draftNote")}</p>}
      <div className="flex flex-wrap items-center gap-2 max-[600px]:flex-col max-[600px]:items-stretch">
        <SellerButton asChild size="sm" variant="outline">
          <Link href={storeProductsHref(storeId, `/${encodeURIComponent(product.id)}/edit`)}>
            <Pencil aria-hidden />
            {t("edit")}
          </Link>
        </SellerButton>
        <Link href={storeProductsHref(storeId)} className="inline-flex min-h-10 items-center justify-center px-2 text-[13px] font-bold text-(--s-link) underline-offset-4 hover:underline">
          {t("viewProducts")}
        </Link>
      </div>
    </div>
  )
}
