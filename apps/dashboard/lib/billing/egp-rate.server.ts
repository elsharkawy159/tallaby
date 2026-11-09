import { cache } from "react";
import { getBillingState } from "@workspace/lib/billing/server";

/**
 * Today's EGP per USD, once per request: every USD price a seller sees is shown in
 * EGP at this rate (owner, 2026-11-09). The same rate /wallet's top-up quote uses.
 * Null before the first fetch or when the read fails; screens then show dollars.
 * Display only: nothing is charged from this read.
 */
export const getEgpPerUsd = cache(async (): Promise<number | null> => {
  const billing = await getBillingState().catch(() => null);
  return billing?.marketRate && billing.marketRate > 0 ? billing.marketRate : null;
});
