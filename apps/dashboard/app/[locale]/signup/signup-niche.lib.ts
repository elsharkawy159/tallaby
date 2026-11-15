import { nicheForIndustry } from "@workspace/lib/stores/niche";
import { OTHER_INDUSTRY_ID } from "@/lib/stores/industries.lib";

/**
 * The niche signup saves (owner, 2026-11-15): optional, and only a known
 * niche of the chosen industry. "Other" has no niches; anything else
 * (another industry's niche, "Something else", a made-up id) is dropped,
 * never an error, so the niche can't block signup.
 */
export function signupNiche(input: { industry: string; niche?: unknown }): string | null {
  return input.industry === OTHER_INDUSTRY_ID ? null : nicheForIndustry(input.niche, input.industry);
}
