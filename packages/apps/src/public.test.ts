import { describe, expect, it } from "vitest";
import { APPS } from "./registry";
import { PUBLIC_CATALOG_VERSION, parsePublicLocale, publicCatalog, publicCatalogApp } from "./public";

const ORIGIN = "https://dashboard.tallaby.com";

const ALLOWED_KEYS = [
  "id",
  "slug",
  "kind",
  "category",
  "name",
  "vendor",
  "summary",
  "description",
  "highlights",
  "icon",
  "screenshots",
  "pricing",
  "providerFees",
  "plans",
  "developer",
  "status",
  "installMode",
  "surfaces",
  "requires",
  "docsUrl",
].sort();

describe("public catalog", () => {
  it("is versioned and lists every app", () => {
    const catalog = publicCatalog("ar", ORIGIN);
    expect(catalog.version).toBe(PUBLIC_CATALOG_VERSION);
    expect(catalog.apps.map((a) => a.id)).toEqual(APPS.map((a) => a.id));
  });

  it("returns only public fields: no internal wiring, no settings route, no dashboard paths", () => {
    for (const app of publicCatalog("en", ORIGIN).apps) {
      expect(Object.keys(app).sort()).toEqual(ALLOWED_KEYS);
      const json = JSON.stringify(app);
      expect(json).not.toContain("internal");
      expect(json).not.toContain("provider\"");
      expect(json).not.toContain("settingsRoute");
      expect(json).not.toContain("/stores/");
    }
  });

  it("localizes, defaulting to Arabic", () => {
    expect(parsePublicLocale("en")).toBe("en");
    expect(parsePublicLocale("fr")).toBe("ar");
    expect(parsePublicLocale(null)).toBe("ar");
    expect(publicCatalogApp("bosta", "ar", ORIGIN)!.app.name).toBe("بوسطة");
    expect(publicCatalogApp("bosta", "en", ORIGIN)!.app.name).toBe("Bosta");
  });

  it("makes asset paths absolute on the given origin", () => {
    const bosta = publicCatalogApp("bosta", "en", `${ORIGIN}/`)!.app;
    expect(bosta.icon.imageUrl).toBe(`${ORIGIN}/app-logos/bosta.png`);
    expect(publicCatalogApp("meta_pixel", "en", ORIGIN)!.app.icon.imageUrl).toBeNull();
  });

  it("finds one app by id or slug", () => {
    expect(publicCatalogApp("size_chart", "en", ORIGIN)!.app.slug).toBe("size-chart");
    expect(publicCatalogApp("size-chart", "en", ORIGIN)!.app.id).toBe("size_chart");
    expect(publicCatalogApp("nope", "en", ORIGIN)).toBeNull();
  });
});
