/**
 * Photo checklist (library F-d): a large rounded photo on one side; on the
 * other a heading, a short paragraph and a checklist of promises with tick
 * badges, closed by a button.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const POINTS = [
  L("صور واضحة لكل منتج", "Clear photos of every product"),
  L("مواصفات ومقاسات مفصّلة", "Detailed specs and sizes"),
  L("أسعار واضحة على كل منتج", "Clear prices on every product"),
  L("تواصل معنا لأي سؤال", "Contact us with any question"),
];

export const featuresChecklist = defineDesign({
  id: "features-checklist",
  version: 1,
  category: "features",
  subcategory: "image-features",
  name: L("صورة وقائمة", "Photo checklist"),
  description: L("صورة كبيرة بجانب عنوان وقائمة وعود بعلامات صح وزر.", "A large photo beside a heading, a ticked checklist and a button."),
  keywords: ["features", "how we work", "checklist", "quality", "كيف نعمل", "جودة", "قائمة"],
  tree: (t) =>
    t.section({ label: L("كيف نعمل", "How we work") }, [
      t.container(
        [
          t.grid(
            [
              t.person(5, L("فريق يجهز الطلبات", "Team packing orders"), {
                role: "image",
                style: { aspectRatio: "portrait", objectFit: "cover", radius: 28 },
                mobile: { aspectRatio: "landscape", radius: 20 },
              }),
              t.stack(
                [
                  t.badge(L("كيف نعمل", "How we work"), { role: "eyebrow", style: { color: "primary" } }),
                  t.heading(L("كل التفاصيل قبل أن تطلب", "Every detail before you order"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
                  t.paragraph(
                    L("نعرض صور كل منتج ومواصفاته وسعره بوضوح، لتطلب وأنت مطمئن.", "Every product shows its photos, specs and price clearly, so you can order with confidence."),
                    {
                      role: "body",
                    },
                  ),
                  t.stack(
                    POINTS.map((point) =>
                      t.row(
                        [
                          t.box([t.icon("check", { style: { fontSize: "sm", color: "primaryInk" } })], {
                            label: L("علامة", "Tick"),
                            style: { background: "primary", radius: 999, width: "26px", textAlign: "center", paddingTop: 4, paddingBottom: 2 },
                          }),
                          t.text(point, { style: { fontWeight: "medium", fontSize: "md" } }),
                        ],
                        { label: L("نقطة", "Point"), style: { gap: 12, wrap: false } },
                      ),
                    ),
                    { label: L("القائمة", "Checklist"), role: "items", style: { gap: 14, marginTop: 8, marginBottom: 8 } },
                  ),
                  t.button(L("اعرف أكثر", "Learn more"), "/about", "solid", { role: "cta" }),
                ],
                { label: L("المحتوى", "Content"), style: { gap: 14, alignItems: "start" } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 2, mobile: 1 }, style: { gap: 64, alignItems: "center" }, mobile: { gap: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
