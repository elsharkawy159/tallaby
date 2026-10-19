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
 * `hero-classic` in `hero` → `hero.classic`; `faq-side` in `faq` → `faq.side`.
 */
function presetId(design: Design): string {
  const [, ...rest] = design.id.split("-");
  return `${design.category}.${rest.length ? rest.join("-") : design.id}`;
}

/** Store data the design draws through its data nodes. */
function dataNeeds(design: Design): DataNeed[] {
  const out = new Set<DataNeed>();
  const visit = (node: NodeTemplate) => {
    const need = DATA_NODE_NEEDS[node.type];
    if (need) out.add(need);
    node.children?.forEach(visit);
  };
  visit(design.tree(treeBuilder));
  return [...out];
}

export function designPreset(design: Design): SectionPreset {
  const needs = dataNeeds(design);
  return {
    id: presetId(design),
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
