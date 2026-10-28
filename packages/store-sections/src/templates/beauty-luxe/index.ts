/**
 * Beauty Luxe (2026-10-28, beauty niche, premium / minimal): porcelain
 * paper, aubergine ink and a nude taupe, El Messiri headings over Noto Sans
 * Arabic, near-square 2px corners and a 1400px container. A calm, clinical
 * home like a skincare atelier: the announcement header, a background video
 * of blank white bottles, a ruled category index with thumbnails, a
 * spotlight of the house picks beside a photo, the spa story over a
 * full-bleed photo, four category rows with tall portrait cards, a
 * skin-concerns newsletter and the light centred footer. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye on a contact sheet
 * (2026-10-28): white and marble product still lifes only, no people, no
 * hands, no brand labels, none used twice, none shared with another
 * template. Video 4214999 (blank white toiletry bottles, 14s).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const BEAUTY_LUXE_KEY = "beauty-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BEAUTY_LUXE_KEY, getDesign(id)!, { corners: 2, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(4214999, "4214999-hd_1920_1080_25fps.mp4"),
  heroPoster: pexelsVideoPoster(4214999),
  spotlight: pexels(8015809, 1200),
  spa: pexels(4735904, 1200),
  aboutPage: pexels(6724353, 1200),
  // Category thumbnails.
  catSerums: pexels(8101148, 1200),
  catMoisturizers: pexels(7670694, 1200),
  catMakeup: pexels(7256120, 1200),
  catHair: pexels(15694719, 1200),
  catCleansers: pexels(8015780, 1200),
  catBody: pexels(16263603, 1200),
  catTools: pexels(6963151, 1200),
  catSets: pexels(7691108, 1200),
};

const NAME = L("صفا", "Safa");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("أهلًا بيكي في صفا · توصيل لكل محافظات مصر", "Welcome to Safa · Delivery across Egypt"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّعي طلبك", "Track order"),
    "من نحن": L("عن صفا", "About Safa"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-centered-light", {
  text: {
    "اسم متجرك": NAME,
    "قطع مختارة بعناية، بتوصل لحد باب البيت.": L(
      `عناية بالبشرة بتركيبات هادية ونتايج واضحة. ١٤ شارع البرازيل، الزمالك، القاهرة · ${phone("٠١٢٨ ٣٤٥ ٩٠٦٢")} · ${handle("hello@safa.eg")}`,
      "Gentle formulas, visible results. 14 Brazil St, Zamalek, Cairo · +20 128 345 9062 · hello@safa.eg",
    ),
    "المتجر": L("كل المنتجات", "Shop all"),
    "من نحن": L("عن صفا", "About Safa"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ صفا. كل الحقوق محفوظة.", "© 2026 Safa. All rights reserved."),
  },
  links: { "https://wa.me/": "https://wa.me/201283459062" },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 45 } } },
    text: {
      "فيديو الواجهة": L("زجاجات عناية بيضاء على سطح أبيض", "White skincare bottles on a white surface"),
      "المجموعة الجديدة": L("روتين صفا الجديد", "The new Safa ritual"),
      "مساحتك، بطريقتك": L("بشرة صافية، بخطوات أقل", "Clearer skin, fewer steps"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "سيرومات وكريمات بتركيبات قصيرة ومكونات واضحة، متجربة على البشرة المصرية في جو القاهرة.",
        "Serums and creams with short, honest formulas, tested on Egyptian skin in Cairo weather.",
      ),
      "تسوّق الآن": L("ابدئي روتينك", "Start your ritual"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-ruled", {
    text: {
      "الأقسام": L("الفهرس", "The index"),
      "تسوق بالقسم": L("كل خطوة في روتينك", "Every step of your ritual"),
      "منتج": L("منتج", "products"),
    },
  }),
  lib("products-spotlight", {
    photo: [undefined, undefined, PHOTOS.spotlight],
    text: {
      "صورة المجموعة": L("أنابيب بيضا وليفة ومنشفة على سطح أبيض", "White tubes, a sponge and a towel on a white surface"),
      "مجموعة": L("اختيارات صفا", "Safa picks"),
      "مجموعة الموسم": L("الأساسيات اللي بنرجعلها", "The essentials we return to"),
      "قطع مختارة بعناية، بخامات حلوة وتفاصيل هادية.": L(
        "التلات منتجات اللي فريقنا بيستخدمها كل يوم، صبح وليل.",
        "The three products our team uses every day, morning and night.",
      ),
      "تسوّق المجموعة": L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
      "من المجموعة": L("من الاختيارات", "From the picks"),
      "عرض الكل": L("كل المنتجات", "Shop all"),
    },
    links: { "/products": [BEST, SHOP] },
    lists: [{ source: "featured" }],
  }),
  lib("about-fullbleed", {
    photo: [undefined, undefined, PHOTOS.spa],
    text: {
      "صورة القصة": L("زجاجة كريم وعلبة على رخام أبيض", "A cream bottle and jar on white marble"),
      "حكايتنا": L("معمل صفا", "The Safa lab"),
      "تفاصيل صغيرة تصنع الفرق": L("تركيبات أقل، نتايج أوضح", "Fewer ingredients, clearer results"),
      "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.": L(
        "بدأت صفا في ٢٠١٩ من معمل صغير في الزمالك مع صيدلانية واحدة. كل تركيبة بتتجرب ٨ أسابيع على متطوعات قبل ما تنزل، ومن غير عطور مضافة ولا بارابين.",
        "Safa began in 2019 in a small Zamalek lab with one pharmacist. Every formula is tested for eight weeks on volunteers before launch, with no added fragrance and no parabens.",
      ),
      "اعرف أكثر": L("اعرفي حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("عرض الكل", "View all"),
    muted: [2, 4],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-interests", {
    text: {
      "إيه اللي يهمك؟": L("إيه اللي بشرتك محتاجاه؟", "What does your skin need?"),
      "هنبعتلك اللي يخصك بس، مرة في الأسبوع.": L(
        "اختاري نوع بشرتك، وهنبعتلك روتين يناسبك ومنتجات جديدة مرة في الشهر.",
        "Pick your skin type and we will send a routine that suits you, plus new launches, once a month.",
      ),
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "العروض": L("بشرة جافة", "Dry skin"),
      "هدايا": L("بشرة دهنية", "Oily skin"),
      "نصايح": L("روتين ونصايح", "Routines and tips"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن صفا", "About Safa"), L("عناية بالبشرة من معمل صغير في الزمالك.", "Skincare from a small lab in Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("برطمانات كريم وناشر عطر على رخام أبيض", "Cream jars and a reed diffuser on white marble"),
    eyebrow: L("المعمل", "The lab"),
    title: L("كل تركيبة بتتجرب قبل ما تتباع", "Every formula is tested before it is sold"),
    text: L(
      "بنختار كل مكوّن بنسبة واضحة مكتوبة على العلبة، وبنجرب على كل أنواع البشرة في جو مصر الحر.",
      "Every ingredient is chosen at a clear percentage printed on the box, and tested on every skin type in Egypt’s heat.",
    ),
    more: L("ولو المنتج ما ناسبكيش، بنستبدله خلال ١٤ يوم.", "If a product doesn’t suit you, we exchange it within 14 days."),
    button: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عناية بالبشرة بتركيبات هادية من معمل في الزمالك.", "Gentle skincare from a Zamalek lab."),
  categories: [
    ["serums", "السيرومات", "Serums", PHOTOS.catSerums],
    ["moisturizers", "المرطبات", "Moisturizers", PHOTOS.catMoisturizers],
    ["makeup", "المكياج", "Makeup", PHOTOS.catMakeup],
    ["hair-care", "العناية بالشعر", "Hair care", PHOTOS.catHair],
    ["cleansers", "الغسول", "Cleansers", PHOTOS.catCleansers],
    ["body-care", "العناية بالجسم", "Body care", PHOTOS.catBody],
    ["tools", "أدوات العناية", "Tools", PHOTOS.catTools],
    ["sets", "أطقم السفر", "Travel sets", PHOTOS.catSets],
  ],
  products: [
    // Serums
    ["vitamin-c-glow-serum", "serums", "سيروم فيتامين سي للنضارة", "Vitamin C Glow Serum", P(35899861), 1150, { isFeatured: true, rating: 4.9, sold90: 132 }],
    ["hydra-plump-serum", "serums", "سيروم هيالورونيك للترطيب", "Hyaluronic Plump Serum", P(8101529), 890, { rating: 4.8, sold90: 98 }],
    ["hydrating-essence", "serums", "إيسنس الترطيب العميق", "Deep Hydration Essence", P(15369086), 890, { compareAtPrice: 1100, rating: 4.7, sold90: 64 }],
    ["daily-serum-trio", "serums", "ثلاثي السيروم اليومي", "Daily Serum Trio", P(8101511), 2350, { rating: 4.8, sold90: 41 }],
    ["pure-squalane-drops", "serums", "نقط سكوالين نقي", "Pure Squalane Drops", P(6914588), 780, { isFeatured: true, rating: 4.8, sold90: 37 }],
    ["peptide-firming-serum", "serums", "سيروم ببتيد لشد البشرة", "Peptide Firming Serum", P(8101673), 1350, { rating: 4.7, sold90: 29 }],
    ["golden-face-oil", "serums", "زيت الوش الذهبي", "Golden Face Oil", P(6800936), 980, { rating: 5, sold90: 22 }],
    ["amber-niacinamide-serum", "serums", "سيروم نياسيناميد ١٠٪", "10% Niacinamide Serum", P(30229021), 720, { rating: 4.5, sold90: 55, inStock: false }],
    // Moisturizers
    ["rose-whipped-cream", "moisturizers", "كريم الورد المخفوق", "Rose Whipped Cream", P(4857800), 620, { isFeatured: true, rating: 4.8, sold90: 117 }],
    ["soft-cloud-cream", "moisturizers", "كريم سوفت كلاود", "Soft Cloud Cream", P(7691166), 780, { rating: 4.7, sold90: 73 }],
    ["rich-night-cream", "moisturizers", "كريم ليلي مغذي", "Rich Night Cream", P(18350286), 940, { rating: 4.8, sold90: 51 }],
    ["silk-barrier-cream", "moisturizers", "كريم الحرير للحاجز", "Silk Barrier Cream", P(19644201), 860, { compareAtPrice: 990, rating: 4.6, sold90: 44 }],
    ["velvet-cream-jar", "moisturizers", "كريم فيلفت المخملي", "Velvet Cream", P(18350885), 1050, { rating: 4.9, sold90: 26 }],
    ["eye-cream-trio", "moisturizers", "ثلاثي كريم العين", "Eye Cream Trio", P(36437998), 1450, { rating: 4.7, sold90: 19 }],
    ["botanical-day-cream", "moisturizers", "كريم نهاري بالأعشاب", "Botanical Day Cream", P(8490112), 690, { rating: 4.5, sold90: 31 }],
    ["hydrating-cream-tube", "moisturizers", "كريم ترطيب أنبوبة", "Hydrating Cream Tube", P(8015900), 480, { rating: 4.6, sold90: 58 }],
    // Makeup
    ["foundation-concealer-duo", "makeup", "ثنائي كريم أساس وكونسيلر", "Foundation and Concealer Duo", P(7256092), 890, { rating: 4.7, sold90: 66 }],
    ["serum-foundation-sponge", "makeup", "كريم أساس سيروم مع إسفنجة", "Serum Foundation with Sponge", P(7256108), 760, { rating: 4.8, sold90: 49 }],
    ["soft-blush-brush", "makeup", "بلاشر ناعم مع فرشة", "Soft Blush with Brush", P(7256086), 520, { compareAtPrice: 590, rating: 4.6, sold90: 52 }],
    ["radiance-powder", "makeup", "بودرة مضغوطة للإشراق", "Radiance Pressed Powder", P(7256133), 450, { rating: 4.7, sold90: 38 }],
    ["satin-lipstick-trio", "makeup", "ثلاثي روج ساتان", "Satin Lipstick Trio", P(7256093), 690, { isFeatured: true, rating: 4.9, sold90: 84 }],
    ["rouge-lipstick-line", "makeup", "مجموعة روج أحمر وفوشيا", "Rouge Lipstick Set", P(7810602), 1180, { rating: 4.6, sold90: 21 }],
    ["rosewood-satin-lipstick", "makeup", "روج ساتان روزوود", "Rosewood Satin Lipstick", P(15843878), 290, { rating: 4.8, sold90: 47 }],
    ["classic-red-lipstick", "makeup", "روج أحمر كلاسيك", "Classic Red Lipstick", P(15545362), 290, { rating: 4.5, sold90: 33 }],
    // Hair care
    ["silk-shampoo", "hair-care", "شامبو الحرير", "Silk Shampoo", P(8054407), 420, { rating: 4.7, sold90: 61 }],
    ["travel-conditioner-set", "hair-care", "طقم بلسم للسفر", "Travel Conditioner Set", P(8015465), 340, { rating: 4.5, sold90: 24 }],
    ["travel-shampoo-tube", "hair-care", "شامبو أنبوبة للسفر", "Travel Shampoo Tube", P(8533266), 220, { rating: 4.4, sold90: 18 }],
    ["leave-in-hair-mist", "hair-care", "سبراي شعر بدون شطف", "Leave-in Hair Mist", P(8167156), 380, { rating: 4.8, sold90: 45 }],
    ["scalp-mist-duo", "hair-care", "ثنائي سبراي فروة الراس", "Scalp Mist Duo", P(8166777), 560, { rating: 4.6, sold90: 22 }],
    ["shampoo-conditioner-pumps", "hair-care", "شامبو وبلسم بمضخة", "Shampoo and Conditioner Pumps", P(11753640), 690, { compareAtPrice: 780, rating: 4.7, sold90: 39 }],
    ["travel-shampoo-bottles", "hair-care", "عبوات شامبو للسفر", "Travel Shampoo Bottles", P(8015461), 260, { rating: 4.8, sold90: 16 }],
    ["nourishing-hair-wash", "hair-care", "غسول شعر مغذي", "Nourishing Hair Wash", P(8167172), 450, { rating: 4.6, sold90: 28 }],
    // Cleansers
    ["gel-cleanser", "cleansers", "غسول جل للبشرة", "Gel Cleanser", P(7814939), 390, { rating: 4.8, sold90: 88 }],
    ["foam-cleanser-pair", "cleansers", "ثنائي غسول رغوي", "Foam Cleanser Pair", P(7303922), 560, { rating: 4.6, sold90: 54 }],
    ["milk-cleanser-pair", "cleansers", "غسول حليبي للبشرة الحساسة", "Milk Cleanser", P(8015790), 420, { rating: 4.7, sold90: 31 }],
    ["cleanser-cream-duo", "cleansers", "ثنائي غسول وكريم", "Cleanser and Cream Duo", P(12024942), 690, { rating: 4.5, sold90: 19 }],
    // Body care
    ["tulip-white-soap", "body-care", "صابون أبيض بالتوليب", "White Tulip Soap", P(16263605), 160, { rating: 4.7, sold90: 42 }],
    ["rose-bath-salts", "body-care", "ملح حمّام بالورد", "Rose Bath Salts", P(6724380), 290, { rating: 4.8, sold90: 25 }],
    ["mineral-soap-bar", "body-care", "صابونة معادن", "Mineral Soap Bar", P(6690844), 140, { rating: 4.5, sold90: 33 }],
    ["bath-salt-tubes", "body-care", "أنابيب ملح الحمّام", "Bath Salt Tubes", P(6621449), 340, { isFeatured: true, rating: 4.6, sold90: 17 }],
    // Tools
    ["rose-quartz-roller-set", "tools", "رولر وجوا شا كوارتز وردي", "Rose Quartz Roller and Gua Sha", P(6963143), 650, { rating: 4.8, sold90: 36 }],
    ["white-jade-gua-sha", "tools", "طقم جوا شا يشم أبيض", "White Jade Gua Sha Set", P(5928037), 590, { rating: 4.7, sold90: 21 }],
    ["pink-roller-pouch", "tools", "رولر وردي بشنطة كتان", "Pink Roller with Pouch", P(8015883), 480, { rating: 4.6, sold90: 14 }],
    ["green-jade-set", "tools", "طقم رولر وجوا شا يشم أخضر", "Green Jade Roller Set", P(22481971), 720, { rating: 4.9, sold90: 27 }],
    // Travel sets
    ["silicone-travel-trio", "sets", "ثلاثي عبوات سفر سيليكون", "Silicone Travel Trio", P(6690238), 260, { rating: 4.6, sold90: 34 }],
    ["pump-and-box-set", "sets", "طقم عبوات بمضخة وعلبة", "Pump Bottle and Box Set", P(8015796), 340, { rating: 4.5, sold90: 12 }],
  ],
});

export const BEAUTY_LUXE = libraryTemplate({
  key: BEAUTY_LUXE_KEY,
  version: 1,
  name: L("صفا", "Safa"),
  description: L(
    "عناية بالبشرة بهدوء: فيديو زجاجات بيضا، فهرس أقسام وأربع صفوف بكروت طولية. لماركات السكين كير الراقية.",
    "Quiet, clinical skincare: a white-bottle video, a ruled category index and four rows of tall cards. For premium skincare brands.",
  ),
  category: "beauty",
  sortOrder: 1320,
  palette: ["#fbfaf8", "#f1eee9", "#2a2527", "#a8876b"],
  colors: {
    primary: "#2a2527",
    secondary: "#f1eee9",
    background: "#fbfaf8",
    foreground: "#1f1b1c",
    muted: "#6b6460",
    border: "#e3ded7",
    accent: "#8a6a50",
  },
  fonts: { heading: "El Messiri", body: "Noto Sans Arabic" },
  radius: 2,
  containerMaxWidth: 1400,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن صفا", "About"), seo: { title: L("عن صفا", "About Safa") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("استشارة بشرة مجانية", "A free skin consultation"),
        text: L("المعمل والمعرض: ١٤ شارع البرازيل، الزمالك، القاهرة.", "Lab and studio: 14 Brazil St, Zamalek, Cairo."),
        heading: L("احكيلنا عن بشرتك", "Tell us about your skin"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التركيبات والتوصيل والاستبدال.", "Formulas, delivery and exchanges."),
        question: L("المنتجات مناسبة للبشرة الحساسة؟", "Are the products suitable for sensitive skin?"),
        answer: L(
          "كل تركيباتنا من غير عطور مضافة، ومتجربة على البشرة الحساسة. لو عندك حساسية معينة، ابعتيلنا على واتساب ونرشحلك الأنسب.",
          "All our formulas are fragrance-free and tested on sensitive skin. If you have a specific allergy, message us on WhatsApp and we will suggest the right one.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("تجارب عميلاتنا", "What our customers say"), related: L("يكمّل روتينك", "Completes your ritual") },
  },
});
