/**
 * Classic image and text (library I-a, Classic template About page): two equal
 * columns, a rounded 4:3 photo on one side and an eyebrow, heading, two
 * paragraphs and a button on the other.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const aboutClassic = defineDesign({
  id: "about-classic",
  version: 1,
  category: "image-text",
  subcategory: "story",
  name: L("قصتنا كلاسيك", "Classic story"),
  description: L("صورة بجانب قصة المتجر في فقرتين وزر.", "A photo beside your store's story in two paragraphs and a button."),
  keywords: ["about", "story", "image text", "classic", "قصتنا", "من نحن", "صورة ونص", "كلاسيك"],
  tree: (t) =>
    t.section({ label: L("قصتنا", "Our story") }, [
      t.container(
        [
          t.grid(
            [
              t.person(2, L("صورة المتجر", "Store photo"), {
                role: "image",
                style: { aspectRatio: "landscape", objectFit: "cover", radius: 28 },
                mobile: { radius: 20 },
              }),
              t.stack(
                [
                  t.badge(L("حكايتنا", "Our story"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("بدأنا بسؤال واحد: هل سيدوم؟", "We started with one question: will it last?"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm" },
                  }),
                  t.paragraph(
                    L(
                      "فتحنا متجرنا بعد أن تعبنا من منتجات لا تعيش. كل ما نبيعه نجربه نحن أولًا.",
                      "We opened after too many products stopped working. Everything we sell, we test ourselves first.",
                    ),
                    { role: "body" },
                  ),
                  t.paragraph(
                    L("اليوم نشحن لكل المحافظات ونرد على كل رسالة بأنفسنا.", "Today we ship to every governorate and answer every message ourselves."),
                    { role: "body" },
                  ),
                  t.button(L("تعرّف علينا", "Get to know us"), "/about", "solid", { role: "cta", style: { marginTop: 8 } }),
                ],
                { label: L("النص", "Copy"), style: { gap: 14, alignItems: "start" } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 64, alignItems: "center" }, mobile: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
