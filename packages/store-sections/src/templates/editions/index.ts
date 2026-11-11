/**
 * The niche editions (ROADMAP F-90): the registered packs and how to find
 * them. One pack per niche, one file per pack:
 * `packs/<industry>/<niche>.ts` exports `const <NICHE>: Edition`, and is
 * added to `EDITIONS` below. `editions.test.ts` validates every pack on each
 * of its looks. Code only, shipped with a deploy; a store keeps its own copy
 * of what it installed. No React here.
 */
import { CODE_TEMPLATES } from "../catalog";
import { isEditionReady } from "./apply";
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
export const EDITIONS: readonly Edition[] = [];

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
