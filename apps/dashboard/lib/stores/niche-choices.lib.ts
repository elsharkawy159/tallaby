/**
 * The niche chips of a store industry (owner, 2026-11-15): signup, the
 * create-store dialog and Store settings › General. Built on the server and
 * passed to the client as props, in the page's language, so no client file
 * imports the niche list. No React here.
 */
import { nichesOfIndustry } from "@workspace/store-sections/niches";

export type NicheChoice = { id: string; name: string };

/** Industry id → its niches as chips, in the niche list's order. */
export type NicheChoices = Record<string, NicheChoice[]>;

export function nicheChoices(industryIds: readonly string[], locale: string): NicheChoices {
  return Object.fromEntries(
    industryIds.map((id) => [id, nichesOfIndustry(id).map((niche) => ({ id: niche.id, name: locale === "en" ? niche.name.en : niche.name.ar }))]),
  );
}
