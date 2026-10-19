/**
 * Customer photos (library G-c): a tinted band with polaroid-style cards, a
 * photo with the customer's name under it, set at alternating heights.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const NAMES = [L("مريم", "Mariam"), L("عمر", "Omar"), L("نور", "Nour"), L("يوسف", "Youssef"), L("سلمى", "Salma")];

export const galleryPolaroids = defineDesign({
  id: "gallery-polaroids",
  version: 1,
  category: "gallery",
  subcategory: "customer-photos",
  name: L("صور العملاء", "Customer photos"),
  description: L("بطاقات بولارويد بصور العملاء وأسمائهم وزر لإرسال صورتك.", "Polaroid cards with customer photos and names, and a send-your-photo button."),
  keywords: ["customers", "ugc", "photos", "community", "صور العملاء", "عملاؤنا"],
  tree: (t) =>
    t.section({ label: L("عملاؤنا", "Our customers"), style: { background: "secondary" } }, [
      t.container(
        [
          t.row(
            [
              t.heading(L("عملاؤنا", "Our customers"), "h2", { role: "title", style: { fontSize: "display-sm" } }),
              t.button(L("أرسل لنا صورتك", "Send us your photo"), "https://wa.me/", "solid", { role: "cta" }),
            ],
            { label: L("رأس القسم", "Section head"), style: { justifyContent: "between", gap: 16, marginBottom: 32 } },
          ),
          t.grid(
            NAMES.map((name, i) =>
              t.stack(
                [
                  t.photo(i + 3, name, { style: { aspectRatio: "square", objectFit: "cover", radius: 4 } }),
                  t.text(name, { style: { textAlign: "center", fontWeight: "semibold", fontSize: "md", italic: true } }),
                ],
                {
                  label: L("صورة", "Polaroid"),
                  style: {
                    background: "background",
                    gap: 12,
                    paddingTop: 12,
                    paddingBottom: 18,
                    paddingStart: 12,
                    paddingEnd: 12,
                    radius: 6,
                    shadow: "md",
                    marginTop: i % 2 ? 28 : 0,
                  },
                  mobile: { marginTop: 0 },
                },
              ),
            ),
            { label: L("الصور", "Photos"), role: "items", columns: { desktop: 5, tablet: 3, mobile: 2 }, style: { gap: 20 }, mobile: { gap: 12 } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
