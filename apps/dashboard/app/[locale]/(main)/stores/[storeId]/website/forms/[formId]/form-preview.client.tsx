"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, ChevronDown, Eye } from "lucide-react";
import type { FormField, FormSettings } from "@workspace/lib/store-forms";
import { cn } from "@/lib/utils";

const BOX = "block w-full truncate rounded-[10px] border border-(--s-field) bg-(--s-surface) px-3 text-start text-[12.5px] text-(--s-faint)";

/**
 * The form as a customer sees it on the store website, from the unsaved
 * edits: labels, required marks, hints, half-width pairs, the button text and
 * the thank-you message. Drawn with plain boxes (nothing can be typed in);
 * clicking a field calls `onPick` so the editor opens that field.
 */
export function FormPreview({
  fields,
  settings,
  off,
  onPick,
  className,
}: {
  fields: readonly FormField[];
  settings: FormSettings;
  off: boolean;
  onPick?: (id: string) => void;
  className?: string;
}) {
  const t = useTranslations("storeForms.editor");

  return (
    <aside aria-label={t("previewTitle")} className={cn("flex flex-col gap-3 rounded-[20px] border border-(--s-line) bg-(--s-tint) p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <small className="flex items-center gap-1.5 text-xs font-bold text-(--s-subtle)">
          <Eye className="size-3.5" aria-hidden />
          {t("previewTitle")}
        </small>
        {off && <small className="text-xs font-semibold text-(--s-subtle)">{t("previewOff")}</small>}
      </div>

      <div className={cn("flex flex-col gap-3 rounded-[16px] bg-(--s-surface) p-4 shadow-sm", off && "opacity-55")}>
        {fields.length === 0 ? (
          <p className="text-[13px] text-(--s-muted)">{t("previewEmpty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field) => (
              <button
                key={field.id}
                type="button"
                disabled={!onPick}
                onClick={() => onPick?.(field.id)}
                aria-label={t("previewPick", { field: field.label || t("untitled") })}
                className={cn(
                  "-m-1 flex min-w-0 flex-col gap-1 rounded-[12px] p-1 text-start enabled:cursor-pointer enabled:hover:bg-(--s-hover) focus-visible:outline-2 focus-visible:outline-(--s-primary)",
                  field.width === "half" ? "col-span-1" : "col-span-2",
                )}
              >
                {field.type === "checkbox" ? (
                  <span className="flex items-start gap-2 text-[12.5px] text-(--s-text)">
                    <i className="mt-0.5 size-4 shrink-0 rounded-[5px] border border-(--s-field) bg-(--s-surface)" />
                    <span className="min-w-0 break-words">
                      {field.label || t("untitled")}
                      {field.required && <span className="text-destructive"> *</span>}
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="truncate text-[12.5px] font-semibold text-(--s-text)">
                      {field.label || t("untitled")}
                      {field.required && <span className="text-destructive"> *</span>}
                    </span>
                    {field.type === "textarea" ? (
                      <span className={cn(BOX, "h-16 py-2")}>{field.placeholder}</span>
                    ) : field.type === "select" ? (
                      <span className={cn(BOX, "flex h-[38px] items-center justify-between gap-2")}>
                        <span className="truncate">{field.placeholder || field.options?.find((o) => o.trim())}</span>
                        <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                      </span>
                    ) : (
                      <span className={cn(BOX, "h-[38px] leading-[38px]")} dir={field.type === "email" || field.type === "phone" ? "ltr" : undefined}>
                        {field.placeholder}
                      </span>
                    )}
                  </>
                )}
                {field.helpText && <small className="text-[11.5px] text-(--s-subtle)">{field.helpText}</small>}
              </button>
            ))}
          </div>
        )}
        <span className="flex h-10 items-center justify-center rounded-xl bg-(--s-solid) px-3 text-[13px] font-bold text-(--s-solid-fg)">
          <span className="truncate">{settings.submitLabel.trim() || t("submitLabelPlaceholder")}</span>
        </span>
      </div>

      <div className="flex items-start gap-2 rounded-[14px] border border-(--s-line) bg-(--s-surface) p-3">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        <div className="min-w-0">
          <small className="block text-[11.5px] font-bold text-(--s-subtle)">{t("previewAfterSend")}</small>
          <p className="text-[12.5px] break-words whitespace-pre-wrap text-(--s-text)">{settings.successMessage.trim() || t("successMessagePlaceholder")}</p>
        </div>
      </div>
      {onPick && fields.length > 0 && <small className="text-[11.5px] text-(--s-subtle)">{t("previewHint")}</small>}
    </aside>
  );
}
