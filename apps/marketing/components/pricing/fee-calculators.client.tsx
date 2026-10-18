"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Slider } from "@workspace/ui/components/slider";
import { cn } from "@workspace/ui/lib/utils";
import { FLAT_FEE_EGP, feeShareOfOrder, formatNumber, monthlyEstimate } from "@/lib/pricing.lib";

/** Slider skins: the shadcn Slider exposes its parts through data-slot. */
const darkSlider =
  "[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:bg-white/15 [&_[data-slot=slider-range]]:bg-amber-600 [&_[data-slot=slider-thumb]]:size-7 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-[0_0_0_6px_rgba(253,173,40,0.3)] [&_[data-slot=slider-thumb]]:cursor-grab";
const lightSlider =
  "[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-neutral-200 [&_[data-slot=slider-range]]:bg-teal-700 [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-teal-700";

/** Hero dial: the fee stays 5 EGP whatever the order value. */
export function FeeDial() {
  const t = useTranslations("pricing.hero");
  const tc = useTranslations("common");
  const [value, setValue] = React.useState(400);

  return (
    <div aria-live="polite" className="rounded-[28px] border border-white/10 bg-white/5 p-6 sm:p-9">
      <div className="text-[clamp(96px,13vw,168px)] leading-[0.9] font-extrabold tracking-[-0.05em] text-amber-600">
        <span className="font-latin">{FLAT_FEE_EGP}</span>
        <small className="ms-2.5 text-[0.3em] tracking-normal">{tc("egp")}</small>
      </div>
      <div className="mt-2.5 min-h-[30px] text-lg font-bold">{t("onOrder", { value: formatNumber(value) })}</div>
      <div className="min-h-6 text-sm text-haze">{t("share", { pct: feeShareOfOrder(value) })}</div>
      <div className="mt-[30px]">
        <Slider
          dir="ltr"
          aria-label={t("orderValue")}
          min={50}
          max={10_000}
          step={50}
          value={[value]}
          onValueChange={([v]) => setValue(v ?? 50)}
          className={darkSlider}
        />
        <div dir="ltr" className="mt-2.5 flex justify-between font-latin text-xs font-semibold text-haze">
          <span>50</span>
          <span>2,500</span>
          <span>5,000</span>
          <span>10,000</span>
        </div>
      </div>
    </div>
  );
}

/** "What would a month cost you?" estimator. */
export function FeeEstimator() {
  const t = useTranslations("pricing.estimate");
  const tc = useTranslations("common");
  const [orders, setOrders] = React.useState(120);
  const [aov, setAov] = React.useState(450);
  const est = monthlyEstimate(orders, aov);
  const egp = (n: number) => `${formatNumber(n)} ${tc("egp")}`;

  const bars = Array.from({ length: 30 }, (_, i) =>
    Math.round((30 + 70 * Math.min(1, orders / 1000 + 0.25)) * (0.55 + 0.45 * Math.sin(i * 0.7 + 1) ** 2)),
  );

  return (
    <div className="grid overflow-hidden rounded-3xl border border-neutral-200 bg-white lg:grid-cols-2">
      <div className="grid gap-7 p-6 sm:p-9">
        <RangeField label={t("orders")} value={formatNumber(orders)}>
          <Slider dir="ltr" min={10} max={1000} step={10} value={[orders]} onValueChange={([v]) => setOrders(v ?? 10)} aria-label={t("orders")} className={lightSlider} />
        </RangeField>
        <RangeField label={t("aov")} value={egp(aov)}>
          <Slider dir="ltr" min={100} max={5000} step={50} value={[aov]} onValueChange={([v]) => setAov(v ?? 100)} aria-label={t("aov")} className={lightSlider} />
        </RangeField>
        <div aria-hidden dir="ltr" className="flex h-24 items-end gap-1 border-b border-neutral-200 pt-3">
          {bars.map((h, i) => (
            <i key={i} className="block flex-1 rounded-t bg-teal-100 transition-[height] duration-200" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div aria-live="polite" className="flex flex-col gap-[18px] bg-amber-50 p-6 sm:p-9">
        <span className="text-sm font-semibold text-[#6b5a3a]">{t("monthlyFee")}</span>
        <div className="font-latin text-[clamp(44px,5vw,60px)] leading-none font-extrabold tracking-[-0.03em] text-teal-900">
          {formatNumber(est.fee)}
          <small className="ms-1.5 text-lg font-semibold tracking-normal">{tc("egp")}</small>
        </div>
        <div>
          {[
            [t("perOrder"), egp(est.perOrder)],
            [t("sales"), egp(est.sales)],
            [t("keep"), egp(est.keep)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-t border-[#8a5300]/15 py-3 text-sm text-[#5b4a2c]">
              <span>{label}</span>
              <b className="font-latin text-teal-900">{value}</b>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-[#6b5a3a]">{t("note")}</p>
      </div>
    </div>
  );
}

function RangeField({ label, value, children, className }: { label: string; value: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(className)}>
      <div className="mb-2.5 flex items-baseline justify-between gap-3 text-sm font-semibold whitespace-nowrap text-[#33454a]">
        <span>{label}</span>
        <b className="font-latin text-xl font-extrabold text-teal-900">{value}</b>
      </div>
      {children}
    </div>
  );
}
