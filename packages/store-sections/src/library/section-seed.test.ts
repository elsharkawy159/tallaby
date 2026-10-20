import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DESIGNS } from "../designs";
import { librarySectionsSeedSql } from "./section-seed";

const MIGRATION = "0086_library_sections.sql";

describe("library sections seed", () => {
  const seed = librarySectionsSeedSql(DESIGNS);

  it("has one insert-only statement per design", () => {
    expect(seed.split("ON CONFLICT (key) DO NOTHING;").length - 1).toBe(DESIGNS.length);
    expect(seed).not.toMatch(/DO UPDATE/i);
  });

  it("is deterministic", () => {
    expect(librarySectionsSeedSql(DESIGNS)).toBe(seed);
  });

  it("is committed verbatim in the migration (regenerate with section:sql)", () => {
    const sql = readFileSync(join(__dirname, "../../../db/migrations", MIGRATION), "utf8").replace(/\r\n/g, "\n");
    expect(sql).toContain(seed);
  }, 60_000);
});
