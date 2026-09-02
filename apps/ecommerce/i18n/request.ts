import * as rootParams from "next/root-params";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// NOTE: `params` is deliberately not destructured. `requestLocale` is a lazy
// getter on that object, and reading it calls `headers()` — which opts the
// whole route into dynamic rendering. It must only be touched on the fallback
// path below, never in the parameter list.
export default getRequestConfig(async (params) => {
  // Resolution order matters for static rendering:
  //
  // 1. `locale` — an explicit override from `getTranslations({locale})`.
  // 2. `next/root-params` — reads the `[locale]` segment directly. Unlike the
  //    legacy `requestLocale`, it never touches `headers()`, so pages stay
  //    eligible for static rendering / ISR instead of being forced dynamic.
  //    This is what next-intl recommends on Next.js 16.3+ and replaces the
  //    now-deprecated `setRequestLocale` boilerplate in every page + layout.
  // 3. `requestLocale` — root params are unavailable outside the `[locale]`
  //    route tree (Server Actions, Route Handlers), where the getter throws.
  //    Those contexts are dynamic anyway, so reading the locale the proxy
  //    matched from the request headers costs nothing there.
  let resolved = params.locale;

  if (!resolved) {
    try {
      resolved = await rootParams.locale();
    } catch {
      resolved = await params.requestLocale;
    }
  }

  const activeLocale = hasLocale(routing.locales, resolved)
    ? resolved
    : routing.defaultLocale;

  return {
    locale: activeLocale,
    messages: (await import(`../messages/${activeLocale}.json`)).default,
  };
});
