import { describe, expect, it } from "vitest";
import {
  ANIMATION_PRESETS,
  animationPresetSchema,
  formatCount,
  normalizePreset,
  parseAnimationSetting,
  parseCount,
  parseNumber,
  resolveAnimation,
  siteAnimationSchema,
  type AnimationDefault,
  type AnimationSetting,
} from "./presets";

describe("resolveAnimation", () => {
  const settings: AnimationSetting[] = ["inherit", "none", ...ANIMATION_PRESETS];
  const defaults: AnimationDefault[] = ["auto", ...ANIMATION_PRESETS];

  it("is null whenever the master switch is off", () => {
    for (const s of settings) for (const d of defaults) expect(resolveAnimation(s, { animationsEnabled: false, animationDefault: d })).toBeNull();
  });
  it("is null for none, the site default for inherit, else the section's own preset", () => {
    for (const d of defaults) {
      const site = { animationsEnabled: true, animationDefault: d };
      expect(resolveAnimation("none", site)).toBeNull();
      expect(resolveAnimation("inherit", site)).toBe(d);
      for (const p of ANIMATION_PRESETS) expect(resolveAnimation(p, site)).toBe(p);
    }
  });
  it("treats a missing section setting as inherit and missing site settings as on with auto", () => {
    expect(resolveAnimation(undefined, undefined)).toBe("auto");
    expect(resolveAnimation(null, { animationDefault: "fade" })).toBe("fade");
    expect(resolveAnimation("zoom-in", {})).toBe("zoom-in");
  });
});

describe("settings schemas", () => {
  it("parses old section data with no animation field as inherit", () => {
    const section = animationPresetSchema.default("inherit");
    expect(section.parse(undefined)).toBe("inherit");
    expect(parseAnimationSetting(undefined)).toBe("inherit");
    expect(parseAnimationSetting("bogus")).toBe("inherit");
  });
  it("maps the first pilot's names", () => {
    expect(parseAnimationSetting("scale-in")).toBe("zoom-in");
    expect(parseAnimationSetting("fade-in")).toBe("fade");
    expect(parseAnimationSetting(" Slide-End ")).toBe("slide-end");
  });
  it("defaults an old site to animations on, auto, normal speed", () => {
    expect(siteAnimationSchema.parse({})).toEqual({ animationsEnabled: true, animationDefault: "auto", animationSpeed: "normal" });
  });
});

describe("normalizePreset", () => {
  it("keeps presets and maps aliases", () => {
    expect(normalizePreset("fade-up")).toBe("fade-up");
    expect(normalizePreset("slide-end")).toBe("slide-end");
    expect(normalizePreset("scale-in")).toBe("zoom-in");
    expect(normalizePreset("")).toBe("fade-up");
  });
  it("rejects none, unknown names and a missing attribute", () => {
    expect(normalizePreset("none")).toBeNull();
    expect(normalizePreset("spin")).toBeNull();
    expect(normalizePreset(undefined)).toBeNull();
  });
});

describe("parseNumber", () => {
  it("falls back on junk and clamps", () => {
    expect(parseNumber("0.2", 1)).toBe(0.2);
    expect(parseNumber("abc", 1)).toBe(1);
    expect(parseNumber("9", 0, 0, 2)).toBe(2);
  });
});

describe("count text", () => {
  it("reads western, grouped and Arabic-Indic digits", () => {
    expect(parseCount("1,080 EGP")).toEqual({ value: 1080, arabicDigits: false, grouped: true });
    expect(parseCount("٣٩ قالب")).toEqual({ value: 39, arabicDigits: true, grouped: false });
    expect(parseCount("مجاني")).toBeNull();
  });
  it("writes counts back the way they were rendered", () => {
    expect(formatCount(1079.6, { arabicDigits: false, grouped: true })).toBe("1,080");
    expect(formatCount(39, { arabicDigits: true, grouped: false })).toBe("٣٩");
  });
});
