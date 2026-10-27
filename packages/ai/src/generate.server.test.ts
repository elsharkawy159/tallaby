import { beforeEach, describe, expect, it, vi } from "vitest"
import { MockLanguageModelV4 } from "ai/test"
import { z } from "zod"

const logs: Array<Record<string, unknown>> = []
vi.mock("./usage.server", () => ({ logAiUsage: async (row: Record<string, unknown>) => void logs.push(row) }))
vi.mock("./providers.server", () => ({ google: () => () => { throw new Error("no real model in tests") } }))

const { generateStructured } = await import("./generate.server")

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
  system: "rules",
  content: [{ type: "text" as const, text: "a red mug" }],
}

describe("generateStructured", () => {
  beforeEach(() => {
    logs.length = 0
    delete process.env.AI_MODEL_SMART
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
})
