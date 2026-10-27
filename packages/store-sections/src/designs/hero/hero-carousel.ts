/**
 * Banner carousel hero (Claude Design "Storefront Templates" seventh batch,
 * `bannerCarousel`): full-width photo banners, one at a time, each with its
 * eyebrow, headline, line and button on a dark fade at the bottom. The
 * `carousel` element autoplays every 5 seconds (it keeps playing under the mouse) and pauses on focus,
 * the pause button, a hidden tab or off-screen; with reduced motion it
 * starts paused. Phones swipe; the arrows are desktop only.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

const slide = (t: TreeBuilder, index: number, copy: { eyebrow: DesignText; title: DesignText; text: DesignText; cta: DesignText; alt: DesignText }) =>
  t.slide(
    [
      t.photo(index, copy.alt, {
        role: "image",
        style: { aspectRatio: "banner", objectFit: "cover" },
        mobile: { aspectRatio: "portrait" },
      }),
      t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade", opacity: 90 } }),
      t.container(
        [
          t.stack(
            [
              t.text(copy.eyebrow, { role: "eyebrow", style: { color: "white", fontWeight: "semibold", opacity: 90 } }),
              t.heading(copy.title, index === 0 ? "h1" : "h2", {
                role: "title",
                style: { color: "white", fontSize: "display-lg", fontWeight: "bold", lineHeight: "tight" },
              }),
              t.paragraph(copy.text, { role: "subtitle", style: { color: "white", fontSize: "lg", opacity: 90 }, mobile: { fontSize: "md" } }),
              t.button(copy.cta, "/products", "light", { role: "cta", style: { marginTop: 6 } }),
            ],
            { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start", maxWidth: "640px" } },
          ),
        ],
        {
          label: L("الحاوية", "Container"),
          style: { position: "absolute", insetBottom: "104px", insetStart: "0px", insetEnd: "0px" },
          mobile: { insetBottom: "88px" },
        },
      ),
    ],
    { label: L("شريحة", "Slide"), style: { position: "relative", background: "black", minHeight: 0, gap: 0 } },
  );

export const heroCarousel = defineDesign({
  id: "hero-carousel",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("بانرات متحركة", "Banner carousel"),
  description: L(
    "بانرات صور بعرض الصفحة تتغير وحدها، بعنوان وزر على كل صورة.",
    "Full-width photo banners that change on their own, each with a headline and button.",
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
        { label: L("الشرائح", "Slides"), autoplay: true, interval: 5 },
      ),
    ]),
});
