/**
 * Three stories (Modular set): three columns, each a rounded 4:3 photo, a step
 * label, a short title and one line. Explains a process or three values with
 * photos. One column on mobile.
 */
import { defineDesign } from "../builder";
import { L, N } from "../_kit";
import { modHead } from "../_modular";

const STEPS = [
  {
    title: L("بنختار", "We pick"),
    text: L("من موردين معتمدين بس.", "Only from trusted suppliers."),
    photo: 1,
  },
  {
    title: L("بنراجع", "We check"),
    text: L("كل منتج قبل ما يتغلّف.", "Every product before packing."),
    photo: 2,
  },
  {
    title: L("بنوصّل", "We deliver"),
    text: L("لحد باب البيت خلال أيام.", "To your door within days."),
    photo: 3,
  },
];

export const aboutStories = defineDesign({
  id: "about-stories",
  version: 1,
  category: "image-text",
  subcategory: "rows",
  name: L("ثلاث حكايات", "Three stories"),
  description: L("ثلاث صور بعناوين قصيرة تشرح طريقة شغلك.", "Three photos with short titles explaining how you work."),
  keywords: ["image with text", "steps", "process", "values", "صورة ونص", "خطوات"],
  tree: (t) =>
    t.section({ label: L("صورة ونص", "Image with text") }, [
      t.container(
        [
          modHead(t, {
            label: L("إزاي بنشتغل", "How it works"),
            title: L("من المخزن لإيدك", "From our shelf to your hands"),
          }),
          t.grid(
            STEPS.map((s, i) =>
              t.stack(
                [
                  t.photo(s.photo, s.title, {
                    style: {
                      aspectRatio: "landscape",
                      objectFit: "cover",
                      radius: 20,
                      width: "100%",
                    },
                  }),
                  t.row(
                    [
                      t.text(L("خطوة", "Step"), {
                        style: { color: "muted", fontSize: "sm" },
                      }),
                      t.text(N(String(i + 1)), {
                        style: { color: "muted", fontSize: "sm" },
                      }),
                    ],
                    {
                      label: L("الخطوة", "Step"),
                      style: { gap: 4, marginTop: 4 },
                    },
                  ),
                  t.heading(s.title, "h3", { style: { fontSize: "2xl" } }),
                  t.paragraph(s.text),
                ],
                { label: L("حكاية", "Story"), style: { gap: 8 } },
              ),
            ),
            {
              label: L("الحكايات", "Stories"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 24 },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
