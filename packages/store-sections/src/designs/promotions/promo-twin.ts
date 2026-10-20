/**
 * Twin offers (Modular set): two equal offer cards side by side, one brand
 * coloured and one sun coloured, each with a label, a short title, a link and
 * a photo in its own corner frame, so text never overlaps it.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { FLUSH, arrowText, dotLabel } from "../_modular";

function offer(t: TreeBuilder, o: { label: DesignText; title: DesignText; photo: number; brand: boolean }): NodeTemplate {
  const ink = o.brand ? "primaryInk" : "foreground";
  return t.link(
    "/products",
    [
      t.grid(
        [
          t.stack(
            [
              dotLabel(t, o.label, { onBrand: o.brand }),
              t.heading(o.title, "h3", {
                role: "title",
                style: { fontSize: "3xl", letterSpacing: "tight", color: ink },
                mobile: { fontSize: "2xl" },
              }),
              arrowText(t, L("تسوق", "Shop"), ink),
            ],
            {
              label: L("النص", "Copy"),
              style: { gap: 10, alignItems: "start", justifyContent: "center" },
            },
          ),
          t.photo(o.photo, o.title, {
            role: "image",
            style: {
              aspectRatio: "square",
              objectFit: "cover",
              radius: 18,
              width: "100%",
            },
          }),
        ],
        {
          label: L("المحتوى", "Content"),
          columns: { desktop: 2, mobile: 2 },
          style: { gap: 20, alignItems: "center" },
          mobile: { gap: 12 },
        },
      ),
    ],
    {
      label: L("عرض", "Offer"),
      style: {
        ...FLUSH,
        background: o.brand ? "primary" : "accent",
        radius: 24,
        overflow: "hidden",
        paddingTop: 36,
        paddingBottom: 36,
        paddingStart: 36,
        paddingEnd: 36,
        hover: { opacity: 95 },
      },
      mobile: {
        paddingTop: 24,
        paddingBottom: 24,
        paddingStart: 22,
        paddingEnd: 22,
      },
    },
  );
}

export const promoTwin = defineDesign({
  id: "promo-twin",
  version: 1,
  category: "promotions",
  subcategory: "split",
  name: L("عرضين", "Twin offers"),
  description: L("كارتين عروض جنب بعض، واحد بلون المتجر وواحد بلون مشرق.", "Two offer cards side by side, one in the brand colour and one bright."),
  keywords: ["promotions", "offers", "two", "bold", "عروض", "عرضين"],
  tree: (t) =>
    t.section({ label: L("العروض", "Offers") }, [
      t.container(
        [
          t.grid(
            [
              offer(t, {
                label: L("لحد ٣٠٪", "Up to 30%"),
                title: L("تخفيضات الموسم", "Season sale"),
                photo: 2,
                brand: true,
              }),
              offer(t, {
                label: L("باقة", "Bundle"),
                title: L("اشتري ٢ والتالت هدية", "Buy 2, get the third free"),
                photo: 3,
                brand: false,
              }),
            ],
            {
              label: L("العرضين", "Offers"),
              role: "items",
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 12 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
