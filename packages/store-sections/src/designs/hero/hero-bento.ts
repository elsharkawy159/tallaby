/**
 * Bento hero (Modular set): a bento of tiles: a large shelf tile with the
 * label, headline, text and button; a tall photo; one of the store's products
 * with its price; and a brand tile with the store rating. On mobile the tiles
 * stack: message, photo, then product and rating side by side.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY, stars } from "../_kit";
import { BIG_NUMBER, BRAND_TILE, TILE, TILE_MOBILE, dotLabel, pillButton } from "../_modular";
import { priceRow, productName, productPhoto } from "../products/_shared";

export const heroBento = defineDesign({
  id: "hero-bento",
  version: 1,
  category: "hero",
  subcategory: "editorial",
  name: L("بينتو", "Bento hero"),
  description: L("مربعات: رسالة وصورة ومنتج وتقييم المتجر في نظرة واحدة.", "Tiles with a message, a photo, a product and your rating at a glance."),
  keywords: ["hero", "bento", "tiles", "product", "rating", "واجهة", "بينتو", "مربعات"],
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
                    dotLabel(t, L("وصل جديد", "Just in")),
                    t.heading(L("صوت أنقى، كل يوم", "Cleaner sound, every day"), "h1", {
                      role: "title",
                      style: {
                        fontSize: "display-lg",
                        letterSpacing: "tight",
                        lineHeight: "tight",
                        maxWidth: "12ch",
                      },
                    }),
                    t.paragraph(L("منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.", "Genuine products with local warranty, delivered in 48 hours."), {
                      role: "subtitle",
                      style: { fontSize: "lg", maxWidth: "40ch" },
                    }),
                    pillButton(t, L("تسوق الآن", "Shop now"), "/products"),
                  ],
                  {
                    label: L("الرسالة", "Message"),
                    style: {
                      ...TILE,
                      colSpan: 2,
                      gap: 16,
                      alignItems: "start",
                      justifyContent: "end",
                      paddingTop: 48,
                      paddingBottom: 48,
                      paddingStart: 48,
                      paddingEnd: 48,
                    },
                    mobile: { ...TILE_MOBILE, paddingTop: 28 },
                  },
                ),
                t.photo(0, L("صورة الحملة", "Campaign photo"), {
                  role: "image",
                  style: {
                    aspectRatio: "portrait",
                    objectFit: "cover",
                    radius: 24,
                    width: "100%",
                  },
                  mobile: { colSpan: 2, aspectRatio: "landscape" },
                }),
                t.grid(
                  [
                    t.productList(
                      [
                        t.stack(
                          [
                            productPhoto(t, {
                              ratio: "landscape",
                              radius: 14,
                              chip: false,
                            }),
                            productName(t, { fontSize: "sm" }),
                            priceRow(t),
                          ],
                          {
                            label: L("المنتج", "Product"),
                            style: { gap: 8 },
                          },
                        ),
                      ],
                      {
                        label: L("المنتج المميز", "Featured product"),
                        role: "product",
                        source: "featured",
                        limit: 1,
                        optional: true,
                        columns: { desktop: 1 },
                        style: {
                          ...TILE,
                          paddingTop: 18,
                          paddingBottom: 18,
                          paddingStart: 18,
                          paddingEnd: 18,
                          gap: 0,
                        },
                        mobile: {
                          paddingTop: 14,
                          paddingBottom: 14,
                          paddingStart: 14,
                          paddingEnd: 14,
                        },
                      },
                    ),
                    t.stack(
                      [
                        t.text(L("٤٫٨", "4.8"), {
                          style: {
                            ...BIG_NUMBER,
                            fontSize: "6xl",
                            ...ON_BRAND,
                          },
                          mobile: { fontSize: "5xl" },
                        }),
                        stars(t),
                        t.text(L("من ١٢ ألف تقييم", "from 12K reviews"), {
                          style: { fontSize: "sm", ...ON_BRAND_BODY },
                        }),
                      ],
                      {
                        label: L("التقييم", "Rating"),
                        role: "rating",
                        style: { ...BRAND_TILE, gap: 8, justifyContent: "end" },
                        mobile: TILE_MOBILE,
                      },
                    ),
                  ],
                  {
                    label: L("العمود الجانبي", "Side column"),
                    columns: { desktop: 1, mobile: 2 },
                    style: { gap: 12 },
                    mobile: { colSpan: 2 },
                  },
                ),
              ],
              {
                label: L("المربعات", "Tiles"),
                columns: { desktop: 4, mobile: 2 },
                style: { gap: 12 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
