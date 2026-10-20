/**
 * Khodar (template 70, fresh produce; Claude Design "Storefront
 * Templates"): white paper, a market green for actions and a sunny yellow
 * highlight, Tajawal throughout and soft 16px corners. A same-day produce
 * shop: the free-delivery goal, a search hero, the most ordered, the weekly
 * box with quantity savings, the 3 pm cut-off and order tracking. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): a market of vegetable
 * baskets, a fruit and veg tote, fresh herbs, a juicer with oranges,
 * tomatoes, mangoes, oranges, bananas, potatoes, aubergines and lemons. No
 * people, no hands, no logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const KHODAR_KEY = "khodar";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(KHODAR_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  market: pexels(37321079, 900),
  marketWide: pexels(37321079),
  tote: pexels(16999667, 900),
  herbs: pexels(4113927, 900),
  juicer: pexels(14510445, 900),
  tomatoes: pexels(29479888, 900),
  mango: pexels(30620864, 900),
  oranges: pexels(8639570, 900),
  bananas: pexels(31558745, 900),
  potatoes: pexels(36400786, 900),
  aubergines: pexels(39206252, 900),
  lemons: pexels(31428126, 900),
};

const NAME = L("خضار إكسبريس", "Khodar Express");

const header = lib("header-search", {
  text: {
    "م": L("خ", "K"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن طماطم، مانجا، ورقيات…", "Search tomatoes, mango, greens…"),
    "وصل حديثًا": L("خضار وفاكهة", "Fruit & veg"),
    "الأكثر مبيعًا": L("الأكتر طلباً", "Most ordered"),
    "العروض": L("ورقيات", "Greens"),
    "هدايا": L("بوكسات", "Boxes"),
    "إكسسوارات": L("عصاير", "Juicing"),
    "توصيل خلال ٤٨ ساعة": L("نفس اليوم قبل ٣ العصر", "Same-day before 3 pm"),
  },
  links: { "/products": [undefined, search("خضار"), BEST, search("ورقيات"), search("بوكس"), search("عصير")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("خ", "K"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ خضار إكسبريس. كل الحقوق محفوظة.", "© 2026 Khodar Express. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED], "/contact": "/profile/orders" },
});

const home: Design[] = [
  lib("cart-free-delivery", {
    text: {
      "١٥٠٠ ج.م": L("٤٠٠ ج.م", "EGP 400"),
      "والتوصيل عليك مجاني": L("والتوصيل في نفس اليوم ببلاش", "and same-day delivery is free"),
    },
    links: { "/products": BEST },
  }),
  lib("hero-search", {
    text: {
      "بتدور على إيه النهارده؟": L("محتاج إيه النهارده؟", "What do you need today?"),
      "اكتب اسم المنتج": L("طماطم، مانجا، ورقيات", "Tomatoes, mango, greens"),
      "وصل حديثًا": L("بوكس خضار", "Veg box"),
      "الأكثر مبيعًا": L("ورقيات", "Greens"),
      "هدايا": L("مانجا", "Mango"),
      "العروض": L("طماطم", "Tomatoes"),
    },
    links: { "/products": [SHOP, search("بوكس"), search("ورقيات"), search("مانجا"), search("طماطم")] },
  }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("الأكتر طلباً كل يوم", "Most ordered, every day") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 6 }],
  }),
  lib("bundle-quantity", {
    text: {
      "وفّر مع الكمية": L("كل أسبوع؟ وفّر أكتر", "Every week? Save more"),
      "قطعة واحدة": L("بوكس واحد", "1 box"),
      "السعر العادي": L("السعر العادي", "Regular price"),
      "قطعتين": L("بوكسين", "2 boxes"),
      "على القطعة التانية": L("على البوكسين", "On both boxes"),
      "وفّر ١٠٪": L("وفّر ٨٪", "Save 8%"),
      "٣ قطع": L("٤ بوكسات", "4 boxes"),
      "على الطلب كله": L("بوكس كل أسبوع لمدة شهر", "A box a week for a month"),
      "وفّر ١٨٪": L("وفّر ١٥٪", "Save 15%"),
      "اختار عدد القطع من السلة.": L("اختار عدد البوكسات من السلة.", "Choose how many boxes in your cart."),
    },
    lists: [{ source: "featured" }],
  }),
  lib("pay-promise", {
    text: {
      "اطلب قبل ٢ الضهر، يوصلك بكره": L("اطلب قبل ٣، اطبخ بالليل", "Order by 3 pm, cook it tonight"),
      "٢:٠٠ م": L("٣:٠٠ م", "3:00 pm"),
      "بتطلب النهارده": L("آخر ميعاد للطلب", "Order cut-off"),
      "٦:٠٠ م": L("٥:٠٠ م", "5:00 pm"),
      "بيتشحن": L("بيتغلف بارد", "Packed cold"),
      "بكره": L("٨:٠٠ م", "8:00 pm"),
      "بيوصلك": L("على بابك", "At your door"),
    },
  }),
  lib("track-ask", {
    text: {
      "رقم الطلب موجود في رسالة تأكيد الطلب.": L(
        "رقم الطلب موجود في رسالة التأكيد، والمندوب بيكلمك قبل ما يوصل.",
        "Your order number is in the confirmation message, and the courier calls before arriving.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن خضار إكسبريس", "About Khodar Express"), L("خضار وفاكهة متقطفة امبارح.", "Fruit and veg picked yesterday.")),
  aboutStory(lib, {
    photo: PHOTOS.marketWide,
    alt: L("سلال خضار في السوق", "Baskets of vegetables at the market"),
    eyebrow: L("من الغيط", "From the field"),
    title: L("متقطف امبارح، على بابك النهارده", "Picked yesterday, at your door today"),
    text: L("بنشتري كل يوم الفجر من مزارعين في القليوبية والفيوم، ونفرز الخضار بإيدينا قبل ما يتغلف.", "We buy every dawn from farmers in Qalyubia and Fayoum, and sort the produce before it is packed."),
    more: L("ولو حاجة مش عاجباك، بنرجعلك فلوسها من غير أسئلة.", "And if anything is not right, we refund it, no questions asked."),
    button: L("تسوق البوكسات", "Shop boxes"),
    href: search("بوكس"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("خضار وفاكهة طازة بتوصل في نفس اليوم.", "Fresh fruit and veg, delivered the same day."),
  categories: [
    ["produce", "خضار وفاكهة", "Fruit & veg", PHOTOS.tomatoes],
    ["greens", "ورقيات", "Greens", PHOTOS.herbs],
    ["boxes", "بوكسات", "Boxes", PHOTOS.market],
  ],
  products: [
    ["weekly-veg-box", "boxes", "بوكس خضار الأسبوع", "Weekly Veg Box", PHOTOS.market, 260, { isFeatured: true, rating: 4.8, sold90: 320 }],
    ["fruit-veg-basket", "boxes", "سلة خضار وفاكهة", "Fruit & Veg Basket", PHOTOS.tote, 320, { sold90: 144 }],
    ["greens-bundle", "greens", "باقة ورقيات", "Greens Bundle", PHOTOS.herbs, 140, { sold90: 96 }],
    ["juice-box", "boxes", "بوكس العصير", "Juice Box", PHOTOS.juicer, 290, { compareAtPrice: 340, sold90: 41 }],
    ["tomatoes-1kg", "produce", "طماطم بلدي ١ كيلو", "Local Tomatoes, 1 kg", PHOTOS.tomatoes, 25, { sold90: 410 }],
    ["mango-1kg", "produce", "مانجا عويس ١ كيلو", "Awees Mango, 1 kg", PHOTOS.mango, 70, { rating: 4.9, sold90: 230 }],
    ["oranges-3kg", "produce", "برتقان بصرة ٣ كيلو", "Navel Oranges, 3 kg", PHOTOS.oranges, 60, { sold90: 180 }],
    ["bananas-1kg", "produce", "موز ١ كيلو", "Bananas, 1 kg", PHOTOS.bananas, 35, { sold90: 260 }],
    ["potatoes-2kg", "produce", "بطاطس ٢ كيلو", "Potatoes, 2 kg", PHOTOS.potatoes, 40, { sold90: 200 }],
    ["aubergines-peppers", "produce", "باذنجان وفلفل رومي", "Aubergines & Peppers", PHOTOS.aubergines, 45, { inStock: false, sold90: 70 }],
    ["lemons-1kg", "produce", "ليمون بلدي ١ كيلو", "Local Lemons, 1 kg", PHOTOS.lemons, 30, { compareAtPrice: 40, sold90: 150 }],
  ],
});

export const KHODAR = libraryTemplate({
  key: KHODAR_KEY,
  version: 1,
  name: L("خضار", "Khodar"),
  description: L(
    "خضار وفاكهة طازة: هدف التوصيل المجاني، بحث سريع، بوكس الأسبوع، آخر ميعاد ٣ العصر وتتبع الطلب. أربع صفحات جاهزة.",
    "Fresh produce: free-delivery goal, quick search, the weekly box, a 3 pm cut-off and order tracking. Four ready pages.",
  ),
  category: "food",
  sortOrder: 700,
  palette: ["#ffffff", "#eef7ec", "#ffd43b", "#16803c"],
  colors: {
    primary: "#16803c",
    secondary: "#eef7ec",
    background: "#ffffff",
    foreground: "#13261a",
    muted: "#4c5e51",
    border: "#dcebd8",
    accent: "#ffd43b",
  },
  fonts: { heading: "Tajawal", body: "Tajawal" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن خضار إكسبريس", "About"), seo: { title: L("عن خضار إكسبريس", "About Khodar Express") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("بنرد من ٨ الصبح لـ ١٠ بالليل.", "We reply from 8 am to 10 pm."),
        heading: L("اسأل عن طلب أو بوكس", "Ask about an order or a box"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والبوكسات والاسترجاع.", "Delivery, boxes and refunds."),
        question: L("لو حاجة وصلت مش طازة؟", "What if something arrives not fresh?"),
        answer: L("صوّرها وابعتهالنا في نفس اليوم ونرجعلك تمنها أو نبدلها.", "Send us a photo the same day and we refund or replace it."),
      }),
    },
  ],
  demo: DEMO,
});
