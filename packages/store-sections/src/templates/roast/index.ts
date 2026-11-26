/**
 * Roast (template 20, coffee roaster; Claude Design "Storefront
 * Templates"): warm paper, a dark roast brown for actions and a caramel
 * highlight, Lalezar display type over Tajawal and 14px corners. A roaster
 * with a story: a full-bleed roaster hero, categories, this week's roast,
 * roast-day promises, bean to cup, a coffee feed, FAQs and a sign-up.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): roasted and green
 * beans, a roaster, cezves and spices. No people, hands or brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const ROAST_KEY = "roast";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ROAST_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  beansDark: pexels(16682442, 900),
  beansClose: pexels(30444143, 900),
  scoop: pexels(22938072, 900),
  cezve: pexels(27047830, 900),
  sandCezve: pexels(31330206, 900),
  greenHalves: pexels(7125599, 900),
  greenBeans: pexels(4815898, 900),
  roasterDrop: pexels(4820734, 900),
  roasterTop: pexels(4820812, 900),
  spices: pexels(458796, 900),
  heroRoaster: pexels(894695, 1600),
};

const NAME = L("بيت البن", "Bunn House");

const header = lib("header-pill", {
  text: { "اسم متجرك": NAME, "المتجر": L("كل البن", "All coffee"), "العروض": L("الأكثر طلباً", "Most ordered"), "المدونة": L("حكايتنا", "Our story") },
  links: { "/products": [SHOP, BEST], "/blog": "/about" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بيت البن. كل الحقوق محفوظة.", "© 2026 Bunn House. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

/**
 * Home (v4, template-rules §2a): the roaster drum as a full-bleed hero, the
 * categories, then the coffee journey: this week's roast first, the roast-day
 * promises right under it, bean to cup, one category's coffees in a swipe
 * row (v6), FAQs and the roast notes sign-up.
 */
const home: Design[] = [
  lib("hero-fullbleed", {
    photo: [PHOTOS.heroRoaster],
    text: {
      "المجموعة الجديدة": L("بن محمص", "Roasted coffee"),
      "صُنعت لتدوم معك": L("بن حبوب ومطحون", "Whole bean and ground coffee"),
      "خامات مختارة وتفاصيل هادئة لكل يوم.": L(
        "بن تركي وإسبريسو وبن أخضر، مع درجة التحميص لكل منتج.",
        "Turkish, espresso and green coffee, with the roast level of each product.",
      ),
      "تسوّق الآن": L("تسوّق البن", "Shop coffee"),
      "اكتشف الجديد": L("الأكثر طلباً", "Most ordered"),
      "صورة الواجهة": L("بن داخل المحمصة", "Beans in the roaster"),
    },
    links: { "/products?sort=newest": BEST },
  }),
  lib("categories-circles", {
    text: { "ما الذي تبحث عنه؟": L("اختر قهوتك", "Choose your coffee") },
  }),
  lib("products-panel-rail", {
    text: {
      "هدايا": L("مختارات البن", "Coffee picks"),
      "هدايا تحت ١٠٠٠ جنيه": L("من المحمصة", "From the roaster"),
      "أفكار هدايا لكل مناسبة.": L("حبوب ومطحون بدرجات تحميص مختلفة.", "Whole and ground, in different roast levels."),
    },
    links: { "/products": SHOP },
    lists: [{ source: "best-sellers" }],
  }),
  lib("features-ticker", {
    text: {
      "الشحن": L("درجة التحميص لكل منتج", "Roast level for every product"),
      "الدفع عند الاستلام": L("بن حبوب أو مطحون", "Whole bean or ground"),
      "الاستبدال والاسترجاع": L("صور ومواصفات لكل منتج", "Photos and specs for every product"),
      "تواصل معنا": L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    },
  }),
  // v5 (2026-11-16, owner): every home has a real products grid; it shows what the main list does not.
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "أحدث المنتجات في المتجر.": L("أحدث المنتجات في المتجر.", "The newest products in the store."),
    },
    links: { "/products": NEW },
    lists: [{ source: "newest", limit: 8 }],
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.greenHalves, PHOTOS.roasterTop, PHOTOS.scoop],
    text: {
      "كيف نعمل": L("من الحبة إلى الفنجان", "Bean to cup"),
      "من اختيارنا إلى طلبك": L("كيف تختار قهوتك", "How to choose your coffee"),
      "نختار": L("المنشأ", "Origin"),
      "كل منتج بعناية.": L("بلد البن ومنطقته في وصف كل منتج.", "Each coffee lists its country and region."),
      "نراجع": L("التحميص", "Roast"),
      "تفاصيل كل منتج قبل عرضه.": L("درجة التحميص مذكورة لكل بن.", "Each coffee lists its roast level."),
      "نساعدك": L("الطحن", "Grind"),
      "في أي سؤال عن منتجاتنا.": L("حبوب كاملة، أو مطحون للتركي والإسبريسو.", "Whole beans, or ground for Turkish and espresso."),
    },
  }),
  // v6 (2026-11-25, owner): every home has products by category in a swipe row: the store's 1st category. It takes the
  // place of the photo feed (gallery-side), the home's weakest section, so the home stays at nine.
  // 2 across: the demo's category holds 2 (one full row, the row rule); a store's own category fills the swipe.
  lib("products-category-carousel", { lists: [{ offset: 0 }, { categoryIndex: 1, limit: 2 }], nodes: { "منتجات القسم": { style: { columns: 2 }, tablet: { columns: 2 } } } }),
  lib("faq-numbered", {
    text: {
      "أسئلة مهمة": L("أسئلة مهمة", "Good to know"),
      "كم يستغرق التوصيل؟": L("كم يستغرق التوصيل؟", "How long does delivery take?"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب.": L(
        "تظهر تكلفة الشحن ومدته عند إتمام الطلب.",
        "Shipping cost and time are shown at checkout.",
      ),
    },
  }),
  lib("newsletter-big", {
    text: {
      "اشترك في نشرتنا البريدية": L("اشترك ليصلك جديد البن", "Subscribe for new coffees"),
      "كن أول من يعرف بالمنتجات الجديدة.": L("محاصيل جديدة وطرق تحضير القهوة.", "New harvests and brewing guides."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بيت البن", "About Bunn House"), L("بن محمص وبن أخضر وأدوات تحضير القهوة.", "Roasted coffee, green beans and brewing tools.")),
  aboutStory(lib, {
    photo: PHOTOS.roasterDrop,
    alt: L("بن يخرج من المحمصة", "Beans pouring out of the roaster"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("بن بدرجات تحميص مختلفة", "Coffee in every roast level"),
    text: L("بن حبوب ومطحون، تركي وإسبريسو وبن أخضر، مع المنشأ ودرجة التحميص لكل منتج.", "Whole bean and ground, Turkish, espresso and green coffee, with the origin and roast level of each product."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوق كل البن", "Shop all coffee"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بن حبوب ومطحون وأدوات تحضير القهوة.", "Whole bean and ground coffee and brewing tools."),
  categories: [
    ["beans", "بن حبوب", "Whole beans", PHOTOS.beansClose],
    ["turkish", "بن تركي", "Turkish coffee", PHOTOS.cezve],
    ["green", "بن أخضر", "Green beans", PHOTOS.greenHalves],
    ["pantry", "بهارات وأدوات", "Spices & tools", PHOTOS.spices],
    ["espresso", "إسبريسو", "Espresso", PHOTOS.beansDark],
    ["boxes", "علب القهوة", "Coffee boxes", PHOTOS.roasterTop],
  ],
  products: [
    ["ethiopia-sidamo", "beans", "إثيوبيا سيدامو ٢٥٠ جرام", "Ethiopia Sidamo, 250 g", PHOTOS.beansClose, 420, { isFeatured: true, rating: 4.9, sold90: 410 }],
    ["house-turkish-blend", "turkish", "خلطة البيت التركي ٥٠٠ جرام", "House Turkish Blend, 500 g", PHOTOS.cezve, 360, { rating: 4.8, sold90: 620 }],
    ["brazil-santos", "beans", "برازيل سانتوس كيلو", "Brazil Santos, 1 kg", PHOTOS.scoop, 980, { sold90: 88 }],
    ["espresso-roast", "espresso", "تحميص إسبريسو ٢٥٠ جرام", "Espresso Roast, 250 g", PHOTOS.beansDark, 390, { sold90: 120 }],
    ["green-arabica", "green", "أرابيكا أخضر كيلو", "Green Arabica, 1 kg", PHOTOS.greenBeans, 650, { sold90: 24 }],
    ["copper-cezve", "pantry", "كنكة نحاس", "Copper Cezve", PHOTOS.sandCezve, 450, { isFeatured: true, sold90: 61 }],
    ["spice-jar-set", "pantry", "طقم برطمانات بهارات", "Spice Jar Set", PHOTOS.spices, 220, { compareAtPrice: 260, sold90: 61 }],
    ["roasters-box", "boxes", "علبة المحمصة", "The Roaster’s Box", PHOTOS.roasterTop, 890, { compareAtPrice: 1020, inStock: false, sold90: 73 }],
  ],
});

export const ROAST = libraryTemplate({
  key: ROAST_KEY,
  version: 7,
  changelog: "Roast v6: products by category in a swipe row on the home, in place of the photo feed",
  name: L("روست", "Roast"),
  description: L(
    "محمصة بن: صورة المحمصة بعرض الشاشة، تحميص الأسبوع، وعود يوم التحميص ومن الحبة إلى الفنجان. أربع صفحات جاهزة.",
    "Coffee roaster: a full-bleed roaster hero, this week’s roast, roast-day promises and bean to cup. Four ready pages.",
  ),
  category: "sweets",
  style: ["warm"],
  sortOrder: 200,
  palette: ["#f7efe4", "#ecdcc6", "#e39a4b", "#2a1a12"],
  colors: {
    primary: "#2a1a12",
    secondary: "#ecdcc6",
    background: "#ffffff",
    foreground: "#2a1a12",
    muted: "#6b5546",
    border: "#e2cfb5",
    accent: "#e39a4b",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("عن بيت البن", "About Bunn House") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or an order."),
        heading: L("اسأل عن نوع بن أو منتج", "Ask about a coffee or a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التحميص والطحن والطلب.", "Roasting, grinding and ordering."),
        question: L("هل يتوفر البن مطحونًا؟", "Is the coffee available ground?"),
        answer: L(
          "يذكر وصف كل منتج إن كان حبوبًا كاملة أو مطحونًا، ونوع الطحنة.",
          "Each product says whether it is whole bean or ground, and which grind.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "side", band: "paper", extras: ["product-perks"], copy: { reviews: L("رأي شاربي القهوة", "What coffee drinkers say"), related: L("أنواع أخرى للتجربة", "More coffees to try") } },
});
