/**
 * Overlap card (library I-c): one wide photo across the content width with a
 * white text card overlapping its bottom-end corner. On mobile the card drops
 * under the photo and overlaps it a little.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const aboutOverlap = defineDesign({
  id: "about-overlap",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("صورة بكارت", "Overlap card"),
  description: L("صورة عريضة عليها بطاقة نص في الركن.", "A wide photo with a text card overlapping its corner."),
  keywords: ["about", "story", "photo", "workshop", "قصتنا", "صورة", "من نحن"],
  tree: (t) =>
    t.section({ label: L("من داخل المتجر", "Inside the store") }, [
      t.container(
        [
          t.box(
            [
              t.person(4, L("صورة المتجر", "Store photo"), {
                role: "image",
                style: { aspectRatio: "wide", objectFit: "cover", radius: 32 },
                mobile: { aspectRatio: "landscape", radius: 20 },
              }),
              t.card(
                [
                  t.stack(
                    [
                      t.badge(L("من داخل المتجر", "Inside the store"), { role: "eyebrow", style: { color: "primary" } }),
                      t.heading(L("بدأنا من محل صغير", "We started in a small shop"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                      t.paragraph(
                        L(
                          "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.",
                          "We pick every product with care, pack it by hand and know our customers by name.",
                        ),
                        {
                          role: "body",
                        },
                      ),
                      t.button(L("اعرف أكثر", "Learn more"), "/about", "solid", { role: "cta" }),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 12, alignItems: "start" } },
                  ),
                ],
                {
                  label: L("البطاقة", "Card"),
                  style: {
                    position: "absolute",
                    insetBottom: "-48px",
                    insetEnd: "40px",
                    maxWidth: "440px",
                    radius: 24,
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 32,
                    paddingEnd: 32,
                    shadow: "md",
                    borderWidth: 0,
                  },
                  mobile: {
                    position: "relative",
                    insetBottom: "auto",
                    insetEnd: "auto",
                    marginTop: -40,
                    marginStart: 12,
                    marginEnd: 12,
                    paddingTop: 20,
                    paddingBottom: 20,
                    paddingStart: 20,
                    paddingEnd: 20,
                  },
                },
              ),
            ],
            {
              label: L("الصورة والبطاقة", "Photo and card"),
              style: { position: "relative", marginBottom: 48, minHeight: 360 },
              mobile: { marginBottom: 0, minHeight: 0 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
