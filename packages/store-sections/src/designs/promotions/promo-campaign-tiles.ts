/**
 * Campaign tiles (Claude Design premium set, promoTiles; 2026-10-27): two
 * photo tiles side by side, each with an eyebrow, a title and a light button
 * centred on a dim layer and a dark fade at its foot. Points to two campaigns
 * or collections at once. A 4:3 crop on desktop keeps the tiles from getting
 * too tall; stacked in a portrait crop on phones.
 */
import type { NodeTemplate } from "../../elements/tree";
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

type Tile = { photo: number; eyebrow: DesignText; title: DesignText; cta: DesignText; href: string };

const TILES: Tile[] = [
  { photo: 0, eyebrow: L("وصل حالاً", "Just arrived"), title: L("بدل وتفصيل", "Tailoring"), cta: L("تسوّق الآن", "Shop now"), href: "/products" },
  { photo: 1, eyebrow: L("صناعة القاهرة", "Made in Cairo"), title: L("شنط جلد", "Leather bags"), cta: L("تسوّق الآن", "Shop now"), href: "/products" },
];

function tile(t: TreeBuilder, o: Tile): NodeTemplate {
  return t.box(
    [
      t.photo(o.photo, o.title, {
        role: "image",
        style: { aspectRatio: "landscape", objectFit: "cover", width: "100%", radius: 0 },
        mobile: { aspectRatio: "portrait" },
      }),
      t.box([], { label: L("التعتيم", "Dim"), style: { ...FILL, background: "black", opacity: 20 } }),
      t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
      t.stack(
        [
          t.stack(
            [
              t.text(o.eyebrow, { role: "eyebrow", style: { color: "white", fontSize: "sm", fontWeight: "semibold", opacity: 90, textAlign: "center" } }),
              t.heading(o.title, "h3", {
                role: "title",
                style: { color: "white", fontSize: "display-sm", fontWeight: "semibold", lineHeight: "tight", textAlign: "center" },
                mobile: { fontSize: "3xl" },
              }),
            ],
            { label: L("العنوان", "Heading"), style: { gap: 8, alignItems: "center" } },
          ),
          t.button(o.cta, o.href, "light", { role: "cta" }),
        ],
        {
          label: L("النص", "Copy"),
          style: { position: "absolute", insetBottom: "0px", insetStart: "0px", insetEnd: "0px", gap: 18, alignItems: "center", justifyContent: "end", paddingTop: 32, paddingBottom: 32, paddingStart: 20, paddingEnd: 20 },
          mobile: { paddingTop: 24, paddingBottom: 24, paddingStart: 16, paddingEnd: 16 },
        },
      ),
    ],
    {
      label: L("مربع حملة", "Campaign tile"),
      style: { position: "relative", overflow: "hidden", radius: 16, background: "secondary" },
    },
  );
}

export const promoCampaignTiles = defineDesign({
  id: "promo-campaign-tiles",
  version: 1,
  category: "promotions",
  subcategory: "tiles",
  name: L("مربعات الحملات", "Campaign tiles"),
  description: L(
    "مربعين بصور كبيرة لحملتين أو مجموعتين، في كل واحد عنوان وزر.",
    "Two large photo tiles for two campaigns or collections, each with a title and a button.",
  ),
  keywords: ["promotion", "campaign", "tiles", "collections", "premium", "حملة", "مجموعات", "عروض"],
  tree: (t) =>
    t.section({ label: L("مربعات الحملات", "Campaign tiles") }, [
      t.container(
        [
          t.grid(
            TILES.map((o) => tile(t, o)),
            { label: L("المربعات", "Tiles"), role: "items", columns: { desktop: 2, tablet: 2, mobile: 1 }, style: { gap: 24 }, tablet: { gap: 16 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
