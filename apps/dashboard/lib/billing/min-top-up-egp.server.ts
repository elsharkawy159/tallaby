import { cache } from "react";
import { formatEgpApprox, TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { getEgpPerUsd } from "./egp-rate.server";

/**
 * The smallest top-up ($5) as the seller sees it, in EGP at today's rate:
 * "≈ 269 جنيه" (owner, 2026-11-09: no dollar prices for sellers).
 * Null when there is no rate yet or the read fails; the message then names no amount.
 */
export const getMinTopUpText = cache(async (locale: string): Promise<string | null> => {
  const rate = await getEgpPerUsd();
  return rate ? formatEgpApprox(TOP_UP_MIN_USD_CENTS, rate, locale) : null;
});
