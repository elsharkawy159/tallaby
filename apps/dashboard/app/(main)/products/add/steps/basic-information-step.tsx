"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import {
  TextInput,
  TextareaInput,
  ArrayInput,
  CategoryPopover,
} from "@workspace/ui/components"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { BrandSearchInput } from "@/components/inputs/brand-search-input"
import { ImageUpload } from "@/components/inputs/image-upload"
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@workspace/ui/components/form"
import { LoaderCircle } from "lucide-react"
import slugify from "slugify"
import { useDebounce } from "@/hooks/use-debounce"
import { CategorySuggestions } from "../category-suggestions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
  SupportedLocale,
} from "../add-product.schema"

interface BasicInformationStepProps {
  categories: CategoryOption[]
  brands: BrandOption[]
  activeLocale: SupportedLocale
}

export function BasicInformationStep({
  categories,
  brands,
  activeLocale,
}: BasicInformationStepProps) {
  const form = useFormContext<AddProductFormData>()
  const [isFetching, setIsFetching] = useState(false)
  const [_suggestedImages, setSuggestedImages] = useState<string[]>([])

  const productUrl = form.watch("productUrl")
  const productTitle = form.watch(`localized.${activeLocale}.title`)
  const debouncedTitle = useDebounce(productTitle || "", 300)
  const selectedCategoryId = form.watch("categoryId")

  const handleCategorySelect = (categoryId: string) => {
    form.setValue("categoryId", categoryId, { shouldValidate: true });
  };

  const parsePriceToNumber = (value: unknown) => {
    if (typeof value === "number") {
      if (!Number.isFinite(value) || value <= 0) return undefined;
      return value;
    }

    if (typeof value !== "string") return undefined;

    const match = value.replace(/\s+/g, " ").trim().match(/[\d.,]+/);
    if (!match?.[0]) return undefined;

    const normalized = match[0].replace(/,/g, "");
    const num = Number.parseFloat(normalized);
    if (!Number.isFinite(num) || num <= 0) return undefined;
    return num;
  };

  const handleFetchFromUrl = async (urlOverride?: string) => {
    const url = (urlOverride ?? (typeof productUrl === "string" ? productUrl.trim() : "")).trim();
    if (!url) {
      toast.error("Please paste a product URL first");
      return;
    }

    setIsFetching(true);
    try {
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
      ]);

      const dataEn = await resEn.json();
      const dataAr = await resAr.json();

      if (!resEn.ok) {
        toast.error(dataEn?.error || "Failed to fetch product data");
        return;
      }

      const parseData = (data: any) => ({
        title: typeof data?.title === "string" ? data.title.trim() : "",
        description: typeof data?.description === "string" ? data.description.trim() : "",
        bulletPoints: Array.isArray(data?.bulletPoints)
          ? data.bulletPoints.filter((b: unknown) => typeof b === "string").map((b: string) => b.trim()).filter(Boolean)
          : [],
        price: parsePriceToNumber(data?.priceAmount) || parsePriceToNumber(data?.price),
        images: Array.isArray(data?.images)
          ? data.images.filter((img: unknown) => typeof img === "string")
          : [],
      });

      const scrapedEn = parseData(dataEn);
      const scrapedAr = parseData(dataAr);

      const scrapedImages = scrapedEn.images.length > 0 ? scrapedEn.images : scrapedAr.images;
      const scrapedPrice = scrapedEn.price ?? scrapedAr.price;

      if (scrapedEn.title) {
        form.setValue("localized.en.title", scrapedEn.title, { shouldDirty: true });
        form.setValue(
          "localized.en.slug",
          slugify(scrapedEn.title, { lower: true, strict: true }),
          { shouldDirty: true, shouldValidate: true }
        );
      }
      if (scrapedEn.description) {
        form.setValue("localized.en.description", scrapedEn.description, { shouldDirty: true });
      }
      if (scrapedEn.bulletPoints.length > 0) {
        const current = form.getValues("localized.en.bulletPoints");
        const currentList = Array.isArray(current) ? current.filter((x: unknown) => typeof x === "string") : [];
        const merged = Array.from(new Set([...currentList, ...scrapedEn.bulletPoints])).slice(0, 10);
        form.setValue("localized.en.bulletPoints", merged, { shouldDirty: true, shouldValidate: true });
      }

      if (scrapedAr.title) {
        form.setValue("localized.ar.title", scrapedAr.title, { shouldDirty: true });
        form.setValue(
          "localized.ar.slug",
          slugify(scrapedAr.title, { lower: true, strict: true }),
          { shouldDirty: true, shouldValidate: true }
        );
      }
      if (scrapedAr.description) {
        form.setValue("localized.ar.description", scrapedAr.description, { shouldDirty: true });
      }
      if (scrapedAr.bulletPoints.length > 0) {
        const current = form.getValues("localized.ar.bulletPoints");
        const currentList = Array.isArray(current) ? current.filter((x: unknown) => typeof x === "string") : [];
        const merged = Array.from(new Set([...currentList, ...scrapedAr.bulletPoints])).slice(0, 10);
        form.setValue("localized.ar.bulletPoints", merged, { shouldDirty: true, shouldValidate: true });
      }

      if (scrapedPrice) {
        form.setValue("price.list", scrapedPrice, { shouldDirty: true, shouldValidate: true });
        form.setValue("price.base", scrapedPrice, { shouldDirty: true });
        form.setValue("price.final", Number((scrapedPrice * 1.1).toFixed(2)), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      const currentQty = form.getValues("quantity");
      if (typeof currentQty !== "number" || !Number.isFinite(currentQty) || currentQty <= 0) {
        form.setValue("quantity", 25, { shouldDirty: true, shouldValidate: true });
      }

      setSuggestedImages(scrapedImages.slice(0, 1));

      if (scrapedImages.length > 0) {
        const currentImages = form.getValues("images") || [];
        const shouldImport = Array.isArray(currentImages) ? currentImages.length === 0 : true;

        if (!shouldImport) {
          toast.message("Media already has images — skipped auto import.");
        } else {
          const importRes = await fetch("/api/import-product-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: scrapedImages.slice(0, 1) }),
          });

          const importData = await importRes.json();
          if (!importRes.ok) {
            toast.error(importData?.error || "Failed to import images");
          } else {
            const importedPaths = Array.isArray(importData?.paths)
              ? importData.paths.filter((p: unknown) => typeof p === "string")
              : [];

            if (importedPaths.length > 0) {
              form.setValue("images", importedPaths, { shouldDirty: true, shouldValidate: true });
              await form.trigger("images");
              toast.success(`Imported ${importedPaths.length} image(s) to Media`);
            } else {
              toast.message("No images were imported (some sites block downloads).");
            }
          }
        }
      }

      const currentMetaTitleEn = form.getValues("localized.en.metaTitle");
      const currentMetaDescEn = form.getValues("localized.en.metaDescription");
      if (!currentMetaTitleEn && scrapedEn.title) {
        form.setValue("localized.en.metaTitle", scrapedEn.title.slice(0, 60), { shouldDirty: true });
      }
      if (!currentMetaDescEn && scrapedEn.description) {
        form.setValue("localized.en.metaDescription", scrapedEn.description.slice(0, 160), { shouldDirty: true });
      }

      const currentMetaTitleAr = form.getValues("localized.ar.metaTitle");
      const currentMetaDescAr = form.getValues("localized.ar.metaDescription");
      if (!currentMetaTitleAr && scrapedAr.title) {
        form.setValue("localized.ar.metaTitle", scrapedAr.title.slice(0, 60), { shouldDirty: true });
      }
      if (!currentMetaDescAr && scrapedAr.description) {
        form.setValue("localized.ar.metaDescription", scrapedAr.description.slice(0, 160), { shouldDirty: true });
      }

      toast.success("Product details fetched for EN and AR. Review and adjust before saving.");
    } catch (error) {
      console.error("Fetch product error:", error);
      toast.error("Something went wrong while fetching product data");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product URL Import */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <FormLabel className="text-sm">Product URL (optional)</FormLabel>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <Input
                type="url"
                value={productUrl || ""}
                onChange={(e) =>
                  form.setValue("productUrl", e.target.value, { shouldDirty: true })
                }
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData?.("text/plain")?.trim() ?? "";
                  if (pasted && /^https?:\/\//i.test(pasted)) {
                    e.preventDefault();
                    form.setValue("productUrl", pasted, { shouldDirty: true });
                    handleFetchFromUrl(pasted);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleFetchFromUrl();
                  }
                }}
                placeholder="Paste a product URL to prefill details"
                className="text-sm h-10 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleFetchFromUrl()}
                disabled={isFetching}
                className="text-sm h-10"
              >
                {isFetching ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Fetching...
                  </span>
                ) : (
                  "Fetch Product"
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This will prefill Images, title, description and price.
            </p>
          </div>
        </div>

        {/* {suggestedImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Suggested images</p>
            <div className="flex flex-wrap gap-2">
              {suggestedImages.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  className="rounded-md border border-gray-200 overflow-hidden w-20 h-20 bg-gray-50 hover:border-gray-300"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(src);
                      toast.success("Image URL copied");
                    } catch {
                      toast.error("Could not copy image URL");
                    }
                  }}
                  aria-label="Copy image URL"
                  title="Click to copy image URL"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Tip: click an image to copy its URL, download it, then upload via Media.
            </p>
          </div>
        )} */}
      </div>

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
                loc === "en"
                  ? "Short sleeve t-shirt"
                  : "قميص قصير الأكمام"
              }
              required={loc === "en"}
              onBlur={(e) => {
                if (e.target.value) {
                  form.setValue(`localized.${loc}.slug`, slugify(e.target.value, { lower: true, strict: true }), { shouldValidate: true })
                }
              }}
              className="text-sm"
            />
            <TextInput
              form={form}
              name={`localized.${loc}.slug`}
              label="Slug"
              placeholder="short-sleeve-t-shirt"
              disabled
              className="text-sm"
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
                className="text-sm"
              />
            )}
          />
        </div>
      ))}

      {/* Category and Brand */}
      <div className="flex flex-col md:flex-row gap-4">
        {categories && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex-1">
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
        <div className="flex-1">
          <BrandSearchInput
            name="brandId"
            label="Brand"
            placeholder="Search for a brand..."
            selectedBrands={brands ?? []}
          />
        </div>
      </div>

      {/* Key Features (localized) - render both locales, hide inactive */}
      {(["en", "ar"] as const).map((loc) => (
        <div
          key={loc}
          className={cn(activeLocale !== loc && "hidden")}
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
  );
}
