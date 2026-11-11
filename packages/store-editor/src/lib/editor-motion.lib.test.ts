import { describe, expect, it } from "vitest";
import type { DesignSystem, SectionInstance } from "@workspace/store-sections";
import { motionSnapshot, replayTargets, scrollReplays, sectionScrollTargets } from "./editor-motion.lib";

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

const node = (id: string, type: string, props: Record<string, unknown> = {}, children: unknown[] = [], style?: unknown) => ({ id, type, props, children, ...(style ? { style } : {}) });
/** A section with a framed main photo (`role: "image"`) and a title box. */
const photoSection = (id: string, shell?: Record<string, unknown>, imageProps: Record<string, unknown> = {}): SectionInstance =>
  ({
    id,
    sectionId: "custom-section",
    version: 1,
    props: {},
    ...(shell ? { style: { shell } } : {}),
    componentTree: [
      node(`${id}-root`, "section", {}, [
        node(`${id}-copy`, "div", {}, [node(`${id}-title`, "heading", { role: "title", text: "Hi" })]),
        node(`${id}-frame`, "div", {}, [node(`${id}-photo`, "image", { role: "image", src: "/a.jpg", ...imageProps })]),
      ]),
    ],
  }) as unknown as SectionInstance;

describe("intensity", () => {
  it("replays every section when Theme › Motion's intensity changes", () => {
    const prev = motionSnapshot(true, ds(), [section("a")]);
    expect(replayTargets(prev, motionSnapshot(true, ds({ intensity: "expressive" }), [section("a")]))).toBe("all");
  });
});

describe("sectionScrollTargets", () => {
  it("offers parallax and zoom on a photo section, fade-exit only on the page's first section", () => {
    // Any section but the first also offers reveal-scrub (docs/systems/plan.md §10, L6).
    expect(sectionScrollTargets(photoSection("a"), false).effects).toEqual(["parallax", "zoom", "reveal-scrub"]);
    expect(sectionScrollTargets(photoSection("a"), true).effects).toEqual(["parallax", "zoom", "fade-exit"]);
  });

  it("offers nothing on a section with nothing to move, and parallax/zoom with a background photo", () => {
    expect(sectionScrollTargets(section("a"), true).effects).toEqual([]);
    const bg = { ...section("b"), style: { shell: { bgImage: "/bg.jpg" } } } as SectionInstance;
    expect(sectionScrollTargets(bg, false).effects).toEqual(["parallax", "zoom"]);
  });
});

describe("scrollReplays", () => {
  it("plays a section's changed Scroll effect on its target, never on the first render or a new section", () => {
    const prev = motionSnapshot(true, ds(), [photoSection("a"), photoSection("b")]);
    const next = motionSnapshot(true, ds(), [photoSection("a", { scrollEffect: "fade-exit" }), photoSection("b", { scrollEffect: "parallax" }), photoSection("c", { scrollEffect: "zoom" })]);
    expect(scrollReplays(null, next)).toEqual([]);
    expect(scrollReplays(prev, next)).toEqual([
      { sectionId: "a", effect: "fade-exit", targetId: "a-copy" },
      { sectionId: "b", effect: "parallax", targetId: "b-photo" },
    ]);
  });

  it("plays nothing when switched to None, unchanged, or not playable (fade-exit off the first section)", () => {
    const prev = motionSnapshot(true, ds(), [photoSection("a", { scrollEffect: "zoom" }), photoSection("b")]);
    expect(scrollReplays(prev, motionSnapshot(true, ds(), [photoSection("a"), photoSection("b", { scrollEffect: "fade-exit" })]))).toEqual([]);
    expect(scrollReplays(prev, motionSnapshot(true, ds(), [photoSection("a", { scrollEffect: "zoom" }), photoSection("b")]))).toEqual([]);
  });

  it("plays a background photo's effect without a target", () => {
    const prev = motionSnapshot(true, ds(), [photoSection("a"), photoSection("b", { bgImage: "/bg.jpg" })]);
    const next = motionSnapshot(true, ds(), [photoSection("a"), photoSection("b", { bgImage: "/bg.jpg", scrollEffect: "zoom" })]);
    expect(scrollReplays(prev, next)).toEqual([{ sectionId: "b", effect: "zoom", targetId: null }]);
  });

  it("plays an image's own changed Scroll effect on that image", () => {
    const prev = motionSnapshot(true, ds(), [photoSection("a")]);
    expect(scrollReplays(prev, motionSnapshot(true, ds(), [photoSection("a", undefined, { scrollEffect: "zoom" })]))).toEqual([
      { sectionId: "a", effect: "zoom", targetId: "a-photo" },
    ]);
    expect(scrollReplays(prev, motionSnapshot(true, ds(), [photoSection("a", undefined, { scrollEffect: "none" })]))).toEqual([]);
  });

  it("plays every effect when speed or intensity changes, nothing with the preview or Theme › Motion off", () => {
    const sections = [photoSection("a"), photoSection("b", { scrollEffect: "parallax" })];
    const prev = motionSnapshot(true, ds(), sections);
    expect(scrollReplays(prev, motionSnapshot(true, ds({ intensity: "subtle" }), sections))).toEqual([{ sectionId: "b", effect: "parallax", targetId: "b-photo" }]);
    expect(scrollReplays(prev, motionSnapshot(false, ds(), [photoSection("a", { scrollEffect: "zoom" }), sections[1]!]))).toEqual([]);
    expect(scrollReplays(prev, motionSnapshot(true, ds({ reveal: false }), [photoSection("a", { scrollEffect: "zoom" }), sections[1]!]))).toEqual([]);
  });
});
