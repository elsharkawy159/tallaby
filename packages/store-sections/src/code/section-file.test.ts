import { describe, expect, it } from "vitest";
import { joinSectionFile, splitSectionFile } from "./section-file";

const schema = { name: "Hero", settings: [{ type: "text", id: "title", label: "Title" }], blocks: [], presets: [] };

describe("splitSectionFile", () => {
  it("splits source, stylesheet and schema", () => {
    const file = [
      '<div class="hero">{{ section.settings.title }}</div>',
      "{% stylesheet %} .hero { padding: 2rem } {% endstylesheet %}",
      `{% schema %} ${JSON.stringify(schema)} {% endschema %}`,
    ].join("\n");
    const out = splitSectionFile(file);
    expect(out.issues).toEqual([]);
    expect(out.source).toBe('<div class="hero">{{ section.settings.title }}</div>');
    expect(out.css).toBe(".hero { padding: 2rem }");
    expect(out.schema).toEqual(schema);
  });

  it("accepts whitespace-control dashes and blocks anywhere in the file", () => {
    const out = splitSectionFile('{%- schema -%}{"name":"A"}{%- endschema -%}\n<p>x</p>\n{%- stylesheet -%}p{}{%- endstylesheet -%}');
    expect(out.issues).toEqual([]);
    expect(out.schema).toEqual({ name: "A" });
    expect(out.css).toBe("p{}");
    expect(out.source).toBe("\n<p>x</p>");
  });

  it("gives the default schema and empty css when both are missing", () => {
    const out = splitSectionFile("<p>hi</p>\n\n");
    expect(out).toEqual({ source: "<p>hi</p>", css: "", schema: { name: "Custom section", settings: [] }, issues: [] });
  });

  it("reports schema JSON errors with a line and column in the file", () => {
    const file = '<p>a</p>\n<p>b</p>\n{% schema %}\n{\n  "name": "Hero",\n  "settings": [}\n{% endschema %}';
    const out = splitSectionFile(file);
    expect(out.issues).toHaveLength(1);
    const [issue] = out.issues;
    expect(issue?.code).toBe("schema_json");
    expect(issue?.line).toBe(6);
    expect(issue?.column).toBe(16);
    expect(issue?.message).not.toMatch(/position \d+/);
    expect(out.schema).toEqual({ name: "Custom section", settings: [] });
  });

  it("reports an unexpected end of the schema JSON", () => {
    const out = splitSectionFile('{% schema %}{"name": "A"{% endschema %}');
    expect(out.issues[0]?.code).toBe("schema_json");
    expect(out.issues[0]?.line).toBe(1);
  });

  it("reports an empty schema", () => {
    expect(splitSectionFile("{% schema %}  {% endschema %}").issues[0]?.code).toBe("schema_empty");
  });

  it("removes a javascript block and reports it", () => {
    const out = splitSectionFile("<p>x</p>\n{% javascript %}alert(1){% endjavascript %}");
    expect(out.source).toBe("<p>x</p>");
    expect(out.issues).toEqual([expect.objectContaining({ code: "javascript_not_allowed", line: 2, column: 1 })]);
  });

  it("keeps only the first stylesheet and schema", () => {
    const out = splitSectionFile(
      '{% stylesheet %}a{}{% endstylesheet %}{% stylesheet %}b{}{% endstylesheet %}{% schema %}{"name":"A"}{% endschema %}{% schema %}{"name":"B"}{% endschema %}',
    );
    expect(out.css).toBe("a{}");
    expect(out.schema).toEqual({ name: "A" });
    expect(out.issues.map((i) => i.code)).toEqual(["duplicate_stylesheet", "duplicate_schema"]);
    expect(out.source).toBe("");
  });

  it("reports an unclosed block", () => {
    const out = splitSectionFile("<p>x</p>{% stylesheet %} p {}");
    expect(out.issues[0]).toMatchObject({ code: "unclosed_stylesheet", line: 1, column: 9 });
    expect(out.source).toBe("<p>x</p>");
  });

  it("leaves blocks inside raw and comment alone", () => {
    const file = "{% raw %}{% schema %}x{% endschema %}{% endraw %}{% comment %}{% stylesheet %}{% endstylesheet %}{% endcomment %}";
    const out = splitSectionFile(file);
    expect(out.source).toBe(file);
    expect(out.issues).toEqual([]);
  });
});

describe("joinSectionFile", () => {
  it("round-trips", () => {
    const parts = { source: '<div class="hero">{{ section.settings.title }}</div>', css: ".hero { padding: 2rem }", schema };
    expect(splitSectionFile(joinSectionFile(parts))).toEqual({ ...parts, issues: [] });
  });

  it("round-trips without css and source", () => {
    const parts = { source: "", css: "", schema: { name: "Empty", settings: [] } };
    const file = joinSectionFile(parts);
    expect(file).not.toContain("stylesheet");
    expect(splitSectionFile(file)).toEqual({ ...parts, issues: [] });
  });

  it("round-trips a schema whose strings hold Liquid delimiters", () => {
    const parts = { source: "<p></p>", css: "", schema: { name: "{% endschema %} and {{ x }}", settings: [] } };
    expect(splitSectionFile(joinSectionFile(parts))).toEqual({ ...parts, issues: [] });
  });

  it("round-trips a file it split", () => {
    const file = '<p>{{ section.settings.title }}</p>\n\n{% stylesheet %}\np { color: red }\n{% endstylesheet %}\n\n{% schema %}\n{\n  "name": "P"\n}\n{% endschema %}\n';
    expect(joinSectionFile(splitSectionFile(file))).toBe(file);
  });
});

describe("splitSectionFile JSON positions", () => {
  it("maps a positioned JSON error to the file", () => {
    const out = splitSectionFile('<p></p>\n{% schema %}{"name" "A"}{% endschema %}');
    expect(out.issues[0]).toMatchObject({ code: "schema_json", line: 2, column: 21 });
    expect(out.issues[0]?.message).toMatch(/Expected ':'/);
  });
});
