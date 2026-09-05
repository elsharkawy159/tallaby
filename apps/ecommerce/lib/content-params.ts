import { formatPricePlain } from "@workspace/lib";
import {
  DELIVERY_ESTIMATE_METRO,
  DELIVERY_ESTIMATE_OTHER,
  FREE_SHIPPING_THRESHOLD,
  RETURN_WINDOW_DAYS,
} from "./constants";

/**
 * The values every policy and marketing string interpolates, so the copy in
 * `messages/*.json` can never drift from the constants the checkout actually
 * uses. Pass the whole object to `t()` — next-intl ignores params a given
 * message doesn't reference.
 *
 * `days`, `metro` and `other` are strings on purpose: passing raw numbers lets
 * `Intl` render Arabic-Indic digits (٧) on the `ar` locale, which Egyptian
 * storefronts don't use. `formatPricePlain` already pins `numberingSystem:
 * "latn"` for the same reason.
 */
export function contentParams(locale: string) {
  return {
    threshold: formatPricePlain(FREE_SHIPPING_THRESHOLD, locale),
    days: String(RETURN_WINDOW_DAYS),
    metro: DELIVERY_ESTIMATE_METRO,
    other: DELIVERY_ESTIMATE_OTHER,
  };
}

/** Substitutes the same params into strings read with `t.raw()` (arrays/objects). */
export function applyContentParams(text: string, locale: string): string {
  const params = contentParams(locale) as Record<string, string>;
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? params[key]! : match
  );
}
