import { OrderConfirmationEmail } from "../src/index.js";

/** Preview fixture for `pnpm --filter @workspace/emails email:dev`. */
export default function OrderConfirmation() {
  return OrderConfirmationEmail({
    customer: { name: "Omar", email: "customer@example.com" },
    order: {
      orderNumber: "ORD7KQ2M4XA",
      orderDate: "September 2, 2026",
      estimatedDelivery: "September 7, 2026",
    },
    items: [
      {
        productName: "Linen Blend Oversized Shirt",
        variantName: "Sand, L",
        sellerName: "Nile Threads",
        quantity: 2,
        unitPrice: "EGP 1,250",
        lineTotal: "EGP 2,500",
        imageUrl: "https://www.tallaby.com/png product.png",
      },
      {
        productName: "Handwoven Cotton Throw",
        quantity: 1,
        unitPrice: "EGP 890",
        lineTotal: "EGP 890",
      },
    ],
    pricing: {
      subtotal: "EGP 3,390",
      shipping: "EGP 63",
      discount: "EGP 339",
      couponCode: "WELCOME10",
      total: "EGP 3,114",
    },
    paymentMethod: "Cash on delivery",
    shippingAddress: {
      fullName: "Omar Mohamed",
      addressLine1: "12 El Nasr Street",
      addressLine2: "Apartment 5",
      city: "Nasr City",
      state: "Cairo",
      postalCode: "11765",
      country: "Egypt",
      phone: "+20 100 000 0000",
    },
    links: {
      viewOrder: "https://www.tallaby.com/orders/preview",
    },
  });
}
