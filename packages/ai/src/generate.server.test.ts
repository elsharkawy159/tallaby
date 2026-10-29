import { beforeEach, describe, expect, it, vi } from "vitest"
import { APICallError, RetryError } from "ai"
import { MockLanguageModelV4 } from "ai/test"
import { z } from "zod"

const logs: Array<Record<string, unknown>> = []
vi.mock("./usage.server", () => ({ logAiUsage: async (row: Record<string, unknown>) => void logs.push(row) }))
vi.mock("./providers.server", () => ({ google: () => () => { throw new Error("no real model in tests") } }))

const { aiErrorKind, generateStructured } = await import("./generate.server")
const { clearResultCache } = await import("./result-cache.server")

const schema = z.object({ title: z.string() })

const result = (text: string) => ({
  content: [{ type: "text" as const, text }],
  finishReason: { unified: "stop" as const, raw: "STOP" },
  usage: {
    inputTokens: { total: 2000, noCache: 1000, cacheRead: 1000, cacheWrite: undefined },
    outputTokens: { total: 300, text: 300, reasoning: undefined },
  },
  warnings: [],
})

const base = {
  feature: "test",
  sellerId: "seller-1",
  schema,
  busyRetryDelayMs: 0,
  system: "rules",
  content: [{ type: "text" as const, text: "a red mug" }],
}

describe("generateStructured", () => {
  beforeEach(() => {
    logs.length = 0
    clearResultCache()
    delete process.env.AI_MODEL_SMART
    delete process.env.AI_MODEL_FALLBACKS
  })

  it("returns the parsed object and logs usage with cost", async () => {
    const model = new MockLanguageModelV4({ doGenerate: result('{"title":"Red mug"}') })
    const out = await generateStructured({ ...base, tier: "fast", model: () => model })
    expect(out.object).toEqual({ title: "Red mug" })
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      status: "ok",
      model: "gemini-3.1-flash-lite",
      inputTokens: 2000,
      cachedInputTokens: 1000,
      outputTokens: 300,
      costMicroUsd: 1000 * 0.25 + 1000 * 0.025 + 300 * 1.5,
    })
  })

  it("logs an error and rethrows when the output does not match the schema", async () => {
    const model = new MockLanguageModelV4({ doGenerate: result('{"nope":1}') })
    await expect(generateStructured({ ...base, tier: "fast", model: () => model })).rejects.toThrow()
    expect(logs.at(-1)).toMatchObject({ status: "error" })
  })

  it("retries once on the smart tier when it is a different model", async () => {
    process.env.AI_MODEL_SMART = "gemini-3.8-flash"
    process.env.AI_MODEL_FALLBACKS = ""
    const models: string[] = []
    const out = await generateStructured({
      ...base,
      tier: "fast",
      model: (id) => {
        models.push(id)
        return new MockLanguageModelV4({ doGenerate: result(id === "gemini-3.8-flash" ? '{"title":"ok"}' : "not json") })
      },
    })
    expect(models).toEqual(["gemini-3.1-flash-lite", "gemini-3.8-flash"])
    expect(out).toMatchObject({ object: { title: "ok" }, modelId: "gemini-3.8-flash" })
    expect(logs.map((l) => l.status)).toEqual(["error", "ok"])
  })

  it("falls back to the next cheap model when the first is overloaded", async () => {
    const models: string[] = []
    const out = await generateStructured({
      ...base,
      tier: "fast",
      model: (id) => {
        models.push(id)
        return new MockLanguageModelV4({
          doGenerate: async () => {
            if (id === "gemini-3.1-flash-lite") throw busyError()
            return result('{"title":"ok"}')
          },
        })
      },
    })
    // One wait-and-retry on the cheapest model, then the next model.
    expect(models).toEqual(["gemini-3.1-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"])
    expect(out.modelId).toBe("gemini-3.5-flash-lite")
    expect(logs).toMatchObject([
      { status: "error", model: "gemini-3.1-flash-lite", errorCode: "APICallError_503" },
      { status: "error", model: "gemini-3.1-flash-lite", errorCode: "APICallError_503" },
      { status: "ok", model: "gemini-3.5-flash-lite" },
    ])
  })

  it("answers from the cheapest model when its retry after a busy error works", async () => {
    let calls = 0
    const out = await generateStructured({
      ...base,
      tier: "fast",
      model: () =>
        new MockLanguageModelV4({
          doGenerate: async () => {
            if (calls++ === 0) throw busyError()
            return result('{"title":"ok"}')
          },
        }),
    })
    expect(out.modelId).toBe("gemini-3.1-flash-lite")
    expect(logs.map((l) => l.status)).toEqual(["error", "ok"])
  })

  it("does not retry the same model after a non-busy error", async () => {
    const models: string[] = []
    await generateStructured({
      ...base,
      tier: "fast",
      model: (id) => {
        models.push(id)
        return new MockLanguageModelV4({ doGenerate: result(id === "gemini-3.1-flash-lite" ? "not json" : '{"title":"ok"}') })
      },
    })
    expect(models).toEqual(["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"])
  })

  it("returns a cached answer for the same input, without a model call or a usage row", async () => {
    let calls = 0
    const model = () => {
      calls++
      return new MockLanguageModelV4({ doGenerate: result('{"title":"Red mug"}') })
    }
    const first = await generateStructured({ ...base, tier: "fast", cacheMs: 60_000, model })
    const second = await generateStructured({ ...base, tier: "fast", cacheMs: 60_000, model })
    expect(second).toMatchObject({ object: first.object, cached: true })
    expect(calls).toBe(1)
    expect(logs).toHaveLength(1)
    // Different input, or another seller: a real call.
    await generateStructured({ ...base, tier: "fast", cacheMs: 60_000, model, content: [{ type: "text", text: "a blue mug" }] })
    await generateStructured({ ...base, tier: "fast", cacheMs: 60_000, model, sellerId: "seller-2" })
    expect(calls).toBe(3)
  })

  it("does not cache without cacheMs", async () => {
    let calls = 0
    const model = () => {
      calls++
      return new MockLanguageModelV4({ doGenerate: result('{"title":"Red mug"}') })
    }
    await generateStructured({ ...base, tier: "fast", model })
    await generateStructured({ ...base, tier: "fast", model })
    expect(calls).toBe(2)
  })

  it("sends the media resolution and thinking level asked for", async () => {
    const model = new MockLanguageModelV4({ doGenerate: result('{"title":"ok"}') })
    await generateStructured({ ...base, tier: "fast", model: () => model, mediaResolution: "low", thinkingLevel: "minimal" })
    expect(model.doGenerateCalls[0]?.providerOptions?.google).toMatchObject({
      mediaResolution: "MEDIA_RESOLUTION_LOW",
      thinkingConfig: { thinkingLevel: "minimal" },
    })
  })

  it("tries every model once, then rethrows the last error", async () => {
    const models: string[] = []
    const call = generateStructured({
      ...base,
      tier: "fast",
      model: (id) => {
        models.push(id)
        return new MockLanguageModelV4({ doGenerate: async () => { throw busyError() } })
      },
    })
    await expect(call).rejects.toSatisfy((error) => aiErrorKind(error) === "busy")
    expect(models).toEqual(["gemini-3.1-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"])
  })

  it("does not start another model when the time budget is used up", async () => {
    const models: string[] = []
    const call = generateStructured({
      ...base,
      tier: "fast",
      budgetMs: 0,
      model: (id) => {
        models.push(id)
        return new MockLanguageModelV4({ doGenerate: async () => { throw busyError() } })
      },
    })
    await expect(call).rejects.toThrow()
    expect(models).toEqual(["gemini-3.1-flash-lite"])
  })
})

const busyError = () =>
  new APICallError({
    message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode: 503,
    isRetryable: true,
  })

describe("aiErrorKind", () => {
  it("reads a busy provider, also behind a retry wrapper", () => {
    expect(aiErrorKind(busyError())).toBe("busy")
    const retry = new RetryError({ message: "Failed after 2 attempts.", reason: "maxRetriesExceeded", errors: [busyError(), busyError()] })
    expect(aiErrorKind(retry)).toBe("busy")
  })

  it("reads a timeout", () => {
    expect(aiErrorKind(new DOMException("The operation timed out.", "TimeoutError"))).toBe("timeout")
  })

  it("falls back to failed", () => {
    expect(aiErrorKind(new Error("No object generated"))).toBe("failed")
  })
})
