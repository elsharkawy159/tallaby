"use client";

import { Num } from "@/components/marketing/site/layout-primitives";
import { formatLocalAmount } from "@/lib/marketing/local-currency.lib";
import { useVisitorPrices } from "./visitor-prices.client";

/**
 * The price block of one card, in the visitor's currency as the main price
 * (owner, 2026-11-09): "≈ 1.62 جنيه لكل طلب" on Arabic pages and for Egypt,
 * "≈ EGP 1.62 per order" on English pages too until the country is known (only
 * the location picks the currency, owner 2026-11-16), "0.03 USD per order" where we have no rate, "≈ 0.11
 * ريال لكل طلب" once a Saudi visitor is known. USD, the billing currency, has
 * no "≈". Never "$". `cents` is the plan's USD price.
 */
export function PlanPrice({ cents, per, note, inverted = false }: { cents: number; per: string; note: string; /** White text, on the highlighted (brand-colour) card. */ inverted?: boolean }) {
  const visitor = useVisitorPrices();
  const amount = visitor ? formatLocalAmount(cents, visitor.currency, visitor.rate) : "";
  const strong = inverted ? "text-white" : "text-teal-900";
  const soft = inverted ? "text-white/75" : "text-ink-500";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {visitor?.approx ? <span className={`text-[26px] leading-none font-bold min-[641px]:text-[30px] ${strong}`}>≈</span> : null}
        <Num dir="ltr" className={`text-[44px] leading-none font-extrabold min-[641px]:text-[54px] ${strong}`}>
          {amount}
        </Num>
        <span className={`text-[22px] leading-none font-bold min-[641px]:text-[26px] ${strong}`}>{visitor?.label}</span>
        <span className={`text-[15px] font-semibold ${soft}`}>{per}</span>
      </div>
      <p className={`m-0 text-[13px] ${soft}`}>{note}</p>
    </div>
  );
}
