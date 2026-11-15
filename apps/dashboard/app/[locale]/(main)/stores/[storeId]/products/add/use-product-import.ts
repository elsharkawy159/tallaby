"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { applyProductImportToForm } from "./apply-product-import.lib";
import {
  buildParsedImportFromScrape,
  detectImportFormat,
  extractProductUrls,
  parseProductImport,
} from "./parse-product-import.lib";
import { MAX_BULK_IMPORT_URLS } from "./parse-product-import.types";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";

interface UseProductImportOptions {
  categories: CategoryOption[];
  sellerPricing: SellerPricingSettings;
  /** Called when the input holds 2+ product URLs. */
  onBulkUrls?: (urls: string[]) => void;
}

/**
 * Fills the product form from a pasted URL, URL list, JSON or formatted text.
 * Resolves to true when something was imported (or handed to bulk import).
 */
export function useProductImport({
  categories,
  sellerPricing,
  onBulkUrls,
}: UseProductImportOptions) {
  const form = useFormContext<AddProductFormData>();
  const tToast = useTranslations("toast");
  const t = useTranslations("productForm.basic");
  const [isImporting, setIsImporting] = useState(false);

  const importProduct = async (rawInput: string): Promise<boolean> => {
    const input = rawInput.trim();

    if (!input) {
      toast.error(tToast("pleasePasteProductImportFirst"));
      return false;
    }

    const format = detectImportFormat(input);

    if (format === "unknown") {
      toast.error(tToast("unknownImportFormat"));
      return false;
    }

    if (format === "url_bulk") {
      const allUrls = extractProductUrls(input);
      const urls = allUrls.slice(0, MAX_BULK_IMPORT_URLS);
      if (urls.length < 2) {
        toast.error(tToast("unknownImportFormat"));
        return false;
      }
      if (allUrls.length > MAX_BULK_IMPORT_URLS) {
        toast.message(t("onlyFirstUrls", { max: MAX_BULK_IMPORT_URLS }));
      }
      if (!onBulkUrls) {
        toast.error(t("bulkUnavailable"));
        return false;
      }
      onBulkUrls(urls);
      return true;
    }

    form.setValue("productUrl", input, { shouldDirty: true });
    setIsImporting(true);

    try {
      if (format === "url") {
        const singleUrl = extractProductUrls(input)[0] ?? input;
        const fetchLocale = (locale: "en" | "ar") =>
          fetch("/api/fetch-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: singleUrl, locale }),
          });
        const [resEn, resAr] = await Promise.all([fetchLocale("en"), fetchLocale("ar")]);

        const dataEn = await resEn.json();
        const dataAr = await resAr.json();

        if (!resEn.ok) {
          toast.error(dataEn?.error || tToast("failedToFetchProductData"));
          return false;
        }

        const parsed = buildParsedImportFromScrape(dataEn, dataAr);
        const applyResult = await applyProductImportToForm(form, parsed, {
          sellerPricing,
          categories,
        });

        if (applyResult.imagesImported > 0) {
          toast.success(tToast("importedImagesToMedia", { count: applyResult.imagesImported }));
        } else if (parsed.images?.length) {
          toast.message(tToast("mediaAlreadyHasImages"));
        }

        toast.success(tToast("productDetailsFetchedEnAr"));
        return true;
      }

      const parseResult = parseProductImport(input);

      if (!parseResult.success) {
        toast.error(parseResult.error || tToast("failedToParseProductData"));
        return false;
      }

      const applyResult = await applyProductImportToForm(form, parseResult.data, {
        sellerPricing,
        categories,
      });

      if (applyResult.imagesImported > 0) {
        toast.success(tToast("importedImagesToMedia", { count: applyResult.imagesImported }));
      }

      toast.success(tToast("importedFromStructuredData"));
      return true;
    } catch (error) {
      console.error("Import product error:", error);
      toast.error(tToast("somethingWentWrongWhileFetching"));
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  return { importProduct, isImporting };
}
