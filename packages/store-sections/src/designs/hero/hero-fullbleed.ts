/**
 * Full-bleed hero (docs/section-rules.md §4, §5.1; 2026-10-27): one photo from
 * edge to edge, a dark fade at its foot, and the headline, a line and two
 * buttons sitting on it at the start side, inside the page width. Tall on
 * phones (portrait photo) so the copy never crowds it. The heading is the
 * page's `h1` and the photo is never hidden by the reveal (LCP).
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const heroFullbleed = defineDesign({
  id: "hero-fullbleed",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("صورة بعرض الشاشة", "Full-bleed photo"),
  description: L(
    "صورة كبيرة من طرف الشاشة للطرف، وعليها العنوان وسطر وزرين.",
    "One big photo from edge to edge, with the headline, a line and two buttons on it.",
  ),
  keywords: ["hero", "full width", "banner", "premium", "photo", "واجهة", "بانر", "صورة كبيرة"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.photo(0, L("صورة الواجهة", "Hero photo"), {
            role: "image",
            style: { aspectRatio: "banner", objectFit: "cover", width: "100%", radius: 0 },
            tablet: { aspectRatio: "wide" },
            mobile: { aspectRatio: "story" },
          }),
          t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
          t.container(
            [
              t.stack(
                [
                  t.text(L("المجموعة الجديدة", "The new collection"), { role: "eyebrow", style: { color: "white", fontWeight: "semibold", opacity: 90 } }),
                  t.heading(L("صُنعت لتدوم معك", "Made to stay with you"), "h1", {
                    role: "title",
                    style: { color: "white", fontSize: "display-lg", fontWeight: "bold", lineHeight: "tight" },
                  }),
                  t.paragraph(L("خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.", "Chosen materials, quiet details and fast delivery to your door."), {
                    role: "subtitle",
                    style: { color: "white", fontSize: "lg", opacity: 90, maxWidth: "520px" },
                    mobile: { fontSize: "md" },
                  }),
                  t.row(
                    [
                      t.button(L("تسوّق الآن", "Shop now"), "/products", "light", { role: "cta" }),
                      t.button(L("شوف الجديد", "See what’s new"), "/products?sort=newest", "outline", {
                        role: "cta2",
                        style: { background: "transparent", color: "white", borderColor: "white" },
                      }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 12, paddingTop: 8 } },
                  ),
                ],
                { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start", maxWidth: "680px" }, mobile: { gap: 12 } },
              ),
            ],
            {
              label: L("الحاوية", "Container"),
              style: { position: "absolute", insetBottom: "72px", insetStart: "0px", insetEnd: "0px" },
              mobile: { insetBottom: "32px" },
            },
          ),
        ],
        { label: L("الصورة", "Photo frame"), style: { position: "relative", background: "black", overflow: "hidden" } },
      ),
    ]),
});
