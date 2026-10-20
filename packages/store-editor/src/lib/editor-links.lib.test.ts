import { describe, expect, it } from "vitest";
import { defaultEditorLinks, resolveEditorLinks } from "./editor-links.lib";

describe("resolveEditorLinks", () => {
  it("defaults to the dashboard pages of the store", () => {
    expect(resolveEditorLinks("s1")).toEqual({
      back: "/stores/s1/website",
      design: "/stores/s1/website/design",
      settings: "/stores/s1/settings",
      manageForms: "website/forms",
      formSubmissions: "/stores/s1/website/forms/submissions",
      formEditBase: "/stores/s1/website/forms",
      dataActions: true,
    });
  });

  it("applies overrides, null hides a link and undefined keeps the default", () => {
    const links = resolveEditorLinks("s1", { back: "/stores/s1", design: null, settings: undefined, dataActions: false });
    expect(links.back).toBe("/stores/s1");
    expect(links.design).toBeNull();
    expect(links.settings).toBe(defaultEditorLinks("s1").settings);
    expect(links.dataActions).toBe(false);
  });
});
