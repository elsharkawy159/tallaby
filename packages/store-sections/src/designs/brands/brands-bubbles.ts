/**
 * Logo bubbles (Modular set): brand wordmarks inside round shelf bubbles of
 * three sizes in a loose wave, under a short centred title. A light, friendly
 * brand row for lifestyle stores; equal bubbles on mobile.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH } from "../_modular";
import { wordmark } from "./_shared";

const SIZES = [150, 120, 170, 130, 160, 120, 145];
const LIFT = [0, 30, 6, 36, 0, 24, 8];

export const brandsBubbles = defineDesign({
  id: "brands-bubbles",
  version: 1,
  category: "brands",
  subcategory: "logo-carousel",
  name: L("لوجوهات دائرية", "Logo bubbles"),
  description: L("شعارات الماركات في دوائر بأحجام مختلفة.", "Brand logos in round bubbles of different sizes."),
  keywords: ["brands", "logos", "bubbles", "playful", "ماركات", "دوائر"],
  tree: (t) =>
    t.section({ label: L("الماركات", "Brands") }, [
      t.container(
        [
          t.heading(L("ماركات بنحبها", "Brands we love"), "h2", {
            role: "title",
            style: {
              fontSize: "display-sm",
              letterSpacing: "tight",
              textAlign: "center",
              marginBottom: 32,
            },
          }),
          t.row(
            SIZES.map((size, i) =>
              t.stack(
                [
                  t.link("/products", [wordmark(t, i, "xl")], {
                    label: L("رابط الماركة", "Brand link"),
                    style: FLUSH,
                  }),
                ],
                {
                  label: L("فقاعة", "Bubble"),
                  style: {
                    background: "secondary",
                    radius: 999,
                    width: `${size}px`,
                    minHeight: size,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: LIFT[i],
                  },
                  mobile: { width: "100px", minHeight: 100, marginTop: 0 },
                },
              ),
            ),
            {
              label: L("الفقاعات", "Bubbles"),
              role: "items",
              style: { gap: 16, justifyContent: "center", alignItems: "start" },
              mobile: { gap: 10 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
