import { SellerStoreOfflineEmail } from "../src/index.js";

export default function SellerStoreOffline() {
  return SellerStoreOfflineEmail({
    locale: "ar",
    storeName: "متجر النور",
    storeCount: 1,
    walletUrl: "https://dashboard.tallaby.com/wallet",
    orderFee: "$0.03",
    minTopUp: "$5",
    feeOnDelivery: true,
  });
}
