import { describe, expect, it } from "vitest";
import type { DesignSystem } from "@workspace/store-sections";
import { applyThemePreset, matchThemePreset } from "./design.lib";

const empty = (): DesignSystem => ({ colors: {}, typography: {}, spacing: {} });

describe("theme presets (P4B-14)", () => {
  it("sets palette, fonts and radius and keeps the seller's other tokens", () => {
    const ds: DesignSystem = { colors: { background: "#fafafa" }, typography: {}, spacing: { containerMaxWidth: 1024 } };
    const next = applyThemePreset(ds, "ocean");
    expect(next.colors).toMatchObject({ primary: "#0b5cad", background: "#fafafa" });
    expect(next.typography).toEqual({ headingFont: "Cairo", bodyFont: "Cairo" });
    expect(next.spacing).toEqual({ containerMaxWidth: 1024, borderRadius: 8 });
    expect(matchThemePreset(next)).toBe("ocean");
  });

  it("classic clears palette, fonts and radius", () => {
    const next = applyThemePreset(applyThemePreset(empty(), "berry"), "classic");
    expect(next).toEqual(empty());
    expect(matchThemePreset(next)).toBe("classic");
  });

  it("no match once a preset value is changed, and unknown ids change nothing", () => {
    const ds = applyThemePreset(empty(), "forest");
    expect(matchThemePreset({ ...ds, spacing: { borderRadius: 3 } })).toBeNull();
    expect(applyThemePreset(ds, "nope")).toBe(ds);
  });
});
