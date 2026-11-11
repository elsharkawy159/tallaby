/**
 * Banner carousel hero (Claude Design "Storefront Templates" seventh batch,
 * `bannerCarousel`): full-width photo banners, one at a time, each with its
 * eyebrow, headline, line and button on a dark fade at the bottom. The
 * `carousel` element autoplays every 5 seconds (it keeps playing under the mouse) and pauses on focus,
 * the pause button, a hidden tab or off-screen; with reduced motion it
 * starts paused. Phones swipe; the arrows are desktop only.
 *
 * v2 (look-first pilot, 2026-11-11, docs/systems/plan.md §10 L7): each slide
 * speaks the full-bleed hero's language. The photo fills most of the first
 * screen (`HERO_FRAME`: at least 680px on desktop and a tall crop on phones,
 * where the copy now stays on the photo), the eyebrow is a small uppercase
 * line and the headline is tighter. Slides change every 6 seconds. Node
 * order, roles and field names are v1's.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { FILL, HERO_EYEBROW, HERO_FRAME, SOFT_DIM } from "./_shared";

const slide = (t: TreeBuilder, index: number, copy: { eyebrow: DesignText; title: DesignText; text: DesignText; cta: DesignText; alt: DesignText }) =>
  t.slide(
    [
      t.photo(index, copy.alt, {
        role: "image",
        style: { ...HERO_FRAME.style, objectFit: "cover" },
        tablet: HERO_FRAME.tablet,
        mobile: HERO_FRAME.mobile,
      }),
      t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
      t.box([], { label: L("التعتيم", "Dim"), role: "dim", style: SOFT_DIM }),
      t.container(
        [
          t.stack(
            [
              t.text(copy.eyebrow, { role: "eyebrow", style: { ...HERO_EYEBROW, color: "white", opacity: 90 } }),
              t.heading(copy.title, index === 0 ? "h1" : "h2", {
                role: "title",
                style: { color: "white", fontSize: "display-lg", fontWeight: "bold", lineHeight: "tight", letterSpacing: "tight" },
              }),
              t.paragraph(copy.text, { role: "subtitle", style: { color: "white", fontSize: "lg", opacity: 90, maxWidth: "480px" }, mobile: { fontSize: "md" } }),
              t.button(copy.cta, "/products", "light", { role: "cta", style: { marginTop: 12 } }),
            ],
            { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start", maxWidth: "720px" }, mobile: { gap: 12 } },
          ),
        ],
        {
          label: L("الحاوية", "Container"),
          // Clear of the carousel's bar (dots, pause and arrows) at the foot of the slide.
          style: { position: "absolute", insetBottom: "112px", insetStart: "0px", insetEnd: "0px" },
          mobile: { insetBottom: "88px" },
        },
      ),
    ],
    { label: L("شريحة", "Slide"), style: { position: "relative", background: "black", minHeight: 0, gap: 0 } },
  );

export const heroCarousel = defineDesign({
  id: "hero-carousel",
  version: 2,
  category: "hero",
  subcategory: "full-width",
  name: L("بانرات متحركة", "Banner carousel"),
  description: L(
    "بانرات صور بعرض الصفحة تملأ أول الشاشة وتتغير وحدها، بعنوان وزر على كل صورة.",
    "Full-width photo banners that fill the first screen and change on their own, each with a headline and button.",
  ),
  keywords: ["hero", "carousel", "slider", "banner", "slides", "سلايدر", "بانر", "شرائح"],
  tree: (t) =>
    t.section({ label: L("البانرات", "Banners"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.carousel(
        [
          slide(t, 0, {
            eyebrow: L("وصل حديثًا", "Just in"),
            title: L("الموسم الجديد وصل", "The new season is here"),
            text: L("قطع مختارة بعناية، وتوصيل لحد باب البيت.", "Hand-picked pieces, delivered to your door."),
            cta: L("تسوّق الجديد", "Shop new in"),
            alt: L("صورة الحملة الأولى", "First campaign photo"),
          }),
          slide(t, 1, {
            eyebrow: L("الأكثر مبيعًا", "Best sellers"),
            title: L("المفضّلة عند عملائنا", "Our customers' favourites"),
            text: L("القطع اللي بترجع لها كل مرة.", "The pieces people come back for."),
            cta: L("شوف الأكثر مبيعًا", "See best sellers"),
            alt: L("صورة الحملة الثانية", "Second campaign photo"),
          }),
          slide(t, 2, {
            eyebrow: L("عروض الأسبوع", "This week"),
            title: L("خصومات لفترة محدودة", "Offers for a limited time"),
            text: L("أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.", "Lower prices on picked pieces, while stocks last."),
            cta: L("تسوّق العروض", "Shop the offers"),
            alt: L("صورة الحملة الثالثة", "Third campaign photo"),
          }),
        ],
        { label: L("الشرائح", "Slides"), autoplay: true, interval: 6 },
      ),
    ]),
});
