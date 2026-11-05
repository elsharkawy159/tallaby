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
        unitPrice: "١٬٢٥٠ جنيه",
        lineTotal: "٢٬٥٠٠ جنيه",
        imageUrl: "https://placehold.co/112x112/f7f7f7/145163.png?text=Shirt",
      },
      {
        productName: "بطانية قطن منسوجة يدويًا",
        quantity: 1,
        unitPrice: "٨٩٠ جنيه",
        lineTotal: "٨٩٠ جنيه",
      },
    ],
    pricing: {
      subtotal: "٣٬٣٩٠ جنيه",
      shipping: "٦٣ جنيه",
      discount: "٣٣٩ جنيه",
      couponCode: "WELCOME10",
      total: "٣٬١١٤ جنيه",
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
