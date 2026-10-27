/**
 * Before and after (Claude Design premium set, beforeAfter; 2026-10-27): a
 * short claim with an eyebrow, the heading, a line and one button beside two
 * copies of the same photo in one tall frame, labelled Before and After.
 * The Before half is faded under a grey wash so the pair reads as one subject
 * in two states; the seller swaps in their own two photos. Shows a result:
 * cleaning, repairs, restoration, styling. The source's drag slider has no
 * element yet, so the two photos sit side by side. On phones the photos come
 * first.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

/** One half; `before` fades the photo and lays a grey wash over it. */
function half(t: TreeBuilder, photo: number, tag: DesignText, label: DesignText, before: boolean): NodeTemplate {
  return t.box(
    [
      t.photo(photo, tag, {
        role: "image",
        style: { aspectRatio: "story", objectFit: "cover", width: "100%", radius: 0, ...(before && { opacity: 70 }) },
      }),
      ...(before ? [t.box([], { label: L("الغشاوة", "Grey wash"), style: { ...FILL, background: "muted", opacity: 30 } })] : []),
      t.badge(tag, {
        label: L("الشارة", "Tag"),
        style: {
          position: "absolute",
          insetTop: "12px",
          insetStart: "12px",
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
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("قبل وبعد", "Before and after"),
  description: L(
    "صورتين بنفس الإطار مكتوب عليهم قبل وبعد، وجنبهم جملة قصيرة وزر.",
    "Two photos in the same frame labelled Before and After, beside a short claim and a button.",
  ),
  keywords: ["before and after", "results", "comparison", "proof", "premium", "قبل وبعد", "نتيجة", "مقارنة"],
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
                  t.paragraph(
                    L("نفس الحاجة قبل وبعد، في صورتين جنب بعض عشان النتيجة تبان.", "The same thing before and after, side by side, so the result speaks for itself."),
                    { role: "subtitle", style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "520px" }, mobile: { fontSize: "md" } },
                  ),
                  t.button(L("تسوّق الآن", "Shop now"), "/products", "solid", { role: "cta" }),
                ],
                {
                  label: L("النص", "Copy"),
                  role: "intro",
                  style: { gap: 16, alignItems: "start", justifyContent: "center" },
                  mobile: { gap: 14, order: 2 },
                },
              ),
              t.grid([half(t, 4, L("قبل", "Before"), L("قبل", "Before"), true), half(t, 4, L("بعد", "After"), L("بعد", "After"), false)], {
                label: L("الصورتين", "Photos"),
                columns: { desktop: 2, tablet: 2, mobile: 2 },
                style: { gap: 4, radius: 16, overflow: "hidden" },
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
