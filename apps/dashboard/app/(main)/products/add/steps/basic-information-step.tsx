"use client";

import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  TextInput,
  TextareaInput,
  ArrayInput,
  CategoryPopover,
} from "@workspace/ui/components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { BrandSearchInput } from "@/components/inputs/brand-search-input";
import { ImageUpload } from "@/components/inputs/image-upload";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@workspace/ui/components/form";
import { LoaderCircle } from "lucide-react";
import slugify from "slugify";
import { useDebounce } from "@/hooks/use-debounce";
import { CategorySuggestions } from "../category-suggestions";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { contentDirClass } from "@/lib/i18n/content-dir";
import { cn, generateImageName, getPublicUrl, validateImage } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { RichTextEditor } from "@workspace/tiptap/editor";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { applyProductImportToForm } from "../apply-product-import.lib";
import {
  buildParsedImportFromScrape,
  detectImportFormat,
  extractProductUrls,
  parseProductImport,
} from "../parse-product-import.lib";
import { MAX_BULK_IMPORT_URLS } from "../parse-product-import.types";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
  SupportedLocale,
} from "../add-product.schema";

interface BasicInformationStepProps {
  categories: CategoryOption[];
  brands: BrandOption[];
  sellerPricing: SellerPricingSettings;
  activeLocale: SupportedLocale;
  /** Hide the import textarea (used inside bulk accordion item forms). */
  hideImport?: boolean;
  /** Called when paste/import detects 2+ product URLs. */
  onBulkUrls?: (urls: string[]) => void;
  /** Controlled open state for the import accordion (closed after paste/import). */
  importSectionOpen?: boolean;
  onImportSectionOpenChange?: (open: boolean) => void;
}

export function BasicInformationStep({
  categories,
  brands,
  sellerPricing,
  activeLocale,
  hideImport = false,
  onBulkUrls,
  importSectionOpen,
  onImportSectionOpenChange,
}: BasicInformationStepProps) {
  const form = useFormContext<AddProductFormData>();
  const tToast = useTranslations("toast");
  const t = useTranslations("productForm.basic");
  const tCategory = useTranslations("productForm.categoryPicker");
  const uiLocale = useLocale();
  const supabase = createClient();

  // The picker shows Arabic names in the Arabic UI; suggestions keep the raw
  // options because they match against either language.
  const pickerCategories = useMemo(() => {
    if (uiLocale !== "ar") return categories;
    type Node = CategoryOption & { categories?: Node[] };
    const localize = (nodes: Node[]): Node[] =>
      nodes.map((node) => ({
        ...node,
        name: node.nameAr || node.name,
        categories: node.categories ? localize(node.categories) : undefined,
      }));
    return localize(categories as Node[]);
  }, [categories, uiLocale]);

  const categoryLabels = useMemo(
    () => ({
      back: tCategory("back"),
      atRoot: tCategory("atRoot"),
      goToRoot: tCategory("goToRoot"),
      all: tCategory("all"),
      goTo: (name: string) => tCategory("goTo", { name }),
      search: tCategory("search"),
      empty: tCategory("empty"),
    }),
    [tCategory]
  );
  const [isFetching, setIsFetching] = useState(false);
  const [uncontrolledImportOpen, setUncontrolledImportOpen] = useState(true);

  const isImportOpen =
    importSectionOpen !== undefined ? importSectionOpen : uncontrolledImportOpen;

  const setImportOpen = (open: boolean) => {
    if (onImportSectionOpenChange) {
      onImportSectionOpenChange(open);
      return;
    }
    setUncontrolledImportOpen(open);
  };

  const handleContentImageUpload = useCallback(
    async (file: File) => {
      try {
        await validateImage(file);
      } catch (error) {
        toast.error(
          error instanceof Error && tToast.has(error.message)
            ? tToast(error.message)
            : tToast("uploadError", { fileName: file.name })
        );
        return null;
      }

      const fileName = generateImageName(file);
      const { data, error } = await supabase.storage
        .from("products")
        .upload(fileName, file, { upsert: false });

      if (error) {
        toast.error(tToast("uploadError", { fileName: file.name }));
        return null;
      }

      return getPublicUrl(data.path, "products");
    },
    [supabase, tToast]
  );

  const productUrl = form.watch("productUrl");
  const productTitle = form.watch(`localized.${activeLocale}.title`);
  const debouncedTitle = useDebounce(productTitle || "", 300);
  const selectedCategoryId = form.watch("categoryId");

  const handleCategorySelect = (categoryId: string) => {
    form.setValue("categoryId", categoryId, { shouldValidate: true });
  };

  const handleImportProduct = async (inputOverride?: string) => {
    const input = (
      inputOverride ?? (typeof productUrl === "string" ? productUrl.trim() : "")
    ).trim();

    if (!input) {
      toast.error(tToast("pleasePasteProductImportFirst"));
      return;
    }

    const format = detectImportFormat(input);

    if (format === "unknown") {
      toast.error(tToast("unknownImportFormat"));
      return;
    }

    if (format === "url_bulk") {
      const urls = extractProductUrls(input).slice(0, MAX_BULK_IMPORT_URLS);
      if (urls.length < 2) {
        toast.error(tToast("unknownImportFormat"));
        return;
      }
      if (extractProductUrls(input).length > MAX_BULK_IMPORT_URLS) {
        toast.message(t("onlyFirstUrls", { max: MAX_BULK_IMPORT_URLS }));
      }
      if (onBulkUrls) {
        onBulkUrls(urls);
        return;
      }
      toast.error(t("bulkUnavailable"));
      return;
    }

    setIsFetching(true);

    try {
      if (format === "url") {
        const singleUrl = extractProductUrls(input)[0] ?? input
        const [resEn, resAr] = await Promise.all([
          fetch("/api/fetch-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: singleUrl, locale: "en" }),
          }),
          fetch("/api/fetch-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: singleUrl, locale: "ar" }),
          }),
        ]);

        const dataEn = await resEn.json();
        const dataAr = await resAr.json();

        if (!resEn.ok) {
          toast.error(dataEn?.error || tToast("failedToFetchProductData"));
          return;
        }

        const parsed = buildParsedImportFromScrape(dataEn, dataAr);
        const applyResult = await applyProductImportToForm(form, parsed, {
          sellerPricing,
          categories,
        });

        if (applyResult.imagesImported > 0) {
          toast.success(
            tToast("importedImagesToMedia", { count: applyResult.imagesImported })
          );
        } else if (parsed.images?.length) {
          toast.message(tToast("mediaAlreadyHasImages"));
        }

        toast.success(tToast("productDetailsFetchedEnAr"));
        setImportOpen(false);
        return;
      }

      const parseResult = parseProductImport(input);

      if (!parseResult.success) {
        toast.error(parseResult.error || tToast("failedToParseProductData"));
        return;
      }

      const applyResult = await applyProductImportToForm(
        form,
        parseResult.data,
        { sellerPricing, categories }
      );

      if (applyResult.imagesImported > 0) {
        toast.success(
          tToast("importedImagesToMedia", { count: applyResult.imagesImported })
        );
      }

      toast.success(tToast("importedFromStructuredData"));
      setImportOpen(false);
    } catch (error) {
      console.error("Import product error:", error);
      toast.error(tToast("somethingWentWrongWhileFetching"));
    } finally {
      setIsFetching(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData?.getData?.("text/plain")?.trim() ?? "";
    if (!pasted) return;

    const format = detectImportFormat(pasted);
    if (format === "unknown") return;

    e.preventDefault();
    form.setValue("productUrl", pasted, { shouldDirty: true });
    setImportOpen(false);
    handleImportProduct(pasted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleImportProduct();
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Import — collapse on paste/import */}
      {!hideImport && (
        <Accordion
          type="single"
          collapsible
          value={isImportOpen ? "import" : ""}
          onValueChange={(value) => setImportOpen(value === "import")}
          className="bg-card rounded-lg border border-border shadow-sm"
        >
          <AccordionItem value="import" className="border-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              <span className="flex flex-col items-start gap-0.5 text-start">
                <span>{t("importTitle")}</span>
                {!isImportOpen && isFetching ? (
                  <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1.5">
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                    {t("importing")}
                  </span>
                ) : !isImportOpen && productUrl ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {t("imported")}
                  </span>
                ) : null}
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Textarea
                  value={productUrl || ""}
                  onChange={(e) =>
                    form.setValue("productUrl", e.target.value, {
                      shouldDirty: true,
                    })
                  }
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  placeholder={t("importPlaceholder")}
                  dir="ltr"
                  className="text-sm min-h-[100px] max-h-48 flex-1 resize-y"
                  rows={4}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleImportProduct()}
                  disabled={isFetching}
                  className="text-sm h-10 sm:self-start"
                >
                  {isFetching ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      {t("importing")}
                    </span>
                  ) : (
                    t("importButton")
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("importHelp")}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Media */}
      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">
              {t("media")} <span className="text-red-600 dark:text-red-400">*</span>
            </FormLabel>
            <FormControl>
              <ImageUpload
                bucket="products"
                value={field.value || []}
                onChange={field.onChange}
                form={form}
                maxImages={8}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground mt-1">
              {t("mediaHint")}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Title and Slug (localized) - render both locales, hide inactive to preserve form state */}
      {(["en", "ar"] as const).map((loc) => (
        <div
          key={loc}
          className={cn("space-y-4", activeLocale !== loc && "hidden")}
          lang={loc}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              form={form}
              name={`localized.${loc}.title`}
              label={t("title")}
              placeholder={
                loc === "en" ? "Short sleeve t-shirt" : "قميص قصير الأكمام"
              }
              required={loc === "en"}
              onBlur={(e) => {
                if (e.target.value) {
                  form.setValue(
                    `localized.${loc}.slug`,
                    slugify(e.target.value, { lower: true, strict: true }),
                    { shouldValidate: true }
                  );
                }
              }}
              className={cn("text-sm", contentDirClass(loc))}
            />
            <TextInput
              form={form}
              name={`localized.${loc}.slug`}
              label={t("slug")}
              placeholder="short-sleeve-t-shirt"
              disabled
              className={cn("text-sm", contentDirClass("en"))}
            />
          </div>

          <FormField
            control={form.control}
            name={`localized.${loc}.description`}
            render={({ field }) => (
              <TextareaInput
                {...field}
                label={t("description")}
                form={form}
                placeholder={t("descriptionPlaceholder")}
                rows={6}
                className={cn("text-sm", contentDirClass(loc))}
              />
            )}
          />

          <FormField
            control={form.control}
            name={`localized.${loc}.content`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">{t("content")}</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder={t("contentPlaceholder")}
                    dir={loc === "ar" ? "rtl" : "ltr"}
                    onImageUpload={handleContentImageUpload}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}

      {/* Category, Brand, and Key Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {categories && (
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    {t("category")} <span className="text-red-600 dark:text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <CategoryPopover
                        categories={pickerCategories}
                        value={field.value}
                        onChange={field.onChange}
                        form={form}
                        placeholder={tCategory("placeholder")}
                        labels={categoryLabels}
                      />
                      <CategorySuggestions
                        categories={categories}
                        productName={debouncedTitle}
                        selectedCategoryId={selectedCategoryId}
                        onSelect={handleCategorySelect}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <BrandSearchInput
            name="brandId"
            selectedBrands={brands ?? []}
          />
        </div>

        <div>
          {(["en", "ar"] as const).map((loc) => (
            <div
              key={loc}
              className={cn(
                activeLocale !== loc && "hidden",
                loc === "ar"
                  ? "[&_input]:[direction:rtl] [&_input]:!text-right"
                  : "[&_input]:[direction:ltr] [&_input]:!text-left"
              )}
            >
              <FormField
                control={form.control}
                name={`localized.${loc}.bulletPoints`}
                render={({ field }) => (
                  <ArrayInput
                    {...field}
                    label={t("keyFeatures")}
                    addButtonText={t("addFeature")}
                    itemPlaceholder={t("featurePlaceholder")}
                    removeButtonText={t("remove")}
                    emptyStateText={t("noFeatures")}
                    smartPasteHint={t("pasteHint")}
                    maxItems={10}
                    className="text-sm"
                  />
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
