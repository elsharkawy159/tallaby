import { describe, expect, it } from "vitest";
import type { DesignSystem, SectionInstance } from "@workspace/store-sections";
import { motionSnapshot, replayTargets } from "./editor-motion.lib";

const ds = (motion?: DesignSystem["motion"]): DesignSystem => ({ colors: {}, typography: {}, spacing: {}, motion }) as DesignSystem;
const section = (id: string, animation?: string): SectionInstance =>
  ({ id, sectionId: "custom-section", version: 1, props: {}, ...(animation ? { style: { shell: { animation } } } : {}) }) as SectionInstance;

describe("replayTargets", () => {
  it("replays nothing on the first render, with the preview off, or with Theme › Motion off", () => {
    const next = motionSnapshot(true, ds(), [section("a")]);
    expect(replayTargets(null, next)).toEqual([]);
    expect(replayTargets(next, motionSnapshot(false, ds(), [section("a", "fade")]))).toEqual([]);
    expect(replayTargets(next, motionSnapshot(true, ds({ reveal: false }), [section("a", "fade")]))).toEqual([]);
  });

  it("replays only the sections whose Animation changed, not new ones", () => {
    const prev = motionSnapshot(true, ds(), [section("a"), section("b", "fade")]);
    const next = motionSnapshot(true, ds(), [section("a", "zoom-in"), section("b", "fade"), section("c", "fade")]);
    expect(replayTargets(prev, next)).toEqual(["a"]);
  });

  it("replays every section when the site default or speed changes, or the preview is turned on", () => {
    const prev = motionSnapshot(true, ds(), [section("a")]);
    expect(replayTargets(prev, motionSnapshot(true, ds({ default: "fade" }), [section("a")]))).toBe("all");
    expect(replayTargets(prev, motionSnapshot(true, ds({ speed: "slow" }), [section("a")]))).toBe("all");
    expect(replayTargets(motionSnapshot(false, ds(), [section("a")]), prev)).toBe("all");
  });
});
