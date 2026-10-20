/**
 * Sticker offer (Modular set): a shelf panel with a photo on the end side and
 * a round sun "10% off" sticker over its corner; the title, a line and the
 * store's sign-up form on the start side. A cheerful first-order discount. On
 * mobile the photo hides.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { TILE_MOBILE } from "../_modular";

export const newsletterSticker = defineDesign({
  id: "newsletter-sticker",
  version: 1,
  category: "newsletter",
  subcategory: "coupon",
  name: L("ستيكر عرض", "Sticker offer"),
  description: L("لوحة فيها نموذج الاشتراك وصورة عليها ستيكر خصم.", "A panel with the sign-up form and a photo with a discount sticker."),
  keywords: ["newsletter", "discount", "sticker", "playful", "نشرة", "خصم", "ستيكر"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("خد ١٠٪ خصم على أول طلب", "Get 10% off your first order"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("وكمان توصلك العروض قبل أي حد.", "And hear about deals first."), { role: "subtitle" }),
                  t.box([t.storeForm()], {
                    label: L("النموذج", "Form box"),
                    style: {
                      background: "background",
                      radius: 20,
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingStart: 16,
                      paddingEnd: 16,
                    },
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 14 } },
              ),
              t.stack(
                [
                  t.photo(3, L("صورة العرض", "Offer photo"), {
                    role: "image",
                    style: {
                      aspectRatio: "portrait",
                      objectFit: "cover",
                      radius: 20,
                      width: "100%",
                    },
                  }),
                  t.stack(
                    [
                      t.text(L("١٠٪", "10%"), {
                        style: {
                          fontSize: "3xl",
                          fontWeight: "bold",
                          textAlign: "center",
                          color: "foreground",
                        },
                      }),
                      t.text(L("خصم", "off"), {
                        style: {
                          fontWeight: "semibold",
                          textAlign: "center",
                          color: "foreground",
                        },
                      }),
                    ],
                    {
                      label: L("الستيكر", "Sticker"),
                      style: {
                        position: "absolute",
                        insetTop: "-16px",
                        insetEnd: "-16px",
                        background: "accent",
                        radius: 999,
                        width: "112px",
                        minHeight: 112,
                        justifyContent: "center",
                        alignItems: "center",
                        shadow: "md",
                      },
                    },
                  ),
                ],
                {
                  label: L("الصورة", "Photo"),
                  style: {
                    position: "relative",
                    maxWidth: "340px",
                    width: "100%",
                  },
                  mobile: { hidden: true },
                },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                background: "secondary",
                radius: 28,
                gap: 40,
                alignItems: "center",
                paddingTop: 48,
                paddingBottom: 48,
                paddingStart: 56,
                paddingEnd: 56,
              },
              mobile: TILE_MOBILE,
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
