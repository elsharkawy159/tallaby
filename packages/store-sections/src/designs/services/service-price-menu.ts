/**
 * Price menu (Services W-e): a service price list set like a menu. A heading
 * row over a heavy rule, then groups in two columns, each with a small muted
 * heading and ruled rows running the service name into its price. The
 * design's dotted leaders become hairline rules (no dotted border style).
 * One column on mobile. Prices are typed text.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const GROUPS = [
  {
    title: L("الموبايل", "Phones"),
    rows: [
      [L("تغيير بطارية", "Battery replacement"), L("٦٥٠ ج.م", "EGP 650")],
      [L("تغيير شاشة", "Screen replacement"), L("٢٤٠٠ ج.م", "EGP 2,400")],
      [L("سوكت الشحن", "Charging port"), L("٤٥٠ ج.م", "EGP 450")],
    ],
  },
  {
    title: L("الشاشات والبيت", "TV & home"),
    rows: [
      [L("تركيب حائط", "Wall mounting"), L("٣٥٠ ج.م", "EGP 350")],
      [L("ضبط رسيفر", "Box setup"), L("١٥٠ ج.م", "EGP 150")],
    ],
  },
  {
    title: L("السماعات", "Audio"),
    rows: [
      [L("تغيير وسايد", "Ear cushions"), L("١٢٠ ج.م", "EGP 120")],
      [L("تنظيف وفحص", "Clean and check"), L("٨٠ ج.م", "EGP 80")],
    ],
  },
];

export const servicePriceMenu = defineDesign({
  id: "service-price-menu",
  version: 1,
  category: "services",
  subcategory: "list",
  name: L("قايمة الأسعار", "Price menu"),
  description: L(
    "أسعار الخدمات زي المنيو: مجموعات وسطور بالاسم والسعر.",
    "Service prices set like a menu: groups of rows with name and price.",
  ),
  keywords: [
    "services",
    "prices",
    "price list",
    "menu",
    "أسعار",
    "قايمة",
    "خدمات",
  ],
  tree: (t) =>
    t.section({ label: L("قايمة الأسعار", "Price menu") }, [
      t.container(
        [
          t.row(
            [
              t.heading(L("أسعار الخدمات", "Service prices"), "h2", {
                role: "title",
                style: { fontSize: "5xl", letterSpacing: "tight" },
                mobile: { fontSize: "3xl" },
              }),
              t.paragraph(
                L(
                  "الأسعار شاملة قطع الغيار الأصلية والضمان.",
                  "Prices include genuine parts and warranty.",
                ),
                { role: "subtitle", style: { maxWidth: "36ch" } },
              ),
            ],
            {
              label: L("العنوان", "Heading"),
              role: "intro",
              style: {
                justifyContent: "between",
                alignItems: "end",
                gap: 12,
                paddingBottom: 24,
              },
            },
          ),
          t.box([], {
            label: L("الخط", "Rule"),
            style: { background: "foreground", minHeight: 2 },
          }),
          t.grid(
            GROUPS.map((g) =>
              t.stack(
                [
                  t.heading(g.title, "h3", {
                    style: {
                      fontSize: "sm",
                      fontWeight: "semibold",
                      color: "muted",
                      marginBottom: 6,
                    },
                  }),
                  t.stack(
                    g.rows.map(([name, price]) =>
                      t.row(
                        [
                          t.text(name!, {
                            style: { fontSize: "lg" },
                            mobile: { fontSize: "md" },
                          }),
                          t.text(price!, {
                            style: { fontSize: "lg", fontWeight: "semibold" },
                            mobile: { fontSize: "md" },
                          }),
                        ],
                        {
                          label: L("خدمة", "Service"),
                          style: {
                            justifyContent: "between",
                            alignItems: "center",
                            gap: 12,
                            wrap: false,
                            background: "background",
                            minHeight: 48,
                            paddingTop: 10,
                            paddingBottom: 10,
                          },
                        },
                      ),
                    ),
                    {
                      label: L("السطور", "Rows"),
                      role: "items",
                      style: { gap: 1, background: "border" },
                    },
                  ),
                ],
                { label: L("مجموعة", "Group"), style: { gap: 0 } },
              ),
            ),
            {
              label: L("المجموعات", "Groups"),
              columns: { desktop: 2, mobile: 1 },
              style: { gap: 48, alignItems: "start", marginTop: 28 },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
