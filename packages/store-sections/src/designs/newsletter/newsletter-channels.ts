/**
 * Channel picker (library N-d): a tinted panel with the title and a line on
 * the start side; on the end side two channel cards (WhatsApp and email) over
 * the store's sign-up form and a privacy note. The switch in the design needs
 * a script, so the cards are a still pair that names both channels; the form
 * carries the phone and email fields the seller adds to it.
 */
import type { ElementIconName } from "../../elements/registry";
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

function channel(t: TreeBuilder, icon: ElementIconName, name: DesignText, line: DesignText, active: boolean): NodeTemplate {
  return t.row(
    [
      t.icon(icon, { style: { fontSize: "lg", color: active ? "primary" : "muted" } }),
      t.stack([t.text(name, { style: { fontWeight: "semibold" } }), t.text(line, { style: { fontSize: "xs", color: "muted" } })], {
        label: L("القناة", "Channel"),
        style: { gap: 2 },
      }),
    ],
    {
      label: L("كارت القناة", "Channel card"),
      style: {
        gap: 12,
        wrap: false,
        alignItems: "center",
        background: "background",
        radius: 16,
        borderWidth: 2,
        borderColor: active ? "primary" : "border",
        paddingTop: 14,
        paddingBottom: 14,
        paddingStart: 16,
        paddingEnd: 16,
      },
    },
  );
}

export const newsletterChannels = defineDesign({
  id: "newsletter-channels",
  version: 1,
  category: "newsletter",
  subcategory: "panel",
  name: L("واتساب أو إيميل", "Channel picker"),
  description: L("لوحة فيها العنوان، وكروت واتساب وإيميل فوق نموذج الاشتراك.", "A panel with the title, and WhatsApp and email cards over the sign-up form."),
  keywords: ["newsletter", "whatsapp", "email", "channel", "subscribe", "نشرة", "واتساب", "إيميل", "اشتراك"],
  tree: (t) =>
    t.section({ label: L("النشرة", "Newsletter") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("العروض توصلك زي ما تحب", "Get our offers your way"), "h2", {
                    role: "title",
                    style: { fontSize: "display-sm", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("على واتساب أو على الإيميل، رسالة واحدة في الأسبوع ومن غير إزعاج.", "On WhatsApp or by email, one message a week and no spam."), {
                    role: "subtitle",
                    style: { maxWidth: "460px" },
                  }),
                ],
                { label: L("العنوان", "Heading"), role: "intro", style: { gap: 12 } },
              ),
              t.stack(
                [
                  t.grid(
                    [
                      channel(t, "chat", L("واتساب", "WhatsApp"), L("على رقم موبايلك", "To your mobile"), true),
                      channel(t, "mail", L("إيميل", "Email"), L("على بريدك", "To your inbox"), false),
                    ],
                    { label: L("القنوات", "Channels"), role: "items", columns: { desktop: 2 }, style: { gap: 10 } },
                  ),
                  t.storeForm(),
                  t.text(L("تقدر تلغي الاشتراك في أي وقت.", "You can unsubscribe at any time."), {
                    role: "note",
                    style: { fontSize: "xs", color: "muted" },
                  }),
                ],
                { label: L("الاشتراك", "Sign-up"), style: { gap: 14 } },
              ),
            ],
            {
              label: L("اللوحة", "Panel"),
              columns: { desktop: 2, mobile: 1 },
              style: {
                gap: 48,
                alignItems: "center",
                background: "secondary",
                radius: 28,
                paddingTop: 48,
                paddingBottom: 48,
                paddingStart: 48,
                paddingEnd: 48,
              },
              mobile: { gap: 24, paddingTop: 28, paddingBottom: 28, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
