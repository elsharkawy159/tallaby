/**
 * Brand statement (Claude Design premium set, richText; 2026-10-27): a quiet
 * band with a small eyebrow, one large centred statement and a text link with
 * an arrow. The brand promise in one breath, between busy sections.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";

export const textBrandStatement = defineDesign({
  id: "text-brand-statement",
  version: 1,
  category: "rich-text",
  subcategory: "callout",
  name: L("جملة البراند", "Brand statement"),
  description: L("جملة كبيرة في النص عن البراند، وتحتها رابط لحكايتكم.", "One large centred line about the brand, with a link to your story under it."),
  keywords: ["text", "statement", "brand", "mission", "promise", "premium", "نص", "براند", "رسالة"],
  tree: (t) =>
    t.section({ label: L("جملة البراند", "Brand statement") }, [
      t.container(
        [
          t.stack(
            [
              t.text(L("وعدنا", "Our promise"), {
                role: "eyebrow",
                style: { fontSize: "sm", fontWeight: "semibold", color: "muted", textAlign: "center" },
              }),
              t.heading(L("ألوان جريئة وقصّات مريحة، معمولة تتلبس كل يوم.", "Bold colour, easy cuts, made to be worn every day."), "h2", {
                role: "title",
                style: { fontSize: "display-sm", fontWeight: "medium", lineHeight: "snug", textAlign: "center", maxWidth: "980px" },
              }),
              arrowLink(t, L("اقرأ حكايتنا", "Read our story"), "/about", { style: { color: "foreground" } }),
            ],
            { label: L("البيان", "Statement"), role: "intro", style: { gap: 18, alignItems: "center" }, mobile: { gap: 14 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
