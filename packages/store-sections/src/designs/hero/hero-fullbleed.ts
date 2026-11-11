/**
 * Full-bleed hero (docs/section-rules.md §4, §5.1; 2026-10-27): one photo from
 * edge to edge, a dark fade at its foot, and the headline, a line and the
 * actions sitting on it at the start side, inside the page width. The heading
 * is the page's `h1` and the photo is never hidden by the reveal (LCP).
 *
 * v2 (motion v2, 2026-11-11, docs/motion-v2-plan.md §6): the photo drifts
 * with the scroll (`parallax`, transform only, so LCP is unaffected), the
 * copy fades out as the visitor scrolls on (the section's `fade-exit`, only
 * as the page's first section), and the eyebrow rises word by word when the
 * hero sits lower on a page. The `h1` never reveals.
 *
 * v3 (look-first pilot, 2026-11-11, docs/systems/plan.md §10 L7): the photo
 * fills most of the first screen (`HERO_FRAME`: at least 680px on desktop and
 * a tall crop on phones, where the copy now stays on the photo), the eyebrow
 * is a small uppercase line, and there is one solid button with a quiet
 * underlined link in place of the second boxed button. Node order, roles and
 * field names are v2's.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FILL, HERO_EYEBROW, HERO_FRAME, QUIET_LINK, SOFT_DIM } from "./_shared";

export const heroFullbleed = defineDesign({
  id: "hero-fullbleed",
  version: 3,
  category: "hero",
  subcategory: "full-width",
  name: L("صورة بعرض الشاشة", "Full-bleed photo"),
  description: L(
    "صورة كبيرة من طرف الشاشة للطرف تملأ أول الشاشة، وعليها العنوان وسطر وزر ورابط.",
    "One big photo from edge to edge that fills the first screen, with the headline, a line, a button and a link on it.",
  ),
  keywords: ["hero", "full width", "banner", "premium", "photo", "parallax", "واجهة", "بانر", "صورة كبيرة"],
  scrollEffect: "fade-exit",
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.photo(0, L("صورة الواجهة", "Hero photo"), {
            role: "image",
            style: { ...HERO_FRAME.style, objectFit: "cover", width: "100%", radius: 0 },
            tablet: HERO_FRAME.tablet,
            mobile: HERO_FRAME.mobile,
            motion: { scrollEffect: "parallax" },
          }),
          t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
          t.box([], { label: L("التعتيم", "Dim"), role: "dim", style: SOFT_DIM }),
          t.container(
            [
              t.stack(
                [
                  t.text(L("المجموعة الجديدة", "The new collection"), {
                    role: "eyebrow",
                    style: { ...HERO_EYEBROW, color: "white", opacity: 90 },
                    motion: { reveal: "words" },
                  }),
                  t.heading(L("صُنعت لتدوم معك", "Made to stay with you"), "h1", {
                    role: "title",
                    style: { color: "white", fontSize: "display-lg", fontWeight: "bold", lineHeight: "tight", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("خامات مختارة وتفاصيل هادئة، وتوصيل سريع لحد باب البيت.", "Chosen materials, quiet details and fast delivery to your door."), {
                    role: "subtitle",
                    style: { color: "white", fontSize: "lg", opacity: 90, maxWidth: "480px" },
                    mobile: { fontSize: "md" },
                  }),
                  t.row(
                    [
                      t.button(L("تسوّق الآن", "Shop now"), "/products", "light", { role: "cta" }),
                      t.button(L("شوف الجديد", "See what’s new"), "/products?sort=newest", "outline", { role: "cta2", style: QUIET_LINK }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 8, paddingTop: 12, alignItems: "center" } },
                  ),
                ],
                { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start", maxWidth: "720px" }, mobile: { gap: 12 } },
              ),
            ],
            {
              label: L("الحاوية", "Container"),
              style: { position: "absolute", insetBottom: "72px", insetStart: "0px", insetEnd: "0px" },
              mobile: { insetBottom: "36px" },
            },
          ),
        ],
        { label: L("الصورة", "Photo frame"), style: { position: "relative", background: "black", overflow: "hidden" } },
      ),
    ]),
});
