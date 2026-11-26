import { describe, expect, it } from "vitest";
import { CODE_ISSUE_CODES, CODE_ISSUE_REASONS } from "./code-issues";
import { codeNodeFromFile } from "./code-node.server";
import { checkLiquidSource, DROPPED_TAG_NAMES } from "./liquid.server";
import { renderCodePreview } from "./preview-code.server";
import { checkCss, scopeCss } from "./scope-css";

const codes = new Set<string>(CODE_ISSUE_CODES);
const reasons = new Set<string>(CODE_ISSUE_REASONS);

function expectKnown(issues: { code?: string; params?: Record<string, string | number> }[]) {
  expect(issues.length).toBeGreaterThan(0);
  for (const issue of issues) {
    expect(codes, `unlisted code ${issue.code}`).toContain(issue.code);
    if (issue.params?.reason !== undefined) expect(reasons, `unlisted reason ${issue.params.reason}`).toContain(String(issue.params.reason));
  }
}

describe("code issue codes", () => {
  it("lists each code and reason once", () => {
    expect(codes.size).toBe(CODE_ISSUE_CODES.length);
    expect(reasons.size).toBe(CODE_ISSUE_REASONS.length);
  });

  it("gives every dropped Liquid tag a listed reason and its name", () => {
    for (const tag of DROPPED_TAG_NAMES) {
      const [issue] = checkLiquidSource(`{% ${tag} %}`);
      expect(issue).toMatchObject({ code: "tag_not_allowed", params: { tag } });
      expectKnown([issue!]);
    }
  });

  it("carries params for filters, syntax errors and limits", () => {
    expect(checkLiquidSource("{{ x | evil }}")[0]).toMatchObject({ code: "unknown_filter", params: { filter: "evil" } });
    expect(checkLiquidSource("{% if %}x{% endif %}")[0]?.params?.detail).toEqual(expect.any(String));
    expect(checkLiquidSource("x".repeat(70 * 1024))[0]).toMatchObject({ code: "source_too_large", params: { kb: 64 } });
  });

  it("codes every CSS issue", () => {
    const scoped = scopeCss(
      [
        "color: red;",
        "@import url(a.css);",
        "@foo { .a { color: red } }",
        "@media;",
        ".a:has(.b) { color: red }",
        ":host-context(.x) .a { color: red }",
        "html + .a { color: red }",
        ".a { color: expression(alert(1)); }",
        ".a { .b { color: red } }",
        "@keyframes none { to { opacity: 0 } }",
        "@keyframes spin { half { opacity: 0 } color: red; }",
      ].join("\n"),
      { scope: ".s", keyframePrefix: "k-" },
    );
    expectKnown(scoped.issues);
    for (const issue of scoped.issues) expect(issue.code).toMatch(/^css_/);
    expect(scoped.issues.find((i) => i.code === "css_selector_removed" && i.params?.reason === "shadow_dom")?.params?.pseudo).toBe(":host-context");
    expectKnown(checkCss(".a {"));
    expect(checkCss(".a {")[0]).toMatchObject({ code: "css_syntax", params: { detail: expect.any(String) } });
    expect(checkCss("x".repeat(40), 16)[0]).toMatchObject({ code: "css_too_large" });
  });

  it("codes every issue of a section file and its preview", () => {
    const file = [
      "<p onclick=\"x()\">{{ x | evil }}</p>",
      "<script>x()</script>",
      "{% form %}{% endform %}",
      "{% javascript %}x(){% endjavascript %}",
      "{% stylesheet %}@import url(a.css);{% endstylesheet %}",
      "{% stylesheet %}.b{}{% endstylesheet %}",
      '{% schema %}{ "settings": [{ "type": "nope", "id": "a" }] }{% endschema %}',
      "{% schema %}{}{% endschema %}",
    ].join("\n");
    expectKnown(codeNodeFromFile(file).issues);
    const preview = renderCodePreview({
      nodeId: "bad id!",
      file,
      settings: {},
      blocks: [],
      locale: "en",
      pageType: "page",
      storeId: "s",
      store: { name: "S", url: "https://s.example" },
      currency: "EGP",
      catalog: { products: {}, categories: [] },
      imageUrl: (p) => p,
    });
    expectKnown(preview.issues);
    expect(preview.issues.map((i) => i.code)).toContain("invalid_node");
  });

  it("codes a render limit with its reason", () => {
    const preview = renderCodePreview({
      nodeId: "n1",
      file: "{% for a in (1..100000) %}{% for b in (1..100000) %}x{% endfor %}{% endfor %}",
      settings: {},
      blocks: [],
      locale: "en",
      pageType: "page",
      storeId: "s",
      store: { name: "S", url: "https://s.example" },
      currency: "EGP",
      catalog: { products: {}, categories: [] },
      imageUrl: (p) => p,
    });
    const issue = preview.issues.find((i) => i.code === "render_limit");
    expect(issue).toBeDefined();
    expectKnown([issue!]);
    expect(["memory", "time"]).toContain(issue!.params?.reason);
  });
});
