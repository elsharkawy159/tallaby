"use client";

import { useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AlignRight, Plus, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { RichTextEditor } from "@workspace/tiptap/editor";
import { cn } from "@/lib/utils";
import { contentDirClass } from "@/lib/i18n/content-dir";
import {
  FIELD_CLASS,
  FieldHint,
  FieldLabel,
  SMALL_BUTTON_CLASS,
} from "@/components/form/form-ui";
import { CollapsibleSection } from "./collapsible-section";
import { useContentImageUpload } from "./use-content-image-upload";
import { isEmptyHtml } from "../prepare-product-submit.lib";
import type { AddProductFormData, SupportedLocale } from "../add-product.schema";

const MAX_HIGHLIGHTS = 10;

/** Highlights and the detailed description: optional, folded until the seller opens it. */
export function ContentSection({
  id = "sec-content",
  activeLocale,
}: {
  id?: string;
  activeLocale: SupportedLocale;
}) {
  const t = useTranslations("productForm.sections.content");
  const tPage = useTranslations("productForm.page");
  const form = useFormContext<AddProductFormData>();
  const uploadContentImage = useContentImageUpload();
  const [bulletPoints, content] = useWatch({
    control: form.control,
    name: [`localized.${activeLocale}.bulletPoints`, `localized.${activeLocale}.content`],
  });
  const highlightCount = (bulletPoints ?? []).filter((item) => item.trim()).length;
  const summary = [
    highlightCount ? t("summaryHighlights", { count: highlightCount }) : "",
    !isEmptyHtml(content) ? t("summaryDetailed") : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <CollapsibleSection
      id={id}
      icon={AlignRight}
      title={t("title")}
      description={t("description")}
      summary={summary || tPage("optional")}
      summaryTone={summary ? "ok" : "muted"}
      filled={Boolean(summary)}
    >
      {(["en", "ar"] as const).map((loc) => (
        <div key={loc} className={cn("flex flex-col gap-4", activeLocale !== loc && "hidden")} lang={loc}>
          <Controller
            control={form.control}
            name={`localized.${loc}.bulletPoints`}
            render={({ field }) => (
              <HighlightsInput
                locale={loc}
                value={field.value ?? []}
                onChange={(next) =>
                  field.onChange(next.length <= 1 && next.every((item) => !item.trim()) ? [] : next)
                }
              />
            )}
          />

          <div className="flex flex-col gap-1.5">
            <FieldLabel locale={loc} note={tPage("optional")}>
              {t("body")}
            </FieldLabel>
            <Controller
              control={form.control}
              name={`localized.${loc}.content`}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  // An emptied editor leaves "<p></p>"; store "" so it doesn't
                  // count as Arabic content needing an Arabic title.
                  onChange={(html: string) => field.onChange(isEmptyHtml(html) ? "" : html)}
                  placeholder={t("bodyPlaceholder")}
                  dir={loc === "ar" ? "rtl" : "ltr"}
                  onImageUpload={uploadContentImage}
                />
              )}
            />
            <FieldHint className="text-faint">{t("bodyHint")}</FieldHint>
          </div>
        </div>
      ))}
    </CollapsibleSection>
  );
}

/** Numbered one-line highlights. Pasting a list splits it into rows. */
function HighlightsInput({
  locale,
  value,
  onChange,
}: {
  locale: SupportedLocale;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const t = useTranslations("productForm.sections.content");
  const listRef = useRef<HTMLDivElement>(null);
  // Always show at least one row to type into.
  const rows = value.length > 0 ? value : [""];
  const filledCount = rows.filter((item) => item.trim()).length;

  const focusRow = (index: number) =>
    requestAnimationFrame(() =>
      listRef.current?.querySelectorAll<HTMLInputElement>("input")[index]?.focus()
    );

  const update = (index: number, next: string) =>
    onChange(rows.map((item, i) => (i === index ? next : item)));

  const add = () => {
    if (rows.length >= MAX_HIGHLIGHTS) return;
    onChange([...rows, ""]);
    focusRow(rows.length);
  };

  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const paste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const lines = e.clipboardData
      .getData("text")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\s\-•*·\d.)]+/, "").trim())
      .filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    const next = [...rows];
    next.splice(index, 1, ...lines);
    onChange(next.filter((item) => item.trim()).slice(0, MAX_HIGHLIGHTS));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel locale={locale} note={`${filledCount}/${MAX_HIGHLIGHTS}`}>
        {t("highlights")}
      </FieldLabel>
      <div ref={listRef} className="flex flex-col gap-2">
        {rows.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-primary-soft font-sans text-xs font-bold text-primary-ink">
              {index + 1}
            </span>
            <Input
              value={item}
              dir={locale === "ar" ? "rtl" : "ltr"}
              placeholder={locale === "ar" ? t("highlightPlaceholderAr") : t("highlightPlaceholderEn")}
              onChange={(e) => update(index, e.target.value)}
              onPaste={(e) => paste(index, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              className={cn(FIELD_CLASS, "h-10 max-md:text-base", contentDirClass(locale))}
            />
            {rows.length > 1 && (
              <Button
                type="button"
                variant="soft"
                size="icon"
                className="size-9 shrink-0 rounded-[10px]"
                onClick={() => remove(index)}
                aria-label={t("removeHighlight")}
              >
                <X />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="neutral"
        className={cn(SMALL_BUTTON_CLASS, "self-start")}
        onClick={add}
        disabled={rows.length >= MAX_HIGHLIGHTS}
      >
        <Plus />
        {t("addHighlight")}
      </Button>
      <FieldHint className="text-faint">{t("pasteTip")}</FieldHint>
    </div>
  );
}
