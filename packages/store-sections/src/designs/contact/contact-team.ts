/**
 * Team (Modular set): a row of team members with round initial avatars, name,
 * role and an "online" dot, and one WhatsApp button under them. A human face
 * for small stores.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { pillButton } from "../_modular";
import { CHANNELS } from "./_shared";

const TEAM = [
  {
    initial: L("ن", "N"),
    name: L("نور", "Nour"),
    role: L("المبيعات", "Sales"),
    online: true,
  },
  {
    initial: L("ع", "O"),
    name: L("عمر", "Omar"),
    role: L("خدمة العملاء", "Support"),
    online: true,
  },
  {
    initial: L("ه", "H"),
    name: L("هدى", "Hoda"),
    role: L("الشحن", "Shipping"),
    online: false,
  },
];
const TONES = [
  { background: "primary", color: "primaryInk" },
  { background: "accent", color: "foreground" },
  { background: "foreground", color: "background" },
];

export const contactTeam = defineDesign({
  id: "contact-team",
  version: 1,
  category: "contact",
  subcategory: "whatsapp",
  name: L("الفريق", "Team"),
  description: L("الناس اللي بترد عليك وزر واتساب واحد.", "The people who answer you, with one WhatsApp button."),
  keywords: ["contact", "team", "people", "whatsapp", "playful", "تواصل", "فريق"],
  tree: (t) =>
    t.section({ label: L("الفريق", "Team") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("ناس حقيقية بترد عليك", "Real people answer you"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  letterSpacing: "tight",
                  textAlign: "center",
                },
              }),
              t.row(
                TEAM.map((m, i) =>
                  t.stack(
                    [
                      t.box(
                        [
                          t.text(m.initial, {
                            style: {
                              fontWeight: "bold",
                              fontSize: "3xl",
                              textAlign: "center",
                              color: TONES[i]!.color,
                            },
                          }),
                          ...(m.online
                            ? [
                                t.box([], {
                                  label: L("متصل", "Online"),
                                  style: {
                                    position: "absolute",
                                    insetBottom: "4px",
                                    insetEnd: "4px",
                                    background: "#22c55e",
                                    radius: 999,
                                    width: "18px",
                                    minHeight: 18,
                                    borderWidth: 3,
                                    borderColor: "background",
                                  },
                                }),
                              ]
                            : []),
                        ],
                        {
                          label: L("الصورة الرمزية", "Avatar"),
                          style: {
                            background: TONES[i]!.background,
                            radius: 999,
                            width: "88px",
                            paddingTop: 22,
                            paddingBottom: 22,
                            position: "relative",
                          },
                          mobile: {
                            width: "72px",
                            paddingTop: 16,
                            paddingBottom: 16,
                          },
                        },
                      ),
                      t.text(m.name, {
                        style: { fontWeight: "semibold", textAlign: "center" },
                      }),
                      t.text(m.role, {
                        style: {
                          color: "muted",
                          fontSize: "sm",
                          textAlign: "center",
                        },
                      }),
                    ],
                    {
                      label: L("عضو", "Member"),
                      style: { gap: 6, alignItems: "center", width: "140px" },
                      mobile: { width: "30%" },
                    },
                  ),
                ),
                {
                  label: L("الفريق", "Team"),
                  role: "items",
                  style: { gap: 24, justifyContent: "center", wrap: false },
                  mobile: { gap: 8 },
                },
              ),
              pillButton(t, L("كلمنا على واتساب", "Message us on WhatsApp"), CHANNELS[0]!.href, { icon: "chat" }),
            ],
            {
              label: L("المحتوى", "Content"),
              style: { gap: 28, alignItems: "center" },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
