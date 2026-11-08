"use client";

import { createContext, use, useState } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Num } from "@/components/marketing/site/layout-primitives";
import { useVisitorCurrency } from "@/lib/marketing/visitor-currency.client";

export type PlanKey = "free" | "pro";

/** One currency the cards can show, formatted on the server. */
export type LocalPrice = {
  /** "جنيه" / "EGP". */
  label: string;
  /** The footnote with this currency's rate. */
  fx: string;
  amounts: Record<PlanKey, string>;
};

/** EGP until the visitor's country says otherwise; null = USD only. */
const LocalCurrencyContext = createContext<LocalPrice | null>(null);

/**
 * Wraps the plan cards: renders EGP on the server (most visitors, and what
 * crawlers index), then switches to the visitor's currency, or to USD only
 * for a country we don't map (`useVisitorCurrency`, shared with the estimator).
 */
export function LocalCurrencyProvider({
  prices,
  children,
}: {
  /** By ISO code, only the currencies with a rate; always has EGP. */
  prices: Record<string, LocalPrice>;
  children: React.ReactNode;
}) {
  const currency = useVisitorCurrency((code) => code in prices);

  return <LocalCurrencyContext value={currency ? (prices[currency] ?? null) : null}>{children}</LocalCurrencyContext>;
}

/** The price block of one card: local amount big with USD under it, or USD big alone. */
export function PlanPrice({ plan, usd, per, note }: { plan: PlanKey; usd: string; per: string; note: string }) {
  const local = use(LocalCurrencyContext);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Num dir="ltr" className="text-[44px] leading-none font-extrabold text-teal-900 min-[641px]:text-[54px]">
          {local ? local.amounts[plan] : usd}
        </Num>
        {local ? <span className="text-[22px] leading-none font-bold text-teal-900 min-[641px]:text-[26px]">{local.label}</span> : null}
        <span className="text-[15px] font-semibold text-ink-500">{per}</span>
      </div>
      <p className="m-0 text-[13px] text-ink-500">
        {local ? (
          <>
            <Num dir="ltr" className="font-semibold">
              {usd}
            </Num>
            {" · "}
          </>
        ) : null}
        {note}
      </p>
    </div>
  );
}

/** The rate footnote under the cards; kept in place but hidden while USD only shows, so nothing moves. */
export function PlanFxNote({ className }: { className?: string }) {
  const local = use(LocalCurrencyContext);
  const [lastFx, setLastFx] = useState(local?.fx ?? "");
  if (local && local.fx !== lastFx) setLastFx(local.fx);
  return (
    <p className={cn(className, !local && "invisible")} aria-hidden={local ? undefined : true}>
      {local?.fx ?? lastFx}
    </p>
  );
}
