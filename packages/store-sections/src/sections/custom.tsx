/**
 * custom-section (P4B-02): a section the seller builds from elements. It
 * renders `instance.componentTree` with the fixed element renderer; there is
 * no HTML, CSS or script input anywhere (CLAUDE.md rule 9).
 */
import { z } from "zod";
import { sectionText } from "../core/copy";
import type { SectionDefinition } from "../core/types";
import { renderElementTree } from "../elements/render";
import { EmptyState, SectionShell } from "./_primitives";

const customSchema = z.object({});
type CustomProps = z.infer<typeof customSchema>;

export const customSection: SectionDefinition<CustomProps> = {
  id: "custom-section",
  version: 1,
  category: "custom",
  displayName: { ar: "قسم مخصص", en: "Custom section" },
  description: { ar: "ابنِ قسمك من العناصر: عناوين وصور وأزرار وأعمدة.", en: "Build your own section from elements: headings, images, buttons and columns." },
  propsSchema: customSchema,
  defaultProps: {},
  propDefinitions: [],
  Component: ({ instance, ctx }) => {
    const tree = instance.componentTree ?? [];
    if (!tree.length) {
      return ctx.mode === "edit" ? (
        <SectionShell>
          <EmptyState>{sectionText("emptyCustom", ctx.locale)}</EmptyState>
        </SectionShell>
      ) : null;
    }
    // On a product page every node sits in the current product's scope.
    const scope = ctx.product ? ({ kind: "product", record: ctx.product } as const) : undefined;
    // A tree section's root node is the <section>; older custom sections keep the padded wrapper.
    if (tree[0]?.type === "section") return <>{renderElementTree(tree, ctx, 1, scope)}</>;
    // `relative isolate` keeps absolutely positioned elements inside their own section.
    return <section className="relative isolate py-(--sf-section-y,48px)">{renderElementTree(tree, ctx, 1, scope)}</section>;
  },
};
