/**
 * Side feed (Modular set): a title, a short line with the hashtag and a follow
 * button on the start side; a 3×2 grid of square photos on the end side. For
 * a feed that needs a call to action. On mobile the text sits above the grid.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, dotLabel, pillButton } from "../_modular";

const PROFILE = "https://www.instagram.com/";

export const gallerySide = defineDesign({
  id: "gallery-side",
  version: 1,
  category: "gallery",
  subcategory: "instagram",
  name: L("معرض جانبي", "Side feed"),
  description: L("عنوان وهاشتاج وزر متابعة بجانب شبكة صور ٣×٢.", "A title, hashtag and follow button beside a 3×2 photo grid."),
  keywords: ["gallery", "instagram", "hashtag", "feed", "إنستجرام", "هاشتاج"],
  tree: (t) =>
    t.section({ label: L("إنستجرام", "Instagram") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  dotLabel(t, L("إنستجرام", "Instagram")),
                  t.heading(L("صوّر واعمل منشن", "Snap it and tag us"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("استخدم #اسم_متجرك وممكن صورتك تظهر هنا.", "Use #yourstore and your photo could appear here."), { role: "subtitle" }),
                  pillButton(t, L("تابعنا", "Follow us"), PROFILE, {
                    icon: "instagram",
                  }),
                ],
                {
                  label: L("النص", "Copy"),
                  style: { gap: 16, alignItems: "start" },
                },
              ),
              t.grid(
                [0, 1, 2, 3, 4, 5].map((i) =>
                  t.link(
                    PROFILE,
                    [
                      t.photo(i, L("صورة إنستجرام", "Instagram photo"), {
                        style: {
                          aspectRatio: "square",
                          objectFit: "cover",
                          radius: 16,
                          width: "100%",
                        },
                      }),
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
                  columns: { desktop: 3, mobile: 3 },
                  style: { gap: 10, colSpan: 2 },
                  mobile: { gap: 6, colSpan: 1 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 48, alignItems: "center" },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
