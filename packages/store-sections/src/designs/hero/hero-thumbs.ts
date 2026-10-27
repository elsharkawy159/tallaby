/**
 * Bold slideshow hero (Claude Design premium set, `heroThumbs`): full-bleed
 * slides for campaigns that are known by their photo (new shades, new
 * colours). The copy sits low at the start side on a dim layer and a deep
 * fade, with the slide number in the theme's accent colour, a bold white
 * headline (uppercase in English) and a large pill button. The source jumps between slides with photo
 * thumbnails; our `carousel` has its own dots and arrows instead. The first
 * slide's headline is the page's `h1`.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, N } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

type SlideCopy = { eyebrow: DesignText; title: DesignText; text: DesignText; cta: DesignText; alt: DesignText };

const slide = (t: TreeBuilder, index: number, count: number, copy: SlideCopy) =>
  t.slide(
    [
      t.photo(index, copy.alt, {
        role: "image",
        style: { aspectRatio: "banner", objectFit: "cover", width: "100%" },
        tablet: { aspectRatio: "wide" },
        mobile: { aspectRatio: "portrait" },
      }),
      t.box([], { label: L("التعتيم", "Dim"), style: { ...FILL, background: "black", opacity: 25 } }),
      t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
      t.container(
        [
          t.stack(
            [
              t.row(
                [
                  t.text(N(`0${index + 1} / 0${count}`), { label: L("رقم الشريحة", "Slide number"), style: { color: "accent", fontSize: "sm", fontWeight: "bold" } }),
                  t.text(copy.eyebrow, {
                    role: "eyebrow",
                    style: { color: "white", fontWeight: "semibold", fontSize: "sm", textTransform: "uppercase", letterSpacing: "wider", opacity: 90 },
                  }),
                ],
                { label: L("السطر العلوي", "Eyebrow row"), style: { gap: 14, alignItems: "center", wrap: false } },
              ),
              t.heading(copy.title, index === 0 ? "h1" : "h2", {
                role: "title",
                style: { color: "white", fontSize: "display-lg", fontWeight: "bold", lineHeight: "tight", textTransform: "uppercase", letterSpacing: "tight" },
              }),
              t.paragraph(copy.text, {
                role: "subtitle",
                style: { color: "white", fontSize: "md", lineHeight: "relaxed", opacity: 90, maxWidth: "460px" },
              }),
              t.button(copy.cta, "/products", "light", {
                role: "cta",
                style: { radius: 999, paddingStart: 36, paddingEnd: 36, minHeight: 52, color: "black" },
              }),
            ],
            { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start", maxWidth: "560px" }, mobile: { gap: 12 } },
          ),
        ],
        {
          label: L("الحاوية", "Container"),
          style: { position: "absolute", insetBottom: "104px", insetStart: "0px", insetEnd: "0px" },
          mobile: { insetBottom: "80px" },
        },
      ),
    ],
    { label: L("شريحة", "Slide"), style: { position: "relative", background: "black", minHeight: 0, gap: 0, overflow: "hidden" } },
  );

export const heroThumbs = defineDesign({
  id: "hero-thumbs",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("شرائح بعنوان عريض", "Bold slideshow"),
  description: L(
    "شرائح صور بعرض الشاشة برقم الشريحة وعنوان عريض وزر دائري، لحملات الألوان والدرجات الجديدة.",
    "Full-bleed photo slides with a slide number, a bold headline and a pill button, for new colours and shades.",
  ),
  keywords: ["hero", "slideshow", "carousel", "slider", "beauty", "colour", "premium", "شرائح", "سلايدر", "ألوان", "واجهة"],
  tree: (t) =>
    t.section({ label: L("عرض الشرائح", "Slideshow"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.carousel(
        [
          slide(t, 0, 3, {
            eyebrow: L("درجات جديدة", "New shades"),
            title: L("لون بيتكلم عنك", "Colour that speaks for you"),
            text: L("درجات هادية لكل يوم وألوان جريئة للمناسبات.", "Soft everyday shades and bold statement colour."),
            cta: L("تسوّق الآن", "Shop now"),
            alt: L("صورة الشريحة الأولى", "First slide photo"),
          }),
          slide(t, 1, 3, {
            eyebrow: L("المجموعة الجديدة", "The new drop"),
            title: L("جريء ومريح وليك", "Bold, easy, yours"),
            text: L("اختيارات جديدة وصلت للموسم ده.", "Fresh picks, just in for the season."),
            cta: L("تسوّق الجديد", "Shop new in"),
            alt: L("صورة الشريحة الثانية", "Second slide photo"),
          }),
          slide(t, 2, 3, {
            eyebrow: L("أطقم كاملة", "Sets"),
            title: L("قطعتين وعشر إطلالات", "Two pieces, ten looks"),
            text: L("قطع بتتنسّق مع بعض بسهولة.", "Pieces that work together, easily."),
            cta: L("تسوّق الأطقم", "Shop sets"),
            alt: L("صورة الشريحة الثالثة", "Third slide photo"),
          }),
        ],
        { label: L("الشرائح", "Slides"), autoplay: true, interval: 6 },
      ),
    ]),
});
