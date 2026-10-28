/**
 * Split screen (Modular set): two halves in one rounded panel inside the
 * store container: a brand-coloured half with a large headline, text and two
 * buttons, and a photo half. Text never sits on the photo. On mobile the
 * photo comes first.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { dotLabel, pillButton } from "../_modular";

export const heroHalves = defineDesign({
  id: "hero-halves",
  version: 2,
  category: "hero",
  subcategory: "split",
  name: L("نص الشاشة", "Split screen"),
  description: L(
    "نصف بلون المتجر فيه العنوان والأزرار، ونصف صورة، في لوح واحد.",
    "A brand-coloured half with the headline and buttons, and a photo half, in one panel.",
  ),
  keywords: ["hero", "split", "bold", "campaign", "واجهة", "نصين", "حملة"],
  tree: (t) =>
    t.section(
      {
        label: L("الواجهة", "Hero"),
        style: { paddingTop: 24, paddingBottom: 24 },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.stack(
                  [
                    dotLabel(t, L("كوليكشن الموسم", "Season collection"), {
                      onBrand: true,
                    }),
                    t.heading(L("صوت أنقى، كل يوم", "Cleaner sound, every day"), "h1", {
                      role: "title",
                      style: {
                        fontSize: "display-lg",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                        ...ON_BRAND,
                      },
                    }),
                    t.paragraph(L("منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.", "Genuine products with local warranty, delivered in 48 hours."), {
                      role: "subtitle",
                      style: {
                        fontSize: "lg",
                        maxWidth: "40ch",
                        ...ON_BRAND_BODY,
                      },
                    }),
                    t.row(
                      [
                        pillButton(t, L("تسوق الآن", "Shop now"), "/products", {
                          tone: "ink",
                        }),
                        pillButton(t, L("العروض", "Offers"), "/products", {
                          tone: "on-brand",
                        }),
                      ],
                      {
                        label: L("الأزرار", "Buttons"),
                        style: { gap: 10 },
                      },
                    ),
                  ],
                  {
                    label: L("اللوحة", "Panel"),
                    style: {
                      gap: 18,
                      alignItems: "start",
                      justifyContent: "center",
                      paddingTop: 64,
                      paddingBottom: 64,
                      paddingStart: 56,
                      paddingEnd: 56,
                      maxWidth: "640px",
                      minHeight: 520,
                    },
                    mobile: {
                      paddingTop: 32,
                      paddingBottom: 40,
                      paddingStart: 20,
                      paddingEnd: 20,
                      minHeight: 0,
                    },
                  },
                ),
                t.photo(1, L("صورة الحملة", "Campaign photo"), {
                  role: "image",
                  style: {
                    aspectRatio: "square",
                    objectFit: "cover",
                    radius: 0,
                    width: "100%",
                  },
                  mobile: { order: -1, aspectRatio: "landscape" },
                }),
              ],
              {
                label: L("النصين", "Halves"),
                columns: { desktop: 2, mobile: 1 },
                style: { gap: 0, alignItems: "center", background: "primary", radius: 24, overflow: "hidden" },
              },
            ),
          ],
          { label: L("الحاوية", "Container"), role: "container" },
        ),
      ],
    ),
});
