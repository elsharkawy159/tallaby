import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { loadBaseMessages } from "@/i18n/messages";

/**
 * Every base string (messages/<locale>.json) for the client components below:
 * store hosts and the customer pages they share, the section library and the
 * template preview frames. The root layout only sends the cookie banner's
 * strings and tallaby.com sends its own pick (i18n/client-messages.lib.ts).
 */
export async function BaseMessagesProvider({ children }: { children: React.ReactNode }) {
  const messages = await loadBaseMessages(await getLocale());
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
