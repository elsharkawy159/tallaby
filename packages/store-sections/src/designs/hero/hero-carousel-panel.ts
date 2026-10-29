/**
 * Panel carousel hero (2026-10-29, after the WoodMart "Accessories" demo's
 * slider): full-width product photos on a light panel, one at a time, with a
 * big dark headline, a line and two buttons laid straight on the photo's
 * start side over a soft light fade (`shelf-start`, mirrored in Arabic), so
 * pick photos with the products on the end side. Arrows sit at the two edges
 * and the dots are centred under the slide (`controls: "sides"`). Phones show
 * the photo on top and the copy under it on the panel.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

const slide = (
  t: TreeBuilder,
  index: number,
  copy: { title: DesignText; text: DesignText; cta: DesignText; more: DesignText; alt: DesignText },
) =>
  t.slide(
    [
      t.photo(index, copy.alt, {
        role: "image",
        style: { aspectRatio: "banner", objectFit: "cover", width: "100%", radius: 0 },
        tablet: { aspectRatio: "wide" },
        mobile: { aspectRatio: "landscape" },
      }),
      t.box([], { label: L("التظليل", "Fade"), style: { ...FILL, gradient: "shelf-start" }, mobile: { hidden: true } }),
      t.stack(
        [
          t.container(
            [
              t.stack(
                [
                  t.heading(copy.title, index === 0 ? "h1" : "h2", {
                    role: "title",
                    style: { fontSize: "display-lg", fontWeight: "semibold", lineHeight: "tight" },
                    mobile: { fontSize: "display-sm" },
                  }),
                  t.paragraph(copy.text, { role: "subtitle", style: { color: "muted", fontSize: "lg", maxWidth: "440px" }, mobile: { fontSize: "md" } }),
                  t.row(
                    [
                      t.button(copy.cta, "/products", "solid", { role: "cta" }),
                      t.button(copy.more, "/about", "light", { role: "cta2" }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 10, paddingTop: 8 } },
                  ),
                ],
                { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start", maxWidth: "520px" } },
              ),
            ],
            { label: L("الحاوية", "Container"), style: { paddingTop: 0, paddingBottom: 0 }, tablet: { paddingStart: 72, paddingEnd: 72 } },
          ),
        ],
        {
          label: L("الطبقة", "Overlay"),
          style: { ...FILL, justifyContent: "center", gap: 0 },
          mobile: { position: "relative", insetTop: "auto", insetBottom: "auto", insetStart: "auto", insetEnd: "auto", paddingTop: 24, paddingBottom: 64 },
        },
      ),
    ],
    { label: L("شريحة", "Slide"), style: { position: "relative", background: "secondary", minHeight: 0, gap: 0 } },
  );

export const heroCarouselPanel = defineDesign({
  id: "hero-carousel-panel",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("سلايدر بلوح فاتح", "Panel carousel"),
  description: L(
    "صور منتجات بعرض الصفحة على خلفية فاتحة تتغير وحدها، والعنوان والأزرار على جنب الصورة، وأسهم على الجنبين.",
    "Full-width product photos on a light background that change on their own, with the headline and buttons on the photo's side and arrows at the edges.",
  ),
  keywords: ["hero", "carousel", "slider", "panel", "product", "سلايدر", "شرائح", "منتج", "لوح"],
  tree: (t) =>
    t.section({ label: L("السلايدر", "Slider"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.carousel(
        [
          slide(t, 0, {
            title: L("اشحن موبايلك بأمان", "Charge your phone safely"),
            text: L("شواحن وكابلات أصلية بتحمي البطارية، وتوصيل لحد باب البيت.", "Genuine chargers and cables that protect the battery, delivered to your door."),
            cta: L("تسوّق الآن", "Shop now"),
            more: L("اعرف أكتر", "Learn more"),
            alt: L("صورة الشريحة الأولى", "First slide photo"),
          }),
          slide(t, 1, {
            title: L("لكل موبايل جرابه", "A case for every phone"),
            text: L("اختار موديل موبايلك وشوف كل الجرابات اللي بتناسبه.", "Pick your phone model and see every case that fits it."),
            cta: L("تسوّق الجرابات", "Shop cases"),
            more: L("كل الأقسام", "All departments"),
            alt: L("صورة الشريحة الثانية", "Second slide photo"),
          }),
          slide(t, 2, {
            title: L("إكسسوارات مختارة", "Picked accessories"),
            text: L("الحاجات الصغيرة اللي بتسهّل يومك، بأسعار معقولة.", "The small things that make your day easier, at fair prices."),
            cta: L("شوف المختار", "See the picks"),
            more: L("عن المتجر", "About the store"),
            alt: L("صورة الشريحة الثالثة", "Third slide photo"),
          }),
        ],
        { label: L("الشرائح", "Slides"), autoplay: true, interval: 5, controls: "sides" },
      ),
    ]),
});
