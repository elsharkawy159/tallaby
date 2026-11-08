import { cache } from "react";
import { billingTags, createCachedQuery } from "@workspace/cache";
import { exchangeRateSource, usdRatesFromResponse } from "@workspace/lib/billing";
import { getBillingState } from "@workspace/lib/billing/server";
import { FEED_CURRENCIES } from "./local-currency.lib";
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

/** `promise`, or a rejection after `ms`. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${ms} ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** EGP per USD for tallaby.com's "≈" figures; `FALLBACK_EGP_PER_USD` if there is no rate or the read fails. */
export const getMarketingEgpPerUsd = cache(async (): Promise<number> => {
  try {
    const rate = await withTimeout(getCachedMarketRate(), READ_TIMEOUT_MS);
    return rate && Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_EGP_PER_USD;
  } catch (error) {
    console.error("[marketing] exchange rate read failed", error);
    return FALLBACK_EGP_PER_USD;
  }
});

/** The feed is slower than the database; past this the cards show EGP and USD only. */
const FEED_TIMEOUT_MS = 10_000;

/**
 * USD→X rates of the currencies the plan cards can show besides EGP, from the
 * same feed as the billing cron. Cached 3 hours and cleared with the billing
 * rate; a failed fetch throws inside, so it is never cached.
 */
const getCachedFeedRates = createCachedQuery({
  name: "marketing:usd-local-rates:v1",
  ttl: 3 * 60 * 60,
  tags: () => [billingTags.rate()],
  query: async () => {
    const response = await fetch(exchangeRateSource(process.env.EXCHANGE_RATE_API_KEY).url, {
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`exchange rate feed http_${response.status}`);
    const rates = usdRatesFromResponse(await response.json(), FEED_CURRENCIES);
    if (Object.keys(rates).length === 0) throw new Error("exchange rate feed bad_response");
    return rates;
  },
});

/**
 * USD→X rates for the plan cards' local prices: EGP is always the billing rate
 * (so "1.62" matches /wallet), the others the feed's, or missing when the feed
 * fails (those visitors see USD only). Never throws.
 */
export const getMarketingUsdRates = cache(async (): Promise<Record<string, number>> => {
  const [egp, feed] = await Promise.all([
    getMarketingEgpPerUsd(),
    withTimeout(getCachedFeedRates(), FEED_TIMEOUT_MS).catch((error: unknown) => {
      console.error("[marketing] local currency rates read failed", error);
      return {} as Record<string, number>;
    }),
  ]);
  return { ...feed, EGP: egp };
});
