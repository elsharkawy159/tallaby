/**
 * The only place AI model ids live (PLAN.md AI-0). Callers ask for a tier,
 * never a model id, so a model swap is a one-line change here.
 */

export type ModelTier = "fast" | "smart"

/** Gemini 3.1 Flash-Lite (stable): cheap, multimodal, structured output. */
export const FAST_MODEL = "gemini-3.1-flash-lite"

/**
 * The stronger tier, used for escalation only (a failed or messy cheap call).
 * Set by `AI_MODEL_SMART`; defaults to the fast model until the owner picks one.
 */
export function modelIdForTier(tier: ModelTier, env: NodeJS.ProcessEnv = process.env): string {
  if (tier === "smart") return env.AI_MODEL_SMART?.trim() || FAST_MODEL
  return FAST_MODEL
}
