import { describe, expect, it } from "vitest";
import { contentPagePaths } from "./content-routes.lib";
import { CONTENT_PAGES_LASTMOD, pageLastModified, STATIC_PAGE_LASTMOD } from "./sitemap.lib";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

describe("sitemap lastModified", () => {
  it("gives every static page a real, past date", () => {
    for (const [path, date] of Object.entries(STATIC_PAGE_LASTMOD)) {
      expect(date, path).toMatch(ISO_DAY);
      expect(Number.isNaN(Date.parse(date)), path).toBe(false);
      expect(Date.parse(date) <= Date.now(), path).toBe(true);
    }
    expect(Object.keys(STATIC_PAGE_LASTMOD)).toEqual(expect.arrayContaining(["/", "/pricing", "/templates", "/privacy"]));
  });

  it("dates every content page", () => {
    expect(CONTENT_PAGES_LASTMOD).toMatch(ISO_DAY);
    for (const path of contentPagePaths(true)) expect(pageLastModified(path), path).toMatch(ISO_DAY);
    expect(pageLastModified("/pricing")).toBe(STATIC_PAGE_LASTMOD["/pricing"]);
  });
});
