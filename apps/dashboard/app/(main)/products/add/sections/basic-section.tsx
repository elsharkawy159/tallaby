"use client";

import { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Check, Info, Link2, Pencil, RotateCcw, Tag, X } from "lucide-react";
import slugify from "slugify";
import { Input } from "@workspace/ui/components/input";
import { RichTextEditor } from "@workspace/tiptap/editor";
import { plainTextToRichText } from "@workspace/tiptap/plain-text";
import { cn } from "@/lib/utils";
import { contentDirClass } from "@/lib/i18n/content-dir";
import { ImageUpload } from "@/components/inputs/image-upload";
import { useProductLinkHost } from "../product-link-host.client";
import { FIELD_CLASS, FieldError, FieldHint, FieldLabel, SectionCard } from "@/components/form/form-ui";
import { CategoryField } from "../category-field";
import { isEmptyHtml } from "../prepare-product-submit.lib";
import { useFieldError } from "./fields";
import { useContentImageUpload } from "./use-content-image-upload";
import type { AddProductFormData, CategoryOption, SupportedLocale } from "../add-product.schema";

const TITLE_MAX = 255;
export const MAX_PRODUCT_IMAGES = 8;

const toSlug = (value: string) => slugify(value, { lower: true, strict: true });

/** The automatic link: from the English name, else the Arabic name (slugify writes it in Latin letters). */
const slugFromNames = (localized: { en?: { title?: string }; ar?: { title?: string } }) =>
  toSlug(localized.en?.title?.trim() || localized.ar?.title?.trim() || "");

interface BasicSectionProps {
  id?: string;
  categories: CategoryOption[];
  activeLocale: SupportedLocale;
  /** Header action, e.g. "Import from link". */
  action?: React.ReactNode;
}

/** Name, short description, photos and category: everything a product needs to go live. */
export function BasicSection({ id = "sec-basic", categories, activeLocale, action }: BasicSectionProps) {
  const t = useTranslations("productForm.sections.basic");
  const tMedia = useTranslations("productForm.sections.media");
  const tPage = useTranslations("productForm.page");
  const form = useFormContext<AddProductFormData>();
  const enTitleError = useFieldError("localized.en.title");
  const arTitleError = useFieldError("localized.ar.title");
  const enDescriptionError = useFieldError("localized.en.description");
  const arDescriptionError = useFieldError("localized.ar.description");
  const categoryError = useFieldError("categoryId");
  const imagesError = useFieldError("images");
  const uploadContentImage = useContentImageUpload();

  // Name and short description are needed in one language only, so filling one
  // clears the other language's error too (RHF re-checks only the edited field).
  const bothLanguages = useWatch({
    control: form.control,
    name: ["localized.en.title", "localized.ar.title", "localized.en.description", "localized.ar.description"],
  });
  useEffect(() => {
    if (form.formState.submitCount === 0) return;
    void form.trigger(["localized.en.title", "localized.ar.title", "localized.en.description", "localized.ar.description"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bothLanguages.join("\u0000")]);
  // The link follows the English name until the seller sets their own. A product that
  // already has a link (edit, import) keeps it: renaming must not move a live URL.
  const [slugEdited, setSlugEdited] = useState(() => Boolean(form.getValues("localized.en.slug")?.trim()));

  return (
    <SectionCard
      id={id}
      icon={Tag}
      title={t("title")}
      description={t("description")}
      action={action}
      divided={false}
      invalid={Boolean(
        enTitleError || arTitleError || enDescriptionError || arDescriptionError || categoryError || imagesError
      )}
    >
      {(["en", "ar"] as const).map((loc) => (
        <div key={loc} className={cn("flex flex-col gap-4", activeLocale !== loc && "hidden")} lang={loc}>
          <div className="flex flex-col gap-1.5">
            <Controller
              control={form.control}
              name={`localized.${loc}.title`}
              render={({ field }) => {
                const error = loc === "en" ? enTitleError : arTitleError;
                return (
                  <>
                    <FieldLabel
                      htmlFor={`title-${loc}`}
                      required
                      locale={loc}
                      note={`${field.value?.length ?? 0}/${TITLE_MAX}`}
                    >
                      {t("name")}
                    </FieldLabel>
                    <Input
                      id={`title-${loc}`}
                      {...field}
                      value={field.value ?? ""}
                      maxLength={TITLE_MAX}
                      aria-invalid={Boolean(error)}
                      placeholder={loc === "en" ? t("namePlaceholderEn") : t("namePlaceholderAr")}
                      className={cn(FIELD_CLASS, "max-md:text-base", contentDirClass(loc))}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        // One slug per product (the server saves it for both languages), from
                        // the English name, else the Arabic one in Latin letters.
                        if (!slugEdited) {
                          form.setValue("localized.en.slug", slugFromNames(form.getValues("localized")), {
                            shouldValidate: form.formState.submitCount > 0,
                          });
                        }
                      }}
                    />
                    <FieldError>{error}</FieldError>
                  </>
                );
              }}
            />
            <SlugLine
              followsName={!slugEdited}
              onEdited={() => setSlugEdited(true)}
              onFollowName={() => {
                setSlugEdited(false);
                form.setValue("localized.en.slug", slugFromNames(form.getValues("localized")), {
                  shouldDirty: true,
                  shouldValidate: form.formState.submitCount > 0,
                });
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel locale={loc} required>
              {t("shortDescription")}
            </FieldLabel>
            <Controller
              control={form.control}
              name={`localized.${loc}.description`}
              render={({ field }) => (
                <RichTextEditor
                  // Older products hold plain text: show it as paragraphs.
                  value={plainTextToRichText(field.value)}
                  // An emptied editor leaves "<p></p>"; store "" so it doesn't
                  // count as Arabic content needing an Arabic title.
                  onChange={(html: string) => field.onChange(isEmptyHtml(html) ? "" : html)}
                  placeholder={t("shortDescriptionPlaceholder")}
                  dir={loc === "ar" ? "rtl" : "ltr"}
                  onImageUpload={uploadContentImage}
                />
              )}
            />
            {(loc === "en" ? enDescriptionError : arDescriptionError) ? (
              <FieldError>{loc === "en" ? enDescriptionError : arDescriptionError}</FieldError>
            ) : (
              <FieldHint className="text-faint">{t("shortDescriptionHint")}</FieldHint>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>{t("photos")}</FieldLabel>
        <Controller
          control={form.control}
          name="images"
          render={({ field }) => (
            <ImageUpload
              bucket="products"
              value={field.value || []}
              onChange={(images) => {
                field.onChange(images);
                field.onBlur();
              }}
              form={form}
              maxImages={MAX_PRODUCT_IMAGES}
              footer={
                <span className="inline-flex items-center gap-1.5">
                  <Info className="size-3.5 shrink-0" aria-hidden />
                  {tMedia("hint")}
                </span>
              }
            />
          )}
        />
        <FieldError>{imagesError}</FieldError>
      </div>

      <CategoryField categories={categories} />
    </SectionCard>
  );
}

/** Lowercase letters, digits and single dashes while typing; a trailing dash is kept until save. */
const typingSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-/, "");

/**
 * The product's link. Product URLs use the English slug, so that's the one
 * shown and edited regardless of the content language. The host stays fixed;
 * only the slug is editable.
 */
function SlugLine({
  followsName,
  onEdited,
  onFollowName,
}: {
  /** The slug still comes from the English name. */
  followsName: boolean;
  onEdited: () => void;
  onFollowName: () => void;
}) {
  const t = useTranslations("productForm.sections.basic");
  const form = useFormContext<AddProductFormData>();
  const [slug, enTitle, arTitle] = useWatch({
    control: form.control,
    name: ["localized.en.slug", "localized.en.title", "localized.ar.title"],
  });
  const linkHost = useProductLinkHost();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const prefix = `${linkHost}/products/`;

  const fromNames = slugFromNames({ en: { title: enTitle }, ar: { title: arTitle } });

  // Nothing to show until the product has a name (or already has a link).
  if (!editing && !slug?.trim() && !enTitle?.trim() && !arTitle?.trim()) return null;

  const start = () => {
    setDraft(slug ?? "");
    setEditing(true);
  };

  const save = () => {
    const next = toSlug(draft);
    if (next && next !== slug) {
      form.setValue("localized.en.slug", next, { shouldDirty: true, shouldValidate: true });
      onEdited();
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5" dir="ltr">
          <div className="flex h-10 min-w-0 flex-1 items-stretch overflow-hidden rounded-[10px] border border-primary bg-card ring-[3px] ring-primary/20">
            <span
              className="flex max-w-[55%] shrink items-center truncate bg-muted ps-3 pe-1 font-sans text-[13px] text-muted-foreground select-none sm:max-w-[60%]"
              title={prefix}
            >
              {prefix}
            </span>
            <input
              autoFocus
              aria-label={t("slugLabel")}
              value={draft}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              placeholder="product-name"
              onChange={(e) => setDraft(typingSlug(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              className="h-full min-w-0 flex-1 bg-transparent ps-1 pe-3 font-sans text-[13px] font-medium text-foreground outline-none placeholder:text-faint max-md:text-base"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={!toSlug(draft)}
            aria-label={t("doneSlug")}
            title={t("doneSlug")}
            className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Check className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label={t("cancelSlug")}
            title={t("cancelSlug")}
            className="grid size-10 shrink-0 place-items-center rounded-[10px] border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <span className="text-xs text-faint">{t("slugRule")}</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      <Link2 className="size-3.5 shrink-0 text-faint" aria-hidden />
      <span dir="ltr" className="min-w-0 truncate font-sans" title={`${prefix}${slug ?? ""}`}>
        <span className="text-faint">{prefix}</span>
        <span className={cn("font-medium", slug ? "text-foreground" : "text-faint")}>{slug || "…"}</span>
      </span>
      <button
        type="button"
        onClick={start}
        className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-primary-ink hover:bg-primary-soft"
      >
        <Pencil className="size-3" aria-hidden />
        {t("editSlug")}
      </button>
      {!followsName && fromNames && fromNames !== slug && (
        <button
          type="button"
          onClick={onFollowName}
          title={t("slugFromNameHint")}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="size-3" aria-hidden />
          {t("slugFromName")}
        </button>
      )}
    </div>
  );
}
