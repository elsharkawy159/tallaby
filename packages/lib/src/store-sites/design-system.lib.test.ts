import { describe, expect, it } from "vitest";
import { designSystemSchema } from "@workspace/store-sections";
import { designSystemColumns, motionColumn, withStoredMotion } from "./design-system.lib";

describe("withStoredMotion", () => {
  it("leaves a null motion out, so a store that never saved one reads as before 0162", () => {
    const row = { colors: { primary: "#000000" }, typography: {}, spacing: {}, motion: null, version: 3 };
    const read = withStoredMotion(row);
    expect(read).toEqual({ colors: { primary: "#000000" }, typography: {}, spacing: {}, version: 3 });
    expect("motion" in read).toBe(false);
  });

  it("keeps a stored motion", () => {
    expect(withStoredMotion({ colors: {}, motion: { reveal: false, intensity: "subtle" } })).toEqual({
      colors: {},
      motion: { reveal: false, intensity: "subtle" },
    });
  });
});

describe("motionColumn", () => {
  it("stores null for no settings or only unset ones", () => {
    expect(motionColumn(undefined)).toBeNull();
    expect(motionColumn({})).toBeNull();
    expect(motionColumn({ default: undefined, speed: undefined })).toBeNull();
  });

  it("stores the set keys only", () => {
    expect(motionColumn({ hoverZoom: false, speed: undefined, intensity: "expressive" })).toEqual({ hoverZoom: false, intensity: "expressive" });
  });
});

describe("designSystemColumns", () => {
  it("writes every column, motion null when the design system has none", () => {
    const ds = designSystemSchema.parse({ colors: { primary: "#112233" }, typography: {}, spacing: { borderRadius: 8 } });
    expect(designSystemColumns(ds)).toEqual({ colors: { primary: "#112233" }, typography: {}, spacing: { borderRadius: 8 }, motion: null });
  });

  it("round-trips motion through the schema; unknown values are dropped", () => {
    const ds = designSystemSchema.parse({ colors: {}, typography: {}, spacing: {}, motion: { reveal: false, intensity: "loud", speed: "fast" } });
    const columns = designSystemColumns(ds);
    expect(columns.motion).toEqual({ reveal: false, speed: "fast" });
    expect(designSystemSchema.parse(withStoredMotion({ ...columns, version: 1 })).motion).toEqual({ reveal: false, speed: "fast" });
  });

  it("keeps a known intensity", () => {
    const ds = designSystemSchema.parse({ colors: {}, typography: {}, spacing: {}, motion: { intensity: "subtle" } });
    expect(designSystemColumns(ds).motion).toEqual({ intensity: "subtle" });
  });
});
