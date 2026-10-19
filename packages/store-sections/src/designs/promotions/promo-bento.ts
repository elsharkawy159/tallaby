/**
 * Offer bento (library M-e): three photo tiles, one tall on the start side and
 * two stacked on the end, each with a big percentage chip at the top and a
 * paper label with the offer name at the bottom.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, sectionHead } from "../_kit";

const tile = (t: TreeBuilder, index: number, value: DesignText, label: DesignText, aspectRatio: "portrait" | "wide") =>
  t.link(
    "/products",
    [
      t.photo(index, label, { style: { aspectRatio, objectFit: "cover", radius: 24 }, mobile: { aspectRatio: "landscape" } }),
      t.row([t.text(L("حتى", "Up to"), { style: { fontWeight: "medium" } }), t.text(value, { style: { fontWeight: "extrabold", fontSize: "2xl" } })], {
        label: L("النسبة", "Value"),
        style: {
          position: "absolute",
          insetTop: "16px",
          insetStart: "16px",
          gap: 6,
          background: "accent",
          radius: 999,
          paddingTop: 6,
          paddingBottom: 6,
          paddingStart: 16,
          paddingEnd: 16,
        },
      }),
      t.row([t.text(label, { style: { fontWeight: "bold", fontSize: "md" } }), t.icon("arrow", { style: { color: "primary", fontSize: "lg" } })], {
        label: L("اسم العرض", "Label"),
        style: {
          position: "absolute",
          insetBottom: "16px",
          insetStart: "16px",
          insetEnd: "16px",
          justifyContent: "between",
          background: "background",
          radius: 16,
          paddingTop: 14,
          paddingBottom: 14,
          paddingStart: 16,
          paddingEnd: 16,
          wrap: false,
        },
      }),
    ],
    { label: L("عرض", "Offer tile"), style: { position: "relative", paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 92 } } },
  );

export const promoBento = defineDesign({
  id: "promo-bento",
  version: 1,
  category: "promotions",
  subcategory: "tiles",
  name: L("شبكة عروض", "Offer bento"),
  description: L("ثلاث صور عروض: واحدة طويلة واثنتان فوق بعض، بنسبة واسم.", "Three offer photos, one tall and two stacked, each with a value and a name."),
  keywords: ["offers", "sale", "tiles", "bento", "عروض", "تخفيضات"],
  tree: (t) =>
    t.section({ label: L("عروض الموسم", "Season offers") }, [
      t.container(
        [
          sectionHead(t, { title: L("عروض الموسم", "Season offers"), link: { href: "/products", text: L("كل العروض", "All offers") } }),
          t.grid(
            [
              tile(t, 0, L("٤٠٪", "40%"), L("تشكيلة الموسم", "Season edit"), "portrait"),
              t.stack(
                [tile(t, 1, L("٢٥٪", "25%"), L("الأكثر مبيعًا", "Best sellers"), "wide"), tile(t, 2, L("٣٠٪", "30%"), L("أساسيات", "Essentials"), "wide")],
                {
                  label: L("العرضان", "Two tiles"),
                  style: { gap: 16, justifyContent: "between" },
                },
              ),
            ],
            { label: L("البينتو", "Bento"), role: "items", columns: { desktop: 2, mobile: 1 }, style: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
