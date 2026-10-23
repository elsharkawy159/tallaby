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
    "المتجر": L("المنيو كله", "Full menu"),
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
    "تسوّق": L("المنيو", "Menu"),
    "كل المنتجات": L("المنيو كله", "Full menu"),
    "العروض": L("الأعلى تقييماً", "Top rated"),
    "من نحن": L("مطبخنا", "Our kitchen"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-inline", {
    photo: [PHOTOS.chickenBurger, PHOTOS.shawarmaWraps],
    text: {
      "تشكيلة ٢٠٢٦": L("مفتوحين لحد ٢ الفجر", "Open until 2am"),
      "منتجات مختارة بعناية": L("سخن خلال ٣٥ دقيقة", "Hot in 35 minutes"),
      "كل ما تستخدمه": L("برجر سماش", "Smash burgers"),
      "صورة صغيرة": L("برجر وشاورما", "A burger and shawarma"),
      "كل يوم،": L("وشاورما على الفحم", "charcoal shawarma"),
      "بجودة أفضل.": L("وبيتزا من فرن الحجر.", "and pizza from a stone oven."),
      "نختار كل منتج بأنفسنا ونجرّبه قبل أن يصل إليك، بضمان وتوصيل سريع.": L(
        "بيتعمل على الطلب في مدينة نصر ويوصل لكل شرق القاهرة.",
        "Grilled to order in Nasr City and delivered across east Cairo.",
      ),
      "ابدأ التسوق": L("اطلب دلوقتي", "Order now"),
      "وصل حديثًا": L("برجر", "Burgers"),
      "الأكثر مبيعًا": L("شاورما", "Shawarma"),
      "العروض": L("بيتزا", "Pizza"),
      "هدايا": L("كومبو", "Combos"),
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
      "الأقسام": L("نفسك في إيه؟", "What are you craving?"),
      "جديد": L("سخن", "Hot"),
      "وصل حديثًا": L("سماش برجر", "Smash burgers"),
      "الأكثر مبيعًا": L("شاورما فراخ", "Chicken shawarma"),
      "العروض": L("مارجريتا", "Margherita"),
      "هدايا": L("دبل برجر", "Double burgers"),
      "إكسسوارات": L("تشيز برجر", "Cheeseburgers"),
      "أساسيات": L("شاورما لحمة", "Beef shawarma"),
      "مجموعات": L("بيتزا فرن", "Oven pizza"),
      "الموسم الجديد": L("بيبروني", "Pepperoni"),
    },
  }),
  lib("products-grid", {
    as: "most-ordered",
    text: { "وصل حديثًا": L("الأكثر طلباً", "Most ordered"), "أحدث المنتجات اللي نزلت المتجر.": L("اللي مدينة نصر بتطلبه كل ليلة.", "What Nasr City orders every night.") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("promo-deal", {
    photo: [undefined, undefined, undefined, PHOTOS.burgerTray],
    text: {
      "صورة العرض": L("برجر وبطاطس في صينية", "Burgers and fries on a tray"),
      "عرض اليوم": L("عرض الليلة", "Tonight’s deal"),
      "اسم العرض أو المنتج هنا": L("بوكس العيلة", "The Family Box"),
      "اكتب سبب العرض وما يحصل عليه العميل في سطر واحد.": L(
        "٤ برجر و٢ شاورما وبيتزا كبيرة وبطاطس و٤ مشروبات.",
        "Four burgers, two shawarma wraps, a large pizza, fries and four drinks.",
      ),
      "وفّر ٢٥٪": L("وفّر ١٦٪", "Save 16%"),
      "الحق العرض": L("اطلب البوكس", "Order the box"),
    },
    links: { "/products": search("بوكس") },
  }),
  lib("about-rows", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.burgerFries, PHOTOS.shawarmaWraps, PHOTOS.stonePizza],
    text: {
      "نختار": L("متكبوس على صاج سخن", "Smashed on a hot plate"),
      "نشتري من الموزعين المعتمدين فقط، ونرفض أي منتج مشكوك فيه.": L(
        "لحمة فريش مش مجمدة، متكبوسة رفيعة عشان الحرف يقرمش.",
        "Fresh beef, never frozen, pressed thin for a crispy edge.",
      ),
      "نجرّب": L("شاورما على الفحم", "Charcoal shawarma"),
      "كل منتج يُفتح ويُجرَّب قبل أن يُعرض في المتجر.": L("متتبلة من الليلة اللي قبلها وبتتقطع على الطلب.", "Marinated overnight and sliced to order."),
      "نغلّف": L("٩٠ ثانية في الحجر", "90 seconds in stone"),
      "تغليف محكم ومعه الفاتورة والضمان.": L("الفرن بيشتغل على ٤٣٠ درجة عشان العجينة تبقى منفوخة وطرية.", "Our oven runs at 430°C for a blistered, chewy crust."),
    },
  }),
  lib("testimonials-wall", {
    text: {
      "ماذا يقولون عنا": L("زباينا بيقولوا إيه", "What our regulars say"),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "أحسن سماش برجر في مدينة نصر. وصل في ٢٥ دقيقة ولسه مقرمش.",
        "Best smash burger in Nasr City. Arrived in 25 minutes and still crispy.",
      ),
      "م": L("م", "M"),
      "مريم أ.": L("مصطفى ع.", "Mostafa A."),
      "القاهرة": L("مدينة نصر", "Nasr City"),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L("شاورما الفراخ طعمها فحم بجد. التومية مظبوطة.", "The chicken shawarma tastes like real charcoal. The toum is perfect."),
      "ي": L("ر", "R"),
      "يوسف م.": L("رنا ح.", "Rana H."),
      "المنصورة": L("مصر الجديدة", "Heliopolis"),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "بوكس العيلة كفّانا إحنا الستة. البيتزا كانت ممكن توصل أسخن شوية.",
        "The family box fed six of us. The pizza could arrive a bit hotter.",
      ),
      "ع": L("ز", "Z"),
      "عمر ك.": L("زياد ك.", "Ziad K."),
      "الإسكندرية": L("التجمع", "New Cairo"),
      "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": L("طلبت الساعة ١ بالليل ووصل بسرعة. والطيار محترم.", "Ordered at 1am and it came fast. Polite rider too."),
      "س": L("س", "S"),
      "سلمى ر.": L("سلمى ف.", "Salma F."),
      "أسيوط": L("المعادي", "Maadi"),
      "أسعار معقولة وجودة أفضل مما توقعت.": L("الأسعار حلوة والكميات كبيرة.", "Good prices and big portions."),
      "ن": L("ن", "N"),
      "نور ح.": L("نادر ع.", "Nader A."),
      "الجيزة": L("مدينة نصر", "Nasr City"),
      "خدمة العملاء محترمة جدًا وساعدوني أختار الصح.": L("البيتزا المارجريتا أحسن من محلات كتير.", "The margherita beats a lot of pizzerias."),
      "ك": L("ك", "K"),
      "كريم ع.": L("كريم س.", "Karim S."),
      "طنطا": L("مصر الجديدة", "Heliopolis"),
      "كل الآراء": L("اطلب دلوقتي", "Order now"),
    },
    links: { "/products": SHOP },
  }),
  lib("faq-columns", {
    as: "home-faq",
    text: {
      "أسئلة شائعة": L("حاجات تهمك", "Good to know"),
      "كم يستغرق التوصيل؟": L("الأكل بيوصل في قد إيه؟", "How fast does the food arrive?"),
      "القاهرة والجيزة من يوم إلى يومين، وباقي المحافظات من ٢ إلى ٦ أيام.": L(
        "خلال ٣٥ دقيقة في مدينة نصر ومصر الجديدة، ومن ٤٥ لـ ٦٠ دقيقة لباقي شرق القاهرة.",
        "Within 35 minutes in Nasr City and Heliopolis, and 45 to 60 minutes across the rest of east Cairo.",
      ),
      "هل التوصيل متاح لكل المحافظات؟": L("بتوصلوا فين؟", "Where do you deliver?"),
      "نعم، نوصل لكل محافظات مصر.": L("مدينة نصر ومصر الجديدة والتجمع والمعادي.", "Nasr City, Heliopolis, New Cairo and Maadi."),
      "ما سياسة الاسترجاع؟": L("لو الطلب وصل غلط؟", "What if the order arrives wrong?"),
      "يمكنك إرجاع أي منتج غير مستخدم خلال ١٤ يومًا في علبته الأصلية.": L(
        "ابعتلنا صورة على واتساب ونبعتلك الصح فوراً من غير تمن.",
        "Send us a photo on WhatsApp and we send the right one at once, free.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("مطبخنا", "Our kitchen"), L("مطبخ مشويات في مدينة نصر بيطبخ من ٢٠١٩.", "A grill kitchen in Nasr City cooking since 2019.")),
  aboutStory(lib, {
    photo: PHOTOS.stonePizza,
    alt: L("بيتزا من فرن حجر على رخامة", "A stone-oven pizza on marble"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("كل حاجة على الطلب", "Everything cooked to order"),
    text: L("لحمة فريش كل يوم، وشاورما متتبلة من الليلة اللي قبلها، وفرن حجر على ٤٣٠ درجة.", "Fresh beef every day, shawarma marinated overnight and a stone oven at 430°C."),
    more: L("ولو الطلب اتأخر عن ٣٥ دقيقة، المشروبات علينا.", "And if your order takes longer than 35 minutes, the drinks are on us."),
    button: L("اطلب دلوقتي", "Order now"),
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
    ["combos", "كومبو وبوكسات", "Combos & boxes", PHOTOS.burgerTray],
  ],
  products: [
    ["double-smash-burger", "burgers", "دبل سماش برجر", "Double Smash Burger", PHOTOS.doubleBurger, 185, { isFeatured: true, rating: 4.9, sold90: 1240 }],
    ["classic-cheeseburger", "burgers", "تشيز برجر كلاسيك", "Classic Cheeseburger", PHOTOS.cheeseburger, 145, { sold90: 860 }],
    ["crispy-chicken-burger", "burgers", "برجر فراخ كرسبي", "Crispy Chicken Burger", PHOTOS.chickenBurger, 135, { sold90: 310 }],
    ["chicken-shawarma-wrap", "shawarma", "ساندوتش شاورما فراخ", "Chicken Shawarma Wrap", PHOTOS.shawarmaFoil, 95, { isFeatured: true, rating: 4.8, sold90: 1580 }],
    ["shawarma-duo", "shawarma", "ساندوتشين شاورما", "Shawarma Duo", PHOTOS.shawarmaWraps, 180, { sold90: 420 }],
    ["toasted-shawarma", "shawarma", "شاورما محمّصة", "Toasted Shawarma", PHOTOS.shawarmaHalves, 110, { sold90: 230 }],
    ["margherita-pizza", "pizza", "بيتزا مارجريتا", "Margherita Pizza", PHOTOS.margherita, 160, { sold90: 690 }],
    ["pepperoni-pizza", "pizza", "بيتزا بيبروني", "Pepperoni Pizza", PHOTOS.pepperoni, 190, { compareAtPrice: 220, sold90: 510 }],
    ["family-box", "combos", "بوكس العيلة", "Family Box", PHOTOS.burgerTray, 620, { compareAtPrice: 740, rating: 4.9, sold90: 380 }],
    ["burger-fries-meal", "combos", "وجبة برجر وبطاطس", "Burger & Fries Meal", PHOTOS.burgerFries, 199, { sold90: 940 }],
  ],
});

export const SIZZLE = libraryTemplate({
  key: SIZZLE_KEY,
  version: 3,
  changelog: "Sizzle v3: product page",
  name: L("سيزل", "Sizzle"),
  description: L(
    "برجر وشاورما وبيتزا: الأكل في العنوان، عرض الليلة، بنطبخ إزاي وآراء الزباين. أربع صفحات جاهزة.",
    "Burgers, shawarma and pizza: food in the headline, tonight’s deal, how we cook and regulars. Four ready pages.",
  ),
  category: "food",
  sortOrder: 170,
  palette: ["#fff7ee", "#ffe3c4", "#ffb703", "#c8281e"],
  colors: {
    primary: "#c8281e",
    secondary: "#ffe3c4",
    background: "#fff7ee",
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
        text: L("١٥ شارع عباس العقاد، مدينة نصر. مفتوحين لحد ٢ الفجر.", "15 Abbas El Akkad St, Nasr City. Open until 2am."),
        heading: L("عن طلب أو حفلة أو فرع", "About an order, a party or a branch"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والطلبات.", "Delivery, payment and orders."),
        question: L("لو الطلب وصل غلط؟", "What if the order arrives wrong?"),
        answer: L("ابعتلنا صورة على واتساب ونبعتلك الصح فوراً من غير تمن.", "Send us a photo on WhatsApp and we send the right one at once, free."),
      }),
    },
  ],
  demo: DEMO,
  productPage: { surface: "card", thumbs: "bottom", band: "shelf", extras: ["product-shipping"], copy: { back: L("رجوع للمنيو", "Back to the menu"), reviews: L("الزباين بتقول إيه", "What regulars say"), related: L("كمان ممكن تطلب", "Add to your order") } },
});
