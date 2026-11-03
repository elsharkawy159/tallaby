import { z } from "zod";

/**
 * "Describe your delivery areas" (ROADMAP.md F-45b): what the seller sends and
 * what the model returns. The model returns plain place names; the code matches
 * them to place keys and builds the zone names (ai-zones.lib.ts, docs/ai.md).
 * Nothing here saves: the seller confirms in the review sheet.
 */

export const AI_ZONES_FEATURE = "shipping_zones";

export const AI_ZONES_LIMITS = {
  /** Billed on every call, shown with a counter. Enough for a dozen zones. */
  maxTextLength: 800,
  maxZones: 30,
  maxNamesPerZone: 40,
} as const;

// Flat and nullable on purpose: Gemini structured output has a complexity limit.
// Every value is clamped again in cleanAiZones.
export const aiZonesOutputSchema = z.object({
  zones: z
    .array(
      z.object({
        places: z.array(z.string()).describe("Place names as the seller wrote them, one name per item."),
        price: z.number().nullable().describe("Delivery price in EGP. 0 if free. Null if not stated."),
        daysMin: z.number().nullable().describe("Fastest delivery in days. Null if not stated."),
        daysMax: z.number().nullable().describe("Slowest delivery in days. Null if not stated."),
        freeOver: z.number().nullable().describe("Order total in EGP from which delivery is free. Null if not stated."),
      }),
    )
    .describe("One item per group of places sharing a price."),
});

export type AiZonesOutput = z.output<typeof aiZonesOutputSchema>;

/** A zone proposed to the seller. `unmatched` names were not recognised and are shown, never dropped or guessed. */
export type ProposedZone = {
  nameAr: string;
  nameEn: string;
  places: string[];
  unmatched: string[];
  /** Null when the seller did not state one: the review sheet asks for it. */
  price: number | null;
  freeOver: number | null;
  daysMin: number;
  daysMax: number;
  /** The seller stated no delivery time, so these are the new-zone defaults. */
  daysAssumed: boolean;
};

/** Error codes returned by the route; the client maps them to `storeShipping.describe.errors.*`. */
export type AiZonesErrorCode =
  | "unauthorized"
  | "notFound"
  | "readOnly"
  | "disabled"
  | "empty"
  | "tooLong"
  | "noZones"
  | "rateLimited"
  | "dailyLimit"
  | "noCredits"
  | "busy"
  | "timeout"
  | "failed";

export type AiZonesResponse =
  | { ok: true; zones: ProposedZone[]; remainingToday: number; creditsRemaining?: number }
  | { ok: false; error: AiZonesErrorCode };

export function validateAiZonesText(text: string): AiZonesErrorCode | null {
  if (!text.trim()) return "empty";
  if (text.length > AI_ZONES_LIMITS.maxTextLength) return "tooLong";
  return null;
}
