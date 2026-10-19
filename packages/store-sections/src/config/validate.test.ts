import { describe, expect, it } from "vitest";
import { validatePageContent, validateSiteConfig } from "./validate";
import { classicTemplateFixture, withHomeSections } from "./fixtures.test-utils";

const ALLOWED = {
  "classic-header": 1,
  "classic-footer": 1,
  "classic-hero": 1,
  "classic-categories": 1,
  "classic-catalog": 2,
};

describe("validateSiteConfig", () => {
  it("returns a migrated, parsed and sanitized config", () => {
    const raw = withHomeSections([
      { id: "s1", sectionId: "classic-hero", version: 1, props: { body: "<script>x</script>hi" } },
    ]);
    const result = validateSiteConfig(raw, { allowedSections: ALLOWED });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.pages[0]!.content.sections[0]!.props.body).toBe("hi");
  });

  it("accepts the classic template with the allow-list", () => {
    expect(validateSiteConfig(classicTemplateFixture(), { allowedSections: ALLOWED }).success).toBe(true);
  });

  it("migrates a version-0 config before validating", () => {
    const result = validateSiteConfig({ sections: [] });
    expect(result.success).toBe(true);
  });

  it("reports schema issues with paths", () => {
    const raw = classicTemplateFixture();
    raw.designSystem.colors.primary = "red;}";
    const result = validateSiteConfig(raw);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]).toMatchObject({ code: "invalid_schema" });
    expect(result.issues[0]!.path).toEqual(["designSystem", "colors", "primary"]);
  });

  it("rejects a section id that is not on the allow-list", () => {
    const raw = withHomeSections([{ id: "s1", sectionId: "booking-calendar", version: 1, props: {} }]);
    const result = validateSiteConfig(raw, { allowedSections: ALLOWED });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toContainEqual({
      code: "unknown_section",
      path: ["pages", 0, "content", "sections", 0, "sectionId"],
      message: "booking-calendar",
    });
  });

  it("rejects a section version newer than the registry knows", () => {
    const raw = withHomeSections([{ id: "s1", sectionId: "classic-hero", version: 3, props: {} }]);
    const result = validateSiteConfig(raw, { allowedSections: ALLOWED });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]!.code).toBe("unsupported_section_version");
  });

  it("checks header and footer against the allow-list", () => {
    const raw = classicTemplateFixture();
    raw.header.sectionId = "valorcy-navbar";
    const result = validateSiteConfig(raw, { allowedSections: ALLOWED });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]!.path).toEqual(["header", "sectionId"]);
  });

  it("rejects duplicate section instance ids on a page", () => {
    const raw = withHomeSections([
      { id: "s1", sectionId: "classic-hero", version: 1, props: {} },
      { id: "s1", sectionId: "classic-catalog", version: 1, props: {} },
    ]);
    const result = validateSiteConfig(raw);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]!.code).toBe("duplicate_section_id");
  });

  it("rejects configs over the size limit", () => {
    const raw = withHomeSections([
      { id: "s1", sectionId: "classic-hero", version: 1, props: { blob: "x".repeat(50) } },
    ]);
    const result = validateSiteConfig(raw, { maxBytes: 100 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]!.code).toBe("too_large");
  });

  it("rejects component trees deeper than the limit", () => {
    let node: Record<string, unknown> = { id: "leaf", type: "text", props: {}, children: [] };
    for (let i = 0; i < 30; i++) node = { id: `n${i}`, type: "div", props: {}, children: [node] };
    const raw = withHomeSections([
      { id: "s1", sectionId: "classic-hero", version: 1, props: {}, componentTree: [node] },
    ]);
    const result = validateSiteConfig(raw);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]!.code).toBe("tree_too_deep");
  });

  it("allows 400 elements in a section and refuses 401", () => {
    // Root + 3 groups + leaves: lists stay under the 200-children schema cap.
    const tree = (leaves: number) => {
      const sizes = [Math.ceil(leaves / 3), Math.ceil((leaves - Math.ceil(leaves / 3)) / 2)];
      sizes.push(leaves - sizes[0]! - sizes[1]!);
      const groups = sizes.map((size, g) => ({
        id: `g${g}`,
        type: "div",
        props: {},
        children: Array.from({ length: size }, (_, i) => ({ id: `l${g}-${i}`, type: "text", props: {}, children: [] })),
      }));
      return [{ id: "root", type: "section", props: {}, children: groups }];
    };
    const check = (leaves: number) =>
      validateSiteConfig(withHomeSections([{ id: "s1", sectionId: "custom-section", version: 1, props: {}, componentTree: tree(leaves) }]));
    expect(check(396).success).toBe(true);
    const over = check(397);
    expect(over.success).toBe(false);
    if (over.success) return;
    expect(over.issues.map((i) => i.code)).toContain("tree_too_large");
  });

  it("passes through a migration failure", () => {
    const result = validateSiteConfig({ ...classicTemplateFixture(), schemaVersion: 42 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues[0]!.code).toBe("unsupported_version");
  });
});

describe("validatePageContent", () => {
  it("parses and sanitizes one page's draft content", () => {
    const result = validatePageContent(
      { sections: [{ id: "s1", sectionId: "classic-hero", version: 1, props: { body: "<script>x</script>ok" } }] },
      { allowedSections: ALLOWED },
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sections[0]!.props.body).toBe("ok");
  });

  it("rejects customCode nodes and unknown sections", () => {
    const bad = validatePageContent(
      {
        sections: [
          {
            id: "s1",
            sectionId: "classic-hero",
            version: 1,
            props: {},
            componentTree: [{ id: "n", type: "customCode", props: {}, children: [] }],
          },
        ],
      },
      { allowedSections: ALLOWED },
    );
    expect(bad.success).toBe(false);
    const unknown = validatePageContent(
      { sections: [{ id: "s1", sectionId: "nope", version: 1, props: {} }] },
      { allowedSections: ALLOWED },
    );
    expect(unknown.success).toBe(false);
    if (unknown.success) return;
    expect(unknown.issues[0]!.code).toBe("unknown_section");
  });

  it("rejects non-objects and oversize content", () => {
    expect(validatePageContent("x").success).toBe(false);
    expect(validatePageContent({ sections: [{ id: "s1", sectionId: "a", version: 1, props: { b: "x".repeat(200) } }] }, { maxBytes: 100 }).success).toBe(false);
  });
});
