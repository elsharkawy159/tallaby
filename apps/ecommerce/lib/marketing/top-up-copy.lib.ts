import { normalizeCountry } from "./visitor-country.lib";

/**
 * Which wallet top-up sentence tallaby.com shows (owner, 2026-11-10): sellers
 * outside Egypt top up in US dollars by card, sellers in Egypt in Egyptian
 * pounds. The country is the visitor's IP country (`useVisitorCountry`).
 *
 * An unknown country keeps the Egypt text on every locale, English too: the
 * server render (what crawlers index) and a failed lookup must not tell an
 * Egyptian seller to pay by card in dollars, and the English page's USD price
 * default is only a display choice, not where the visitor tops up.
 *
 * Pure functions only.
 */

export type TopUpCopyVariant = "egp" | "usdCard";

/**
 * Off until a seller outside Egypt can really top up by card in USD: today
 * card top-ups are off (`CARD_TOP_UPS_ENABLED = false` in
 * packages/lib/src/store-wallet/top-up.lib.ts) and the Kashier session and
 * webhook are EGP only. Turn on in the same change that makes USD card
 * top-ups work, so the site never promises what the dashboard can't do.
 */
export const USD_CARD_TOP_UP_COPY_LIVE = false;

/** `usdCard` for a known country other than Egypt (once live), else `egp`. */
export function topUpCopyVariant(
  country: string | null | undefined,
  live: boolean = USD_CARD_TOP_UP_COPY_LIVE,
): TopUpCopyVariant {
  if (!live) return "egp";
  const code = normalizeCountry(country);
  return code && code !== "EG" ? "usdCard" : "egp";
}
