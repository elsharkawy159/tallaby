"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, CircleDashed, LoaderCircle, Sparkles, Wand2, X } from "lucide-react";
import {
  SEO_KEYWORDS_MAX,
  SEO_KEYWORD_MAX_LENGTH,
  normalizeSeoKeywords,
  seoLengthStatus,
  seoScore,
  type SeoCheck,
  type SeoLengthStatus,
} from "@workspace/lib/stores";
import { SellerButton, StatusBadge } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { AI_SEO_CREDITS, type AiSeoErrorCode } from "./ai/ai-seo.dto";

/**
 * Small building blocks of Website › SEO (2026-11-09), shared by the store
 * form and the page sheet: keyword chips, length meter, "using default" hint,
 * Google preview, checklist and the AI button.
 */

/** A chip list: Enter or a comma adds, × or Backspace on an empty box removes. Cleaned like the server. */
export function KeywordsInput({
  id,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const t = useTranslations("domainSeo.fields");
  const [draft, setDraft] = useState("");
  const full = value.length >= SEO_KEYWORDS_MAX;

  const add = (text: string) => {
    const next = normalizeSeoKeywords([...value, text])
      .filter((k) => k.length <= SEO_KEYWORD_MAX_LENGTH)
      .slice(0, SEO_KEYWORDS_MAX);
    onChange(next);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-[14px] border border-(--s-field) bg-(--s-surface) px-2.5 py-2 focus-within:border-(--tallaby-teal-300)",
        disabled && "opacity-60",
      )}
    >
      {value.map((keyword) => (
        <span key={keyword} className="inline-flex max-w-full items-center gap-1 rounded-full bg-(--s-tint) py-1 pe-1 ps-2.5 text-[12.5px] font-semibold text-(--s-text)">
          <bdi className="min-w-0 truncate">{keyword}</bdi>
          <button
            type="button"
            disabled={disabled}
            aria-label={t("removeKeyword", { keyword })}
            className="grid size-6 place-items-center rounded-full text-(--s-subtle) hover:bg-(--s-surface) hover:text-(--s-ink) max-[600px]:size-7"
            onClick={() => onChange(value.filter((k) => k !== keyword))}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        dir="auto"
        value={draft}
        disabled={disabled || full}
        maxLength={SEO_KEYWORD_MAX_LENGTH}
        placeholder={full ? t("keywordsFull", { max: SEO_KEYWORDS_MAX }) : value.length ? t("addKeyword") : placeholder}
        className="h-8 min-w-[140px] flex-1 bg-transparent text-sm text-(--s-text) outline-none placeholder:text-(--s-faint)"
        onChange={(e) => {
          const text = e.target.value;
          if (/[,،;؛]/.test(text)) add(text);
          else setDraft(text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft.trim()) add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
      />
    </div>
  );
}

const STATUS_CLASS: Record<SeoLengthStatus, string> = {
  empty: "text-(--s-faint)",
  short: "text-accent-ink",
  good: "text-success",
  long: "text-destructive",
};

/** "42 / 30–60 · Good length", coloured by how the length compares with the recommended range. */
export function LengthMeter({ text, range }: { text: string; range: { min: number; max: number } }) {
  const t = useTranslations("domainSeo.fields.length");
  const status = seoLengthStatus(text, range);
  return (
    <span className={cn("inline-flex items-center gap-1.5", STATUS_CLASS[status])}>
      <bdi dir="ltr" className="font-montserrat tabular-nums">
        {text.trim().length} / {range.min}–{range.max}
      </bdi>
      {status !== "empty" && <span>· {t(status)}</span>}
    </span>
  );
}

/** Under an empty field: the value the storefront uses instead, with a one-click fill. */
export function DefaultHint({ value, onUse, disabled }: { value: string; onUse?: () => void; disabled?: boolean }) {
  const t = useTranslations("domainSeo.fields");
  if (!value) return null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="min-w-0 text-pretty">
        {t("usingDefault")} <bdi className="text-(--s-muted)">{value}</bdi>
      </span>
      {onUse && (
        <button type="button" disabled={disabled} onClick={onUse} className="inline-flex items-center gap-1 font-semibold text-(--s-link) hover:underline disabled:opacity-50">
          <Wand2 className="size-3.5" aria-hidden />
          {t("useSuggestion")}
        </button>
      )}
    </span>
  );
}

/** How the page looks as a Google result. */
export function SearchPreview({ url, title, description }: { url: string; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[18px] border border-(--s-line) bg-(--s-surface) px-[18px] py-4">
      <p dir="ltr" className="truncate text-start text-[11.5px] text-(--s-subtle) rtl:text-end">
        {url}
      </p>
      <p dir="auto" className="mt-1.5 line-clamp-2 text-lg font-normal leading-snug text-(--s-info)">
        {title}
      </p>
      <p dir="auto" className="line-clamp-2 text-[13px] leading-[1.6] text-(--s-muted)">
        {description}
      </p>
    </div>
  );
}

/** The score and what is left to do, one line each. */
export function SeoChecklist({ checks }: { checks: SeoCheck[] }) {
  const t = useTranslations("domainSeo.checks");
  const score = seoScore(checks);
  return (
    <div className="flex flex-col gap-2.5 rounded-[18px] border border-(--s-line) bg-(--s-tint) px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <b className="text-sm font-bold text-(--s-text)">{t("heading")}</b>
        <StatusBadge tone={score >= 80 ? "success" : score >= 50 ? "warning" : "danger"}>
          <bdi dir="ltr" className="font-montserrat tabular-nums">
            {score}%
          </bdi>
        </StatusBadge>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-[600px]:grid-cols-1">
        {checks.map((check) => (
          <li key={check.key} className={cn("flex items-start gap-2 text-[12.5px]", check.ok ? "text-(--s-muted)" : "text-(--s-text)")}>
            {check.ok ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
            ) : (
              <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-accent-ink" aria-hidden />
            )}
            <span>
              <span className="sr-only">{check.ok ? t("done") : t("todo")}: </span>
              {t(`${check.key}.${check.ok ? "ok" : "todo"}`)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Write with AI · 1 credit". */
export function AiWriteButton({ onClick, pending, disabled }: { onClick: () => void; pending: boolean; disabled?: boolean }) {
  const t = useTranslations("domainSeo.ai");
  return (
    <SellerButton variant="mini" size="xs" disabled={disabled || pending} onClick={onClick} title={t("hint")}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles className="!text-(--s-primary)" aria-hidden />}
      {pending ? t("writing") : t("button")}
      <span className="rounded-full bg-(--s-tint) px-1.5 text-[11px] font-semibold text-(--s-muted)">{t("cost", { count: AI_SEO_CREDITS })}</span>
    </SellerButton>
  );
}

/** Error code of the AI action → its message key under `domainSeo.ai.errors`. */
export function aiSeoErrorKey(error: AiSeoErrorCode): `errors.${AiSeoErrorCode}` {
  return `errors.${error}`;
}
