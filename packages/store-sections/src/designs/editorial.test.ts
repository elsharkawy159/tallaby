import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { scrollEffectTargets } from "../elements/scroll-plan";
import { instantiateDesign } from "./builder";
import { DESIGNS } from "./index";

const find = (nodes: readonly ComponentNode[], id: string): ComponentNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const inner = find(node.children ?? [], id);
    if (inner) return inner;
  }
  return undefined;
};

describe("editorial designs (look-first pilot L7)", () => {
  it("about-two-tone scrubs its photo and its copy, never the coloured half", () => {
    const design = DESIGNS.find((d) => d.id === "about-two-tone")!;
    expect(design.scrollEffect).toBe("reveal-scrub");
    const instance = instantiateDesign(design, { id: "s1" });
    expect((instance.style as { shell?: { scrollEffect?: string } } | undefined)?.shell?.scrollEffect).toBe("reveal-scrub");
    const tree = instance.componentTree!;
    const targets = scrollEffectTargets(tree);
    expect(targets.effects).toContain("reveal-scrub");
    expect(find(tree, targets.imageId!)?.props.role).toBe("image");
    const copy = find(tree, targets.scrubId!)!;
    expect(copy.props.role).toBe("intro");
    // The box that moves has no colour of its own: the brand half stays still.
    expect(copy.style?.background).toBeUndefined();
  });
});
