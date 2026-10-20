/**
 * Gifts by person (O-j): four tall photo tiles, one per recipient (for him,
 * for her, for students, for gamers), each a link with a paper label at the
 * bottom. The design's "from" price would be a made-up figure for most
 * stores, so the label says "Shop gifts" instead; the seller sets each link.
 * Mobile shows a 2×2 grid.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";
import { FLUSH, modHead } from "../_modular";
import { BUNDLE_LINK } from "./_shared";

const PEOPLE = [L("ليه", "For him"), L("ليها", "For her"), L("للطلبة", "For students"), L("للجيمرز", "For gamers")];

export const bundleGifts = defineDesign({
  id: "bundle-gifts",
  version: 1,
  category: "bundles",
  subcategory: "gift",
  name: L("هدايا حسب الشخص", "Gifts by person"),
  description: L("أربع صور طويلة، صورة لكل شخص بتشتريله هدية.", "Four tall photo tiles, one for each person you are buying a gift for."),
  keywords: ["bundles", "gifts", "gift guide", "holidays", "هدايا", "هدية", "مناسبات"],
  tree: (t) =>
    t.section({ label: L("هدايا", "Gifts") }, [
      t.container(
        [
          modHead(t, { label: L("هدايا", "Gifts"), title: L("هدية لمين؟", "Who is it for?") }),
          t.grid(
            PEOPLE.map((who, i) =>
              t.link(
                BUNDLE_LINK,
                [
                  t.photo(i, who, { style: { aspectRatio: "portrait", objectFit: "cover", width: "100%", radius: 0 } }),
                  t.row(
                    [
                      t.text(who, { style: { fontWeight: "bold", fontSize: "lg" }, mobile: { fontSize: "md" } }),
                      t.row(
                        [
                          t.text(L("تسوّق", "Shop"), { style: { color: "muted", fontSize: "sm" }, mobile: { hidden: true } }),
                          t.icon("arrow", { style: { fontSize: "md", color: "primary" } }),
                        ],
                        { label: L("الرابط", "Link text"), style: { gap: 6, wrap: false } },
                      ),
                    ],
                    {
                      label: L("الاسم", "Label"),
                      style: {
                        position: "absolute",
                        insetStart: "12px",
                        insetEnd: "12px",
                        insetBottom: "12px",
                        justifyContent: "between",
                        gap: 8,
                        wrap: false,
                        background: "background",
                        radius: 12,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingStart: 16,
                        paddingEnd: 16,
                      },
                      mobile: { insetStart: "8px", insetEnd: "8px", insetBottom: "8px", paddingTop: 8, paddingBottom: 8, paddingStart: 10, paddingEnd: 10 },
                    },
                  ),
                ],
                {
                  label: L("بطاقة", "Tile"),
                  style: { ...FLUSH, position: "relative", radius: 24, overflow: "hidden", color: "foreground", hover: { opacity: 90 } },
                },
              ),
            ),
            { label: L("البطاقات", "Tiles"), role: "items", columns: { desktop: 4, mobile: 2 }, style: { gap: 12 }, mobile: { gap: 10 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
