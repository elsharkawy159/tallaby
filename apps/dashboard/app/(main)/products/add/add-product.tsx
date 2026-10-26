"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useForm, useFormContext, useFormState, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { FileDown, LoaderCircle, Rocket, Save } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Form } from "@workspace/ui/components/form"
import { createProduct, updateProduct } from "@/actions/products"
import { cn } from "@/lib/utils"
import { useLocalizedResolver } from "@/lib/i18n/localized-resolver"
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard"
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib"
import { BUTTON_CLASS, SMALL_BUTTON_CLASS } from "@/components/form/form-ui"
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type CategoryOption,
  type SupportedLocale,
} from "./add-product.schema"
import {
  PRODUCT_SECTIONS,
  getFirstInvalidSection,
  getSectionProgress,
  getStickyOffset,
  scrollToSection,
} from "./add-product.lib"
import { BasicSection } from "./sections/basic-section"
import { ContentSection } from "./sections/content-section"
import { PricingSection } from "./sections/pricing-section"
import { InventorySection } from "./sections/inventory-section"
import { ShippingSection } from "./sections/shipping-section"
import { VisibilitySection } from "./sections/visibility-section"
import { MobilePublishBar, PublishChecklist, SectionChips } from "./publish-progress"
import { ImportDialog } from "./import-dialog"
import { BulkUrlImport } from "./bulk-url-import.client"
import { useProductDraft, type DraftStatus } from "./use-product-draft"
import { prepareProductForSubmit } from "./prepare-product-submit.lib"
import { ensureTaxonomyItem, setProductSellerTaxonomy } from "../categories-brands/categories-brands.server"
import { splitSellerTaxonomy } from "../categories-brands/categories-brands.lib"
import { SellerTaxonomyProvider, WithoutSellerTaxonomy, useSellerTaxonomy } from "../categories-brands/seller-taxonomy-fields.client"
import { ProductLinkHostProvider } from "./product-link-host.client"
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto"

interface AddProductProps {
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  /** The seller's own category list, offered first in the category box. */
  sellerTaxonomy: { categories: SellerTaxonomyOption[] }
  /** The seller's live custom domain, shown in the product link preview. */
  linkHost?: string | null
  /**
   * Edit mode: the same form, prefilled from an existing product and saved
   * with updateProduct. No local draft, import or bulk mode.
   */
  edit?: { productId: string; defaultValues: AddProductFormData }
  /** Extra header buttons shown before Save (edit mode's Publish and Preview). */
  headerActions?: React.ReactNode
}

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  ar: "العربية",
  en: "English",
}

/** The seller's category list lives in a provider, so the form itself sits inside it. */
export default function AddProduct (props: AddProductProps) {
  return (
    <SellerTaxonomyProvider value={props.sellerTaxonomy}>
      <AddProductForm {...props} />
    </SellerTaxonomyProvider>
  )
}

function AddProductForm ({
  categories,
  sellerPricing,
  linkHost = null,
  edit,
  headerActions,
}: AddProductProps) {
  const isEdit = Boolean(edit)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("ar")
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [bulkUrls, setBulkUrls] = useState<string[]>([])
  const [importOpen, setImportOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>(PRODUCT_SECTIONS[0].id)
  const tToast = useTranslations("toast")
  const t = useTranslations("productForm.page")
  const tForm = useTranslations("productForm")
  const tBasic = useTranslations("productForm.sections.basic")
  const tTaxonomy = useTranslations("categoriesBrands.productForm")
  const tCommon = useTranslations("common")
  const resolver = useLocalizedResolver(zodResolver(addProductFormSchema) as any)
  const taxonomyContext = useSellerTaxonomy()

  const form = useForm<AddProductFormData>({
    resolver: resolver as any,
    defaultValues: (edit?.defaultValues ?? defaultValues) as any,
    mode: "onChange",
    shouldUnregister: false,
  })

  // New products autosave a draft; edits only save on "Save changes", so guard those.
  // `isDirty` alone isn't enough: the pricing section syncs `price.base` on mount with
  // shouldDirty, so an untouched form can be dirty. Also require a real input/change event.
  const { isDirty } = useFormState({ control: form.control })
  const [userEdited, setUserEdited] = useState(false)
  const markUserEdited = () => setUserEdited(true)
  useUnsavedChangesGuard(isEdit && userEdited && isDirty && !isPending, tCommon("unsavedChanges"))

  const draft = useProductDraft(form, {
    enabled: mode === "single" && !isEdit,
    onRestore: () =>
      toast.message(t("draftRestored"), {
        action: {
          label: t("startOver"),
          onClick: () => {
            draft.clear()
            form.reset(defaultValues as any)
          },
        },
      }),
  })

  // Highlight the section in view in the checklist / chips.
  useEffect(() => {
    if (mode !== "single") return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    )
    for (const { id } of PRODUCT_SECTIONS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [mode])

  /**
   * The store category to link: a typed-in name or a Tallaby pick is found in
   * (or added to) the seller's list. null when there's none or it failed.
   */
  const resolveStoreCategory = async (data: AddProductFormData): Promise<string | null> => {
    const name = data.sellerCategoryName?.trim()
    if (!name && data.sellerCategoryId) return data.sellerCategoryId
    if (!name && !data.categoryId) return null
    const result = await ensureTaxonomyItem("category", name ? { name } : { sourceId: data.categoryId })
    if (!result.success) return null
    taxonomyContext?.addCategory(result.data)
    form.setValue("sellerCategoryId", result.data.id)
    form.setValue("sellerCategoryName", "")
    return result.data.id
  }

  /** Product fields for createProduct / updateProduct: the store category is linked separately. */
  const toPayload = (data: AddProductFormData) => {
    const { rest, taxonomy } = splitSellerTaxonomy(prepareProductForSubmit(data))
    const { sellerCategoryName: _typedCategory, ...payload } = rest
    return { payload, taxonomy }
  }

  const linkStoreCategory = async (
    productId: string,
    data: AddProductFormData,
    taxonomy: { sellerCategoryId: string | null; sellerBrandId: string | null }
  ) => {
    const sellerCategoryId = await resolveStoreCategory(data)
    const linked = await setProductSellerTaxonomy(productId, { ...taxonomy, sellerCategoryId })
    const wanted = Boolean(data.sellerCategoryName?.trim() || data.sellerCategoryId)
    if (!linked.success || (wanted && !sellerCategoryId)) toast.warning(tTaxonomy("linkFailed"))
  }

  const handleSubmit = (data: AddProductFormData) => {
    if (edit) return handleUpdate(edit.productId, data)
    startTransition(async () => {
      try {
        const { payload, taxonomy } = toPayload(data)
        const result = await createProduct(payload as Parameters<typeof createProduct>[0])

        if (result.success) {
          if (result.data?.id) await linkStoreCategory(result.data.id, data, taxonomy)
          draft.pause()
          draft.clear()
          if (result.data?.status === "draft") toast.info(tToast("productSavedAsDraft"))
          else toast.success(tToast("productCreatedSuccessfully"))
          // Full reload clears stuck pending UI and resets the form cleanly
          window.location.reload()
        } else {
          toast.error(result.error || tToast("failedToCreateProduct"))
        }
      } catch (error) {
        console.error("Form submission error:", error)
        toast.error(tToast("somethingWentWrong"))
      }
    })
  }

  const handleUpdate = (productId: string, data: AddProductFormData) => {
    startTransition(async () => {
      try {
        const { payload, taxonomy } = toPayload(data)
        const result = await updateProduct(productId, {
          ...payload,
          quantity: String(data.quantity),
          handlingTime: String(data.handlingTime),
        } as unknown as Parameters<typeof updateProduct>[1])

        if (result.success) {
          // Always sent on edit, so a changed category replaces the old link.
          await linkStoreCategory(productId, data, taxonomy)
          toast.success(tToast("productUpdatedSuccessfully"))
          router.push("/products")
        } else {
          toast.error(result.error || tToast("failedToUpdateProduct"))
        }
      } catch (error) {
        console.error("Form submission error:", error)
        toast.error(tToast("somethingWentWrong"))
      }
    })
  }

  // Never disabled for validation: clicking runs it, shows the errors and
  // scrolls to the first invalid section. Only an in-flight save disables it.
  const validateAndSubmit = form.handleSubmit(handleSubmit, (errors) => {
    toast.error(t("fixRequired"))
    const first = getFirstInvalidSection(errors)
    if (first) {
      // Errors in the other language are invisible until we switch to it.
      const en = errors.localized?.en
      const ar = errors.localized?.ar
      if (first === "sec-basic" && !(activeLocale === "en" ? en : ar) && (en || ar)) {
        setActiveLocale(ar ? "ar" : "en")
      }
      scrollToSection(first)
    }
  })
  // Validation is async, so a quick double click could submit twice before
  // isPending turns on.
  const validating = useRef(false)
  const publish = async () => {
    if (validating.current || isPending) return
    validating.current = true
    try {
      await validateAndSubmit()
    } finally {
      validating.current = false
    }
  }

  const saveDraft = () => {
    draft.saveNow()
    toast.success(t("draftSaved"))
  }

  if (mode === "bulk") {
    return (
      <WithoutSellerTaxonomy>
        <BulkUrlImport
          urls={bulkUrls}
          categories={categories}
          sellerPricing={sellerPricing}
          onExit={() => {
            setMode("single")
            setBulkUrls([])
          }}
        />
      </WithoutSellerTaxonomy>
    )
  }

  const publishButton = (compact = false) => (
    <Button
      type="button"
      variant="accent"
      onClick={publish}
      disabled={isPending}
      aria-busy={isPending}
      className={cn(BUTTON_CLASS, "rounded-xl font-semibold", compact && "px-4")}
    >
      {isPending ? <LoaderCircle className="animate-spin" /> : !compact && (isEdit ? <Save /> : <Rocket />)}
      {isEdit
        ? isPending
          ? tForm("saving")
          : compact
            ? t("saveShort")
            : tForm("saveChanges")
        : isPending
          ? t("publishing")
          : compact
            ? t("publishShort")
            : t("publish")}
    </Button>
  )

  return (
    <ProductLinkHostProvider value={linkHost}>
    <Form {...form}>
      <div className="min-h-screen pb-32 lg:pb-24">
        {/* Page header */}
        <div
          data-sticky-head
          className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur-md"
        >
          {/* Same side padding as the form below, so the header lines up with it at every width. */}
          <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2.5 px-3 py-3 sm:px-6 sm:py-3.5">
            <h1 className="text-[17px] leading-snug font-bold sm:text-xl">{isEdit ? t("editTitle") : t("newTitle")}</h1>
            {!isEdit && <SaveStatus status={draft.status} />}
            <div className="flex w-full flex-wrap items-center gap-2 sm:ms-auto sm:w-auto">
              <LocaleSwitch value={activeLocale} onChange={setActiveLocale} />
              {/* Import lives in the Basics card ("Import from link"), not here. */}
              {!isEdit && (
                <Button
                  type="button"
                  variant="neutral"
                  className={cn(BUTTON_CLASS, "hidden rounded-xl lg:inline-flex")}
                  onClick={saveDraft}
                >
                  {t("saveDraft")}
                </Button>
              )}
              {headerActions}
              <div className="hidden lg:block">{publishButton()}</div>
            </div>
          </div>
          <ProgressChips activeSection={activeSection} />
        </div>

        <form
          id={isEdit ? "edit-product-form" : "add-product-form"}
          onInputCapture={markUserEdited}
          onChangeCapture={markUserEdited}
          onSubmit={(e) => {
            e.preventDefault()
            void publish()
          }}
          className="mx-auto w-full px-3 pt-4 sm:px-6 sm:pt-6"
        >
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-4">
              <BasicSection
                categories={categories}
                activeLocale={activeLocale}
                action={
                  isEdit ? undefined : (
                    <Button
                      type="button"
                      variant="default"
                      className={cn(SMALL_BUTTON_CLASS, "h-9 px-3.5 text-[13px] font-semibold shadow-sm")}
                      onClick={() => setImportOpen(true)}
                    >
                      <FileDown />
                      {tBasic("importFromLink")}
                    </Button>
                  )
                }
              />
              <PricingSection sellerPricing={sellerPricing} />
              <ContentSection activeLocale={activeLocale} />
              <InventorySection sellerPricing={sellerPricing} activeLocale={activeLocale} />
              <ShippingSection sellerPricing={sellerPricing} />
              <VisibilitySection activeLocale={activeLocale} />
            </div>

            <aside
              className="sticky hidden flex-col gap-3.5 lg:flex"
              style={{ top: "var(--product-aside-top, 150px)" }}
            >
              <ProgressAside activeSection={activeSection} />
            </aside>
          </div>
        </form>

        <ProgressMobileBar
          actions={
            <>
              {!isEdit && (
                <Button type="button" variant="soft" className={cn(BUTTON_CLASS, "hidden sm:inline-flex")} onClick={saveDraft}>
                  {t("draftShort")}
                </Button>
              )}
              {publishButton(true)}
            </>
          }
        />

        {!isEdit && (
          <ImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            categories={categories}
            sellerPricing={sellerPricing}
            onBulkUrls={(urls) => {
              setBulkUrls(urls)
              setMode("bulk")
            }}
          />
        )}
        <StickyOffsetVar />
      </div>
    </Form>
    </ProductLinkHostProvider>
  )
}

/** Exposes the sticky header's height to CSS so the aside parks just below it. */
function StickyOffsetVar () {
  useEffect(() => {
    const update = () =>
      document.documentElement.style.setProperty("--product-aside-top", `${getStickyOffset()}px`)
    update()
    const head = document.querySelector<HTMLElement>("[data-sticky-head]")
    const observer = head ? new ResizeObserver(update) : null
    if (head) observer?.observe(head)
    return () => {
      observer?.disconnect()
      document.documentElement.style.removeProperty("--product-aside-top")
    }
  }, [])
  return null
}

/*
 * The readiness widgets watch the whole form. Keeping them in their own
 * components means a keystroke re-renders them, not every section.
 */
function useSectionProgress () {
  const form = useFormContext<AddProductFormData>()
  const values = useWatch({ control: form.control })
  const { errors, submitCount } = useFormState({ control: form.control })
  return getSectionProgress(values as Partial<AddProductFormData>, errors, submitCount > 0)
}

function ProgressAside ({ activeSection }: { activeSection: string }) {
  return <PublishChecklist sections={useSectionProgress()} activeId={activeSection} />
}

function ProgressChips ({ activeSection }: { activeSection: string }) {
  return <SectionChips sections={useSectionProgress()} activeId={activeSection} />
}

function ProgressMobileBar ({ actions }: { actions: React.ReactNode }) {
  return <MobilePublishBar sections={useSectionProgress()} actions={actions} />
}

function SaveStatus ({ status }: { status: DraftStatus }) {
  const t = useTranslations("productForm.page")
  return (
    <span className="hidden items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground sm:flex">
      <i
        className={cn(
          "size-[7px] rounded-full",
          status === "saved" ? "bg-success" : status === "pending" ? "bg-accent" : "bg-faint"
        )}
      />
      {status === "saved" ? t("autosaved") : status === "pending" ? t("unsaved") : t("notSaved")}
    </span>
  )
}

/** Content-language toggle; the dot turns green once that language has a name. */
function LocaleSwitch ({
  value,
  onChange,
}: {
  value: SupportedLocale
  onChange: (locale: SupportedLocale) => void
}) {
  const t = useTranslations("productForm")
  const form = useFormContext<AddProductFormData>()
  const [enTitle, arTitle] = useWatch({
    control: form.control,
    name: ["localized.en.title", "localized.ar.title"],
  })
  const filled: Record<SupportedLocale, boolean> = {
    en: Boolean(enTitle?.trim()),
    ar: Boolean(arTitle?.trim()),
  }

  return (
    <div
      className="flex flex-1 items-center gap-1 rounded-xl border bg-card p-[3px] sm:flex-none"
      title={t("page.contentLanguageHint")}
      role="radiogroup"
      aria-label={t("contentLanguage")}
    >
      <span className="hidden px-1 ps-2 text-xs whitespace-nowrap text-muted-foreground md:inline">
        {t("contentLanguage")}
      </span>
      {(["ar", "en"] as const).map((locale) => (
        <button
          key={locale}
          type="button"
          role="radio"
          aria-checked={value === locale}
          onClick={() => onChange(locale)}
          className={cn(
            "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 text-[13px] transition-colors sm:flex-none",
            value === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <i
            className={cn(
              "size-1.5 rounded-full",
              filled[locale]
                ? value === locale
                  ? "bg-[#7ee2a2]"
                  : "bg-success"
                : value === locale
                  ? "bg-white/50"
                  : "bg-input"
            )}
          />
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  )
}
