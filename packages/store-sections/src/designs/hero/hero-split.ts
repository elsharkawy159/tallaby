/**
 * Split hero (Claude Design premium set, `heroSplit`): a photo and a tinted
 * text panel side by side in one rounded panel inside the store container,
 * so the photo's detail is never covered by text. On phones the photo comes
 * first as a square, with the panel under it. The heading is the page's `h1`;
 * one solid button and one outline button.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const heroSplit = defineDesign({
  id: "hero-split",
  version: 2,
  category: "hero",
  subcategory: "split",
  name: L("صورة ولوح ملوّن", "Split hero"),
  description: L(
    "صورة ولوح ملوّن جنب بعض، والصورة فوق على الجوال.",
    "A photo and a tinted text panel side by side, photo first on phones.",
  ),
  keywords: ["hero", "split", "half", "photo", "panel", "premium", "واجهة", "مقسوم", "نصين", "صورة ونص"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            [
              t.photo(0, L("صورة الواجهة", "Hero photo"), {
                role: "image",
                style: { aspectRatio: "square", objectFit: "cover", width: "100%", radius: 0 },
                tablet: { aspectRatio: "portrait" },
                mobile: { aspectRatio: "square" },
              }),
              t.stack(
                [
                  t.stack(
                    [
                      t.text(L("المجموعة الجديدة", "New collection"), {
                        role: "eyebrow",
                        style: { color: "primary", fontWeight: "semibold", fontSize: "sm", textTransform: "uppercase", letterSpacing: "wider" },
                      }),
                      t.heading(L("معمول بكميات صغيرة", "Made in small batches"), "h1", {
                        role: "title",
                        style: { fontSize: "display-md", fontWeight: "semibold", lineHeight: "tight" },
                        mobile: { fontSize: "display-sm" },
                      }),
                      t.paragraph(L("قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.", "Carefully chosen pieces, made in small runs so each one stays special."), {
                        role: "subtitle",
                        style: { fontSize: "lg", lineHeight: "relaxed", maxWidth: "480px" },
                        mobile: { fontSize: "md" },
                      }),
                      t.row(
                        [
                          t.button(L("تسوّق المجموعة", "Shop the collection"), "/products", "solid", { role: "cta" }),
                          t.button(L("حكايتنا", "Our story"), "/about", "outline", { role: "cta2" }),
                        ],
                        { label: L("الأزرار", "Buttons"), style: { gap: 10, paddingTop: 8 } },
                      ),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start", maxWidth: "560px" } },
                  ),
                ],
                {
                  label: L("اللوح", "Panel"),
                  style: { background: "secondary", justifyContent: "center", paddingTop: 56, paddingBottom: 56, paddingStart: 64, paddingEnd: 64 },
                  tablet: { paddingStart: 40, paddingEnd: 40 },
                  mobile: { paddingTop: 32, paddingBottom: 40, paddingStart: 16, paddingEnd: 16 },
                },
              ),
            ],
            { label: L("الواجهة", "Split"), columns: { desktop: 2, tablet: 2, mobile: 1 }, style: { gap: 0, alignItems: "stretch", radius: 24, overflow: "hidden" } },
          ),
        ],
        { label: L("الحاوية", "Container"), role: "container" },
      ),
    ]),
});
