/**
 * Chat answers (Modular set): each question a chat bubble from the customer
 * and its answer a reply bubble from the store, as a short conversation on a
 * shelf panel, with a link to every question. A friendly tone for small stores.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L, arrowLink } from "../_kit";
import { FAQ_ITEMS } from "./_faq";

function bubble(t: TreeBuilder, text: DesignText, me: boolean): NodeTemplate {
  return t.row(
    [
      t.paragraph(text, {
        style: {
          color: me ? "primaryInk" : "foreground",
          background: me ? "primary" : "background",
          radius: 18,
          maxWidth: "70%",
          paddingTop: 12,
          paddingBottom: 12,
          paddingStart: 16,
          paddingEnd: 16,
          shadow: "sm",
          ...(!me && { fontWeight: "semibold" }),
        },
        mobile: { maxWidth: "85%" },
      }),
    ],
    {
      label: me ? L("إجابة", "Answer") : L("سؤال", "Question"),
      style: { justifyContent: me ? "end" : "start" },
    },
  );
}

export const faqChat = defineDesign({
  id: "faq-chat",
  version: 1,
  category: "faq",
  subcategory: "cards",
  name: L("إجابات شات", "Chat answers"),
  description: L("الأسئلة والإجابات كأنها محادثة بينك وبين العميل.", "Questions and answers as a chat between you and a customer."),
  keywords: ["faq", "chat", "conversation", "playful", "أسئلة", "شات", "محادثة"],
  tree: (t) =>
    t.section({ label: L("الأسئلة الشائعة", "FAQ") }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("سألتونا كتير…", "You asked us a lot…"), "h2", {
                role: "title",
                style: {
                  fontSize: "display-sm",
                  letterSpacing: "tight",
                  marginBottom: 8,
                },
              }),
              ...FAQ_ITEMS.slice(2, 5).flatMap((q) => [bubble(t, q.title, false), bubble(t, q.body, true)]),
              t.stack([arrowLink(t, L("كل الأسئلة", "All questions"), "/faq")], {
                label: L("الرابط", "Link"),
                style: { alignItems: "center", marginTop: 8 },
              }),
            ],
            {
              label: L("المحادثة", "Chat"),
              role: "items",
              style: {
                background: "secondary",
                radius: 28,
                gap: 12,
                maxWidth: "760px",
                paddingTop: 36,
                paddingBottom: 32,
                paddingStart: 32,
                paddingEnd: 32,
              },
              mobile: {
                paddingTop: 24,
                paddingBottom: 24,
                paddingStart: 14,
                paddingEnd: 14,
              },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
