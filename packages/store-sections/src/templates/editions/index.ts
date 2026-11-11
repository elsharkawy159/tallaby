/**
 * The niche editions (ROADMAP F-90): the registered packs and how to find
 * them. One pack per niche, one file per pack:
 * `packs/<industry>/<niche>.ts` exports `const <NICHE>: Edition`, and is
 * added to `EDITIONS` below. `editions.test.ts` validates every pack on each
 * of its looks. Code only, shipped with a deploy; a store keeps its own copy
 * of what it installed. No React here.
 */
import { CODE_TEMPLATES, getCodeTemplate } from "../catalog";
import type { TemplateDefinition } from "../types";
import { applyEdition, isEditionReady } from "./apply";
import { matchNiche, type MatchNicheInput } from "./match";
import { getNiche, nichesOfIndustry, type Niche } from "./niches";
import { LIGHTING_SMART_HOME } from "./packs/electronics/lighting-smart-home";
import { DRESSES } from "./packs/fashion/dresses";
import { PANTS_JEANS } from "./packs/fashion/pants-jeans";
import { TSHIRTS } from "./packs/fashion/tshirts";
import { GLASSES } from "./packs/jewelry/glasses";
import type { Edition } from "./types";

export * from "./types";
export * from "./niches";
export * from "./match";
export { applyEdition, copyrightLine, editionTemplate, initialOf, isEditionReady, lookJourney, lookSlots, missingSlots, primaryHref, type EditionLookSpec, type LookParts } from "./apply";

/**
 * Every pack, in gallery order. To register one:
 *   import { DRESSES } from "./packs/fashion/dresses";
 * and add `DRESSES` here.
 */
export const EDITIONS: readonly Edition[] = [DRESSES, GLASSES, TSHIRTS, LIGHTING_SMART_HOME, PANTS_JEANS];

/** The pack of a niche. */
export function getEdition(nicheId: string | null | undefined): Edition | undefined {
  return nicheId ? EDITIONS.find((edition) => edition.niche === nicheId) : undefined;
}

/** The packs approved on a look, in gallery order (empty until the look is edition-ready). */
export function editionsForLook(templateKey: string): Edition[] {
  return isEditionReady(templateKey) ? EDITIONS.filter((edition) => edition.looks.includes(templateKey)) : [];
}

/** A niche's editions: its pack on each of its looks that is edition-ready, best look first. */
export function editionsForNiche(nicheId: string): { edition: Edition; look: string }[] {
  const edition = getEdition(nicheId);
  return edition ? edition.looks.filter(isEditionReady).map((look) => ({ edition, look })) : [];
}

/** The keys of the templates that take editions, in catalog order. */
export function editionReadyLooks(): string[] {
  return CODE_TEMPLATES.map((template) => template.key).filter(isEditionReady);
}

// ── Galleries, previews and installs (plan §4.5) ────────────────────────────
// `editions` is a parameter only so tests can pass packs; callers leave it out.

/**
 * The pack of a niche when it may be shown on a look: the niche exists, the
 * look is edition-ready and the pack is approved on it. Anything else (an
 * unknown id, a client's made-up value) is undefined, and the caller keeps
 * the look's own content.
 */
export function editionOnLook(templateKey: string, nicheId: unknown, editions: readonly Edition[] = EDITIONS): Edition | undefined {
  if (typeof nicheId !== "string" || !getNiche(nicheId) || !isEditionReady(templateKey)) return undefined;
  return editions.find((edition) => edition.niche === nicheId && edition.looks.includes(templateKey));
}

/** The look built with a niche's edition, or undefined when `editionOnLook` finds none or the pack cannot be built on it. */
export function templateWithEdition(templateKey: string, nicheId: unknown, editions: readonly Edition[] = EDITIONS): TemplateDefinition | undefined {
  const edition = editionOnLook(templateKey, nicheId, editions);
  const template = edition && getCodeTemplate(templateKey);
  if (!edition || !template) return undefined;
  try {
    return applyEdition(template, edition);
  } catch {
    return undefined;
  }
}

/** A niche as a gallery chip or filter option. */
export type NicheOption = { id: string; name: { ar: string; en: string } };

const option = (niche: Niche): NicheOption => ({ id: niche.id, name: niche.name });

/** The editions a template card offers, in gallery order (empty for a look with none). */
export function editionOptions(templateKey: string, editions: readonly Edition[] = EDITIONS): NicheOption[] {
  if (!isEditionReady(templateKey)) return [];
  return editions.flatMap((edition) => {
    const niche = edition.looks.includes(templateKey) ? getNiche(edition.niche) : null;
    return niche ? [option(niche)] : [];
  });
}

/**
 * The niches a gallery offers under an industry: those with a pack on at
 * least one edition-ready look, so a niche filter never leads to a list
 * without that niche. In the niche list's order.
 */
export function offeredNiches(industryId: string | null | undefined, editions: readonly Edition[] = EDITIONS): NicheOption[] {
  if (!industryId) return [];
  const ready = new Set(editions.filter((edition) => edition.looks.some(isEditionReady)).map((edition) => edition.niche));
  return nichesOfIndustry(industryId)
    .filter((niche) => ready.has(niche.id))
    .map(option);
}

/** The store's own niche (`matchNiche`) when the gallery offers it, else null ("All"). */
export function defaultNiche(store: MatchNicheInput, offered: readonly NicheOption[]): string | null {
  if (!offered.length) return null;
  const match = matchNiche(store);
  return match && offered.some((niche) => niche.id === match.nicheId) ? match.nicheId : null;
}

/**
 * A gallery list with a niche chosen: the looks that have its edition first,
 * best look first (the pack's order), then the others as they were.
 */
export function nicheFirst<T extends { key: string }>(templates: readonly T[], nicheId: string | null | undefined, editions: readonly Edition[] = EDITIONS): T[] {
  const looks = (nicheId ? editions.find((edition) => edition.niche === nicheId)?.looks : undefined)?.filter(isEditionReady) ?? [];
  if (!looks.length) return [...templates];
  const lead = looks.flatMap((look) => templates.filter((template) => template.key === look));
  return [...lead, ...templates.filter((template) => !looks.includes(template.key))];
}
