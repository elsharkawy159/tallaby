import { defineRouting } from "next-intl/routing";

/**
 * The visitor's chosen language. next-intl writes it when the language switch
 * changes locale (client side) and on a page load whose locale differs from the
 * browser's. It never picks the page language here (localeDetection is off); the
 * proxy only reads its presence: a visitor who has one is never sent to /en.
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  // The URL is the sole source of truth for page language — never infer it
  // from the Accept-Language header or a stored cookie.
  localeDetection: false,
  // A year, not a session cookie, so choosing Arabic on an English browser
  // still holds after the browser restarts (proxy.ts, locale-landing.lib.ts).
  localeCookie: { name: LOCALE_COOKIE, maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
});

export type AppLocale = (typeof routing.locales)[number];
