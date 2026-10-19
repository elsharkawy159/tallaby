/**
 * The section designs (tree-sections plan 1): one file per design under
 * `designs/<library category>/`. A library preset with a `designId` inserts one.
 */
import type { Design } from "./builder";
import { aboutStory } from "./about/about-story";
import { heroSplit } from "./hero/hero-split";
import { statsCards } from "./statistics/stats-cards";

export { defineDesign, instantiateDesign, treeBuilder, type Design, type DesignText, type GridOptions, type NodeOptions, type TreeBuilder } from "./builder";

export const DESIGNS: readonly Design[] = [heroSplit, aboutStory, statsCards];

const BY_ID = new Map(DESIGNS.map((design) => [design.id, design]));

export function getDesign(id: string): Design | undefined {
  return BY_ID.get(id);
}
