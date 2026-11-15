import { defineRouting } from "next-intl/routing";

/**
 * Dashboard locale routing (docs/plans/dashboard-static-shell.md Phase 1).
 * Arabic keeps today's unprefixed URLs; English lives under /en.
 *
 * `localeCookie: false`: the saved language changes only through the language
 * switcher (actions/locale.ts writes the `locale` cookie, LOCALE_COOKIE in
 * config.ts), never by opening an /en link (owner, 2026-11-15, plan §5.1).
 * With it off, next-intl's middleware never writes a cookie, and its Link and
 * router never write one on a locale switch either.
 */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  // The URL alone picks the page language: no Accept-Language, no cookie.
  localeDetection: false,
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
