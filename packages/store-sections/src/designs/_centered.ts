/**
 * Pieces of the centred retail look (2026-10-29, after the WoodMart
 * "Accessories" demo): a centred section head with a small brand coloured
 * line over the title and a muted line under it, and a centred product card
 * (flat photo, name, rating, price). Every product field is bound
 * (`elements/data.ts`); the copy here is only the editor's placeholder.
 */
import type { NodeTemplate } from "../elements/tree";
import type { DesignText, TreeBuilder } from "./builder";
import { L } from "./_kit";
import { productName, priceRow, productPhoto } from "./products/_shared";

/** Eyebrow, title and subtitle, all centred. */
export function centeredHead(t: TreeBuilder, o: { eyebrow?: DesignText; title: DesignText; subtitle?: DesignText }): NodeTemplate {
  return t.stack(
    [
      ...(o.eyebrow ? [t.text(o.eyebrow, { role: "eyebrow", style: { color: "primary", fontSize: "sm", fontWeight: "medium", textAlign: "center" } })] : []),
      t.heading(o.title, "h2", {
        role: "title",
        style: { fontSize: "display-sm", fontWeight: "semibold", lineHeight: "tight", textAlign: "center" },
      }),
      ...(o.subtitle ? [t.paragraph(o.subtitle, { role: "subtitle", style: { color: "muted", textAlign: "center", maxWidth: "560px" } })] : []),
    ],
    { label: L("العنوان", "Heading"), role: "intro", style: { gap: 8, alignItems: "center" } },
  );
}

/** A flat centred card: square photo on the page colour, name, rating and price. */
export function centeredCard(t: TreeBuilder): NodeTemplate {
  return t.stack(
    [
      productPhoto(t, { radius: 0 }),
      t.stack(
        [
          productName(t, { fontWeight: "medium", textAlign: "center" }),
          t.row([t.icon("star", { style: { color: "accent", fontSize: "sm" } }), t.text(L("٤٫٨", "4.8"), { bind: "rating", style: { color: "muted", fontSize: "sm" } })], {
            label: L("التقييم", "Rating"),
            style: { gap: 4, justifyContent: "center", wrap: false },
          }),
          priceRow(t, { justifyContent: "center" }),
        ],
        { label: L("المعلومات", "Details"), style: { gap: 6, alignItems: "center" } },
      ),
    ],
    { label: L("بطاقة المنتج", "Product card"), style: { gap: 14 } },
  );
}
