import { cache } from "react";
import { quoteTopUp, TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { getBillingState } from "@workspace/lib/billing/server";

/**
 * The smallest top-up ($5) in whole Egyptian pounds at today's rate, so the
 * "top up from $5" message also shows what the seller actually pays in EGP.
 * Null when there is no rate yet or the read fails (the message then shows $5 only).
 */
export const getMinTopUpEgp = cache(async (): Promise<number | null> => {
  const billing = await getBillingState().catch(() => null);
  const quote = billing ? quoteTopUp(TOP_UP_MIN_USD_CENTS, billing) : null;
  return quote ? Math.round(quote.totalPiastres / 100) : null;
});
