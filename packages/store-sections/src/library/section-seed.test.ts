import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DESIGNS } from "../designs";
import { TEMPLATE_OWN_DESIGNS } from "../templates/catalog";
import { FROZEN_SEEDS, migrationSha256 } from "../templates/frozen-seeds.test-utils";
import { librarySectionsSeedSql, newLibrarySectionsSeedSql, seededSectionKeys } from "./section-seed";

const MIGRATION = "0086_library_sections.sql";
const MIGRATIONS = join(__dirname, "../../../db/migrations");

describe("library sections seed", () => {
  const seed = librarySectionsSeedSql(DESIGNS);

  it("has one insert-only statement per design", () => {
    expect(seed.split("ON CONFLICT (key) DO NOTHING;").length - 1).toBe(DESIGNS.length);
    expect(seed).not.toMatch(/DO UPDATE/i);
    expect(seed).not.toMatch(/\b(UPDATE|DELETE|DROP|TRUNCATE)\b/);
    expect(seededSectionKeys([seed])).toEqual(new Set(DESIGNS.map((design) => design.id)));
  });

  it("is deterministic", () => {
    expect(librarySectionsSeedSql(DESIGNS)).toBe(seed);
  });

  // frozen: applied on staging and production 2026-10-20; DB is the master copy.
  // Designs added later are seeded by a new `section:sql --new-only` migration.
  it("0086 is frozen as applied", () => {
    expect(migrationSha256(MIGRATION)).toBe(FROZEN_SEEDS[MIGRATION]);
  });

  it("--new-only emits only designs no migration seeds yet, with their sort order", () => {
    const [first, second, third] = DESIGNS;
    const sql = newLibrarySectionsSeedSql([first!, second!, third!], new Set([first!.id, third!.id]));
    expect(seededSectionKeys([sql])).toEqual(new Set([second!.id]));
    expect(sql).toMatch(/\n  10\n\)\nON CONFLICT \(key\) DO NOTHING;\n$/);
    expect(newLibrarySectionsSeedSql(DESIGNS, new Set(DESIGNS.map((design) => design.id)))).toBe("");
  });

  it("writes hidden rows from a given sort order", () => {
    const [first, second] = DESIGNS;
    const sql = newLibrarySectionsSeedSql([first!, second!], new Set([first!.id]), { hidden: true, sortFrom: 10_000 });
    expect(sql).toContain("sort_order, is_hidden)");
    expect(sql).toMatch(/\n  10010,\n  true\n\)\nON CONFLICT \(key\) DO NOTHING;\n$/);
  });

  it("parses quoted keys", () => {
    expect(seededSectionKeys(["INSERT INTO library_sections (key, tree)\nVALUES (\n  'it''s', '{}'::jsonb\n)"])).toEqual(new Set(["it's"]));
  });

  it("every code design is seeded by some migration (else run section:sql --new-only)", () => {
    const sql = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith(".sql"))
      .map((name) => readFileSync(join(MIGRATIONS, name), "utf8"));
    const seeded = seededSectionKeys(sql);
    expect([...DESIGNS, ...TEMPLATE_OWN_DESIGNS].filter((design) => !seeded.has(design.id)).map((design) => design.id)).toEqual([]);
  }, 60_000);

  it("0105 seeds the Classic and Atelier designs hidden, with named trees", () => {
    const sql = readFileSync(join(MIGRATIONS, "0105_template_library_sections.sql"), "utf8").replace(/\r\n/g, "\n");
    expect(seededSectionKeys([sql])).toEqual(new Set(TEMPLATE_OWN_DESIGNS.map((design) => design.id)));
    expect(sql.split("ON CONFLICT (key) DO NOTHING;").length - 1).toBe(TEMPLATE_OWN_DESIGNS.length);
    expect(sql.match(/,\n  true\n\)\nON CONFLICT/g)?.length).toBe(TEMPLATE_OWN_DESIGNS.length);
    expect(sql).toContain('"field":"section"');
    expect(sql.replace(/^--.*$/gm, "")).not.toMatch(/\b(UPDATE|DELETE|DROP|TRUNCATE)\b/);
  });
});
