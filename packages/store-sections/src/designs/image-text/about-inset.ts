/**
 * Inset panel (Modular set): a brand-coloured panel with the title, text and
 * button on the start side and a photo set into its end side that rises above
 * the panel's top edge. On mobile the photo sits above the panel, no overlap.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";
import { dotLabel, pillButton } from "../_modular";

export const aboutInset = defineDesign({
  id: "about-inset",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("لوحة بصورة داخلية", "Inset panel"),
  description: L("لوحة بلون المتجر فيها النص، وصورة طالعة من حافتها.", "A brand-coloured panel with text and a photo rising out of its edge."),
  keywords: ["image with text", "panel", "bold", "brand", "صورة ونص", "لوحة"],
  tree: (t) =>
    t.section(
      {
        label: L("صورة ونص", "Image with text"),
        style: { paddingTop: 96 },
        mobile: { paddingTop: 40 },
      },
      [
        t.container(
          [
            t.grid(
              [
                t.stack(
                  [
                    dotLabel(t, L("إزاي بنشتغل", "How we work"), {
                      onBrand: true,
                    }),
                    t.heading(L("كل منتج بيتراجع قبل ما يوصلك", "Every product is checked before it reaches you"), "h2", {
                      role: "title",
                      style: {
                        fontSize: "display-sm",
                        letterSpacing: "tight",
                        ...ON_BRAND,
                      },
                    }),
                    t.paragraph(L("فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.", "Our team checks every product before packing."), {
                      role: "body",
                      style: ON_BRAND_BODY,
                    }),
                    pillButton(t, L("اعرف أكتر", "Learn more"), "/about", {
                      tone: "ink",
                    }),
                  ],
                  {
                    label: L("النص", "Copy"),
                    style: {
                      gap: 16,
                      alignItems: "start",
                      paddingTop: 56,
                      paddingBottom: 56,
                    },
                    mobile: { paddingTop: 0, paddingBottom: 0 },
                  },
                ),
                t.photo(7, L("صورة المتجر", "Store photo"), {
                  role: "image",
                  style: {
                    aspectRatio: "portrait",
                    objectFit: "cover",
                    radius: 20,
                    width: "100%",
                    marginTop: -72,
                    shadow: "lg",
                  },
                  mobile: { order: -1, aspectRatio: "landscape", marginTop: 0 },
                }),
              ],
              {
                label: L("اللوحة", "Panel"),
                columns: { desktop: 2, mobile: 1 },
                style: {
                  background: "primary",
                  radius: 28,
                  gap: 56,
                  alignItems: "start",
                  paddingBottom: 40,
                  paddingStart: 56,
                  paddingEnd: 56,
                },
                mobile: {
                  gap: 20,
                  paddingTop: 20,
                  paddingBottom: 28,
                  paddingStart: 20,
                  paddingEnd: 20,
                },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
