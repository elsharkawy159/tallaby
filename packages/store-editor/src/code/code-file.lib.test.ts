import { describe, expect, it } from "vitest";
import type { ComponentNode } from "@workspace/store-sections";
import { splitSectionFile } from "@workspace/store-sections/code-file";
import { normalizeCodeNodeProps, blockedCodeIssues } from "../../../store-sections/src/code/code-node";
import {
  addBlock,
  codeFileOf,
  defaultSettings,
  labelText,
  moveBlock,
  readBlocks,
  readCodeSchema,
  removeBlock,
  setBlockSetting,
  setSetting,
  settingValue,
  starterCodeProps,
  withLocaleText,
  withPreviewProps,
} from "./code-file.lib";
import { nodeLabel, renameNode } from "../lib/editor-selection.lib";

let n = 0;
const random = () => `${String(++n).padStart(8, "0")}-0000-4000-8000-000000000000`;

describe("starter code section", () => {
  const props = starterCodeProps(random);

  it("round-trips through the real file split", () => {
    const split = splitSectionFile(codeFileOf(props));
    expect(split.issues).toEqual([]);
    expect(split.source).toBe(props.source);
    expect(split.css).toBe(props.css);
    expect(split.schema).toEqual(props.schema);
  });

  it("is valid for the save-time normaliser and has no blocked constructs", () => {
    const { props: normalized, issues } = normalizeCodeNodeProps(props);
    expect(issues).toEqual([]);
    expect(blockedCodeIssues(normalized)).toEqual([]);
    expect(normalized.blocks.map((b) => b.id)).toEqual((props.blocks as { id: string }[]).map((b) => b.id));
    expect(normalized.settings.title).toEqual({ ar: "عنوان القسم", en: "Section heading" });
  });

  it("has text in both languages and never names another platform", () => {
    const text = JSON.stringify(props);
    expect(text).not.toMatch(/shopify/i);
    const schema = readCodeSchema(props.schema);
    for (const def of schema.settings) {
      expect(labelText(def.label, "ar")).not.toBe(labelText(def.label, "en"));
    }
    for (const block of readBlocks(props.blocks)) expect(block.settings.label).toEqual({ ar: expect.any(String), en: expect.any(String) });
  });
});

describe("readCodeSchema", () => {
  it("keeps settings, blocks and the block cap", () => {
    const schema = readCodeSchema({
      settings: [{ type: "text", id: "a", label: "A" }, { type: "header", content: "Head" }, { type: "text" }, "junk"],
      blocks: [{ type: "slide", name: { ar: "شريحة", en: "Slide" }, settings: [{ type: "image_picker", id: "img", label: "Img" }] }, { name: "no type" }],
      max_blocks: 80,
    });
    expect(schema.settings.map((s) => s.type)).toEqual(["text", "header"]);
    expect(schema.blocks.map((b) => b.type)).toEqual(["slide"]);
    expect(schema.maxBlocks).toBe(50);
    expect(readCodeSchema(null)).toEqual({ name: undefined, settings: [], blocks: [], maxBlocks: 50 });
  });
});

describe("setting values", () => {
  it("reads stored values, else defaults; text is per language", () => {
    expect(settingValue({ type: "text", id: "t", default: "Hi" }, {})).toEqual({ ar: "Hi", en: "Hi" });
    expect(settingValue({ type: "text", id: "t" }, { t: { ar: "أ", en: "A" } })).toEqual({ ar: "أ", en: "A" });
    expect(settingValue({ type: "number", id: "n", default: 3 }, { n: 7 })).toBe(7);
    expect(withLocaleText({ ar: "أ", en: "A" }, "en", "B")).toEqual({ ar: "أ", en: "B" });
  });

  it("sets and clears values", () => {
    expect(setSetting({ a: 1 }, "b", 2)).toEqual({ a: 1, b: 2 });
    expect(setSetting({ a: 1, b: 2 }, "b", undefined)).toEqual({ a: 1 });
    expect(setSetting({ a: 1 }, "a", null)).toEqual({});
  });

  it("gives new blocks their defaults", () => {
    expect(defaultSettings([{ type: "text", id: "t", default: "x" }, { type: "checkbox", id: "c", default: true }, { type: "header", content: "h" }, { type: "url", id: "u" }])).toEqual({
      t: { ar: "x", en: "x" },
      c: true,
    });
  });
});

describe("blocks", () => {
  const def = { type: "item", name: "Item", settings: [{ type: "text", id: "label", default: "New" }] };
  const blocks = [
    { id: "b1", type: "item", settings: {} },
    { id: "b2", type: "item", settings: {} },
    { id: "b3", type: "item", settings: {} },
  ];

  it("adds up to the cap, with a fresh valid id and defaults", () => {
    const next = addBlock(blocks, def, 4, random);
    expect(next).toHaveLength(4);
    expect(next[3]).toMatchObject({ type: "item", settings: { label: { ar: "New", en: "New" } } });
    expect(next[3]!.id).toMatch(/^b_[A-Za-z0-9]{12}$/);
    expect(addBlock(next, def, 4, random)).toHaveLength(4);
  });

  it("reorders, removes and edits one block", () => {
    expect(moveBlock(blocks, 0, 2).map((b) => b.id)).toEqual(["b2", "b3", "b1"]);
    expect(moveBlock(blocks, 0, 9).map((b) => b.id)).toEqual(["b1", "b2", "b3"]);
    expect(removeBlock(blocks, "b2").map((b) => b.id)).toEqual(["b1", "b3"]);
    expect(setBlockSetting(blocks, "b3", "label", "x")[2]!.settings).toEqual({ label: "x" });
  });
});

describe("Layers name of a code node", () => {
  it("reads and renames props.name (not label)", () => {
    const node = { id: "n1", type: "code", props: { source: "x" }, children: [] } as ComponentNode;
    expect(nodeLabel(node, "en")).toBe("");
    const renamed = renameNode(node, "  Hero code ");
    expect(renamed.props).toEqual({ source: "x", name: "Hero code" });
    expect(nodeLabel(renamed, "ar")).toBe("Hero code");
    expect(renameNode(renamed, " ").props).toEqual({ source: "x" });
  });
});

describe("withPreviewProps", () => {
  it("replaces the props with the host's and keeps the Layers name", () => {
    const node = { id: "n1", type: "code", props: { name: "Hero", source: "old", settings: { a: 1 } }, children: [] } as ComponentNode;
    const next = withPreviewProps(node, { apiVersion: 1, source: "new", schema: {}, settings: {}, blocks: [], name: "ignored" });
    expect(next.props).toEqual({ apiVersion: 1, source: "new", schema: {}, settings: {}, blocks: [], name: "Hero" });
    expect(withPreviewProps({ ...node, props: {} }, { source: "s" }).props).toEqual({ source: "s" });
  });
});
