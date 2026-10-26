"use client";

import { useEffect, useRef } from "react";
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
  SubHeading,
  TEXTAREA_CLASS,
  ToggleRow,
} from "@/components/form/form-ui";
import { CollapsibleSection } from "./collapsible-section";
import {
  META_DESCRIPTION,
  META_TITLE,
  autoMetaDescription,
  autoMetaTitle,
} from "../prepare-product-submit.lib";
import type { AddProductFormData, SupportedLocale } from "../add-product.schema";

type MetaField = "metaTitle" | "metaDescription";
const META_FIELDS = ["metaTitle", "metaDescription"] as const;

/** The SEO inputs of one language, plus what we would fill in for them. */
function useSeoValues(locale: SupportedLocale) {
  const form = useFormContext<AddProductFormData>();
  const [title, description, content, metaTitle, metaDescription] = useWatch({
    control: form.control,
    name: [
      `localized.${locale}.title`,
      `localized.${locale}.description`,
      `localized.${locale}.content`,
      `localized.${locale}.metaTitle`,
      `localized.${locale}.metaDescription`,
    ],
  });
  const auto: Record<MetaField, string> = {
    metaTitle: autoMetaTitle({ title }),
    metaDescription: autoMetaDescription({ description, content }),
  };
  const current: Record<MetaField, string> = {
    metaTitle: metaTitle ?? "",
    metaDescription: metaDescription ?? "",
  };
  return { auto, current };
}

/**
 * Meta title and description follow the product name and description until
 * the seller writes their own. A value is the seller's own when it isn't
 * empty and isn't what we filled in; clearing it goes back to automatic.
 */
function useAutoSeo(locale: SupportedLocale) {
  const form = useFormContext<AddProductFormData>();
  const { auto, current } = useSeoValues(locale);
  // What we last filled in, so a value written for an older name still counts as automatic.
  const written = useRef<Record<MetaField, string>>({ metaTitle: "", metaDescription: "" });
  const isCustom = (field: MetaField) =>
    current[field] !== "" && current[field] !== auto[field] && current[field] !== written.current[field];

  useEffect(() => {
    for (const field of META_FIELDS) {
      if (current[field] === auto[field] || isCustom(field)) continue;
      written.current[field] = auto[field];
      form.setValue(`localized.${locale}.${field}`, auto[field]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto.metaTitle, auto.metaDescription, current.metaTitle, current.metaDescription]);

  const restore = (field: MetaField) => {
    written.current[field] = auto[field];
    form.setValue(`localized.${locale}.${field}`, auto[field], { shouldDirty: true });
  };

  return { isCustom, restore };
}

export function VisibilitySection({
  id = "sec-visibility",
  activeLocale,
}: {
  id?: string;
  activeLocale: SupportedLocale;
}) {
  const t = useTranslations("productForm.sections.visibility");
  const form = useFormContext<AddProductFormData>();
  const { auto, current } = useSeoValues(activeLocale);
  const edited = META_FIELDS.some((field) => current[field] !== "" && current[field] !== auto[field]);

  return (
    <CollapsibleSection
      id={id}
      icon={Sparkles}
      title={t("title")}
      description={t("description")}
      summary={edited ? t("summaryEdited") : t("summaryAuto")}
      summaryTone={current.metaTitle ? "ok" : "muted"}
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
          <SeoFields locale={loc} />
        </div>
      ))}
    </CollapsibleSection>
  );
}

function SeoFields({ locale: loc }: { locale: SupportedLocale }) {
  const t = useTranslations("productForm.sections.visibility");
  const form = useFormContext<AddProductFormData>();
  const seo = useAutoSeo(loc);

  const autoNote = (field: MetaField) =>
    seo.isCustom(field) ? (
      <button
        type="button"
        onClick={() => seo.restore(field)}
        className="text-xs font-semibold text-primary-ink hover:underline"
      >
        {t("restoreAuto")}
      </button>
    ) : (
      <span className="rounded-[5px] bg-success-soft px-1.5 text-[10px] leading-[18px] font-semibold text-success">
        {t("auto")}
      </span>
    );

  return (
    <>
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
              <span className="inline-flex items-center gap-1.5">
                {t("metaTitle")}
                {autoNote("metaTitle")}
              </span>
            </FieldLabel>
            <Input
              id={`meta-title-${loc}`}
              {...field}
              value={field.value ?? ""}
              maxLength={META_TITLE.max}
              placeholder={t("metaTitlePlaceholder")}
              className={cn(FIELD_CLASS, "max-md:text-base", contentDirClass(loc))}
            />
            {/* The length meter only means something once there is text. */}
            {field.value ? <LengthMeter length={field.value.length} {...META_TITLE} /> : null}
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
              <span className="inline-flex items-center gap-1.5">
                {t("metaDescription")}
                {autoNote("metaDescription")}
              </span>
            </FieldLabel>
            <Textarea
              id={`meta-description-${loc}`}
              {...field}
              value={field.value ?? ""}
              rows={2}
              maxLength={META_DESCRIPTION.max}
              placeholder={t("metaDescriptionPlaceholder")}
              className={cn(TEXTAREA_CLASS, "min-h-[84px] max-md:text-base", contentDirClass(loc))}
            />
            {field.value ? <LengthMeter length={field.value.length} {...META_DESCRIPTION} /> : null}
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
    </>
  );
}

/** Google-style result: what the meta fields hold, which follow the name and description by default. */
function SearchPreview({ locale }: { locale: SupportedLocale }) {
  const t = useTranslations("productForm.sections.visibility");
  const form = useFormContext<AddProductFormData>();
  const [metaTitle, metaDescription, slug] = useWatch({
    control: form.control,
    name: [`localized.${locale}.metaTitle`, `localized.${locale}.metaDescription`, "localized.en.slug"],
  });
  const linkHost = useProductLinkHost();
  const heading = (metaTitle ?? "").trim();
  const body = (metaDescription ?? "").trim();

  return (
    <div className="rounded-xl border bg-muted p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div dir="ltr" className="truncate font-sans text-xs text-muted-foreground rtl:text-right">
        {linkHost} › products › {slug || "product"}
      </div>
      <div className="my-0.5 truncate text-[17px] leading-normal text-[#1a0dab] dark:text-[#8ab4f8]">
        {heading || t("serpTitle")}
      </div>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {body || t("serpDescription")}
      </p>
    </div>
  );
}
