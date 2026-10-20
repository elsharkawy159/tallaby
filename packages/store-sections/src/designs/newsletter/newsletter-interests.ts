/**
 * Pick interests (Modular set): a centred title, a row of topic chips the list
 * covers, and the store's sign-up form under them. For stores with distinct
 * product lines. The chips describe the list; to let subscribers choose, add a
 * checkbox field to the form.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const TOPICS = [L("وصل حديثًا", "New in"), L("العروض", "Offers"), L("هدايا", "Gifts"), L("نصايح", "Tips")];

export const newsletterInterests = defineDesign({
  id: "newsletter-interests",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("اختار اهتماماتك", "Pick interests"),
  description: L("عنوان في المنتصف ومواضيع النشرة ونموذج الاشتراك.", "A centred title, the list's topics and the sign-up form."),
  keywords: ["newsletter", "interests", "topics", "subscribe", "نشرة", "اهتمامات"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("إيه اللي يهمك؟", "What are you into?"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  letterSpacing: "tight",
                  textAlign: "center",
                },
              }),
              t.paragraph(L("هنبعتلك اللي يخصك بس، مرة في الأسبوع.", "We only send what is relevant, once a week."), {
                role: "subtitle",
                style: { textAlign: "center" },
              }),
              t.row(
                TOPICS.map((topic) =>
                  t.row(
                    [
                      t.icon("check", {
                        style: { fontSize: "sm", color: "primary" },
                      }),
                      t.text(topic, {
                        style: { fontWeight: "semibold", fontSize: "sm" },
                      }),
                    ],
                    {
                      label: L("موضوع", "Topic"),
                      style: {
                        gap: 6,
                        wrap: false,
                        radius: 999,
                        borderWidth: 1,
                        borderColor: "border",
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingStart: 16,
                        paddingEnd: 16,
                      },
                    },
                  ),
                ),
                {
                  label: L("المواضيع", "Topics"),
                  role: "items",
                  style: { gap: 8, justifyContent: "center" },
                },
              ),
              t.stack([t.storeForm()], {
                label: L("النموذج", "Form box"),
                style: { width: "100%", maxWidth: "520px", marginTop: 8 },
              }),
            ],
            {
              label: L("المحتوى", "Content"),
              style: { gap: 16, alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
