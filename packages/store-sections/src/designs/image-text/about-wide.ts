/**
 * Wide photo caption (Modular set): a large headline across the top, a wide
 * rounded photo, and a caption row under it with a short paragraph and a
 * button. Text sits above and below the photo, never on it.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { pillButton } from "../_modular";

export const aboutWide = defineDesign({
  id: "about-wide",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("صورة عريضة وتعليق", "Wide photo caption"),
  description: L("عنوان كبير وصورة عريضة وتحتها فقرة وزر.", "A large headline, a wide photo and a caption with a button."),
  keywords: ["image with text", "wide", "story", "editorial", "صورة ونص", "حكاية"],
  tree: (t) =>
    t.section({ label: L("صورة ونص", "Image with text") }, [
      t.container(
        [
          t.heading(L("كل منتج بيتراجع قبل ما يوصلك", "Every product is checked before it reaches you"), "h2", {
            role: "title",
            style: {
              fontSize: "display-md",
              letterSpacing: "tight",
              maxWidth: "20ch",
              marginBottom: 32,
            },
            mobile: { marginBottom: 20 },
          }),
          t.photo(6, L("صورة المتجر", "Store photo"), {
            role: "image",
            style: {
              aspectRatio: "wide",
              objectFit: "cover",
              radius: 24,
              width: "100%",
            },
            mobile: { aspectRatio: "landscape" },
          }),
          t.row(
            [
              t.paragraph(
                L(
                  "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.",
                  "Our team checks every product before packing, so you open the box with confidence.",
                ),
                {
                  role: "body",
                  style: { fontSize: "lg", maxWidth: "52ch" },
                },
              ),
              pillButton(t, L("شوف إزاي بنشتغل", "See how we work"), "/about"),
            ],
            {
              label: L("التعليق", "Caption"),
              style: {
                justifyContent: "between",
                alignItems: "start",
                gap: 24,
                marginTop: 28,
              },
              mobile: { direction: "column", marginTop: 20, gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
