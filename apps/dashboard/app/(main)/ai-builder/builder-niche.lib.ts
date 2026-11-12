import { DEFAULT_TEMPLATE, editionOnLook, getCodeTemplate, getNiche, matchNiche, type Edition, type MatchNicheInput } from "@workspace/store-sections/templates";
import { OTHER_INDUSTRY, type BuilderState } from "./builder.dto";

/**
 * The AI builder and niche editions (ROADMAP F-90, plan §4.5): which niche a
 * store being built is in, and which edition a suggested template is shown
 * and installed with. All in code (docs/ai.md rules 1 and 2): no model call,
 * and no niche or template list ever goes into a prompt. The only model words
 * used are the intake reading's `industryHint`, which that call already
 * returned (`state.tradeHint`). Pure, so each rule has a test.
 */

/** How much of the seller's description is read as a hint (its first lines say what the store sells). */
const ABOUT_CHARS = 300;
/** Title texts handed to the matcher (it reads at most `MATCH.maxTitles`, 12 words each). */
const MAX_TITLES = 300;

/** What the builder knows about the store, as `matchNiche` reads it. */
export function builderNicheInput(state: BuilderState): MatchNicheInput {
  const titles = [
    ...state.fileRows.flatMap((row) => [row.name, ...(row.nameEn ? [row.nameEn] : [])]),
    ...state.products.map((product) => product.name),
    // The file's own category names say the trade as well as a title does.
    ...new Set(state.fileRows.flatMap((row) => (row.category ? [row.category] : []))),
  ];
  const hint = [state.tradeHint, state.about?.slice(0, ABOUT_CHARS)].filter(Boolean).join(" . ");
  return {
    industryId: state.industryId && state.industryId !== OTHER_INDUSTRY ? state.industryId : null,
    name: [state.name, state.nameEn].filter(Boolean).join(" ") || null,
    productTitles: titles.slice(0, MAX_TITLES),
    hint: hint || null,
  };
}

/** The store's niche id, or null when the words do not say (the templates then keep their own content). */
export function builderNiche(state: BuilderState): string | null {
  return matchNiche(builderNicheInput(state))?.nicheId ?? null;
}

/**
 * The edition a template is previewed and installed with: the niche's pack
 * when it is approved on that template (`editionOnLook`), else null. An
 * unknown niche, a pack that was unregistered since the shortlist was made,
 * or any value that is not a niche id is null, so only a valid edition ever
 * reaches `applyStoreTemplate` (which checks it again). `editions` is a
 * parameter only so tests can pass packs.
 */
export function suggestionEdition(templateKey: string | null | undefined, nicheId: unknown, editions?: readonly Edition[]): string | null {
  if (!templateKey || typeof nicheId !== "string" || !nicheId) return null;
  return editionOnLook(templateKey, nicheId, editions)?.niche ?? null;
}

/** The same edition with its niche's names, for the suggestion card. */
export function suggestionEditionChoice(templateKey: string, nicheId: unknown, editions?: readonly Edition[]): { id: string; name: { ar: string; en: string } } | null {
  const id = suggestionEdition(templateKey, nicheId, editions);
  const niche = id ? getNiche(id) : undefined;
  return niche ? { id: niche.id, name: niche.name } : null;
}

/** The `editionId` option of the install: present only for a valid edition. */
export function installEdition(state: Pick<BuilderState, "templateKey" | "nicheId">, editions?: readonly Edition[]): { editionId?: string } {
  const editionId = suggestionEdition(state.templateKey, state.nicheId, editions);
  return editionId ? { editionId } : {};
}

/**
 * What a build installs: the chosen template with its edition, or Tallaby
 * Classic (no edition) when the chosen template is no longer in the code
 * catalog (one template per niche deleted 32 on 2026-11-12; a build started
 * before that may hold one of their keys).
 */
export function installTarget(state: Pick<BuilderState, "templateKey" | "nicheId">, editions?: readonly Edition[]): { templateKey: string; editionId?: string } {
  if (state.templateKey && getCodeTemplate(state.templateKey)) return { templateKey: state.templateKey, ...installEdition(state, editions) };
  return { templateKey: DEFAULT_TEMPLATE.key };
}
