import { describe, expect, it } from "vitest";
import { themeCards, themeNicheName, type ThemeNicheTab, type ThemeOption } from "./store-theme.lib";

const theme = (key: string, category: string, extra: Partial<ThemeOption> = {}): ThemeOption => ({
  key,
  name: key.toUpperCase(),
  category,
  thumbnailUrl: null,
  isPremium: false,
  isDefault: false,
  palette: [],
  pageCount: 3,
  editions: [],
  nicheCard: null,
  ...extra,
});

const tshirts = { id: "tshirts", name: { ar: "تيشيرتات", en: "T-shirts" } };
const THEMES = [
  theme("fashion-luxe", "fashion", { editions: [tshirts] }),
  theme("fashion-bold", "fashion"),
  theme("street", "fashion", { editions: [tshirts] }),
  theme("nest", "home"),
  theme("bags-only", "bags", { nicheCard: { niche: "handbags", name: { ar: "شنط", en: "Handbags" }, edition: "handbags" } }),
  theme("bags-native", "bags", { nicheCard: { niche: "backpacks", name: { ar: "شنط ظهر", en: "Backpacks" }, edition: null } }),
];
const TABS: Record<string, ThemeNicheTab> = {
  fashion: { niches: [tshirts], tabLooks: null, looks: { tshirts: ["street", "fashion-luxe", "gone"] } },
  bags: {
    niches: [
      { id: "handbags", name: { ar: "شنط", en: "Handbags" } },
      { id: "backpacks", name: { ar: "شنط ظهر", en: "Backpacks" } },
    ],
    tabLooks: ["bags-native", "bags-only"],
    looks: { handbags: ["bags-only"], backpacks: ["bags-native"] },
  },
};
const view = (category: string | null, niche: string | null, query = "") =>
  themeCards(THEMES, TABS, { category, niche, query }).map(({ theme: t, edition }) => [t.key, edition]);

describe("themeCards", () => {
  it("lists every theme on All, with a switched niche card's own edition", () => {
    expect(view(null, null)).toEqual([
      ["fashion-luxe", null],
      ["fashion-bold", null],
      ["street", null],
      ["nest", null],
      ["bags-only", "handbags"],
      ["bags-native", null],
    ]);
  });

  it("lists an industry tab, then a niche tab's looks in order with the niche's edition", () => {
    expect(view("fashion", null)).toEqual([
      ["fashion-luxe", null],
      ["fashion-bold", null],
      ["street", null],
    ]);
    expect(view("fashion", "tshirts")).toEqual([
      ["street", "tshirts"],
      ["fashion-luxe", "tshirts"],
    ]);
  });

  it("lists a switched industry by its niche templates, one per niche tab", () => {
    expect(view("bags", null)).toEqual([
      ["bags-native", null],
      ["bags-only", "handbags"],
    ]);
    expect(view("bags", "handbags")).toEqual([["bags-only", "handbags"]]);
  });

  it("ignores a niche the tab does not offer, and searches everywhere", () => {
    expect(view("home", "tshirts")).toEqual([["nest", null]]);
    expect(view("fashion", "tshirts", "NEST")).toEqual([["nest", null]]);
  });
});

describe("themeNicheName", () => {
  it("names the niche card's niche, else the edition's, else nothing", () => {
    expect(themeNicheName(THEMES[5]!, null)).toBe("Backpacks");
    expect(themeNicheName(THEMES[0]!, "tshirts")).toBe("T-shirts");
    expect(themeNicheName(THEMES[0]!, null)).toBeNull();
    expect(themeNicheName(THEMES[1]!, "tshirts")).toBeNull();
  });
});
