import { describe, expect, it } from "vitest";
import { fillOrigin, formatCount, normalizeVariant, parseCount, parseNumber, revealFrom } from "./presets";

describe("normalizeVariant", () => {
  it("keeps the store variants and maps aliases", () => {
    expect(normalizeVariant("fade-up")).toBe("fade-up");
    expect(normalizeVariant("slide-start")).toBe("slide-start");
    expect(normalizeVariant("fade-in")).toBe("fade");
    expect(normalizeVariant(" Scale-In ")).toBe("scale-in");
  });
  it("defaults an empty or auto value to fade-up", () => {
    expect(normalizeVariant("")).toBe("fade-up");
    expect(normalizeVariant("auto")).toBe("fade-up");
  });
  it("rejects none, unknown names and a missing attribute", () => {
    expect(normalizeVariant("none")).toBeNull();
    expect(normalizeVariant("spin")).toBeNull();
    expect(normalizeVariant(undefined)).toBeNull();
  });
});

describe("revealFrom", () => {
  it("slides from the reading start: left in LTR, right in RTL", () => {
    expect(revealFrom("slide-start", "ltr", 30)).toEqual({
      opacity: 0,
      x: -30,
    });
    expect(revealFrom("slide-start", "rtl", 30)).toEqual({ opacity: 0, x: 30 });
  });
  it("only ever animates opacity and transforms", () => {
    for (const v of ["fade-up", "fade", "zoom-in", "slide-start", "scale-in"] as const) {
      for (const key of Object.keys(revealFrom(v, "rtl"))) expect(["opacity", "x", "y", "scale"]).toContain(key);
    }
  });
  it("fills bars along the reading direction", () => {
    expect(fillOrigin("ltr")).toBe("left center");
    expect(fillOrigin("rtl")).toBe("right center");
  });
});

describe("parseNumber", () => {
  it("falls back on junk and clamps", () => {
    expect(parseNumber("0.2", 1)).toBe(0.2);
    expect(parseNumber("abc", 1)).toBe(1);
    expect(parseNumber("", 1)).toBe(1);
    expect(parseNumber("9", 0, 0, 2)).toBe(2);
  });
});

describe("count text", () => {
  it("reads western, grouped and Arabic-Indic digits", () => {
    expect(parseCount("5")).toEqual({
      value: 5,
      arabicDigits: false,
      grouped: false,
    });
    expect(parseCount("1,080 EGP")).toEqual({
      value: 1080,
      arabicDigits: false,
      grouped: true,
    });
    expect(parseCount("٣٩ قالب")).toEqual({
      value: 39,
      arabicDigits: true,
      grouped: false,
    });
    expect(parseCount("مجاني")).toBeNull();
  });
  it("writes counts back the way they were rendered", () => {
    expect(formatCount(1079.6, { arabicDigits: false, grouped: true })).toBe("1,080");
    expect(formatCount(39, { arabicDigits: true, grouped: false })).toBe("٣٩");
  });
});
