import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES, getCodeTemplate, templateMeta, templateSeedSql, templatesMetaSql, templatesSeedSql } from "./catalog";

/** Comment lines (rollback notes) do not count as statements. */
const statements = (sql: string) => sql.split("\n").filter((line) => !line.trimStart().startsWith("--")).join("\n");

describe("template seeds are insert-only", () => {
  // Policy from 0087 on. The applied seeds (0071 ... 0084) are frozen and were not regenerated.
  it.each(["tallaby-classic", "atelier", "mode"])("%s: newly generated SQL never updates an existing template", (key) => {
    const sql = statements(templateSeedSql(getCodeTemplate(key)!, "x"));
    expect(sql).not.toMatch(/DO UPDATE/i);
    expect(sql).toContain("ON CONFLICT (key) DO NOTHING");
    expect(sql).not.toMatch(/UPDATE templates\s+(t\s+)?SET current_version_id/i);
    // current_version_id is only written by the template INSERT, whose RETURNING feeds the version insert.
    expect(sql).toMatch(/INSERT INTO templates \([^)]*current_version_id\)/);
    expect(sql).toMatch(/RETURNING id, current_version_id/);
    expect(sql).toMatch(/INSERT INTO template_versions[\s\S]*FROM new_template/);
  });

  it("clears another default only when the default's key is new", () => {
    const sql = statements(templateSeedSql(getCodeTemplate("tallaby-classic")!, "x"));
    expect(sql).toMatch(/NOT EXISTS \(SELECT 1 FROM templates WHERE key = 'tallaby-classic'\)/);
    expect(statements(templatesSeedSql(CODE_TEMPLATES, "x"))).not.toMatch(/DO UPDATE/i);
  });
});

describe("template meta", () => {
  it("carries page names, the demo catalog and the palette", () => {
    const meta = templateMeta(getCodeTemplate("tallaby-classic")!);
    expect(meta.pageNames.home).toBeTruthy();
    expect(meta.demo.products.length).toBeGreaterThan(0);
    expect(meta.palette.length).toBeGreaterThan(0);
  });

  it("generates one guarded UPDATE per template, never overwriting edited meta", () => {
    const lines = templatesMetaSql(CODE_TEMPLATES).trim().split("\n");
    expect(lines).toHaveLength(CODE_TEMPLATES.length);
    for (const line of lines) expect(line).toMatch(/^UPDATE templates SET meta = '.*'::jsonb WHERE key = '[^']+' AND meta = '\{\}'::jsonb;$/);
  });

  // 0087 is new, so it must equal the generator's output. Once it is applied it becomes frozen
  // like 0084 (pin its sha256 in frozen-seeds.test-utils.ts and drop this equality check).
  it("0087 contains the generated meta updates verbatim", () => {
    const file = readFileSync(join(__dirname, "../../../db/migrations/0087_template_drafts.sql"), "utf8").replace(/\r\n/g, "\n");
    expect(file).toContain(templatesMetaSql(CODE_TEMPLATES));
    expect(file).toMatch(/ADD COLUMN IF NOT EXISTS draft_config jsonb/);
  });
});
