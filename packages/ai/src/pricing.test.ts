import { describe, expect, it } from "vitest"
import { costMicroUsd } from "./pricing"

describe("costMicroUsd", () => {
  it("prices Flash-Lite input, cached input and output per 1M tokens", () => {
    // 10k input (4k cached) + 1.5k output = 6000×0.25 + 4000×0.025 + 1500×1.5
    expect(costMicroUsd("gemini-3.1-flash-lite", { inputTokens: 10_000, cachedInputTokens: 4_000, outputTokens: 1_500 })).toBe(
      1500 + 100 + 2250,
    )
  })

  it("never counts more cached tokens than input tokens", () => {
    expect(costMicroUsd("gemini-3.1-flash-lite", { inputTokens: 100, cachedInputTokens: 500 })).toBe(3)
  })

  it("prices unknown models with the fallback instead of zero", () => {
    expect(costMicroUsd("some-new-model", { inputTokens: 1_000_000 })).toBe(750_000)
  })

  it("ignores missing or invalid counts", () => {
    expect(costMicroUsd("gemini-3.1-flash-lite", { inputTokens: Number.NaN, outputTokens: -5 })).toBe(0)
  })
})
