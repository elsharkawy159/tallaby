/**
 * Shop the video (Modular set): a wide player and, under it, a row of the
 * store's products as compact cards with price and cart button, so a demo or
 * styling video turns straight into sales. With no products the row draws
 * nothing and the video stays.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";
import { priceRow, productName, productPhoto } from "../products/_shared";

export const videoShop = defineDesign({
  id: "video-shop",
  version: 1,
  category: "video",
  subcategory: "wide",
  name: L("تسوق من الفيديو", "Shop the video"),
  description: L("فيديو عريض وتحته المنتجات اللي ظهرت فيه.", "A wide video with the products it shows underneath."),
  keywords: ["video", "shop the look", "products", "shoppable", "فيديو", "تسوق", "منتجات"],
  tree: (t) =>
    t.section({ label: L("تسوق من الفيديو", "Shop the video") }, [
      t.container(
        [
          modHead(t, {
            label: L("تسوق من الفيديو", "Shop the video"),
            title: L("كل اللي في الفيديو", "Everything in the video"),
          }),
          t.video(1, L("فيديو المنتجات", "Product video"), {
            label: L("المشغل", "Player"),
            role: "video",
            style: { aspectRatio: "wide", radius: 24, width: "100%" },
          }),
          t.productList(
            [
              t.row(
                [
                  t.stack([productPhoto(t, { radius: 12, chip: false })], {
                    label: L("الصورة", "Photo"),
                    style: { width: "64px" },
                  }),
                  t.stack([productName(t, { fontSize: "sm" }), priceRow(t, { gap: 6 })], {
                    label: L("المعلومات", "Details"),
                    style: { gap: 4, width: "60%" },
                  }),
                ],
                {
                  label: L("منتج", "Product"),
                  style: {
                    background: "secondary",
                    radius: 18,
                    gap: 12,
                    wrap: false,
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingStart: 10,
                    paddingEnd: 14,
                  },
                },
              ),
            ],
            {
              label: L("المنتجات", "Products"),
              role: "items",
              source: "featured",
              limit: 4,
              optional: true,
              columns: { desktop: 4, tablet: 2, mobile: 1 },
              style: { gap: 12, marginTop: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
