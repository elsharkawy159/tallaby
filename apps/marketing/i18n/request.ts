import * as rootParams from "next/root-params";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Same resolution order as apps/ecommerce/i18n/request.ts: an explicit locale,
// then the `[locale]` root param (keeps pages static), then the proxy-matched
// locale for Server Actions, where root params are unavailable.
export default getRequestConfig(async (params) => {
  let resolved = params.locale;

  if (!resolved) {
    try {
      resolved = await rootParams.locale();
    } catch {
      resolved = await params.requestLocale;
    }
  }

  const locale = hasLocale(routing.locales, resolved) ? resolved : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
