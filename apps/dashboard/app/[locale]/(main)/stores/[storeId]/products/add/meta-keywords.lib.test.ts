import { describe, expect, it } from "vitest"
import { cleanKeywords, META_KEYWORD_MAX_LENGTH, META_KEYWORDS_MAX } from "./meta-keywords.lib"

describe("cleanKeywords", () => {
  it("trims, collapses spaces and drops blanks and case-insensitive repeats", () => {
    expect(cleanKeywords(["  red  dress ", "", "Red Dress", "فستان", "   "])).toEqual(["red dress", "فستان"])
  })

  it("caps the count and each keyword's length", () => {
    const many = Array.from({ length: 30 }, (_, i) => `k${i}`)
    expect(cleanKeywords(many)).toHaveLength(META_KEYWORDS_MAX)
    expect(cleanKeywords(["x".repeat(100)])[0]).toHaveLength(META_KEYWORD_MAX_LENGTH)
  })

  it("accepts null, undefined and non-string entries", () => {
    expect(cleanKeywords(null)).toEqual([])
    expect(cleanKeywords(undefined)).toEqual([])
    expect(cleanKeywords([1 as unknown as string, "ok"])).toEqual(["ok"])
  })
})
