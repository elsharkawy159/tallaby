"use client";

import { Num } from "@/components/marketing/site/layout-primitives";
import { useVisitorPrices } from "./visitor-prices.client";

/** One card's price in one currency, formatted on the server. */
export type CardPrice = { amount: string; label: string };

/**
 * The price block of one card, in the visitor's currency as the main price
 * (owner, 2026-11-09): "≈ 1.62 جنيه لكل طلب" on the server render and for
 * Egypt, "≈ 0.11 ريال لكل طلب" once a Saudi visitor is known. Never "$".
 */
export function PlanPrice({ prices, per, note }: { prices: Record<string, CardPrice>; per: string; note: string }) {
  const currency = useVisitorPrices()?.currency ?? "EGP";
  const price = prices[currency] ?? prices.EGP!;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[26px] leading-none font-bold text-teal-900 min-[641px]:text-[30px]">≈</span>
        <Num dir="ltr" className="text-[44px] leading-none font-extrabold text-teal-900 min-[641px]:text-[54px]">
          {price.amount}
        </Num>
        <span className="text-[22px] leading-none font-bold text-teal-900 min-[641px]:text-[26px]">{price.label}</span>
        <span className="text-[15px] font-semibold text-ink-500">{per}</span>
      </div>
      <p className="m-0 text-[13px] text-ink-500">{note}</p>
    </div>
  );
}
