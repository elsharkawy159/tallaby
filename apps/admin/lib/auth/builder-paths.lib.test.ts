import { describe, expect, it } from "vitest";
import { canUseBuilder, isBuilderPath } from "./builder-paths.lib";

describe("builder paths", () => {
  it("matches the store and template editors and the sections pages", () => {
    for (const path of ["/stores/abc/editor", "/stores/abc/editor/", "/templates/classic/editor", "/sections", "/sections/hero-1"]) {
      expect(isBuilderPath(path)).toBe(true);
    }
  });

  it("leaves other admin pages alone", () => {
    for (const path of ["/stores", "/stores/abc", "/stores/abc/editorial", "/templates", "/templates/classic", "/sectionsx", "/"]) {
      expect(isBuilderPath(path)).toBe(false);
    }
  });

  it("lets only admins and super admins in", () => {
    expect(canUseBuilder("admin")).toBe(true);
    expect(canUseBuilder("super_admin")).toBe(true);
    expect(canUseBuilder("moderator")).toBe(false);
    expect(canUseBuilder(null)).toBe(false);
  });
});
