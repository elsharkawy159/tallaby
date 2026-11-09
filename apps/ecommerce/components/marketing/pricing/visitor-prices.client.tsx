"use client";

import { createContext, use } from "react";
import type { MarketingPriceVars, PriceName } from "@/lib/marketing/pricing.lib";
import { useVisitorCurrency } from "@/lib/marketing/visitor-currency.client";

type VisitorPrices = { currency: string; vars: MarketingPriceVars };

const VisitorPricesContext = createContext<VisitorPrices | null>(null);

/**
 * The price tokens in the visitor's currency, for every price on tallaby.com
 * (owner, 2026-11-09). EGP on the server render and until the country is known
 * (Egypt, unknown countries and currencies without a rate stay EGP), then the
 * visitor's currency: a Saudi visitor reads "≈ 0.11 ريال لكل طلب".
 */
export function VisitorPricesProvider({ table, children }: { table: Record<string, MarketingPriceVars>; children: React.ReactNode }) {
  const currency = useVisitorCurrency((code) => code in table) ?? "EGP";
  const vars = table[currency] ?? table.EGP;
  return <VisitorPricesContext value={vars ? { currency: table[currency] ? currency : "EGP", vars } : null}>{children}</VisitorPricesContext>;
}

/** The current currency and its price tokens; null outside the provider. */
export function useVisitorPrices(): VisitorPrices | null {
  return use(VisitorPricesContext);
}

/** One price in the visitor's currency ("≈ 1.62 جنيه" → "≈ 0.11 ريال" after the swap). */
export function Price({ name }: { name: PriceName }) {
  const prices = use(VisitorPricesContext);
  return <>{prices ? prices.vars[name] : `{${name}}`}</>;
}
