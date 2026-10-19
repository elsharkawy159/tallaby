/**
 * Values grid (library I-e): a centred heading and intro, then three white
 * value cards, each with an accent icon tile, a title and a short paragraph.
 */
import type { ElementIconName } from "../../elements/registry";
import { defineDesign } from "../builder";
import { L, iconTile, sectionHead } from "../_kit";

const VALUES: { icon: ElementIconName; title: ReturnType<typeof L>; text: ReturnType<typeof L> }[] = [
  { icon: "shield", title: L("أصلي فقط", "Only genuine"), text: L("لا تقليد ولا درجة ثانية، أبدًا.", "No copies and no second grade, ever.") },
  { icon: "chat", title: L("نرد بسرعة", "We answer fast"), text: L("متوسط الرد ١٢ دقيقة على واتساب.", "Average WhatsApp reply in 12 minutes.") },
  { icon: "rotate", title: L("استرجاع بلا أسئلة", "No-question returns"), text: L("١٤ يومًا من الاستلام.", "14 days from delivery.") },
];

export const aboutValues = defineDesign({
  id: "about-values",
  version: 1,
  category: "image-text",
  subcategory: "values",
  name: L("قيمنا", "Our values"),
  description: L("عنوان في المنتصف وثلاث بطاقات قيم بأيقونات.", "A centred heading over three value cards with icons."),
  keywords: ["about", "values", "mission", "قيم", "مبادئ", "من نحن"],
  tree: (t) =>
    t.section({ label: L("قيمنا", "Our values"), style: { background: "secondary" } }, [
      t.container(
        [
          sectionHead(t, {
            title: L("ما نؤمن به", "What we believe"),
            subtitle: L("ثلاثة أشياء لا نتنازل عنها.", "Three things we never compromise on."),
            align: "center",
          }),
          t.grid(
            VALUES.map((v) =>
              t.card(
                [
                  t.stack(
                    [
                      iconTile(t, v.icon, { background: "accent", color: "foreground" }),
                      t.heading(v.title, "h3", { style: { fontSize: "lg" } }),
                      t.paragraph(v.text),
                    ],
                    { label: L("المحتوى", "Content"), style: { gap: 12 } },
                  ),
                ],
                { label: L("قيمة", "Value"), style: { paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28, radius: 24, borderWidth: 0 } },
              ),
            ),
            {
              label: L("القيم", "Values"),
              role: "items",
              columns: { desktop: 3, mobile: 1 },
              style: { gap: 20, marginTop: 40 },
              mobile: { gap: 14, marginTop: 28 },
            },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
