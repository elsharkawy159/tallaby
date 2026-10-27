import { createGoogleGenerativeAI } from "@ai-sdk/google"

/** Server-only: the Gemini key never leaves server code (CLAUDE.md rule 10). */

const apiKey = () => process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || ""

/** AI is on when the key is set and `AI_ENABLED` is not "false" (the kill switch). */
export function aiConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  const enabled = env.AI_ENABLED?.trim().toLowerCase()
  return Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) && enabled !== "false" && enabled !== "0"
}

let provider: ReturnType<typeof createGoogleGenerativeAI> | null = null

export function google() {
  provider ??= createGoogleGenerativeAI({ apiKey: apiKey() })
  return provider
}
