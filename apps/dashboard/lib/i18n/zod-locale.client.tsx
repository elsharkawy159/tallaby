"use client";

import { z } from "zod";
import { useLocale } from "next-intl";

let configuredLocale: string | null = null;

/**
 * Points zod's built-in error messages ("Too small", "Invalid input", ...) at
 * the active locale. Client-only: zod's config is global, so setting it on the
 * server would leak one request's locale into another.
 */
export function ZodLocale() {
  const locale = useLocale();
  if (typeof window !== "undefined" && configuredLocale !== locale) {
    z.config(locale === "ar" ? z.locales.ar() : z.locales.en());
    configuredLocale = locale;
  }
  return null;
}
