/**
 * Trust band (Claude Design premium set, trustBar; 2026-10-27): four service
 * promises on a tinted band, each a round icon beside a bold title and a short
 * muted line. One row on desktop; on phones a 2×2 block with the icon above
 * centred text.
 */
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

type TrustItem = { icon: ElementIconName; title: DesignText; text: DesignText };

const PROMISES: TrustItem[] = [
  { icon: "truck", title: L("الشحن", "Shipping"), text: L("تظهر تكلفة الشحن ومدته عند إتمام الطلب", "Cost and time shown at checkout") },
  { icon: "credit-card", title: L("الدفع عند الاستلام", "Cash on delivery"), text: L("أو بطرق الدفع المتاحة عند الطلب", "Or other methods shown at checkout") },
  { icon: "rotate", title: L("الاستبدال والاسترجاع", "Exchanges and returns"), text: L("التفاصيل في صفحة السياسات", "Details on the policy page") },
  { icon: "chat", title: L("تواصل معنا", "Contact us"), text: L("لأي سؤال عن طلب أو منتج", "With any question about an order or a product") },
];

function promise(t: TreeBuilder, p: TrustItem): NodeTemplate {
  return t.row(
    [
      t.box([t.icon(p.icon, { style: { fontSize: "xl", color: "primary" } })], {
        label: L("أيقونة", "Icon"),
        style: { width: "44px", paddingTop: 10, paddingBottom: 10, radius: 999, background: "background", textAlign: "center" },
      }),
      t.stack(
        [
          t.text(p.title, { role: "title", style: { fontWeight: "semibold", fontSize: "md" }, mobile: { fontSize: "sm", textAlign: "center" } }),
          t.text(p.text, { style: { fontSize: "sm", color: "muted", lineHeight: "snug" }, mobile: { fontSize: "xs", textAlign: "center" } }),
        ],
        { label: L("النص", "Copy"), style: { gap: 2 }, mobile: { alignItems: "center" } },
      ),
    ],
    {
      label: L("وعد", "Promise"),
      style: { gap: 14, wrap: false, alignItems: "center" },
      mobile: { direction: "column", gap: 8 },
    },
  );
}

export const featuresTrustBand = defineDesign({
  id: "features-trust-band",
  version: 1,
  category: "features",
  subcategory: "benefits-bar",
  name: L("شريط الثقة", "Trust band"),
  description: L(
    "أربع وعود بأيقونات على شريط ملوّن: التوصيل والدفع والاستبدال والمساعدة.",
    "Four promises with icons on a tinted band: delivery, payment, exchange and help.",
  ),
  keywords: ["features", "trust", "benefits", "delivery", "cash on delivery", "premium", "مميزات", "ثقة", "توصيل"],
  tree: (t) =>
    t.section({ label: L("شريط الثقة", "Trust band"), style: { background: "secondary", paddingTop: 32, paddingBottom: 32 }, mobile: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.grid(
            PROMISES.map((p) => promise(t, p)),
            {
              label: L("الوعود", "Promises"),
              role: "items",
              columns: { desktop: 4, tablet: 2, mobile: 2 },
              style: { gap: 24 },
              mobile: { gap: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
