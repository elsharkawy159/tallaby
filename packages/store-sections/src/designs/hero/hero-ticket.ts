/**
 * Ticket slides hero (library R-a): one large campaign photo with a paper
 * "ticket" in its bottom-start corner, and the next two campaigns stacked on
 * the end side so the visitor sees what else is on.
 */
import { defineDesign, type DesignText, type TreeBuilder } from "../builder";
import { L } from "../_kit";

const side = (t: TreeBuilder, index: number, no: DesignText, title: DesignText) =>
  t.link(
    "/products",
    [
      t.photo(index, title, { role: "image", style: { aspectRatio: "landscape", objectFit: "cover", radius: 20 } }),
      t.row([t.text(no, { style: { fontWeight: "bold", color: "primary" } }), t.text(title, { style: { fontWeight: "semibold" } })], {
        label: L("العنوان", "Title"),
        style: { gap: 8, marginTop: 10 },
      }),
    ],
    { label: L("حملة تالية", "Next campaign"), style: { paddingTop: 0, paddingBottom: 0, paddingStart: 0, paddingEnd: 0, hover: { opacity: 85 } } },
  );

export const heroTicket = defineDesign({
  id: "hero-ticket",
  version: 1,
  category: "hero",
  subcategory: "full-width",
  name: L("حملات بتذكرة", "Ticket slides"),
  description: L(
    "صورة حملة كبيرة عليها تذكرة بالعنوان، وبجانبها الحملتان التاليتان.",
    "A large campaign photo with a ticket, and the next two campaigns beside it.",
  ),
  keywords: ["hero", "slider", "campaigns", "سلايدر", "حملات"],
  tree: (t) =>
    t.section({ label: L("الحملات", "Campaigns"), style: { paddingTop: 24, paddingBottom: 48 } }, [
      t.container(
        [
          t.grid(
            [
              t.box(
                [
                  t.photo(0, L("صورة الحملة", "Campaign photo"), {
                    role: "image",
                    style: { aspectRatio: "landscape", objectFit: "cover", radius: 28 },
                    mobile: { aspectRatio: "portrait", radius: 20 },
                  }),
                  t.stack(
                    [
                      t.text(L("٠١", "01"), { style: { fontWeight: "extrabold", color: "primary", fontSize: "lg" } }),
                      t.badge(L("مجموعة الخريف", "Autumn edit"), { role: "eyebrow" }),
                      t.heading(L("ألوان هادئة لأيام أطول", "Soft colours for longer days"), "h1", {
                        role: "title",
                        style: { fontSize: "display-sm", fontWeight: "extrabold", lineHeight: "tight" },
                      }),
                      t.button(L("تسوّق المجموعة", "Shop the edit"), "/products", "solid", { role: "cta" }),
                    ],
                    {
                      label: L("التذكرة", "Ticket"),
                      style: {
                        position: "absolute",
                        insetBottom: "24px",
                        insetStart: "24px",
                        maxWidth: "420px",
                        background: "background",
                        radius: 20,
                        gap: 10,
                        alignItems: "start",
                        paddingTop: 24,
                        paddingBottom: 24,
                        paddingStart: 24,
                        paddingEnd: 24,
                        shadow: "md",
                      },
                      mobile: {
                        insetBottom: "12px",
                        insetStart: "12px",
                        insetEnd: "12px",
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingStart: 16,
                        paddingEnd: 16,
                      },
                    },
                  ),
                ],
                {
                  label: L("الحملة الرئيسية", "Main campaign"),
                  style: { position: "relative", minHeight: 420, colSpan: 2 },
                  mobile: { minHeight: 360, colSpan: 1 },
                },
              ),
              t.stack([side(t, 1, L("٠٢", "02"), L("عروض الأسبوع", "This week's offers")), side(t, 2, L("٠٣", "03"), L("هدايا مختارة", "Picked gifts"))], {
                label: L("الحملات التالية", "Next campaigns"),
                style: { gap: 20 },
                mobile: { direction: "row", gap: 12 },
              }),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 3, mobile: 1 }, style: { gap: 20 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
