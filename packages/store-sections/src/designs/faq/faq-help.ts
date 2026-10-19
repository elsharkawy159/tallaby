/**
 * Help centre (library Q-e): a tinted header with a big title and a search
 * box that opens the store search, then the questions under group headings.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FAQ_GROUPS } from "./_faq";

export const faqHelp = defineDesign({
  id: "faq-help",
  version: 1,
  category: "faq",
  subcategory: "help-center",
  name: L("مركز المساعدة", "Help centre"),
  description: L("رأس ملون بعنوان كبير وبحث، ثم الأسئلة في مجموعات.", "A tinted header with a big title and search, then grouped questions."),
  keywords: ["help", "faq", "support", "مساعدة", "أسئلة", "دعم"],
  tree: (t) =>
    t.section({ label: L("مركز المساعدة", "Help centre"), style: { paddingTop: 0 } }, [
      t.stack(
        [
          t.heading(L("كيف نقدر نساعدك؟", "How can we help?"), "h1", {
            role: "title",
            style: { fontSize: "display-md", fontWeight: "extrabold", textAlign: "center" },
          }),
          t.stack(
            [
              t.link(
                "/products",
                [
                  t.row(
                    [
                      t.icon("search", { style: { fontSize: "lg", color: "muted" } }),
                      t.text(L("ابحث في الأسئلة…", "Search questions…"), { style: { color: "muted", fontSize: "md" } }),
                    ],
                    {
                      label: L("المحتوى", "Content"),
                      style: { gap: 10, wrap: false },
                    },
                  ),
                ],
                {
                  label: L("البحث", "Search"),
                  style: { background: "background", radius: 999, paddingTop: 16, paddingBottom: 16, paddingStart: 22, paddingEnd: 22, shadow: "sm" },
                },
              ),
            ],
            { label: L("خانة البحث", "Search box"), style: { width: "100%", maxWidth: "560px" } },
          ),
        ],
        {
          label: L("الرأس", "Header"),
          style: { background: "secondary", alignItems: "center", gap: 20, paddingTop: 64, paddingBottom: 64, paddingStart: 16, paddingEnd: 16 },
          mobile: { paddingTop: 40, paddingBottom: 40 },
        },
      ),
      t.container(
        [
          t.grid(
            FAQ_GROUPS.map((g) =>
              t.stack([t.badge(g.name, { style: { color: "primary" } }), t.accordion(g.items, { label: L("الأسئلة", "Questions"), role: "items" })], {
                label: L("مجموعة", "Group"),
                style: { gap: 8 },
              }),
            ),
            {
              label: L("المجموعات", "Groups"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 32, alignItems: "start", marginTop: 40 },
              mobile: { gap: 24, marginTop: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
