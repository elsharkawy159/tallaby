/**
 * Split story (Claude Design premium set, imageWithText; 2026-10-27): a tall
 * photo and the text side by side inside the page width, with an eyebrow,
 * the heading, two short paragraphs and one button. The brand story, a
 * material or how the product is made. On phones the photo comes first.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const aboutSplitStory = defineDesign({
  id: "about-split-story",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("قصة بصورة جانبية", "Split story"),
  description: L(
    "صورة طولية وجنبها عنوان وفقرتين قصيرتين وزر، لحكاية المتجر أو طريقة الشغل.",
    "A tall photo beside a heading, two short paragraphs and a button, for the store's story or how things are made.",
  ),
  keywords: ["image with text", "about", "story", "split", "premium", "صورة ونص", "من نحن", "قصة"],
  tree: (t) =>
    t.section({ label: L("صورة ونص", "Image with text") }, [
      t.container(
        [
          t.grid(
            [
              t.photo(2, L("صورة القصة", "Story photo"), {
                role: "image",
                style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", radius: 16 },
              }),
              t.stack(
                [
                  t.text(L("من ورشتنا", "From our workshop"), {
                    role: "eyebrow",
                    style: { fontSize: "sm", fontWeight: "semibold", color: "primary" },
                  }),
                  t.heading(L("متصمم عشانك ومعمول في القاهرة", "Designed for you, made in Cairo"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", lineHeight: "tight" },
                  }),
                  t.stack(
                    [
                      t.paragraph(
                        L(
                          "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.",
                          "We make small runs so every piece stays special and nothing goes to waste.",
                        ),
                        { role: "body", style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "520px" }, mobile: { fontSize: "md" } },
                      ),
                      t.paragraph(
                        L("كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.", "Each one is cut and sewn by our team in Maadi."),
                        { role: "body", style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "520px" }, mobile: { fontSize: "md" } },
                      ),
                    ],
                    { label: L("الفقرات", "Paragraphs"), style: { gap: 12 } },
                  ),
                  t.button(L("حكايتنا", "Our story"), "/about", "solid", { role: "cta" }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 16, alignItems: "start", justifyContent: "center" },
                  mobile: { gap: 14 },
                },
              ),
            ],
            {
              label: L("النصين", "Halves"),
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { gap: 72, alignItems: "center" },
              tablet: { gap: 40 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
