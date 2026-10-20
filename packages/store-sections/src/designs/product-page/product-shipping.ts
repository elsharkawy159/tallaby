/**
 * Shipping and returns (library Pd-b "Detail tabs", store-wide panes only):
 * a small title over ruled rows that open in place (delivery, returns,
 * payment). The design's Description and Specs tabs read the product, which
 * no node gives yet, and tabs need a script, so this keeps the panes that are
 * the same for every product and draws them as native open/close rows.
 */
import { defineDesign } from "../builder";
import { L } from "../_kit";

const ROWS = [
  {
    title: L("الشحن والتوصيل", "Shipping"),
    body: L("٤٨ ساعة للقاهرة والجيزة، ومن ٢ لـ ٤ أيام لباقي المحافظات. بنأكد الطلب بمكالمة أو رسالة قبل الشحن.", "48 hours in Cairo and Giza, 2 to 4 days elsewhere. We confirm each order by phone or message before it ships."),
    open: true,
  },
  {
    title: L("الاسترجاع والاستبدال", "Returns and exchanges"),
    body: L("تقدر ترجّع أي منتج مش مستخدم في علبته الأصلية خلال ١٤ يوم من الاستلام، وبنبدّل المقاس أو اللون مرة مجانًا.", "Return any unused item in its original box within 14 days of delivery. We swap a size or colour once for free."),
  },
  {
    title: L("طرق الدفع", "Payment"),
    body: L("الدفع عند الاستلام، أو بالكارت والمحفظة الإلكترونية وقت الطلب.", "Cash on delivery, or pay by card or mobile wallet when you order."),
  },
];

export const productShipping = defineDesign({
  id: "product-shipping",
  version: 1,
  category: "product-page",
  subcategory: "details",
  name: L("الشحن والاسترجاع", "Shipping and returns"),
  description: L("صفوف بتتفتح فيها الشحن والاسترجاع والدفع، نفس الكلام لكل منتج.", "Rows that open for shipping, returns and payment, the same for every product."),
  keywords: ["product page", "shipping", "returns", "payment", "accordion", "صفحة المنتج", "شحن", "استرجاع", "دفع"],
  tree: (t) =>
    t.section({ label: L("الشحن والاسترجاع", "Shipping and returns"), style: { paddingTop: 32, paddingBottom: 32 }, mobile: { paddingTop: 24, paddingBottom: 24 } }, [
      t.container(
        [
          t.stack(
            [
              t.heading(L("قبل ما تطلب", "Before you order"), "h2", { role: "title", style: { fontSize: "2xl" } }),
              t.accordion(ROWS, { label: L("الصفوف", "Rows"), role: "items", style: { width: "100%" } }),
            ],
            { label: L("العمود", "Column"), style: { gap: 16 } },
          ),
        ],
        { label: L("الحاوية", "Container"), style: { maxWidth: "768px" } },
      ),
    ]),
});
