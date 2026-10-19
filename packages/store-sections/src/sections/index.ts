/**
 * The Tallaby section registry. Every section on a seller's website is a tree
 * section: a `custom-section` holding an element tree, started from a design
 * (`designs/`) or built from elements (CLAUDE.md rule 17). Anything else is
 * skipped by the renderer and rejected at publish (validateSiteConfig({ allowedSections })).
 */
import { createSectionRegistry } from "../core/registry";
import type { AnySectionDefinition } from "../core/types";
import { customSection } from "./custom";

export const STORE_SECTIONS: readonly AnySectionDefinition[] = [customSection];

export const storeSectionRegistry = createSectionRegistry(STORE_SECTIONS);

export { FORM_SUBMIT_CLASS, FormFieldsView, formCopy } from "./forms";
export { customSection };
