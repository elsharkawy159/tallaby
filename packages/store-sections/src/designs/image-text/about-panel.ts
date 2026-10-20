/**
 * Story panel (library I-b): a deep brand rounded panel with the heading on
 * the start side and two paragraphs on the end side, closed by an accent pull
 * quote. Text only, so photo quality never matters.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";

export const aboutPanel = defineDesign({
  id: "about-panel",
  version: 1,
  category: "image-text",
  subcategory: "values",
  name: L("لوحة الرسالة", "Mission panel"),
  description: L("لوحة داكنة بعنوان وفقرتين وجملة مميزة، بدون صور.", "A deep panel with a heading, two paragraphs and a pull quote; no photo needed."),
  keywords: ["about", "mission", "founder", "رسالتنا", "المؤسس", "من نحن"],
  tree: (t) =>
    t.section({ label: L("رسالتنا", "Our mission") }, [
      t.container(
        [
          t.grid(
            [
              t.heading(L("لماذا بدأنا", "Why we started"), "h2", { role: "title", style: { ...ON_BRAND, fontSize: "display-md", fontWeight: "extrabold" } }),
              t.stack(
                [
                  t.paragraph(
                    L(
                      "كنا نجرب كل منتج بأنفسنا قبل أن نبيعه، وما زلنا نفعل ذلك مع كل ما يدخل المتجر.",
                      "We tested every product ourselves before selling it, and we still do with everything that enters the store.",
                    ),
                    { role: "body", style: { ...ON_BRAND_BODY, fontSize: "lg" } },
                  ),
                  t.paragraph(
                    L(
                      "اليوم يعود إلينا آلاف العملاء، وهذا أكبر دليل على أن الطريقة صحيحة.",
                      "Today thousands of customers come back to us, which tells us the approach works.",
                    ),
                    { role: "body", style: { ...ON_BRAND_BODY, fontSize: "lg" } },
                  ),
                  t.quote(L("«إن لم نستخدمه نحن، لن نبيعه.»", "“If we would not use it, we will not sell it.”"), {
                    role: "quote",
                    style: { color: "accent", fontSize: "xl", fontWeight: "semibold", borderColor: "accent", marginTop: 8 },
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 16 } },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48, background: "primary", color: "primaryInk", radius: 32, paddingTop: 56, paddingBottom: 56, paddingStart: 56, paddingEnd: 56 },
              mobile: { gap: 20, paddingTop: 32, paddingBottom: 32, paddingStart: 24, paddingEnd: 24, radius: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
