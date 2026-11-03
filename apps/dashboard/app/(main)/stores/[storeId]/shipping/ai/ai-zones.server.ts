import { generateStructured } from "@workspace/ai";
import { AI_ZONES_FEATURE, aiZonesOutputSchema, type ProposedZone } from "./ai-zones.dto";
import { AI_ZONES_SYSTEM_RULES, aiZonesRequestText, cleanAiZones } from "./ai-zones.lib";

/**
 * Server side of "Describe your delivery areas" (ROADMAP.md F-45b). Called only
 * by the route handler, after the session, store, limits and credits are
 * checked. Nothing is saved here. Cost rules: docs/ai.md.
 */

/** The same seller sending the same text again within this window gets the stored answer, free. */
const RESULT_CACHE_MS = 10 * 60_000;

export async function proposeZones(
  sellerId: string,
  text: string,
  /** Its own usage-log name when another feature calls this (the AI Store Builder). */
  options: { feature?: string } = {},
): Promise<{ zones: ProposedZone[]; cached: boolean }> {
  const { object, cached } = await generateStructured({
    feature: options.feature ?? AI_ZONES_FEATURE,
    sellerId,
    tier: "fast",
    schema: aiZonesOutputSchema,
    system: AI_ZONES_SYSTEM_RULES,
    content: [{ type: "text", text: aiZonesRequestText(text) }],
    thinkingLevel: "minimal",
    // 800 characters of input can't need more; caps a runaway answer.
    maxOutputTokens: 1500,
    cacheMs: RESULT_CACHE_MS,
  });
  return { zones: cleanAiZones(object), cached: Boolean(cached) };
}
