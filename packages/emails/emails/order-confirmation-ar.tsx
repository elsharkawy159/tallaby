import { OrderConfirmationEmail } from "../src/index.js";

/** Arabic preview — `preferred_language = ar`. */
export default function OrderConfirmationAr() {
  return OrderConfirmationEmail({
    locale: "ar",
    customer: { name: "عمر", email: "customer@example.com" },
    order: {
      orderNumber: "ORD7KQ2M4XA",
      orderDate: "٢ سبتمبر ٢٠٢٦",
      estimatedDelivery: "٧ سبتمبر ٢٠٢٦",
    },
    items: [
      {
        productName: "قميص كتان واسع",
        variantName: "رملي، L",
        sellerName: "نايل ثريدز",
        quantity: 2,
        unitPrice: "١٬٢٥٠ ج.م.",
        lineTotal: "٢٬٥٠٠ ج.م.",
        imageUrl: "https://placehold.co/112x112/f7f7f7/145163.png?text=Shirt",
      },
      {
        productName: "بطانية قطن منسوجة يدويًا",
        quantity: 1,
        unitPrice: "٨٩٠ ج.م.",
        lineTotal: "٨٩٠ ج.م.",
      },
    ],
    pricing: {
      subtotal: "٣٬٣٩٠ ج.م.",
      shipping: "٦٣ ج.م.",
      discount: "٣٣٩ ج.م.",
      couponCode: "WELCOME10",
      total: "٣٬١١٤ ج.م.",
    },
    paymentMethod: "الدفع عند الاستلام",
    shippingAddress: {
      fullName: "عمر محمد",
      addressLine1: "١٢ شارع النصر",
      addressLine2: "شقة ٥",
      city: "مدينة نصر",
      state: "القاهرة",
      postalCode: "11765",
      country: "مصر",
      phone: "+20 100 000 0000",
    },
    links: {
      viewOrder: "https://www.tallaby.com/ar/orders/preview",
    },
  });
}
