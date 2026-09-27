"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, resolveLocale } from "@/i18n/config";

export async function setLocale(locale: string) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, resolveLocale(locale), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
