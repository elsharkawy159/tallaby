/**
 * In the press (library Y-g): a small label, a ruled strip of publication
 * names set as text wordmarks, then one short pull-quote with its source. The
 * names are placeholders for the seller to replace with the real outlets.
 * Everything is centred; names wrap to a second row on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const OUTLETS = [
  L("ديلي نيوز", "Daily News"),
  L("القاهرة الأسبوعية", "Cairo Weekly"),
  L("تِك توداي", "Tech Today"),
  L("ستايل ماج", "Style Mag"),
  L("بيزنس ناو", "Business Now"),
];

export const teamPress = defineDesign({
  id: "team-press",
  version: 1,
  category: "about",
  subcategory: "press",
  name: L("اتكلموا عننا", "In the press"),
  description: L("أسماء الجرايد والمواقع اللي كتبت عن المتجر، واقتباس منها.", "The outlets that wrote about the store, with one pull-quote."),
  keywords: ["about", "press", "media", "featured in", "as seen in", "من نحن", "اتكلموا عننا", "صحافة"],
  tree: (t) =>
    t.section({ label: L("الصحافة", "Press") }, [
      t.container(
        [
          t.text(L("اتكلموا عننا", "As seen in"), {
            role: "eyebrow",
            style: { fontSize: "sm", fontWeight: "semibold", color: "muted", textAlign: "center" },
          }),
          t.stack(
            [
              t.row(
                OUTLETS.map((name) =>
                  t.text(name, {
                    style: { fontFamily: "heading", fontSize: "2xl", fontWeight: "bold", letterSpacing: "tight", color: "muted", hover: { color: "foreground" } },
                    mobile: { fontSize: "lg" },
                  }),
                ),
                {
                  label: L("الأسماء", "Names"),
                  role: "items",
                  style: { background: "background", justifyContent: "center", gap: 48, paddingTop: 28, paddingBottom: 28 },
                  mobile: { gap: 24, paddingTop: 20, paddingBottom: 20 },
                },
              ),
            ],
            { label: L("الشريط", "Strip"), style: { background: "border", paddingTop: 1, paddingBottom: 1, marginTop: 16 } },
          ),
          t.stack(
            [
              t.text(L("\"واحد من أسرع المتاجر الإلكترونية نموًا في مصر.\"", "\"One of the fastest-growing online stores in Egypt.\""), {
                role: "quote",
                style: { fontFamily: "heading", fontSize: "2xl", fontWeight: "medium", textAlign: "center", maxWidth: "40ch" },
                mobile: { fontSize: "lg" },
              }),
              t.text(L("— ديلي نيوز", "— Daily News"), { role: "source", style: { fontSize: "sm", color: "muted", textAlign: "center" } }),
            ],
            { label: L("الاقتباس", "Quote"), style: { gap: 8, alignItems: "center", marginTop: 28 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
