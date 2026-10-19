/**
 * Split hero: a big headline, two buttons and trust badges beside an image on
 * a soft frame. The frame is its own node, so it can be restyled or removed.
 */
import { defineDesign } from "../builder";

const L = (ar: string, en: string) => ({ ar, en });

const BADGES = [L("توصيل لكل المحافظات", "Delivery to every governorate"), L("الدفع عند الاستلام", "Cash on delivery"), L("استبدال خلال ١٤ يومًا", "14-day exchange")];

export const heroSplit = defineDesign({
  id: "hero-split",
  version: 1,
  category: "hero",
  subcategory: "split",
  name: L("واجهة مقسومة", "Split hero"),
  description: L("عنوان كبير وزران وشارات ثقة بجانب صورة.", "A big headline, two buttons and trust badges beside an image."),
  keywords: ["hero", "banner", "بانر", "واجهة"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { overflow: "clip" } }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.stack(
                    [
                      t.badge(L("تشكيلة الموسم الجديد", "New season collection"), { role: "eyebrow", style: { color: "primary" } }),
                      t.heading(L("منتجات تحبها، بجودة تثق بها", "Products you love, quality you trust"), "h1", {
                        role: "title",
                        style: { fontSize: "display-lg", fontWeight: "extrabold", lineHeight: "tight" },
                      }),
                      t.paragraph(
                        L("اختيارات مدروسة بعناية وأسعار واضحة، وتوصيل سريع لكل المحافظات.", "Carefully chosen products, clear prices and fast delivery everywhere."),
                        { role: "subtitle", style: { fontSize: "lg", maxWidth: "560px" } },
                      ),
                    ],
                    { label: L("النص", "Copy"), style: { gap: 16 } },
                  ),
                  t.row(
                    [
                      t.button(L("تسوّق الآن", "Shop now"), "/#products", "solid", { role: "cta" }),
                      t.button(L("تعرّف علينا", "About us"), "/#about", "outline", { role: "secondaryCta" }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 12 } },
                  ),
                  t.row(
                    BADGES.map((text) =>
                      t.row([t.icon("check", { style: { color: "primary", fontSize: "md" } }), t.text(text, { style: { color: "muted" } })], {
                        label: L("شارة ثقة", "Trust badge"),
                        style: { gap: 6 },
                      }),
                    ),
                    { label: L("شارات الثقة", "Trust badges"), role: "items", style: { gap: 20, paddingTop: 8 }, mobile: { gap: 12 } },
                  ),
                ],
                { label: L("المحتوى", "Content"), style: { gap: 24 } },
              ),
              t.box(
                [
                  t.image("", L("صورة الواجهة", "Hero image"), {
                    role: "image",
                    style: { aspectRatio: "portrait", radius: 20, objectFit: "cover" },
                  }),
                ],
                {
                  label: L("الصورة", "Image"),
                  // The soft frame is the box itself, so it keeps its size (and still looks designed) before a photo is added.
                  style: { background: "secondary", radius: 32, paddingTop: 16, paddingBottom: 16, paddingStart: 16, paddingEnd: 16, minHeight: 440 },
                  mobile: { minHeight: 300, marginTop: 16 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 64, alignItems: "center", minHeight: 440 },
              mobile: { gap: 32, minHeight: 0 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
