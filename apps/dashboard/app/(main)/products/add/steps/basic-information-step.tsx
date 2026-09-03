"use client";

import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  TextInput,
  TextareaInput,
  ArrayInput,
  CategoryPopover,
} from "@workspace/ui/components";
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
import { useTranslations } from "next-intl";
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
}

export function BasicInformationStep({
  categories,
  brands,
  sellerPricing,
  activeLocale,
  hideImport = false,
  onBulkUrls,
}: BasicInformationStepProps) {
  const form = useFormContext<AddProductFormData>();
  const tToast = useTranslations("toast");
  const supabase = createClient();
  const [isFetching, setIsFetching] = useState(false);

  const handleContentImageUpload = useCallback(
    async (file: File) => {
      try {
        await validateImage(file);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tToast("uploadError", { fileName: file.name })
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
        toast.message(
          `Only the first ${MAX_BULK_IMPORT_URLS} URLs will be imported`
        );
      }
      if (onBulkUrls) {
        onBulkUrls(urls);
        return;
      }
      toast.error("Bulk URL import is not available here");
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
      {/* Product Import */}
      {!hideImport && (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <FormLabel className="text-sm">Import product (URL or data)</FormLabel>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <Textarea
                value={productUrl || ""}
                onChange={(e) =>
                  form.setValue("productUrl", e.target.value, {
                    shouldDirty: true,
                  })
                }
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder="Paste one product URL, many URLs (one per line), JSON, or formatted product data"
                className="text-sm min-h-[100px] flex-1 resize-y"
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
                    Importing...
                  </span>
                ) : (
                  "Import Product"
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Paste one URL, or many URLs (one per line) for bulk import. JSON
              and formatted text also work. See PRODUCT_DATA_FORMAT.md for the
              text format spec.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Media */}
      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm">
              Media <span className="text-red-600">*</span>
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
            <p className="text-xs text-gray-500 mt-1">
              Accepts images, videos, or 3D models
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
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              form={form}
              name={`localized.${loc}.title`}
              label="Title"
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
              className={cn("text-sm", loc === "ar" && "text-right")}
            />
            <TextInput
              form={form}
              name={`localized.${loc}.slug`}
              label="Slug"
              placeholder="short-sleeve-t-shirt"
              disabled
              className={cn("text-sm", loc === "ar" && "text-right")}
            />
          </div>

          <FormField
            control={form.control}
            name={`localized.${loc}.description`}
            render={({ field }) => (
              <TextareaInput
                {...field}
                label="Description"
                form={form}
                placeholder="Product description..."
                rows={6}
                className={cn("text-sm", loc === "ar" && "text-right")}
              />
            )}
          />

          <FormField
            control={form.control}
            name={`localized.${loc}.content`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Product Content</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Write detailed product content with headings, lists, and highlights..."
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
                    Category <span className="text-red-600">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <CategoryPopover
                        categories={categories}
                        value={field.value}
                        onChange={field.onChange}
                        form={form}
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
            label="Brand"
            placeholder="Search for a brand..."
            selectedBrands={brands ?? []}
          />
        </div>

        <div>
          {(["en", "ar"] as const).map((loc) => (
            <div
              key={loc}
              className={cn(
                activeLocale !== loc && "hidden",
                loc === "ar" && "[&_input]:text-right [&_textarea]:text-right"
              )}
            >
              <FormField
                control={form.control}
                name={`localized.${loc}.bulletPoints`}
                render={({ field }) => (
                  <ArrayInput
                    {...field}
                    label="Key Features (max 10)"
                    addButtonText="Add Feature"
                    itemPlaceholder="Enter a key feature..."
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
