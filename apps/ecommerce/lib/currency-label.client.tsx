"use client";

import { createContext, useContext } from "react";
import { DEFAULT_CURRENCY, type CurrencyLabel } from "@workspace/lib";

/**
 * The currency label prices use: "EGP" on the marketplace, or the store's
 * choice (Store settings › General) inside a storefront, set by its layout.
 */
const CurrencyLabelContext = createContext<CurrencyLabel>(DEFAULT_CURRENCY);
/** The ISO code behind it, for tracking events. */
const CurrencyCodeContext = createContext<string>(DEFAULT_CURRENCY);

export function CurrencyLabelProvider({
  label,
  currency = DEFAULT_CURRENCY,
  children,
}: {
  label: CurrencyLabel;
  currency?: string;
  children: React.ReactNode;
}) {
  return (
    <CurrencyCodeContext.Provider value={currency}>
      <CurrencyLabelContext.Provider value={label}>{children}</CurrencyLabelContext.Provider>
    </CurrencyCodeContext.Provider>
  );
}

export const useCurrencyLabel = () => useContext(CurrencyLabelContext);
export const useCurrencyCode = () => useContext(CurrencyCodeContext);
