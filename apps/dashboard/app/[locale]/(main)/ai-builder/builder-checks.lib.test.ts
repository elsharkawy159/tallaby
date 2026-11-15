import { describe, expect, it } from "vitest";
import type { ComponentNode, PageContent } from "@workspace/store-sections/config";
import { parseBuilderState, type BuilderState } from "./builder.dto";
import { buildItemKeys, fileBatchRows, reviewIssuesV2, type ReviewSnapshotV2 } from "./builder.lib";
import { assignStockPhotos, brandColors, heroImageTargets, hideEmptyDataSections, isPeopleFree, leftoverTemplateText, originalTexts, type CheckPage } from "./builder-checks.lib";

const node = (id: string, type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode => ({ id, type: type as ComponentNode["type"], props, children });
const section = (id: string, tree: ComponentNode[]) => ({ id, sectionId: "custom-section", version: 1, props: {}, componentTree: tree }) as PageContent["sections"][number];
const page = (id: string, sections: PageContent["sections"], extra: Partial<CheckPage> = {}): CheckPage => ({ id, slug: id, isHome: false, draftVersion: 1, content: { sections }, ...extra });

describe("the brand step", () => {
  it("puts the seller's colour on the template's palette and keeps its neutrals", () => {
    const base = { primary: "#000000", background: "#ffffff", foreground: "#111111", muted: "#f4f4f4", border: "#e5e5e5" };
    const branded = brandColors(base, "#1e5bb8");
    expect(branded?.colors).toMatchObject({ primary: "#1e5bb8", background: "#ffffff", foreground: "#111111", muted: "#f4f4f4", border: "#e5e5e5" });
    expect(branded?.colors.accent).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("keeps the template's colours when the seller chose them (or gave none)", () => {
    expect(brandColors({ primary: "#000000" }, null)).toBeNull();
    expect(brandColors({ primary: "#000000" }, "green")).toBeNull();
  });
});

describe("hiding sections with nothing to show (D3)", () => {
  const products = section("s1", [node("root1", "section", {}, [node("list", "productList", { source: "newest" })])]);
  const third = section("s2", [node("root2", "section", {}, [node("row", "productList", { source: "category", categoryIndex: 3 })])]);
  const tiles = section("s3", [node("root3", "section", {}, [node("tiles", "categoryList")])]);
  const hero = section("s4", [node("root4", "section", {}, [node("h", "heading", { text: "Hi" })])]);
  const pages = [page("home", [hero, products, third, tiles], { isHome: true })];

  it("hides every product and category section of a store with no products, on every device", () => {
    const { pages: changed, hidden } = hideEmptyDataSections(pages, { liveProducts: 0, categories: 0 });
    expect(hidden).toBe(3);
    const root = changed[0]!.content.sections[1]!.componentTree![0]!;
    expect(root.style).toMatchObject({ hidden: true });
    expect(root.breakpointStyles).toMatchObject({ tablet: { hidden: true }, mobile: { hidden: true } });
    // Nothing added: same sections, same nodes.
    expect(changed[0]!.content.sections.map((s) => s.componentTree![0]!.children.map((c) => c.id))).toEqual([["h"], ["list"], ["row"], ["tiles"]]);
    expect(changed[0]!.content.sections[0]).toBe(hero);
  });

  it("with products, hides only a row bound to a category the store hasn't got", () => {
    const { hidden } = hideEmptyDataSections(pages, { liveProducts: 5, categories: 2 });
    expect(hidden).toBe(1);
    expect(hideEmptyDataSections(pages, { liveProducts: 5, categories: 3 }).hidden).toBe(0);
  });
});

describe("leftover template text", () => {
  it("counts texts still exactly as the template wrote them", () => {
    const before = [page("home", [section("s", [node("r", "section", {}, [node("h", "heading", { text: "Handmade candles for every home" }), node("b", "button", { label: "Shop" })])])])];
    const originals = originalTexts(before, "ar");
    expect(originals).toEqual(["Handmade candles for every home"]);
    expect(leftoverTemplateText(before, originals, "ar")).toBe(1);
    const after = [page("home", [section("s", [node("r", "section", {}, [node("h", "heading", { text: "عطور رجالي من القاهرة" })])])])];
    expect(leftoverTemplateText(after, originals, "ar")).toBe(0);
  });
});

describe("hero and about photos (D7)", () => {
  const home = page(
    "home",
    [
      section("hero", [node("r", "section", {}, [node("img1", "image", { src: "https://images.pexels.com/photos/1/a.jpg" }), node("list", "productList", {}, [node("card", "image", { src: "x", bind: "image" })])])]),
      section("later", [node("r2", "section", {}, [node("img2", "image", { src: "https://images.pexels.com/photos/2/b.jpg" })])]),
    ],
    { isHome: true },
  );
  const about = page("about", [section("a", [node("ra", "section", {}, [node("img3", "image", { src: "y" })])])]);

  it("only swaps photos the template already has in the hero and the about page, never list cards", () => {
    expect(heroImageTargets([home, about])).toEqual([
      { pageId: "home", nodeIds: ["img1"] },
      { pageId: "about", nodeIds: ["img3"] },
    ]);
    const { pages, placed } = assignStockPhotos([home, about], ["https://images.pexels.com/photos/9/new.jpg"]);
    expect(placed).toBe(1);
    expect(pages).toHaveLength(1);
    const swapped = pages[0]!.content.sections[0]!.componentTree![0]!.children[0]!;
    expect(swapped.props.src).toBe("https://images.pexels.com/photos/9/new.jpg");
  });

  it("skips photos of people or body parts, and photos with no description", () => {
    expect(isPeopleFree("Brown leather bag on a wooden table")).toBe(true);
    expect(isPeopleFree("Woman holding a leather bag")).toBe(false);
    expect(isPeopleFree("Close-up of hands")).toBe(false);
    expect(isPeopleFree("")).toBe(false);
  });
});

describe("v2 build steps", () => {
  const priced = (n: number) => Array.from({ length: n }, (_, i) => ({ price: i % 4 === 0 ? null : 100 }));
  const state = (patch: Partial<BuilderState>) => ({ ...parseBuilderState({}), ...patch });

  it("orders the v2 items, with one file batch per 10 priced rows", () => {
    expect(buildItemKeys(state({ flow: "v2", fileRows: [] }))).toEqual(["store", "settings", "template", "brand", "categories", "site_copy", "hero_photos", "catalog", "shipping", "policy", "checks", "publish"]);
    const rows = priced(28) as BuilderState["fileRows"];
    const keys = buildItemKeys(state({ flow: "v2", fileRows: rows }));
    // 28 rows, 7 without a price: 21 to add, 3 batches.
    expect(keys.filter((key) => key.startsWith("products_file:"))).toEqual(["products_file:0", "products_file:1", "products_file:2"]);
    expect(fileBatchRows(rows, 2)).toHaveLength(1);
    // v1 builds keep their list.
    expect(buildItemKeys(state({}))).toContain("notes");
  });

  const snapshot = (patch: Partial<ReviewSnapshotV2> = {}): ReviewSnapshotV2 => ({
    storeId: "s1",
    state: { ...parseBuilderState({}), logo: "l.png", shipping: { mode: "skip" }, returns: null },
    items: new Map([["site_copy", { status: "done", data: {}, productId: null }]]),
    products: [],
    zoneCount: 0,
    returnPolicy: "ok",
    invalidPages: 0,
    built: [],
    published: true,
    publishError: null,
    flags: [],
    fileNotAdded: 0,
    ...patch,
  });

  it("puts 'add your first product' on the to-do list of a store with none (D3)", () => {
    expect(reviewIssuesV2(snapshot()).map((issue) => issue.code)).toEqual(["addFirstProduct"]);
  });

  it("lists drafts by what they miss (D4), and a failed publish first", () => {
    const codes = reviewIssuesV2(
      snapshot({
        published: false,
        built: [
          { id: "a", live: true, missing: [] },
          { id: "b", live: false, missing: ["photo"] },
          { id: "c", live: false, missing: ["photo", "stock"] },
        ],
        flags: [{ code: "sectionsHidden", count: 2 }, { code: "demoTextLeft", count: 0 }],
      }),
    );
    expect(codes.map((issue) => issue.code)).toEqual(["publishFailed", "productsWithoutPhoto", "productsWithoutStock", "sectionsHidden"]);
    expect(codes.find((issue) => issue.code === "productsWithoutPhoto")?.params).toEqual({ count: 2 });
  });
});
