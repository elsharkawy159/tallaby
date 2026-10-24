import { PLATFORM_BRAND, storeEmailBrand } from "../src/index.js";

/** Sample data for the React Email previews (`pnpm --filter @workspace/emails email:dev`). */

export const tallaby = PLATFORM_BRAND;

/** A storefront with its own colours, to preview store-branded customer mail. */
export const sampleStore = storeEmailBrand({
  name: "بيت سارة",
  homeUrl: "https://sara.tallaby.com",
  primary: "#6b2d5c",
  accent: "#e8a0bf",
  supportEmail: "hello@sara-home.com",
});

const img = (text: string) => `https://placehold.co/136x136/f7f7f7/145163.png?text=${encodeURIComponent(text)}`;

export const customer = { name: "عمر", email: "customer@example.com" };

export const items = [
  {
    name: "مج حراري استانلس ستيل مع شاليموه - 800 مل",
    variant: "وردي",
    quantity: 1,
    price: "350 ج.م",
    imageUrl: img("Mug"),
    sellerName: "Tallaby",
    sku: "TMB-800-PNK",
  },
  {
    name: "زجاجة مياه رياضية - 1 لتر",
    variant: "أسود",
    quantity: 1,
    price: "180 ج.م",
    imageUrl: img("Bottle"),
    sellerName: "Tallaby",
    sku: "BTL-1L-BLK",
  },
];

export const address = {
  fullName: "عمر محمد",
  lines: ["شارع إحسان عبد القدوس، مصر الجديدة", "القاهرة 11774", "مصر"],
  phone: "01152372358",
};

export const settingsUrl = "https://dashboard.tallaby.com/settings";
