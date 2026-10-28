/**
 * Sports Bold (2026-10-28, sports & fitness niche, bold / high energy):
 * white paper, near-black ink, an electric cobalt brand and a volt-lime
 * accent, Changa headings over Rubik, rounded 16px corners and a 1320px
 * container. A match-day home: a scrolling ticker header, a three-slide hero
 * carousel of a running track, tennis courts and a pitch from above,
 * categories as a big-type list, best sellers in tall cards, the training
 * story in a round photo, four category rows with rounded frames, a slim
 * newsletter strip and the sign-off footer. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at about 2000px (2026-10-28):
 * equipment, courts and pitches only, no people or hands, no readable
 * brand lettering, none used twice. Slides 19190279, 13425628, 12486370;
 * about 6739958, about page 9545907; tiles 40371837, 11213192, 37767349,
 * 14100743, 13248384, 16082647; products as listed in `DEMO`. QA swaps from
 * the curator's list: camping tile 35726043 (people on the ridge) for
 * 14100743; 9545911 (embossed brand), 4164772, 4464720 (plate brands) for
 * 669577, 16513602 and 4162451; rackets 40265875, 30864601, 31012869 and
 * 40293706 (racket and paddle brands) and 7438726 for 33277222, 3660204,
 * 187329, 8681352 and 8007166; balls 10452323, 15749092 (ball brands) and
 * 9519543 (a person by the goal) for 12075685, 7405712 and 32456002;
 * tents 4268126 (a person), 10762666 (brand on the fly), 28885323 and
 * 35726043 for 2526025, 216676, 9269367 and 22669473; 6339679 (same shoot
 * as 6339678) for 6339731; bikes 11685355 and 14629820 (frame lettering)
 * for 18953825 and 19906579.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone } from "../library-template";

export const SPORTS_BOLD_KEY = "sports-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SPORTS_BOLD_KEY, getDesign(id)!, { corners: 16, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const WHATSAPP = "https://wa.me/201095842731";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideTrack: pexels(19190279, 1920),
  slideCourts: pexels(13425628, 1920),
  slidePitch: pexels(12486370, 1920),
  boxingGym: pexels(6739958, 1200),
  functionalGym: pexels(9545907, 1200),
  // Category photos.
  catStrength: pexels(40371837, 1200),
  catRacket: pexels(11213192, 1200),
  catBall: pexels(37767349, 1200),
  catCamping: pexels(14100743, 1200),
  catAccessories: pexels(13248384, 1200),
  catCycling: pexels(16082647, 1200),
};

const NAME = L("نبض", "Nabd");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّع طلبك من صفحة طلباتي", "Track your order in My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المعدات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر مبيعًا", "Best sellers"),
    "من نحن": L("عن نبض", "About"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("يلا نتمرن", "Let’s go train"),
    "كلمنا على واتساب": L("اسأل مدرب على واتساب", "Ask a coach on WhatsApp"),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل المعدات", "All gear"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الاستبدال والاسترجاع", "Exchanges & refunds"),
    "من نحن": L("عن نبض", "About Nabd"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نبض. كل الحقوق محفوظة.", "© 2026 Nabd. All rights reserved."),
  },
  links: { "https://wa.me/": WHATSAPP, "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideTrack, PHOTOS.slideCourts, PHOTOS.slidePitch],
    text: {
      "صورة الحملة الأولى": L("حارات تراك جري حمرا بخطوط بيضا", "Red running-track lanes with white lines"),
      "وصل حديثًا": L("الموسم الجديد", "New season"),
      "الموسم الجديد وصل": L("ارفع السرعة", "Turn up the pace"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("حديد، كور ومضارب للي بيتمرن بجد، بتوصلك خلال ٤٨ ساعة.", "Iron, balls and rackets for people who train hard, delivered in 48 hours."),
      "تسوّق الجديد": L("شوف الجديد", "Shop new"),
      "صورة الحملة الثانية": L("ملاعب تنس زرقا من فوق", "Blue tennis courts from above"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("اللي الكل بيلعب بيه", "What everyone plays with"),
      "القطع اللي بترجع لها كل مرة.": L("مضارب وريش وكور اختارها لاعيبة النوادي في القاهرة.", "Rackets, shuttles and balls picked by Cairo club players."),
      "شوف الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "صورة الحملة الثالثة": L("ملعب كورة وسط غابة من فوق", "A football pitch in a forest, from above"),
      "عروض الأسبوع": L("جهّز فريقك", "Kit out your team"),
      "خصومات لفترة محدودة": L("كل اللي الفريق محتاجه", "Everything the team needs"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("كور ماتش وتمرين، أقماع وحبال في طلب واحد.", "Match and training balls, cones and ropes in one order."),
      "تسوّق العروض": L("تسوّق الكل", "Shop all"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-big-type", {
    text: { "منتج": L("منتج", "items") },
  }),
  lib("products-rail", {
    text: {
      "بيحبوها": L("الأكثر مبيعًا الشهر ده", "This month’s best sellers"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "عرض الكل": L("الكل", "All"),
    },
  }),
  lib("about-circle", {
    person: [PHOTOS.boxingGym],
    text: {
      "صورة الفريق": L("صالة تدريب فيها شنط ملاكمة وحبال", "A training gym with heavy bags and straps"),
      "إحنا مين": L("من صالتنا في مدينة نصر", "From our Nasr City gym"),
      "فريق صغير بيحب اللي بيعمله": L("مدربين قبل ما نكون بياعين", "Coaches first, sellers second"),
      "بنرد على كل رسالة بنفسنا، وبنختار كل منتج كأننا هنستخدمه.": L(
        "+٢٠٠٠٠ لاعب ومدرب في مصر بيتمرنوا بمعدات من نبض. كل قطعة بنستخدمها في صالتنا الأول، ولو ما عجبتكش بنبدّلها خلال ١٤ يوم.",
        "20,000+ players and coaches in Egypt train with Nabd gear. We use every piece in our own gym first, and swap anything you don't love within 14 days.",
      ),
      "قابل الفريق": L("اعرف حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("الكل", "All"),
    muted: [1, 3],
    nodes: { "صورة المنتج": { style: { radius: 16 } } },
  }),
  lib("newsletter-strip", {
    text: {
      "اعرف الجديد الأول": L("اعرف الجديد قبل الكل", "Hear about new gear first"),
      "المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.": L("معدات جديدة وتمرين الأسبوع من مدربينا، مرة في الأسبوع.", "New gear and our coaches’ workout of the week, once a week."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نبض", "About Nabd"), L("معدات رياضة للي بيتمرن بجد، من مدينة نصر.", "Sports gear for people who train hard, from Nasr City.")),
  aboutStory(lib, {
    photo: PHOTOS.functionalGym,
    alt: L("صالة تدريب فيها أجهزة عجل وحلقات", "A training gym with air bikes and rings"),
    eyebrow: L("من ٢٠١٦", "Since 2016"),
    title: L("بدأنا من صالة تدريب", "We started in a gym"),
    text: L(
      "كنا مدربين بندوّر على معدات تستحمل التمرين اليومي بسعر معقول، وما لقيناش، فبدأنا نستوردها بنفسنا.",
      "We were coaches looking for gear that survives daily training at a fair price. We could not find it, so we started importing it ourselves.",
    ),
    more: L("النهارده بنجهّز صالات ونوادي ومدارس في كل محافظات مصر.", "Today we equip gyms, clubs and schools in every governorate of Egypt."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("معدات رياضة للي بيتمرن بجد، من مدينة نصر.", "Sports gear for people who train hard, from Nasr City."),
  categories: [
    ["strength-training", "تمارين القوة", "Strength", PHOTOS.catStrength],
    ["racket-sports", "رياضات المضرب", "Racket sports", PHOTOS.catRacket],
    ["ball-sports", "رياضات الكرة", "Ball sports", PHOTOS.catBall],
    ["camping", "رحلات وتخييم", "Camping", PHOTOS.catCamping],
    ["training-accessories", "إكسسوارات التمرين", "Accessories", PHOTOS.catAccessories],
    ["cycling", "العجل", "Cycling", PHOTOS.catCycling],
  ],
  products: [
    // Strength
    ["hex-dumbbell-tower", "strength-training", "رف دمبل سداسي ١٠ أزواج", "Hex Dumbbell Tower, 10 Pairs", P(6550849), 18500, { isFeatured: true, rating: 4.8, sold90: 21 }],
    ["colour-kettlebell-rack", "strength-training", "طقم كيتل بل ألوان", "Colour Kettlebell Set", P(14502911), 7900, { rating: 4.9, sold90: 96 }],
    ["iron-plates-set", "strength-training", "طقم طارات حديد ١٤ كجم", "Iron Plate Set, 14 kg", P(669577), 1450, { rating: 4.7, sold90: 58 }],
    ["chalked-kettlebells", "strength-training", "كيتل بل حديد للكروس فيت", "Cross-Training Kettlebells", P(8611295), 2200, { compareAtPrice: 2500, rating: 4.6, sold90: 34 }],
    ["bumper-plate-dumbbell", "strength-training", "طارة بامبر ١٥ كجم مع دمبل", "Bumper Plate and Dumbbell", P(16513602), 2650, { rating: 4.7, sold90: 27 }],
    ["heavy-dumbbell-rack", "strength-training", "دمبل تقيل ٢٥ كجم", "Heavy Dumbbell, 25 kg", P(14289784), 2900, { rating: 4.8, sold90: 19 }],
    ["medicine-ball-rack", "strength-training", "طقم كور طبية مع رف", "Medicine Ball Set with Rack", P(27810160), 12500, { rating: 4.5, sold90: 8 }],
    ["pro-dumbbell-rack", "strength-training", "رف دمبل بروفيشنال", "Pro Dumbbell Rack", P(4162451), 26500, { rating: 4.6, sold90: 5, inStock: false }],
    // Racket sports
    ["graphite-tennis-pair", "racket-sports", "مضربين تنس جرافيت", "Graphite Tennis Pair", P(37988076), 4200, { rating: 4.8, sold90: 39 }],
    ["tennis-ball-hopper", "racket-sports", "سلة كور تنس للتمرين", "Tennis Ball Hopper", P(33277222), 1850, { rating: 4.7, sold90: 82 }],
    ["badminton-club-set", "racket-sports", "طقم ريشة للنوادي", "Badminton Club Set", P(3660204), 3400, { rating: 4.6, sold90: 22 }],
    ["shuttlecock-trio", "racket-sports", "ريش تمرين، ٣ قطع", "Training Shuttlecocks, 3 Pack", P(6878022), 260, { rating: 4.5, sold90: 47 }],
    ["red-table-tennis-bat", "racket-sports", "مضرب بينج بونج أحمر مع كورة", "Red Table Tennis Bat and Ball", P(187329), 740, { compareAtPrice: 850, rating: 4.7, sold90: 30 }],
    ["shuttlecock-tube-24", "racket-sports", "ريش ريشة طائرة، ٢٤ قطعة", "Shuttlecocks, 24 Pack", P(8007166), 1650, { rating: 4.8, sold90: 15 }],
    ["garden-paddle-pair", "racket-sports", "مضربين بينج بونج للجنينة", "Garden Paddle Pair", P(8681352), 560, { rating: 4.4, sold90: 18 }],
    ["wood-paddle-set", "racket-sports", "طقم بينج بونج خشب", "Wood Paddle Set", P(40034692), 690, { rating: 4.6, sold90: 12 }],
    // Ball sports
    ["volleyball-grass", "ball-sports", "كورة طايرة أزرق وأصفر", "Blue and Yellow Volleyball", P(32456002), 890, { rating: 4.8, sold90: 71 }],
    ["street-basketball", "ball-sports", "كورة سلة للشارع", "Street Basketball", P(8337517), 950, { rating: 4.7, sold90: 44 }],
    ["indoor-basketball", "ball-sports", "كورة سلة للصالات", "Indoor Basketball", P(12075685), 1350, { isFeatured: true, rating: 4.9, sold90: 25 }],
    ["golf-practice-balls", "ball-sports", "كور جولف للتمرين، ٤٠ قطعة", "Golf Practice Balls, 40 Pack", P(6572975), 1900, { rating: 4.5, sold90: 13 }],
    ["range-ball-bucket", "ball-sports", "جردل كور جولف صفرا", "Yellow Range Ball Bucket", P(6572977), 1450, { rating: 4.6, sold90: 17 }],
    ["green-gold-basketball", "ball-sports", "كورة سلة أخضر ودهبي", "Green and Gold Basketball", P(7405712), 820, { compareAtPrice: 950, rating: 4.4, sold90: 20 }],
    ["baseball-starter-kit", "ball-sports", "طقم بيسبول للمبتدئين", "Baseball Starter Kit", P(5184684), 2600, { rating: 4.7, sold90: 9 }],
    ["batting-helmet-set", "ball-sports", "خوذة بيسبول مع ٨ كور", "Batting Helmet with 8 Balls", P(5184706), 2100, { rating: 4.6, sold90: 7 }],
    // Camping
    ["blue-dome-tent", "camping", "خيمة قبة زرقا ٣ أفراد", "Blue Dome Tent, 3 Person", P(15925118), 3900, { rating: 4.8, sold90: 52 }],
    ["orange-hiker-tent", "camping", "خيمة هايكنج برتقالي", "Orange Hiker Tent", P(33102150), 4600, { rating: 4.7, sold90: 28 }],
    ["tunnel-tent-pair", "camping", "خيمة تانل لفردين", "Two-Person Tunnel Tent", P(4268094), 3500, { rating: 4.6, sold90: 23 }],
    ["geodesic-dome-tent", "camping", "خيمة قبة جيوديسك ٨ أفراد", "Geodesic Dome Tent, 8 Person", P(30482810), 14500, { rating: 4.9, sold90: 6 }],
    ["pop-up-tent", "camping", "خيمة بتتفتح لوحدها", "Pop-Up Tent", P(2526025), 2700, { compareAtPrice: 3100, rating: 4.5, sold90: 33 }],
    ["camo-dome-tent", "camping", "خيمة قبة مموهة", "Camo Dome Tent", P(216676), 3200, { rating: 4.4, sold90: 14 }],
    ["canvas-ridge-tent", "camping", "خيمة كانفاس كلاسيك", "Canvas Ridge Tent", P(9269367), 8900, { rating: 4.7, sold90: 10 }],
    ["hanging-camp-lantern", "camping", "فانوس تعليق للخيمة", "Hanging Camp Lantern", P(22669473), 650, { rating: 4.8, sold90: 37 }],
    // Accessories
    ["pink-foam-roller", "training-accessories", "رول فوم بينك مع كورة", "Pink Foam Roller with Ball", P(39059979), 590, { rating: 4.7, sold90: 31 }],
    ["blue-foam-roller", "training-accessories", "رول فوم أزرق", "Blue Foam Roller", P(16513603), 520, { rating: 4.6, sold90: 19 }],
    ["colour-jump-ropes", "training-accessories", "حبال نط ألوان، ٥ قطع", "Colour Jump Ropes, 5 Pack", P(6339678), 450, { rating: 4.5, sold90: 26 }],
    ["red-mats-and-weights", "training-accessories", "مراتب تمرين حمرا مع دمبلز", "Red Mats with Hand Weights", P(6339731), 1650, { rating: 4.7, sold90: 16 }],
    // Cycling
    ["dirt-trail-mtb", "cycling", "عجلة جبلي للمدقات", "Dirt Trail Mountain Bike", P(7614428), 16500, { rating: 4.8, sold90: 9 }],
    ["forest-trail-mtb", "cycling", "عجلة جبلي للغابات", "Forest Trail Mountain Bike", P(37897835), 18900, { rating: 4.7, sold90: 6 }],
    ["basket-city-bike", "cycling", "عجلة مدينة بسبت", "City Bike with Basket", P(18953825), 8500, { rating: 4.5, sold90: 11 }],
    ["red-classic-bike", "cycling", "عجلة كلاسيك حمرا", "Red Classic Bike", P(19906579), 9200, { rating: 4.6, sold90: 7 }],
  ],
});

export const SPORTS_BOLD = libraryTemplate({
  key: SPORTS_BOLD_KEY,
  version: 1,
  name: L("نبض", "Nabd"),
  description: L(
    "متجر رياضة بطاقة عالية: كاروسيل لملاعب وتراك، أقسام بخط ضخم وأربع صفوف للأقسام. لمتاجر المعدات والنوادي.",
    "High-energy sports: a carousel of tracks and courts, big-type categories and four category rows. For gear shops and clubs.",
  ),
  category: "sports",
  sortOrder: 1480,
  palette: ["#ffffff", "#eef1f6", "#1d3fd6", "#c8f031"],
  colors: {
    primary: "#1d3fd6",
    secondary: "#eef1f6",
    background: "#ffffff",
    foreground: "#0d1220",
    muted: "#545b6b",
    border: "#dde2ea",
    accent: "#c8f031",
  },
  fonts: { heading: "Changa", body: "Rubik" },
  radius: 16,
  containerMaxWidth: 1320,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نبض", "About"), seo: { title: L("عن نبض", "About Nabd") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تعالى الصالة أو كلمنا", "Visit the gym or call us"),
        text: L(
          `٦٢ شارع مكرم عبيد، مدينة نصر، القاهرة، ${phone("٠١٠٩ ٥٨٤ ٢٧٣١")}`,
          `62 Makram Ebeid St, Nasr City, Cairo | ${phone("+20 109 584 2731")}`,
        ),
        heading: L("جهّز صالتك أو فريقك معانا", "Equip your gym or team with us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل وطلبات الصالات والفرق.", "Delivery and orders for gyms and teams."),
        question: L("بتجهزوا صالات وفرق كاملة؟", "Do you equip whole gyms and teams?"),
        answer: L(
          "أيوه، ابعتلنا مساحة الصالة أو عدد اللاعيبة على واتساب، ومدرب من فريقنا يبعتلك قايمة كاملة. التوصيل والتركيب في القاهرة خلال ٣ أيام.",
          "Yes. Send us the gym size or the squad size on WhatsApp and one of our coaches will send a full list. Cairo delivery and set-up take 3 days.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    headingCase: "upper",
    band: "brand",
    extras: ["product-perks"],
    copy: { reviews: L("رأي اللاعيبة", "What players say"), related: L("كمّل عدّتك", "Complete your kit") },
  },
});
