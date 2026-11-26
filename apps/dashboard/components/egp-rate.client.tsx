"use client";

import { createContext, use } from "react";

const EgpRateContext = createContext<Promise<number | null> | null>(null);

/** Set once by the dashboard layout from `getEgpPerUsd`, as a promise so the frame never waits for it. Display only. */
export function EgpRateProvider({ rate, children }: { rate: Promise<number | null>; children: React.ReactNode }) {
  return <EgpRateContext value={rate}>{children}</EgpRateContext>;
}

/**
 * Today's EGP per USD for showing USD prices in EGP, or null before there is a rate.
 * Suspends until the rate arrives: call it under a <Suspense> boundary.
 */
export function useEgpRate() {
  const rate = use(EgpRateContext);
  return rate ? use(rate) : null;
}
