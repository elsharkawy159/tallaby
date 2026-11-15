import { describe, expect, it } from "vitest";
import { EMPTY_POST, parseTags, toPostForm, toPostInput } from "./blog.lib";

describe("blog editor helpers", () => {
  it("parses tags typed with commas (Arabic too), dedupes and lowercases", () => {
    expect(parseTags("News, news،  Size Guide ; ")).toEqual(["news", "size guide"]);
  });

  it("drafts keep their date but stay drafts", () => {
    const input = toPostInput({ ...EMPTY_POST, slug: " Hello ", title: "T", mode: "draft" }, "2026-01-01T00:00:00.000Z");
    expect(input).toMatchObject({ slug: "hello", status: "draft", publishedAt: "2026-01-01T00:00:00.000Z" });
  });

  it("publishing now keeps a past date and replaces a future one", () => {
    expect(toPostInput({ ...EMPTY_POST, mode: "publish" }, "2026-01-01T00:00:00.000Z").publishedAt).toBe("2026-01-01T00:00:00.000Z");
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const now = toPostInput({ ...EMPTY_POST, mode: "publish" }, future).publishedAt!;
    expect(new Date(now).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("scheduling sends the chosen local time as ISO", () => {
    const input = toPostInput({ ...EMPTY_POST, mode: "schedule", scheduledAt: "2030-05-01T09:30" }, null);
    expect(input.status).toBe("published");
    expect(new Date(input.publishedAt!).getTime()).toBe(new Date("2030-05-01T09:30").getTime());
  });

  it("round-trips a stored post", () => {
    const form = toPostForm({
      slug: "a",
      state: "scheduled",
      publishedAt: "2030-05-01T09:30:00.000Z",
      data: { title: "T", tags: ["x", 3], body: "<p>b</p>" },
      seo: { title: "", description: "", ogImage: "", noindex: false },
    });
    expect(form).toMatchObject({ slug: "a", title: "T", tags: ["x"], body: "<p>b</p>", mode: "schedule" });
    expect(form.scheduledAt).toMatch(/^2030-05-01T\d{2}:30$/);
  });
});
