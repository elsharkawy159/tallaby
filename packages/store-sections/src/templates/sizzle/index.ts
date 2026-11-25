/**
 * Sizzle (template 17, burgers, shawarma and pizza; Claude Design
 * "Storefront Templates"): warm cream paper, a chilli red for actions and a
 * mustard highlight, Lalezar display type over Almarai and 16px corners. A
 * late-night delivery menu: food in the headline, cravings, most ordered,
 * tonight's deal, how we cook, regulars and FAQs. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): burgers, shawarma
 * wraps, pizzas and fries. No people, hands or brand marks.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const SIZZLE_KEY = "sizzle";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SIZZLE_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  doubleBurger: pexels(4109233, 900),
  burgerClose: pexels(4571510, 900),
  burgerTray: pexels(23091813, 900),
  cheeseburger: pexels(9268664, 900),
  chickenBurger: pexels(11354487, 900),
  burgerFries: pexels(34407059, 900),
  shawarmaFoil: pexels(29306505, 900),
  shawarmaWraps: pexels(40262789, 900),
  shawarmaHalves: pexels(5779364, 900),
  margherita: pexels(31596394, 900),
  basilPizza: pexels(6223186, 900),
  stonePizza: pexels(35068608, 900),
  pepperoniCrust: pexels(30948829, 900),
  pepperoni: pexels(12557605, 900),
};

const NAME = L("سكة جريل", "Sekka Grill");

const header = lib("header-line", {
  text: {
    "م": L("س", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("القائمة كاملة", "Full menu"),
    "العروض": L("الأكثر طلباً", "Most ordered"),
    "المدونة": L("الأسئلة", "FAQ"),
    "من نحن": L("مطبخنا", "Our kitchen"),
  },
  links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
});

const footer = lib("footer-wordmark", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ سكة جريل. كل الحقوق محفوظة.", "© 2026 Sekka Grill. All rights reserved."),
    "تسوّق": L("القائمة", "Menu"),
    "كل المنتجات": L("القائمة كاملة", "Full menu"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("مطبخنا", "Our kitchen"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-inline", {
    photo: [PHOTOS.chickenBurger, PHOTOS.shawarmaWraps],
    text: {
      "تشكيلة ٢٠٢٦": L("برجر وشاورما وبيتزا", "Burgers, shawarma, pizza"),
      "منتجات مختارة بعناية": L("وجبات تُحضّر عند الطلب", "Meals made to order"),
      "كل ما تستخدمه": L("برجر سماش", "Smash burgers"),
      "صورة صغيرة": L("برجر وشاورما", "A burger and shawarma"),
      "كل يوم،": L("وشاورما على الفحم", "charcoal shawarma"),
      "بجودة أفضل.": L("وبيتزا من فرن الحجر.", "and pizza from a stone oven."),
      "نختار كل منتج بعناية ونعرض تفاصيله كاملة.": L(
        "قائمة برجر وشاورما وبيتزا بمكونات واضحة لكل وجبة.",
        "A menu of burgers, shawarma and pizza, with clear ingredients for every meal.",
      ),
      "ابدأ التسوق": L("اطلب الآن", "Order now"),
      "وصل حديثًا": L("برجر", "Burgers"),
      "الأكثر مبيعًا": L("شاورما", "Shawarma"),
      "العروض": L("بيتزا", "Pizza"),
      "هدايا": L("وجبات", "Combos"),
    },
    links: { "/products": [SHOP, search("برجر"), search("شاورما"), search("بيتزا"), search("كومبو")] },
  }),
  lib("categories-stories", {
    photo: [
      PHOTOS.doubleBurger,
      PHOTOS.shawarmaFoil,
      PHOTOS.margherita,
      PHOTOS.burgerClose,
      PHOTOS.cheeseburger,
      PHOTOS.shawarmaHalves,
      PHOTOS.pepperoniCrust,
      PHOTOS.pepperoni,
    ],
    text: {
      "الأقسام": L("ماذا تريد أن تطلب؟", "What would you like?"),
      "جديد": L("طازج", "Fresh"),
      "وصل حديثًا": L("سماش برجر", "Smash burgers"),
      "الأكثر مبيعًا": L("شاورما دجاج", "Chicken shawarma"),
      "العروض": L("مارجريتا", "Margherita"),
      "هدايا": L("برجر مزدوج", "Double burgers"),
      "إكسسوارات": L("برجر بالجبن", "Cheeseburgers"),
      "أساسيات": L("شاورما لحم", "Beef shawarma"),
      "مجموعات": L("بيتزا فرن", "Oven pizza"),
      "الموسم الجديد": L("بيبروني", "Pepperoni"),
    },
  }),
  lib("products-grid", {
    as: "most-ordered",
    text: { "وصل حديثًا": L("الأكثر طلباً", "Most ordered"), "أحدث المنتجات في المتجر.": L("الوجبات الأكثر طلبًا في القائمة.", "The most ordered meals on the menu.") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("about-rows", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.burgerFries, PHOTOS.shawarmaWraps, PHOTOS.stonePizza],
    text: {
      "نختار": L("برجر مضغوط على صاج ساخن", "Smashed on a hot plate"),
      "نختار كل منتج بعناية قبل عرضه في المتجر.": L(
        "لحم طازج يُضغط رقيقًا ليصبح طرفه مقرمشًا.",
        "Fresh beef pressed thin for a crispy edge.",
      ),
      "نوضّح": L("شاورما على الفحم", "Charcoal shawarma"),
      "نعرض صورًا ومواصفات ومقاسات واضحة لكل منتج.": L("دجاج ولحم متبّل يُقطّع عند الطلب.", "Marinated chicken and beef, sliced to order."),
      "نساعدك": L("بيتزا فرن الحجر", "Stone-oven pizza"),
      "تواصل معنا لأي سؤال قبل الطلب أو بعده.": L("عجينة تُخبز في فرن حجري حتى تصبح هشة ومحمّرة.", "Dough baked in a stone oven until light and blistered."),
    },
  }),
  // v4 (2026-11-25, owner): every home has products by category in a swipe row: the store's 1st category.
  // 3 across: the demo's category holds 3 (one full row, the row rule); a store's own category fills the swipe.
  lib("products-category-carousel", { lists: [{ offset: 0 }, { categoryIndex: 1, limit: 3 }], nodes: { "منتجات القسم": { style: { columns: 3 } } } }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("آراء عملائنا", "What our customers say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "برجر السماش مقرمش ولذيذ، والكمية مناسبة.",
        "The smash burger is crispy and tasty, and the portion is right.",
      ),
      "م": L("م", "M"),
      "مريم أ.": L("مصطفى ع.", "Mostafa A."),
      "القاهرة": L("مدينة نصر", "Nasr City"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("شاورما الدجاج طعمها مشوي فعلًا، والثومية ممتازة.", "The chicken shawarma really tastes grilled, and the garlic sauce is excellent."),
      "ي": L("ر", "R"),
      "يوسف م.": L("رنا ح.", "Rana H."),
      "المنصورة": L("مصر الجديدة", "Heliopolis"),
      "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": L(
        "وجبة العائلة كفتنا نحن الستة، والبيتزا لذيذة.",
        "The family meal fed six of us, and the pizza was delicious.",
      ),
      "ع": L("ز", "Z"),
      "عمر ك.": L("زياد ك.", "Ziad K."),
      "الإسكندرية": L("التجمع", "New Cairo"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("البيتزا خفيفة والعجينة محمّرة كما أحب.", "The pizza is light and the crust is just how I like it."),
      "س": L("س", "S"),
      "سلمى ر.": L("سلمى ف.", "Salma F."),
      "أسيوط": L("المعادي", "Maadi"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الأسعار مناسبة والكميات كبيرة.", "Good prices and big portions."),
      "ن": L("ن", "N"),
      "نور ح.": L("نادر ع.", "Nader A."),
      "الجيزة": L("مدينة نصر", "Nasr City"),
      "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": L("بيتزا المارجريتا من أفضل ما جربت.", "The margherita is one of the best I have tried."),
      "ك": L("ك", "K"),
      "كريم ع.": L("كريم س.", "Karim S."),
      "طنطا": L("مصر الجديدة", "Heliopolis"),
      "كل الآراء": L("اطلب الآن", "Order now"),
    },
    links: { "/products": SHOP },
  }),
  lib("faq-columns", {
    as: "home-faq",
    text: {
      "أسئلة شائعة": L("معلومات تهمك", "Good to know"),
      "كم يستغرق التوصيل؟": L("كم يستغرق التوصيل؟", "How long does delivery take?"),
      "تظهر تكلفة الشحن ومدته عند إتمام الطلب.": L(
        "تظهر مدة التوصيل وتكلفته عند إتمام الطلب.",
        "Delivery time and cost are shown at checkout.",
      ),
      "إلى أين يتوفر التوصيل؟": L("إلى أين يتوفر التوصيل؟", "Where do you deliver?"),
      "تظهر مناطق التوصيل المتاحة عند إتمام الطلب.": L("تظهر مناطق التوصيل المتاحة عند إتمام الطلب.", "Available delivery areas are shown at checkout."),
      "ما سياسة الاسترجاع؟": L("ماذا لو وصل الطلب غير صحيح؟", "What if the order arrives wrong?"),
      "راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.": L(
        "تواصل معنا لأي مشكلة في طلبك.",
        "Contact us about any problem with your order.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("مطبخنا", "Our kitchen"), L("برجر وشاورما وبيتزا تُحضّر عند الطلب.", "Burgers, shawarma and pizza made to order.")),
  aboutStory(lib, {
    photo: PHOTOS.stonePizza,
    alt: L("بيتزا من فرن حجري على رخام", "A stone-oven pizza on marble"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("كل وجبة تُحضّر عند الطلب", "Every meal made to order"),
    text: L("لحم طازج، وشاورما متبّلة، وبيتزا من فرن حجري.", "Fresh beef, marinated shawarma and stone-baked pizza."),
    more: L("تواصل معنا لأي سؤال عن القائمة أو طلبك.", "Contact us with any question about the menu or your order."),
    button: L("اطلب الآن", "Order now"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("برجر سماش وشاورما على الفحم وبيتزا في فرن حجر.", "Smash burgers, charcoal shawarma and stone-baked pizza."),
  categories: [
    ["burgers", "برجر", "Burgers", PHOTOS.cheeseburger],
    ["shawarma", "شاورما", "Shawarma", PHOTOS.shawarmaFoil],
    ["pizza", "بيتزا", "Pizza", PHOTOS.basilPizza],
    ["combos", "وجبات مجمّعة", "Combos & boxes", PHOTOS.burgerTray],
  ],
  products: [
    ["double-smash-burger", "burgers", "برجر سماش مزدوج", "Double Smash Burger", PHOTOS.doubleBurger, 185, { isFeatured: true, rating: 4.9, sold90: 1240 }],
    ["classic-cheeseburger", "burgers", "برجر بالجبن كلاسيكي", "Classic Cheeseburger", PHOTOS.cheeseburger, 145, { sold90: 860 }],
    ["crispy-chicken-burger", "burgers", "برجر دجاج مقرمش", "Crispy Chicken Burger", PHOTOS.chickenBurger, 135, { sold90: 310 }],
    ["chicken-shawarma-wrap", "shawarma", "ساندويتش شاورما دجاج", "Chicken Shawarma Wrap", PHOTOS.shawarmaFoil, 95, { isFeatured: true, rating: 4.8, sold90: 1580 }],
    ["shawarma-duo", "shawarma", "ساندويتشان شاورما", "Shawarma Duo", PHOTOS.shawarmaWraps, 180, { sold90: 420 }],
    ["toasted-shawarma", "shawarma", "شاورما محمّصة", "Toasted Shawarma", PHOTOS.shawarmaHalves, 110, { sold90: 230 }],
    ["margherita-pizza", "pizza", "بيتزا مارجريتا", "Margherita Pizza", PHOTOS.margherita, 160, { sold90: 690 }],
    ["pepperoni-pizza", "pizza", "بيتزا بيبروني", "Pepperoni Pizza", PHOTOS.pepperoni, 190, { compareAtPrice: 220, sold90: 510 }],
    ["family-box", "combos", "وجبة العائلة", "Family Box", PHOTOS.burgerTray, 620, { compareAtPrice: 740, rating: 4.9, sold90: 380 }],
    ["burger-fries-meal", "combos", "وجبة برجر وبطاطس", "Burger & Fries Meal", PHOTOS.burgerFries, 199, { sold90: 940 }],
  ],
});

export const SIZZLE = libraryTemplate({
  key: SIZZLE_KEY,
  version: 4,
  changelog: "Sizzle v4: products by category in a swipe row on the home",
  name: L("سيزل", "Sizzle"),
  description: L(
    "برجر وشاورما وبيتزا: الطعام في العنوان، كيف نطبخ وآراء العملاء. أربع صفحات جاهزة.",
    "Burgers, shawarma and pizza: food in the headline, how we cook and customer reviews. Four ready pages.",
  ),
  category: "food",
  style: ["bold"],
  sortOrder: 170,
  palette: ["#fff7ee", "#ffe3c4", "#ffb703", "#c8281e"],
  colors: {
    primary: "#c8281e",
    secondary: "#ffe3c4",
    background: "#ffffff",
    foreground: "#1e1410",
    muted: "#6a554a",
    border: "#f0d6bb",
    accent: "#ffb703",
  },
  fonts: { heading: "Lalezar", body: "Almarai" },
  radius: 16,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("مطبخنا", "Our kitchen"), seo: { title: L("مطبخنا", "Our kitchen") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("اسأل عن وجبة أو طلب، وسنرد عليك.", "Ask about a meal or an order, and we will reply."),
        heading: L("عن وجبة أو طلب", "About a meal or an order"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والطلبات.", "Delivery, payment and orders."),
        question: L("ماذا لو وصل الطلب غير صحيح؟", "What if the order arrives wrong?"),
        answer: L("تواصل معنا لأي مشكلة في طلبك.", "Contact us about any problem with your order."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "Add to your order") } },
});
