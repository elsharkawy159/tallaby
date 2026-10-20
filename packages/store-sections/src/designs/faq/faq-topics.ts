/**
 * Topic cards (Modular set): three topic cards (orders, delivery, payment and
 * returns), each with an icon, a title, its questions as links and a "see
 * all" link. A help-centre entry page. One column on mobile.
 */
import { defineDesign } from "../builder";
import { L, arrowLink } from "../_kit";
import { FLUSH, TILE, iconDisc, modHead } from "../_modular";
import { FAQ_GROUPS } from "./_faq";

const ICONS = ["package", "truck", "credit-card"] as const;

export const faqTopics = defineDesign({
  id: "faq-topics",
  version: 1,
  category: "faq",
  subcategory: "help-center",
  name: L("كروت مواضيع", "Topic cards"),
  description: L("كارت لكل موضوع فيه أهم أسئلته.", "A card per topic with its top questions."),
  keywords: ["faq", "help center", "topics", "cards", "أسئلة", "مركز المساعدة", "مواضيع"],
  tree: (t) =>
    t.section({ label: L("مركز المساعدة", "Help centre") }, [
      t.container(
        [
          modHead(t, {
            label: L("مركز المساعدة", "Help centre"),
            title: L("بتسأل عن إيه؟", "What do you need help with?"),
          }),
          t.grid(
            FAQ_GROUPS.map((g, i) =>
              t.stack(
                [
                  iconDisc(t, ICONS[i % ICONS.length]!, { color: "primary" }),
                  t.heading(g.name, "h3", { style: { fontSize: "xl" } }),
                  t.stack(
                    g.items.map((q) =>
                      t.link("/faq", [t.text(q.title, { style: { fontSize: "sm" } })], {
                        label: L("سؤال", "Question"),
                        style: {
                          ...FLUSH,
                          paddingTop: 6,
                          paddingBottom: 6,
                          hover: { color: "primary" },
                        },
                      }),
                    ),
                    { label: L("الأسئلة", "Questions"), style: { gap: 2 } },
                  ),
                  arrowLink(t, L("كل الأسئلة", "See all"), "/faq"),
                ],
                {
                  label: L("موضوع", "Topic"),
                  style: { ...TILE, gap: 12, alignItems: "start" },
                },
              ),
            ),
            {
              label: L("المواضيع", "Topics"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 16 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
