/**
 * Before and after (Claude Design premium set, beforeAfter; 2026-10-27; v2
 * 2026-11-11, look-first pilot L5): a short claim with an eyebrow, the
 * heading, a line and one button beside two photos in one frame, with a
 * handle the visitor drags left and right to reveal one over the other (the
 * `beforeAfter` element). Each photo is labelled, Before and After.
 *
 * The demo uses the same photo twice, the Before copy faded under a grey
 * wash, so the pair reads as one subject in two states; the seller swaps in
 * their own two photos. Shows a result: cleaning, repairs, restoration,
 * styling. Without script the frame is split in the middle, both photos in
 * view. On phones the photos come first.
 *
 * v1 put the two photos side by side (there was no slider element); v2 keeps
 * every node and field name of v1 and only changes the photos' holder from a
 * two-column grid to the slider.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

/** One layer; `before` fades the photo and lays a grey wash over it. Its label sits at the layer's own outer corner. */
function half(t: TreeBuilder, photo: number, tag: DesignText, label: DesignText, before: boolean): NodeTemplate {
  return t.box(
    [
      t.photo(photo, tag, {
        role: "image",
        style: { aspectRatio: "landscape", objectFit: "cover", width: "100%", radius: 0, ...(before && { opacity: 70 }) },
        mobile: { aspectRatio: "square" },
      }),
      ...(before ? [t.box([], { label: L("الغشاوة", "Grey wash"), style: { ...FILL, background: "muted", opacity: 30 } })] : []),
      t.badge(tag, {
        label: L("الشارة", "Tag"),
        style: {
          position: "absolute",
          insetTop: "12px",
          ...(before ? { insetStart: "12px" } : { insetEnd: "12px" }),
          background: "foreground",
          color: "background",
          fontSize: "xs",
          fontWeight: "semibold",
          radius: 999,
        },
      }),
    ],
    { label, style: { position: "relative", overflow: "hidden", background: "secondary" } },
  );
}

export const aboutBeforeAfter = defineDesign({
  id: "about-before-after",
  version: 2,
  category: "image-text",
  subcategory: "story",
  name: L("قبل وبعد", "Before and after"),
  description: L(
    "صورتين في إطار واحد بفاصل يتسحب يمين وشمال للمقارنة بين قبل وبعد، وجنبهم جملة قصيرة وزر.",
    "Two photos in one frame with a handle to drag between Before and After, beside a short claim and a button.",
  ),
  keywords: ["before and after", "results", "comparison", "slider", "proof", "premium", "قبل وبعد", "نتيجة", "مقارنة"],
  tree: (t) =>
    t.section({ label: L("قبل وبعد", "Before and after") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.text(L("قبل وبعد", "Before and after"), {
                    role: "eyebrow",
                    style: { fontSize: "sm", fontWeight: "semibold", color: "primary" },
                  }),
                  t.heading(L("شوف الفرق بنفسك", "See the difference"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", lineHeight: "tight" },
                  }),
                  t.paragraph(L("اسحب الفاصل يمين وشمال وشوف نفس الحاجة قبل وبعد.", "Drag the handle left and right to see the same thing before and after."), {
                    role: "subtitle",
                    style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "520px" },
                    mobile: { fontSize: "md" },
                  }),
                  t.button(L("تسوّق الآن", "Shop now"), "/products", "solid", { role: "cta" }),
                ],
                {
                  label: L("النص", "Copy"),
                  role: "intro",
                  style: { gap: 16, alignItems: "start", justifyContent: "center" },
                  mobile: { gap: 14, order: 2 },
                },
              ),
              t.beforeAfter(half(t, 4, L("قبل", "Before"), L("قبل", "Before"), true), half(t, 4, L("بعد", "After"), L("بعد", "After"), false), {
                label: L("الصورتين", "Photos"),
                start: 50,
                style: { radius: 16, overflow: "hidden" },
                mobile: { order: 1 },
              }),
            ],
            {
              label: L("النصين", "Halves"),
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { gap: 72, alignItems: "center" },
              tablet: { gap: 40 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
