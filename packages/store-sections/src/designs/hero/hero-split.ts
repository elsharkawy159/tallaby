/**
 * Split hero (Claude Design premium set, `heroSplit`): a photo and a tinted
 * text panel side by side, so the photo's detail is never covered by text.
 * The heading is the page's `h1`.
 *
 * v3 (look-first pilot, 2026-11-11, docs/systems/plan.md §10 L7): a lighter
 * first screen for stores that do not want copy on a photo. The two halves
 * run from edge to edge with square corners (v2 was a rounded card inside the
 * page width): the copy on the start side with room around it, and a tall
 * photo on the end side that bleeds to the section's edge. On phones the
 * photo comes first, then the copy. A small uppercase eyebrow, a larger
 * headline, one solid button and a quiet underlined link. Node order, roles
 * and field names are v2's (the photo is still the first child and moves to
 * the end side with `order`).
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { HERO_EYEBROW } from "./_shared";

export const heroSplit = defineDesign({
  id: "hero-split",
  version: 3,
  category: "hero",
  subcategory: "split",
  name: L("صورة ولوح ملوّن", "Split hero"),
  description: L(
    "نص في لوح هادئ من ناحية وصورة طويلة لحد طرف الشاشة من الناحية التانية، والصورة فوق على الجوال.",
    "Copy in a quiet panel on one side and a tall photo to the screen's edge on the other, photo first on phones.",
  ),
  keywords: ["hero", "split", "half", "photo", "panel", "premium", "واجهة", "مقسوم", "نصين", "صورة ونص"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.container(
        [
          t.grid(
            [
              t.photo(0, L("صورة الواجهة", "Hero photo"), {
                role: "image",
                // The end side on desktop and tablets; first (on top) on phones.
                style: { aspectRatio: "square", minHeight: 620, objectFit: "cover", width: "100%", radius: 0, order: 2 },
                tablet: { aspectRatio: "portrait", minHeight: 480 },
                mobile: { aspectRatio: "square", minHeight: 0, order: 0 },
              }),
              t.stack(
                [
                  t.stack(
                    [
                      t.text(L("المجموعة الجديدة", "New collection"), { role: "eyebrow", style: { ...HERO_EYEBROW, color: "muted" } }),
                      t.heading(L("معمول بكميات صغيرة", "Made in small batches"), "h1", {
                        role: "title",
                        style: { fontSize: "display-lg", fontWeight: "semibold", lineHeight: "tight", letterSpacing: "tight" },
                        tablet: { fontSize: "display-md" },
                      }),
                      t.paragraph(L("قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.", "Carefully chosen pieces, made in small runs so each one stays special."), {
                        role: "subtitle",
                        style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "440px" },
                        mobile: { fontSize: "md" },
                      }),
                      t.row(
                        [
                          t.button(L("تسوّق المجموعة", "Shop the collection"), "/products", "solid", { role: "cta" }),
                          t.button(L("حكايتنا", "Our story"), "/about", "outline", {
                            role: "cta2",
                            // A quiet text link: the one solid button stays the clear action.
                            style: { background: "transparent", color: "foreground", borderWidth: 0, underline: true, fontWeight: "medium", paddingStart: 12, paddingEnd: 12, hover: { opacity: 70 } },
                          }),
                        ],
                        { label: L("الأزرار", "Buttons"), style: { gap: 8, paddingTop: 12, alignItems: "center" } },
                      ),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 18, alignItems: "start", maxWidth: "520px" }, mobile: { gap: 14 } },
                  ),
                ],
                {
                  label: L("اللوح", "Panel"),
                  style: { background: "secondary", justifyContent: "center", paddingTop: 72, paddingBottom: 72, paddingStart: 88, paddingEnd: 64 },
                  tablet: { paddingStart: 40, paddingEnd: 32 },
                  mobile: { paddingTop: 36, paddingBottom: 44, paddingStart: 20, paddingEnd: 20 },
                },
              ),
            ],
            { label: L("الواجهة", "Split"), columns: { desktop: 2, tablet: 2, mobile: 1 }, style: { gap: 0, alignItems: "stretch", radius: 0, overflow: "hidden" } },
          ),
        ],
        // Edge to edge: the photo bleeds to the section's side.
        { label: L("الحاوية", "Container"), role: "container", style: { maxWidth: "100%", paddingStart: 0, paddingEnd: 0 } },
      ),
    ]),
});
