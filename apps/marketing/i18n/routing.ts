import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  // The URL is the only source of the page language (same rule as ecommerce).
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
