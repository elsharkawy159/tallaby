"use client";

import { createContext, useContext } from "react";

const EgpRateContext = createContext<number | null>(null);

/** Set once by the dashboard layout from `getEgpPerUsd`. Display only. */
export function EgpRateProvider({ rate, children }: { rate: number | null; children: React.ReactNode }) {
  return <EgpRateContext.Provider value={rate}>{children}</EgpRateContext.Provider>;
}

/** Today's EGP per USD for showing USD prices in EGP, or null before there is a rate. */
export function useEgpRate() {
  return useContext(EgpRateContext);
}
