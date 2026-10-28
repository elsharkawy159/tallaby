import { APICallError, generateText, Output, RetryError, type LanguageModel } from "ai"
import type { z } from "zod"
import { modelChainForTier, type ModelTier } from "./models"
import { costMicroUsd } from "./pricing"
import { google } from "./providers.server"
import { logAiUsage } from "./usage.server"

/**
 * One structured (zod) model call with usage logging (PLAN.md AI-0). Every
 * call writes an ai_usage_logs row, success or failure. A failed call moves
 * on to the next model of the tier's chain (cheap fallbacks, then the smart
 * tier), within one time budget that fits the route's 60 s limit.
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
  /** Total time for every attempt together, in ms. */
  budgetMs?: number
}

/** Fits inside a 60 s route with time left to answer. */
const DEFAULT_BUDGET_MS = 50_000
const MAX_CALL_MS = 40_000
/** Not worth starting another model with less time than this. */
const MIN_CALL_MS = 8_000

// AI SDK v7 takes images as file parts with an image/* media type.
const toSdkPart = (part: GenerateContentPart) =>
  part.type === "text" ? part : { type: "file" as const, data: part.data, mediaType: part.mediaType }

type CallUsage = { inputTokens?: number; cachedInputTokens?: number; outputTokens?: number }

/** The provider error behind an SDK retry wrapper. */
const rootError = (error: unknown): unknown => (RetryError.isInstance(error) ? error.lastError : error)

const errorCode = (error: unknown) => {
  const root = rootError(error)
  const name = root instanceof Error ? root.name : "unknown"
  const status = APICallError.isInstance(root) && root.statusCode ? `_${root.statusCode}` : ""
  return `${name.replace(/^AI_/, "")}${status}`.slice(0, 60) || "unknown"
}

export type AiErrorKind = "busy" | "timeout" | "failed"

/** What went wrong, for the message a seller sees: provider overloaded, too slow, or anything else. */
export function aiErrorKind(error: unknown): AiErrorKind {
  const root = rootError(error)
  const name = root instanceof Error ? root.name : ""
  const message = root instanceof Error ? root.message : String(root ?? "")
  if (name === "TimeoutError" || name === "AbortError" || /timed? ?out|deadline/i.test(message)) return "timeout"
  if (APICallError.isInstance(root) && [429, 500, 503, 504, 529].includes(root.statusCode ?? 0)) return "busy"
  if (/high demand|overloaded|unavailable|resource.?exhausted|try again later/i.test(message)) return "busy"
  return "failed"
}

// Gemini 2.x takes a thinking budget; 3.x a thinking level.
const thinkingConfig = (modelId: string) =>
  /^gemini-2\./.test(modelId) ? { thinkingBudget: 0 } : { thinkingLevel: "low" }

async function callOnce<TSchema extends z.ZodType>(
  modelId: string,
  options: GenerateStructuredOptions<TSchema>,
  timeoutMs: number,
) {
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
      // An overloaded model rarely recovers in seconds; the next model is the retry.
      maxRetries: 0,
      timeout: timeoutMs,
      providerOptions: {
        google: {
          // Listing copy needs little reasoning; thinking tokens bill as output.
          thinkingConfig: thinkingConfig(modelId),
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
  const deadline = Date.now() + (options.budgetMs ?? DEFAULT_BUDGET_MS)
  let lastError: unknown
  for (const [index, modelId] of modelChainForTier(options.tier).entries()) {
    const left = deadline - Date.now()
    if (index > 0 && left < MIN_CALL_MS) break
    try {
      return { ...(await callOnce(modelId, options, Math.min(MAX_CALL_MS, left))), modelId }
    } catch (error) {
      lastError = error
      console.warn(`[ai] ${options.feature} on ${modelId} failed (${errorCode(error)})`)
    }
  }
  throw lastError
}
