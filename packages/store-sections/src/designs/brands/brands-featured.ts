/**
 * Featured brand (library L-e): a tinted panel for one brand, its name large
 * on the start side with a short description and button, and three photos of
 * its range on the end side.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BRANDS } from "./_shared";

export const brandsFeatured = defineDesign({
  id: "brands-featured",
  version: 1,
  category: "brands",
  subcategory: "brand-cards",
  name: L("ماركة مميزة", "Featured brand"),
  description: L("لوحة لماركة واحدة: اسمها ونبذة وزر وثلاث صور من منتجاتها.", "A panel for one brand: its name, a line, a button and three photos."),
  keywords: ["brand", "official dealer", "featured", "ماركة", "وكيل", "مميز"],
  tree: (t) =>
    t.section({ label: L("ماركة مميزة", "Featured brand") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(BRANDS[0]!, "h2", { role: "title", style: { fontSize: "display-md", fontWeight: "extrabold", letterSpacing: "wider" } }),
                  t.paragraph(
                    L(
                      "نحن الوكيل المعتمد لهذه الماركة، بضمان سنتين على كل منتج.",
                      "We are this brand's authorised dealer, with a 2-year warranty on everything.",
                    ),
                    { role: "body" },
                  ),
                  t.button(L("كل منتجات الماركة", "All brand products"), "/products", "solid", { role: "cta" }),
                ],
                { label: L("الماركة", "Brand"), style: { gap: 14, alignItems: "start" } },
              ),
              t.grid(
                [0, 1, 2].map((i) =>
                  t.link(
                    "/products",
                    [t.photo(i + 2, L("منتج من الماركة", "Brand product"), { style: { aspectRatio: "portrait", objectFit: "cover", radius: 18 } })],
                    {
                      label: L("صورة", "Photo"),
                      style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 90 } },
                    },
                  ),
                ),
                {
                  label: L("الصور", "Photos"),
                  role: "items",
                  columns: { desktop: 3, mobile: 3 },
                  style: { gap: 12, colSpan: 2 },
                  mobile: { colSpan: 1, gap: 8 },
                },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 3, mobile: 1 },
              style: {
                gap: 40,
                alignItems: "center",
                background: "secondary",
                radius: 32,
                paddingTop: 40,
                paddingBottom: 40,
                paddingStart: 40,
                paddingEnd: 40,
              },
              mobile: { gap: 24, paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
