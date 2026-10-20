/**
 * Reward card (library PU-j "Scratch reward"), drawn inline: the scratch
 * modal's header and card set in the page, already revealed. A tree cannot
 * draw a scratch layer or pick a random reward, so the card shows the one
 * reward the seller types (label, prize and code in a dashed box) under a
 * playful title, with a button to the shop. A sun dot pattern sits behind the
 * prize as decoration. Mobile keeps the centred stack.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { BIG_NUMBER, pillButton } from "../_modular";
import { SHOP_LINK } from "../products/_shared";

export const popupReward = defineDesign({
  id: "popup-reward",
  version: 1,
  category: "popups",
  subcategory: "welcome",
  name: L("كارت المكافأة", "Reward card"),
  description: L("كارت هدية فيه المكافأة وكودها وزر يستخدمه.", "A prize card with the reward, its code and a button to use it."),
  keywords: ["popup", "reward", "scratch", "prize", "coupon", "code", "مكافأة", "كسبت", "كوبون", "كود"],
  tree: (t) =>
    t.section({ label: L("كارت المكافأة", "Reward card"), style: { background: "secondary" } }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("جرّب حظك", "Try your luck"), "h2", {
                role: "title",
                style: { fontSize: "display-sm", letterSpacing: "tight", textAlign: "center" },
              }),
              t.paragraph(L("المرة دي كسبت، وده كودك.", "You won this time, and here is your code."), {
                role: "subtitle",
                style: { textAlign: "center" },
              }),
              t.stack(
                [
                  t.pattern("dots", {
                    label: L("نقط الكارت", "Card dots"),
                    style: { position: "absolute", insetTop: "0px", insetStart: "0px", insetEnd: "0px", insetBottom: "0px", opacity: 30 },
                  }),
                  t.text(L("كسبت", "You won"), {
                    role: "eyebrow",
                    style: { position: "relative", fontSize: "sm", fontWeight: "semibold", textAlign: "center" },
                  }),
                  t.text(L("شحن مجاني", "Free delivery"), {
                    role: "offer",
                    style: { ...BIG_NUMBER, position: "relative", fontSize: "4xl", textAlign: "center", fontFamily: "heading" },
                    mobile: { fontSize: "3xl" },
                  }),
                  t.text(L("الكود: FREESHIP", "Code: FREESHIP"), {
                    role: "code",
                    style: {
                      position: "relative",
                      fontWeight: "bold",
                      letterSpacing: "wider",
                      textAlign: "center",
                      background: "background",
                      radius: 12,
                      borderWidth: 2,
                      borderColor: "foreground",
                      paddingTop: 8,
                      paddingBottom: 8,
                      paddingStart: 20,
                      paddingEnd: 20,
                    },
                  }),
                ],
                {
                  label: L("الكارت", "Card"),
                  style: {
                    position: "relative",
                    overflow: "hidden",
                    gap: 10,
                    alignItems: "center",
                    background: "accent",
                    color: "foreground",
                    radius: 24,
                    width: "100%",
                    paddingTop: 32,
                    paddingBottom: 32,
                    paddingStart: 24,
                    paddingEnd: 24,
                  },
                },
              ),
              pillButton(t, L("استخدمه دلوقتي", "Use it now"), SHOP_LINK, { style: { marginTop: 4 } }),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 14, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "440px" } },
      ),
    ]),
});
