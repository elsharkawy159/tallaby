import { describe, expect, it } from "vitest";
import { getApp } from "@workspace/apps";
import { INTEGRATION_PROVIDERS } from "./registry";
import { isPaidAppPricing, isValidAppPricing } from "../billing/app-pricing.lib";
import {
  STORE_APPS,
  STORE_APP_GROUPS,
  getStoreApp,
  isStoreAppDefaultInstalled,
  isStoreAppLive,
  storeAppHref,
  storeAppPricing,
  storeAppSettingsHref,
  storeAppsInGroup,
} from "./catalog";

const FREE = { model: "free" } as const;

describe("store apps catalog", () => {
  it("lists every integration provider exactly once, with unique keys", () => {
    const providers = STORE_APPS.flatMap((app) => ("provider" in app ? [app.provider] : []));
    expect([...providers].sort()).toEqual([...INTEGRATION_PROVIDERS].sort());
    expect(new Set(STORE_APPS.map((a) => a.key)).size).toBe(STORE_APPS.length);
  });

  it("agrees with each manifest's status and install mode (F-93)", () => {
    for (const app of STORE_APPS) {
      const manifest = getApp(app.key)!;
      expect(isStoreAppLive(app), app.key).toBe(manifest.status === "live");
      expect(isStoreAppDefaultInstalled(app), app.key).toBe(manifest.installMode === "builtin");
      expect(app.provider ?? null, app.key).toBe(manifest.internal.provider ?? null);
    }
  });

  it("puts every app in a known group", () => {
    for (const app of STORE_APPS) expect(STORE_APP_GROUPS).toContain(app.group);
  });

  it("is live only for available providers; catalog-only entries are soon", () => {
    expect(isStoreAppLive(getStoreApp("bosta")!)).toBe(true);
    expect(isStoreAppLive(getStoreApp("wassalha")!)).toBe(true);
    expect(isStoreAppLive(getStoreApp("tiktok_pixel")!)).toBe(false);
    for (const key of ["mylerz", "jt_express", "aramex", "paytabs", "moyasar", "paylink", "tabby", "paypal", "tallaby_pay"]) {
      expect(isStoreAppLive(getStoreApp(key)!), key).toBe(false);
    }
  });

  it("groups carriers and gateways for the Shipping and Payment methods pages", () => {
    expect(storeAppsInGroup("shipping").map((a) => a.key)).toEqual(["bosta", "wassalha", "mylerz", "jt_express", "aramex"]);
    expect(storeAppsInGroup("payments").map((a) => a.key)).toEqual(["paymob", "kashier", "paytabs", "moyasar", "paylink", "tabby", "paypal", "tallaby_pay"]);
  });

  it("links every app to its App Center page, and built ones to their settings (F-93)", () => {
    expect(storeAppHref("s1", getStoreApp("bosta")!)).toBe("/stores/s1/apps/bosta");
    expect(storeAppHref("s1", getStoreApp("meta_pixel")!)).toBe("/stores/s1/apps/meta-pixel");
    expect(storeAppSettingsHref("s1", getStoreApp("bosta")!)).toBe("/stores/s1/apps/bosta/settings");
    expect(storeAppSettingsHref("s1", getStoreApp("paymob")!)).toBe("/stores/s1/apps/paymob/settings");
    expect(storeAppSettingsHref("s1", getStoreApp("ai_assistants")!)).toBe("/stores/s1/apps/ai-assistants/settings");
    expect(storeAppSettingsHref("s1", getStoreApp("mylerz")!)).toBeNull();
    expect(storeAppSettingsHref("s1", getStoreApp("customer_notifications")!)).toBeNull();
  });

  it("keeps the entries the install engine and the old pages read, as before the registry (F-93)", () => {
    // The catalog as it was in packages/lib before @workspace/apps, plus Product feeds (F-11b, now an app).
    const before = [
      { key: "ai_assistants", group: "ai", kind: "agent", live: true, pricing: FREE, defaultInstalled: true },
      { key: "size_chart", group: "storefront", kind: "widget", live: true, pricing: FREE },
      { key: "meta_pixel", group: "tracking", kind: "script", provider: "meta_pixel", pricing: FREE },
      { key: "google_analytics", group: "tracking", kind: "script", provider: "google_analytics", pricing: FREE },
      { key: "google_tag_manager", group: "tracking", kind: "script", provider: "google_tag_manager", pricing: FREE },
      { key: "meta_capi", group: "tracking", kind: "server", provider: "meta_capi", pricing: FREE },
      { key: "tiktok_pixel", group: "tracking", kind: "script", provider: "tiktok_pixel", pricing: FREE },
      { key: "snapchat_pixel", group: "tracking", kind: "script", provider: "snapchat_pixel", pricing: FREE },
      { key: "product_feeds", group: "tracking", kind: "feed", live: true, pricing: FREE, defaultInstalled: true },
      { key: "bosta", group: "shipping", kind: "carrier", provider: "bosta", pricing: FREE },
      { key: "wassalha", group: "shipping", kind: "sheet", provider: "wassalha", pricing: FREE },
      { key: "mylerz", group: "shipping", kind: "carrier", pricing: FREE },
      { key: "jt_express", group: "shipping", kind: "carrier", pricing: FREE },
      { key: "aramex", group: "shipping", kind: "carrier", pricing: FREE },
      { key: "paymob", group: "payments", kind: "gateway", provider: "paymob", pricing: FREE },
      { key: "kashier", group: "payments", kind: "gateway", provider: "kashier", pricing: FREE },
      { key: "paytabs", group: "payments", kind: "gateway", pricing: FREE },
      { key: "moyasar", group: "payments", kind: "gateway", pricing: FREE },
      { key: "paylink", group: "payments", kind: "gateway", pricing: FREE },
      { key: "tabby", group: "payments", kind: "gateway", pricing: FREE },
      { key: "paypal", group: "payments", kind: "gateway", pricing: FREE },
      { key: "tallaby_pay", group: "payments", kind: "gateway", pricing: FREE },
      { key: "google_sheets", group: "data", kind: "account", provider: "google_sheets", pricing: FREE },
      { key: "shopify_import", group: "data", kind: "import", provider: "shopify_import", pricing: FREE },
      { key: "customer_notifications", group: "messaging", kind: "notifications", live: true, pricing: { model: "per_order", usdCents: 1 } },
      { key: "sms", group: "messaging", kind: "notifications", requestable: true, pricing: FREE },
    ];
    expect(STORE_APPS.map(({ slug: _slug, ...rest }) => rest)).toEqual(before);
  });

  it("has only Order notifications as a paid app, and every price is valid (F-47, F-63)", () => {
    for (const app of STORE_APPS) {
      expect(isValidAppPricing(storeAppPricing(app)), app.key).toBe(true);
      expect(isPaidAppPricing(storeAppPricing(app)), app.key).toBe(app.key === "customer_notifications");
    }
    expect(storeAppPricing(getStoreApp("customer_notifications")!)).toEqual({ model: "per_order", usdCents: 1 });
  });

  it("installs only AI assistants and Product feeds by default, and every default app is live (F-47, F-93)", () => {
    const defaults = STORE_APPS.filter(isStoreAppDefaultInstalled);
    expect(defaults.map((a) => a.key)).toEqual(["ai_assistants", "product_feeds"]);
    for (const app of defaults) expect(isStoreAppLive(app), app.key).toBe(true);
  });

  it("shows the AI assistants app as live without an integration row (F-29)", () => {
    const app = getStoreApp("ai_assistants")!;
    expect(isStoreAppLive(app)).toBe(true);
    expect("provider" in app).toBe(false);
    expect(storeAppsInGroup("ai").map((a) => a.key)).toEqual(["ai_assistants"]);
  });

  it("lists the Size chart app as a free, live storefront app with its own page (F-92)", () => {
    const app = getStoreApp("size_chart")!;
    expect(isStoreAppLive(app)).toBe(true);
    expect(isStoreAppDefaultInstalled(app)).toBe(false);
    expect(storeAppPricing(app)).toEqual({ model: "free" });
    expect(storeAppHref("s1", app)).toBe("/stores/s1/apps/size-chart");
    expect(storeAppSettingsHref("s1", app)).toBe("/stores/s1/apps/size-chart/settings");
    expect(storeAppsInGroup("storefront").map((a) => a.key)).toEqual(["size_chart"]);
  });
});
