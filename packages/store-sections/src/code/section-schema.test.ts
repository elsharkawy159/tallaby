import { describe, expect, it } from "vitest";
import { normalizeBlocks, normalizeSettings, parseSectionSchema, type SettingDef } from "./section-schema";

const parse = (input: unknown) => parseSectionSchema(input);
const ok = (input: unknown) => {
  const r = parse(input);
  expect(r.issues).toEqual([]);
  return r.schema;
};
const messages = (input: unknown) => parse(input).issues.map((i) => i.message);

describe("parseSectionSchema", () => {
  it("accepts every supported key and setting type", () => {
    const schema = ok({
      name: { ar: "بطل", en: "Hero" },
      tag: "section",
      class: "hero wide",
      max_blocks: 6,
      settings: [
        { type: "header", content: "Text" },
        { type: "paragraph", content: { ar: "نص", en: "Help" } },
        { type: "text", id: "title", label: "Title", default: "Hi", placeholder: "Title", info: "Shown on top" },
        { type: "textarea", id: "body", label: "Body" },
        { type: "inline_richtext", id: "line", label: "Line" },
        { type: "richtext", id: "rich", label: "Rich", default: { ar: "<p>أ</p>", en: "<p>a</p>" } },
        { type: "number", id: "count", label: "Count", default: 3, min: 1, max: 9 },
        { type: "range", id: "pad", label: "Padding", min: 0, max: 100, step: 4, unit: "px", default: 20 },
        { type: "checkbox", id: "show", label: "Show", default: true },
        { type: "select", id: "size", label: "Size", options: [{ value: "s", label: "S" }, { value: "l", label: "L" }], default: "s" },
        { type: "radio", id: "side", label: "Side", options: [{ value: "a", label: "A" }] },
        { type: "text_alignment", id: "align", label: "Align", default: "center" },
        { type: "color", id: "fg", label: "Text colour", default: "#112233" },
        { type: "color_background", id: "bg", label: "Background", default: "linear-gradient(90deg, #fff 0%, rgba(0,0,0,0.5) 100%)" },
        { type: "image_picker", id: "img", label: "Image" },
        { type: "url", id: "link", label: "Link", default: "/collections" },
        { type: "video_url", id: "video", label: "Video", accept: ["youtube"] },
        { type: "product", id: "prod", label: "Product" },
        { type: "product_list", id: "prods", label: "Products", limit: 12 },
        { type: "collection", id: "cat", label: "Category" },
        { type: "collection_list", id: "cats", label: "Categories" },
      ],
      blocks: [{ type: "slide", name: "Slide", settings: [{ type: "text", id: "title", label: "Title" }] }],
      presets: [{ name: "Hero", blocks: [{ type: "slide" }] }],
      default: { settings: { title: "x" }, blocks: [{ type: "slide", settings: {} }] },
    });
    expect(schema.settings).toHaveLength(21);
    expect(schema.blocks[0]?.type).toBe("slide");
  });

  it("fills name, settings and blocks when missing", () => {
    expect(ok({})).toEqual({ name: "Custom section", settings: [], blocks: [] });
    expect(ok(undefined)).toEqual({ name: "Custom section", settings: [], blocks: [] });
  });

  it("rejects bad and duplicate ids", () => {
    expect(messages({ settings: [{ type: "text", id: "Title", label: "x" }] })[0]).toMatch(/^schema settings\[0\]\.id: must start/);
    expect(messages({ settings: [{ type: "text", id: "a".repeat(41), label: "x" }] })).toHaveLength(1);
    expect(messages({ settings: [{ type: "text", id: "a", label: "x" }, { type: "number", id: "a", label: "y" }] })[0]).toMatch(/settings\[1\]\.id: "a" is used/);
    expect(messages({ blocks: [{ type: "Bad-type", name: "x", settings: [] }] })[0]).toMatch(/blocks\[0\]\.type/);
    expect(messages({ blocks: [{ type: "a", name: "x" }, { type: "a", name: "y" }] })[0]).toMatch(/"a" is used by another block/);
    expect(
      messages({ blocks: [{ type: "a", name: "x", settings: [{ type: "text", id: "t", label: "" }, { type: "text", id: "t", label: "" }] }] })[0],
    ).toMatch(/blocks\[0\]\.settings\[1\]\.id/);
  });

  it("rejects unknown keys and unsupported setting types", () => {
    expect(messages({ name: "A", enabled_on: {} })[0]).toMatch(/enabled_on/);
    expect(messages({ settings: [{ type: "font_picker", id: "f", label: "Font" }] })[0]).toBe(
      'schema settings[0].type: "font_picker" isn\'t a supported setting type',
    );
    expect(messages({ settings: [{ type: "html", id: "f", label: "x" }] })[0]).toMatch(/"html" isn't a supported/);
    expect(messages({ settings: [{ id: "f", label: "x" }] })[0]).toMatch(/needs a supported setting type/);
    expect(messages({ settings: [{ type: "text", id: "t", label: "x", t_label: 1 }] })[0]).toMatch(/t_label/);
  });

  it("checks type-specific fields and defaults", () => {
    expect(messages({ settings: [{ type: "range", id: "r", label: "x", min: 5, max: 5 }] })[0]).toMatch(/max: must be greater than min/);
    expect(messages({ settings: [{ type: "range", id: "r", label: "x", max: 5 }] })).toHaveLength(1);
    expect(messages({ settings: [{ type: "select", id: "s", label: "x", options: [] }] })).toHaveLength(1);
    expect(
      messages({ settings: [{ type: "select", id: "s", label: "x", options: [{ value: "a", label: "A" }], default: "b" }] })[0],
    ).toMatch(/default: is not a valid select value/);
    expect(messages({ settings: [{ type: "url", id: "u", label: "x", default: "javascript:alert(1)" }] })[0]).toMatch(/default/);
    expect(messages({ settings: [{ type: "color", id: "c", label: "x", default: "red;background:url(x)" }] })[0]).toMatch(/default/);
    expect(messages({ settings: [{ type: "product_list", id: "p", label: "x", limit: 25 }] })[0]).toMatch(/limit/);
    expect(messages({ settings: [{ type: "header", id: "h" }] })[0]).toMatch(/content/);
  });

  it("enforces the caps", () => {
    const text = (i: number) => ({ type: "text", id: `s${i}`, label: "x" });
    expect(parse({ settings: Array.from({ length: 40 }, (_, i) => text(i)) }).issues).toEqual([]);
    expect(messages({ settings: Array.from({ length: 41 }, (_, i) => text(i)) })[0]).toMatch(/more than 40 settings/);
    expect(messages({ blocks: [{ type: "b", name: "B", settings: Array.from({ length: 21 }, (_, i) => text(i)) }] })[0]).toMatch(/more than 20 settings/);
    expect(messages({ blocks: Array.from({ length: 11 }, (_, i) => ({ type: `b${i}`, name: "B" })) })[0]).toMatch(/more than 10 block types/);
    expect(messages({ max_blocks: 51 })[0]).toMatch(/max_blocks/);
    expect(messages({ presets: Array.from({ length: 6 }, () => ({ name: "P" })) })[0]).toMatch(/more than 5 presets/);
  });

  it("checks preset and default block types", () => {
    expect(messages({ blocks: [{ type: "a", name: "A" }], presets: [{ name: "P", blocks: [{ type: "b" }] }] })[0]).toMatch(
      /presets\[0\]\.blocks\[0\]\.type: "b" is not a block type/,
    );
    expect(messages({ default: { blocks: [{ type: "x" }] } })[0]).toMatch(/default\.blocks\[0\]\.type/);
  });

  it("falls back to the empty schema on errors", () => {
    expect(parse({ settings: 5 }).schema).toEqual({ name: "Custom section", settings: [], blocks: [] });
    expect(parse("nope").issues).toHaveLength(1);
  });
});

const def = (d: Record<string, unknown>) => ok({ settings: [d] }).settings as SettingDef[];
const norm = (d: Record<string, unknown>, value: unknown) =>
  normalizeSettings(def(d), value === undefined ? {} : { [d.id as string]: value });

describe("normalizeSettings", () => {
  it("drops unknown keys and value-less settings", () => {
    const defs = ok({ settings: [{ type: "header", content: "H" }, { type: "text", id: "a", label: "A" }] }).settings;
    expect(normalizeSettings(defs, JSON.parse('{"a":"x","b":"y","__proto__":{"a":1},"constructor":1}'))).toEqual({ a: { ar: "x", en: "x" } });
    expect(normalizeSettings(defs, null)).toEqual({});
    expect(normalizeSettings(defs, ["x"])).toEqual({});
  });

  it("stores text types per language", () => {
    for (const type of ["text", "textarea", "inline_richtext", "richtext"]) {
      const d = { type, id: "t", label: "T", default: "d" };
      expect(norm(d, "x")).toEqual({ t: { ar: "x", en: "x" } });
      expect(norm(d, { ar: "أ", en: "a" })).toEqual({ t: { ar: "أ", en: "a" } });
      expect(norm(d, { en: "a" })).toEqual({ t: { ar: "", en: "a" } });
      expect(norm(d, 5)).toEqual({ t: { ar: "d", en: "d" } });
      expect(norm(d, undefined)).toEqual({ t: { ar: "d", en: "d" } });
    }
    expect((norm({ type: "text", id: "t", label: "T" }, "x".repeat(2000)).t as { ar: string }).ar).toHaveLength(1000);
  });

  it("clamps numbers and snaps ranges to their step", () => {
    const n = { type: "number", id: "n", label: "N", min: 1, max: 10, default: 5 };
    expect(norm(n, 50)).toEqual({ n: 10 });
    expect(norm(n, -3)).toEqual({ n: 1 });
    expect(norm(n, "7")).toEqual({ n: 5 });
    expect(norm(n, Number.NaN)).toEqual({ n: 5 });
    expect(norm({ type: "number", id: "n", label: "N" }, 1e9)).toEqual({ n: 1e9 });
    const r = { type: "range", id: "r", label: "R", min: 0, max: 1, step: 0.1, default: 0.5 };
    expect(norm(r, 0.33)).toEqual({ r: 0.3 });
    expect(norm(r, 7)).toEqual({ r: 1 });
    expect(norm(r, null)).toEqual({ r: 0.5 });
  });

  it("checks checkbox, select, radio and text_alignment", () => {
    expect(norm({ type: "checkbox", id: "c", label: "C", default: false }, true)).toEqual({ c: true });
    expect(norm({ type: "checkbox", id: "c", label: "C", default: false }, "true")).toEqual({ c: false });
    const s = { type: "select", id: "s", label: "S", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }], default: "a" };
    expect(norm(s, "b")).toEqual({ s: "b" });
    expect(norm(s, "z")).toEqual({ s: "a" });
    expect(norm({ ...s, type: "radio" }, "b")).toEqual({ s: "b" });
    expect(norm({ type: "text_alignment", id: "a", label: "A" }, "right")).toEqual({ a: "right" });
    expect(norm({ type: "text_alignment", id: "a", label: "A" }, "justify")).toEqual({});
  });

  it("accepts only real colours", () => {
    const c = { type: "color", id: "c", label: "C" };
    for (const good of ["#fff", "#A1b2C3", "#11223344", "rgb(1, 2, 3)", "rgba(1,2,3,0.5)", "rgb(1 2 3 / 50%)", "hsl(120deg 50% 50%)", "hsla(120, 50%, 50%, .3)"]) {
      expect(norm(c, good)).toEqual({ c: good });
    }
    for (const bad of ["red", "#ggg", "rgb(1,2)", "url(x)", "#fff;color:red", "expression(1)", "var(--x)", 5]) {
      expect(norm(c, bad)).toEqual({});
    }
    const bg = { type: "color_background", id: "b", label: "B" };
    const gradient = "linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0) 100%)";
    expect(norm(bg, gradient)).toEqual({ b: gradient });
    expect(norm(bg, "#000")).toEqual({ b: "#000" });
    for (const bad of ["linear-gradient(url(x), #fff)", "linear-gradient(var(--a), #fff)", "linear-gradient(#fff, #000);x:y", "url(x)"]) {
      expect(norm(bg, bad)).toEqual({});
    }
  });

  it("checks urls, images and videos", () => {
    const u = { type: "url", id: "u", label: "U", default: "/" };
    expect(norm(u, "https://example.com/a?b=1")).toEqual({ u: "https://example.com/a?b=1" });
    expect(norm(u, "/collections/all")).toEqual({ u: "/collections/all" });
    for (const bad of ["javascript:alert(1)", "java\tscript:alert(1)", "//evil.com", "data:text/html,x", "mailto:a@b.c", "ftp://x"]) {
      expect(norm(u, bad)).toEqual({ u: "/" });
    }
    const img = { type: "image_picker", id: "i", label: "I" };
    expect(norm(img, "https://cdn.example.com/a.webp")).toEqual({ i: "https://cdn.example.com/a.webp" });
    expect(norm(img, "seller/2026-11-26/a.webp")).toEqual({ i: "seller/2026-11-26/a.webp" });
    for (const bad of ["javascript:x", "data:image/png;base64,AA", "a/../../b.png", "a b.png", 3]) expect(norm(img, bad)).toEqual({});
    const v = { type: "video_url", id: "v", label: "V" };
    expect(norm(v, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({ v: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
    expect(norm(v, "https://youtu.be/dQw4w9WgXcQ")).toEqual({ v: "https://youtu.be/dQw4w9WgXcQ" });
    expect(norm(v, "https://vimeo.com/123456789")).toEqual({ v: "https://vimeo.com/123456789" });
    expect(norm({ ...v, accept: ["youtube"] }, "https://vimeo.com/123456789")).toEqual({});
    for (const bad of ["http://youtu.be/dQw4w9WgXcQ", "https://evil.com/watch?v=dQw4w9WgXcQ", "https://youtube.com.evil.com/watch?v=x"]) {
      expect(norm(v, bad)).toEqual({});
    }
  });

  it("keeps product and category ids and caps lists", () => {
    expect(norm({ type: "product", id: "p", label: "P" }, "4f1c-uuid_1")).toEqual({ p: "4f1c-uuid_1" });
    expect(norm({ type: "collection", id: "c", label: "C" }, { id: "x" })).toEqual({});
    expect(norm({ type: "product", id: "p", label: "P" }, "bad id")).toEqual({});
    const many = Array.from({ length: 30 }, (_, i) => `p${i}`);
    expect((norm({ type: "product_list", id: "l", label: "L" }, many).l as string[]).length).toBe(24);
    expect(norm({ type: "collection_list", id: "l", label: "L", limit: 2 }, ["a", "a", "b c", 4, "b", "c"])).toEqual({ l: ["a", "b"] });
    expect(norm({ type: "product_list", id: "l", label: "L" }, "a")).toEqual({});
  });

  it("can leave missing values out", () => {
    expect(normalizeSettings(def({ type: "text", id: "t", label: "T", default: "d" }), {}, { applyDefaults: false })).toEqual({});
  });
});

describe("normalizeBlocks", () => {
  const schema = ok({
    max_blocks: 3,
    blocks: [
      { type: "slide", name: "Slide", settings: [{ type: "text", id: "title", label: "T", default: "d" }] },
      { type: "logo", name: "Logo", settings: [] },
    ],
  });

  it("drops unknown types, normalises settings and keeps valid ids", () => {
    const out = normalizeBlocks(schema, [
      { id: "b_keep", type: "slide", settings: { title: "Hi", extra: 1 } },
      { id: "x", type: "unknown" },
      "junk",
      { type: "logo" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ id: "b_keep", type: "slide", settings: { title: { ar: "Hi", en: "Hi" } } });
    expect(out[1]?.id).toMatch(/^b_[0-9a-f]{12}$/);
    expect(out[1]?.settings).toEqual({});
  });

  it("replaces bad and duplicate ids", () => {
    const out = normalizeBlocks(schema, [{ id: "same", type: "logo" }, { id: "same", type: "logo" }, { id: '"><x', type: "logo" }]);
    expect(out[0]?.id).toBe("same");
    expect(out[1]?.id).toMatch(/^b_/);
    expect(out[2]?.id).toMatch(/^b_/);
    expect(new Set(out.map((b) => b.id)).size).toBe(3);
  });

  it("caps at max_blocks, and at 50 without it", () => {
    const many = Array.from({ length: 80 }, () => ({ type: "logo" }));
    expect(normalizeBlocks(schema, many)).toHaveLength(3);
    expect(normalizeBlocks({ ...schema, max_blocks: undefined }, many)).toHaveLength(50);
    expect(normalizeBlocks(schema, "nope")).toEqual([]);
  });
});
