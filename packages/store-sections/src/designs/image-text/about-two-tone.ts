/**
 * Two-tone banner (look-first pilot L7, 2026-11-11; docs/systems/plan.md §10):
 * a visual break between product rows. One half is a flat brand colour with a
 * small eyebrow, a title, one line and one button, centred; the other half is
 * a photo that fills its side edge to edge. One rounded block inside the page
 * width. On phones the photo comes first and the colour half sits under it.
 *
 * Scroll effect `reveal-scrub`: as the block enters the screen the photo
 * settles and the copy rises with the scroll (and back on the way up). Where
 * that does not run, the photo wipes in and the title rises word by word.
 */
import { defineDesign } from "../builder";
import { EYEBROW } from "../_editorial";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { HEAD_TITLE } from "../products/_shared";

export const aboutTwoTone = defineDesign({
  id: "about-two-tone",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("بانر بلونين", "Two-tone banner"),
  description: L(
    "نص بلون المتجر فيه عنوان وسطر وزر، ونص صورة مالية مكانها. فاصل هادي بين صفوف المنتجات.",
    "One half in your brand colour with a title, a line and a button, the other half a photo. A calm break between product rows.",
  ),
  keywords: ["image with text", "banner", "two tone", "split", "editorial", "premium", "صورة ونص", "بانر", "لونين"],
  scrollEffect: "reveal-scrub",
  tree: (t) =>
    t.section({ label: L("بانر بلونين", "Two-tone banner"), style: { paddingTop: 48, paddingBottom: 48 }, mobile: { paddingTop: 32, paddingBottom: 32 } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  // The copy is its own box: the scroll effect moves it, never the coloured half.
                  t.stack(
                    [
                      t.text(L("صناعة مصرية", "Made in Egypt"), { role: "eyebrow", style: { ...EYEBROW, ...ON_BRAND, opacity: 75, textAlign: "center" } }),
                      t.heading(L("متعمول عشان يريّحك ويعيش معاك", "Made for comfort, made to last"), "h2", {
                        role: "title",
                        style: { ...HEAD_TITLE.style, ...ON_BRAND, textAlign: "center", maxWidth: "440px" },
                        mobile: HEAD_TITLE.mobile,
                        motion: { reveal: "words" },
                      }),
                      t.paragraph(L("خامات مختارة وتفاصيل متشطبة بإيدينا، عشان تفضل معاك سنين.", "Chosen materials and details finished by hand, so it stays with you for years."), {
                        role: "subtitle",
                        style: { ...ON_BRAND_BODY, fontSize: "md", lineHeight: "relaxed", textAlign: "center", maxWidth: "380px" },
                        mobile: { fontSize: "sm" },
                      }),
                      t.button(L("تسوّق الآن", "Shop now"), "/products", "light", { role: "cta", style: { marginTop: 8 } }),
                    ],
                    { label: L("النص", "Copy"), role: "intro", style: { gap: 14, alignItems: "center" }, mobile: { gap: 12 }, motion: { reveal: "none" } },
                  ),
                ],
                {
                  label: L("النص الملوّن", "Colour half"),
                  role: "panel",
                  style: { background: "primary", alignItems: "center", justifyContent: "center", paddingTop: 56, paddingBottom: 56, paddingStart: 48, paddingEnd: 48 },
                  tablet: { paddingStart: 28, paddingEnd: 28 },
                  mobile: { order: 2, paddingTop: 40, paddingBottom: 44, paddingStart: 24, paddingEnd: 24 },
                  motion: { reveal: "none" },
                },
              ),
              t.box(
                [
                  t.photo(2, L("صورة البانر", "Banner photo"), {
                    role: "image",
                    style: { aspectRatio: "landscape", objectFit: "cover", width: "100%", radius: 0 },
                    tablet: { aspectRatio: "portrait" },
                    mobile: { aspectRatio: "landscape" },
                    motion: { reveal: "wipe-start" },
                  }),
                ],
                // The frame does not reveal as a grid item, so the photo plays its own wipe.
                { label: L("إطار الصورة", "Photo frame"), role: "frame", style: { overflow: "hidden", background: "secondary" }, mobile: { order: 1 }, motion: { reveal: "none" } },
              ),
            ],
            {
              label: L("النصين", "Halves"),
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { gap: 0, radius: 16, overflow: "hidden", background: "primary" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
