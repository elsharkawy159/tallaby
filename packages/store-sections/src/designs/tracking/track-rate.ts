/**
 * Delivered, rate us (library D-j, reworked): a centred column with a big
 * tick in a sun disc, the title and question, and one of the store's forms
 * (the ready-made "Feedback" form fits) so the answers reach the seller's
 * inbox. The design's star buttons and tag chips need a script; the form's
 * own rating field takes their place. With no form picked the section shows
 * nothing publicly.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { discStyle } from "./_shared";

export const trackRate = defineDesign({
  id: "track-rate",
  version: 1,
  category: "tracking",
  subcategory: "feedback",
  name: L("وصل! قيّمنا", "Delivered, rate us"),
  description: L(
    "علامة صح كبيرة وسؤال عن التجربة ونموذج التقييم من نماذج متجرك.",
    "A big tick, a question about the experience and your store's feedback form.",
  ),
  keywords: [
    "tracking",
    "delivered",
    "feedback",
    "rating",
    "review",
    "form",
    "تقييم",
    "رأيك",
    "وصل",
  ],
  tree: (t) =>
    t.section({ label: L("التقييم بعد التوصيل", "Delivery feedback") }, [
      t.container(
        [
          t.stack(
            [
              t.box(
                [
                  t.icon("check", {
                    style: { fontSize: "5xl", color: "foreground" },
                  }),
                ],
                {
                  label: L("علامة الصح", "Tick"),
                  style: discStyle(88),
                },
              ),
              t.heading(L("وصل طلبك!", "Your order arrived!"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  letterSpacing: "tight",
                  textAlign: "center",
                },
              }),
              t.paragraph(
                L(
                  "التجربة كانت عاملة إزاي؟ رأيك بيفرق معانا.",
                  "How was everything? Your opinion helps us.",
                ),
                {
                  role: "subtitle",
                  style: { fontSize: "lg", textAlign: "center" },
                },
              ),
              t.box([t.storeForm()], {
                label: L("النموذج", "Form box"),
                style: {
                  width: "100%",
                  background: "secondary",
                  radius: 20,
                  marginTop: 8,
                  paddingTop: 24,
                  paddingBottom: 24,
                  paddingStart: 24,
                  paddingEnd: 24,
                },
                mobile: {
                  paddingTop: 18,
                  paddingBottom: 18,
                  paddingStart: 16,
                  paddingEnd: 16,
                },
              }),
            ],
            {
              label: L("المحتوى", "Content"),
              style: { gap: 14, alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "560px" } },
      ),
    ]),
});
