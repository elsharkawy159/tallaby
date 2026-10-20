/**
 * Stats with photo (library S-c): a rounded team photo on the start side; on
 * the end side an eyebrow, heading and a 2×2 grid of figures.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FIGURES } from "./_shared";

export const statsPhoto = defineDesign({
  id: "stats-photo",
  version: 1,
  category: "statistics",
  subcategory: "stats-content",
  name: L("أرقام وصورة", "Stats with photo"),
  description: L("صورة الفريق بجانب عنوان وأربعة أرقام.", "A team photo beside a heading and four figures."),
  keywords: ["stats", "numbers", "about", "team", "أرقام", "فريق", "من نحن"],
  tree: (t) =>
    t.section({ label: L("بالأرقام", "In numbers") }, [
      t.container(
        [
          t.grid(
            [
              t.person(0, L("صاحب المتجر", "Store owner"), {
                role: "image",
                style: { aspectRatio: "portrait", objectFit: "cover", radius: 28 },
                mobile: { aspectRatio: "landscape", radius: 20 },
              }),
              t.stack(
                [
                  t.badge(L("بالأرقام", "In numbers"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("من البداية حتى اليوم", "From day one to today"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.grid(
                    FIGURES.map((f) =>
                      t.stack(
                        [
                          t.heading(f.value, "h3", { style: { fontSize: "display-sm", fontWeight: "extrabold", color: "primary" } }),
                          t.text(f.label, { style: { color: "muted" } }),
                        ],
                        { label: L("رقم", "Stat"), style: { gap: 4, paddingTop: 20, paddingBottom: 20 } },
                      ),
                    ),
                    { label: L("الأرقام", "Stats"), role: "items", columns: { desktop: 2, mobile: 2 }, style: { gap: 16, marginTop: 16 } },
                  ),
                ],
                { label: L("المحتوى", "Content"), style: { gap: 12, alignItems: "start" } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 64, alignItems: "center" }, mobile: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
