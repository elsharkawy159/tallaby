import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES, DEFAULT_TEMPLATE, getCodeTemplate, templateMeta } from "./catalog";
import { resolveTemplateMeta, templateMetaSchema } from "./meta";

describe("resolveTemplateMeta (templates.meta → gallery data, code fallback per field)", () => {
  it("every code template's seeded meta (0087) parses back unchanged", () => {
    for (const template of CODE_TEMPLATES) {
      const seeded = JSON.parse(JSON.stringify(templateMeta(template)));
      expect(templateMetaSchema.safeParse(seeded).success, template.key).toBe(true);
      expect(resolveTemplateMeta(seeded, template.key)).toEqual(seeded);
    }
  });

  it("prefers the database values over the code copy", () => {
    const meta = { pageNames: { home: { ar: "بيت", en: "House" } }, demo: getCodeTemplate("atelier")!.demo, palette: ["#000000"] };
    const resolved = resolveTemplateMeta(meta, "tallaby-classic");
    expect(resolved.pageNames).toEqual({ home: { ar: "بيت", en: "House" } });
    expect(resolved.palette).toEqual(["#000000"]);
    expect(resolved.demo).toBe(meta.demo);
  });

  it("falls back to the code template for each missing or broken field", () => {
    const code = getCodeTemplate("atelier")!;
    const resolved = resolveTemplateMeta({ palette: ["#111111"], demo: { store: "broken" } }, "atelier");
    expect(resolved.palette).toEqual(["#111111"]);
    expect(resolved.pageNames).toEqual(code.pageNames);
    expect(resolved.demo).toBe(code.demo);
  });

  it("an admin-made template with empty meta gets the default demo catalog and no names or swatches", () => {
    for (const raw of [{}, null, undefined, "x", []]) {
      const resolved = resolveTemplateMeta(raw, "admin-made-template");
      expect(resolved.pageNames).toEqual({});
      expect(resolved.palette).toEqual([]);
      expect(resolved.demo).toBe(DEFAULT_TEMPLATE.demo);
    }
  });
});
