/**
 * Classic policy (library X-a, Classic template policy pages): a sticky list
 * of parts on the start side and a narrow article on the end side, a "last
 * updated" line, then part headings with paragraphs. Shared by Terms,
 * Privacy, Shipping and Returns.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const PARTS = [
  {
    title: L("الاسترجاع خلال ١٤ يومًا", "14-day returns"),
    text: L(
      "يمكنك إرجاع أي منتج غير مستخدم في علبته الأصلية خلال ١٤ يومًا من الاستلام.",
      "Return any unused item in its original box within 14 days of delivery.",
    ),
  },
  {
    title: L("كيف ترجع منتجًا", "How to return"),
    text: L("راسلنا على واتساب برقم الطلب وسنرتب استلامه من عنوانك.", "Message us on WhatsApp with your order number and we arrange pickup from your address."),
  },
  {
    title: L("استرداد المبلغ", "Refunds"),
    text: L(
      "مدفوعات البطاقة والمحفظة تُرد خلال ٧ إلى ١٤ يومًا، وطلبات الدفع عند الاستلام تُرد على محفظة أو حساب بنكي.",
      "Card and wallet payments are refunded within 7 to 14 days; cash orders by wallet or bank transfer.",
    ),
  },
  {
    title: L("الاستبدال", "Exchanges"),
    text: L("تريد مقاسًا أو لونًا آخر؟ نستبدله مجانًا مرة واحدة.", "Want another size or colour? We swap it for free once."),
  },
];

export const textPolicy = defineDesign({
  id: "text-policy",
  version: 1,
  category: "rich-text",
  subcategory: "policy",
  name: L("سياسة كلاسيك", "Classic policy"),
  description: L("قائمة أجزاء جانبية ونص سياسة بعناوين وفقرات.", "A side list of parts and a policy article with headings and paragraphs."),
  keywords: ["policy", "terms", "privacy", "returns", "shipping", "سياسة", "الشروط", "الخصوصية", "الاسترجاع"],
  tree: (t) =>
    t.section({ label: L("السياسة", "Policy") }, [
      t.container(
        [
          t.grid(
            [
              t.stack(
                [
                  t.text(L("المحتوى", "Contents"), { style: { color: "muted", fontWeight: "semibold", marginBottom: 6 } }),
                  ...PARTS.map((p, i) =>
                    t.text(p.title, { style: { fontWeight: "medium", paddingTop: 6, paddingBottom: 6, ...(i === 0 && { color: "primary" }) } }),
                  ),
                ],
                {
                  label: L("الأجزاء", "Parts"),
                  style: { gap: 0, position: "sticky", insetTop: "96px" },
                  mobile: { position: "relative", insetTop: "0px", hidden: true },
                },
              ),
              t.stack(
                [
                  t.text(L("آخر تحديث: ١ سبتمبر ٢٠٢٦", "Last updated: 1 Sep 2026"), { style: { color: "muted" } }),
                  ...PARTS.flatMap((p) => [
                    t.heading(p.title, "h2", { style: { fontSize: "2xl", marginTop: 16 } }),
                    t.paragraph(p.text, { style: { fontSize: "md", color: "foreground" } }),
                  ]),
                ],
                { label: L("النص", "Article"), role: "body", style: { gap: 10, colSpan: 3, maxWidth: "720px" }, mobile: { colSpan: 1 } },
              ),
            ],
            { label: L("التخطيط", "Layout"), columns: { desktop: 4, mobile: 1 }, style: { gap: 48, alignItems: "start" } },
          ),
        ],
        { label: L("الحاوية", "Container") },
      ),
    ]),
});
