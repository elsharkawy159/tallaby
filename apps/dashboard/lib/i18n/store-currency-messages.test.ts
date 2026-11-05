import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import { moneyParams } from "./format";

/**
 * Strings that used to name EGP now take the store's currency. These are the
 * exact words an EGP store sees: جنيه in Arabic, EGP in English (owner, 2026-11-05).
 */
const translators = { ar: createTranslator({ locale: "ar", messages: ar }), en: createTranslator({ locale: "en", messages: en }) };
const say = (locale: "ar" | "en", key: string, values: Record<string, string | number>) => (translators[locale] as unknown as (k: string, v: object) => string)(key, values);

const EGP_TEXT: [string, Record<string, string | number>, string, string][] = [
  ["storeShipping.egp", { amount: "50" }, "50 جنيه", "EGP 50"],
  ["storeShipping.freeOverSummary", { amount: "50" }, "مجاني فوق 50 جنيه", "Free over EGP 50"],
  ["storeShipping.fields.priceHelp", { amount: "50" }, "سعر طلبي لهذه الأماكن 50 جنيه. استخدمه أو اكتب سعرك.", "Tallaby charges EGP 50 for these places. Use it or type your own."],
  ["storeShipping.freeDelivery.amount", {}, "توصيل مجاني للطلبات من (جنيه) فأكثر", "Free delivery for orders of (EGP) or more"],
];

describe("store currency strings on an EGP store", () => {
  it.each(EGP_TEXT)("%s reads as before", (key, values, arText, enText) => {
    expect(say("ar", key, { ...values, ...moneyParams("ar") })).toBe(arText);
    expect(say("en", key, { ...values, ...moneyParams("en") })).toBe(enText);
  });
});

describe("store currency strings on a SAR store", () => {
  it.each(EGP_TEXT)("%s doesn't say EGP or pounds", (key, values) => {
    const unit = { currency: "SAR" };
    expect(say("en", key, { ...values, ...moneyParams("en", unit) })).toContain("SAR");
    const arabic = say("ar", key, { ...values, ...moneyParams("ar", unit) });
    expect(arabic).toContain("ر.س");
    expect(arabic).not.toContain("EGP");
    expect(arabic).not.toContain("جنيه");
  });
});
