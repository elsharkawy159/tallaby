/**
 * Pull quote (library X-e): one sentence set very large in the centre, a thin
 * accent rule above it and the author line below.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

export const textQuote = defineDesign({
  id: "text-quote",
  version: 1,
  category: "rich-text",
  subcategory: "quote",
  name: L("اقتباس", "Pull quote"),
  description: L("جملة واحدة كبيرة في المنتصف واسم قائلها.", "One large sentence in the centre with its author."),
  keywords: ["quote", "founder", "statement", "اقتباس", "المؤسس"],
  tree: (t) =>
    t.section({ label: L("اقتباس", "Pull quote") }, [
      t.container(
        [
          t.stack(
            [
              t.box([], { label: L("خط زخرفي", "Accent rule"), style: { background: "accent", minHeight: 4, width: "64px", radius: 999 } }),
              t.heading(L("إن لم نستخدمه نحن، لن نبيعه.", "If we would not use it, we will not sell it."), "h2", {
                role: "quote",
                style: { fontSize: "display-lg", fontWeight: "extrabold", textAlign: "center", lineHeight: "tight", maxWidth: "820px" },
              }),
              t.text(L("مؤسس المتجر", "The store's founder"), { role: "author", style: { color: "muted", fontSize: "md" } }),
            ],
            { label: L("الاقتباس", "Quote"), style: { gap: 20, alignItems: "center" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
