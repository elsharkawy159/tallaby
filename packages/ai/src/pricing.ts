/**
 * USD prices per 1M tokens (standard paid tier), from
 * https://ai.google.dev/gemini-api/docs/pricing (checked 2026-10-27).
 * Costs are kept in integer micro-USD.
 */

export type ModelPrice = {
  /** Text, image, video and PDF input. */
  input: number
  cachedInput: number
  /** Output, thinking tokens included. */
  output: number
}

export const MODEL_PRICES: Record<string, ModelPrice> = {
  "gemini-3.1-flash-lite": { input: 0.25, cachedInput: 0.025, output: 1.5 },
  // Fallbacks (checked 2026-10-28).
  "gemini-3.5-flash-lite": { input: 0.3, cachedInput: 0.03, output: 2.5 },
  "gemini-3.6-flash": { input: 0.75, cachedInput: 0.075, output: 3.75 },
}

/** Unknown models are priced like a mid Flash tier, so costs are never undercounted to zero. */
const FALLBACK_PRICE: ModelPrice = { input: 0.75, cachedInput: 0.075, output: 3.75 }

export type TokenUsage = {
  inputTokens?: number
  /** Part of `inputTokens` that was served from the cache. */
  cachedInputTokens?: number
  outputTokens?: number
}

const count = (value: number | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0

/** Cost of one call in micro-USD (1 USD = 1,000,000). Price per 1M tokens × tokens = micro-USD. */
export function costMicroUsd(model: string, usage: TokenUsage): number {
  const price = MODEL_PRICES[model] ?? FALLBACK_PRICE
  const input = count(usage.inputTokens)
  const cached = Math.min(count(usage.cachedInputTokens), input)
  const output = count(usage.outputTokens)
  return Math.ceil((input - cached) * price.input + cached * price.cachedInput + output * price.output)
}
