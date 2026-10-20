import { describe, expect, it } from "vitest";
import { CURRENT_SITE_CONFIG_VERSION, migrateSiteConfig } from "./migrate";
import { classicTemplateFixture } from "./fixtures.test-utils";
import { siteConfigSchema } from "./schema";

describe("migrateSiteConfig", () => {
  it("leaves a current config unchanged", () => {
    const config = classicTemplateFixture();
    const result = migrateSiteConfig(config);
    expect(result).toEqual({ ok: true, fromVersion: 1, migrated: false, config });
  });

  it("upgrades a version-0 page content (reference PageContent) into a home page", () => {
    const legacy = {
      sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { title: "x" } }],
    };
    const result = migrateSiteConfig(legacy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fromVersion).toBe(0);
    expect(result.migrated).toBe(true);
    const parsed = siteConfigSchema.parse(result.config);
    expect(parsed.schemaVersion).toBe(CURRENT_SITE_CONFIG_VERSION);
    expect(parsed.pages).toHaveLength(1);
    expect(parsed.pages[0]).toMatchObject({ slug: "home", isHome: true });
    expect(parsed.pages[0]!.content.sections[0]!.sectionId).toBe("classic-hero");
  });

  it("upgrades a version-0 multi-page config without schemaVersion", () => {
    const legacy = {
      pages: [
        { slug: "home", name: "Home", isHome: true, content: { sections: [] } },
        { slug: "about", name: "About", content: { sections: [] } },
      ],
    };
    const result = migrateSiteConfig(legacy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const parsed = siteConfigSchema.parse(result.config);
    expect(parsed.pages.map((p) => [p.slug, p.isHome])).toEqual([
      ["home", true],
      ["about", false],
    ]);
  });

  it("refuses a config from a newer version", () => {
    const result = migrateSiteConfig({ ...classicTemplateFixture(), schemaVersion: 99 });
    expect(result).toEqual({ ok: false, error: "unsupported_version", fromVersion: 99 });
  });

  it("refuses something that is not an object", () => {
    expect(migrateSiteConfig("nope")).toMatchObject({ ok: false, error: "invalid_config" });
    expect(migrateSiteConfig(null)).toMatchObject({ ok: false, error: "invalid_config" });
    expect(migrateSiteConfig([])).toMatchObject({ ok: false, error: "invalid_config" });
  });

  it("does not mutate its input", () => {
    const legacy = { sections: [] };
    migrateSiteConfig(legacy);
    expect(legacy).toEqual({ sections: [] });
  });
});
