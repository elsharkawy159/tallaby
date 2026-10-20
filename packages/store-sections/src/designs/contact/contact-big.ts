/**
 * Big type (Modular set): the contact details as very large tappable lines
 * (phone, WhatsApp, email), each with a small label above and hairline rules
 * between. A bold, minimal contact page.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { CHANNELS } from "./_shared";

export const contactBig = defineDesign({
  id: "contact-big",
  version: 1,
  category: "contact",
  subcategory: "info",
  name: L("خط كبير", "Big type"),
  description: L("التليفون والواتساب والإيميل بخط ضخم قابل للضغط.", "Phone, WhatsApp and email in huge tappable type."),
  keywords: ["contact", "big type", "phone", "email", "editorial", "تواصل", "تليفون"],
  tree: (t) =>
    t.section({ label: L("تواصل معنا", "Contact") }, [
      t.container(
        [
          t.heading(L("قول أهلًا", "Say hello"), "h2", {
            role: "title",
            style: {
              fontSize: "display-sm",
              letterSpacing: "tight",
              marginBottom: 24,
            },
          }),
          t.stack(
            [CHANNELS[1]!, CHANNELS[0]!, CHANNELS[2]!].map((c) =>
              t.link(
                c.href,
                [
                  t.row(
                    [
                      t.stack(
                        [
                          t.text(c.label, {
                            style: { color: "muted", fontSize: "sm" },
                          }),
                          t.text(c.value, {
                            style: {
                              fontSize: "display-md",
                              fontWeight: "bold",
                              letterSpacing: "tight",
                              lineHeight: "tight",
                            },
                          }),
                        ],
                        { label: L("المحتوى", "Content"), style: { gap: 6 } },
                      ),
                      t.icon("arrow", {
                        style: { fontSize: "2xl", color: "primary" },
                      }),
                    ],
                    {
                      label: L("السطر", "Row"),
                      style: {
                        justifyContent: "between",
                        gap: 16,
                        wrap: false,
                      },
                    },
                  ),
                ],
                {
                  label: c.label,
                  style: {
                    ...FLUSH,
                    background: "background",
                    paddingTop: 24,
                    paddingBottom: 24,
                    hover: { color: "primary" },
                  },
                },
              ),
            ),
            {
              label: L("بيانات التواصل", "Contact lines"),
              role: "items",
              style: {
                gap: 1,
                background: "border",
                paddingTop: 1,
                paddingBottom: 1,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
