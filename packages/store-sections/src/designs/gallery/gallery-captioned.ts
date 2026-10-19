/**
 * Captioned grid (Modular set): three columns of 4:5-ish photos, each with a
 * short caption and a muted line under it, with generous gaps. A lookbook or
 * "how customers use it" page. Two across on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, modHead } from "../_modular";

const LOOKS = [
  { title: L("إطلالة الشغل", "Office look"), line: L("٣ منتجات", "3 items") },
  { title: L("المشوار", "Errands"), line: L("٤ منتجات", "4 items") },
  { title: L("الويكند", "Weekend"), line: L("٢ منتج", "2 items") },
  { title: L("السفر", "Travel"), line: L("٥ منتجات", "5 items") },
  { title: L("الجيم", "Gym"), line: L("٣ منتجات", "3 items") },
  { title: L("السهرة", "Evening"), line: L("٤ منتجات", "4 items") },
];

export const galleryCaptioned = defineDesign({
  id: "gallery-captioned",
  version: 1,
  category: "gallery",
  subcategory: "lookbook",
  name: L("شبكة بتعليقات", "Captioned grid"),
  description: L("صور في ثلاث أعمدة، تحت كل صورة عنوان قصير.", "Photos in three columns, each with a short caption."),
  keywords: ["gallery", "lookbook", "captions", "minimal", "معرض", "لوك بوك", "صور"],
  tree: (t) =>
    t.section({ label: L("المعرض", "Gallery") }, [
      t.container(
        [
          modHead(t, {
            label: L("لوك بوك", "Lookbook"),
            title: L("كل يوم بشكل", "A look for every day"),
          }),
          t.grid(
            LOOKS.map((look, i) =>
              t.link(
                "/products",
                [
                  t.stack(
                    [
                      t.photo(i, look.title, {
                        style: {
                          aspectRatio: "portrait",
                          objectFit: "cover",
                          radius: 20,
                          width: "100%",
                        },
                      }),
                      t.text(look.title, {
                        style: {
                          fontWeight: "semibold",
                          fontSize: "lg",
                          marginTop: 6,
                        },
                      }),
                      t.text(look.line, {
                        style: { color: "muted", fontSize: "sm" },
                      }),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 4 } },
                  ),
                ],
                {
                  label: L("صورة", "Photo"),
                  style: { ...FLUSH, hover: { opacity: 90 } },
                },
              ),
            ),
            {
              label: L("الصور", "Photos"),
              role: "items",
              columns: { desktop: 3, mobile: 2 },
              style: { gap: 28 },
              mobile: { gap: 14 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
