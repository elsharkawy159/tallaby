/**
 * Logo wall (library L-b, the marquee as two still rows): a heading over two
 * full-width rows of logos, the second offset by half a logo.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { BRANDS, wordmark } from "./_shared";

export const brandsWall = defineDesign({
  id: "brands-wall",
  version: 1,
  category: "brands",
  subcategory: "logo-carousel",
  name: L("حائط الماركات", "Logo wall"),
  description: L("عنوان فوق صفين من شعارات الماركات، مناسب لثماني ماركات أو أكثر.", "A heading over two rows of logos, for eight brands or more."),
  keywords: ["brands", "logos", "marquee", "ماركات", "شعارات"],
  tree: (t) =>
    t.section({ label: L("الماركات", "Brands") }, [
      t.container(
        [
          sectionHead(t, { title: L("ماركات نبيعها", "Brands we carry"), align: "center" }),
          t.stack(
            [0, 1].map((rowIndex) =>
              t.grid(
                BRANDS.slice(rowIndex * 4, rowIndex * 4 + 4).map((_, i) => wordmark(t, rowIndex * 4 + i, "4xl")),
                {
                  label: L("صف", "Row"),
                  columns: { desktop: 4, mobile: 2 },
                  style: {
                    gap: 24,
                    alignItems: "center",
                    paddingTop: 24,
                    paddingBottom: 24,
                    background: rowIndex ? "background" : "secondary",
                    radius: 999,
                    ...(rowIndex && { marginStart: 80 }),
                  },
                  mobile: { radius: 24, marginStart: 0 },
                },
              ),
            ),
            { label: L("الصفوف", "Rows"), role: "items", style: { gap: 12, marginTop: 32 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
