/**
 * Circle frame (Modular set): a round photo inside a thick sun ring, beside a
 * label, title, paragraph and button. A friendly founder note or team intro.
 * On mobile the circle is centred above the text.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { dotLabel, pillButton } from "../_modular";

export const aboutCircle = defineDesign({
  id: "about-circle",
  version: 1,
  category: "image-text",
  subcategory: "values",
  name: L("إطار دائري", "Circle frame"),
  description: L("صورة دائرية بإطار ملوّن بجانب نبذة عنكم.", "A round photo in a bright ring beside a short note about you."),
  keywords: ["image with text", "founder", "team", "circle", "playful", "صورة ونص", "فريق", "مؤسس"],
  tree: (t) =>
    t.section({ label: L("صورة ونص", "Image with text") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.person(0, L("صورة الفريق", "Team photo"), {
                    role: "image",
                    style: {
                      aspectRatio: "square",
                      objectFit: "cover",
                      radius: 999,
                      width: "100%",
                      maxWidth: "380px",
                      borderWidth: 14,
                      borderColor: "accent",
                    },
                    mobile: { maxWidth: "260px" },
                  }),
                ],
                {
                  label: L("الإطار", "Frame"),
                  style: { alignItems: "center" },
                },
              ),
              t.stack(
                [
                  dotLabel(t, L("إحنا مين", "Who we are")),
                  t.heading(L("فريق صغير بيحب اللي بيعمله", "A small team that loves what it does"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.paragraph(
                    L(
                      "بنرد على كل رسالة بنفسنا، وبنختار كل منتج كأننا هنستخدمه.",
                      "We answer every message ourselves and pick every product as if it were for us.",
                    ),
                    {
                      role: "body",
                      style: { fontSize: "lg" },
                    },
                  ),
                  pillButton(t, L("قابل الفريق", "Meet the team"), "/about", {
                    tone: "outline",
                  }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 16, alignItems: "start" },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
