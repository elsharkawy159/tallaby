"use client";

import * as React from "react";
import { Calculator, CircleCheck, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Num } from "@/components/marketing/site/layout-primitives";
import { calculateStoreCost, DEFAULT_STORE_COST_INPUT, parseAmount, type PlanCost, type StoreCostInput } from "@/lib/marketing/store-cost.lib";
import { cn } from "@workspace/ui/lib/utils";

const STORAGE_KEY = "tb_tool_store_cost";

const FIELDS = ["orders", "averageOrder", "cardShare", "gatewayPct", "gatewayFixed", "domainYearly"] as const;
type FieldId = (typeof FIELDS)[number];
type Draft = Record<FieldId, string>;

const UNITS: Record<FieldId, "orders" | "currency" | "percent"> = {
  orders: "orders",
  averageOrder: "currency",
  cardShare: "percent",
  gatewayPct: "percent",
  gatewayFixed: "currency",
  domainYearly: "currency",
};

const defaultDraft = (): Draft => Object.fromEntries(FIELDS.map((id) => [id, String(DEFAULT_STORE_COST_INPUT[id])])) as Draft;

const toInput = (draft: Draft, egpPerUsd: number): StoreCostInput => ({
  ...(Object.fromEntries(FIELDS.map((id) => [id, parseAmount(draft[id])])) as Record<FieldId, number>),
  egpPerUsd,
});

const format = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });

function PlanColumn({ name, cost, best, t }: { name: string; cost: PlanCost; best: boolean; t: ReturnType<typeof useTranslations> }) {
  const unit = t("currency");
  const rows: [string, number][] = [
    [t("results.platform"), cost.platform],
    [t("results.gateway"), cost.gateway],
    [t("results.domain"), cost.domain],
  ];
  return (
    <div className={cn("rounded-[18px] border bg-white p-4", best ? "border-teal-700 shadow-[0_0_0_3px_rgba(20,81,99,0.1)]" : "border-line")}>
      <div className="flex items-center justify-between gap-2">
        <b className="font-latin text-base text-teal-900">{name}</b>
        {best ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ee] px-2.5 py-0.5 text-xs font-bold text-[#166534]">
            <CircleCheck className="size-3.5" aria-hidden />
            {t("results.best")}
          </span>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-1.5 text-[13.5px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 text-ink-500">
            <dt>{label}</dt>
            <dd>
              <Num className="font-semibold text-ink-700">{format(value)}</Num> {unit}
            </dd>
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-line-soft pt-2 font-bold text-teal-900">
          <dt>{t("results.total")}</dt>
          <dd>
            <Num className="text-lg">{format(cost.total)}</Num> {unit}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 text-[12.5px] text-ink-400">
          <dt>{t("results.perOrder")}</dt>
          <dd>
            <Num>{format(cost.perOrder)}</Num> {unit}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * The live calculator. `egpPerUsd` is the live rate (the dashboard wallet's),
 * so Tallaby's fees match the rest of tallaby.com. Figures stay in this browser.
 */
export function StoreCostCalculator({ egpPerUsd }: { egpPerUsd: number }) {
  const t = useTranslations("toolPages.store-cost-calculator.calculator");
  const [draft, setDraft] = React.useState<Draft>(defaultDraft);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Draft> | null;
      if (saved) setDraft((current) => ({ ...current, ...Object.fromEntries(FIELDS.filter((id) => typeof saved[id] === "string").map((id) => [id, saved[id]!])) }));
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

  const result = calculateStoreCost(toInput(draft, egpPerUsd));
  const unitLabel = (id: FieldId) => (UNITS[id] === "currency" ? t("currency") : UNITS[id] === "percent" ? "%" : t("ordersUnit"));
  const verdict =
    result.cheaper === "same"
      ? t("verdict.same")
      : t(result.cheaper === "free" ? "verdict.free" : "verdict.pro", { saving: format(result.saving), orders: format(result.breakEvenOrders) });

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label={t("title")}
      className="grid overflow-hidden rounded-3xl border border-line bg-white shadow-stage sm:rounded-[32px] min-[961px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
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
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-2.5 text-[13.5px] font-semibold text-ink-500 transition-colors hover:bg-neutral-50 hover:text-teal-900"
          >
            <RotateCcw className="size-[15px]" aria-hidden />
            {t("reset")}
          </button>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {FIELDS.map((id) => (
            <div key={id} className="grid content-start gap-1.5">
              <label htmlFor={`store-cost-${id}`} className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-semibold text-ink-700">
                {t(`fields.${id}`)}
                <small className="text-xs font-medium text-ink-400">{t(`fields.${id}Hint`)}</small>
              </label>
              <div className="flex h-[52px] items-center gap-2.5 rounded-2xl border-[1.5px] border-line-strong bg-white px-4 transition-[border-color,box-shadow] duration-150 focus-within:border-teal-700 focus-within:shadow-[var(--ring-focus)]">
                <input
                  id={`store-cost-${id}`}
                  dir="ltr"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft[id]}
                  onChange={(e) => setDraft((current) => ({ ...current, [id]: e.target.value }))}
                  onFocus={(e) => e.target.select()}
                  className="w-full min-w-0 flex-1 bg-transparent font-latin text-xl font-bold text-teal-900 outline-none ltr:text-left rtl:text-right"
                />
                <span className="text-sm font-semibold whitespace-nowrap text-ink-400">{unitLabel(id)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-ink-400">{t("note")}</p>
      </div>

      <div aria-live="polite" className="flex flex-col gap-4 border-t border-line bg-gradient-to-b from-[#f1f7f8] to-[#f8fbfb] p-[18px] py-[22px] sm:px-8 sm:py-[30px] min-[961px]:border-s min-[961px]:border-t-0">
        <span className="text-sm font-semibold text-ink-500">{t("results.title")}</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <PlanColumn name="Free" cost={result.free} best={result.cheaper !== "pro"} t={t} />
          <PlanColumn name="Pro" cost={result.pro} best={result.cheaper === "pro"} t={t} />
        </div>
        <p className="rounded-[14px] bg-[#e9f7ee] px-3.5 py-3 text-sm leading-[1.7] text-[#166534]">{verdict}</p>
        <p className="text-[12.5px] text-ink-400">{t("results.cardOrders", { count: result.cardOrders })}</p>
      </div>
    </form>
  );
}
