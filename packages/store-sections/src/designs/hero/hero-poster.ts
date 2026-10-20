/**
 * Poster hero (library R-b): the section is a printed poster on the brand
 * colour. A meta line, a wide photo with a round offer sticker on its edge,
 * then a giant headline with the pitch and button beside it. All text sits on
 * the brand colour, never on the photo.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";

export const heroPoster = defineDesign({
  id: "hero-poster",
  version: 1,
  category: "hero",
  subcategory: "sale",
  name: L("بوستر", "Poster"),
  description: L("صورة عريضة بملصق عرض وعنوان ضخم على لون العلامة.", "A wide photo with an offer sticker and a giant headline on the brand colour."),
  keywords: ["hero", "poster", "sale", "drop", "بوستر", "عرض", "حملة"],
  tree: (t) =>
    t.section({ label: L("بوستر", "Poster"), style: { background: "primary", color: "primaryInk", paddingTop: 40, paddingBottom: 56 } }, [
      t.container(
        [
          t.row(
            [
              t.text(L("مجموعة الموسم", "The season drop"), { role: "eyebrow", style: { ...ON_BRAND, fontWeight: "semibold", letterSpacing: "wide" } }),
              t.text(L("من ١ إلى ٣٠ نوفمبر", "1 – 30 November"), { style: { ...ON_BRAND, opacity: 80 } }),
            ],
            {
              label: L("السطر العلوي", "Meta line"),
              style: { justifyContent: "between", paddingBottom: 16, marginBottom: 24, gap: 12 },
            },
          ),
          t.box(
            [
              t.photo(2, L("صورة الحملة", "Campaign photo"), {
                role: "image",
                style: { aspectRatio: "wide", objectFit: "cover", radius: 24 },
                mobile: { aspectRatio: "landscape", radius: 16 },
              }),
              t.stack(
                [
                  t.text(L("خصم", "Up to"), { style: { fontWeight: "semibold", textAlign: "center" } }),
                  t.heading(L("٣٠٪", "30%"), "h3", { style: { fontSize: "4xl", fontWeight: "extrabold", lineHeight: "tight", textAlign: "center" } }),
                  t.text(L("لفترة محدودة", "off"), { style: { fontSize: "xs", textAlign: "center" } }),
                ],
                {
                  label: L("الملصق", "Sticker"),
                  role: "sticker",
                  style: {
                    position: "absolute",
                    insetBottom: "-36px",
                    insetEnd: "40px",
                    width: "136px",
                    minHeight: 136,
                    radius: 999,
                    background: "accent",
                    color: "foreground",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 0,
                    shadow: "lg",
                    zIndex: 2,
                  },
                  mobile: { width: "104px", minHeight: 104, insetEnd: "16px", insetBottom: "-28px" },
                },
              ),
            ],
            { label: L("الصورة", "Photo"), style: { position: "relative", minHeight: 320 }, mobile: { minHeight: 200 } },
          ),
          t.grid(
            [
              t.heading(L("الموسم الجديد وصل", "The new season is here"), "h1", {
                role: "title",
                style: { ...ON_BRAND, fontSize: "display-lg", fontWeight: "extrabold", lineHeight: "tight", colSpan: 2 },
                mobile: { colSpan: 1 },
              }),
              t.stack(
                [
                  t.paragraph(
                    L(
                      "قطع خفيفة بخامات طبيعية، مقاسات كاملة وتبديل مجاني خلال ١٤ يومًا.",
                      "Light pieces in natural fabrics, full size range and free exchanges within 14 days.",
                    ),
                    { role: "subtitle", style: ON_BRAND_BODY },
                  ),
                  t.button(L("اكتشف المجموعة", "Explore the drop"), "/products", "light", { role: "cta" }),
                ],
                { label: L("النص والزر", "Pitch"), style: { gap: 16, alignItems: "start" } },
              ),
            ],
            {
              label: L("العنوان", "Headline"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 40, alignItems: "end", marginTop: 64 },
              mobile: { gap: 20, marginTop: 48 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
