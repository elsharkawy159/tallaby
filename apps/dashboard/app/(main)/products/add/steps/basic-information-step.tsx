"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDown } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { BasicSection } from "../sections/basic-section";
import { MediaSection } from "../sections/media-section";
import { ContentSection } from "../sections/content-section";
import { ImportDialog } from "../import-dialog";
import type { BrandOption, CategoryOption, SupportedLocale } from "../add-product.schema";

interface BasicInformationStepProps {
  categories: CategoryOption[];
  brands: BrandOption[];
  sellerPricing: SellerPricingSettings;
  activeLocale: SupportedLocale;
  /** Hide the import button (used inside bulk accordion item forms). */
  hideImport?: boolean;
  /** Called when an import detects 2+ product URLs. */
  onBulkUrls?: (urls: string[]) => void;
}

/** Name, category, media and description — used by the edit wizard and bulk import. */
export function BasicInformationStep({
  categories,
  brands,
  sellerPricing,
  activeLocale,
  hideImport = false,
  onBulkUrls,
}: BasicInformationStepProps) {
  const t = useTranslations("productForm.sections.basic");
  const uid = useId();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <BasicSection
        id={`${uid}-basic`}
        categories={categories}
        brands={brands}
        activeLocale={activeLocale}
        action={
          hideImport ? undefined : (
            <Button
              type="button"
              variant="soft"
              className={cn(SMALL_BUTTON_CLASS, "h-8 text-xs")}
              onClick={() => setImportOpen(true)}
            >
              <FileDown />
              <span className="hidden sm:inline">{t("importFromLink")}</span>
            </Button>
          )
        }
      />
      <MediaSection id={`${uid}-media`} />
      <ContentSection id={`${uid}-content`} activeLocale={activeLocale} />

      {!hideImport && (
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          categories={categories}
          sellerPricing={sellerPricing}
          onBulkUrls={onBulkUrls}
        />
      )}
    </div>
  );
}
