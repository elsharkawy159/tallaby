/**
 * Before you go (library PU-b), drawn inline: the exit-intent modal's brand
 * panel set in the page, with a very large "wait" line, a line about the cart
 * and the seller's typed delivery hook, and one button back to the cart. No
 * exit trigger and no cart thumbnails: a tree has neither, so it reads as a
 * reminder band, for example at the end of a long page. Mobile keeps the
 * centred stack with smaller type.
 */
import { defineDesign } from "../builder";
import { L, ON_BRAND, ON_BRAND_BODY } from "../_kit";

export const popupExit = defineDesign({
  id: "popup-exit",
  version: 1,
  category: "popups",
  subcategory: "reminders",
  name: L("قبل ما تمشي", "Before you go"),
  description: L("لوحة بلون المتجر تفكّر العميل بسلته وترجعه يكمل الطلب.", "A brand panel that reminds shoppers of their cart and sends them back to finish."),
  keywords: ["popup", "exit intent", "cart", "reminder", "abandoned cart", "نافذة", "السلة", "قبل ما تمشي", "تذكير"],
  tree: (t) =>
    t.section({ label: L("قبل ما تمشي", "Before you go") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("استنى!", "Wait!"), "h2", {
                role: "title",
                style: { ...ON_BRAND, fontSize: "display-lg", letterSpacing: "tight", lineHeight: "tight", textAlign: "center" },
              }),
              t.paragraph(L("سلتك لسه مستنياك، والتوصيل مجاني لو كملت دلوقتي.", "Your cart is still here, and delivery is free if you finish now."), {
                role: "subtitle",
                style: { ...ON_BRAND_BODY, fontSize: "lg", textAlign: "center", maxWidth: "520px" },
                mobile: { fontSize: "md" },
              }),
              t.button(L("كمّل الطلب", "Finish my order"), "/cart", "light", { role: "cta", style: { marginTop: 8 } }),
            ],
            {
              label: L("اللوحة", "Panel"),
              style: {
                gap: 14,
                alignItems: "center",
                background: "primary",
                radius: 28,
                paddingTop: 56,
                paddingBottom: 56,
                paddingStart: 32,
                paddingEnd: 32,
              },
              mobile: { paddingTop: 36, paddingBottom: 36, paddingStart: 20, paddingEnd: 20 },
            },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "720px" } },
      ),
    ]),
});
