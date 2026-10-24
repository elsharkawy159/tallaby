import { SellerStoreCreatedEmail } from "../src/index.js";
import { settingsUrl } from "./_fixtures.js";

export default function SellerStoreCreated() {
  return SellerStoreCreatedEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    storeUrl: "https://tallaby.tallaby.com",
    storeHost: "tallaby.tallaby.com",
    links: {
      addProduct: "https://dashboard.tallaby.com/products/add",
      design: "https://dashboard.tallaby.com/stores",
      help: "https://tallaby.com/help",
    },
  });
}
