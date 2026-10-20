"use client";

import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import editorEn from "@workspace/store-editor/messages/en.json";

/**
 * The website builder's strings (they ship with @workspace/store-editor).
 * Admin has no next-intl request config: the builder is English-only here,
 * so the client provider gets its locale and messages directly.
 */
export function BuilderIntl({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={editorEn} timeZone="Africa/Cairo">
      {children}
    </NextIntlClientProvider>
  );
}
