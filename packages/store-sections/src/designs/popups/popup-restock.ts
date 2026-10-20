/**
 * Back in stock (library PU-g), drawn inline: the compact notify card set in
 * the page, with a round clock mark, the "we'll tell you" title, a line, the
 * channels named as small pills and the store's form for the shopper's
 * number or email. The design shows the sold-out product on top; a tree does
 * not know which product is sold out (and a picked product could be in
 * stock), so the card names no product and the shopper writes it in the form.
 * Mobile keeps the card full width.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const CHANNELS = [L("واتساب", "WhatsApp"), L("رسالة SMS", "SMS"), L("إيميل", "Email")];

export const popupRestock = defineDesign({
  id: "popup-restock",
  version: 1,
  category: "popups",
  subcategory: "reminders",
  name: L("بلّغني لما يتوفر", "Back in stock"),
  description: L("كارت صغير يجمع رقم أو إيميل العميل عشان تبلّغه لما المنتج يرجع.", "A small card that collects a number or email to tell shoppers when a product is back."),
  keywords: ["popup", "back in stock", "restock", "notify", "sold out", "بلغني", "يتوفر", "خلص", "تنبيه"],
  tree: (t) =>
    t.section({ label: L("بلّغني لما يتوفر", "Back in stock") }, [
      t.container(
        [
          t.stack(
            [
              t.box([t.icon("clock", { style: { fontSize: "2xl", color: "foreground" } })], {
                label: L("أيقونة", "Icon"),
                style: { background: "accent", radius: 999, width: "56px", paddingTop: 14, paddingBottom: 12, textAlign: "center" },
              }),
              t.text(L("خلص من المخزن؟", "Sold out?"), {
                role: "eyebrow",
                style: { fontSize: "sm", fontWeight: "semibold", color: "muted" },
              }),
              t.heading(L("هنبلّغك أول ما يرجع", "We'll tell you when it's back"), "h2", {
                role: "title",
                style: { fontSize: "3xl", letterSpacing: "tight" },
                mobile: { fontSize: "2xl" },
              }),
              t.paragraph(L("اكتب المنتج اللي عايزه ومقاسه، وسيب رقمك أو إيميلك.", "Write the product and size, and leave your number or email."), {
                role: "subtitle",
              }),
              t.row(
                CHANNELS.map((name) =>
                  t.text(name, {
                    style: {
                      fontSize: "sm",
                      fontWeight: "semibold",
                      radius: 999,
                      borderWidth: 1,
                      borderColor: "border",
                      paddingTop: 6,
                      paddingBottom: 6,
                      paddingStart: 14,
                      paddingEnd: 14,
                    },
                  }),
                ),
                { label: L("القنوات", "Channels"), role: "items", style: { gap: 8 } },
              ),
              t.stack([t.storeForm()], { label: L("النموذج", "Form box"), style: { marginTop: 4, width: "100%" } }),
            ],
            {
              label: L("الكارت", "Card"),
              style: {
                gap: 12,
                alignItems: "start",
                background: "background",
                borderWidth: 1,
                borderColor: "border",
                radius: 24,
                shadow: "md",
                paddingTop: 32,
                paddingBottom: 32,
                paddingStart: 32,
                paddingEnd: 32,
              },
              mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "520px" } },
      ),
    ]),
});
