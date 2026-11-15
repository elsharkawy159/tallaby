import { describe, expect, it } from "vitest";
import { LOCALE_COOKIE, defaultLocale, locales, resolveLocale } from "./config";
import { routing } from "./routing";

describe("dashboard i18n config", () => {
  it("keeps the locale list, default and cookie name unchanged", () => {
    expect([...locales]).toEqual(["ar", "en"]);
    expect(defaultLocale).toBe("ar");
    expect(LOCALE_COOKIE).toBe("locale");
  });

  it("agrees with the routing config", () => {
    expect([...locales]).toEqual([...routing.locales]);
    expect(defaultLocale).toBe(routing.defaultLocale);
  });

  it("never lets the middleware or navigation write a locale cookie", () => {
    expect(routing.localeCookie).toBe(false);
    expect(routing.localeDetection).toBe(false);
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("resolves unknown values to Arabic", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("ar")).toBe("ar");
    expect(resolveLocale("fr")).toBe("ar");
    expect(resolveLocale(undefined)).toBe("ar");
    expect(resolveLocale(null)).toBe("ar");
  });
});
