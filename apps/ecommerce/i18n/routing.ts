import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  // The URL is the sole source of truth for page language — never infer it
  // from the Accept-Language header or a stored cookie.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
