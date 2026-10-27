/**
 * docs/template-rules.md §2a: the section order every template keeps (owner,
 * 2026-10-27). The hero is always the first section under the header, the
 * categories come right after it, there is one hero only, and the page stays
 * short. What comes after the categories follows each template's own trade,
 * so it is not checked here.
 */
import { describe, expect, it } from "vitest";
import type { SectionInstance } from "../config/schema";
import { CODE_TEMPLATES } from "./catalog";
import type { TemplateDefinition } from "./types";

describe.each(CODE_TEMPLATES.map((template) => [template.key, template] as const))("section order: %s", (_key, template: TemplateDefinition) => {
  const home = template.config().pages.find((p) => p.isHome)!.content.sections;
  const categoryOf = (section: SectionInstance) => template.designs.find((d) => d.id === section.id)?.category;

  it("opens with the hero, and has only one", () => {
    expect(categoryOf(home[0]!), home[0]!.id).toBe("hero");
    expect(home.filter((s) => categoryOf(s) === "hero")).toHaveLength(1);
  });

  it("shows the categories right after the hero", () => {
    expect(categoryOf(home[1]!), home[1]?.id).toBe("categories");
  });

  it("keeps the home page short (at most 9 sections)", () => {
    expect(home.length).toBeLessThanOrEqual(9);
  });
});
