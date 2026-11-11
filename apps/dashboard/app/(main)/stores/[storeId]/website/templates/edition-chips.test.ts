import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

// The dashboard's `cn` module builds a browser Supabase client when it loads; nothing here calls it.
vi.mock("@/supabase/client", () => ({ createClient: () => ({}), supabase: {} }));

import editorAr from "@workspace/store-editor/messages/ar.json";
import editorEn from "@workspace/store-editor/messages/en.json";
import { EditionChips } from "./edition-chips.client";

/** The chips' markup, with the real strings (the `websiteTemplates` namespace lives in the store editor's messages). */
function render(locale: "ar" | "en", props: Partial<Parameters<typeof EditionChips>[0]>) {
  const messages = { websiteTemplates: (locale === "ar" ? editorAr : editorEn).websiteTemplates };
  return renderToStaticMarkup(
    createElement(NextIntlClientProvider, {
      locale,
      messages,
      timeZone: "Africa/Cairo",
      children: createElement(EditionChips, { editions: [], value: null, onChange: () => {}, locale, templateName: "Kasr", ...props }),
    }),
  );
}

const EDITIONS = [
  { id: "dresses", name: { ar: "فساتين", en: "Dresses" } },
  { id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } },
];

describe("EditionChips", () => {
  it("renders nothing for a template with no editions: the card is as it was", () => {
    expect(render("ar", { editions: [] })).toBe("");
    expect(render("en", { editions: [], value: "tshirts" })).toBe("");
  });

  it("lists the original first, then each niche in the page's language, as a labelled group of toggle buttons", () => {
    const html = render("en", { editions: EDITIONS });
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Show Kasr made for"');
    expect([...html.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map((match) => match[1])).toEqual(["Original", "Dresses", "T-shirts"]);
    expect([...render("ar", { editions: EDITIONS }).matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map((match) => match[1])).toEqual(["الأصلي", "فساتين", "تيشيرتات"]);
  });

  it("presses the chosen edition, or the original when none is chosen", () => {
    const pressed = (html: string) => [...html.matchAll(/<button[^>]*aria-pressed="(true|false)"[^>]*>/g)].map((match) => match[1] === "true");
    expect(pressed(render("en", { editions: EDITIONS, value: null }))).toEqual([true, false, false]);
    expect(pressed(render("en", { editions: EDITIONS, value: "tshirts" }))).toEqual([false, false, true]);
  });
});
