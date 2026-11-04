"use client";

import * as React from "react";
import { NextIntlClientProvider, useLocale, useMessages, useTimeZone } from "next-intl";
import { deepMergeMessages, type Messages } from "@/i18n/merge-messages.lib";

/** Adds the marketing strings to what client components can read, on tallaby.com only. */
export function MarketingMessages({ messages, children }: { messages: Messages; children: React.ReactNode }) {
  const locale = useLocale();
  const timeZone = useTimeZone();
  const base = useMessages() as Messages;
  const merged = React.useMemo(() => deepMergeMessages(base, messages), [base, messages]);
  return (
    <NextIntlClientProvider locale={locale} timeZone={timeZone} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
