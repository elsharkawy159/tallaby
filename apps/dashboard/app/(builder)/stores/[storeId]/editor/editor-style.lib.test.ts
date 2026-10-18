import { describe, expect, it } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { clearStyle, copyStyle, pasteStyle, readEffectiveStyle, readOwnStyle, setStyle } from "./editor-style.lib";
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
