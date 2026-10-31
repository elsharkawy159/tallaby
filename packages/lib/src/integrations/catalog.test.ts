import { describe, expect, it } from "vitest";
import { INTEGRATION_PROVIDERS } from "./registry";
import { STORE_APPS, STORE_APP_GROUPS, getStoreApp, isStoreAppLive, storeAppHref, storeAppsInGroup } from "./catalog";

describe("store apps catalog", () => {
  it("lists every integration provider exactly once, with unique keys", () => {
    const providers = STORE_APPS.flatMap((app) => ("provider" in app ? [app.provider] : []));
    expect([...providers].sort()).toEqual([...INTEGRATION_PROVIDERS].sort());
    expect(new Set(STORE_APPS.map((a) => a.key)).size).toBe(STORE_APPS.length);
  });

  it("puts every app in a known group", () => {
    for (const app of STORE_APPS) expect(STORE_APP_GROUPS).toContain(app.group);
  });

  it("is live only for available providers; catalog-only entries are soon", () => {
    expect(isStoreAppLive(getStoreApp("bosta")!)).toBe(true);
    expect(isStoreAppLive(getStoreApp("wassalha")!)).toBe(true);
    expect(isStoreAppLive(getStoreApp("tiktok_pixel")!)).toBe(false);
    for (const key of ["mylerz", "jt_express", "aramex", "paypal", "tallaby_pay"]) {
      expect(isStoreAppLive(getStoreApp(key)!), key).toBe(false);
    }
  });

  it("groups carriers and gateways for the Shipping and Payment methods pages", () => {
    expect(storeAppsInGroup("shipping").map((a) => a.key)).toEqual(["bosta", "wassalha", "mylerz", "jt_express", "aramex"]);
    expect(storeAppsInGroup("payments").map((a) => a.key)).toEqual(["paymob", "kashier", "paypal", "tallaby_pay"]);
  });

  it("links apps with their own page", () => {
    expect(storeAppHref("s1", getStoreApp("bosta")!)).toBe("/stores/s1/apps/bosta");
    expect(storeAppHref("s1", getStoreApp("paymob")!)).toBe("/stores/s1/settings/payments");
    expect(storeAppHref("s1", getStoreApp("meta_pixel")!)).toBeNull();
    expect(storeAppHref("s1", getStoreApp("ai_assistants")!)).toBe("/stores/s1/apps/ai-assistants");
  });

  it("shows the AI assistants app as live without an integration row (F-29)", () => {
    const app = getStoreApp("ai_assistants")!;
    expect(isStoreAppLive(app)).toBe(true);
    expect("provider" in app).toBe(false);
    expect(storeAppsInGroup("ai").map((a) => a.key)).toEqual(["ai_assistants"]);
  });
});
