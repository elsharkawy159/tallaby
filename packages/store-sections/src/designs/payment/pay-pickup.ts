/**
 * Delivery or pickup (U-f): the two ways to get an order side by side.
 * Delivery shows the time and fee cells with a short address note; pickup
 * lists the branches with their area, distance and ready time. The design's
 * segmented switch shows one at a time, which needs a script, so the still
 * version draws both, each under its own icon heading. Mobile stacks them.
 */
import { defineDesign } from "../builder";
import type { NodeTemplate } from "../../elements/tree";
import type { ElementIconName } from "../../elements/registry";
import type { DesignText, TreeBuilder } from "../builder";
import { L } from "../_kit";
import { EGP, payTitle } from "./_shared";

const BRANCHES = [
  { name: L("فرع الدقي", "Dokki branch"), area: L("٢٤ شارع التحرير · ٢٫١ كم", "24 Tahrir St · 2.1 km") },
  { name: L("فرع مدينة نصر", "Nasr City branch"), area: L("سيتي ستارز، الدور الأول · ٩٫٤ كم", "City Stars, level 1 · 9.4 km") },
  { name: L("فرع المعادي", "Maadi branch"), area: L("شارع ٩ · ١٢٫٨ كم", "Road 9 · 12.8 km") },
];

const PANEL = { gap: 16, alignItems: "stretch", radius: 24, borderWidth: 1, borderColor: "border", paddingTop: 24, paddingBottom: 24, paddingStart: 24, paddingEnd: 24 } as const;
const PANEL_MOBILE = { paddingTop: 18, paddingBottom: 18, paddingStart: 18, paddingEnd: 18 };

function panelHead(t: TreeBuilder, icon: ElementIconName, text: DesignText): NodeTemplate {
  return t.row(
    [
      t.box([t.icon(icon, { style: { fontSize: "lg", color: "foreground" } })], {
        label: L("أيقونة", "Icon"),
        style: { background: "secondary", radius: 999, width: "44px", paddingTop: 11, paddingBottom: 9, textAlign: "center" },
      }),
      t.heading(text, "h3", { style: { fontSize: "xl" } }),
    ],
    { label: L("العنوان", "Heading"), style: { gap: 12, wrap: false, alignItems: "center" } },
  );
}

function cell(t: TreeBuilder, label: DesignText, value: DesignText): NodeTemplate {
  return t.stack(
    [
      t.text(label, { style: { color: "muted", fontSize: "sm" } }),
      t.text(value, { role: "value", style: { fontSize: "3xl", fontWeight: "bold" }, mobile: { fontSize: "2xl" } }),
    ],
    { label: L("خانة", "Cell"), style: { gap: 4, background: "secondary", radius: 16, paddingTop: 20, paddingBottom: 20, paddingStart: 20, paddingEnd: 20 } },
  );
}

export const payPickup = defineDesign({
  id: "pay-pickup",
  version: 1,
  category: "payment",
  subcategory: "delivery",
  name: L("توصيل أو استلام", "Delivery or pickup"),
  description: L("التوصيل بمدته ومصاريفه جنب الاستلام من الفروع.", "Delivery with its time and fee beside pickup from your branches."),
  keywords: ["payment", "delivery", "pickup", "branches", "click and collect", "التوصيل", "استلام", "فروع"],
  tree: (t) =>
    t.section({ label: L("توصيل أو استلام", "Delivery or pickup") }, [
      t.container(
        [
          t.box([payTitle(t, L("استلمها زي ما تحب", "Get it your way"))], { label: L("العنوان", "Heading"), style: { marginBottom: 24 } }),
          t.grid(
            [
              t.stack(
                [
                  panelHead(t, "truck", L("توصيل", "Delivery")),
                  t.grid([cell(t, L("يوصلك خلال", "Arrives in"), L("١–٢ يوم", "1–2 days")), cell(t, L("مصاريف الشحن", "Delivery fee"), EGP("٥٠", "50"))], {
                    label: L("الخانات", "Cells"),
                    columns: { desktop: 2, mobile: 2 },
                    style: { gap: 12 },
                    mobile: { gap: 8 },
                  }),
                  t.paragraph(L("هنأكد العنوان معاك على واتساب قبل الشحن.", "We confirm your address on WhatsApp before shipping."), { style: { fontSize: "sm" } }),
                ],
                { label: L("التوصيل", "Delivery"), style: PANEL, mobile: PANEL_MOBILE },
              ),
              t.stack(
                [
                  panelHead(t, "map-pin", L("استلام من الفرع", "Pickup")),
                  t.stack(
                    BRANCHES.map((b) =>
                      t.row(
                        [
                          t.stack(
                            [t.text(b.name, { style: { fontWeight: "semibold" } }), t.text(b.area, { style: { color: "muted", fontSize: "sm" } })],
                            { label: L("الفرع", "Branch"), style: { gap: 2 } },
                          ),
                          t.badge(L("جاهز خلال ساعتين", "Ready in 2 h"), { style: { background: "accent", color: "foreground", fontWeight: "semibold" }, mobile: { hidden: true } }),
                        ],
                        {
                          label: L("فرع", "Branch row"),
                          style: { justifyContent: "between", alignItems: "center", gap: 12, wrap: false, minHeight: 72, radius: 16, borderWidth: 1, borderColor: "border", paddingStart: 20, paddingEnd: 20, paddingTop: 12, paddingBottom: 12 },
                          mobile: { paddingStart: 14, paddingEnd: 14 },
                        },
                      ),
                    ),
                    { label: L("الفروع", "Branches"), role: "items", style: { gap: 8 } },
                  ),
                ],
                { label: L("الاستلام", "Pickup"), style: PANEL, mobile: PANEL_MOBILE },
              ),
            ],
            { label: L("الطريقتين", "Options"), columns: { desktop: 2, mobile: 1 }, style: { gap: 12, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
