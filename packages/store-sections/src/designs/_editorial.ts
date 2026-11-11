/**
 * Pieces shared by the editorial sections (look-first pilot L7,
 * docs/systems/plan.md §10): the visual breaks between product rows. They use
 * the calm heading of the product sections (`products/_shared.ts`
 * `HEAD_TITLE`, title rising word by word) with a small quiet eyebrow, so a
 * page reads as one system.
 */
import type { StyleValues } from "../elements/style";
import type { NodeTemplate } from "../elements/tree";
import type { DesignText, TreeBuilder } from "./builder";
import { L } from "./_kit";
import { HEAD_TITLE } from "./products/_shared";

/** The small line over a title: quiet, spaced, never a chip. */
export const EYEBROW: StyleValues = { color: "muted", fontSize: "xs", fontWeight: "semibold", letterSpacing: "wider", textTransform: "uppercase" };

type EditorialHeadOptions = {
  eyebrow?: DesignText;
  title: DesignText;
  subtitle?: DesignText;
  align?: "start" | "center";
  /** Space under the block, for a parent with no `gap`. */
  spaced?: boolean;
};

/**
 * An editorial section's heading block: eyebrow, `h2` and one line. The same
 * roles as `_kit.ts` `sectionHead` (`intro`, `eyebrow`, `title`, `subtitle`),
 * so a design that swaps to it keeps its field names.
 */
export function editorialHead(t: TreeBuilder, o: EditorialHeadOptions): NodeTemplate {
  const center = o.align === "center";
  const align: StyleValues = center ? { textAlign: "center" } : {};
  return t.stack(
    [
      ...(o.eyebrow ? [t.text(o.eyebrow, { role: "eyebrow", style: { ...EYEBROW, ...align } })] : []),
      t.heading(o.title, "h2", { role: "title", style: { ...HEAD_TITLE.style, ...align }, mobile: HEAD_TITLE.mobile, motion: { reveal: "words" } }),
      ...(o.subtitle ? [t.paragraph(o.subtitle, { role: "subtitle", style: { fontSize: "md", lineHeight: "relaxed", maxWidth: "520px", ...align } })] : []),
    ],
    {
      label: L("العنوان", "Heading"),
      role: "intro",
      // The title plays its own reveal, so the block does not reveal as one.
      motion: { reveal: "none" },
      style: { gap: 10, ...(center && { alignItems: "center" }), ...(o.spaced && { marginBottom: 40 }) },
      ...(o.spaced && { mobile: { marginBottom: 24 } }),
    },
  );
}
