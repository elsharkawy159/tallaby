/**
 * The library as the Add panel lists it: one preset per section design
 * (`designs/`), in design order, so every preset starts an element tree the
 * seller can fully customize (CLAUDE.md rule 17). Adding a design to its
 * folder's `index.ts` lists it here.
 */
import type { DataNeed } from "../../core/types";
import { DESIGNS, treeBuilder, type Design } from "../../designs";
import { DATA_NODE_NEEDS } from "../../elements/data";
import type { NodeTemplate } from "../../elements/tree";
import type { SectionPreset } from "../types";

/**
 * The preset id of a design (or a `library_sections` row) by its key:
 * `hero-classic` in `hero` → `hero.classic`; `faq-side` in `faq` → `faq.side`.
 */
export function presetIdFor(category: string, key: string): string {
  const [, ...rest] = key.split("-");
  return `${category}.${rest.length ? rest.join("-") : key}`;
}

/** Store data a tree draws through its data nodes. */
export function presetDataNeeds(tree: NodeTemplate): DataNeed[] {
  const out = new Set<DataNeed>();
  const visit = (node: NodeTemplate) => {
    const need = DATA_NODE_NEEDS[node.type];
    if (need) out.add(need);
    node.children?.forEach(visit);
  };
  visit(tree);
  return [...out];
}

export function designPreset(design: Design): SectionPreset {
  const needs = presetDataNeeds(design.tree(treeBuilder));
  return {
    id: presetIdFor(design.category, design.id),
    sectionId: "custom-section",
    designId: design.id,
    category: design.category,
    subcategory: design.subcategory,
    name: design.name,
    description: design.description,
    keywords: design.keywords,
    capabilities: needs.length ? ["dynamic"] : ["static"],
    ...(needs.length && { dataNeeds: needs }),
  };
}

export const LIBRARY_PRESETS: readonly SectionPreset[] = DESIGNS.map(designPreset);
