/**
 * Founder letter (Modular set): a paper letter card centred on a shelf band: a
 * greeting, a short personal paragraph, a signature with an avatar, then the
 * store's sign-up form. A personal, trust-first sign-up for small brands.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { dotLabel, who } from "../_modular";

export const newsletterLetter = defineDesign({
  id: "newsletter-letter",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("رسالة المؤسس", "Founder letter"),
  description: L("رسالة شخصية من صاحب المتجر ونموذج الاشتراك تحتها.", "A personal letter from the owner with the sign-up form below."),
  keywords: ["newsletter", "founder", "letter", "personal", "editorial", "نشرة", "رسالة", "مؤسس"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter"), style: { background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              t.stack(
                [
                  dotLabel(t, L("رسالة كل أسبوع", "A weekly letter")),
                  t.heading(L("أهلًا،", "Hello,"), "h2", {
                    role: "title",
                    style: { fontSize: "3xl" },
                  }),
                  t.paragraph(
                    L(
                      "كل خميس بكتب رسالة قصيرة فيها أحسن حاجة جربناها الأسبوع ده، وعرض للمشتركين بس.",
                      "Every Thursday I write a short note with the best thing we tried that week and a subscriber-only offer.",
                    ),
                    {
                      role: "body",
                      style: { fontSize: "lg", lineHeight: "relaxed" },
                    },
                  ),
                  who(t, L("أ", "A"), L("أحمد", "Ahmed"), L("صاحب المتجر", "Store owner")),
                  t.divider({ style: { marginTop: 8, marginBottom: 8 } }),
                  t.storeForm(),
                ],
                {
                  label: L("الرسالة", "Letter"),
                  style: {
                    background: "background",
                    radius: 24,
                    shadow: "md",
                    gap: 16,
                    width: "100%",
                    maxWidth: "560px",
                    paddingTop: 40,
                    paddingBottom: 40,
                    paddingStart: 40,
                    paddingEnd: 40,
                  },
                  mobile: {
                    paddingTop: 24,
                    paddingBottom: 24,
                    paddingStart: 20,
                    paddingEnd: 20,
                  },
                },
              ),
            ],
            {
              label: L("المحاذاة", "Alignment"),
              style: { alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
