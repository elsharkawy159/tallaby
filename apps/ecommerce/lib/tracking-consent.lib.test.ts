import { describe, expect, it } from "vitest";
import { parseTrackingConsent, shouldShowConsentBanner, tagCookieDomains, tagCookieNames } from "./tracking-consent.lib";
import { hasStoreTrackingConsent } from "./storefront-consent";

describe("parseTrackingConsent", () => {
  it("keeps only an explicit choice", () => {
    expect(parseTrackingConsent("granted")).toBe("granted");
    expect(parseTrackingConsent("denied")).toBe("denied");
  });

  it.each([null, undefined, "", "yes", "GRANTED"])("treats %s as no choice", (value) => {
    expect(parseTrackingConsent(value)).toBe("unset");
  });

  it("only an accepted choice allows a server event", () => {
    expect(hasStoreTrackingConsent("granted")).toBe(true);
    expect(hasStoreTrackingConsent("denied")).toBe(false);
    expect(hasStoreTrackingConsent(undefined)).toBe(false);
  });
});

describe("shouldShowConsentBanner", () => {
  it("shows nothing until the browser knows the choice", () => {
    expect(shouldShowConsentBanner("pending", false)).toBe(false);
    expect(shouldShowConsentBanner("pending", true)).toBe(false);
  });

  it("shows while undecided", () => {
    expect(shouldShowConsentBanner("unset", false)).toBe(true);
  });

  it("remembers a choice, and reopens only from Cookie settings", () => {
    expect(shouldShowConsentBanner("denied", false)).toBe(false);
    expect(shouldShowConsentBanner("granted", false)).toBe(false);
    expect(shouldShowConsentBanner("denied", true)).toBe(true);
    expect(shouldShowConsentBanner("granted", true)).toBe(true);
  });
});

describe("tagCookieNames", () => {
  it("finds GA and Meta cookies", () => {
    expect(tagCookieNames("_ga=1; _ga_ET1FTMXB9X=2; _gid=3; _gat_gtag=4; _fbp=5; _fbc=6")).toEqual([
      "_ga",
      "_ga_ET1FTMXB9X",
      "_gid",
      "_gat_gtag",
      "_fbp",
      "_fbc",
    ]);
  });

  it("never matches essential cookies", () => {
    expect(
      tagCookieNames("sb-abc-auth-token=1; NEXT_LOCALE=ar; tallaby_store_consent=denied; cart_id=2; _gallery=3; _fbx=4"),
    ).toEqual([]);
    expect(tagCookieNames("")).toEqual([]);
  });
});

describe("tagCookieDomains", () => {
  it("covers the host and its parents, never a bare suffix", () => {
    expect(tagCookieDomains("www.tallaby.com")).toEqual([".www.tallaby.com", ".tallaby.com"]);
    expect(tagCookieDomains("tallaby.com")).toEqual([".tallaby.com"]);
  });

  it("has nothing for localhost or an IP", () => {
    expect(tagCookieDomains("localhost")).toEqual([]);
    expect(tagCookieDomains("127.0.0.1")).toEqual([]);
  });
});
