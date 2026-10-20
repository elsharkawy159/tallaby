/**
 * Order problem (library D-k): a short heading and four large problem rows
 * (late, damaged, wrong item, something missing), each with an icon, a
 * one-line hint and a chat mark; every row opens WhatsApp with a matching
 * message typed. The design fills in the order number; a link cannot know
 * it, so the line asks the shopper to add it.
 */
import type { ElementIconName } from "../../elements/registry";
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { iconDisc } from "../_modular";
import { WA } from "./_shared";

const PROBLEMS: {
  icon: ElementIconName;
  label: ReturnType<typeof L>;
  hint: ReturnType<typeof L>;
  message: string;
}[] = [
  {
    icon: "clock",
    label: L("الطلب اتأخر", "It is late"),
    hint: L("عدّى المعاد المتوقع", "Past the expected time"),
    message: "My%20order%20is%20late",
  },
  {
    icon: "package",
    label: L("وصل مكسور", "It arrived damaged"),
    hint: L("صوّر العلبة والمنتج", "Take a photo of the box and item"),
    message: "My%20order%20arrived%20damaged",
  },
  {
    icon: "rotate",
    label: L("وصلني منتج غلط", "Wrong item"),
    hint: L("هنبدّله مجانًا", "We swap it for free"),
    message: "I%20received%20the%20wrong%20item",
  },
  {
    icon: "search",
    label: L("ناقص حاجة", "Something is missing"),
    hint: L("قولنا إيه اللي ناقص", "Tell us what is missing"),
    message: "Something%20is%20missing%20from%20my%20order",
  },
];

export const trackProblem = defineDesign({
  id: "track-problem",
  version: 1,
  category: "tracking",
  subcategory: "help",
  name: L("مشكلة في الطلب", "Order problem"),
  description: L(
    "أربع مشاكل شائعة، كل واحدة تفتح واتساب برسالة جاهزة.",
    "Four common problems, each opening WhatsApp with a ready message.",
  ),
  keywords: [
    "tracking",
    "problem",
    "late",
    "damaged",
    "support",
    "whatsapp",
    "مشكلة",
    "متأخر",
    "واتساب",
  ],
  tree: (t) =>
    t.section({ label: L("مشكلة في الطلب", "Order problem") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("في مشكلة؟", "Something wrong?"), "h2", {
                role: "title",
                style: { fontSize: "display-sm", letterSpacing: "tight" },
              }),
              t.paragraph(
                L(
                  "اختار المشكلة وهنكمل معاك على واتساب. ابعت رقم الطلب في الرسالة.",
                  "Pick the issue and we'll take it from there on WhatsApp. Add your order number to the message.",
                ),
                {
                  role: "subtitle",
                  style: { marginBottom: 8 },
                },
              ),
              t.stack(
                PROBLEMS.map((p) =>
                  t.link(
                    `${WA}?text=${p.message}`,
                    [
                      t.row(
                        [
                          iconDisc(t, p.icon, {
                            background: "secondary",
                            color: "primary",
                          }),
                          t.stack(
                            [
                              t.text(p.label, {
                                style: { fontWeight: "semibold" },
                              }),
                              t.text(p.hint, {
                                style: { fontSize: "sm", color: "muted" },
                              }),
                            ],
                            { label: L("النص", "Copy"), style: { gap: 2, width: "78%" }, mobile: { width: "64%" } },
                          ),
                          t.icon("chat", {
                            style: {
                              fontSize: "xl",
                              color: "primary",
                              marginStart: 8,
                            },
                          }),
                        ],
                        {
                          label: L("المحتوى", "Content"),
                          style: {
                            gap: 14,
                            wrap: false,
                            alignItems: "center",
                            justifyContent: "between",
                          },
                        },
                      ),
                    ],
                    {
                      label: p.label,
                      style: {
                        borderWidth: 1,
                        borderColor: "border",
                        radius: 16,
                        minHeight: 72,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingStart: 16,
                        paddingEnd: 20,
                        hover: { borderColor: "primary" },
                      },
                    },
                  ),
                ),
                {
                  label: L("المشاكل", "Problems"),
                  role: "items",
                  style: { gap: 10 },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "640px" } },
      ),
    ]),
});
