/** Code nodes and custom CSS on the save and publish path (ROADMAP F-101, design note §5.1). */
import { describe, expect, it } from "vitest";
import { CODE_SERVER_CHECKS } from "../code/code-node.server";
import { LIQUID_API_VERSION } from "../code/liquid-objects";
import { sanitizeSiteConfig } from "./sanitize";
import { siteConfigSchema, type ComponentNode } from "./schema";
import { MAX_PAGE_CODE_BYTES, validatePageContent, validateSiteConfig } from "./validate";
import { withHomeSections } from "./fixtures.test-utils";

const SOURCE = '<div class="hero">\n  {% if section.settings.title != blank %}<h2>{{ section.settings.title }}</h2>{% endif %}\n  {{ section.settings.body }}\n</div>';
const SCHEMA = {
  name: "Hero",
  settings: [
    { type: "text", id: "title", label: "Title" },
    { type: "richtext", id: "body", label: "Body" },
  ],
};

const codeNode = (id: string, props: Record<string, unknown> = {}, extra: Partial<ComponentNode> = {}): ComponentNode => ({
  id,
  type: "code",
  props: { source: SOURCE, css: ".hero > h2 { color: red; }", schema: SCHEMA, settings: { title: "Hi" }, blocks: [], ...props },
  children: [],
  ...extra,
});

const section = (tree: ComponentNode[], extra: Record<string, unknown> = {}) => ({
  id: "s1",
  sectionId: "custom-section",
  version: 1,
  props: {},
  componentTree: [{ id: "root", type: "section", props: {}, children: tree }],
  ...extra,
});

const content = (tree: ComponentNode[], extra: Record<string, unknown> = {}) => ({ sections: [section(tree, extra)] });
const server = { serverChecks: CODE_SERVER_CHECKS };

function savedCode(result: ReturnType<typeof validatePageContent>) {
  if (!result.success) throw new Error(JSON.stringify(result.issues));
  return result.data.sections[0]!.componentTree![0]!.children[0]!;
}

describe("sanitizeSiteConfig and code nodes", () => {
  it("round-trips a code node with its Liquid, CSS and schema intact", () => {
    const config = siteConfigSchema.parse(withHomeSections([section([codeNode("c1")])]));
    const node = sanitizeSiteConfig(config).pages[0]!.content.sections[0]!.componentTree![0]!.children[0]!;
    expect(node.props.source).toBe(SOURCE);
    expect(node.props.css).toBe(".hero > h2 { color: red; }");
    expect(node.props.schema).toMatchObject(SCHEMA);
    expect(node.props.settings).toEqual({ title: { ar: "Hi", en: "Hi" } });
  });

  it("replaces a forged apiVersion and drops unknown props", () => {
    const node = savedCode(validatePageContent(content([codeNode("c1", { apiVersion: 7, onload: "x" })]), server));
    expect(node.props.apiVersion).toBe(LIQUID_API_VERSION);
    expect(node.props).not.toHaveProperty("onload");
  });

  it("drops an unknown setting key and cleans rich-text values", () => {
    const node = savedCode(
      validatePageContent(content([codeNode("c1", { settings: { title: "Hi", nope: "x", body: "<p>a</p><script>b</script>" } })]), server),
    );
    expect(node.props.settings).toEqual({ title: { ar: "Hi", en: "Hi" }, body: { ar: "<p>a</p>", en: "<p>a</p>" } });
  });

  it("forces a code node's children to be empty", () => {
    const child: ComponentNode = { id: "t1", type: "text", props: { text: "x" }, children: [] };
    const node = savedCode(validatePageContent(content([codeNode("c1", {}, { children: [child] })]), server));
    expect(node.children).toEqual([]);
  });

  it("keeps custom CSS verbatim (trimmed) on elements and sections", () => {
    const text: ComponentNode = { id: "t1", type: "text", props: { text: "x" }, children: [], customCss: "  a > b { color: red; }  " };
    const result = validatePageContent(content([text], { customCss: ":scope > div { gap: 4px; }" }), server);
    if (!result.success) throw new Error(JSON.stringify(result.issues));
    const saved = result.data.sections[0]!;
    expect(saved.customCss).toBe(":scope > div { gap: 4px; }");
    expect(saved.componentTree![0]!.children[0]!.customCss).toBe("a > b { color: red; }");
  });
});

describe("validatePageContent and code nodes", () => {
  it("accepts a valid code node", () => {
    expect(validatePageContent(content([codeNode("c1")]), server).success).toBe(true);
  });

  it("rejects a <script> in the template with the node id, line and column", () => {
    const result = validatePageContent(content([codeNode("c1", { source: "<p>a</p>\n  <script>alert(1)</script>" })]), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toContainEqual({
      code: "invalid_code",
      path: ["sections", 0, "componentTree", 0, "children", 0, "props", "source"],
      message: expect.not.stringMatching(/shopify/i),
      nodeId: "c1",
      detail: "blocked_script",
      line: 2,
      column: 3,
    });
  });

  it("rejects a Liquid syntax error with its position", () => {
    const result = validatePageContent(content([codeNode("c1", { source: "<p>\n{% if %}</p>" })]), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({ code: "invalid_code", nodeId: "c1", line: 2 });
  });

  it("rejects an invalid schema", () => {
    const result = validatePageContent(content([codeNode("c1", { schema: { settings: [{ type: "magic", id: "a", label: "A" }] } })]), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({ code: "invalid_code", detail: "schema_invalid", path: expect.arrayContaining(["props", "schema"]) });
  });

  it("rejects a code stylesheet with @import", () => {
    const result = validatePageContent(content([codeNode("c1", { css: "@import url(https://x.example/a.css);" })]), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({ code: "invalid_code", detail: "css_at_rule_blocked", path: expect.arrayContaining(["props", "css"]), line: 1 });
  });

  it("rejects an element's custom CSS with @import", () => {
    const text: ComponentNode = { id: "t1", type: "text", props: {}, children: [], customCss: "a{}\n@import url(https://x.example/a.css);" };
    const result = validatePageContent(content([text]), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({
      code: "invalid_css",
      path: ["sections", 0, "componentTree", 0, "children", 0, "customCss"],
      nodeId: "t1",
      line: 2,
    });
  });

  it("rejects a section's custom CSS with @import", () => {
    const result = validatePageContent(content([], { customCss: "@import 'x.css';" }), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({ code: "invalid_css", path: ["sections", 0, "customCss"], nodeId: "s1" });
  });

  it("checks a code node inside a productList", () => {
    const list: ComponentNode = { id: "pl", type: "productList", props: {}, children: [codeNode("card", { source: '<a href="javascript:alert(1)">x</a>' })] };
    const result = validatePageContent(content([list]), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({
      code: "invalid_code",
      nodeId: "card",
      detail: "blocked_javascript_url",
      path: ["sections", 0, "componentTree", 0, "children", 0, "children", 0, "props", "source"],
    });
  });

  it("checks code nodes in injected children", () => {
    const result = validatePageContent({ sections: [], injectedChildren: { slot: [codeNode("c9", { source: "<iframe></iframe>" })] } }, server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({ nodeId: "c9", detail: "blocked_iframe", path: ["injectedChildren", "slot", 0, "props", "source"] });
  });

  it("caps a page's code and custom CSS at 400 KB in total", () => {
    const chunk = "a".repeat(60 * 1024);
    const nodes = Array.from({ length: 7 }, (_, i) => codeNode(`c${i}`, { source: chunk, css: undefined }));
    const result = validatePageContent(content(nodes), server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([expect.objectContaining({ code: "code_too_large", path: [] })]);
    expect(7 * chunk.length).toBeGreaterThan(MAX_PAGE_CODE_BYTES);
    expect(validatePageContent(content(nodes.slice(0, 6)), server).success).toBe(true);
  });

  it("without the server checks still rejects blocked constructs but skips the Liquid parse", () => {
    expect(validatePageContent(content([codeNode("c1", { source: "<script></script>" })])).success).toBe(false);
    expect(validatePageContent(content([codeNode("c1", { source: "{% if %}" })])).success).toBe(true);
  });
});

describe("validateSiteConfig and code nodes", () => {
  it("checks code nodes in the shared header", () => {
    const raw = { ...withHomeSections([]), header: section([codeNode("hc", { source: "<form></form>" })], { id: "h" }) };
    const result = validateSiteConfig(raw, server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({ nodeId: "hc", detail: "blocked_form", path: ["header", "componentTree", 0, "children", 0, "props", "source"] });
  });

  it("counts the header and footer toward each page's cap", () => {
    const chunk = "a".repeat(60 * 1024);
    const raw = {
      ...withHomeSections([section(Array.from({ length: 4 }, (_, i) => codeNode(`p${i}`, { source: chunk, css: undefined })))]),
      header: section(Array.from({ length: 3 }, (_, i) => codeNode(`h${i}`, { source: chunk, css: undefined })), { id: "h" }),
    };
    const result = validateSiteConfig(raw, server);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([expect.objectContaining({ code: "code_too_large", path: ["pages", 0, "content"] })]);
  });
});
