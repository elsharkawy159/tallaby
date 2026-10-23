import { describe, expect, it } from "vitest";
import { validateSiteConfig } from "../config/validate";
import { productPageOf } from "../config/product-page.lib";
import { CODE_TEMPLATES, getCodeTemplate } from "./catalog";
import { productPageJson, templatesProductPageSql } from "./product-page-sql";

const classic = getCodeTemplate("tallaby-classic")!;
const sql = templatesProductPageSql([classic], "0101_template_product_pages.sql");

describe("templatesProductPageSql", () => {
  it("appends the page only when no kind product page exists", () => {
    expect(sql).toContain("NOT EXISTS (SELECT 1 FROM jsonb_array_elements(cur.config->'pages') p WHERE p->>'kind' = 'product')");
    expect(sql).toContain("jsonb_set(cur.config, '{pages}', (cur.config->'pages') ||");
  });

  it("inserts version max+1 and repoints current_version_id", () => {
    expect(sql).toContain("max(v.version) + 1");
    expect(sql).toContain("'product page'");
    expect(sql).toContain("UPDATE templates t SET current_version_id");
  });

  it("gives draft_config the page under the same guard", () => {
    expect(sql).toContain("NOT EXISTS (SELECT 1 FROM jsonb_array_elements(t.draft_config->'pages') p WHERE p->>'kind' = 'product')");
    expect(sql).toContain("SET draft_config = jsonb_set(t.draft_config, '{pages}'");
  });

  it("fills pageNames.product without overwriting an existing value", () => {
    expect(sql).toContain("meta->'pageNames'->'product' IS NULL");
  });

  it("wraps everything in one transaction", () => {
    expect(sql.match(/^BEGIN;$/gm)).toHaveLength(1);
    expect(sql.match(/^COMMIT;$/gm)).toHaveLength(1);
  });

  it("page json validates for every code template", () => {
    for (const template of CODE_TEMPLATES) {
      const page = JSON.parse(productPageJson(template));
      expect(page.kind, template.key).toBe("product");
      const config = template.config();
      const result = validateSiteConfig({ ...config, pages: [...config.pages.filter((p) => p.kind !== "product"), page] });
      expect(result.success, template.key).toBe(true);
      if (result.success) expect(productPageOf(result.data)?.slug).toBe("product");
    }
  }, 30_000);

  it("doubles single quotes inside the embedded json", () => {
    const base = classic.config();
    const quoted = { ...classic, key: "x", config: () => ({ ...base, pages: base.pages.map((p) => (p.kind === "product" ? { ...p, name: "Owner's product" } : p)) }) } as typeof classic;
    const out = templatesProductPageSql([quoted], "t.sql");
    expect(out).toContain("Owner''s product");
    const literal = out.match(/\|\| '((?:[^']|'')*)'::jsonb/);
    expect(literal).not.toBeNull();
    expect(JSON.parse(literal![1]!.replace(/''/g, "'")).name).toBe("Owner's product");
  });

  it("bumps draft_version, locks the row and copies schema_version", () => {
    expect(sql).toContain("draft_version = t.draft_version + 1");
    expect(sql).toContain("FOR UPDATE;");
    expect(sql).toContain("cur.schema_version");
  });

  it("starts with an SQL comment", () => {
    expect(sql.trimStart().startsWith("--")).toBe(true);
  });
});
