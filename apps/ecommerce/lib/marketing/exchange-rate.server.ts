import { cache } from "react";
import { billingTags, createCachedQuery } from "@workspace/cache";
import { getBillingState } from "@workspace/lib/billing/server";
import { FALLBACK_EGP_PER_USD } from "./pricing.lib";

/** The rate is optional on the page: past this, it shows the fallback rather than wait for the database. */
const READ_TIMEOUT_MS = 3000;

/**
 * The USD/EGP rate the dashboard's /wallet uses (Admin override, else the
 * latest cron fetch, else the billing setting), read through the cache: the
 * cron and the Admin clear `billing:rate` when it changes, and 3 hours is the
 * safety net (the cron's own interval). Only the rate leaves this function.
 */
const getCachedMarketRate = createCachedQuery({
  name: "marketing:usd-egp-rate:v1",
  ttl: 3 * 60 * 60,
  tags: () => [billingTags.rate()],
  query: async () => (await getBillingState()).marketRate,
});

/** EGP per USD for tallaby.com's "≈" figures; `FALLBACK_EGP_PER_USD` if there is no rate or the read fails. */
export const getMarketingEgpPerUsd = cache(async (): Promise<number> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const rate = await Promise.race([
      getCachedMarketRate(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${READ_TIMEOUT_MS} ms`)), READ_TIMEOUT_MS);
      }),
    ]);
    return rate && Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_EGP_PER_USD;
  } catch (error) {
    console.error("[marketing] exchange rate read failed", error);
    return FALLBACK_EGP_PER_USD;
  } finally {
    clearTimeout(timer);
  }
});
