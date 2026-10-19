/**
 * Side title list (Modular set): a large sticky title and a short intro on the
 * start side; on the end side a 2×2 list of promises, each with an icon tile
 * and a hairline rule above. For About and landing pages.
 */
import { defineDesign } from "../builder";
import { L, iconTile } from "../_kit";
import { PROMISES } from "./_shared";

export const featuresSideTitle = defineDesign({
  id: "features-side-title",
  version: 1,
  category: "features",
  subcategory: "icon-grid",
  name: L("عنوان جانبي", "Side title list"),
  description: L("عنوان كبير ثابت على جنب وقائمة مميزات ٢×٢ بجانبه.", "A large sticky title beside a 2×2 list of features."),
  keywords: ["features", "side title", "editorial", "about", "مميزات", "عنوان جانبي"],
  tree: (t) =>
    t.section({ label: L("المميزات", "Features") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.heading(L("ليه الناس بترجع لنا تاني", "Why people come back"), "h2", {
                    role: "title",
                    style: { fontSize: "display-md", letterSpacing: "tight" },
                  }),
                  t.paragraph(L("أربع حاجات بنلتزم بيها في كل طلب.", "Four things we stand by on every order."), {
                    role: "subtitle",
                    style: { fontSize: "lg" },
                  }),
                ],
                {
                  label: L("العنوان", "Heading"),
                  style: { gap: 14, position: "sticky", insetTop: "96px" },
                  mobile: { position: "relative", insetTop: "auto" },
                },
              ),
              t.grid(
                PROMISES.map((p) =>
                  t.stack(
                    [
                      t.divider({ style: { marginTop: 0, marginBottom: 6 } }),
                      iconTile(t, p.icon),
                      t.heading(p.title, "h3", { style: { fontSize: "lg" } }),
                      t.paragraph(p.text),
                    ],
                    {
                      label: L("ميزة", "Feature"),
                      style: { gap: 12 },
                    },
                  ),
                ),
                {
                  label: L("القائمة", "List"),
                  role: "items",
                  columns: { desktop: 2, mobile: 1 },
                  style: { gap: 40, colSpan: 2 },
                  mobile: { gap: 28, colSpan: 1 },
                },
              ),
            ],
            {
              label: L("التخطيط", "Layout"),
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 56, alignItems: "start" },
              mobile: { gap: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
