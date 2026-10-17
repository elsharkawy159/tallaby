import { describe, expect, it } from "vitest";
import { createTableRelationsHelpers, extractTablesRelationalConfig, normalizeRelation } from "drizzle-orm";
import * as schema from "./schema";
import * as relations from "./relations";

// Drizzle resolves relations lazily, so an ambiguous or broken relation only
// throws at query time. Normalize every relation up front instead.
describe("drizzle relations", () => {
  const config = extractTablesRelationalConfig({ ...schema, ...relations }, createTableRelationsHelpers);

  it("normalizes every declared relation", () => {
    const failures: string[] = [];
    for (const [tableName, table] of Object.entries(config.tables)) {
      for (const [name, relation] of Object.entries(table.relations)) {
        try {
          normalizeRelation(config.tables, config.tableNamesMap, relation);
        } catch (error) {
          failures.push(`${tableName}.${name}: ${(error as Error).message}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("exposes the multi-store relations", () => {
    expect(Object.keys(config.tables.stores?.relations ?? {})).toEqual(
      expect.arrayContaining(["seller", "pages", "revisions", "designSystem", "forms"]),
    );
    expect(Object.keys(config.tables.sellers?.relations ?? {})).toContain("stores");
  });
});
