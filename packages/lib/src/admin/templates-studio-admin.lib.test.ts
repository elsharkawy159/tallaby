import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES } from "@workspace/store-sections/templates";
import { blankTemplateConfig, prepareTemplateConfig, templateCreateSchema, templateKeySchema } from "./templates-studio-admin.lib";

const NAME = { ar: "قالب", en: "Template" };

describe("blankTemplateConfig", () => {
  it("is valid: one empty home page, no header or footer", () => {
    const prepared = prepareTemplateConfig(blankTemplateConfig());
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) return;
    expect(prepared.config.pages).toHaveLength(1);
    expect(prepared.config.pages[0]).toMatchObject({ isHome: true, content: { sections: [] } });
    expect(prepared.config.header).toBeNull();
    expect(prepared.config.footer).toBeNull();
  });
});

describe("prepareTemplateConfig", () => {
  it("accepts every code template config", () => {
    for (const template of CODE_TEMPLATES) expect(prepareTemplateConfig(template.config()).ok, template.key).toBe(true);
  });

  it("refuses junk and a config without exactly one home page", () => {
    expect(prepareTemplateConfig(null).ok).toBe(false);
    expect(prepareTemplateConfig("x").ok).toBe(false);
    const noHome = blankTemplateConfig();
    noHome.pages[0]!.isHome = false;
    expect(prepareTemplateConfig(noHome).ok).toBe(false);
  });
});

describe("template input", () => {
  it("accepts a slug key and trims it", () => {
    expect(templateKeySchema.safeParse(" my-template-2 ").data).toBe("my-template-2");
  });

  it("refuses a bad key", () => {
    for (const key of ["A", "a", "Bad_Key", "-x", "x y", "../x", "", "a".repeat(64)]) expect(templateKeySchema.safeParse(key).success, key).toBe(false);
  });

  it("requires names in both languages and rejects extra fields", () => {
    const ok = { key: "my-tpl", name: NAME, description: { ar: "", en: "" }, category: "fashion" };
    expect(templateCreateSchema.safeParse(ok).success).toBe(true);
    expect(templateCreateSchema.safeParse({ ...ok, name: { ar: "", en: "x" } }).success).toBe(false);
    expect(templateCreateSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false);
  });
});
