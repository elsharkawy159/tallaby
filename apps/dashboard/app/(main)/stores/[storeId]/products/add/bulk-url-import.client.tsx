"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useLocalizedResolver } from "@/lib/i18n/localized-resolver";
import { toast } from "sonner";
import { CheckCircle2, LoaderCircle, RefreshCw, Trash2, X } from "lucide-react";
import { Form } from "@workspace/ui/components/form";
import { Separator } from "@workspace/ui/components/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { EmptyState, IconButton, Note, Segmented, SellerButton, Tag } from "@/components/seller-ui";
import { cn, getPublicUrl } from "@/lib/utils";
import { useSidebarStore } from "@/stores";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import {
  addProductFormSchema,
  defaultValues,
  type AddProductFormData,
  type CategoryOption,
  type SupportedLocale,
} from "./add-product.schema";
import { BasicInformationStep } from "./steps/basic-information-step";
import { PriceStockStep } from "./steps/price-stock-step";
import { SeoStep } from "./steps/seo-step";
import {
  createPendingBulkItems,
  retryBulkItem,
  scrapeBulkUrls,
  type BulkProductItem,
} from "./bulk-url-import.lib";
import {
  applyBulkOptions,
  checkBulkValues,
  completeBulkValues,
  isBulkListDone,
  type BulkApplyContext,
} from "./bulk-apply.lib";
import { BulkApplyPanel, type BulkApplyChoice } from "./bulk-apply-panel.client";
import { saveBulkProduct, type StoreCategoryCache } from "./bulk-url-save.client";
import { indexTallabyCategories } from "./category-search.lib";
import { shortProductUrl } from "./product-url-list.lib";
import { useSellerTaxonomy } from "../categories-brands/seller-taxonomy-fields.client";
import { RemoteImage } from "@/components/media/remote-image";
import {
  useProductStoreId,
  useProductsHref,
} from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";

interface BulkUrlImportProps {
  urls: string[]
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  onExit: () => void
  /** Every row is saved: the page goes back to where the links came from. Without it the list stays with "View products". */
  onAllSaved?: (count: number) => void
}

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  ar: "العربية",
  en: "English",
};

const BULK_STATUSES = ["pending", "fetching", "ready", "error", "saving", "saved"];

type FormApi = {
  trigger: () => Promise<boolean>
  getValues: () => AddProductFormData
  reset: (values: AddProductFormData) => void
}

const rowDomId = (id: string) => `bulk-row-${id}`;

function statusLabel (
  status: BulkProductItem["status"],
  t: (key: string) => string
): string {
  return BULK_STATUSES.includes(status) ? t(`status.${status}`) : status;
}

function statusClassName (status: BulkProductItem["status"]): string {
  switch (status) {
    case "ready":
    case "saved":
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60";
    case "error":
      return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60";
    case "fetching":
    case "saving":
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60";
    default:
      return "bg-muted/50 text-muted-foreground border-border";
  }
}

function thumbnailSrc (pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return getPublicUrl(pathOrUrl, "products");
}

interface BulkItemFormProps {
  item: BulkProductItem
  categories: CategoryOption[]
  sellerPricing: SellerPricingSettings
  activeLocale: SupportedLocale
  onValuesChange: (id: string, values: AddProductFormData) => void
  registerForm: (id: string, api: FormApi) => void
  unregisterForm: (id: string) => void
}

function BulkItemForm ({
  item,
  categories,
  sellerPricing,
  activeLocale,
  onValuesChange,
  registerForm,
  unregisterForm,
}: BulkItemFormProps) {
  const resolver = useLocalizedResolver(zodResolver(addProductFormSchema) as any);
  const form = useForm<AddProductFormData>({
    resolver: resolver as any,
    defaultValues: (item.values ?? defaultValues) as any,
    mode: "onChange",
    shouldUnregister: false,
  });

  // A row opened after Save all found problems shows them on its fields straight away.
  const hadIssues = Boolean(item.issues?.length);
  useEffect(() => {
    if (hadIssues) void form.trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the row opens
  }, []);

  useEffect(() => {
    registerForm(item.id, {
      trigger: () => form.trigger(),
      getValues: () => form.getValues(),
      reset: (values) => form.reset(values),
    });
    return () => unregisterForm(item.id);
  }, [form, item.id, registerForm, unregisterForm]);

  useEffect(() => {
    const sub = form.watch((values) => {
      onValuesChange(item.id, values as AddProductFormData);
    });
    return () => sub.unsubscribe();
  }, [form, item.id, onValuesChange]);

  return (
    <Form {...form}>
      <div className="space-y-6 pt-2">
        <BasicInformationStep
          categories={categories}
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
  );
}

export function BulkUrlImport ({
  urls,
  categories,
  sellerPricing,
  onExit,
  onAllSaved,
}: BulkUrlImportProps) {
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const t = useTranslations("productForm.bulk");
  const locale = useLocale();
  const productStoreId = useProductStoreId();
  const productsHref = useProductsHref();
  const taxonomy = useSellerTaxonomy();
  const errorText = (message: string | undefined) =>
    message && t.has(`errors.${message}`) ? t(`errors.${message}`) : message;
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("ar");
  // One list per mount: the page mounts this view again for a new set of links.
  const [initialItems] = useState(() => createPendingBulkItems(urls));
  const [items, setItems] = useState<BulkProductItem[]>(initialItems);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [saveProgress, setSaveProgress] = useState<{ done: number; total: number } | null>(null);
  const isSaving = saveProgress !== null;
  const formsRef = useRef(new Map<string, FormApi>());

  const tallaby = useMemo(() => indexTallabyCategories(categories, locale), [categories, locale]);
  const applyCtx: BulkApplyContext = useMemo(
    () => ({ categories, tallaby, store: taxonomy?.categories ?? [], locale }),
    [categories, tallaby, taxonomy?.categories, locale]
  );
  const applyCtxRef = useRef(applyCtx);
  useEffect(() => {
    applyCtxRef.current = applyCtx;
  }, [applyCtx]);
  // The last "apply to all": rows that finish fetching afterwards get it too.
  const appliedRef = useRef<BulkApplyChoice | null>(null);

  const updateItem = useCallback((next: BulkProductItem) => {
    const choice = appliedRef.current;
    const value =
      next.status === "ready" && next.values && choice
        ? {
            ...next,
            values: applyBulkOptions(next.values, next.sourcePrice, choice.options, applyCtxRef.current),
            draft: choice.draft ?? next.draft,
          }
        : next;
    setItems((prev) => prev.map((item) => (item.id === value.id ? value : item)));
  }, []);

  useEffect(() => {
    let cancelled = false;

    scrapeBulkUrls(
      initialItems,
      { sellerPricing, categories },
      (item) => {
        if (!cancelled) updateItem(item);
      }
    ).finally(() => {
      if (!cancelled) setIsFetching(false);
    });

    return () => {
      cancelled = true;
    };
  }, [initialItems, sellerPricing, categories, updateItem]);

  const fetchedCount = items.filter(
    (i) => i.status !== "pending" && i.status !== "fetching"
  ).length;
  const readyCount = items.filter((i) => i.status === "ready").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const savedCount = items.filter((i) => i.status === "saved").length;
  const allSaved = items.length > 0 && savedCount === items.length;

  const registerForm = useCallback((id: string, api: FormApi) => {
    formsRef.current.set(id, api);
  }, []);

  const unregisterForm = useCallback((id: string) => {
    formsRef.current.delete(id);
  }, []);

  const handleValuesChange = useCallback(
    (id: string, values: AddProductFormData) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                values,
                title: values.localized?.en?.title || values.localized?.ar?.title || item.title,
                thumbnail: values.images?.[0] || item.thumbnail,
              }
            : item
        )
      );
    },
    []
  );

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setOpenIds((prev) => prev.filter((openId) => openId !== id));
    formsRef.current.delete(id);
  };

  const handleRetry = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    updateItem({ ...item, status: "fetching", error: undefined });
    const result = await retryBulkItem(item, { sellerPricing, categories });
    updateItem(result);
    if (result.status === "ready") {
      toast.success(t("fetched"));
    } else {
      toast.error(errorText(result.error) || t("errors.fetchFailed"));
    }
  };

  const setRowDraft = (id: string, draft: boolean) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, draft } : item)));

  const handleApply = (choice: BulkApplyChoice) => {
    appliedRef.current = choice;
    const next = new Map<string, AddProductFormData>();
    for (const item of items) {
      if (item.status !== "ready" || !item.values) continue;
      const current = formsRef.current.get(item.id)?.getValues() ?? item.values;
      next.set(item.id, applyBulkOptions(current, item.sourcePrice, choice.options, applyCtx));
    }
    setItems((prev) =>
      prev.map((item) => {
        const values = next.get(item.id);
        if (!values) return item;
        return {
          ...item,
          values,
          draft: choice.draft ?? item.draft,
          // Problems found by an earlier Save all are checked again.
          issues: item.issues ? checkBulkValues(completeBulkValues(values)).issues : undefined,
        };
      })
    );
    for (const [id, values] of next) formsRef.current.get(id)?.reset(values);
    toast.success(t("apply.applied", { count: next.size }));
  };

  const jumpToRow = (id: string) => {
    // After the row opens: its form mounts, then the page scrolls to it.
    window.setTimeout(() => {
      document.getElementById(rowDomId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    const targets = items.filter((i) => i.status === "ready" && i.values);
    if (targets.length === 0) {
      toast.error(t("noneReady"));
      return;
    }

    // The same checks as the product form, on every row: open or not.
    const checked = targets.map((item) => {
      const api = formsRef.current.get(item.id);
      const values = completeBulkValues(api?.getValues() ?? item.values!);
      return { item, values, check: checkBulkValues(values) };
    });
    const byId = new Map(checked.map((c) => [c.item.id, c]));
    setItems((prev) =>
      prev.map((item) => {
        const c = byId.get(item.id);
        if (!c) return item;
        return { ...item, values: c.values, issues: c.check.issues.length ? c.check.issues : undefined, error: undefined };
      })
    );

    const bad = checked.filter((c) => !c.check.data);
    const good = checked.filter((c) => c.check.data);

    if (bad.length > 0) {
      toast.error(t("needFixes", { count: bad.length }));
      for (const c of bad) void formsRef.current.get(c.item.id)?.trigger();
      setOpenIds((prev) => Array.from(new Set([...prev, ...bad.map((c) => c.item.id)])));
      const first = bad[0]!;
      if (first.check.locale && first.check.locale !== activeLocale) setActiveLocale(first.check.locale);
      jumpToRow(first.item.id);
    }

    if (good.length === 0) return;

    setSaveProgress({ done: 0, total: good.length });
    const cache: StoreCategoryCache = new Map();
    let inserted = 0;
    let warnings = 0;
    for (const [index, { item, check }] of good.entries()) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "saving" } : i)));
      const result = await saveBulkProduct(productStoreId, check.data!, {
        draft: Boolean(item.draft),
        cache,
        onCategory: taxonomy?.addCategory,
      }).catch(() => ({ ok: false as const, error: undefined }));
      if (result.ok) {
        inserted++;
        if (result.warning) warnings++;
      }
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== item.id) return i;
          return result.ok
            ? { ...i, status: "saved", draft: result.draft, issues: undefined, error: undefined }
            : // Back to ready with the reason, so the next Save all tries it again.
              { ...i, status: "ready", error: result.error || "createFailed" };
        })
      );
      setSaveProgress({ done: index + 1, total: good.length });
    }
    setSaveProgress(null);

    const total = items.length;
    const done =
      onAllSaved &&
      isBulkListDone({ total, savedBefore: savedCount, needFixes: bad.length, attempted: good.length, inserted });
    if (done) {
      // One toast for the whole list; the page goes back to an empty link box.
      toast.success(t("allSaved", { count: total }), {
        action: { label: t("viewProducts"), onClick: () => window.location.assign(productsHref()) },
      });
      if (warnings > 0) toast.warning(t("savedWithWarnings", { count: warnings }));
      onAllSaved(total);
      return;
    }

    if (inserted > 0) toast.success(t("created", { inserted, total: good.length }));
    if (inserted < good.length) toast.error(t("createFailedSome", { count: good.length - inserted }));
    if (warnings > 0) toast.warning(t("savedWithWarnings", { count: warnings }));
  };

  const progress = items.length > 0 ? Math.round((fetchedCount / items.length) * 100) : 0;

  return (
    <div className="pb-36 sm:pb-24">
      <div className="sticky top-[68px] z-20 border-b border-(--s-line) bg-(--s-glass) backdrop-blur-md max-[600px]:top-[60px]">
        <div className="mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-x-4 gap-y-2.5 px-7 py-3.5 max-[1020px]:px-4 max-[600px]:px-3 max-[600px]:py-2.5">
          <IconButton type="button" className="-me-1.5" aria-label={t("back")} title={t("back")} onClick={onExit} disabled={isSaving}>
            <X aria-hidden />
          </IconButton>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] leading-[1.4] font-bold text-(--s-ink) max-[600px]:text-[17px]">{t("title")}</h1>
            <p className="text-xs text-(--s-muted)" aria-live="polite">
              {isSaving
                ? t("savingProgress", { done: saveProgress.done, total: saveProgress.total })
                : isFetching
                  ? t("fetchingProgress", { done: fetchedCount, total: items.length })
                  : t("summary", { ready: readyCount, failed: errorCount, saved: savedCount, total: items.length })}
            </p>
          </div>
          <Segmented
            label={t("contentLanguage")}
            value={activeLocale}
            onChange={setActiveLocale}
            solid
            className="max-[600px]:w-full"
            options={(["ar", "en"] as const).map((loc) => ({ value: loc, label: LOCALE_LABELS[loc] }))}
          />
        </div>
        {isFetching && (
          <div className="h-[3px] overflow-hidden bg-(--s-line)" aria-hidden>
            <i className="block h-full bg-(--s-primary) transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-7 py-6 max-[1020px]:px-4 max-[600px]:px-3 max-[600px]:py-4">
        {items.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-(--s-line) bg-(--s-surface)">
            <EmptyState
              title={t("emptyTitle")}
              description={t("emptyList")}
              action={
                <SellerButton type="button" variant="outline" size="sm" onClick={onExit}>
                  {t("pasteAgain")}
                </SellerButton>
              }
            />
          </div>
        ) : (
          <>
            <BulkApplyPanel
              categories={categories}
              count={readyCount + items.filter((i) => i.status === "pending" || i.status === "fetching").length}
              disabled={isSaving}
              onApply={handleApply}
            />

            <Accordion
              type="multiple"
              value={openIds}
              onValueChange={setOpenIds}
              className="flex flex-col gap-3"
            >
              {items.map((item, index) => {
                const thumb = thumbnailSrc(item.thumbnail);
                const label = item.title || t("productN", { n: index + 1 });
                const busy = item.status === "fetching" || item.status === "saving";

                return (
                  <AccordionItem
                    key={item.id}
                    id={rowDomId(item.id)}
                    value={item.id}
                    className={cn(
                      "scroll-mt-[150px] rounded-[16px] border bg-(--s-surface) px-4 shadow-(--s-shadow-card) max-[600px]:px-3",
                      item.issues?.length ? "border-destructive/50" : "border-(--s-line)"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="min-w-0 flex-1">
                        <AccordionTrigger className="min-w-0 gap-2 bg-transparent px-0 py-3! hover:no-underline">
                          <span className="flex min-w-0 flex-1 items-center gap-3 text-start">
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-[10px] border border-(--s-line) bg-(--s-surface-2)">
                              {thumb ? (
                                <RemoteImage src={thumb} alt="" fill sizes="48px" className="object-cover" />
                              ) : (
                                <span className="grid size-full place-items-center text-[10px] text-(--s-faint)">
                                  {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : t("noImage")}
                                </span>
                              )}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="block truncate text-sm font-semibold text-(--s-ink)">{label}</span>
                              <span className="block truncate text-start text-xs font-normal text-(--s-faint)" dir="ltr" title={item.url}>
                                {shortProductUrl(item.url)}
                              </span>
                              {item.issues?.length ? (
                                <span className="mt-1 flex flex-wrap gap-1" aria-label={t("needsLabel")}>
                                  {item.issues.map((issue) => (
                                    <Tag key={issue} tone="danger">
                                      {t(`issues.${issue}`)}
                                    </Tag>
                                  ))}
                                </span>
                              ) : item.error ? (
                                <span className="block truncate text-xs font-normal text-destructive">{errorText(item.error)}</span>
                              ) : null}
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1">
                              <span
                                className={cn(
                                  "rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                                  statusClassName(item.status)
                                )}
                              >
                                {busy ? (
                                  <span className="inline-flex items-center gap-1">
                                    <LoaderCircle className="size-3 animate-spin" aria-hidden />
                                    {statusLabel(item.status, t)}
                                  </span>
                                ) : (
                                  statusLabel(item.status, t)
                                )}
                              </span>
                              {item.draft && (item.status === "ready" || item.status === "saved") && (
                                <Tag tone="muted">{t("draftTag")}</Tag>
                              )}
                            </span>
                          </span>
                        </AccordionTrigger>
                      </div>
                      {item.status === "error" && (
                        <IconButton type="button" onClick={() => handleRetry(item.id)} aria-label={t("retry")} title={t("retry")}>
                          <RefreshCw aria-hidden />
                        </IconButton>
                      )}
                      {item.status !== "saved" && item.status !== "saving" && (
                        <IconButton
                          type="button"
                          className="text-destructive"
                          onClick={() => handleRemove(item.id)}
                          aria-label={t("remove")}
                          title={t("remove")}
                          disabled={isSaving}
                        >
                          <Trash2 aria-hidden />
                        </IconButton>
                      )}
                    </div>
                    <AccordionContent className="px-0">
                      {item.status === "saved" ? (
                        <Note tone="success" icon={CheckCircle2}>
                          {item.draft ? t("savedDraftNote") : t("savedNote")}
                        </Note>
                      ) : (item.status === "ready" || item.status === "saving") && item.values ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-(--s-surface-2) px-3 py-2.5">
                            <span className="text-[13px] font-semibold text-(--s-ink)">{t("whenSaved")}</span>
                            <Segmented
                              label={t("whenSaved")}
                              value={item.draft ? "draft" : "publish"}
                              onChange={(value) => setRowDraft(item.id, value === "draft")}
                              options={[
                                { value: "publish", label: t("apply.publish") },
                                { value: "draft", label: t("apply.draft") },
                              ]}
                            />
                          </div>
                          <BulkItemForm
                            item={item}
                            categories={categories}
                            sellerPricing={sellerPricing}
                            activeLocale={activeLocale}
                            onValuesChange={handleValuesChange}
                            registerForm={registerForm}
                            unregisterForm={unregisterForm}
                          />
                        </div>
                      ) : item.status === "error" ? (
                        <Note tone="danger">
                          {errorText(item.error) || t("errors.urlFailed")} {t("retryOrRemove")}
                        </Note>
                      ) : (
                        <div className="flex items-center gap-2 py-4 text-sm text-(--s-muted)">
                          <LoaderCircle className="size-4 animate-spin" aria-hidden />
                          {t("fetchingDetails")}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </div>

      {/* Starts after the desktop sidebar, like MainContentWrapper. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-10 border-t border-(--s-line) bg-(--s-glass) backdrop-blur-md transition-[inset-inline-start] duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:start-20" : "lg:start-[280px]"
        )}
      >
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-7 py-3 max-[1020px]:px-4 max-[600px]:px-3">
          <p className="min-w-0 flex-1 text-xs text-(--s-muted) max-sm:basis-full">
            {allSaved ? t("allSaved", { count: savedCount }) : t("footerHint")}
          </p>
          {allSaved ? (
            <SellerButton type="button" onClick={() => window.location.assign(productsHref())} className="max-sm:w-full">
              {t("viewProducts")}
            </SellerButton>
          ) : (
            <SellerButton
              type="button"
              onClick={() => void handleSaveAll()}
              disabled={isSaving || isFetching || readyCount === 0}
              aria-busy={isSaving}
              className="max-sm:w-full"
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden />
                  {t("saving")}
                </>
              ) : (
                t("saveAll", { count: readyCount })
              )}
            </SellerButton>
          )}
        </div>
      </div>
    </div>
  );
}
