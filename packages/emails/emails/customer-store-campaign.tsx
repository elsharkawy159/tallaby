import { StoreCampaignEmail } from "../src/index.js";
import { sampleStore } from "./_fixtures.js";

export default function CustomerStoreCampaign() {
  return StoreCampaignEmail({
    locale: "ar",
    brand: sampleStore,
    storeName: sampleStore.name,
    subject: "تخفيضات نهاية الموسم وصلت",
    body: "أهلًا بيك!\n\nخصم **20%** على كل المفارش لحد آخر الأسبوع.\n\n- شحن سريع لكل المحافظات\n- استبدال خلال 14 يوم",
    products: [
      { name: "مفرش كتان", imageUrl: null, url: "https://sara.tallaby.com/products/linen" },
      { name: "طقم فوط قطن", imageUrl: null, url: "https://sara.tallaby.com/products/towels" },
    ],
    links: { shop: "https://sara.tallaby.com", unsubscribe: "https://sara.tallaby.com/api/email/unsubscribe?token=x" },
  });
}
