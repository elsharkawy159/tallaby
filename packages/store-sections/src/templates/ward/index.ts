/**
 * Ward (template 103, everyday beauty; Claude Design "Storefront
 * Templates"): blush-white paper, plum-brown ink, a rose for actions and a
 * pale pink highlight, Amiri headings on Noto Naskh Arabic and soft 20px
 * corners. Skin, body and hair care that keeps it simple: banners for face,
 * body and hair, three promises, the five, buy more and save, points on
 * every order and questions. Built from section library designs
 * (`fromLibrary`).
 *
 * Rewards have no library designs yet: "How points work" uses the numbered
 * steps (`text-steps`), with the points as copy (no points ledger).
 *
 * Photos: Pexels, each checked by eye (2026-10-23): dropper bottles, a
 * serum and gua sha set, amber oil and pump bottles, a body brush, cream
 * jars, olive soap bars and a bath stool. No people, no hands and no brand
 * labels (the design's photos with a hand or a printed brand were
 * replaced).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const WARD_KEY = "ward";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(WARD_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  faceBanner: pexels(8102128),
  bodyBanner: pexels(7796159),
  hairBanner: pexels(7795790),
  faceOil: pexels(12146904, 900),
  toner: pexels(4735943, 900),
  faceWash: pexels(6811698, 900),
  oliveSoap: pexels(6690863, 900),
  bodyOil: pexels(7795790, 900),
  hairOil: pexels(7796159, 900),
  ritualSet: pexels(8102128, 900),
  sheaButter: pexels(6690234, 900),
  pumpTrio: pexels(8709569),
};

const NAME = L("ورد", "Ward");

const header = lib("header-centered", {
  text: {
    "اسم متجرك": NAME,
    "مختارات بعناية": L("منتجات عناية بسيطة", "Simple care products"),
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("الأكثر مبيعاً", "Best sellers"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("عن ورد", "About"),
    "تواصل معنا": L("تواصل", "Contact"),
  },
  links: { "/products": [undefined, BEST, undefined, undefined, BEST], "/blog": "/faq" },
});

const footer = lib("footer-centered", {
  text: {
    "م": L("و", "W"),
    "اسم متجرك": NAME,
    "مختارات بعناية لكل يوم.": L("منتجات العناية بالبشرة والجسم والشعر.", "Skin, body and hair care products."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ورد. كل الحقوق محفوظة.", "© 2026 Ward. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.faceBanner, PHOTOS.bodyBanner, PHOTOS.hairBanner],
    text: {
      "وصل حديثًا": L("العناية بالبشرة", "Skincare"),
      "الموسم الجديد وصل": L("غسول وسيروم وكريم", "Cleanser, serum and cream"),
      "قطع مختارة بعناية لكل يوم.": L("منتجات العناية بالبشرة لكل يوم.", "Skincare products for every day."),
      "تسوّق الجديد": L("تسوّق العناية بالوجه", "Shop face"),
      "صورة الحملة الأولى": L("سيروم وأداة جوا شا وصابونة على قماش أسود", "A serum, a gua sha and a soap bar on black cloth"),
      "الأكثر مبيعًا": L("العناية بالجسم", "Body care"),
      "المفضّلة عند عملائنا": L("زيوت وزبدة وفرش", "Oils, butters and brushes"),
      "القطع الأكثر طلبًا في المتجر.": L("زيوت خفيفة وفرشاة للجسم.", "Light oils and a body brush."),
      "تصفّح الأكثر مبيعًا": L("تسوّق العناية بالجسم", "Shop body"),
      "صورة الحملة الثانية": L("فرشاة جسم وزيت عسلي اللون على صينية خشبية", "A body brush and amber oil on a wooden tray"),
      "مختارات الأسبوع": L("الشعر", "Hair"),
      "قطع مختارة لهذا الأسبوع": L("العناية بالشعر", "Hair care"),
      "تشكيلة مختارة من أحدث القطع في المتجر.": L("زيوت وماسكات لكل أنواع الشعر.", "Oils and masks for every hair type."),
      "تسوّق المختارات": L("تسوّق العناية بالشعر", "Shop hair"),
      "صورة الحملة الثالثة": L("زجاجات زيت عسلية اللون بمضخة وقطّارة", "Amber pump and dropper bottles of oil"),
    },
    links: { "/products": [search("وش"), search("جسم"), search("شعر")] },
  }),
  lib("categories-circles", { text: { "ما الذي تبحث عنه؟": L("ما الذي تبحث عنه؟", "What are you looking for?") } }),
  lib("products-grid", {
    as: "the-five",
    text: {
      "وصل حديثًا": L("خمسة منتجات أساسية", "Five essentials"),
      "أحدث المنتجات في المتجر.": L("منتجات أساسية للبدء.", "Essentials to start with."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("features-ruled", {
    text: {
      "الشحن": L("مكونات واضحة", "Clear ingredients"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب": L("المكونات مكتوبة في صفحة كل منتج.", "Ingredients listed on every product page."),
      "الدفع عند الاستلام": L("للبشرة والجسم والشعر", "Skin, body and hair care"),
      "أو بطرق الدفع المتاحة عند الطلب": L("تشكيلة لكل خطوة في روتين العناية.", "A range for every step of a care routine."),
      "الاستبدال والاسترجاع": L("صور ومواصفات", "Photos and specs"),
      "التفاصيل في صفحة السياسات": L("صور ومواصفات لكل منتج.", "Photos and specs for every product."),
      "تواصل معنا": L("تواصل معنا", "Contact us"),
      "لأي سؤال عن طلب أو منتج": L("لأي سؤال عن منتج.", "With any question about a product."),
    },
  }),
  // v4 (2026-11-25, owner): every home has products by category in a swipe row: the store's 2nd category.
  // 3 across: the demo's category holds 3 (one full row, the row rule); a store's own category fills the swipe.
  lib("products-category-carousel", { lists: [{ offset: 1 }, { categoryIndex: 2, limit: 3 }], nodes: { "منتجات القسم": { style: { columns: 3 } } } }),
  lib("text-steps", {
    as: "points",
    name: L("كيف تطلب", "How to order"),
    text: {
      "كيف ترجع منتجًا": L("كيف تطلب", "How to order"),
      "راسلنا على واتساب": L("اختر", "Choose"),
      "خلال ١٤ يومًا من الاستلام مع رقم الطلب.": L("اختر المنتج المناسب لك.", "Pick the product that suits you."),
      "جهّز المنتج": L("أضف", "Add"),
      "في علبته الأصلية بكل الإكسسوارات.": L("أضف المنتج إلى السلة.", "Add it to your cart."),
      "يستلمه المندوب": L("اطلب", "Order"),
      "من عنوانك خلال يومي عمل.": L("أكمل الطلب بعنوانك ورقم هاتفك.", "Complete your order with your address and phone."),
      "استرداد المبلغ": L("استلم", "Receive"),
      "بطريقة الدفع نفسها خلال ٥ أيام.": L("استلم طلبك على عنوانك.", "Receive your order at your address."),
    },
  }),
  lib("faq-columns", {
    as: "home-faq",
    text: {
      "أسئلة شائعة": L("أسئلة", "Questions"),
      "كيف أعرف أن طلبي وصل إليكم؟": L("بأي منتج أبدأ؟", "Which product should I start with?"),
      "ستظهر لك صفحة تأكيد بعد إتمام الطلب.": L(
        "ابدأ بزيت التين الشوكي وتونر ماء الورد، ثم أضف ما تحتاجه.",
        "Start with the prickly pear oil and the rose water toner, then add what you need.",
      ),
      "هل يمكنني تعديل طلبي أو إلغاؤه؟": L("أين أجد مكونات المنتج؟", "Where do I find a product's ingredients?"),
      "تواصل معنا في أقرب وقت لنراجع طلبك.": L("المكونات مكتوبة في صفحة كل منتج.", "Every product page lists its ingredients."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ورد", "About Ward"), L("منتجات العناية بالبشرة والجسم والشعر.", "Skin, body and hair care products.")),
  aboutStory(lib, {
    photo: PHOTOS.pumpTrio,
    alt: L("زجاجات عسلية اللون بمضخة بجانب مروحة ورقية", "Amber pump bottles beside a paper fan"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("منتجات قليلة مختارة بعناية", "A few carefully chosen products"),
    text: L("زيوت وصابون وتونر وكريمات للعناية اليومية، مع المكونات في صفحة كل منتج.", "Oils, soaps, toners and creams for daily care, with ingredients on every product page."),
    more: L("تواصل معنا لأي سؤال عن منتج.", "Contact us with any question about a product."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("منتجات العناية بالبشرة والجسم والشعر.", "Skin, body and hair care products."),
  categories: [
    ["face", "الوجه", "Face", PHOTOS.faceOil],
    ["body", "الجسم", "Body", PHOTOS.oliveSoap],
    ["hair", "الشعر", "Hair", PHOTOS.hairOil],
    ["sets", "أطقم", "Sets", PHOTOS.ritualSet],
    ["cleansers", "غسول", "Cleansers", PHOTOS.faceWash],
    ["shower", "الاستحمام", "Shower", PHOTOS.pumpTrio],
  ],
  products: [
    ["prickly-pear-face-oil", "face", "زيت التين الشوكي", "Prickly Pear Face Oil", PHOTOS.faceOil, 690, { isFeatured: true, rating: 4.8, sold90: 164 }],
    ["rose-water-toner", "face", "تونر ماء الورد", "Rose Water Toner", PHOTOS.toner, 320, { rating: 4.7, sold90: 120 }],
    ["olive-oil-soap-trio", "body", "٣ قطع صابون زيت الزيتون", "Olive Oil Soap Trio", PHOTOS.oliveSoap, 240, { rating: 4.9, sold90: 210 }],
    ["sesame-body-oil", "body", "زيت سمسم للجسم", "Sesame Body Oil", PHOTOS.bodyOil, 380, { sold90: 48 }],
    ["rosemary-hair-oil", "hair", "زيت إكليل الجبل للشعر", "Rosemary Hair Oil", PHOTOS.hairOil, 290, { compareAtPrice: 340, rating: 4.8, sold90: 188 }],
    ["full-ritual-set", "sets", "طقم الروتين الكامل", "Full Ritual Set", PHOTOS.ritualSet, 1290, { compareAtPrice: 1520, sold90: 62 }],
    ["gentle-face-wash", "cleansers", "غسول وجه لطيف", "Gentle Face Wash", PHOTOS.faceWash, 280, { sold90: 90 }],
    ["shea-body-butter", "body", "زبدة شيا للجسم", "Shea Body Butter", PHOTOS.sheaButter, 420, { inStock: false, sold90: 74 }],
    ["shower-pump-trio", "shower", "طقم جل استحمام وشامبو وبلسم", "Shower Gel, Shampoo & Conditioner Trio", PHOTOS.pumpTrio, 560, { sold90: 58 }],
  ],
});

export const WARD = libraryTemplate({
  key: WARD_KEY,
  version: 4,
  changelog: "Ward v4: products by category in a swipe row on the home",
  productPage: { surface: "shelf", thumbs: "bottom", band: "paper", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("أكمل روتينك", "Finish the routine") } },
  name: L("ورد", "Ward"),
  description: L(
    "جمال كل يوم: لافتات متحركة، خمسة منتجات أساسية، كيف تطلب وأسئلة. أربع صفحات جاهزة.",
    "Everyday beauty: a banner carousel, five essentials, how to order and questions. Four ready pages.",
  ),
  category: "health",
  style: ["classic", "warm"],
  sortOrder: 1030,
  palette: ["#fbf8f6", "#f2e9e6", "#f1c6c9", "#9b3d5a"],
  colors: {
    primary: "#9b3d5a",
    secondary: "#f2e9e6",
    background: "#ffffff",
    foreground: "#2e2326",
    muted: "#6e5f62",
    border: "#e6d8d3",
    accent: "#f1c6c9",
  },
  fonts: { heading: "Amiri", body: "Noto Naskh Arabic" },
  radius: 20,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ورد", "About"), seo: { title: L("عن ورد", "About Ward") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("راسلنا على ward@ward.eg.", "Write to ward@ward.eg."),
        heading: L("اسأل عن منتج", "Ask about a product"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المنتجات والمكونات والطلبات.", "Products, ingredients and orders."),
        question: L("أين أجد طريقة الاستخدام؟", "Where do I find how to use a product?"),
        answer: L("طريقة الاستخدام مكتوبة في صفحة كل منتج.", "Each product page explains how to use it."),
      }),
    },
  ],
  demo: DEMO,
});
