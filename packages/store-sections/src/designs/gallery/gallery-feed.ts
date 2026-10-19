/**
 * Feed grid (library G-a): a heading with the handle and a follow button,
 * then a tight grid of square photos, 4 across (2 on mobile), each linking
 * to the account.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const PROFILE = "https://www.instagram.com/";

export const galleryFeed = defineDesign({
  id: "gallery-feed",
  version: 1,
  category: "gallery",
  subcategory: "instagram",
  name: L("شبكة إنستجرام", "Instagram grid"),
  description: L("عنوان وحساب وزر متابعة فوق شبكة صور مربعة.", "A heading, your handle and a follow button over a square photo grid."),
  keywords: ["instagram", "gallery", "feed", "social", "إنستجرام", "معرض", "صور"],
  tree: (t) =>
    t.section({ label: L("إنستجرام", "Instagram") }, [
      t.container(
        [
          t.row(
            [
              t.stack(
                [
                  t.heading(L("تابعنا على إنستجرام", "Follow us on Instagram"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.text(L("@اسم_متجرك", "@yourstore"), { style: { color: "muted", fontSize: "md" } }),
                ],
                { label: L("العنوان", "Heading"), style: { gap: 6 } },
              ),
              t.link(
                PROFILE,
                [
                  t.row([t.icon("instagram", { style: { fontSize: "lg" } }), t.text(L("تابعنا", "Follow"), { style: { fontWeight: "semibold" } })], {
                    label: L("المحتوى", "Content"),
                    style: { gap: 8 },
                  }),
                ],
                {
                  label: L("زر المتابعة", "Follow button"),
                  style: {
                    borderWidth: 1,
                    borderColor: "border",
                    radius: 999,
                    paddingStart: 20,
                    paddingEnd: 20,
                    paddingTop: 10,
                    paddingBottom: 10,
                    hover: { borderColor: "primary" },
                  },
                },
              ),
            ],
            { label: L("رأس القسم", "Section head"), style: { justifyContent: "between", alignItems: "end", gap: 16, marginBottom: 28 } },
          ),
          t.grid(
            Array.from({ length: 8 }, (_, i) =>
              t.link(PROFILE, [t.photo(i, L("صورة من إنستجرام", "Instagram photo"), { style: { aspectRatio: "square", objectFit: "cover", radius: 12 } })], {
                label: L("صورة", "Photo"),
                style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 85 } },
              }),
            ),
            { label: L("الصور", "Photos"), role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 8 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
