/**
 * Niche filters of a template gallery (ROADMAP F-90,
 * docs/systems/one-template-per-niche.md §1), shared by the dashboard's
 * Website › Templates and Admin's change-theme dialog. Pure, but it reads the
 * code template data, so keep it on the server. `switched` is a parameter
 * only so tests can pass a set; callers leave it out.
 */
import {
  SWITCHED_INDUSTRIES,
  editionsForNiche,
  getNiche,
  isIndustrySwitched,
  nicheTemplateFirst,
  offeredNiches,
  switchedNicheCard,
  switchedNicheTemplates,
  type NicheOption,
} from "@workspace/store-sections/templates";
import type { NicheCardView } from "../templates.dto";

export { cardEdition, templatePreviewPageUrl } from "./template-edition.lib";

/**
 * A category tab's niche filter. A switched industry (niche-only): one tab
 * per ready niche row whose template is in the gallery, in niche order; a
 * niche tab lists that one template, and the category tab lists them all
 * (`tabLooks`). Any other tab: the niches with an edition on a listed look,
 * a niche tab listing its looks with its niche template first.
 */
export function galleryNiches(
  tab: string,
  keys: ReadonlySet<string>,
  switched: ReadonlySet<string> = SWITCHED_INDUSTRIES,
): { switched: boolean; niches: NicheOption[]; tabLooks: string[] | null; looksOf: (niche: string | null) => string[] } {
  if (tab !== "all" && isIndustrySwitched(tab, switched)) {
    const rows = switchedNicheTemplates(tab, switched).filter((row) => keys.has(row.template));
    return {
      switched: true,
      niches: rows.flatMap((row) => {
        const niche = getNiche(row.niche);
        return niche ? [{ id: niche.id, name: niche.name }] : [];
      }),
      tabLooks: rows.map((row) => row.template),
      looksOf: (niche) => rows.filter((row) => row.niche === niche).map((row) => row.template),
    };
  }
  const niches = tab === "all" ? [] : offeredNiches(tab).filter((option) => editionsForNiche(option.id).some((entry) => keys.has(entry.look)));
  return {
    switched: false,
    niches,
    tabLooks: null,
    looksOf: (niche) => (niche ? nicheTemplateFirst(niche, editionsForNiche(niche).map((entry) => entry.look)) : []),
  };
}

/** The niche cards among these templates (switched industries only): key → its niche, name and edition. */
export function nicheCards(keys: readonly string[], switched: ReadonlySet<string> = SWITCHED_INDUSTRIES): Record<string, NicheCardView> {
  const cards: Record<string, NicheCardView> = {};
  for (const key of keys) {
    const row = switchedNicheCard(key, switched);
    const niche = row && getNiche(row.niche);
    if (row && niche) cards[key] = { niche: niche.id, name: niche.name, edition: row.edition ?? null };
  }
  return cards;
}
