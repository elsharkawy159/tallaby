"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Slider } from "@workspace/ui/components/slider";
import { cn } from "@workspace/ui/lib/utils";
import { PLAN_PRICES, estimatePlans, formatEgp, formatNumber, formatUsd, proBreakEvenOrders, usdCentsToEgp } from "@/lib/marketing/pricing.lib";

const MIN_ORDERS = 10;
const MAX_ORDERS = 3000;
const PRESETS = [100, 500, 1000, 2000] as const;

const lightSlider =
  "[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-neutral-200 [&_[data-slot=slider-range]]:bg-teal-700 [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-teal-700";

/**
 * "What would a month cost you?": orders a month only (owner, 2026-11-06),
 * with Free and Pro side by side on wide screens and stacked on phones. The
 * EGP figures use the dashboard wallet's rate and rounding, passed from the server.
 */
export function FeeEstimator({ rate }: { rate: number }) {
  const t = useTranslations("pricing.estimate");
  const [orders, setOrders] = React.useState(300);
  const estimate = estimatePlans({ orders });

  const egp = (cents: number) => formatEgp(usdCentsToEgp(cents, rate));
  const plans = [
    { id: "free" as const, name: t("free"), cents: estimate.freeCents, detail: t("perOrder", { fee: formatUsd(PLAN_PRICES.free.orderFeeCents) }) },
    { id: "pro" as const, name: "Pro", cents: estimate.proCents, detail: t("perMonth", { price: formatUsd(PLAN_PRICES.pro.monthlyCents) }) },
  ];

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft min-[641px]:rounded-card-lg">
      <div className="grid min-[861px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 p-6 min-[641px]:p-9">
          <div className="flex items-end justify-between gap-3">
            <span className="text-[15px] font-semibold text-[#33454a]">
              {t("orders")}
            </span>
            <b className="font-latin text-[40px] leading-none font-extrabold text-teal-900 tabular-nums min-[641px]:text-[48px]">{formatNumber(orders)}</b>
          </div>
          <div>
            <Slider
              dir="ltr"
              min={MIN_ORDERS}
              max={MAX_ORDERS}
              step={10}
              value={[orders]}
              onValueChange={([v]) => setOrders(v ?? MIN_ORDERS)}
              aria-label={t("orders")}
              className={cn("py-2", lightSlider)}
            />
            <div dir="ltr" className="mt-2 flex justify-between font-latin text-xs text-ink-400">
              <span>{formatNumber(MIN_ORDERS)}</span>
              <span className="sr-only">{t("range", { min: formatNumber(MIN_ORDERS), max: formatNumber(MAX_ORDERS) })}</span>
              <span>{formatNumber(MAX_ORDERS)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={orders === preset}
                onClick={() => setOrders(preset)}
                className={cn(
                  "h-10 min-w-[64px] rounded-full border px-4 font-latin text-sm font-semibold transition-colors duration-150 focus-visible:shadow-[var(--ring-focus)] focus-visible:outline-none",
                  orders === preset ? "border-teal-900 bg-teal-900 text-white" : "border-line-strong bg-white text-[#33454a] hover:border-teal-700",
                )}
              >
                {formatNumber(preset)}
              </button>
            ))}
          </div>
          <p className="mt-auto flex items-start gap-2 rounded-card-sm bg-teal-50/70 p-3.5 text-[13.5px] text-pretty text-[#33464b]">
            <Info className="mt-0.5 size-4 flex-none text-teal-700" aria-hidden />
            {t("breakEven", { orders: formatNumber(proBreakEvenOrders()), price: formatUsd(PLAN_PRICES.pro.monthlyCents) })}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-line bg-amber-50 p-6 min-[641px]:p-9 min-[861px]:border-s min-[861px]:border-t-0">
          <span className="text-sm font-semibold text-[#6b5a3a]">{t("monthly")}</span>
          <div aria-live="polite" aria-atomic className="grid gap-3">
            {plans.map((plan) => {
              const best = estimate.cheaper === plan.id;
              return (
                <div key={plan.id} className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-card-sm border bg-white p-4", best ? "border-teal-700 shadow-soft" : "border-[#8a5300]/15")}>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <b className={cn("text-[15px] text-teal-900", plan.id === "pro" && "font-latin")}>{plan.name}</b>
                      {best ? <span className="rounded-full bg-teal-900 px-2 py-0.5 text-[11px] font-bold text-white">{t("cheaper")}</span> : null}
                    </span>
                    <small className="text-xs text-[#6b5a3a]">{plan.detail}</small>
                  </span>
                  <span className="text-end">
                    <b dir="ltr" className="block font-latin text-[28px] leading-none font-extrabold text-teal-900 tabular-nums">{formatUsd(plan.cents)}</b>
                    <small className="text-xs text-[#6b5a3a]">{t("approx", { egp: egp(plan.cents) })}</small>
                  </span>
                </div>
              );
            })}
            {estimate.savingCents > 0 ? (
              <p className="text-sm font-semibold text-[#5b4a2c]">
                {t(estimate.cheaper === "pro" ? "savingPro" : "savingFree", { amount: formatUsd(estimate.savingCents) })}
              </p>
            ) : null}
          </div>
          <p className="mt-auto text-[13px] text-pretty text-[#6b5a3a]">{t("note")}</p>
        </div>
      </div>
    </div>
  );
}
