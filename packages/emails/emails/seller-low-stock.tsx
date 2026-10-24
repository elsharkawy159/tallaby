import { SellerLowStockEmail } from "../src/index.js";
import { items, settingsUrl } from "./_fixtures.js";

export default function SellerLowStock() {
  return SellerLowStockEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    items: [
      { ...items[0]!, remaining: 2, soldThisWeek: 14 },
      { ...items[1]!, remaining: 5, soldThisWeek: 9 },
    ],
    links: { products: "https://dashboard.tallaby.com/products" },
  });
}
