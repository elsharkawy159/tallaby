"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

/**
 * Optional screenshot of the transfer (ROADMAP.md F-21p). Controlled: the
 * parent sends the chosen file with "I've sent the payment".
 */
export function PaymentProofPicker({
  file,
  onChange,
  disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("checkout.transfer.proof");
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-900">
        {t("title")} <span className="text-xs font-normal text-gray-500">{t("optional")}</span>
      </p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {file && preview ? (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={preview} alt={t("previewAlt")} className="size-16 shrink-0 rounded-lg border object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => input.current?.click()}
              disabled={disabled}
            >
              {t("change")}
            </button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)} disabled={disabled} aria-label={t("remove")}>
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3.5 text-start transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm">
            <ImagePlus className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-gray-900">{t("add")}</span>
            <span className="block text-xs text-gray-500">{t("hint")}</span>
          </span>
        </button>
      )}
    </div>
  );
}
