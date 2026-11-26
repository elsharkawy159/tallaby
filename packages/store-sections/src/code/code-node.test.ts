import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "../config/sanitize";
import { capUtf8, MAX_CODE_CSS_BYTES, MAX_CODE_SOURCE_BYTES, normalizeCodeNodeProps, utf8Length } from "./code-node";
import { checkCodeNode, codeNodeFromFile } from "./code-node.server";
import { LIQUID_API_VERSION } from "./liquid-objects";
import { joinSectionFile } from "./section-file";

const SCHEMA = {
  name: "Hero",
  settings: [
    { type: "text", id: "title", label: "Title", default: "Hello" },
    { type: "richtext", id: "body", label: "Body" },
  ],
  blocks: [{ type: "slide", name: "Slide", settings: [{ type: "inline_richtext", id: "caption", label: "Caption" }] }],
};

const props = (extra: Record<string, unknown> = {}) => ({
  source: "<h1>{{ section.settings.title }}</h1>{% for b in section.blocks %}<p>{{ b.settings.caption }}</p>{% endfor %}",
  css: ".hero { color: red; }",
  schema: SCHEMA,
  settings: { title: { ar: "أهلا", en: "Hi" } },
  blocks: [{ id: "b1", type: "slide", settings: { caption: "One" } }],
  ...extra,
});

describe("normalizeCodeNodeProps", () => {
  it("keeps the template, stylesheet and schema as written", () => {
    const { props: out, issues } = normalizeCodeNodeProps(props());
    expect(issues).toEqual([]);
    expect(out.source).toBe(props().source);
    expect(out.css).toBe(".hero { color: red; }");
    expect(out.schema.name).toBe("Hero");
    expect(out.settings).toEqual({ title: { ar: "أهلا", en: "Hi" } });
    expect(out.blocks).toEqual([{ id: "b1", type: "slide", settings: { caption: { ar: "One", en: "One" } } }]);
  });

  it("always sets apiVersion itself", () => {
    expect(normalizeCodeNodeProps(props({ apiVersion: 99 })).props.apiVersion).toBe(LIQUID_API_VERSION);
    expect(normalizeCodeNodeProps({}).props.apiVersion).toBe(LIQUID_API_VERSION);
  });

  it("drops unknown keys, unknown setting values and unknown block types", () => {
    const { props: out } = normalizeCodeNodeProps(
      props({
        evil: "<script>",
        settings: { title: "Hi", nope: "x" },
        blocks: [{ id: "b1", type: "slide", settings: {} }, { id: "b2", type: "ghost", settings: {} }],
      }),
    );
    expect(Object.keys(out).sort()).toEqual(["apiVersion", "blocks", "css", "schema", "settings", "source"]);
    expect(out.settings).toEqual({ title: { ar: "Hi", en: "Hi" } });
    expect(out.blocks.map((b) => b.type)).toEqual(["slide"]);
  });

  it("fills defaults for missing settings", () => {
    expect(normalizeCodeNodeProps(props({ settings: {} })).props.settings).toEqual({ title: { ar: "Hello", en: "Hello" } });
  });

  it("cleans rich-text setting values only when given a cleaner", () => {
    const input = props({
      settings: { body: "<p>ok</p><script>alert(1)</script>" },
      blocks: [{ id: "b1", type: "slide", settings: { caption: '<b>x</b><img src=x onerror="a()">' } }],
    });
    const raw = normalizeCodeNodeProps(input).props;
    expect((raw.settings.body as { en: string }).en).toContain("<script>");
    const clean = normalizeCodeNodeProps(input, { cleanRichText: sanitizeRichText }).props;
    expect(clean.settings.body).toEqual({ ar: "<p>ok</p>", en: "<p>ok</p>" });
    expect((clean.blocks[0]!.settings.caption as { en: string }).en).toBe("<b>x</b>");
    // The template is never rich-text cleaned.
    expect(clean.source).toBe(input.source);
  });

  it("reports an invalid schema and falls back to an empty one", () => {
    const { props: out, issues } = normalizeCodeNodeProps(props({ schema: { name: "x", settings: [{ type: "magic", id: "a", label: "A" }] } }));
    expect(out.schema.settings).toEqual([]);
    expect(issues[0]).toMatchObject({ code: "schema_invalid", field: "schema" });
  });

  it("caps the template and the stylesheet and reports it", () => {
    const big = normalizeCodeNodeProps(props({ source: "a".repeat(MAX_CODE_SOURCE_BYTES + 10), css: "b".repeat(MAX_CODE_CSS_BYTES + 10) }));
    expect(utf8Length(big.props.source)).toBe(MAX_CODE_SOURCE_BYTES);
    expect(utf8Length(big.props.css!)).toBe(MAX_CODE_CSS_BYTES);
    expect(big.issues.map((i) => i.code)).toEqual(["source_too_large", "css_too_large"]);
  });

  it("removes stylesheet and schema blocks left in the template", () => {
    const { props: out, issues } = normalizeCodeNodeProps(props({ source: "<p>a</p>{% stylesheet %}p{}{% endstylesheet %}" }));
    expect(out.source).toBe("<p>a</p>");
    expect(issues[0]).toMatchObject({ code: "embedded_block", field: "source" });
  });

  it("keeps the name plain and short", () => {
    expect(normalizeCodeNodeProps(props({ name: `  My\u0000  hero ${"x".repeat(100)}` })).props.name).toHaveLength(80);
    expect(normalizeCodeNodeProps(props({ name: 5 })).props.name).toBeUndefined();
  });

  it("is stable when run twice", () => {
    const once = normalizeCodeNodeProps(props()).props;
    expect(normalizeCodeNodeProps(once).props).toEqual(once);
  });
});

describe("capUtf8", () => {
  it("never cuts a character in half", () => {
    expect(capUtf8("ممم", 5)).toBe("مم");
    expect(capUtf8("abc", 10)).toBe("abc");
  });
});

describe("checkCodeNode", () => {
  it("passes a valid node", () => {
    expect(checkCodeNode(normalizeCodeNodeProps(props()).props)).toEqual([]);
  });

  it("reports Liquid syntax errors with a position", () => {
    const issues = checkCodeNode(normalizeCodeNodeProps(props({ source: "<p>\n{% if %}</p>" })).props);
    expect(issues[0]).toMatchObject({ field: "source", line: 2 });
  });

  it("reports blocked constructs as blocked_<kind> with line and column", () => {
    const issues = checkCodeNode(normalizeCodeNodeProps(props({ source: "<p>a</p>\n  <script>x()</script>" })).props);
    expect(issues).toContainEqual(expect.objectContaining({ code: "blocked_script", field: "source", line: 2, column: 3 }));
  });

  it("reports stylesheet problems", () => {
    const issues = checkCodeNode(normalizeCodeNodeProps(props({ css: "@import url(https://x.example/a.css);" })).props);
    expect(issues[0]).toMatchObject({ code: "css_invalid", field: "css", line: 1 });
  });
});

describe("codeNodeFromFile", () => {
  it("splits, normalises and checks the one-file format", () => {
    const file = joinSectionFile({ source: "<h1>{{ section.settings.title }}</h1>", css: "h1 { color: red; }", schema: SCHEMA });
    const { props: out, issues } = codeNodeFromFile(file, { settings: { title: "Hi" }, name: "Hero" });
    expect(issues).toEqual([]);
    expect(out).toMatchObject({ apiVersion: LIQUID_API_VERSION, name: "Hero", source: "<h1>{{ section.settings.title }}</h1>", css: "h1 { color: red; }" });
    expect(out.settings).toEqual({ title: { ar: "Hi", en: "Hi" } });
  });

  it("returns the split issues and the check issues", () => {
    const { issues } = codeNodeFromFile("<script></script>\n{% schema %}{bad{% endschema %}");
    expect(issues.map((i) => i.code)).toEqual(expect.arrayContaining(["schema_json", "blocked_script"]));
  });
});
