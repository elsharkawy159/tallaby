import { describe, expect, it } from "vitest";
import { validatePageContent } from "../config/validate";
import type { ComponentNode } from "../config/schema";
import { storeSectionRegistry } from "../sections";
import { fromTemplate } from "../elements/tree";
import { DESIGNS } from "./index";
import { designSlotTree } from "./photo-slots";

type Styles = { style?: unknown; breakpointStyles?: unknown; children: Styles[] };

const stylesOf = (node: ComponentNode): Styles => ({
  ...(node.style && { style: node.style }),
  ...(node.breakpointStyles && { breakpointStyles: node.breakpointStyles }),
  children: node.children.map(stylesOf),
});

/**
 * A library design saved by the admin section editor (or by a seller after
 * inserting it) goes through validatePageContent; its styles must come out
 * exactly as the design wrote them, so a save never changes how it looks.
 */
describe("design styles survive validation", () => {
  const allowed = storeSectionRegistry.allowedSections();
  for (const design of DESIGNS) {
    it(design.id, () => {
      let n = 0;
      const root = fromTemplate(designSlotTree(design), () => `n${++n}`);
      const result = validatePageContent(
        { sections: [{ id: "s", sectionId: "custom-section", version: 1, props: {}, componentTree: [root] }] },
        { allowedSections: allowed },
      );
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(stylesOf(result.data.sections[0]!.componentTree![0]!)).toEqual(stylesOf(root));
    });
  }
});
