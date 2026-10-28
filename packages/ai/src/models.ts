/**
 * The only place AI model ids live (PLAN.md AI-0). Callers ask for a tier,
 * never a model id, so a model swap is a one-line change here.
 */

export type ModelTier = "fast" | "smart"

/** Gemini 3.1 Flash-Lite (stable): cheap, multimodal, structured output. */
export const FAST_MODEL = "gemini-3.1-flash-lite"

/**
 * Cheap models tried in order when the fast model fails (overloaded, timed
 * out, retired). `AI_MODEL_FALLBACKS` (comma-separated) replaces this list;
 * set it to an empty string to turn fallbacks off.
 */
export const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"]

/**
 * The stronger tier, used for escalation only (a failed or messy cheap call).
 * Set by `AI_MODEL_SMART`; defaults to the fast model until the owner picks one.
 */
export function modelIdForTier(tier: ModelTier, env: NodeJS.ProcessEnv = process.env): string {
  if (tier === "smart") return env.AI_MODEL_SMART?.trim() || FAST_MODEL
  return FAST_MODEL
}

/** Every model to try for a tier, first choice first, without repeats. */
export function modelChainForTier(tier: ModelTier, env: NodeJS.ProcessEnv = process.env): string[] {
  const first = modelIdForTier(tier, env)
  if (tier === "smart") return [first]
  const fallbacks =
    env.AI_MODEL_FALLBACKS === undefined
      ? FALLBACK_MODELS
      : env.AI_MODEL_FALLBACKS.split(",").map((id) => id.trim()).filter(Boolean)
  return [...new Set([first, ...fallbacks, modelIdForTier("smart", env)])]
}
