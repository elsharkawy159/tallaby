/**
 * Product anatomy (look-first pilot L5, 2026-11-11; docs/systems/plan.md
 * §10.1): a centred heading over one wide photo of a single product, with
 * four dots on it. Each dot is a `hotspot` element holding the seller's own
 * note about that part (a title and one line): hover, focus or tap opens it.
 *
 * The seller swaps in their product photo, moves each dot onto the part it
 * describes (position fields) and rewrites the notes. The notes are plain
 * seller text, not store data, so the section shows on any store. On phones
 * the photo is square, so the notes still fit inside it.
 *
 * v2 (pilot L7, 2026-11-11): the calm heading of the editorial sections (a
 * quiet eyebrow instead of a chip, the smaller title rising word by word),
 * more air, a 16px corner and a photo that wipes in. Same nodes and field
 * names as v1.
 */
import { defineDesign } from "../builder";
import { editorialHead } from "../_editorial";
import { L } from "../_kit";
import { PRODUCTS_SECTION } from "../products/_shared";

/** Percent from the photo's left and top, with the note each dot opens. */
const NOTES = [
  { x: 28, y: 32, title: L("الخامة", "Material"), body: L("خامة متينة تستحمل الاستخدام اليومي.", "A durable material made for daily use.") },
  { x: 66, y: 26, title: L("التشطيب", "Finish"), body: L("تشطيب نضيف في كل تفصيلة، من أول نظرة.", "A clean finish in every detail, from the first look.") },
  { x: 72, y: 68, title: L("المقاس", "Size"), body: L("مقاس عملي يناسب أغلب الاستخدامات.", "A practical size that suits most uses.") },
  { x: 34, y: 74, title: L("العناية", "Care"), body: L("سهل التنضيف، ويفضل زي ما هو مع الوقت.", "Easy to clean, and it keeps its look over time.") },
] as const;

export const aboutProductAnatomy = defineDesign({
  id: "about-product-anatomy",
  version: 2,
  category: "image-text",
  subcategory: "story",
  name: L("تفاصيل المنتج على الصورة", "Product anatomy"),
  description: L(
    "صورة واحدة لمنتج عليها نقط، كل نقطة تفتح ملحوظة قصيرة عن جزء منه.",
    "One photo of a product with dots; each dot opens a short note about one part of it.",
  ),
  keywords: ["product anatomy", "details", "features", "hotspots", "dots", "image with text", "تفاصيل المنتج", "مميزات", "نقط", "صورة ونص"],
  tree: (t) =>
    t.section({ label: L("تفاصيل المنتج على الصورة", "Product anatomy"), ...PRODUCTS_SECTION }, [
      t.container(
        [
          t.stack(
            [
              editorialHead(t, {
                eyebrow: L("التفاصيل", "The details"),
                title: L("اللي بيفرق في كل جزء", "What matters in every part"),
                subtitle: L("دوس على أي نقطة في الصورة وشوف تفاصيل الجزء ده.", "Tap any dot on the photo to read about that part."),
                align: "center",
              }),
              t.box(
                [
                  t.photo(1, L("صورة المنتج", "Product photo"), {
                    role: "image",
                    style: { objectFit: "cover", width: "100%", aspectRatio: "wide", radius: 0 },
                    mobile: { aspectRatio: "square" },
                    motion: { reveal: "wipe-up" },
                  }),
                  ...NOTES.map((note) => t.hotspot({ x: note.x, y: note.y }, { kind: "text", title: note.title, body: note.body }, { label: L("نقطة ملحوظة", "Note dot") })),
                ],
                {
                  label: L("الصورة", "Photo"),
                  style: { position: "relative", overflow: "hidden", radius: 16, background: "secondary", width: "100%", maxWidth: "1040px" },
                  mobile: { radius: 12 },
                  // The frame does not reveal as one, so the photo plays its own wipe.
                  motion: { reveal: "none" },
                },
              ),
            ],
            { label: L("المحتوى", "Content"), style: { gap: 40, alignItems: "center" }, mobile: { gap: 24 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
