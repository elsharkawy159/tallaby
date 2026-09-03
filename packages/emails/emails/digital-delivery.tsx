import { DigitalDeliveryEmail } from "../src/index.js";

export default function DigitalDelivery() {
  return DigitalDeliveryEmail({
    customerName: "Omar",
    orderNumber: "ORD7KQ2M4XA",
    locale: "en",
    items: [
      {
        productName: "Pattern pack",
        downloadUrl: "https://www.tallaby.com/profile/downloads",
        licenseKey: "TLBY-XXXX-2026",
        expiresAt: "2027-01-01T00:00:00.000Z",
        maxDownloads: 5,
      },
    ],
  });
}
