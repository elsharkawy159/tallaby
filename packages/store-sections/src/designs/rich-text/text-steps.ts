/**
 * Numbered steps (Modular set): a heading and a vertical list of steps, each
 * with its number in a sun circle, a short title and a paragraph, joined by a
 * line. How-to content: ordering, returns, installation.
 */
import { defineDesign } from "../builder";
import { L, N } from "../_kit";

const STEPS = [
  {
    title: L("ابعتلنا على واتساب", "Message us on WhatsApp"),
    text: L("خلال ١٤ يوم من الاستلام مع رقم الطلب.", "Within 14 days of delivery, with your order number."),
  },
  {
    title: L("جهّز المنتج", "Pack the product"),
    text: L("في علبته الأصلية بكل الإكسسوارات.", "In its original box with all accessories."),
  },
  {
    title: L("المندوب يستلم", "A courier collects"),
    text: L("خلال يومين شغل من عنوانك.", "From your address within two working days."),
  },
  {
    title: L("فلوسك ترجع", "Get refunded"),
    text: L("بنفس طريقة الدفع خلال ٥ أيام.", "The same way you paid, within 5 days."),
  },
];

export const textSteps = defineDesign({
  id: "text-steps",
  version: 1,
  category: "rich-text",
  subcategory: "policy",
  name: L("خطوات مرقمة", "Numbered steps"),
  description: L("خطوات مرقمة بعنوان وشرح لكل خطوة.", "Numbered steps, each with a title and an explanation."),
  keywords: ["text", "steps", "how to", "returns", "policy", "خطوات", "سياسة", "استرجاع"],
  tree: (t) =>
    t.section({ label: L("الخطوات", "Steps") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("إزاي ترجّع منتج", "How to return a product"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  letterSpacing: "tight",
                  marginBottom: 12,
                },
              }),
              ...STEPS.map((s, i) =>
                t.row(
                  [
                    t.stack(
                      [
                        t.box(
                          [
                            t.text(N(String(i + 1)), {
                              style: {
                                fontWeight: "bold",
                                fontSize: "lg",
                                textAlign: "center",
                                color: "foreground",
                              },
                            }),
                          ],
                          {
                            label: L("الرقم", "Number"),
                            style: {
                              background: "accent",
                              radius: 999,
                              width: "48px",
                              paddingTop: 11,
                              paddingBottom: 11,
                            },
                          },
                        ),
                        ...(i < STEPS.length - 1
                          ? [
                              t.box([], {
                                label: L("الخط", "Connector"),
                                style: {
                                  background: "border",
                                  width: "2px",
                                  minHeight: 40,
                                },
                              }),
                            ]
                          : []),
                      ],
                      {
                        label: L("العلامة", "Marker"),
                        style: { gap: 6, alignItems: "center" },
                      },
                    ),
                    t.stack([t.heading(s.title, "h3", { style: { fontSize: "xl" } }), t.paragraph(s.text, { style: { maxWidth: "60ch" } })], {
                      label: L("النص", "Copy"),
                      style: { gap: 6, paddingTop: 10 },
                    }),
                  ],
                  {
                    label: L("خطوة", "Step"),
                    style: { gap: 20, wrap: false, alignItems: "start" },
                  },
                ),
              ),
            ],
            {
              label: L("المحتوى", "Content"),
              role: "items",
              style: { gap: 6, maxWidth: "760px" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
