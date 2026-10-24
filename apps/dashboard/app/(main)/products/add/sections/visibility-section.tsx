"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@/lib/utils";
import { contentDirClass } from "@/lib/i18n/content-dir";
import { TagsInput } from "@/components/form/tags-input.client";
import { useProductLinkHost } from "../product-link-host.client";
import { META_KEYWORD_MAX_LENGTH, META_KEYWORDS_MAX } from "../meta-keywords.lib";
import {
  FIELD_CLASS,
  FieldHint,
  FieldLabel,
  LengthCount,
  LengthMeter,
  SectionCard,
  SubHeading,
  TEXTAREA_CLASS,
  ToggleRow,
} from "@/components/form/form-ui";
import type { AddProductFormData, SupportedLocale } from "../add-product.schema";

const META_TITLE = { min: 50, max: 60 };
const META_DESCRIPTION = { min: 150, max: 160 };

export function VisibilitySection({
  id = "sec-visibility",
  activeLocale,
}: {
  id?: string;
  activeLocale: SupportedLocale;
}) {
  const t = useTranslations("productForm.sections.visibility");
  const form = useFormContext<AddProductFormData>();

  return (
    <SectionCard
      id={id}
      icon={Sparkles}
      title={t("title")}
      description={t("description")}
      divided={false}
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="isTrending"
          render={({ field }) => (
            <ToggleRow
              id="is-trending"
              boxed
              checked={!!field.value}
              onCheckedChange={field.onChange}
              title={t("trending")}
              description={t("trendingDescription")}
            />
          )}
        />
        <Controller
          control={form.control}
          name="isSeasonal"
          render={({ field }) => (
            <ToggleRow
              id="is-seasonal"
              boxed
              checked={!!field.value}
              onCheckedChange={field.onChange}
              title={t("seasonal")}
              description={t("seasonalDescription")}
            />
          )}
        />
      </div>

      <SubHeading>{t("searchEngines")}</SubHeading>

      {(["en", "ar"] as const).map((loc) => (
        <div key={loc} className={cn("flex flex-col gap-4", activeLocale !== loc && "hidden")} lang={loc}>
          <SearchPreview locale={loc} />

          <Controller
            control={form.control}
            name={`localized.${loc}.metaTitle`}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor={`meta-title-${loc}`}
                  locale={loc}
                  note={<LengthCount length={field.value?.length ?? 0} {...META_TITLE} />}
                >
                  {t("metaTitle")}
                </FieldLabel>
                <Input
                  id={`meta-title-${loc}`}
                  {...field}
                  value={field.value ?? ""}
                  maxLength={META_TITLE.max}
                  placeholder={t("metaTitlePlaceholder")}
                  className={cn(FIELD_CLASS, contentDirClass(loc))}
                />
                <LengthMeter length={field.value?.length ?? 0} {...META_TITLE} />
                <FieldHint className="text-faint">{t("metaTitleHint")}</FieldHint>
              </div>
            )}
          />

          <Controller
            control={form.control}
            name={`localized.${loc}.metaDescription`}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor={`meta-description-${loc}`}
                  locale={loc}
                  note={<LengthCount length={field.value?.length ?? 0} {...META_DESCRIPTION} />}
                >
                  {t("metaDescription")}
                </FieldLabel>
                <Textarea
                  id={`meta-description-${loc}`}
                  {...field}
                  value={field.value ?? ""}
                  rows={2}
                  maxLength={META_DESCRIPTION.max}
                  placeholder={t("metaDescriptionPlaceholder")}
                  className={cn(TEXTAREA_CLASS, "min-h-[84px]", contentDirClass(loc))}
                />
                <LengthMeter length={field.value?.length ?? 0} {...META_DESCRIPTION} />
                <FieldHint className="text-faint">{t("metaDescriptionHint")}</FieldHint>
              </div>
            )}
          />

          <Controller
            control={form.control}
            name={`localized.${loc}.metaKeywords`}
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor={`meta-keywords-${loc}`}
                  locale={loc}
                  note={`${field.value?.length ?? 0}/${META_KEYWORDS_MAX}`}
                >
                  {t("metaKeywords")}
                </FieldLabel>
                <TagsInput
                  id={`meta-keywords-${loc}`}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  max={META_KEYWORDS_MAX}
                  maxLength={META_KEYWORD_MAX_LENGTH}
                  placeholder={t("metaKeywordsPlaceholder")}
                  removeLabel={(tag) => t("metaKeywordsRemove", { tag })}
                  aria-describedby={`meta-keywords-${loc}-hint`}
                  inputClassName={contentDirClass(loc)}
                />
                <FieldHint id={`meta-keywords-${loc}-hint`} className="text-faint">
                  {t("metaKeywordsHint")}
                </FieldHint>
              </div>
            )}
          />
        </div>
      ))}
    </SectionCard>
  );
}

/** Google-style result, falling back to the name and short description like the storefront does. */
function SearchPreview({ locale }: { locale: SupportedLocale }) {
  const t = useTranslations("productForm.sections.visibility");
  const form = useFormContext<AddProductFormData>();
  const [metaTitle, metaDescription, title, description, slug] = useWatch({
    control: form.control,
    name: [
      `localized.${locale}.metaTitle`,
      `localized.${locale}.metaDescription`,
      `localized.${locale}.title`,
      `localized.${locale}.description`,
      "localized.en.slug",
    ],
  });
  const linkHost = useProductLinkHost();
  const heading = (metaTitle || title || "").trim();
  const body = (metaDescription || description || "").trim();

  return (
    <div className="rounded-xl border bg-muted p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div dir="ltr" className="truncate font-sans text-xs text-muted-foreground rtl:text-right">
        {linkHost} › products › {slug || "product"}
      </div>
      <div className="my-0.5 truncate text-[17px] leading-normal text-[#1a0dab] dark:text-[#8ab4f8]">
        {heading ? heading.slice(0, META_TITLE.max) + (heading.length > META_TITLE.max ? "…" : "") : t("serpTitle")}
      </div>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {body ? body.slice(0, META_DESCRIPTION.max) : t("serpDescription")}
      </p>
    </div>
  );
}
