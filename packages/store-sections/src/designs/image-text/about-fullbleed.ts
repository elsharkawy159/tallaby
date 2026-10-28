/**
 * Large image with text (docs/section-rules.md §4, §5.1; 2026-10-27): a
 * photo half and a calm text half inside the store container, with an
 * eyebrow, the heading, a short story and one button. On phones the photo
 * comes first, then the text inside the page gutter.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const aboutFullbleed = defineDesign({
  id: "about-fullbleed",
  version: 2,
  category: "image-text",
  subcategory: "story",
  name: L("صورة ونص بعرض الشاشة", "Edge-to-edge split"),
  description: L(
    "صورة كبيرة في نصف، وفي النصف الآخر عنوان وقصة قصيرة وزر.",
    "A large photo on one half, and a heading, a short story and a button on the other.",
  ),
  keywords: ["image with text", "about", "split", "full width", "premium", "صورة ونص", "من نحن", "قصة"],
  tree: (t) =>
    t.section({ label: L("صورة ونص", "Image with text") }, [
      t.container(
        [
          t.grid(
            [
              t.photo(2, L("صورة القصة", "Story photo"), {
                role: "image",
                style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 24 },
                mobile: { aspectRatio: "landscape" },
              }),
              t.stack(
                [
                  t.text(L("حكايتنا", "Our story"), { role: "eyebrow", style: { color: "primary", fontWeight: "semibold" } }),
                  t.heading(L("تفاصيل صغيرة تصنع الفرق", "Small details make the difference"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", lineHeight: "tight" },
                  }),
                  t.paragraph(
                    L(
                      "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.",
                      "We started with a simple idea: things we love to use ourselves, at a quality we can stand behind and a fair price. We choose every piece with care and follow it all the way to you.",
                    ),
                    { role: "body", style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "520px" }, mobile: { fontSize: "md" } },
                  ),
                  t.button(L("اعرف أكثر", "Learn more"), "/about", "solid", { role: "cta" }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 18, alignItems: "start", justifyContent: "center", paddingTop: 32, paddingBottom: 32, paddingStart: 72, paddingEnd: 0 },
                  tablet: { paddingStart: 40, paddingEnd: 0 },
                  mobile: { gap: 14, paddingTop: 28, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 },
                },
              ),
            ],
            { label: L("النصين", "Halves"), columns: { desktop: 2, tablet: 2, mobile: 1 }, style: { gap: 0, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container"), role: "container" },
      ),
    ]),
});
