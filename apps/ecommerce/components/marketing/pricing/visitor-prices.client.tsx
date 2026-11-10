"use client";

import { createContext, use, useMemo } from "react";
import {
  type MarketingPriceTable,
  USD,
  currencyLabel,
  defaultCurrency,
  formatLocalApprox,
  isApproxCurrency,
  localPriceVars,
} from "@/lib/marketing/local-currency.lib";
import type { MarketingPriceVars, PriceName } from "@/lib/marketing/pricing.lib";
import { useVisitorCurrency } from "@/lib/marketing/visitor-currency.client";

type VisitorPrices = {
  locale: string;
  currency: string;
  /** USD→currency. */
  rate: number;
  /** "ريال" / "SAR"; the ISO code for a currency without an Arabic word. */
  label: string;
  /** Whether prices show with "≈" (every currency but USD). */
  approx: boolean;
  vars: MarketingPriceVars;
};

const VisitorPricesContext = createContext<VisitorPrices | null>(null);

/**
 * The price tokens in the visitor's currency, for every price on tallaby.com
 * (owner, 2026-11-09; every country 2026-11-10). On the server render and
 * until the country is known: EGP on Arabic pages, USD on English ones. Then
 * the country's currency when we have a rate for it, else USD: a Swedish
 * visitor reads "≈ 0.29 SEK per order", a Saudi one "≈ 0.11 ريال لكل طلب".
 */
export function VisitorPricesProvider({ table, children }: { table: MarketingPriceTable; children: React.ReactNode }) {
  const { locale, rates, labels } = table;
  const currency = useVisitorCurrency(locale, (code) => Boolean(rates[code]));
  const value = useMemo<VisitorPrices>(() => {
    // The default currency always has a rate (EGP and USD are never missing); USD is the last resort.
    const code = rates[currency] ? currency : rates[defaultCurrency(locale)] ? defaultCurrency(locale) : USD;
    const rate = rates[code] ?? 1;
    const label = currencyLabel(code, labels);
    return { locale, currency: code, rate, label, approx: isApproxCurrency(code), vars: localPriceVars(code, rate, locale, label) };
  }, [currency, locale, rates, labels]);
  return <VisitorPricesContext value={value}>{children}</VisitorPricesContext>;
}

/** The current currency, its rate, label and price tokens; null outside the provider. */
export function useVisitorPrices(): VisitorPrices | null {
  return use(VisitorPricesContext);
}

/** One price in the visitor's currency ("≈ 1.62 جنيه" → "≈ 0.11 ريال" after the swap). */
export function Price({ name }: { name: PriceName }) {
  const prices = use(VisitorPricesContext);
  return <>{prices ? prices.vars[name] : `{${name}}`}</>;
}

/** Any USD-cents amount (a demo wallet, an estimate) in the visitor's currency, formatted like `Price`. */
export function Money({ cents }: { cents: number }) {
  const prices = use(VisitorPricesContext);
  if (!prices) return null;
  return <>{formatLocalApprox(cents, prices.currency, prices.rate, prices.locale, prices.label)}</>;
}
