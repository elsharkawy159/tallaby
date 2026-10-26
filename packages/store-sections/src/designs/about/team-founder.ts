/**
 * Founder note (library Y-e): a brand-coloured panel with a large sun quote
 * mark, the founder's words in big type, and an initial with the name and
 * role at the bottom. For a personal touch on the About or home page.
 */
import { aboutDesign } from "./_rules";
import { L, ON_BRAND } from "../_kit";
import { BRAND_TILE, who } from "../_modular";

export const teamFounder = aboutDesign({
  id: "team-founder",
  version: 2,
  category: "about",
  subcategory: "story",
  name: L("كلمة المؤسس", "Founder note"),
  description: L("كلمة المؤسس بخط كبير على لوحة بلون المتجر.", "The founder's words in big type on a brand-coloured panel."),
  keywords: ["about", "founder", "quote", "owner", "من نحن", "المؤسس", "كلمة"],
  tree: (t) =>
    t.section({ label: L("كلمة المؤسس", "Founder note") }, [
      t.container(
        [
          t.stack(
            [
              t.icon("quote", { style: { fontSize: "6xl", color: "accent" }, mobile: { fontSize: "4xl" } }),
              t.text(
                L(
                  "عايزين كل حد يشتري من عندنا مرة يرجع تاني من غير ما نفكره.",
                  "We want everyone who buys from us once to come back without being reminded.",
                ),
                {
                  role: "quote",
                  style: { ...ON_BRAND, fontFamily: "heading", fontSize: "4xl", fontWeight: "semibold", letterSpacing: "tight", lineHeight: "snug", maxWidth: "28ch" },
                  mobile: { fontSize: "2xl" },
                },
              ),
              who(t, L("م", "M"), L("منى عادل", "Mona Adel"), L("المؤسسة", "Founder"), 1, { onBrand: true }),
            ],
            {
              label: L("اللوحة", "Panel"),
              style: { ...BRAND_TILE, gap: 28, paddingTop: 56, paddingBottom: 56, paddingStart: 56, paddingEnd: 56 },
              mobile: { gap: 20, paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
