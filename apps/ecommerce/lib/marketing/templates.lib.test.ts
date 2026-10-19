import { describe, expect, it } from "vitest";
import { GALLERY_TEMPLATES } from "./templates.data";
import { buildGallery, categoryCode, localized, type CatalogTemplate } from "./templates.lib";

const row = (over: Partial<CatalogTemplate>): CatalogTemplate => ({
  key: "x",
  name: { ar: "س", en: "X" },
  description: { ar: "وصف", en: "Desc" },
  category: "general",
  thumbnailUrl: null,
  previewUrl: null,
  isPremium: false,
  price: null,
  sortOrder: 0,
  ...over,
});

describe("template gallery", () => {
  it("marks previews with an active template as available, first", () => {
    const gallery = buildGallery(GALLERY_TEMPLATES, [row({ key: "atelier", sortOrder: 10 }), row({ key: "tallaby-classic", sortOrder: 0 })], "ar");
    expect(gallery.slice(0, 2).map((e) => [e.id, e.status])).toEqual([
      ["classic", "available"],
      ["atelier", "available"],
    ]);
    expect(gallery.filter((e) => e.status === "soon").map((e) => e.id)).toEqual(["volt", "glow", "nook", "charm", "tick"]);
  });

  it("shows every preview as soon without database rows", () => {
    expect(buildGallery(GALLERY_TEMPLATES, [], "ar").every((e) => e.status === "soon")).toBe(true);
  });

  it("adds active templates without a preview when they have a thumbnail", () => {
    const gallery = buildGallery(
      [],
      [
        row({ key: "bazaar", category: "home", thumbnailUrl: "https://x.supabase.co/t.png", isPremium: true, price: "250.00" }),
        row({ key: "nothumb" }),
        row({ key: "badthumb", thumbnailUrl: "javascript:alert(1)" }),
      ],
      "en",
    );
    expect(gallery).toEqual([
      expect.objectContaining({ id: "bazaar", category: "ho", name: "X", description: "Desc", price: 250, status: "available", preview: null }),
    ]);
  });

  it("drops unsafe preview URLs", () => {
    const [entry] = buildGallery(GALLERY_TEMPLATES.slice(0, 1), [row({ key: "tallaby-classic", previewUrl: "javascript:alert(1)" })], "ar");
    expect(entry?.previewUrl).toBeNull();
  });

  it("localizes JSON names with a fallback", () => {
    expect(localized({ ar: "أ", en: "A" }, "en")).toBe("A");
    expect(localized({ ar: "أ" }, "en")).toBe("أ");
    expect(localized(null, "ar")).toBeNull();
    expect(categoryCode("fashion")).toBe("fa");
    expect(categoryCode("other")).toBe("ge");
  });
});
