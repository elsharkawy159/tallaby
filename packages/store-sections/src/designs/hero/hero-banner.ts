/**
 * Image banner (Claude Design premium set, `heroBanner`; 2026-10-27): one
 * photo from edge to edge with the message at its foot on a dark fade, and a
 * slim brand-coloured strip under it with a live countdown to the next drop.
 * The countdown has no date until the seller sets one, so the store shows
 * nothing there until then (`elements/countdown.tsx`). The heading is the
 * page's `h1` and the photo is never hidden by the reveal (LCP).
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const FILL = { position: "absolute", insetTop: "0px", insetBottom: "0px", insetStart: "0px", insetEnd: "0px" } as const;

export const heroBanner = defineDesign({
  id: "hero-banner",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("بانر بعداد", "Image banner with countdown"),
  description: L(
    "صورة كبيرة بعرض الشاشة وعليها رسالة واحدة، وتحتها شريط بعداد تنازلي للإطلاق الجاي.",
    "One edge-to-edge photo with a single message, and a strip under it counting down to the next drop.",
  ),
  keywords: ["hero", "banner", "countdown", "launch", "full width", "premium", "واجهة", "بانر", "عداد", "إطلاق"],
  tree: (t) =>
    t.section({ label: L("الواجهة", "Hero"), style: { paddingTop: 0, paddingBottom: 0 }, mobile: { paddingTop: 0, paddingBottom: 0 } }, [
      t.box(
        [
          t.photo(0, L("صورة الواجهة", "Hero photo"), {
            role: "image",
            style: { aspectRatio: "banner", objectFit: "cover", width: "100%", radius: 0 },
            tablet: { aspectRatio: "wide" },
            mobile: { aspectRatio: "portrait" },
          }),
          t.box([], { label: L("التعتيم", "Dim"), style: { ...FILL, background: "black", opacity: 25 } }),
          t.box([], { label: L("التظليل", "Shade"), style: { ...FILL, gradient: "ink-fade" } }),
          t.container(
            [
              t.stack(
                [
                  t.badge(L("موسم جديد", "New season"), {
                    role: "eyebrow",
                    style: { background: "white", color: "black", fontWeight: "semibold" },
                  }),
                  t.heading(L("ادخل الموسم الجديد بخطوة واثقة", "Step into the season"), "h1", {
                    role: "title",
                    style: { color: "white", fontSize: "display-lg", fontWeight: "bold", lineHeight: "tight" },
                  }),
                  t.paragraph(L("قطع مريحة وطبقات سهلة تتلبس كل يوم.", "Easy layers and comfortable pieces for every day."), {
                    role: "subtitle",
                    style: { color: "white", fontSize: "lg", opacity: 90, maxWidth: "520px" },
                    mobile: { fontSize: "md" },
                  }),
                  t.row(
                    [
                      t.button(L("تسوّق المجموعة", "Shop the edit"), "/products", "light", { role: "cta" }),
                      t.button(L("الجديد", "New in"), "/products?sort=newest", "outline", {
                        role: "cta2",
                        style: { background: "transparent", color: "white", borderColor: "white" },
                      }),
                    ],
                    { label: L("الأزرار", "Buttons"), style: { gap: 12, paddingTop: 8 } },
                  ),
                ],
                { label: L("النص", "Copy"), style: { gap: 16, alignItems: "start", maxWidth: "760px" }, mobile: { gap: 12 } },
              ),
            ],
            {
              label: L("الحاوية", "Container"),
              style: { position: "absolute", insetBottom: "64px", insetStart: "0px", insetEnd: "0px" },
              mobile: { insetBottom: "28px" },
            },
          ),
        ],
        { label: L("الصورة", "Photo frame"), style: { position: "relative", background: "black", overflow: "hidden" } },
      ),
      t.box(
        [
          t.container(
            [
              t.row(
                [
                  t.stack(
                    [
                      t.text(L("الإطلاق الجاي", "The next drop"), { role: "label", style: { fontWeight: "bold", fontSize: "lg", color: "primaryInk" } }),
                      t.text(L("قطع جديدة بتنزل كل خميس، كن أول من يشوفها.", "New pieces land every Thursday. Be the first to see them."), {
                        role: "text",
                        style: { color: "primaryInk", opacity: 85, fontSize: "sm" },
                      }),
                    ],
                    { label: L("نص الشريط", "Strip copy"), style: { gap: 4, maxWidth: "420px" } },
                  ),
                  t.countdown({ label: L("العداد", "Countdown"), style: { color: "primaryInk" } }),
                  t.button(L("شوف الجديد", "See what's new"), "/products?sort=newest", "light", { role: "cta3" }),
                ],
                {
                  label: L("الشريط", "Strip row"),
                  style: { gap: 24, alignItems: "center", justifyContent: "between" },
                  mobile: { gap: 14, alignItems: "start", direction: "column" },
                },
              ),
            ],
            { label: L("الحاوية", "Container") },
          ),
        ],
        {
          label: L("شريط العداد", "Countdown strip"),
          style: { background: "primary", paddingTop: 20, paddingBottom: 20 },
          mobile: { paddingTop: 18, paddingBottom: 18 },
        },
      ),
    ]),
});
