/**
 * Every section keeps its content inside the store container
 * (`max-w-(--sf-max-width)`; owner, 2026-10-28). The full-width heroes are
 * the one exception: their photos run from screen edge to screen edge.
 * Headers keep their edge-to-edge announcement bars, and hairline dividers and
 * empty decorative boxes may run edge to edge too.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { CODE_TEMPLATES } from "../templates/catalog";
import { DESIGNS, instantiateDesign, type Design } from ".";

const fullWidthAllowed = (design: Design) => design.category === "headers" || (design.category === "hero" && design.subcategory === "full-width");

const decorative = (node: ComponentNode) => node.type === "divider" || (node.type === "div" && node.children.length === 0);

/** Content nodes with no `container` above them, as type paths. */
function outsideContainer(nodes: readonly ComponentNode[], path: readonly string[] = []): string[] {
  return nodes.flatMap((node) => {
    if (node.type === "container") return [];
    const here = [...path, node.type];
    if (node.children.length === 0) return decorative(node) ? [] : [here.join(" > ")];
    return outsideContainer(node.children, here);
  });
}

const designs: [string, Design][] = [
  ...DESIGNS.map((design) => [design.id, design] as [string, Design]),
  ...CODE_TEMPLATES.flatMap((template) => template.designs.map((design) => [`${template.key}: ${design.id}`, design] as [string, Design])),
];

describe("sections follow the store container width", () => {
  it.each(designs.filter(([, design]) => !fullWidthAllowed(design)))("%s", (_key, design) => {
    const root = instantiateDesign(design, { id: "s" }).componentTree?.[0];
    expect(outsideContainer(root?.children ?? [])).toEqual([]);
  });
});
