import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateSiteConfig } from "../config/validate";
import { storeSectionRegistry } from "../sections";
import { CLASSIC_JSON_END, CLASSIC_JSON_START, classicTemplateConfigJson, classicTemplateMigrationSql } from "./classic-sql";
import { classicHomeContent, tallabyClassicConfig } from "./tallaby-classic";

const MIGRATION = join(__dirname, "../../../db/migrations/0062_tallaby_classic_template_v2.sql");

describe("Tallaby Classic template (P4-03)", () => {
  it("is a valid SiteConfig made only of known sections", () => {
    const result = validateSiteConfig(tallabyClassicConfig(), { allowedSections: storeSectionRegistry.allowedSections() });
    expect(result.success).toBe(true);
  });

  it("is today's storefront: classic header, store front, category circles, all products, classic footer", () => {
    const config = tallabyClassicConfig();
    expect(config.header?.sectionId).toBe("classic-header");
    expect(config.footer?.sectionId).toBe("classic-footer");
    expect(classicHomeContent().sections.map((s) => s.sectionId)).toEqual(["classic-hero", "classic-categories", "classic-catalog"]);
    expect(storeSectionRegistry.get("classic-header")?.chrome).toBe("header");
    expect(storeSectionRegistry.get("classic-footer")?.chrome).toBe("footer");
  });

  it("matches the committed 0062 seed (regenerate with classic:sql)", () => {
    const sql = readFileSync(MIGRATION, "utf8").replace(/\r\n/g, "\n");
    expect(sql).toBe(classicTemplateMigrationSql("0062_tallaby_classic_template_v2.sql"));
    const json = sql.split(CLASSIC_JSON_START)[1]!.split(CLASSIC_JSON_END)[0]!.trim().replace(/^'|'::jsonb,$/g, "").replace(/''/g, "'");
    expect(JSON.parse(json)).toEqual(JSON.parse(classicTemplateConfigJson()));
  });
});
