import { createElement as h } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { Link, StoreDefaultLocaleProvider } from "./navigation";

/** The href a Link renders on a page in `locale`, on a store whose default language is `storeDefault` (null: tallaby.com). */
function hrefOf(locale: "ar" | "en", storeDefault: "ar" | "en" | null, href: string): string | undefined {
  const link = h(Link, { href }, "x");
  const content = storeDefault ? h(StoreDefaultLocaleProvider, { locale: storeDefault, children: link }) : link;
  const markup = renderToStaticMarkup(h(NextIntlClientProvider, { locale, messages: {}, children: content }));
  return /href="([^"]*)"/.exec(markup)?.[1];
}

describe("Link follows the store's default language (owner, 2026-11-14)", () => {
  it("is next-intl's as before outside a store and on an Arabic-default store", () => {
    for (const store of [null, "ar"] as const) {
      expect(hrefOf("ar", store, "/products/x")).toBe("/products/x");
      expect(hrefOf("en", store, "/products/x")).toBe("/en/products/x");
      expect(hrefOf("en", store, "/")).toBe("/en");
    }
  });

  it("on an English-default store: English unprefixed, Arabic under /ar", () => {
    expect(hrefOf("en", "en", "/products/x")).toBe("/products/x");
    expect(hrefOf("en", "en", "/cart/checkout?step=2")).toBe("/cart/checkout?step=2");
    expect(hrefOf("ar", "en", "/products/x")).toBe("/ar/products/x");
    expect(hrefOf("ar", "en", "/")).toBe("/ar");
    expect(hrefOf("en", "en", "/")).toBe("/");
  });

  it("leaves external links alone", () => {
    expect(hrefOf("ar", "en", "https://wa.me/201000000000")).toBe("https://wa.me/201000000000");
  });
});
