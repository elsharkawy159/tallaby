import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import editorAr from "@workspace/store-editor/messages/ar.json";
import editorEn from "@workspace/store-editor/messages/en.json";
import { mergeMessages } from "@/lib/i18n/merge-messages.lib";
import { LOCALE_COOKIE, resolveLocale } from "./config";

/** The website editor's strings live in @workspace/store-editor (shared with the admin app). */
const EDITOR_MESSAGES = { ar: editorAr, en: editorEn };

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);

  return {
    locale,
    messages: mergeMessages((await import(`../messages/${locale}.json`)).default, EDITOR_MESSAGES[locale]),
  };
});
