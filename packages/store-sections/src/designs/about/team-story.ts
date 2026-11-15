/**
 * Our story (library Y-a): a large opening sentence across the top, then two
 * columns: a tall lifestyle photo on the start side and two short paragraphs
 * with a signature on the end side. The top of an About page. On mobile the
 * photo goes under the title and crops wider.
 */
import { aboutDesign } from "./_rules";
import { L } from "../_kit";
import { dotLabel } from "../_modular";

export const teamStory = aboutDesign({
  id: "team-story",
  version: 2,
  category: "about",
  subcategory: "story",
  name: L("قصتنا", "Our story"),
  description: L("جملة افتتاحية كبيرة، وصورة جنب فقرتين وتوقيع المؤسس.", "A big opening line, then a photo beside two paragraphs and the founder's signature."),
  keywords: ["about", "story", "founder", "من نحن", "قصتنا", "حكايتنا"],
  tree: (t) =>
    t.section({ label: L("قصتنا", "Our story") }, [
      t.container(
        [
          t.stack(
            [
              dotLabel(t, L("قصتنا", "Our story")),
              t.heading(L("بدأنا بفكرة بسيطة: منتجات جيدة بأسعار واضحة.", "We started with a simple idea: good products at clear prices."), "h2", {
                role: "title",
                style: { fontSize: "display-lg", letterSpacing: "tight", lineHeight: "tight", maxWidth: "20ch" },
              }),
            ],
            { label: L("العنوان", "Heading"), role: "intro", style: { gap: 12, marginBottom: 40 }, mobile: { marginBottom: 24 } },
          ),
          t.grid(
            [
              t.photo(0, L("صورة من المتجر", "A photo from the store"), {
                role: "image",
                style: { aspectRatio: "portrait", objectFit: "cover", radius: 24, width: "100%" },
                mobile: { aspectRatio: "landscape" },
              }),
              t.stack(
                [
                  t.paragraph(
                    L(
                      "بدأنا صغارًا، نختار كل منتج بعناية. واليوم نقدّم تشكيلة أوسع بالطريقة نفسها.",
                      "We started small, choosing every product with care. Today we offer a wider range, chosen the same way.",
                    ),
                    { role: "body", style: { fontSize: "lg", lineHeight: "relaxed", color: "foreground" }, mobile: { fontSize: "md" } },
                  ),
                  t.paragraph(L("ما زلنا نختار كل منتج بعناية، ونهتم بكل تفاصيله.", "We still choose every product with care, down to the details."), {
                    role: "body",
                    style: { fontSize: "lg", lineHeight: "relaxed", color: "foreground" },
                    mobile: { fontSize: "md" },
                  }),
                  t.text(L("— منى، المؤسسة", "— Mona, founder"), {
                    role: "signature",
                    style: { fontFamily: "heading", fontWeight: "semibold", color: "muted" },
                  }),
                ],
                { label: L("النص", "Text"), style: { gap: 16 } },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 2, tablet: 2, mobile: 1 },
              style: { gap: 56, alignItems: "end" },
              tablet: { gap: 32 },
              mobile: { gap: 24 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
