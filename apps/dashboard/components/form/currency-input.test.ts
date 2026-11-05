import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CurrencyAddon, CurrencyInput } from "./currency-input";

const intl = vi.hoisted(() => ({ locale: "ar" }));
vi.mock("next-intl", () => ({ useLocale: () => intl.locale }));
vi.mock("@/lib/utils", () => ({ cn: (...parts: unknown[]) => parts.filter(Boolean).join(" ") }));

const input = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(CurrencyInput, { value: "100", onChange: () => undefined, ...props }));

describe("CurrencyInput", () => {
  it("reads جنيه in Arabic with no currency or EGP, whatever the store's label", () => {
    intl.locale = "ar";
    expect(input()).toContain(">جنيه<");
    expect(input({ currency: null })).toContain(">جنيه<");
    expect(input({ currency: "EGP", label: "ج.م" })).toContain(">جنيه<");
    expect(input()).not.toContain("EGP");
  });

  it("reads EGP in English", () => {
    intl.locale = "en";
    expect(input()).toContain(">EGP<");
    expect(input({ currency: "EGP", label: "ج.م" })).toContain(">EGP<");
    intl.locale = "ar";
  });

  it("draws the Riyal symbol for SAR", () => {
    const html = input({ currency: "SAR" });
    expect(html).toContain("<svg");
    expect(html).toContain("ريال سعودي");
    expect(html).not.toContain("EGP");
  });

  it("shows another store's label", () => {
    expect(input({ currency: "AED" })).toContain(">AED<");
    expect(input({ currency: "SAR", label: "ر.س" })).toContain(">ر.س<");
  });
});

describe("CurrencyAddon", () => {
  it("takes the same props", () => {
    expect(renderToStaticMarkup(createElement(CurrencyAddon))).toContain(">جنيه<");
    expect(renderToStaticMarkup(createElement(CurrencyAddon, { currency: "SAR" }))).toContain("<svg");
  });
});
