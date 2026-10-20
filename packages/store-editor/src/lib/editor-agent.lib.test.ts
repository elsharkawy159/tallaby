import { describe, expect, it } from "vitest";
import type { SectionInstance } from "@workspace/store-sections";
import { ancestorsOf, mentionOf } from "./editor-agent.lib";

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

describe("assistant mentions", () => {
  it("names the element and the section it sits in", () => {
    const mention = mentionOf({ target: "page", sectionId: "s1", nodeId: "v1" }, tree(), "en");
    expect(mention).toEqual({
      key: "page:s1:v1",
      ref: { target: "page", sectionId: "s1" },
      nodeId: "v1",
      nodeType: "video",
      label: "Video",
      context: "Video",
    });
  });

  it("is null for nothing selected or a removed element", () => {
    expect(mentionOf(null, tree(), "en")).toBeNull();
    expect(mentionOf({ target: "page", sectionId: "s1", nodeId: "gone" }, tree(), "en")).toBeNull();
  });

  it("lists ancestors from the root, without the element", () => {
    expect(ancestorsOf(tree(), "v1")).toEqual(["root", "c1"]);
    expect(ancestorsOf(tree(), undefined)).toEqual([]);
  });
});
