/**
 * Icon cards (library F-c): a centred heading over four cards, each with an
 * icon, a short title and one line.
 *
 * v2 (look-first pilot L7, 2026-11-11): quiet cards. The accent circle that
 * broke out of each card's top edge is gone: the cards are flat tinted tiles
 * with no border, a thin icon on top, a small title and one muted line, under
 * the calm heading of the product sections. Four across on desktop, 2×2 on
 * tablets and phones (v1 stacked them on phones). Same nodes and field names
 * as v1.
 */
import { defineDesign } from "../builder";
import { editorialHead } from "../_editorial";
import { L } from "../_kit";
import { PRODUCTS_SECTION } from "../products/_shared";
import { PROMISES } from "./_shared";

export const featuresIconCards = defineDesign({
  id: "features-icon-cards",
  version: 2,
  category: "features",
  subcategory: "icon-grid",
  name: L("بطاقات بأيقونات", "Icon cards"),
  description: L("عنوان في المنتصف وأربع بطاقات هادية بأيقونة وعنوان وسطر.", "A centred heading over four quiet cards with an icon, a title and a line."),
  keywords: ["features", "icons", "why us", "store features", "مميزات", "أيقونات", "لماذا نحن"],
  tree: (t) =>
    t.section({ label: L("لماذا نحن", "Why us"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          editorialHead(t, {
            eyebrow: L("لماذا تشتري منا", "Why shop with us"),
            title: L("تسوّق وأنت مطمئن", "Shop with peace of mind"),
            align: "center",
          }),
          t.grid(
            PROMISES.map((p) =>
              t.card(
                [
                  t.stack(
                    [
                      t.box([t.icon(p.icon, { style: { fontSize: "2xl", color: "foreground" } })], {
                        label: L("الأيقونة", "Icon"),
                        style: { textAlign: "center", marginBottom: 6 },
                      }),
                      t.heading(p.title, "h3", {
                        style: { fontSize: "md", fontWeight: "semibold", fontFamily: "body", textAlign: "center", lineHeight: "snug" },
                        mobile: { fontSize: "sm" },
                      }),
                      t.paragraph(p.text, {
                        style: { textAlign: "center", fontSize: "sm", lineHeight: "snug" },
                        mobile: { fontSize: "xs" },
                      }),
                    ],
                    { label: L("المحتوى", "Content"), style: { alignItems: "center", gap: 6 } },
                  ),
                ],
                {
                  label: L("بطاقة", "Card"),
                  style: { background: "secondary", borderWidth: 0, shadow: "none", radius: 16, paddingTop: 32, paddingBottom: 32, paddingStart: 20, paddingEnd: 20 },
                  mobile: { paddingTop: 22, paddingBottom: 22, paddingStart: 12, paddingEnd: 12 },
                },
              ),
            ),
            {
              label: L("البطاقات", "Cards"),
              role: "items",
              columns: { desktop: 4, tablet: 2, mobile: 2 },
              style: { gap: 16, marginTop: 40 },
              mobile: { gap: 10, marginTop: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
