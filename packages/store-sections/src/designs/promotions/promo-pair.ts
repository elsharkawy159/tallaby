/**
 * Classic offers (library M-a, Classic template): two rounded promo cards side
 * by side, one deep brand and one accent. Each has a title, a line and a small
 * button on the start side and a photo in a circle on the end side.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";

type Offer = { tone: "brand" | "accent"; title: DesignText; text: DesignText; cta: DesignText; photo: number };

const OFFERS: Offer[] = [
  {
    tone: "brand",
    title: L("اشترِ مجموعة ووفّر ١٥٪", "Bundle & save 15%"),
    text: L("اختر أي منتجين معًا.", "Pick any two items together."),
    cta: L("كوّن مجموعتك", "Build a bundle"),
    photo: 4,
  },
  {
    tone: "accent",
    title: L("هدايا أقل من ٦٠٠ ج.م", "Gifts under EGP 600"),
    text: L("أشياء صغيرة سيستخدمونها كل يوم.", "Small things they will use every day."),
    cta: L("تسوّق الهدايا", "Shop gifts"),
    photo: 5,
  },
];

const card = (t: TreeBuilder, o: Offer) => {
  const brand = o.tone === "brand";
  return t.grid(
    [
      t.stack(
        [
          t.heading(o.title, "h3", { role: "title", style: { fontSize: "2xl", fontWeight: "extrabold", ...(brand && ON_BRAND) } }),
          t.paragraph(o.text, { role: "body", style: brand ? ON_BRAND_BODY : { color: "foreground", opacity: 80 } }),
          t.button(o.cta, "/products", brand ? "light" : "solid", { role: "cta", style: { marginTop: 8 } }),
        ],
        { label: L("النص", "Copy"), style: { gap: 8, alignItems: "start" } },
      ),
      t.photo(o.photo, o.title, {
        role: "image",
        style: { aspectRatio: "square", objectFit: "cover", radius: 999, borderWidth: 6, borderColor: brand ? "primaryInk" : "background" },
      }),
    ],
    {
      label: L("عرض", "Offer"),
      columns: { desktop: 2, mobile: 2 },
      style: {
        gap: 20,
        alignItems: "center",
        background: brand ? "primary" : "accent",
        color: brand ? "primaryInk" : "foreground",
        radius: 28,
        paddingTop: 32,
        paddingBottom: 32,
        paddingStart: 32,
        paddingEnd: 32,
        overflow: "hidden",
      },
      mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20, gap: 12 },
    },
  );
};

export const promoPair = defineDesign({
  id: "promo-pair",
  version: 1,
  category: "promotions",
  subcategory: "split",
  name: L("عروض كلاسيك", "Classic offers"),
  description: L("بطاقتا عرض متجاورتان، داكنة وملونة، بصورة في دائرة.", "Two promo cards side by side, deep and accent, each with a round photo."),
  keywords: ["offers", "promo", "classic", "bundle", "عروض", "كلاسيك", "مجموعة"],
  tree: (t) =>
    t.section({ label: L("العروض", "Offers") }, [
      t.container(
        [
          t.grid(
            OFFERS.map((o) => card(t, o)),
            { label: L("البطاقات", "Cards"), role: "items", columns: { desktop: 2, mobile: 1 }, style: { gap: 20 }, mobile: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
