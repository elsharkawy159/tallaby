/**
 * Nada (template 60, clean minimal skincare; Claude Design "Storefront
 * Templates"): near-white paper, a deep sage green for actions and a pale
 * sage highlight, Almarai throughout and soft 24px corners. A five-product
 * routine from Fayoum: a split-screen routine hero, three promises, the five
 * best sellers, buy more of the olive soap and save, points on every order
 * and questions. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): dropper bottles, amber
 * oil and pump bottles, cream jars, olive soap bars and a gua sha set on
 * plain surfaces. No people, no hands and no brand labels.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const NADA_KEY = "nada";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(NADA_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  faceOil: pexels(12146904, 900),
  faceOilHero: pexels(12146904),
  faceWash: pexels(6811698, 900),
  oliveSoap: pexels(6690863, 900),
  bodyOil: pexels(7795790, 900),
  hairOil: pexels(7796159, 900),
  ritualSet: pexels(8102128, 900),
  sheaButter: pexels(6690234, 900),
  calmSerum: pexels(4735943, 900),
  pumpTrio: pexels(8709569),
};

const NAME = L("ندى للعناية", "Nada Care");

const header = lib("header-line", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "المتجر": L("الروتين", "The routine"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن ندى", "About"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "منتجات مختارة بعناية لكل يوم.": L("منتجات عناية بخطوات بسيطة.", "Care products in simple steps."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ندى للعناية. كل الحقوق محفوظة.", "© 2026 Nada Care. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("عن ندى", "About Nada"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.faceOilHero],
    text: {
      "مجموعة الموسم": L("الروتين", "The routine"),
      "صوت أنقى، كل يوم": L("روتين عناية بخطوات بسيطة", "A care routine in simple steps"),
      "منتجات مختارة بمواصفات واضحة لكل يوم.": L(
        "غسول وتونر وزيوت وصابون، مع مكونات واضحة لكل منتج.",
        "Cleansers, toners, oils and soaps, with clear ingredients for each.",
      ),
      "تسوق الآن": L("تسوّق الروتين", "Shop the routine"),
      "العروض": L("الأكثر مبيعاً", "Best sellers"),
      "صورة الحملة": L("زجاجتا زيت للوجه بقطّارة", "Two face oil dropper bottles"),
    },
    links: { "/products": [SHOP, BEST] },
  }),
  lib("categories-captioned", { text: { "اكتشف الأقسام": L("تسوّق حسب القسم", "Shop by category"), "كل الأقسام": L("كل المنتجات", "All products") } }),
  lib("products-grid", {
    as: "the-five",
    text: {
      "وصل حديثًا": L("الأساسيات الخمسة", "The five"),
      "أحدث المنتجات في المتجر.": L("المنتجات الأكثر طلبًا في المتجر.", "The most ordered products in the store."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("features-ruled", {
    text: {
      "الشحن": L("مكونات واضحة", "Clear ingredients"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("قائمة المكونات مكتوبة لكل منتج.", "Ingredients listed for every product."),
      "الدفع عند الاستلام": L("تشكيلة لكل خطوة", "A range for every step"),
      "أو بطرق الدفع المتاحة عند الطلب": L("غسول وتونر وزيوت وصابون.", "Cleansers, toners, oils and soaps."),
      "الاستبدال والاسترجاع": L("صور ومواصفات", "Photos and specs"),
      "التفاصيل في صفحة السياسات": L("صور وأحجام واضحة لكل منتج.", "Clear photos and sizes for every product."),
      "تواصل معنا": L("تواصل معنا", "Contact us"),
      "لأي سؤال عن طلب أو منتج": L("لأي سؤال عن منتج أو طلب.", "With any question about a product or order."),
    },
  }),
  // v4 (2026-11-25, owner): every home has products by category in a swipe row: the store's 1st category.
  // 3 across: the demo's category holds 3 (one full row, the row rule); a store's own category fills the swipe.
  lib("products-category-carousel", { lists: [{ offset: 0 }, { categoryIndex: 1, limit: 3 }], nodes: { "منتجات القسم": { style: { columns: 3 } } } }),
  lib("text-steps", {
    as: "points",
    text: {
      "كيف ترجع منتجًا": L("كيف تطلب", "How to order"),
      "راسلنا على واتساب": L("اختر", "Choose"),
      "خلال ١٤ يومًا من الاستلام مع رقم الطلب.": L("تصفّح المنتجات واختر ما يناسبك.", "Browse the products and pick what you need."),
      "جهّز المنتج": L("أضف إلى السلة", "Add to cart"),
      "في علبته الأصلية بكل الإكسسوارات.": L("حدّد الحجم والكمية.", "Choose the size and quantity."),
      "يستلمه المندوب": L("اطلب", "Order"),
      "من عنوانك خلال يومي عمل.": L("أكمل بيانات الطلب والدفع.", "Complete your details and payment."),
      "استرداد المبلغ": L("استلم", "Receive"),
      "بطريقة الدفع نفسها خلال ٥ أيام.": L("تابع حالة طلبك حتى يصلك.", "Follow your order until it arrives."),
    },
  }),
  lib("faq-columns", {
    as: "home-faq",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("بأي منتج أبدأ؟", "Which product should I start with?"),
      "ستظهر لك صفحة تأكيد بعد إتمام الطلب.": L(
        "اقرأ وصف كل منتج وطريقة استخدامه، أو تواصل معنا لأي سؤال.",
        "Read each product's description and how to use it, or contact us with any question.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("أين أجد مكونات المنتج؟", "Where can I find a product's ingredients?"),
      "تواصل معنا في أقرب وقت لنراجع طلبك.": L("مكونات كل منتج مكتوبة في صفحته.", "Each product's ingredients are listed on its page."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ندى", "About Nada"), L("منتجات عناية بخطوات بسيطة.", "Care products in simple steps.")),
  aboutStory(lib, {
    photo: PHOTOS.pumpTrio,
    alt: L("زجاجات عسلية بمضخة بجانب مروحة ورقية", "Amber pump bottles beside a paper fan"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("روتين عناية بسيط", "A simple care routine"),
    text: L("نختار منتجات العناية بعناية، ونكتب مكونات كل منتج وطريقة استخدامه.", "We choose our care products carefully and list each one's ingredients and use."),
    more: L("تشكيلة من الغسول والتونر والزيوت والصابون.", "A range of cleansers, toners, oils and soaps."),
    button: L("تسوّق الروتين", "Shop the routine"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("منتجات عناية بخطوات بسيطة.", "Care products in simple steps."),
  categories: [
    ["face", "العناية بالوجه", "Face care", PHOTOS.faceOil],
    ["body", "العناية بالجسم", "Body care", PHOTOS.bodyOil],
    ["hair", "العناية بالشعر", "Hair care", PHOTOS.hairOil],
    ["sets", "أطقم", "Sets", PHOTOS.ritualSet],
    ["soap", "صابون", "Soap", PHOTOS.oliveSoap],
  ],
  products: [
    ["prickly-pear-face-oil", "face", "زيت التين الشوكي", "Prickly Pear Oil", PHOTOS.faceOil, 690, { isFeatured: true, rating: 4.8, sold90: 164 }],
    ["rose-water-face-wash", "face", "غسول ماء الورد", "Rose Water Face Wash", PHOTOS.faceWash, 320, { rating: 4.7, sold90: 120 }],
    ["olive-oil-soap-trio", "soap", "٣ قطع صابون زيت زيتون", "Olive Oil Soap Trio", PHOTOS.oliveSoap, 240, { rating: 4.9, sold90: 210 }],
    ["sesame-body-oil", "body", "زيت السمسم", "Sesame Oil", PHOTOS.bodyOil, 380, { sold90: 48 }],
    ["rosemary-hair-oil", "hair", "زيت إكليل الجبل للشعر", "Rosemary Hair Oil", PHOTOS.hairOil, 290, { compareAtPrice: 340, rating: 4.8, sold90: 188 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.ritualSet, 1290, { compareAtPrice: 1520, isFeatured: true, rating: 4.9, sold90: 62 }],
    ["shea-body-butter", "body", "زبدة الشيا", "Shea Butter", PHOTOS.sheaButter, 420, { sold90: 74 }],
    ["calm-serum", "face", "سيرم الوجه", "Face Serum", PHOTOS.calmSerum, 560, { sold90: 90 }],
  ],
});

export const NADA = libraryTemplate({
  key: NADA_KEY,
  version: 5,
  changelog: "Nada v4: products by category in a swipe row on the home",
  productPage: { surface: "flat", thumbs: "side", button: "outline", band: "paper", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("أكمل روتينك", "Complete your routine") } },
  name: L("ندى", "Nada"),
  description: L(
    "عناية بسيطة ونظيفة: روتين من ٥ منتجات وخطوات الطلب. أربع صفحات جاهزة.",
    "Clean, minimal skincare: a five-product routine and how ordering works. Four ready pages.",
  ),
  category: "health",
  style: ["minimal"],
  sortOrder: 600,
  palette: ["#fbfbf9", "#eef1ec", "#dfe9d5", "#3e6b57"],
  colors: {
    primary: "#3e6b57",
    secondary: "#eef1ec",
    background: "#ffffff",
    foreground: "#1d2420",
    muted: "#5a635d",
    border: "#e0e5dd",
    accent: "#dfe9d5",
  },
  fonts: { heading: "Almarai", body: "Almarai" },
  radius: 24,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ندى", "About"), seo: { title: L("عن ندى", "About Nada") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or order."),
        heading: L("اسأل عن منتج", "Ask about a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الروتين والمنتجات والطلبات.", "The routine, products and orders."),
        question: L("كيف أعرف طريقة استخدام المنتج؟", "How do I know how to use a product?"),
        answer: L("طريقة الاستخدام مكتوبة في صفحة كل منتج، ويمكنك التواصل معنا لأي سؤال.", "Each product page explains how to use it, and you can contact us with any question."),
      }),
    },
  ],
  demo: DEMO,
});
