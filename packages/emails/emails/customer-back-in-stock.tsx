import { BackInStockEmail } from "../src/index.js";
import { sampleStore } from "./_fixtures.js";

export default function CustomerBackInStock() {
  return BackInStockEmail({
    locale: "ar",
    brand: sampleStore,
    storeName: sampleStore.name,
    product: { name: "قميص كتان", variant: "أبيض / L", price: "450 ج.م", imageUrl: null },
    links: { product: "https://shop.tallaby.com/products/linen-shirt", unsubscribe: "https://shop.tallaby.com/api/stock-alerts/unsubscribe?token=x" },
  });
}
