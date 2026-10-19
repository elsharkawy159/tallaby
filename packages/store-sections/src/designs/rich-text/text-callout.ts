/**
 * Callout (library X-c): a rounded accent block with an icon tile on the
 * start side, a bold one-line title with a short line, and a link at the end.
 * For an urgent notice: a holiday cut-off, a delay, a price change.
 */
import { defineDesign } from "../builder";
import { L, arrowLink, iconTile } from "../_kit";

export const textCallout = defineDesign({
  id: "text-callout",
  version: 1,
  category: "rich-text",
  subcategory: "callout",
  name: L("تنبيه ملوّن", "Callout"),
  description: L("شريط ملون بأيقونة وعنوان وسطر ورابط لتنبيه مهم.", "A coloured block with an icon, a title, a line and a link for an urgent notice."),
  keywords: ["notice", "callout", "alert", "announcement", "تنبيه", "إعلان", "ملاحظة"],
  tree: (t) =>
    t.section({ label: L("تنبيه", "Callout"), style: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.row(
            [
              iconTile(t, "clock", { background: "background", color: "foreground" }),
              t.stack(
                [
                  t.heading(L("آخر موعد للطلب قبل العيد: ٨ يونيو", "Last order before Eid: 8 June"), "h3", { role: "title", style: { fontSize: "lg" } }),
                  t.paragraph(L("الطلبات بعد هذا الموعد تُشحن بعد إجازة العيد.", "Orders after that ship after the holiday."), {
                    role: "body",
                    style: { color: "foreground", opacity: 80 },
                  }),
                ],
                { label: L("النص", "Copy"), style: { gap: 2 } },
              ),
              arrowLink(t, L("التفاصيل", "Details"), "/faq", { style: { color: "foreground", marginStart: 0 } }),
            ],
            {
              label: L("التنبيه", "Callout"),
              style: {
                gap: 18,
                justifyContent: "between",
                background: "accent",
                color: "foreground",
                radius: 20,
                paddingTop: 20,
                paddingBottom: 20,
                paddingStart: 24,
                paddingEnd: 24,
              },
              mobile: { alignItems: "start" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
