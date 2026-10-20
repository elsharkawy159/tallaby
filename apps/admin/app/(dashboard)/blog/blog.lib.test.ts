import { describe, expect, it } from "vitest";
import { platformBlogPostInputSchema } from "@workspace/lib/platform-blog";
import { EMPTY_BLOG_FORM, formToInput, isEmptyHtml, isoToLocalInput, localInputToIso, parseTags } from "./blog.lib";

describe("admin blog form", () => {
  it("parses comma separated tags", () => {
    expect(parseTags(" Pricing, cod ,pricing,, ")).toEqual(["pricing", "cod"]);
  });

  it("treats an emptied editor as no body", () => {
    expect(isEmptyHtml("<p></p>")).toBe(true);
    expect(isEmptyHtml("<p>&nbsp;</p>")).toBe(true);
    expect(isEmptyHtml('<p><img src="https://x.supabase.co/a.png"></p>')).toBe(false);
    expect(isEmptyHtml("<p>Hi</p>")).toBe(false);
  });

  it("round-trips datetime-local values", () => {
    const iso = localInputToIso("2026-10-19T14:30");
    expect(iso).not.toBeNull();
    expect(isoToLocalInput(iso)).toBe("2026-10-19T14:30");
    expect(localInputToIso("")).toBeNull();
  });

  it("publishes now when no date is set, and the result validates", () => {
    const now = new Date("2026-10-19T10:00:00.000Z");
    const input = formToInput({ ...EMPTY_BLOG_FORM, slug: "hello", titleEn: "Hello", bodyEn: "<p></p>", readingMinutes: "5", status: "published" }, now);
    expect(input).toMatchObject({ publishedAt: now.toISOString(), bodyEn: "", readingMinutes: 5 });
    expect(platformBlogPostInputSchema.safeParse(input).success).toBe(true);
  });

  it("keeps a draft without a date", () => {
    const input = formToInput({ ...EMPTY_BLOG_FORM, slug: "draft" });
    expect(input.publishedAt).toBeNull();
    expect(platformBlogPostInputSchema.safeParse(input).success).toBe(true);
  });
});
