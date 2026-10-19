/**
 * Instant prints (Modular set): five photos styled as white instant prints
 * with a handle under each, in a loose row on a shelf band. A fun customer
 * photo or event wall. The prints keep level (there is no rotation style), and
 * stagger up and down instead.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const HANDLES = [L("@منى", "@mona"), L("@كريم", "@karim"), L("@سارة", "@sara"), L("@يوسف", "@yousef"), L("@نور", "@nour")];
const OFFSETS = [0, 28, 8, 36, 4];

export const galleryPrints = defineDesign({
  id: "gallery-prints",
  version: 1,
  category: "gallery",
  subcategory: "customer-photos",
  name: L("صور مطبوعة", "Instant prints"),
  description: L("صور العملاء كأنها صور فورية مطبوعة على شريط ملوّن.", "Customer photos as instant prints on a soft band."),
  keywords: ["gallery", "customers", "prints", "polaroid", "playful", "صور العملاء", "معرض"],
  tree: (t) =>
    t.section(
      {
        label: L("صور العملاء", "Customer photos"),
        style: { background: "secondary" },
      },
      [
        t.container(
          [
            t.heading(L("صوركم معانا", "Your photos with us"), "h2", {
              role: "title",
              style: {
                fontSize: "display-sm",
                letterSpacing: "tight",
                textAlign: "center",
                marginBottom: 36,
              },
              mobile: { marginBottom: 20 },
            }),
            t.grid(
              HANDLES.map((h, i) =>
                t.stack(
                  [
                    t.photo(i + 2, L("صورة عميل", "Customer photo"), {
                      style: {
                        aspectRatio: "square",
                        objectFit: "cover",
                        radius: 4,
                        width: "100%",
                      },
                    }),
                    t.text(h, {
                      style: {
                        textAlign: "center",
                        fontWeight: "semibold",
                        fontSize: "sm",
                      },
                    }),
                  ],
                  {
                    label: L("صورة مطبوعة", "Print"),
                    style: {
                      background: "background",
                      gap: 12,
                      paddingTop: 10,
                      paddingBottom: 16,
                      paddingStart: 10,
                      paddingEnd: 10,
                      shadow: "md",
                      marginTop: OFFSETS[i],
                    },
                    mobile: { marginTop: 0, ...(i === 4 && { hidden: true }) },
                  },
                ),
              ),
              {
                label: L("الصور", "Prints"),
                role: "items",
                columns: { desktop: 5, mobile: 2 },
                style: { gap: 20, alignItems: "start" },
                mobile: { gap: 12 },
              },
            ),
          ],
          { label: L("الحاوية", "Container") },
        ),
      ],
    ),
});
