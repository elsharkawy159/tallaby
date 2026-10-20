/**
 * By use (Product finder E-a): a question over four large use buttons (an icon
 * in a round chip and a label), then a grid of the store's best sellers. In
 * the design the buttons filter the grid; here each one is a link the seller
 * points at the category or collection for that use, so nothing pretends to
 * filter.
 */
import { defineDesign } from "../builder";
import { L, sectionHead } from "../_kit";
import { iconDisc } from "../_modular";
import { productCard } from "../products/_shared";
import { FINDER_LINK } from "./_shared";

const USES = [
  { icon: "map-pin", label: L("المشاوير", "Commuting") },
  { icon: "heart", label: L("الرياضة", "Workouts") },
  { icon: "phone", label: L("المكالمات", "Calls") },
  { icon: "user", label: L("الشغل من البيت", "Work from home") },
] as const;

export const finderUse = defineDesign({
  id: "finder-use",
  version: 1,
  category: "finder",
  subcategory: "guided",
  name: L("حسب الاستخدام", "By use"),
  description: L(
    "سؤال وأربع زراير استخدام توصّل للقسم المناسب، وتحتها الأكثر طلبًا.",
    "A question with four use buttons that lead to the right shelf, over your best sellers.",
  ),
  keywords: [
    "finder",
    "by use",
    "help me choose",
    "guided",
    "ساعدني أختار",
    "استخدام",
    "ترشيحات",
  ],
  tree: (t) =>
    t.section({ label: L("حسب الاستخدام", "By use") }, [
      t.container(
        [
          sectionHead(t, {
            eyebrow: L("ساعدني أختار", "Help me choose"),
            title: L("هتستخدمها في إيه؟", "What will you use it for?"),
            subtitle: L(
              "اختار استخدامك ونوديك على المنتجات المناسبة ليه.",
              "Pick what it is for and we take you to the products that fit.",
            ),
          }),
          t.grid(
            USES.map((u) =>
              t.link(
                FINDER_LINK,
                [
                  t.row(
                    [
                      iconDisc(t, u.icon, {
                        background: "secondary",
                        color: "primary",
                      }),
                      t.text(u.label, {
                        style: { fontWeight: "semibold", fontSize: "md" },
                        mobile: { fontSize: "sm" },
                      }),
                    ],
                    {
                      label: L("المحتوى", "Content"),
                      style: { gap: 14, wrap: false, alignItems: "center" },
                      mobile: { gap: 10 },
                    },
                  ),
                ],
                {
                  label: L("استخدام", "Use"),
                  style: {
                    radius: 20,
                    borderWidth: 1,
                    borderColor: "border",
                    background: "background",
                    color: "foreground",
                    minHeight: 76,
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingStart: 18,
                    paddingEnd: 18,
                    hover: { borderColor: "primary", background: "secondary" },
                  },
                  mobile: { minHeight: 64, paddingStart: 12, paddingEnd: 12 },
                },
              ),
            ),
            {
              label: L("الاستخدامات", "Uses"),
              role: "items",
              columns: { desktop: 4, mobile: 2 },
              style: { gap: 10, marginTop: 28 },
              mobile: { gap: 8, marginTop: 20 },
            },
          ),
          t.text(L("الأكثر طلبًا دلوقتي", "Popular right now"), {
            style: {
              fontSize: "sm",
              fontWeight: "medium",
              color: "muted",
              marginTop: 28,
              marginBottom: 16,
            },
          }),
          t.productList([productCard(t)], {
            label: L("المنتجات", "Products"),
            role: "products",
            source: "best-sellers",
            limit: 4,
            columns: { desktop: 4, mobile: 2 },
            style: { gap: 20 },
            mobile: { gap: 12 },
          }),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
