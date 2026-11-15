"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "@/i18n/config";

/**
 * Saves the seller's language (the only place it changes, plan §5.1). The
 * switcher then navigates to the same page in that locale (`/orders` ↔
 * `/en/orders`): the page language comes from the URL, so nothing cached needs
 * purging here. Setting a cookie in a server action already clears the client
 * router cache, so older unprefixed entries (e.g. a prefetched redirect to
 * /en) are not reused.
 */
export async function setLocale(locale: string) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, resolveLocale(locale), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
