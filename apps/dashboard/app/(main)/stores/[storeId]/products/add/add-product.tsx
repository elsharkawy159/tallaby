"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, FileDown, LoaderCircle, Rocket, Save, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { IconButton, SellerButton } from "@/components/seller-ui";
import { Form } from "@workspace/ui/components/form";
import { createProduct, updateProduct } from "@/actions/products";
import { cn } from "@/lib/utils";
import { useLocalizedResolver } from "@/lib/i18n/localized-resolver";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type CategoryOption,
  type SupportedLocale,
} from "./add-product.schema";
import {
  PRODUCT_SECTIONS,
  getFirstInvalidSection,
  getSectionProgress,
  getStickyOffset,
  scrollToSection,
} from "./add-product.lib";
import { BasicSection } from "./sections/basic-section";
import { ContentSection } from "./sections/content-section";
import { PricingSection } from "./sections/pricing-section";
import { InventorySection } from "./sections/inventory-section";
import { ShippingSection } from "./sections/shipping-section";
import { VisibilitySection } from "./sections/visibility-section";
import { SocialProofSection } from "../social-proof/social-proof-section.client";
import { saveProductSocialProof } from "../social-proof/social-proof.server";
import {
  MobilePublishBar,
  PublishChecklist,
  SectionChips,
} from "./publish-progress";
import { ImportDialog } from "./import-dialog";
import { BulkUrlImport } from "./bulk-url-import.client";
import { useProductDraft, type DraftStatus } from "./use-product-draft";
import { prepareProductForSubmit } from "./prepare-product-submit.lib";
import {
  ensureTaxonomyItem,
  setProductSellerTaxonomy,
} from "../categories-brands/categories-brands.server";
import { splitSellerTaxonomy } from "../categories-brands/categories-brands.lib";
import {
  SellerTaxonomyProvider,
  WithoutSellerTaxonomy,
  useSellerTaxonomy,
} from "../categories-brands/seller-taxonomy-fields.client";
import { ProductLinkHostProvider } from "./product-link-host.client";
import { AiAutofillCard } from "./ai/ai-autofill.client";
import { AiAddStage } from "./ai/ai-add-stage.client";
import { AiFillBanner } from "./ai/ai-fill-banner.client";
import { undoAutofill, type AutofillReview } from "./ai/use-ai-autofill";
import { markProductAiAssisted } from "./ai/ai-source.server";
import { AddMethodChooser } from "./add-method-chooser.client";
import { AddMethodSkeleton } from "./add-method-skeleton";
import { useAddMethod } from "./use-add-method";
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto";
import { useProductStoreId, useProductsHref } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";

interface AddProductProps {
  categories: CategoryOption[];
  sellerPricing: SellerPricingSettings;
  /** The seller's own category list, offered first in the category box. */
  sellerTaxonomy: { categories: SellerTaxonomyOption[] };
  /** The seller's live custom domain, shown in the product link preview. */
  linkHost?: string | null;
  /**
   * Edit mode: the same form, prefilled from an existing product and saved
   * with updateProduct. No local draft, import or bulk mode.
   */
  edit?: { productId: string; defaultValues: AddProductFormData };
  /** Extra header buttons shown before Save (edit mode's Publish and Preview). */
  headerActions?: React.ReactNode;
  /** Shows the AI box: fill a new product, or change an existing one (PLAN.md AI-1). */
  aiEnabled?: boolean;
  /** Sections that save on their own, under the form in the same column (edit page). */
  afterForm?: React.ReactNode;
}

/** The page's padding and width, shared by the sticky header and the form so they line up. */
const COLUMN = "mx-auto w-full max-w-[1360px] px-7 max-[1020px]:px-4 max-[600px]:px-3";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  ar: "العربية",
  en: "English",
};

/** The seller's category list lives in a provider, so the form itself sits inside it. */
export default function AddProduct(props: AddProductProps) {
  return (
    <SellerTaxonomyProvider value={props.sellerTaxonomy}>
      {props.edit ? <AddProductForm {...props} /> : <NewProduct {...props} />}
    </SellerTaxonomyProvider>
  );
}

/** A new product starts at the choice of method; a stored draft goes straight to the form. */
function NewProduct(props: AddProductProps) {
  const { view, formOpened, pick, draftStored } = useAddMethod(props.aiEnabled ?? false);
  return (
    <>
      {view === "pending" && <AddMethodSkeleton />}
      {view === "choose" && (
        <AddMethodChooser aiEnabled={props.aiEnabled ?? false} draftStored={draftStored} onPick={pick} />
      )}
      {formOpened && (
        <div className={cn((view === "choose" || view === "pending") && "hidden")}>
          <AddProductForm {...props} aiStageOpen={view === "ai"} onPickMethod={pick} />
        </div>
      )}
    </>
  );
}

function AddProductForm({
  categories,
  sellerPricing,
  linkHost = null,
  edit,
  headerActions,
  aiEnabled = false,
  afterForm,
  aiStageOpen = false,
  onPickMethod,
}: AddProductProps & {
  /** The AI screen shows instead of the form; both stay mounted, so a running fill and its result survive. */
  aiStageOpen?: boolean;
  /** Back to the choice, or on to the form, for a new product. */
  onPickMethod?: (method: "choose" | "manual") => void;
}) {
  const isEdit = Boolean(edit);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("ar");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkUrls, setBulkUrls] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(
    PRODUCT_SECTIONS[0].id,
  );
  const tToast = useTranslations("toast");
  const t = useTranslations("productForm.page");
  const tForm = useTranslations("productForm");
  const tMethod = useTranslations("productForm.method");
  const tAi = useTranslations("productForm.ai");
  const tBasic = useTranslations("productForm.sections.basic");
  const tTaxonomy = useTranslations("categoriesBrands.productForm");
  const productStoreId = useProductStoreId();
  const productsHref = useProductsHref();
  const tSocialProof = useTranslations("productForm.sections.socialProof");
  const tCommon = useTranslations("common");
  const resolver = useLocalizedResolver(
    zodResolver(addProductFormSchema) as any,
  );
  const taxonomyContext = useSellerTaxonomy();
  // AI fills still in the form (applied minus undone): the saved product is marked for the admin.
  const aiFills = useRef(0);
  const [aiReview, setAiReview] = useState<AutofillReview | null>(null);

  const form = useForm<AddProductFormData>({
    resolver: resolver as any,
    defaultValues: (edit?.defaultValues ?? defaultValues) as any,
    mode: "onChange",
    shouldUnregister: false,
  });

  // New products autosave a draft; edits only save on "Save changes", so guard those.
  // `isDirty` alone isn't enough: the pricing section syncs `price.base` on mount with
  // shouldDirty, so an untouched form can be dirty. Also require a real input/change event.
  const { isDirty } = useFormState({ control: form.control });
  const [userEdited, setUserEdited] = useState(false);
  const markUserEdited = () => setUserEdited(true);
  useUnsavedChangesGuard(
    isEdit && userEdited && isDirty && !isPending,
    tCommon("unsavedChanges"),
  );

  const draft = useProductDraft(form, {
    enabled: mode === "single" && !isEdit,
    onRestore: () =>
      toast.message(t("draftRestored"), {
        action: {
          label: t("startOver"),
          onClick: () => {
            draft.clear();
            form.reset(defaultValues as any);
          },
        },
      }),
  });

  // Highlight the section in view in the checklist / chips.
  useEffect(() => {
    if (mode !== "single") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const { id } of PRODUCT_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [mode]);

  /**
   * The store category to link: a typed-in name or a Tallaby pick is found in
   * (or added to) the seller's list. null when there's none or it failed.
   */
  const resolveStoreCategory = async (
    data: AddProductFormData,
  ): Promise<string | null> => {
    const name = data.sellerCategoryName?.trim();
    if (!name && data.sellerCategoryId) return data.sellerCategoryId;
    if (!name && !data.categoryId) return null;
    const result = await ensureTaxonomyItem(
      productStoreId,
      "category",
      name ? { name } : { sourceId: data.categoryId },
    );
    if (!result.success) return null;
    taxonomyContext?.addCategory(result.data);
    form.setValue("sellerCategoryId", result.data.id);
    form.setValue("sellerCategoryName", "");
    return result.data.id;
  };

  /** Product fields for createProduct / updateProduct: the store category, reviews and live views are saved separately. */
  const toPayload = (data: AddProductFormData) => {
    const { rest, taxonomy } = splitSellerTaxonomy(
      prepareProductForSubmit(data),
    );
    const {
      sellerCategoryName: _typedCategory,
      showLiveViews: _liveViews,
      trackStock: _trackStock,
      showLowStockBadge: _lowStockBadge,
      lowStockThreshold: _lowStockThreshold,
      minOrderQuantity: _minOrderQuantity,
      sellerReviews: _reviews,
      ...payload
    } = rest;
    return { payload, taxonomy };
  };

  const saveSocialProof = async (
    productId: string,
    data: AddProductFormData,
  ) => {
    const saved = await saveProductSocialProof(productStoreId, productId, {
      showLiveViews: data.showLiveViews ?? false,
      trackStock: data.trackStock ?? true,
      showLowStockBadge: data.showLowStockBadge ?? false,
      lowStockThreshold: data.lowStockThreshold ?? null,
      minOrderQuantity: data.minOrderQuantity ?? 1,
      reviews: data.sellerReviews ?? [],
    });
    if (!saved.success) toast.warning(tSocialProof("saveFailed"));
  };

  const linkStoreCategory = async (
    productId: string,
    data: AddProductFormData,
    taxonomy: { sellerCategoryId: string | null; sellerBrandId: string | null },
  ) => {
    const sellerCategoryId = await resolveStoreCategory(data);
    const linked = await setProductSellerTaxonomy(productStoreId, productId, {
      ...taxonomy,
      sellerCategoryId,
    });
    const wanted = Boolean(
      data.sellerCategoryName?.trim() || data.sellerCategoryId,
    );
    if (!linked.success || (wanted && !sellerCategoryId))
      toast.warning(tTaxonomy("linkFailed"));
  };

  const handleSubmit = (data: AddProductFormData) => {
    if (edit) return handleUpdate(edit.productId, data);
    startTransition(async () => {
      try {
        const { payload, taxonomy } = toPayload(data);
        const result = await createProduct(
          productStoreId,
          payload as Parameters<typeof createProduct>[1],
        );

        if (result.success) {
          if (result.data?.id) {
            await linkStoreCategory(result.data.id, data, taxonomy);
            await saveSocialProof(result.data.id, data);
            if (aiFills.current > 0)
              await markProductAiAssisted(productStoreId, result.data.id, "add");
          }
          draft.pause();
          draft.clear();
          // Full page loads clear stuck pending UI and reset the form cleanly
          if (result.data?.status === "draft") {
            toast.info(tToast("productSavedAsDraft"));
            window.location.reload();
          } else {
            toast.success(tToast("productCreatedSuccessfully"));
            window.location.assign(productsHref());
          }
        } else {
          toast.error(result.error || tToast("failedToCreateProduct"));
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(tToast("somethingWentWrong"));
      }
    });
  };

  const handleUpdate = (productId: string, data: AddProductFormData) => {
    startTransition(async () => {
      try {
        const { payload, taxonomy } = toPayload(data);
        const result = await updateProduct(productStoreId, productId, {
          ...payload,
          quantity: String(data.quantity),
          handlingTime: String(data.handlingTime),
        } as unknown as Parameters<typeof updateProduct>[2]);

        if (result.success) {
          // Always sent on edit, so a changed category replaces the old link.
          await linkStoreCategory(productId, data, taxonomy);
          await saveSocialProof(productId, data);
          if (aiFills.current > 0)
            await markProductAiAssisted(productStoreId, productId, "edit");
          toast.success(tToast("productUpdatedSuccessfully"));
          router.push(productsHref());
        } else {
          toast.error(result.error || tToast("failedToUpdateProduct"));
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error(tToast("somethingWentWrong"));
      }
    });
  };

  // Never disabled for validation: clicking runs it, shows the errors and
  // scrolls to the first invalid section. Only an in-flight save disables it.
  const validateAndSubmit = form.handleSubmit(handleSubmit, (errors) => {
    toast.error(t("fixRequired"));
    const first = getFirstInvalidSection(errors);
    if (first) {
      // Errors in the other language are invisible until we switch to it.
      const en = errors.localized?.en;
      const ar = errors.localized?.ar;
      if (
        first === "sec-basic" &&
        !(activeLocale === "en" ? en : ar) &&
        (en || ar)
      ) {
        setActiveLocale(ar ? "ar" : "en");
      }
      scrollToSection(first);
    }
  });
  // Validation is async, so a quick double click could submit twice before
  // isPending turns on.
  const validating = useRef(false);
  const publish = async () => {
    if (validating.current || isPending) return;
    validating.current = true;
    try {
      await validateAndSubmit();
    } finally {
      validating.current = false;
    }
  };

  const saveDraft = () => {
    draft.saveNow();
    toast.success(t("draftSaved"));
  };

  /** "Clear": forget the stored draft and empty the form. */
  const clearDraft = () => {
    draft.clear();
    form.reset(defaultValues as any);
    aiFills.current = 0;
    setAiReview(null);
    toast.success(t("draftCleared"));
  };

  if (mode === "bulk") {
    return (
      <WithoutSellerTaxonomy>
        <BulkUrlImport
          urls={bulkUrls}
          categories={categories}
          sellerPricing={sellerPricing}
          onExit={() => {
            setMode("single");
            setBulkUrls([]);
          }}
        />
      </WithoutSellerTaxonomy>
    );
  }

  /** Banner's undo: puts back what the AI filled. */
  const undoAiFill = () => {
    if (!aiReview) return;
    undoAutofill(form, aiReview);
    if (aiReview.undo.length) aiFills.current = Math.max(0, aiFills.current - 1);
    setAiReview(null);
    toast.message(tAi("undone"));
  };

  /** From the AI screen to the form, with a short glow on the two cards the seller checks first. */
  const reviewAiFill = () => {
    onPickMethod?.("manual");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    requestAnimationFrame(() => {
      for (const id of ["sec-basic", "sec-price"]) {
        document.getElementById(id)?.animate(
          [
            { boxShadow: "0 0 0 0 rgba(253,173,40,0)" },
            { boxShadow: "0 0 0 4px rgba(253,173,40,.35)", offset: 0.2 },
            { boxShadow: "0 0 0 0 rgba(253,173,40,0)" },
          ],
          { duration: 1800, easing: "ease-out" },
        );
      }
    });
  };

  const publishButton = (compact = false) => (
    <SellerButton
      type="button"
      onClick={publish}
      disabled={isPending}
      aria-busy={isPending}
      className={cn(compact && "px-4")}
    >
      {isPending ? (
        <LoaderCircle className="animate-spin" aria-hidden />
      ) : (
        !compact && (isEdit ? <Save aria-hidden /> : <Rocket aria-hidden />)
      )}
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
    </SellerButton>
  );

  return (
    <ProductLinkHostProvider value={linkHost}>
      <Form {...form}>
        {!isEdit && aiEnabled && (
          <div className={cn(!aiStageOpen && "hidden")}>
            <AiAddStage
              active={aiStageOpen}
              categories={categories}
              sellerPricing={sellerPricing}
              onAppliedChange={(delta) => {
                aiFills.current = Math.max(0, aiFills.current + delta);
              }}
              onBack={() => onPickMethod?.("choose")}
              onFilled={setAiReview}
              onReview={reviewAiFill}
            />
          </div>
        )}
        <div className={cn("pb-32 lg:pb-24", aiStageOpen && "hidden")}>
          {/* Page header. Sits under the top bar: 68px tall, 60px on phones. */}
          <div
            data-sticky-head
            className="sticky top-[68px] z-20 border-b border-(--s-line) bg-(--s-glass) backdrop-blur-md max-[600px]:top-[60px]"
          >
            <div className={cn(COLUMN, "flex flex-wrap items-center gap-x-4 gap-y-2.5 py-3.5 max-[600px]:py-2.5")}>
              {onPickMethod && (
                <IconButton
                  type="button"
                  className="-me-1.5"
                  aria-label={tMethod("change")}
                  title={tMethod("change")}
                  onClick={() => {
                    draft.saveNow();
                    toast.dismiss(); // "Start over" on the restored-draft toast would act on a hidden form.
                    onPickMethod("choose");
                  }}
                >
                  <ArrowRight className="ltr:rotate-180" aria-hidden />
                </IconButton>
              )}
              <h1
                id="add-product-title"
                tabIndex={-1}
                className="text-[20px] font-bold leading-[1.4] text-(--s-ink) outline-none max-[600px]:text-[17px]"
              >
                {isEdit ? t("editTitle") : t("newTitle")}
              </h1>
              {!isEdit && <SaveStatus status={draft.status} />}
              <div className="ms-auto flex flex-wrap items-center gap-2 max-[600px]:contents">
                <LocaleSwitch value={activeLocale} onChange={setActiveLocale} className={cn(!isEdit && "max-[600px]:order-1 max-[600px]:basis-[calc(100%-56px)]")} />
                {!isEdit && (
                  <IconButton
                    type="button"
                    className="max-[600px]:order-1"
                    aria-label={t("importProduct")}
                    title={t("importProduct")}
                    onClick={() => setImportOpen(true)}
                  >
                    <FileDown aria-hidden />
                  </IconButton>
                )}
                {!isEdit && (
                  <SellerButton type="button" variant="outline" className="hidden lg:inline-flex" onClick={saveDraft}>
                    {t("saveDraft")}
                  </SellerButton>
                )}
                {!isEdit && draft.hasDraft && (
                  <ClearDraftButton className="inline-flex max-[600px]:ms-auto sm:max-lg:hidden" disabled={isPending} onConfirm={clearDraft} />
                )}
                {/* One scrolling line on phones: this bar is sticky, and two rows of buttons cost a quarter of the screen. */}
                {headerActions && (
                  <div className="contents max-[600px]:flex max-[600px]:w-full max-[600px]:gap-2 max-[600px]:overflow-x-auto max-[600px]:[scrollbar-width:none] max-[600px]:[&>*]:shrink-0">
                    {headerActions}
                  </div>
                )}
                <div className="hidden lg:block">{publishButton()}</div>
              </div>
            </div>
            <ProgressChips activeSection={activeSection} />
          </div>

          <div className={cn(COLUMN, "grid grid-cols-1 items-start gap-6 pt-6 max-[600px]:pt-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]")}>
            <div className="flex min-w-0 flex-col gap-4">
              <form
                id={isEdit ? "edit-product-form" : "add-product-form"}
                // Bubble, not capture: a state update in the capture phase makes React put the
                // controlled input's old value back before its onChange runs, losing the first character.
                onInput={markUserEdited}
                onChange={markUserEdited}
                onSubmit={(e) => {
                  e.preventDefault();
                  void publish();
                }}
                className="flex min-w-0 flex-col gap-4"
              >
                {aiEnabled && isEdit && (
                  <AiAutofillCard
                    categories={categories}
                    sellerPricing={sellerPricing}
                    mode="edit"
                    onAppliedChange={(delta) => {
                      aiFills.current = Math.max(0, aiFills.current + delta);
                    }}
                  />
                )}
                {aiReview && (
                  <AiFillBanner review={aiReview} onUndo={undoAiFill} onDismiss={() => setAiReview(null)} />
                )}
                <BasicSection
                  categories={categories}
                  activeLocale={activeLocale}
                  action={
                    isEdit ? undefined : (
                      <SellerButton type="button" variant="mini" size="xs" onClick={() => setImportOpen(true)}>
                        <FileDown aria-hidden />
                        {tBasic("importFromLink")}
                      </SellerButton>
                    )
                  }
                />
                <PricingSection sellerPricing={sellerPricing} />
                <ContentSection activeLocale={activeLocale} />
                <InventorySection sellerPricing={sellerPricing} activeLocale={activeLocale} />
                <ShippingSection sellerPricing={sellerPricing} />
                <SocialProofSection />
                <VisibilitySection activeLocale={activeLocale} />
              </form>
              {afterForm}
            </div>

            <aside
              className="sticky hidden flex-col gap-3.5 lg:flex"
              style={{ top: "var(--product-aside-top, 150px)" }}
            >
              <ProgressAside activeSection={activeSection} />
            </aside>
          </div>

          <ProgressMobileBar
            actions={
              <>
                {!isEdit && (
                  <SellerButton type="button" variant="outline" className="hidden sm:inline-flex" onClick={saveDraft}>
                    {t("draftShort")}
                  </SellerButton>
                )}
                {!isEdit && draft.hasDraft && (
                  <ClearDraftButton
                    className="hidden sm:inline-flex"
                    disabled={isPending}
                    onConfirm={clearDraft}
                  />
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
                setBulkUrls(urls);
                setMode("bulk");
              }}
            />
          )}
          <StickyOffsetVar />
        </div>
      </Form>
    </ProductLinkHostProvider>
  );
}

/** Exposes the sticky header's height to CSS so the aside parks just below it. */
function StickyOffsetVar() {
  useEffect(() => {
    const update = () =>
      document.documentElement.style.setProperty(
        "--product-aside-top",
        `${getStickyOffset()}px`,
      );
    update();
    const head = document.querySelector<HTMLElement>("[data-sticky-head]");
    const observer = head ? new ResizeObserver(update) : null;
    if (head) observer?.observe(head);
    return () => {
      observer?.disconnect();
      document.documentElement.style.removeProperty("--product-aside-top");
    };
  }, []);
  return null;
}

/*
 * The readiness widgets watch the whole form. Keeping them in their own
 * components means a keystroke re-renders them, not every section.
 */
function useSectionProgress() {
  const form = useFormContext<AddProductFormData>();
  const values = useWatch({ control: form.control });
  const { errors, submitCount } = useFormState({ control: form.control });
  return getSectionProgress(
    values as Partial<AddProductFormData>,
    errors,
    submitCount > 0,
  );
}

function ProgressAside({ activeSection }: { activeSection: string }) {
  return (
    <PublishChecklist
      sections={useSectionProgress()}
      activeId={activeSection}
    />
  );
}

function ProgressChips({ activeSection }: { activeSection: string }) {
  return (
    <SectionChips sections={useSectionProgress()} activeId={activeSection} />
  );
}

function ProgressMobileBar({ actions }: { actions: React.ReactNode }) {
  return <MobilePublishBar sections={useSectionProgress()} actions={actions} />;
}

/** "Clear" beside "Save draft", shown while a draft is stored; asks first, since it empties the form. */
function ClearDraftButton({
  className,
  disabled,
  onConfirm,
}: {
  className?: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations("productForm.page");
  const tCommon = useTranslations("common");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-[42px] cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold text-destructive transition-colors duration-150 hover:bg-destructive-soft disabled:opacity-50 [&_svg]:size-4",
            className,
          )}
          disabled={disabled}
        >
          <Trash2 aria-hidden />
          {t("clearDraft")}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("clearDraftTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("clearDraftBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-white hover:bg-destructive/90">
            {t("clearDraftConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SaveStatus({ status }: { status: DraftStatus }) {
  const t = useTranslations("productForm.page");
  return (
    <span className="hidden items-center gap-1.5 text-xs whitespace-nowrap text-(--s-muted) min-[601px]:flex">
      <i
        className={cn(
          "size-[7px] rounded-full",
          status === "saved"
            ? "bg-success"
            : status === "pending"
              ? "bg-accent"
              : "bg-(--s-faint)",
        )}
      />
      {status === "saved"
        ? t("autosaved")
        : status === "pending"
          ? t("unsaved")
          : t("notSaved")}
    </span>
  );
}

/** Content-language toggle; the dot turns green once that language has a name. */
function LocaleSwitch({
  value,
  onChange,
  className,
}: {
  value: SupportedLocale;
  onChange: (locale: SupportedLocale) => void;
  className?: string;
}) {
  const t = useTranslations("productForm");
  const form = useFormContext<AddProductFormData>();
  const [enTitle, arTitle] = useWatch({
    control: form.control,
    name: ["localized.en.title", "localized.ar.title"],
  });
  const filled: Record<SupportedLocale, boolean> = {
    en: Boolean(enTitle?.trim()),
    ar: Boolean(arTitle?.trim()),
  };

  return (
    <div
      className={cn("flex flex-1 items-center gap-1 rounded-full border border-(--s-field) bg-(--s-surface) p-[3px] min-[601px]:flex-none", className)}
      title={t("page.contentLanguageHint")}
      role="radiogroup"
      aria-label={t("contentLanguage")}
    >
      <span className="hidden px-1 ps-2 text-xs whitespace-nowrap text-(--s-muted) md:inline">
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
            "flex h-[34px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors duration-150 max-[600px]:h-10 min-[601px]:flex-none",
            value === locale
              ? "bg-(--s-solid) text-(--s-solid-fg)"
              : "text-(--s-muted) hover:text-(--s-ink)",
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
                  : "bg-(--s-field-strong)",
            )}
          />
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
