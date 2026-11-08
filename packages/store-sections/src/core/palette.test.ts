import { describe, expect, it } from "vitest";
import {
  AA_TEXT_CONTRAST,
  contrastRatio,
  derivePaletteFromPrimary,
  hexToOklch,
  hexToRgb,
  inkOnColor,
  isValidHex,
  normalizeHex,
  oklchToHex,
  relativeLuminance,
  rgbToHex,
  type DesignSystemColors,
} from "./palette";
import { isLightHex } from "./theme";

const LIGHT_BASE: DesignSystemColors = {
  primary: "#145163",
  secondary: "#f2f5f4",
  background: "#ffffff",
  foreground: "#10242b",
  muted: "#5c6d72",
  border: "#e2e8e7",
  accent: "#fdad28",
  destructive: "#dc2626",
};
const DARK_BASE: DesignSystemColors = {
  primary: "#d4af37",
  secondary: "#1c1c1c",
  background: "#0b0b0b",
  foreground: "#f5f5f5",
  muted: "#a3a3a3",
  border: "#2a2a2a",
  accent: "#e8c872",
  destructive: "#ef4444",
};
const NEUTRALS = ["background", "foreground", "muted", "border", "destructive"] as const;
const HEX6 = /^#[0-9a-f]{6}$/;

const PRIMARIES = [
  "#ffffff", // very light
  "#fff8dc", // cream
  "#ffff00", // saturated yellow
  "#00ff00", // saturated green
  "#ff0000", // saturated red
  "#0000ff", // saturated blue
  "#ff00ff", // magenta
  "#808080", // mid grey
  "#000000", // very dark
  "#0a0a2a", // near-black navy
  "#145163", // Classic brand
  "#e91e63", // pink
  "#f97316", // orange
];

describe("hex helpers", () => {
  it("validates and normalises hex", () => {
    expect(isValidHex("#abc")).toBe(true);
    expect(isValidHex("ABCDEF")).toBe(true);
    expect(isValidHex("#abcd")).toBe(false);
    expect(isValidHex("rgb(0,0,0)")).toBe(false);
    expect(isValidHex(42)).toBe(false);
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex(" 12AB9f ")).toBe("#12ab9f");
    expect(normalizeHex("#12")).toBeNull();
  });

  it("round-trips hex ↔ rgb ↔ oklch", () => {
    expect(hexToRgb("#ff8000")).toEqual([255, 128, 0]);
    expect(rgbToHex([255, 128, 0])).toBe("#ff8000");
    for (const hex of PRIMARIES) {
      expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
    }
    expect(hexToOklch("#ffffff")!.l).toBeCloseTo(1, 3);
    expect(hexToOklch("#000000")!.l).toBeCloseTo(0, 3);
    expect(hexToOklch("#808080")!.c).toBe(0);
  });

  it("gamut-maps out-of-range OKLCH to valid sRGB hex", () => {
    expect(oklchToHex({ l: 0.9, c: 0.4, h: 140 })).toMatch(HEX6);
    expect(oklchToHex({ l: 0.2, c: 0.5, h: 300 })).toMatch(HEX6);
  });

  it("computes WCAG luminance and contrast", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBe(0);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(contrastRatio("#abc", "#abc")).toBe(1);
  });

  it("picks the same ink as isLightHex", () => {
    for (const hex of PRIMARIES) {
      expect(inkOnColor(hex)).toBe(isLightHex(hex) ? "#10242b" : "#ffffff");
    }
  });
});

describe("derivePaletteFromPrimary", () => {
  for (const [name, base] of [
    ["light", LIGHT_BASE],
    ["dark", DARK_BASE],
  ] as const) {
    describe(`${name} base`, () => {
      for (const primary of PRIMARIES) {
        it(`${primary}: valid hex, AA contrast, neutrals kept`, () => {
          const out = derivePaletteFromPrimary(primary, base);
          for (const value of Object.values(out.colors)) expect(value).toMatch(HEX6);
          for (const key of NEUTRALS) expect(out.colors[key]).toBe(base[key]);
          const brand = out.colors.primary!;
          expect(contrastRatio(brand, base.background!)).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
          expect(contrastRatio(inkOnColor(brand), brand)).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
          expect(out.adjusted).toBe(brand !== normalizeHex(primary));
          expect(out.notes.length).toBe(out.adjusted ? 1 : 0);
          // Deterministic.
          expect(derivePaletteFromPrimary(primary, base)).toEqual(out);
        });
      }

      it("keeps the shelf surface at the base's lightness (dark stays dark)", () => {
        const out = derivePaletteFromPrimary("#e91e63", base);
        const shelf = hexToOklch(out.colors.secondary!)!;
        expect(shelf.l).toBeCloseTo(hexToOklch(base.secondary!)!.l, 2);
        expect(shelf.c).toBeLessThanOrEqual(0.026);
        expect(Math.abs(shelf.h - hexToOklch("#e91e63")!.h)).toBeLessThan(15);
      });
    });
  }

  it("keeps a colour that already passes exactly", () => {
    const out = derivePaletteFromPrimary("#145163", LIGHT_BASE);
    expect(out).toMatchObject({ adjusted: false, notes: [] });
    expect(out.colors.primary).toBe("#145163");
  });

  it("darkens a light colour on a light base and says so", () => {
    const out = derivePaletteFromPrimary("#FFFF00", LIGHT_BASE);
    expect(out.adjusted).toBe(true);
    expect(out.notes).toEqual(["primary_darkened_for_text"]);
    expect(relativeLuminance(out.colors.primary!)).toBeLessThan(relativeLuminance("#ffff00"));
    // Hue survives the nudge.
    expect(Math.abs(hexToOklch(out.colors.primary!)!.h - hexToOklch("#ffff00")!.h)).toBeLessThan(10);
  });

  it("lightens a dark colour on a dark base and says so", () => {
    const out = derivePaletteFromPrimary("#0a0a2a", DARK_BASE);
    expect(out.notes).toEqual(["primary_lightened_for_text"]);
    expect(relativeLuminance(out.colors.primary!)).toBeGreaterThan(relativeLuminance("#0a0a2a"));
  });

  it("nudges minimally (just past the threshold)", () => {
    const out = derivePaletteFromPrimary("#ff0000", LIGHT_BASE);
    const ratio = contrastRatio(out.colors.primary!, "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
    expect(ratio).toBeLessThan(5);
  });

  it("derives the accent from the primary's hue at the base accent's lightness", () => {
    const out = derivePaletteFromPrimary("#0000ff", LIGHT_BASE);
    const accent = hexToOklch(out.colors.accent!)!;
    expect(accent.l).toBeCloseTo(hexToOklch(LIGHT_BASE.accent!)!.l, 2);
    expect(Math.abs(accent.h - hexToOklch("#0000ff")!.h)).toBeLessThan(15);
  });

  it("gives a grey primary grey derived colours", () => {
    const out = derivePaletteFromPrimary("#808080", LIGHT_BASE);
    expect(hexToOklch(out.colors.accent!)!.c).toBeLessThan(0.01);
    expect(hexToOklch(out.colors.secondary!)!.c).toBeLessThan(0.01);
  });

  it("works with a sparse base (only some keys set)", () => {
    const out = derivePaletteFromPrimary("#abc", { background: "#121212" });
    expect(out.colors.background).toBe("#121212");
    expect(out.colors.foreground).toBeUndefined();
    expect(hexToOklch(out.colors.secondary!)!.l).toBeGreaterThan(hexToOklch("#121212")!.l);
    expect(contrastRatio(out.colors.primary!, "#121212")).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);

    const empty = derivePaletteFromPrimary("#145163", {});
    expect(empty.colors.primary).toBe("#145163");
    expect(empty.colors.background).toBeUndefined();
    expect(hexToOklch(empty.colors.secondary!)!.l).toBeLessThan(1);
  });

  it("keeps a non-hex neutral as-is and checks contrast against white", () => {
    const out = derivePaletteFromPrimary("#ffff00", { background: "oklch(1 0 0)", border: "rgb(0,0,0)" });
    expect(out.colors.background).toBe("oklch(1 0 0)");
    expect(out.colors.border).toBe("rgb(0,0,0)");
    expect(contrastRatio(out.colors.primary!, "#ffffff")).toBeGreaterThanOrEqual(AA_TEXT_CONTRAST);
  });

  it("rejects an invalid primary", () => {
    expect(() => derivePaletteFromPrimary("red", LIGHT_BASE)).toThrow("invalid_primary");
  });

  it("does not mutate the base", () => {
    const base = { ...LIGHT_BASE };
    derivePaletteFromPrimary("#ff00ff", base);
    expect(base).toEqual(LIGHT_BASE);
  });
});
