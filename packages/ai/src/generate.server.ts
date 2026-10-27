import { generateText, Output, type LanguageModel } from "ai"
import type { z } from "zod"
import { modelIdForTier, type ModelTier } from "./models"
import { costMicroUsd } from "./pricing"
import { google } from "./providers.server"
import { logAiUsage } from "./usage.server"

/**
 * One structured (zod) model call with usage logging (PLAN.md AI-0). Every
 * call writes an ai_usage_logs row, success or failure. A failed cheap call
 * is retried once on the smart tier when that is a different model.
 */

export type GenerateContentPart =
  | { type: "text"; text: string }
  | { type: "image"; data: Uint8Array; mediaType: string }
  | { type: "file"; data: Uint8Array; mediaType: string }

export type GenerateStructuredOptions<TSchema extends z.ZodType> = {
  /** Usage-log key, e.g. "product_autofill". */
  feature: string
  /** From the session, never from the client or the model. */
  sellerId: string
  tier: ModelTier
  schema: TSchema
  system: string
  content: GenerateContentPart[]
  /** Test seam: replaces the Gemini model. */
  model?: (modelId: string) => LanguageModel
  maxOutputTokens?: number
}

// AI SDK v7 takes images as file parts with an image/* media type.
const toSdkPart = (part: GenerateContentPart) =>
  part.type === "text" ? part : { type: "file" as const, data: part.data, mediaType: part.mediaType }

type CallUsage = { inputTokens?: number; cachedInputTokens?: number; outputTokens?: number }

const errorCode = (error: unknown) => {
  const name = error instanceof Error ? error.name : "unknown"
  return name.replace(/^AI_/, "").slice(0, 60) || "unknown"
}

async function callOnce<TSchema extends z.ZodType>(modelId: string, options: GenerateStructuredOptions<TSchema>) {
  const model = options.model ? options.model(modelId) : google()(modelId)
  const started = Date.now()
  try {
    const result = await generateText({
      model,
      instructions: options.system,
      messages: [{ role: "user", content: options.content.map(toSdkPart) }],
      output: Output.object({ schema: options.schema }),
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      temperature: 0.4,
      maxRetries: 1,
      timeout: 45_000,
      providerOptions: {
        google: {
          // Listing copy needs little reasoning; thinking tokens bill as output.
          thinkingConfig: { thinkingLevel: "low" },
          mediaResolution: "MEDIA_RESOLUTION_MEDIUM",
        },
      },
    })
    const usage = readUsage(result.usage)
    await logAiUsage({
      sellerId: options.sellerId,
      feature: options.feature,
      model: modelId,
      status: "ok",
      ...usage,
      costMicroUsd: costMicroUsd(modelId, usage),
      latencyMs: Date.now() - started,
    })
    return { object: result.output as z.infer<TSchema>, usage }
  } catch (error) {
    await logAiUsage({
      sellerId: options.sellerId,
      feature: options.feature,
      model: modelId,
      status: "error",
      latencyMs: Date.now() - started,
      errorCode: errorCode(error),
    })
    throw error
  }
}

function readUsage(usage: unknown): CallUsage {
  const u = (usage ?? {}) as Record<string, unknown>
  const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined)
  const details = (u.inputTokenDetails ?? {}) as Record<string, unknown>
  return {
    inputTokens: num(u.inputTokens),
    cachedInputTokens: num(details.cacheReadTokens) ?? num(u.cachedInputTokens),
    outputTokens: num(u.outputTokens),
  }
}

export async function generateStructured<TSchema extends z.ZodType>(
  options: GenerateStructuredOptions<TSchema>,
): Promise<{ object: z.infer<TSchema>; usage: CallUsage; modelId: string }> {
  const first = modelIdForTier(options.tier)
  try {
    return { ...(await callOnce(first, options)), modelId: first }
  } catch (error) {
    const smart = modelIdForTier("smart")
    if (options.tier !== "fast" || smart === first) throw error
    return { ...(await callOnce(smart, options)), modelId: smart }
  }
}
