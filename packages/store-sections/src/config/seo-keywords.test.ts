import { describe, expect, it } from "vitest";
import { pageSeoSchema } from "./schema";
import { SEO_KEYWORDS_MAX } from "./seo-keywords";

describe("page SEO keywords", () => {
  it("are cleaned on save and optional", () => {
    expect(pageSeoSchema.parse({ keywords: [" a , b", "A"] }).keywords).toEqual(["a", "b"]);
    expect(pageSeoSchema.parse({})).not.toHaveProperty("keywords");
  });

  it("refuse too many or too long", () => {
    expect(pageSeoSchema.safeParse({ keywords: Array.from({ length: SEO_KEYWORDS_MAX + 1 }, (_, i) => `k${i}`) }).success).toBe(false);
    expect(pageSeoSchema.safeParse({ keywords: ["x".repeat(51)] }).success).toBe(false);
  });
});
