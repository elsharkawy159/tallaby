"use client";

import { useTranslations } from "next-intl";
import { contentDirClass } from "@/lib/i18n/content-dir";

import { useFormContext } from "react-hook-form";
import { TextInput, TextareaInput } from "@workspace/ui/components";
import { cn } from "@/lib/utils";
import type {
  AddProductFormData,
  SupportedLocale,
} from "../add-product.schema";

interface SeoStepProps {
  activeLocale: SupportedLocale;
}

export function SeoStep({ activeLocale }: SeoStepProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.seo");

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("description")}</p>
        </div>

        {(["en", "ar"] as const).map((loc) => (
          <div
            key={loc}
            className={cn("space-y-4", activeLocale !== loc && "hidden")}
            lang={loc}
          >
            <TextInput
              form={form}
              name={`localized.${loc}.metaTitle`}
              label={t("metaTitle")}
              placeholder={t("metaTitlePlaceholder")}
              description={t("metaTitleHint")}
              className={cn("text-sm", contentDirClass(loc))}
            />

            <TextareaInput
              form={form}
              name={`localized.${loc}.metaDescription`}
              label={t("metaDescription")}
              placeholder={t("metaDescriptionPlaceholder")}
              rows={3}
              description={t("metaDescriptionHint")}
              className={cn("text-sm", contentDirClass(loc))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
