/**
 * Editorial collage hero (library R-e): a magazine spread. The headline block
 * at the top start, one tall photo, one small offset square and one landscape
 * below the text, each with a numbered caption.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const figure = (t: TreeBuilder, index: number, no: DesignText, caption: DesignText, aspectRatio: "portrait" | "square" | "landscape") =>
  t.stack(
    [
      t.photo(index, caption, { role: "image", style: { aspectRatio, objectFit: "cover", radius: 20 } }),
      t.row([t.text(no, { style: { fontWeight: "bold", color: "primary" } }), t.text(caption, { style: { color: "muted" } })], {
        label: L("التعليق", "Caption"),
        style: { gap: 8 },
      }),
    ],
    { label: L("صورة", "Photo"), style: { gap: 10 } },
  );

export const heroCollage = defineDesign({
  id: "hero-collage",
  version: 1,
  category: "hero",
  subcategory: "editorial",
  name: L("كولاج", "Editorial collage"),
  description: L("عنوان وحكاية قصيرة مع ثلاث صور بتعليقات مرقمة.", "A headline and short story with three captioned photos."),
  keywords: ["hero", "collage", "lookbook", "كولاج", "لوك"],
  tree: (t) =>
    t.section({ label: L("كولاج", "Collage") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.badge(L("حكاية الموسم", "The season story"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("٣ قطع تكفي أسبوعًا كاملًا", "Three pieces, one full week"), "h1", {
                    role: "title",
                    style: { fontSize: "display-md", fontWeight: "extrabold", lineHeight: "tight" },
                  }),
                  t.paragraph(
                    L(
                      "نسّقها معًا أو مع ما تملكه بالفعل، وكل قطعة متاحة بأكثر من لون.",
                      "Wear them together or with what you own; each piece comes in several colours.",
                    ),
                    {
                      role: "body",
                    },
                  ),
                  t.button(L("تسوّق اللوك", "Shop the look"), "/products", "solid", { role: "cta" }),
                  t.stack([figure(t, 2, L("٠٣", "03"), L("القطعة الثالثة", "The third piece"), "landscape")], {
                    label: L("الصورة العريضة", "Landscape photo"),
                    style: { marginTop: 24 },
                    mobile: { marginTop: 8 },
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start" } },
              ),
              figure(t, 0, L("٠١", "01"), L("القطعة الأولى", "The first piece"), "portrait"),
              t.stack([figure(t, 1, L("٠٢", "02"), L("القطعة الثانية", "The second piece"), "square")], {
                label: L("الصورة الصغيرة", "Small photo"),
                style: { marginTop: 120 },
                mobile: { marginTop: 0 },
              }),
            ],
            { label: L("الكولاج", "Collage"), columns: { desktop: 3, mobile: 1 }, style: { gap: 32, alignItems: "start" }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
