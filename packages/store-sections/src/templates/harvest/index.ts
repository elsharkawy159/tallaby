/**
 * Harvest (template 18, online grocery; Claude Design "Storefront
 * Templates"): clean white paper, a leaf green for actions and a sunny
 * yellow highlight, Tajawal throughout and 12px corners. A quick-shop
 * grocery: the free-delivery goal, a search hero, aisles, a tabbed shelf,
 * weekly offers, everyday essentials and promises. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): vegetable boxes, fruit,
 * grains, bread and spices. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const HARVEST_KEY = "harvest";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(HARVEST_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  vegBox: pexels(4451870, 900),
  greensBox: pexels(7657074, 900),
  pepperBox: pexels(12181754, 900),
  fruitBasket: pexels(36621206, 900),
  marketFruit: pexels(6927631),
  grains: pexels(3737697, 900),
  legumes: pexels(3737691, 900),
  sourdough: pexels(30890566, 900),
  breads: pexels(8633662, 900),
  spices: pexels(458796, 900),
  pantryJars: pexels(4440173, 900),
  lemons: pexels(20267214, 900),
};

const NAME = L("سوق أخضر", "Souq Akhdar");

const header = lib("header-search", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن طماطم، رز، عيش…", "Search tomatoes, rice, bread…"),
    "وصل حديثًا": L("خضار وفاكهة", "Fruit & veg"),
    "الأكثر مبيعًا": L("الأكثر طلباً", "Most ordered"),
    "العروض": L("بقالة جافة", "Pantry"),
    "هدايا": L("مخبوزات", "Bakery"),
    "إكسسوارات": L("بهارات", "Spices"),
    "توصيل خلال ٤٨ ساعة": L("توصيل في ساعتين", "Delivery in 2 hours"),
  },
  links: { "/products": [undefined, search("خضار"), BEST, search("رز"), search("عيش"), search("بهارات")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سوق أخضر. كل الحقوق محفوظة.", "© 2026 Souq Akhdar. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("promo-shipping", {
    text: { "اطلب بـ ١٥٠٠ ج.م أو أكتر والتوصيل عليك ببلاش": L("اطلب بـ ٥٠٠ ج.م أو أكتر والتوصيل ببلاش", "Order EGP 500 or more and delivery is free") },
    links: { "/products": BEST },
  }),
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("محتاج إيه النهارده؟", "What do you need today?"),
      "اكتب اسم المنتج": L("طماطم، رز، عيش…", "Tomatoes, rice, bread…"),
      "وصل حديثًا": L("بوكس خضار", "Veg box"),
      "الأكثر مبيعًا": L("رز", "Rice"),
      "هدايا": L("عيش", "Bread"),
      "العروض": L("بهارات", "Spices"),
    },
    links: { "/products": [SHOP, search("بوكس"), search("رز"), search("عيش"), search("بهارات")] },
  }),
  lib("categories-tiles", {
    photo: [PHOTOS.pepperBox, PHOTOS.fruitBasket, PHOTOS.grains, PHOTOS.breads],
    text: {
      "تسوّق حسب القسم": L("تسوق بالقسم", "Shop by aisle"),
      "اختر القسم الذي يناسبك من كل ما نقدمه.": L("من المزرعة والمخبز لحد بابك.", "From the farm and the bakery to your door."),
      "وصل حديثًا": L("خضار", "Vegetables"),
      "الأكثر مبيعًا": L("فاكهة", "Fruit"),
      "العروض": L("بقالة جافة", "Pantry"),
      "هدايا": L("مخبوزات", "Bakery"),
    },
    links: { "/products": [SHOP, search("خضار"), search("فاكهة"), search("رز"), search("عيش")] },
  }),
  lib("products-tabbed", {
    text: {
      "منتجاتنا": L("الأكثر طلباً الأسبوع ده", "Popular this week"),
      "وصل جديد": L("جديد", "New"),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
  }),
  lib("promo-bento", {
    photo: [PHOTOS.vegBox, PHOTOS.spices, PHOTOS.legumes],
    text: {
      "عروض الموسم": L("عروض الأسبوع", "Weekly offers"),
      "٤٠٪": L("١٥٪", "15%"),
      "تشكيلة الموسم": L("خضار وفاكهة", "Fruit & veg"),
      "٢٥٪": L("٢٠٪", "20%"),
      "الأكثر مبيعًا": L("بهارات", "Spices"),
      "٣٠٪": L("١٠٪", "10%"),
      "أساسيات": L("البقالة", "Pantry"),
    },
    links: { "/products": [BEST, search("خضار"), search("بهارات"), search("رز")] },
  }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("أساسيات كل يوم", "Everyday essentials") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ليه سوق أخضر", "Why Souq Akhdar"),
      "تسوّق وأنت مطمئن": L("طازة وسريع وبسعر عادل", "Fresh, fast, fair"),
      "توصيل سريع": L("توصيل في ساعتين", "2-hour delivery"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("القاهرة والجيزة، من ٨ الصبح لـ ١١ بالليل.", "Cairo and Giza, 8am to 11pm."),
      "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
      "أو ادفع بالبطاقة والمحفظة": L("كاش أو كارت على الباب.", "Cash or card at your door."),
      "استرجاع سهل": L("استبدال مجاني", "Free replacements"),
      "١٤ يومًا لتغيّر رأيك": L("مش طازة؟ نبدّله.", "Not fresh? We replace it."),
      "دعم على واتساب": L("سلسلة تبريد", "Cold chain"),
      "أشخاص حقيقيون طوال الأسبوع": L("شنط مبردة للألبان واللحوم.", "Chilled bags for dairy and meat."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن سوق أخضر", "About Souq Akhdar"), L("بقالة أونلاين بتشتغل مع ٤٠ مزرعة حوالين القاهرة.", "An online grocery working with 40 farms around Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.marketFruit,
    alt: L("سلال فاكهة على رف خشب", "Baskets of fruit on a wooden stall"),
    eyebrow: L("من المزرعة", "From the farm"),
    title: L("طازة من الصبح", "Fresh from this morning"),
    text: L("بنستلم الخضار والفاكهة من المزارع كل صبح، وبنعبّي الطلبات في مخزن مبرّد في المعادي.", "We collect produce from the farms every morning and pack orders in a chilled warehouse in Maadi."),
    more: L("ولو أي حاجة وصلت مش طازة، بنبدّلها ببلاش.", "And if anything arrives less than fresh, we replace it for free."),
    button: L("تسوق الأكثر طلباً", "Shop most ordered"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بقالة طازة على بابك في ساعتين.", "Fresh groceries at your door in 2 hours."),
  categories: [
    ["produce", "خضار وفاكهة", "Fruit & veg", PHOTOS.pepperBox],
    ["pantry", "بقالة جافة", "Pantry", PHOTOS.grains],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.sourdough],
    ["spices", "بهارات وزيوت", "Spices & oils", PHOTOS.spices],
  ],
  products: [
    ["weekly-veg-box", "produce", "بوكس خضار الأسبوع", "Weekly Veg Box", PHOTOS.vegBox, 260, { isFeatured: true, rating: 4.8, sold90: 620 }],
    ["fruit-basket", "produce", "سلة فاكهة", "Fruit Basket", PHOTOS.fruitBasket, 320, { rating: 4.7, sold90: 210 }],
    ["greens-box", "produce", "بوكس خضرة", "Greens Box", PHOTOS.greensBox, 140, { compareAtPrice: 170, sold90: 96 }],
    ["salad-box", "produce", "بوكس سلطة", "Salad Box", PHOTOS.pepperBox, 120, { sold90: 150 }],
    ["lemons-1kg", "produce", "ليمون كيلو", "Lemons, 1 kg", PHOTOS.lemons, 45, { sold90: 300 }],
    ["grains-pack", "pantry", "باقة حبوب ورز", "Rice & Grains Pack", PHOTOS.grains, 230, { rating: 4.7, sold90: 340 }],
    ["legumes-pack", "pantry", "باقة بقوليات", "Legumes Pack", PHOTOS.legumes, 190, { sold90: 120 }],
    ["fresh-sourdough", "bakery", "عيش ساوردو طازة", "Fresh Sourdough", PHOTOS.sourdough, 95, { isFeatured: true, sold90: 120 }],
    ["spice-starter-set", "spices", "طقم بهارات", "Spice Starter Set", PHOTOS.spices, 180, { compareAtPrice: 220, sold90: 75 }],
    ["pantry-jar-refill", "pantry", "عبوات تعبئة المخزن", "Pantry Jar Refill", PHOTOS.pantryJars, 150, { inStock: false, sold90: 28 }],
  ],
});

export const HARVEST = libraryTemplate({
  key: HARVEST_KEY,
  version: 3,
  changelog: "Harvest v3: product page",
  name: L("هارفست", "Harvest"),
  description: L(
    "بقالة أونلاين: بحث سريع، أقسام، عروض الأسبوع وأساسيات كل يوم. أربع صفحات جاهزة.",
    "Online grocery: quick search, aisles, weekly offers and everyday essentials. Four ready pages.",
  ),
  category: "food",
  sortOrder: 180,
  palette: ["#ffffff", "#eef6ea", "#ffcf3d", "#1e7a44"],
  colors: {
    primary: "#1e7a44",
    secondary: "#eef6ea",
    background: "#ffffff",
    foreground: "#173a2a",
    muted: "#51665a",
    border: "#dbe8d6",
    accent: "#ffcf3d",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 12,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن سوق أخضر", "About Souq Akhdar") }, sections: about },
    {
      slug: "contact",
      name: L("المساعدة", "Help"),
      seo: { title: L("المساعدة", "Help") },
      sections: contactPage(lib, {
        title: L("المساعدة", "Help"),
        text: L("من ٨ الصبح لـ ١١ بالليل، على واتساب أو بالتليفون.", "8am to 11pm, on WhatsApp or by phone."),
        heading: L("عن طلب أو صنف", "About an order or an item"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والطزاجة والدفع.", "Delivery, freshness and payment."),
        question: L("لو صنف مش موجود؟", "What if an item is out of stock?"),
        answer: L(
          "بنتصل بيك قبل ما نبدّله بحاجة شبهه، أو نشيله من الفاتورة لو تحب.",
          "We call you before swapping it for something similar, or take it off the bill if you prefer.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "side", band: "paper", extras: ["product-shipping"], copy: { back: L("رجوع للأقسام", "Back to the aisles"), reviews: L("آراء المتسوقين", "Shopper reviews"), related: L("إضافات لسلتك", "Add to your basket") } },
});
