import { describe, expect, it } from "vitest";
import {
  APP_CATEGORIES,
  APP_IDS,
  APP_SETTINGS_ROUTES,
  appManifestSchema,
} from "./manifest";
import { MANIFESTS } from "./manifests";
import { APPS, appPaths, appsInCategory, getApp, getAppBySlug, matchesAppQuery, usedCategories } from "./registry";

describe("app manifests", () => {
  it("validates every manifest against the schema", () => {
    for (const manifest of MANIFESTS) {
      const result = appManifestSchema.safeParse(manifest);
      expect(result.success, `${manifest.id}: ${result.success ? "" : result.error.message}`).toBe(true);
    }
  });

  it("has exactly one manifest per id, and unique slugs", () => {
    expect(APPS.map((app) => app.id).sort()).toEqual([...APP_IDS].sort());
    expect(new Set(APPS.map((app) => app.slug)).size).toBe(APPS.length);
  });

  it("writes every visible text in Arabic and English", () => {
    for (const app of APPS) {
      for (const text of [app.name, app.vendor, app.summary, app.description, ...app.highlights]) {
        expect(text.ar.trim(), app.id).not.toBe("");
        expect(text.en.trim(), app.id).not.toBe("");
      }
      // Arabic copy really is Arabic where the brand isn't a Latin name.
      expect(/[؀-ۿ]/.test(app.summary.ar), `${app.id} summary.ar`).toBe(true);
    }
  });

  it("uses only known categories and settings routes", () => {
    for (const app of APPS) {
      expect(APP_CATEGORIES).toContain(app.category);
      if (app.settingsRoute) expect(APP_SETTINGS_ROUTES).toContain(app.settingsRoute);
    }
    expect(usedCategories()).toEqual([...APP_CATEGORIES]);
  });

  it("gives every live app a way to be set up, and no coming-soon app settings", () => {
    for (const app of APPS) {
      if (app.status === "coming_soon") expect(app.settingsRoute, app.id).toBeNull();
      // Only Order notifications installs with nothing to set.
      if (app.status === "live" && app.settingsRoute === null) expect(app.id).toBe("customer_notifications");
    }
  });

  it("points `requires` at real apps", () => {
    for (const app of APPS) for (const id of app.requires) expect(getApp(id), `${app.id} → ${id}`).not.toBeNull();
    expect(getApp("meta_capi")!.requires).toEqual(["meta_pixel"]);
  });

  it("keeps the old dashboard URLs: slugs bosta, wassalha, size-chart and ai-assistants", () => {
    expect(getAppBySlug("bosta")?.id).toBe("bosta");
    expect(getAppBySlug("wassalha")?.id).toBe("wassalha");
    expect(getAppBySlug("size-chart")?.id).toBe("size_chart");
    expect(getAppBySlug("ai-assistants")?.id).toBe("ai_assistants");
    expect(getAppBySlug("nope")).toBeNull();
  });

  it("builds store-scoped paths", () => {
    const bosta = getApp("bosta")!;
    expect(appPaths.detail("s1", bosta)).toBe("/stores/s1/apps/bosta");
    expect(appPaths.settings("s1", bosta)).toBe("/stores/s1/apps/bosta/settings");
  });

  it("searches both languages and Latin keywords", () => {
    const bosta = getApp("bosta")!;
    expect(matchesAppQuery(bosta, "بوسطة")).toBe(true);
    expect(matchesAppQuery(bosta, "BOSTA")).toBe(true);
    expect(matchesAppQuery(getApp("wassalha")!, "egypt post")).toBe(true);
    expect(matchesAppQuery(bosta, "paymob")).toBe(false);
    expect(matchesAppQuery(bosta, "  ")).toBe(true);
  });

  it("groups apps by category in order", () => {
    expect(appsInCategory("storefront").map((a) => a.id)).toEqual(["size_chart"]);
    expect(appsInCategory("shipping").map((a) => a.id)).toEqual(["bosta", "wassalha", "mylerz", "jt_express", "aramex"]);
  });

  it("rejects a bad manifest", () => {
    const bosta = MANIFESTS.find((m) => m.id === "bosta")!;
    expect(appManifestSchema.safeParse({ ...bosta, slug: "Bosta" }).success).toBe(false);
    expect(appManifestSchema.safeParse({ ...bosta, name: { ar: "", en: "Bosta" } }).success).toBe(false);
    expect(appManifestSchema.safeParse({ ...bosta, category: "games" }).success).toBe(false);
    expect(appManifestSchema.safeParse({ ...bosta, settingsRoute: "nowhere" }).success).toBe(false);
    expect(appManifestSchema.safeParse({ ...bosta, docsUrl: "http://tallaby.com" }).success).toBe(false);
    expect(appManifestSchema.safeParse({ ...bosta, secret: "x" }).success).toBe(false);
    expect(appManifestSchema.safeParse({ ...bosta, status: "coming_soon" }).success).toBe(false);
  });
});
