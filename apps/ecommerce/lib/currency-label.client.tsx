"use client";

import { createContext, useContext } from "react";
import { DEFAULT_CURRENCY, type CurrencyLabel } from "@workspace/lib";

/**
 * The currency label prices use: "EGP" on the marketplace, or the store's
 * choice (Store settings › General) inside a storefront, set by its layout.
 */
const CurrencyLabelContext = createContext<CurrencyLabel>(DEFAULT_CURRENCY);

export function CurrencyLabelProvider({ label, children }: { label: CurrencyLabel; children: React.ReactNode }) {
  return <CurrencyLabelContext.Provider value={label}>{children}</CurrencyLabelContext.Provider>;
}

export const useCurrencyLabel = () => useContext(CurrencyLabelContext);
