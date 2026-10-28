/**
 * Wide banner (docs/section-rules.md §4, §5.1; 2026-10-27): a wide photo
 * inside the store container with one short heading, a line and one button
 * centred on a dark fade at its foot. A visual break between shopping
 * sections.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const promoBannerFullbleed = defineDesign({
  id: "promo-banner-fullbleed",
  version: 2,
  category: "promotions",
  subcategory: "full-width",
  name: L("بانر بعرض الشاشة", "Full-bleed banner"),
  description: L("صورة عريضة، وفي وسطها عنوان قصير وزر واحد.", "A wide photo with a short heading and one button in the middle."),
  keywords: ["banner", "promotion", "full width", "campaign", "premium", "بانر", "عرض", "حملة"],
  tree: (t) =>
    t.section({ label: L("البانر", "Banner") }, [
      t.container(
        [
          t.box(
            [
              t.photo(3, L("صورة البانر", "Banner photo"), {
                role: "image",
                style: { aspectRatio: "banner", objectFit: "cover", width: "100%", radius: 0 },
                mobile: { aspectRatio: "portrait" },
              }),
              t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
              t.container(
                [
                  t.stack(
                    [
                      t.heading(L("عروض نهاية الموسم", "End of season sale"), "h2", {
                        role: "title",
                        style: { color: "white", fontSize: "display-md", fontWeight: "bold", lineHeight: "tight", textAlign: "center" },
                      }),
                      t.paragraph(L("خصومات حتى ٤٠٪ على قطع مختارة، لفترة محدودة.", "Up to 40% off chosen pieces, for a limited time."), {
                        role: "subtitle",
                        style: { color: "white", fontSize: "lg", opacity: 90, textAlign: "center", maxWidth: "560px" },
                        mobile: { fontSize: "md" },
                      }),
                      t.button(L("تسوّق العروض", "Shop the sale"), "/products", "light", { role: "cta", style: { marginTop: 4 } }),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 14, alignItems: "center" } },
                  ),
                ],
                {
                  label: L("الحاوية", "Container"),
                  style: { position: "absolute", insetBottom: "64px", insetStart: "0px", insetEnd: "0px" },
                  mobile: { insetBottom: "32px" },
                },
              ),
            ],
            { label: L("الصورة", "Photo frame"), style: { position: "relative", background: "black", overflow: "hidden", radius: 24 } },
          ),
        ],
        { label: L("حاوية الصورة", "Photo container"), role: "container" },
      ),
    ]),
});
