/**
 * Open before you pay (U-e): a centred title over a wide shelf panel split
 * into three steps by rules, each with a large step number, a short heading
 * and one line, and a centred reassurance note under the panel. Explains the
 * open-box policy near the cart or on the home page. Mobile turns the steps
 * into rows divided by horizontal rules.
 */
import { defineDesign } from "../builder";
import { L, N } from "../_kit";
import { payTitle } from "./_shared";

const STEPS = [
  { title: L("المندوب يوصل", "The courier arrives"), text: L("بنكلمك قبلها بساعة.", "We call you an hour before.") },
  { title: L("افتح واتأكد", "Open and check"), text: L("جرّب المنتج قدام المندوب.", "Try the product in front of the courier.") },
  { title: L("ادفع وبس", "Then pay"), text: L("كاش أو كارت على الباب.", "Cash or card at the door.") },
];

export const payOpenBox = defineDesign({
  id: "pay-open-box",
  version: 1,
  category: "payment",
  subcategory: "cash",
  name: L("افتح قبل ما تدفع", "Open before you pay"),
  description: L("تلات خطوات بتشرح إن العميل يفتح الطلب قبل ما يدفع.", "Three steps explaining that shoppers open the order before paying."),
  keywords: ["payment", "open box", "cash on delivery", "trust", "الدفع", "افتح قبل ما تدفع", "عند الاستلام"],
  tree: (t) =>
    t.section({ label: L("افتح قبل ما تدفع", "Open before you pay") }, [
      t.container(
        [
          t.box([payTitle(t, L("افتح الطلب قبل ما تدفع", "Open your order before you pay"), true)], {
            label: L("العنوان", "Heading"),
            style: { marginBottom: 32 },
            mobile: { marginBottom: 22 },
          }),
          t.grid(
            STEPS.map((s, i) =>
              t.stack(
                [
                  t.text(N(String(i + 1)), {
                    role: "value",
                    style: { fontSize: "6xl", fontWeight: "bold", lineHeight: "tight", color: "primary", opacity: 40 },
                    mobile: { fontSize: "5xl" },
                  }),
                  t.stack(
                    [t.heading(s.title, "h3", { style: { fontSize: "xl" }, mobile: { fontSize: "lg" } }), t.paragraph(s.text)],
                    { label: L("النص", "Text"), style: { gap: 6 } },
                  ),
                ],
                {
                  label: L("خطوة", "Step"),
                  style: {
                    gap: 12,
                    alignItems: "start",
                    background: "secondary",
                    paddingTop: 36,
                    paddingBottom: 36,
                    paddingStart: 36,
                    paddingEnd: 36,
                  },
                  mobile: { direction: "row", gap: 16, paddingTop: 22, paddingBottom: 22, paddingStart: 22, paddingEnd: 22 },
                },
              ),
            ),
            {
              label: L("الخطوات", "Steps"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 1, background: "border", radius: 24, overflow: "hidden" },
            },
          ),
          t.row(
            [
              t.icon("shield", { style: { fontSize: "lg", color: "muted" } }),
              t.text(L("لو فيه أي مشكلة رجّعه للمندوب ومتدفعش حاجة.", "If anything is wrong, hand it back and pay nothing."), { style: { fontSize: "md" } }),
            ],
            { label: L("الملاحظة", "Note"), style: { gap: 10, justifyContent: "center", marginTop: 20 }, mobile: { justifyContent: "start", wrap: false } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
