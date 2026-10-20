/**
 * Comparison (Modular set): a comparison table: what the store offers down the
 * start side, the store's column in a tinted band with ticks, and "other
 * shops" with muted dashes. Answers "why not buy elsewhere?".
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";
import { modHead } from "../_modular";

const ROWS = [
  {
    text: L("منتجات أصلية بفاتورة", "Genuine, with an invoice"),
    others: false,
  },
  { text: L("ضمان محلي", "Local warranty"), others: true },
  { text: L("استرجاع خلال ١٤ يوم", "14-day returns"), others: false },
  { text: L("الدفع عند الاستلام", "Cash on delivery"), others: true },
  {
    text: L("رد على واتساب في دقايق", "WhatsApp reply in minutes"),
    others: false,
  },
];

/** One table cell of the two value columns. */
function cell(t: TreeBuilder, content: NodeTemplate, us: boolean): NodeTemplate {
  return t.stack([content], {
    label: us ? L("إحنا", "Us") : L("غيرنا", "Others"),
    style: {
      width: "96px",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 16,
      paddingBottom: 16,
      ...(us && { background: "secondary" }),
    },
    mobile: { width: "72px" },
  });
}

const tick = (t: TreeBuilder) => t.icon("check", { style: { fontSize: "lg", color: "primary" } });
const dash = (t: TreeBuilder) =>
  t.box([], {
    label: L("لا", "No"),
    style: { background: "border", radius: 999, width: "14px", minHeight: 3 },
  });

function tableRow(t: TreeBuilder, label: NodeTemplate, us: NodeTemplate, others: NodeTemplate, name: DesignText): NodeTemplate {
  return t.row(
    [
      label,
      t.row([cell(t, us, true), cell(t, others, false)], {
        label: L("القيم", "Values"),
        style: { gap: 0, wrap: false, alignItems: "stretch" },
      }),
    ],
    {
      label: name,
      style: {
        background: "background",
        justifyContent: "between",
        gap: 16,
        wrap: false,
        alignItems: "stretch",
        paddingStart: 22,
      },
      mobile: { paddingStart: 14, gap: 10 },
    },
  );
}

export const featuresCompare = defineDesign({
  id: "features-compare",
  version: 1,
  category: "features",
  subcategory: "icon-grid",
  name: L("مقارنة", "Comparison"),
  description: L("جدول يقارن اللي بتقدمه باللي بيقدمه غيرك.", "A table comparing what you offer with what others do."),
  keywords: ["features", "comparison", "table", "us vs them", "مقارنة", "جدول"],
  tree: (t) =>
    t.section({ label: L("المقارنة", "Comparison") }, [
      t.container(
        [
          modHead(t, {
            label: L("قارن", "Compare"),
            title: L("إحنا ولا غيرنا؟", "Us or them?"),
          }),
          t.stack(
            [
              tableRow(
                t,
                t.box([], { label: L("فراغ", "Blank") }),
                t.text(L("متجرنا", "Our store"), {
                  role: "us",
                  style: {
                    fontWeight: "bold",
                    fontSize: "sm",
                    color: "primary",
                    textAlign: "center",
                  },
                }),
                t.text(L("غيرنا", "Others"), {
                  style: {
                    fontWeight: "bold",
                    fontSize: "sm",
                    color: "muted",
                    textAlign: "center",
                  },
                }),
                L("رأس الجدول", "Table head"),
              ),
              ...ROWS.map((r) =>
                tableRow(
                  t,
                  t.text(r.text, {
                    style: {
                      fontWeight: "medium",
                      paddingTop: 16,
                      paddingBottom: 16,
                    },
                  }),
                  tick(t),
                  r.others ? tick(t) : dash(t),
                  L("سطر", "Row"),
                ),
              ),
            ],
            {
              label: L("الجدول", "Table"),
              role: "items",
              style: {
                gap: 1,
                background: "border",
                maxWidth: "760px",
                borderWidth: 1,
                borderColor: "border",
                radius: 20,
                overflow: "hidden",
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
