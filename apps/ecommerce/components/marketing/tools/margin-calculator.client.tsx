"use client";

import * as React from "react";
import { Calculator, CircleAlert, CircleCheck, Info, RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Chip } from "@/components/marketing/site/chips";
import { Num } from "@/components/marketing/site/layout-primitives";
import {
  calculateMargin,
  DEFAULT_MARGIN_INPUT,
  marginSegments,
  parseAmount,
  type MarginInput,
  type MarginPlan,
  type MarginSegment,
} from "@/lib/marketing/margin-calculator.lib";
import { cn } from "@workspace/ui/lib/utils";

const STORAGE_KEY = "tb_tool_margin";

type FieldId = "buy" | "ship" | "ad" | "egpPerUsd" | "sell";
type Draft = Record<FieldId, string> & { plan: MarginPlan };

const SEGMENT_COLORS: Record<MarginSegment["id"], string> = {
  buy: "#145163",
  ship: "#3f8fa3",
  ad: "#9cc5cf",
  fee: "#fdad28",
  profit: "#16a34a",
};

const defaultDraft = (): Draft => ({
  buy: String(DEFAULT_MARGIN_INPUT.buy),
  ship: String(DEFAULT_MARGIN_INPUT.ship),
  ad: String(DEFAULT_MARGIN_INPUT.ad),
  egpPerUsd: String(DEFAULT_MARGIN_INPUT.egpPerUsd),
  sell: String(DEFAULT_MARGIN_INPUT.sell),
  plan: DEFAULT_MARGIN_INPUT.plan,
});

const toInput = (draft: Draft): MarginInput => ({
  buy: parseAmount(draft.buy),
  ship: parseAmount(draft.ship),
  ad: parseAmount(draft.ad),
  egpPerUsd: parseAmount(draft.egpPerUsd),
  sell: parseAmount(draft.sell),
  plan: draft.plan,
});

function format(value: number, digits?: number): string {
  const d = digits ?? (Number.isInteger(value) ? 0 : 2);
  const text = Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return value < 0 ? `−${text}` : text;
}

function AmountField({
  id,
  label,
  hint,
  unit,
  value,
  large,
  wide,
  onChange,
}: {
  id: FieldId;
  label: string;
  hint: string;
  unit: string;
  value: string;
  large?: boolean;
  wide?: boolean;
  onChange: (id: FieldId, value: string) => void;
}) {
  const inputId = `margin-${id}`;
  return (
    <div className={cn("grid content-start gap-1.5", wide && "sm:col-span-2")}>
      <label htmlFor={inputId} className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-semibold text-ink-700">
        {label}
        <small className="text-xs font-medium text-ink-400">{hint}</small>
      </label>
      <div
        className={cn(
          "flex h-[52px] items-center gap-2.5 rounded-2xl border-[1.5px] border-line-strong bg-white px-4 transition-[border-color,box-shadow] duration-150 focus-within:border-teal-700 focus-within:shadow-[var(--ring-focus)] sm:h-14",
          large && "border-teal-300 bg-[#f8fbfb]",
        )}
      >
        <input
          id={inputId}
          dir="ltr"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          onFocus={(e) => e.target.select()}
          className={cn(
            "w-full min-w-0 flex-1 bg-transparent font-latin font-bold text-teal-900 outline-none ltr:text-left rtl:text-right",
            large ? "text-2xl" : "text-xl",
          )}
        />
        <span className="text-sm font-semibold whitespace-nowrap text-ink-400">{unit}</span>
      </div>
    </div>
  );
}

/** The live calculator. Figures stay in this browser: saved locally, never sent anywhere. */
export function MarginCalculator() {
  const t = useTranslations("toolPages.profit-margin-calculator.calculator");
  const [draft, setDraft] = React.useState<Draft>(defaultDraft);
  const loaded = React.useRef(false);

  // After hydration, so the server and first client render agree.
  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Draft> | null;
      if (saved) setDraft((current) => ({ ...current, ...saved, plan: saved.plan === "pro" ? "pro" : "free" }));
    } catch {
      // No saved figures; the defaults stay.
    }
    loaded.current = true;
  }, []);

  React.useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage is optional here.
    }
  }, [draft]);

  const setField = (id: FieldId, value: string) => setDraft((current) => ({ ...current, [id]: value }));
  const input = toInput(draft);
  const result = calculateMargin(input);
  const segments = marginSegments(input, result);
  const unit = t("currency");
  const positive = result.profit > 0;
  const negative = result.profit < 0;

  const message = {
    "needs-price": { tone: "bg-amber-50 text-[#7a4a00]", Icon: Info, text: t("messages.needsPrice") },
    loss: {
      tone: "bg-[#fdecec] text-[#991b1b]",
      Icon: TriangleAlert,
      text: t("messages.loss", { loss: format(-result.profit), price: format(result.breakEvenPrice) }),
    },
    low: {
      tone: "bg-amber-50 text-[#7a4a00]",
      Icon: CircleAlert,
      text: t("messages.low", { price: format(result.suggestedPrice ?? 0) }),
    },
    good: {
      tone: "bg-[#e9f7ee] text-[#166534]",
      Icon: CircleCheck,
      text: t("messages.good", { profit: format(result.profit), margin: format(result.marginPct ?? 0, 1) }),
    },
  }[result.status];

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label={t("title")}
      className="grid overflow-hidden rounded-3xl border border-line bg-white shadow-stage sm:rounded-[32px] min-[961px]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
    >
      <div className="grid content-start gap-4 p-[18px] py-[22px] sm:px-8 sm:py-[30px]">
        <div className="flex items-center justify-between gap-2.5">
          <b className="flex items-center gap-2 text-[17px] text-teal-900">
            <Calculator className="size-5 text-amber-700" aria-hidden />
            {t("title")}
          </b>
          <button
            type="button"
            onClick={() => setDraft(defaultDraft())}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13.5px] font-semibold text-ink-500 transition-colors hover:bg-neutral-50 hover:text-teal-900"
          >
            <RotateCcw className="size-[15px]" aria-hidden />
            {t("reset")}
          </button>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <AmountField id="buy" label={t("fields.buy")} hint={t("fields.buyHint")} unit={unit} value={draft.buy} onChange={setField} />
          <AmountField id="ship" label={t("fields.ship")} hint={t("fields.shipHint")} unit={unit} value={draft.ship} onChange={setField} />
          <AmountField id="ad" label={t("fields.ad")} hint={t("fields.adHint")} unit={unit} value={draft.ad} onChange={setField} wide />

          <div role="group" aria-label={t("fields.plan")} className="grid gap-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-ink-700">{t("fields.plan")}</span>
            <div className="flex flex-wrap gap-2">
              <Chip selected={draft.plan === "free"} onClick={() => setDraft((current) => ({ ...current, plan: "free" }))}>
                {t("fields.planFree")}
              </Chip>
              <Chip selected={draft.plan === "pro"} onClick={() => setDraft((current) => ({ ...current, plan: "pro" }))}>
                {t("fields.planPro")}
              </Chip>
            </div>
            <p className="text-[12.5px] text-ink-400">{draft.plan === "pro" ? t("fields.planProNote") : t("fields.planFreeNote")}</p>
          </div>

          {draft.plan === "free" ? (
            <AmountField id="egpPerUsd" label={t("fields.rate")} hint={t("fields.rateHint")} unit={unit} value={draft.egpPerUsd} onChange={setField} wide />
          ) : null}

          <AmountField id="sell" label={t("fields.sell")} hint={t("fields.sellHint")} unit={unit} value={draft.sell} onChange={setField} large wide />
        </div>
        <p className="text-[12.5px] text-ink-400">{t("note")}</p>
      </div>

      <div
        aria-live="polite"
        className="flex flex-col gap-[18px] border-t border-line bg-gradient-to-b from-[#f1f7f8] to-[#f8fbfb] p-[18px] py-[22px] sm:px-8 sm:py-[30px] min-[961px]:border-s min-[961px]:border-t-0"
      >
        <div>
          <span className="text-sm font-semibold text-[#56696e]">{t("results.profit")}</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
            <b
              dir="ltr"
              className={cn(
                "font-latin text-[clamp(44px,5.4vw,64px)] leading-none font-extrabold tracking-[-0.02em] tabular-nums transition-colors",
                positive ? "text-[#15803d]" : negative ? "text-[#dc2626]" : "text-teal-900",
              )}
            >
              {format(result.profit)}
            </b>
            <span className="text-lg font-bold text-[#56696e]">{unit}</span>
          </div>
          <p className="mt-2 text-[13px] text-ink-500">
            {t("results.feeLine")} <Num>{format(result.fee)}</Num> {unit}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-line bg-white p-4">
            <span className="text-sm font-semibold text-[#56696e]">{t("results.margin")}</span>
            <b
              dir="ltr"
              className={cn(
                "mt-1.5 block font-latin text-[26px] leading-[1.1] font-extrabold tabular-nums sm:text-3xl rtl:text-right",
                (result.marginPct ?? 0) > 0 ? "text-[#15803d]" : (result.marginPct ?? 0) < 0 ? "text-[#dc2626]" : "text-teal-900",
              )}
            >
              {result.marginPct === null ? "—" : `${format(result.marginPct, 1)}%`}
            </b>
            <small className="mt-1 block text-[12.5px] text-ink-400">{t("results.marginHint")}</small>
          </div>
          <div className="rounded-[18px] border border-line bg-white p-4">
            <span className="text-sm font-semibold text-[#56696e]">{t("results.suggested")}</span>
            <b dir="ltr" className="mt-1.5 block font-latin text-[26px] leading-[1.1] font-extrabold text-teal-700 tabular-nums sm:text-3xl rtl:text-right">
              {result.suggestedPrice === null ? "—" : format(result.suggestedPrice)}
            </b>
            <small className="mt-1 block text-[12.5px] text-ink-400">{t("results.suggestedHint")}</small>
          </div>
        </div>

        <div>
          <div className="flex h-3.5 overflow-hidden rounded-full bg-[#e7eeef]" aria-hidden>
            {segments.map((segment) => (
              <i
                key={segment.id}
                className="block h-full transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${segment.pct}%`, backgroundColor: SEGMENT_COLORS[segment.id] }}
              />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12.5px] text-ink-500">
            {segments.map((segment) => (
              <span key={segment.id} className="flex items-center gap-1.5">
                <i className="block size-2.5 rounded-[3px]" style={{ backgroundColor: SEGMENT_COLORS[segment.id] }} aria-hidden />
                {t(`segments.${segment.id}`)}
              </span>
            ))}
          </div>
        </div>

        <div className={cn("flex items-start gap-2.5 rounded-[14px] px-3.5 py-3 text-sm leading-[1.7]", message.tone)}>
          <message.Icon className="mt-[3px] size-[18px] flex-none" aria-hidden />
          <span>{message.text}</span>
        </div>
      </div>
    </form>
  );
}
