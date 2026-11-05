"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Slider } from "@workspace/ui/components/slider";
import { cn } from "@workspace/ui/lib/utils";
import { APPROX_EGP_PER_USD, PLAN_PRICES, estimatePlans, formatNumber, formatUsd, proBreakEvenOrders } from "@/lib/marketing/pricing.lib";

const lightSlider =
  "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-neutral-200 [&_[data-slot=slider-range]]:bg-teal-700 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-teal-700";

/** "What would a month cost you?": orders and campaign emails, on both plans. */
export function FeeEstimator() {
  const t = useTranslations("pricing.estimate");
  const [orders, setOrders] = React.useState(300);
  const [emails, setEmails] = React.useState(500);
  const estimate = estimatePlans({ orders, emails });

  const egp = (cents: number) => formatNumber((cents / 100) * APPROX_EGP_PER_USD);
  const plans = [
    { id: "free" as const, name: t("free"), cents: estimate.freeCents },
    { id: "pro" as const, name: "Pro", cents: estimate.proCents },
  ];

  return (
    <div className="grid overflow-hidden rounded-card border border-line bg-white shadow-soft min-[861px]:grid-cols-2 min-[641px]:rounded-card-lg">
      <div className="grid content-start gap-7 p-6 min-[641px]:p-9">
        <RangeField label={t("orders")} value={formatNumber(orders)}>
          <Slider dir="ltr" min={10} max={3000} step={10} value={[orders]} onValueChange={([v]) => setOrders(v ?? 10)} aria-label={t("orders")} className={lightSlider} />
        </RangeField>
        <RangeField label={t("emails")} value={formatNumber(emails)}>
          <Slider dir="ltr" min={0} max={20_000} step={100} value={[emails]} onValueChange={([v]) => setEmails(v ?? 0)} aria-label={t("emails")} className={lightSlider} />
        </RangeField>
      </div>
      <div className="flex flex-col gap-3.5 bg-amber-50 p-6 min-[641px]:p-9">
        <span className="text-sm font-semibold text-[#6b5a3a]">{t("monthly")}</span>
        <div aria-live="polite" aria-atomic className="grid gap-3">
          {plans.map((plan) => {
            const best = estimate.cheaper === plan.id;
            return (
              <div key={plan.id} className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-card-sm border bg-white p-4", best ? "border-teal-700 shadow-soft" : "border-[#8a5300]/15")}>
                <span className="flex items-center gap-2">
                  <b className={cn("text-[15px] text-teal-900", plan.id === "pro" && "font-latin")}>{plan.name}</b>
                  {best ? <span className="rounded-full bg-teal-900 px-2 py-0.5 text-[11px] font-bold text-white">{t("cheaper")}</span> : null}
                </span>
                <span className="text-end">
                  <b dir="ltr" className="block font-latin text-[28px] leading-none font-extrabold text-teal-900">{formatUsd(plan.cents)}</b>
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
        <p className="text-[13px] text-pretty text-[#6b5a3a]">{t("breakEven", { orders: formatNumber(proBreakEvenOrders()), price: formatUsd(PLAN_PRICES.pro.monthlyCents) })}</p>
        <p className="mt-auto text-[13px] text-pretty text-[#6b5a3a]">{t("note")}</p>
      </div>
    </div>
  );
}

function RangeField({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3 text-sm font-semibold text-[#33454a]">
        <span>{label}</span>
        <b className="font-latin text-xl font-extrabold text-teal-900">{value}</b>
      </div>
      {children}
    </div>
  );
}
