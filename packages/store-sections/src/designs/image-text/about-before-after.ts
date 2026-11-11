/**
 * Before and after (Claude Design premium set, beforeAfter; 2026-10-27; v2
 * 2026-11-11, look-first pilot L5): two photos in one frame, with a handle
 * the visitor drags left and right to reveal one over the other (the
 * `beforeAfter` element). Each photo is labelled, Before and After.
 *
 * The demo uses the same photo twice, the Before copy faded under a grey
 * wash, so the pair reads as one subject in two states; the seller swaps in
 * their own two photos. Shows a result (cleaning, repairs, restoration,
 * styling) or one product in two colours. Without script the frame is split
 * in the middle, both photos in view.
 *
 * v3 (pilot L7, 2026-11-11): the slider is the hero of the section. A small
 * centred heading (eyebrow, title, one line) sits over one wide frame in the
 * middle of the page, about two thirds of its width, with the button under
 * it; v2 put a column of copy beside a half-width frame. The labels moved to
 * the bottom corners as quiet paper chips. Same nodes and field names as v2
 * (the copy's box is now the heading block; the button follows the photos).
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { EYEBROW } from "../_editorial";
import { L } from "../_kit";
import { HEAD_TITLE, PRODUCTS_SECTION } from "../products/_shared";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

/** One layer; `before` fades the photo and lays a grey wash over it. Its label sits at the layer's own outer bottom corner. */
function half(t: TreeBuilder, photo: number, tag: DesignText, label: DesignText, before: boolean): NodeTemplate {
  return t.box(
    [
      t.photo(photo, tag, {
        role: "image",
        style: { aspectRatio: "wide", objectFit: "cover", width: "100%", radius: 0, ...(before && { opacity: 70 }) },
        mobile: { aspectRatio: "square" },
      }),
      ...(before ? [t.box([], { label: L("الغشاوة", "Grey wash"), style: { ...FILL, background: "muted", opacity: 30 } })] : []),
      t.badge(tag, {
        label: L("الشارة", "Tag"),
        style: {
          position: "absolute",
          insetBottom: "16px",
          ...(before ? { insetStart: "16px" } : { insetEnd: "16px" }),
          background: "background",
          color: "foreground",
          fontSize: "xs",
          fontWeight: "semibold",
          radius: 999,
          paddingTop: 5,
          paddingBottom: 5,
          paddingStart: 12,
          paddingEnd: 12,
        },
        mobile: { insetBottom: "12px", ...(before ? { insetStart: "12px" } : { insetEnd: "12px" }) },
      }),
    ],
    { label, style: { position: "relative", overflow: "hidden", background: "secondary" } },
  );
}

export const aboutBeforeAfter = defineDesign({
  id: "about-before-after",
  version: 3,
  category: "image-text",
  subcategory: "story",
  name: L("قبل وبعد", "Before and after"),
  description: L(
    "صورتين في إطار واحد كبير بفاصل يتسحب يمين وشمال للمقارنة بين قبل وبعد، وفوقهم عنوان قصير.",
    "Two photos in one large frame with a handle to drag between Before and After, under a short heading.",
  ),
  keywords: ["before and after", "results", "comparison", "slider", "proof", "colours", "premium", "قبل وبعد", "نتيجة", "مقارنة"],
  tree: (t) =>
    t.section({ label: L("قبل وبعد", "Before and after"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          t.stack(
            [
              t.stack(
                [
                  t.text(L("قبل وبعد", "Before and after"), { role: "eyebrow", style: { ...EYEBROW, textAlign: "center" } }),
                  t.heading(L("شوف الفرق بنفسك", "See the difference"), "h2", {
                    role: "title",
                    style: { ...HEAD_TITLE.style, textAlign: "center" },
                    mobile: HEAD_TITLE.mobile,
                    motion: { reveal: "words" },
                  }),
                  t.paragraph(L("اسحب الفاصل يمين وشمال وشوف نفس الحاجة قبل وبعد.", "Drag the handle left and right to see the same thing before and after."), {
                    role: "subtitle",
                    style: { fontSize: "md", lineHeight: "relaxed", maxWidth: "480px", textAlign: "center" },
                    mobile: { fontSize: "sm" },
                  }),
                ],
                { label: L("النص", "Copy"), role: "intro", style: { gap: 10, alignItems: "center" }, motion: { reveal: "none" } },
              ),
              t.beforeAfter(half(t, 4, L("قبل", "Before"), L("قبل", "Before"), true), half(t, 4, L("بعد", "After"), L("بعد", "After"), false), {
                label: L("الصورتين", "Photos"),
                start: 50,
                style: { radius: 16, overflow: "hidden", width: "100%", maxWidth: "860px" },
              }),
              t.button(L("تسوّق الآن", "Shop now"), "/products", "outline", { role: "cta" }),
            ],
            { label: L("النصين", "Halves"), style: { gap: 32, alignItems: "center" }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
