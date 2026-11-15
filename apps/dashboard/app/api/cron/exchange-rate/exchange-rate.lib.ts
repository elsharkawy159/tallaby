import { marketingEgpFiguresChanged } from "@workspace/lib/billing";

/**
 * The cron runs at 00:05, 03:05, … UTC (`vercel.json`). The first run of the
 * UTC day clears the rate even when no EGP figure moved, so the other
 * currencies' rates on tallaby.com (read from the same feed, cached under the
 * same tag) are at most about a day old.
 */
const DAILY_REFRESH_BEFORE_UTC_HOUR = 3;

/**
 * Whether the exchange-rate cron should clear `billing:rate` (tallaby.com's
 * cached rate reads, and every marketing page built from them): only when a
 * visitor would see a different EGP figure at the new rate, plus once a day.
 * `previous` and `next` are the rates the site uses (`getBillingState().marketRate`:
 * the Admin override, else the latest fetch) before and after this run, so with
 * an override set a new fetch changes nothing on the site. Comparing each run
 * with the one before is enough: the figures are a function of the rate, so if
 * no run changed them, none differ from the last time the pages were built.
 */
export function shouldInvalidateMarketingRate(input: { previous: number | null; next: number | null; now: Date }): boolean {
  if (input.now.getUTCHours() < DAILY_REFRESH_BEFORE_UTC_HOUR) return true;
  return marketingEgpFiguresChanged(input.previous, input.next);
}
