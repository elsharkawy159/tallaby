/**
 * Inline type hero (library R-c): a giant headline with two small capsule
 * photos set inside the line like words, then a row splitting a short pitch
 * from a cluster of category chips.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const WORD = { fontSize: "display-lg", fontWeight: "extrabold", lineHeight: "tight" } as const;

const CHIPS = [L("وصل حديثًا", "New in"), L("الأكثر مبيعًا", "Best sellers"), L("العروض", "Offers"), L("هدايا", "Gifts")];

const capsule = (t: TreeBuilder, index: number, alt: DesignText) =>
  t.photo(index, alt, { style: { aspectRatio: "wide", objectFit: "cover", radius: 999, width: "150px" }, mobile: { width: "88px" } });

export const heroInline = defineDesign({
  id: "hero-inline",
  version: 1,
  category: "hero",
  subcategory: "editorial",
  name: L("كلام وصور صغيرة", "Inline type"),
  description: L(
    "عنوان ضخم بصورتين صغيرتين داخل السطر، وتحته نبذة وأقسام سريعة.",
    "A giant headline with two small photos inside the line, a short pitch and quick links.",
  ),
  keywords: ["hero", "typography", "editorial", "عنوان", "تحريري"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 72, paddingBottom: 72 } }, [
      t.container(
        [
          t.row(
            [
              t.badge(L("تشكيلة ٢٠٢٦", "The 2026 edit"), { role: "eyebrow", style: { color: "primary" } }),
              t.text(L("منتجات مختارة بعناية", "Hand-picked products"), { style: { color: "muted" } }),
            ],
            { label: L("السطر العلوي", "Meta line"), style: { justifyContent: "between", gap: 12, marginBottom: 24 } },
          ),
          t.row(
            [
              t.heading(L("كل ما تستخدمه", "Everything you use"), "h1", { role: "title", style: WORD }),
              capsule(t, 0, L("صورة صغيرة", "Small photo")),
              t.text(L("كل يوم،", "every day,"), { style: WORD }),
              capsule(t, 1, L("صورة صغيرة", "Small photo")),
              t.text(L("بجودة أفضل.", "made better."), { style: { ...WORD, color: "primary" } }),
            ],
            { label: L("العنوان بالصور", "Headline with photos"), role: "headline", style: { gap: 16, alignItems: "center" }, mobile: { gap: 10 } },
          ),
          t.grid(
            [
              t.stack(
                [
                  t.paragraph(
                    L(
                      "نختار كل منتج بأنفسنا ونجرّبه قبل أن يصل إليك، بضمان وتوصيل سريع.",
                      "We pick and test every product before it reaches you, with warranty and fast delivery.",
                    ),
                    { role: "subtitle", style: { fontSize: "lg", maxWidth: "520px" } },
                  ),
                  t.button(L("ابدأ التسوق", "Start shopping"), "/products", "solid", { role: "cta" }),
                ],
                { label: L("النبذة", "Pitch"), style: { gap: 20, alignItems: "start" } },
              ),
              t.row(
                CHIPS.map((chip) =>
                  t.link("/products", [t.text(chip, { style: { fontWeight: "semibold" } })], {
                    label: L("قسم", "Chip"),
                    style: {
                      borderWidth: 1,
                      borderColor: "border",
                      radius: 999,
                      paddingStart: 18,
                      paddingEnd: 18,
                      paddingTop: 10,
                      paddingBottom: 10,
                      hover: { borderColor: "primary" },
                    },
                  }),
                ),
                {
                  label: L("روابط سريعة", "Quick links"),
                  role: "items",
                  style: { gap: 10, justifyContent: "end", alignItems: "end" },
                  mobile: { justifyContent: "start" },
                },
              ),
            ],
            {
              label: L("السطر السفلي", "Lower row"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 32, alignItems: "end", marginTop: 48 },
              mobile: { marginTop: 32 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
