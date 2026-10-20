/**
 * Chip cloud (Modular set): a centred heading over the store's categories as
 * pill chips, each with a round photo, the name and a muted count. A light way
 * into many categories in very little height.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { CATEGORY_LINK } from "./_shared";

export const categoriesChips = defineDesign({
  id: "categories-chips",
  version: 1,
  category: "categories",
  subcategory: "circles",
  name: L("سحابة أقسام", "Chip cloud"),
  description: L("أقسام متجرك كشرائح صغيرة بصورة واسم وعدد.", "Your categories as small chips with a photo, name and count."),
  keywords: ["categories", "chips", "pills", "playful", "أقسام", "شرائح"],
  tree: (t) =>
    t.section({ label: L("الأقسام", "Categories") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("إيه اللي في بالك؟", "What are you after?"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  letterSpacing: "tight",
                  textAlign: "center",
                },
              }),
              t.categoryList(
                [
                  t.link(
                    CATEGORY_LINK,
                    [
                      t.row(
                        [
                          t.image("", L("صورة القسم", "Category photo"), {
                            bind: "image",
                            style: {
                              aspectRatio: "square",
                              objectFit: "cover",
                              radius: 999,
                              width: "40px",
                              background: "secondary",
                            },
                          }),
                          t.text(L("اسم القسم", "Category"), {
                            bind: "name",
                            style: { fontWeight: "semibold" },
                          }),
                          t.text(L("١٢", "12"), {
                            bind: "productCount",
                            style: { color: "muted", fontSize: "sm" },
                          }),
                        ],
                        {
                          label: L("المحتوى", "Content"),
                          style: { gap: 10, wrap: false },
                        },
                      ),
                    ],
                    {
                      label: L("شريحة القسم", "Category chip"),
                      bind: "href",
                      style: {
                        ...FLUSH,
                        paddingTop: 6,
                        paddingBottom: 6,
                        paddingStart: 6,
                        paddingEnd: 18,
                        radius: 999,
                        borderWidth: 1,
                        borderColor: "border",
                        hover: { borderColor: "primary" },
                      },
                    },
                  ),
                ],
                {
                  label: L("الأقسام", "Categories"),
                  role: "items",
                  limit: 12,
                  columns: { desktop: 4, tablet: 3, mobile: 2 },
                  style: { gap: 10, width: "100%", maxWidth: "900px" },
                  mobile: { gap: 8 },
                },
              ),
            ],
            {
              label: L("السحابة", "Cloud"),
              style: { gap: 28, alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
