/**
 * Order steps (library F-e): a heading over four numbered steps; each step is
 * a big numbered circle with a title and a short line, the last one filled
 * with the accent. Steps stack on mobile.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";

const STEPS = [
  { no: L("١", "1"), title: L("اختر", "Choose"), text: L("أضف ما يعجبك إلى السلة", "Add what you like to the cart") },
  { no: L("٢", "2"), title: L("اطلب", "Order"), text: L("عنوانك ورقم موبايلك فقط", "Just your address and number") },
  { no: L("٣", "3"), title: L("نؤكد", "Confirm"), text: L("نتواصل معك على واتساب للتأكيد", "We confirm on WhatsApp") },
  { no: L("٤", "4"), title: L("استلم", "Receive"), text: L("وادفع عند الاستلام", "And pay when it arrives") },
];

export const featuresSteps = defineDesign({
  id: "features-steps",
  version: 1,
  category: "features",
  subcategory: "steps",
  name: L("خطوات الطلب", "Order steps"),
  description: L("أربع خطوات مرقمة تشرح طريقة الطلب، والأخيرة بلون مميز.", "Four numbered steps that explain ordering, the last one highlighted."),
  keywords: ["steps", "how to order", "process", "خطوات", "طريقة الطلب"],
  tree: (t) =>
    t.section({ label: L("خطوات الطلب", "Order steps") }, [
      t.container(
        [
          sectionHead(t, { title: L("الطلب في ٤ خطوات", "Order in 4 steps"), align: "center" }),
          t.grid(
            STEPS.map((step, i) => {
              const last = i === STEPS.length - 1;
              return t.stack(
                [
                  t.box(
                    [t.text(step.no, { style: { fontWeight: "extrabold", fontSize: "2xl", textAlign: "center", color: last ? "foreground" : "primary" } })],
                    {
                      label: L("الرقم", "Number"),
                      style: {
                        width: "72px",
                        radius: 999,
                        paddingTop: 18,
                        paddingBottom: 18,
                        background: last ? "accent" : "background",
                        borderWidth: 2,
                        borderColor: last ? "accent" : "primary",
                      },
                    },
                  ),
                  t.heading(step.title, "h3", { style: { fontSize: "lg", textAlign: "center" } }),
                  t.paragraph(step.text, { style: { textAlign: "center", fontSize: "sm" } }),
                ],
                { label: L("خطوة", "Step"), style: { alignItems: "center", gap: 10 } },
              );
            }),
            {
              label: L("الخطوات", "Steps"),
              role: "items",
              columns: { desktop: 4, tablet: 2, mobile: 1 },
              style: { gap: 24, marginTop: 40 },
              mobile: { gap: 28, marginTop: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
