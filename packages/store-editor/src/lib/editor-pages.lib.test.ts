import { describe, expect, it } from "vitest";
import type { EditorPage } from "../state/editor.store";
import { getElementDefinition } from "@workspace/store-sections/render";
import { offeredElementGroups, offeredPaletteTypes, offeredPresets, offersProductParts, pagesPanelOrder } from "./editor-pages.lib";

const page = (id: string, over: Partial<EditorPage> = {}): EditorPage => ({
  id,
  slug: id,
  isHome: false,
  name: { ar: id },
  seo: {},
  showInNav: true,
  content: { sections: [] },
  version: 1,
  ...over,
});

describe("pagesPanelOrder", () => {
  it("pages panel orders home, product, rest", () => {
    const pages = [page("about"), page("product", { kind: "product", showInNav: false }), page("contact"), page("home", { isHome: true })];
    expect(pagesPanelOrder(pages).map((p) => p.id)).toEqual(["home", "product", "about", "contact"]);
  });

  it("keeps the order of the other pages and works without a product page", () => {
    const pages = [page("b"), page("home", { isHome: true }), page("a")];
    expect(pagesPanelOrder(pages).map((p) => p.id)).toEqual(["home", "b", "a"]);
  });
});

describe("product parts in the Add panel", () => {
  it("are offered on the product page only", () => {
    expect(offersProductParts(page("product", { kind: "product" }))).toBe(true);
    expect(offersProductParts(page("home", { isHome: true }))).toBe(false);
    expect(offersProductParts(undefined)).toBe(false);
  });

  it("hides the product element group and its elements elsewhere", () => {
    expect(offeredElementGroups(false)).not.toContain("product");
    expect(offeredElementGroups(true)).toContain("product");
    const groupOf = (types: readonly string[]) => types.map((type) => getElementDefinition(type as never)!.group);
    expect(groupOf(offeredPaletteTypes(false))).not.toContain("product");
    expect(groupOf(offeredPaletteTypes(true))).toContain("product");
  });

  it("hides the product page library category elsewhere", () => {
    const presets = [{ id: "a", category: "hero" }, { id: "b", category: "product-page" }] as const;
    expect(offeredPresets(presets, false).map((p) => p.id)).toEqual(["a"]);
    expect(offeredPresets(presets, true).map((p) => p.id)).toEqual(["a", "b"]);
  });
});
