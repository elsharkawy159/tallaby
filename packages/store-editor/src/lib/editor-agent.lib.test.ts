import { describe, expect, it } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { agentHistory, agentOutline, ancestorsOf, composerKeyAction, mentionOf, sectionNameOf } from "./editor-agent.lib";

const tree = (): SectionInstance => ({
  id: "s1",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [
    {
      id: "root",
      type: "section",
      props: { label: "فيديو", translations: { en: { label: "Video" } } },
      children: [{ id: "c1", type: "container", props: {}, children: [{ id: "v1", type: "video", props: { url: "" }, children: [] }] }],
    },
  ],
});

const codeSection = (): SectionInstance => ({
  id: "s2",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "r2", type: "section", props: {}, children: [{ id: "k2", type: "code", props: { name: "Size guide", source: "" }, children: [] }] }],
});

const contexts = { page: "Home", header: "Header", footer: "Footer" };
const sectionMention = { key: "page:s1", ref: { target: "page", sectionId: "s1" }, label: "Video", context: "Home", kind: "tree" };

describe("assistant mentions: always the whole section", () => {
  it("clicking an element names its section", () => {
    expect(mentionOf({ target: "page", sectionId: "s1", nodeId: "v1" }, tree(), "en", contexts)).toEqual(sectionMention);
  });

  it("clicking a part names its section", () => {
    expect(mentionOf({ target: "page", sectionId: "s1", part: "title" }, tree(), "en", contexts)).toEqual(sectionMention);
  });

  it("clicking the section itself (overlay, handle) names the section", () => {
    expect(mentionOf({ target: "page", sectionId: "s1" }, tree(), "en", contexts)).toEqual(sectionMention);
  });

  it("an element that is gone still names its section", () => {
    expect(mentionOf({ target: "page", sectionId: "s1", nodeId: "gone" }, tree(), "en", contexts)?.ref).toEqual({ target: "page", sectionId: "s1" });
  });

  it("keeps one key per section, whatever is clicked in it", () => {
    const keys = [{ nodeId: "v1" }, { nodeId: "c1" }, { part: "x" }, {}].map((extra) => mentionOf({ target: "page", sectionId: "s1", ...extra }, tree(), "en", contexts)?.key);
    expect(new Set(keys)).toEqual(new Set(["page:s1"]));
  });

  it("names the header and footer by their place", () => {
    expect(mentionOf({ target: "header", nodeId: "v1" }, tree(), "en", contexts)).toMatchObject({ key: "header", ref: { target: "header" }, context: "Header" });
    expect(mentionOf({ target: "footer" }, tree(), "ar", contexts)).toMatchObject({ key: "footer", label: "فيديو", context: "Footer" });
  });

  it("names a code section by its code element, and marks it as code", () => {
    expect(mentionOf({ target: "page", sectionId: "s2", nodeId: "k2" }, codeSection(), "en", contexts)).toMatchObject({ label: "Size guide", kind: "code" });
  });

  it("has no mention with nothing selected (the turn targets the page)", () => {
    expect(mentionOf(null, tree(), "en", contexts)).toBeNull();
    expect(mentionOf({ target: "page", sectionId: "s1" }, null, "en", contexts)).toBeNull();
  });

  it("lists ancestors from the root, without the element", () => {
    expect(ancestorsOf(tree(), "v1")).toEqual(["root", "c1"]);
    expect(ancestorsOf(tree(), undefined)).toEqual([]);
  });
});

describe("assistant turn helpers", () => {
  it("outlines the page with the chip's names", () => {
    expect(agentOutline({ sections: [tree(), codeSection()] }, "en")).toEqual([
      { id: "s1", name: "Video", kind: "tree" },
      { id: "s2", name: "Size guide", kind: "code" },
    ]);
    expect(sectionNameOf({ id: "x", sectionId: "unknown-type", version: 1, props: {} }, "en")).toBe("unknown-type");
  });

  it("keeps the last 6 turns, capped", () => {
    const turns = Array.from({ length: 9 }, (_, i) => ({ role: i % 2 ? ("assistant" as const) : ("user" as const), text: i === 8 ? "x".repeat(3000) : `t${i}` }));
    const history = agentHistory(turns);
    expect(history).toHaveLength(6);
    expect(history[0]!.text).toBe("t3");
    expect(history[5]!.text).toHaveLength(2000);
  });

  it("Ctrl/⌘+Enter sends; Enter sends on desktop only; Shift+Enter adds a line; Escape stops", () => {
    const desktop = { touch: false, pending: false };
    const phone = { touch: true, pending: false };
    expect(composerKeyAction({ key: "Enter", ctrlKey: true }, desktop)).toBe("send");
    expect(composerKeyAction({ key: "Enter", metaKey: true }, phone)).toBe("send");
    expect(composerKeyAction({ key: "Enter" }, desktop)).toBe("send");
    expect(composerKeyAction({ key: "Enter", shiftKey: true }, desktop)).toBeNull();
    expect(composerKeyAction({ key: "Enter" }, phone)).toBeNull();
    expect(composerKeyAction({ key: "Enter", isComposing: true }, desktop)).toBeNull();
    expect(composerKeyAction({ key: "Escape" }, { touch: false, pending: true })).toBe("stop");
    expect(composerKeyAction({ key: "Escape" }, desktop)).toBeNull();
  });
});
