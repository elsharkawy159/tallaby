import * as rootParams from "next/root-params";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import editorAr from "@workspace/store-editor/messages/ar.json";
import editorEn from "@workspace/store-editor/messages/en.json";
import { mergeMessages } from "@/lib/i18n/merge-messages.lib";
import { LOCALE_COOKIE, resolveLocale } from "./config";
import { routing } from "./routing";

/** The website editor's strings live in @workspace/store-editor (shared with the admin app). */
const EDITOR_MESSAGES = { ar: editorAr, en: editorEn };

// Same resolution order as apps/ecommerce/i18n/request.ts. `params` is not
// destructured: `requestLocale` is a lazy getter that reads `headers()`, so it
// is only touched on the fallback path.
export default getRequestConfig(async (params) => {
  // 1. An explicit `getTranslations({ locale })`.
  let resolved = params.locale;

  if (!resolved) {
    try {
      // 2. The `[locale]` segment of pages and layouts (no headers() read).
      resolved = await rootParams.locale();
    } catch {
      // Not available outside the [locale] tree (server actions, route handlers).
    }
  }
  // 3. Server actions: the locale the proxy matched for the page URL.
  if (!resolved) resolved = await params.requestLocale;

  // 4. Route handlers under app/api never pass through the locale step, so
  //    they keep reading the seller's saved language, as before [locale].
  const locale = hasLocale(routing.locales, resolved)
    ? resolved
    : resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);

  return {
    locale,
    messages: mergeMessages((await import(`../messages/${locale}.json`)).default, EDITOR_MESSAGES[locale]),
  };
});
