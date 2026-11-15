import { describe, expect, it } from "vitest";
import { englishPreferenceRedirect, type LocalePreferenceRequest } from "./locale-preference.lib";

function request(
  overrides: Partial<Omit<LocalePreferenceRequest, "headers">> & { headerValues?: Record<string, string> } = {},
): LocalePreferenceRequest {
  const { headerValues = {}, ...rest } = overrides;
  return { method: "GET", pathname: "/orders", search: "", localeCookie: "en", headers: new Headers(headerValues), ...rest };
}

describe("englishPreferenceRedirect", () => {
  it("sends an English-preferring seller's unprefixed page load to /en, keeping the query", () => {
    expect(englishPreferenceRedirect(request({ search: "?status=new" }))).toBe("/en/orders?status=new");
    expect(englishPreferenceRedirect(request({ pathname: "/" }))).toBe("/en");
    expect(englishPreferenceRedirect(request({ pathname: "/login", search: "?next=%2Foauth%2Fauthorize" }))).toBe(
      "/en/login?next=%2Foauth%2Fauthorize",
    );
  });

  it("leaves Arabic, missing or unknown preferences alone", () => {
    expect(englishPreferenceRedirect(request({ localeCookie: "ar" }))).toBeNull();
    expect(englishPreferenceRedirect(request({ localeCookie: null }))).toBeNull();
    expect(englishPreferenceRedirect(request({ localeCookie: "fr" }))).toBeNull();
  });

  it("never touches a prefixed URL", () => {
    expect(englishPreferenceRedirect(request({ pathname: "/en/orders" }))).toBeNull();
    expect(englishPreferenceRedirect(request({ pathname: "/en" }))).toBeNull();
    expect(englishPreferenceRedirect(request({ pathname: "/ar/orders" }))).toBeNull();
    // Only a whole segment is a prefix.
    expect(englishPreferenceRedirect(request({ pathname: "/entries" }))).toBe("/en/entries");
  });

  it("skips server actions, router fetches, prefetches and non-GET requests", () => {
    expect(englishPreferenceRedirect(request({ method: "POST" }))).toBeNull();
    expect(englishPreferenceRedirect(request({ method: "HEAD" }))).toBeNull();
    expect(englishPreferenceRedirect(request({ headerValues: { "next-action": "abc" } }))).toBeNull();
    expect(englishPreferenceRedirect(request({ headerValues: { rsc: "1" } }))).toBeNull();
    expect(englishPreferenceRedirect(request({ headerValues: { "next-router-prefetch": "1" } }))).toBeNull();
    expect(englishPreferenceRedirect(request({ headerValues: { "sec-purpose": "prefetch" } }))).toBeNull();
    expect(englishPreferenceRedirect(request({ headerValues: { "sec-fetch-dest": "empty" } }))).toBeNull();
    expect(englishPreferenceRedirect(request({ headerValues: { "sec-fetch-dest": "document" } }))).toBe("/en/orders");
  });
});
