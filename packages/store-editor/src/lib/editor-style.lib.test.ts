import { describe, expect, it } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import {
  clearDeviceOverrides,
  clearStyle,
  copyStyle,
  hasDeviceOverrides,
  overrideState,
  pasteStyle,
  readEffectiveStyle,
  readOwnStyle,
  setStyle,
} from "./editor-style.lib";
import {
  getNode,
  parsePart,
  readNodeProp,
  readPart,
  setNodeProp,
  splitPartAttr,
  writePart,
} from "./editor-selection.lib";

const hero = (): SectionInstance => ({ id: "s1", sectionId: "hero-banner", version: 1, props: { title: "مرحبا" } });
const custom = (): SectionInstance => ({
  id: "c1",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "n1", type: "vFlex", props: {}, children: [{ id: "n2", type: "heading", props: { text: "عنوان" }, children: [] }] }],
});

describe("part styles", () => {
  it("writes desktop to style.parts and devices to breakpointStyles", () => {
    let s = setStyle(hero(), { kind: "part", part: "title" }, "desktop", { fontSize: "xl", fontWeight: "bold" });
    s = setStyle(s, { kind: "part", part: "title" }, "mobile", { fontSize: "sm" });
    expect(s.style).toEqual({ parts: { title: { fontSize: "xl", fontWeight: "bold" } } });
    expect(s.breakpointStyles).toEqual({ mobile: { parts: { title: { fontSize: "sm" } } } });
    expect(readEffectiveStyle(s, { kind: "part", part: "title" }, "mobile")).toEqual({ fontSize: "sm", fontWeight: "bold" });
    expect(readEffectiveStyle(s, { kind: "part", part: "title" }, "tablet")).toEqual({ fontSize: "xl", fontWeight: "bold" });
  });

  it("drops invalid values and removes keys set to undefined", () => {
    let s = setStyle(hero(), { kind: "part", part: "title" }, "desktop", { fontSize: "huge", color: "primary" });
    expect(readOwnStyle(s, { kind: "part", part: "title" }, "desktop")).toEqual({ color: "primary" });
    s = setStyle(s, { kind: "part", part: "title" }, "desktop", { color: undefined });
    expect(s.style).toEqual({ parts: {} });
  });

  it("resets one device without touching others", () => {
    let s = setStyle(hero(), { kind: "section" }, "desktop", { marginTop: 4 });
    s = setStyle(s, { kind: "section" }, "tablet", { marginTop: 8, hidden: true });
    s = clearStyle(s, { kind: "section" }, "tablet");
    expect(readOwnStyle(s, { kind: "section" }, "tablet")).toEqual({});
    expect(readOwnStyle(s, { kind: "section" }, "desktop")).toEqual({ marginTop: 4 });
  });

  it("never inherits hidden", () => {
    const s = setStyle(hero(), { kind: "section" }, "desktop", { hidden: true });
    expect(readEffectiveStyle(s, { kind: "section" }, "mobile").hidden).toBeUndefined();
  });

  it("styles element nodes and copies styles between targets", () => {
    const s = setStyle(custom(), { kind: "node", nodeId: "n2" }, "tablet", { textAlign: "center" });
    expect(getNode(s, "n2")?.breakpointStyles).toEqual({ tablet: { textAlign: "center" } });
    const clip = copyStyle(s, { kind: "node", nodeId: "n2" });
    const pasted = pasteStyle(s, { kind: "node", nodeId: "n1" }, clip);
    expect(readOwnStyle(pasted, { kind: "node", nodeId: "n1" }, "tablet")).toEqual({ textAlign: "center" });
  });
});

describe("selection helpers", () => {
  it("parses part keys", () => {
    expect(parsePart("title")).toEqual({ kind: "prop", key: "title" });
    expect(parsePart("items.2.text")).toEqual({ kind: "item", collection: "items", index: 2, key: "text" });
    expect(parsePart("a.b")).toBeNull();
    expect(splitPartAttr("s-1::items.0.title")).toEqual({ sectionId: "s-1", part: "items.0.title" });
  });

  it("writes parts in the right locale", () => {
    const target = { locale: "en" as const, defaultLocale: "ar" as const };
    const field = { key: "title", label: { ar: "", en: "" }, type: "text" as const, translatable: true };
    const s = writePart(hero(), "title", field, "Hello", target);
    expect(s.props.title).toBe("مرحبا");
    expect(readPart(s, "title", field, target)).toBe("Hello");
  });

  it("writes node text overlays", () => {
    const node = getNode(custom(), "n2")!;
    const en = setNodeProp(node, "text", "Title", { locale: "en", defaultLocale: "ar", translatable: true });
    expect(en.props.text).toBe("عنوان");
    expect(readNodeProp(en, "text", { locale: "en", defaultLocale: "ar", translatable: true })).toBe("Title");
  });
});

describe("responsive overrides", () => {
  const padding = ["paddingTop"] as const;

  it("reports the device's own value and smaller devices that keep theirs", () => {
    let s = setStyle(hero(), { kind: "section" }, "desktop", { paddingTop: 80 });
    expect(overrideState(s, { kind: "section" }, "desktop", padding)).toEqual({ own: false, below: [] });
    s = setStyle(s, { kind: "section" }, "mobile", { paddingTop: 0 });
    expect(overrideState(s, { kind: "section" }, "desktop", padding)).toEqual({ own: false, below: ["mobile"] });
    expect(overrideState(s, { kind: "section" }, "tablet", padding)).toEqual({ own: false, below: ["mobile"] });
    expect(overrideState(s, { kind: "section" }, "mobile", padding)).toEqual({ own: true, below: [] });
    expect(overrideState(s, { kind: "section" }, "mobile", ["fontSize"])).toEqual({ own: false, below: [] });
  });

  it("finds and clears one device's overrides across the section, parts and elements", () => {
    const node = { kind: "node", nodeId: "n2" } as const;
    let s = setStyle(custom(), node, "mobile", { fontSize: "sm" });
    s = setStyle(s, node, "tablet", { fontSize: "md" });
    s = setStyle(s, { kind: "section" }, "mobile", { paddingTop: 0 });
    expect(hasDeviceOverrides(s, "mobile")).toBe(true);
    expect(hasDeviceOverrides(s, "desktop")).toBe(false);

    const cleared = clearDeviceOverrides(s, "mobile");
    expect(hasDeviceOverrides(cleared, "mobile")).toBe(false);
    expect(cleared.breakpointStyles).toBeUndefined();
    expect(readOwnStyle(cleared, node, "tablet")).toEqual({ fontSize: "md" });
    expect(clearDeviceOverrides(s, "desktop")).toBe(s);
  });

  it("ignores an empty parts map", () => {
    let s = setStyle(hero(), { kind: "part", part: "title" }, "mobile", { fontSize: "sm" });
    s = clearStyle(s, { kind: "part", part: "title" }, "mobile");
    expect(hasDeviceOverrides(s, "mobile")).toBe(false);
  });
});
