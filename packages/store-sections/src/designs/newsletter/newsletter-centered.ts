/**
 * Centered minimal (library N-b): everything centred on a soft tint, an
 * envelope in a circle, eyebrow, title, one line, the store's form and a
 * small privacy note, in a 560px column.
 */
import { defineDesign } from "../builder";
import { L, iconTile } from "../_kit";

export const newsletterCentered = defineDesign({
  id: "newsletter-centered",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("بسيط في المنتصف", "Centered minimal"),
  description: L("نموذج اشتراك هادئ في المنتصف مع ملاحظة الخصوصية.", "A calm centred sign-up form with a privacy note."),
  keywords: ["newsletter", "subscribe", "minimal", "centered", "نشرة", "اشتراك"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter"), style: { background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              iconTile(t, "mail", { radius: 999, background: "background" }),
              t.badge(L("النشرة", "Newsletter"), { role: "eyebrow", style: { color: "primary", background: "background" } }),
              t.heading(L("اشترك في نشرتنا البريدية", "Join our newsletter"), "h2", {
                role: "title",
                style: { fontSize: "display-sm", textAlign: "center" },
              }),
              t.paragraph(L("اشترك لتصلك أخبار المنتجات الجديدة.", "Subscribe to hear about new arrivals."), {
                role: "subtitle",
                style: { textAlign: "center" },
              }),
              t.box([t.storeForm()], {
                label: L("النموذج", "Form box"),
                style: { width: "100%", background: "transparent", paddingTop: 8, paddingBottom: 0, paddingStart: 0, paddingEnd: 0 },
              }),
              t.text(L("بدون رسائل مزعجة، ويمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."), {
                style: { color: "muted", fontSize: "xs", textAlign: "center" },
              }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 14, alignItems: "center", maxWidth: "560px", marginStart: 0, marginEnd: 0 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "560px" } },
      ),
    ]),
});
