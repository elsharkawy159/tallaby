/**
 * Sports Warm (2026-10-28, sports & fitness niche, warm / weekend outdoors):
 * sand paper, terracotta and mustard, El Messiri headings over Tajawal,
 * soft 12px corners and a 1360px container. A slow Friday-morning home: the
 * announcement header with a badge, a split hero of a padel court at
 * sunrise, category cards, best sellers in a carousel, the founders' story
 * beside a sunlit sports hall, four category rows with 4:3 photos, a photo
 * newsletter card of a picnic camp and the classic footer. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at about 2000px (2026-10-28):
 * equipment, courts and camps only, no people or hands, no readable brand
 * lettering, none used twice. Hero 10926537; about 38919355, about page
 * 6010282, newsletter 39370297; tiles 669576, 30894524, 6572987, 26776491,
 * 35215418, 36440179; products as listed in `DEMO`. QA swaps from the
 * curator's list: hero 3232533 (people by the tent) dropped (the split hero
 * takes one photo); about page 7186312 (pictogram figures on the wall) for
 * 6010282; tiles 6388373 (wall lettering) and 32401756 (golfers on the
 * fairway) for 669576 and 6572987; 35651163 and 32610335 (stamped and
 * printed brands), 29090100 (printed racket text), 17723969 (a far glove),
 * 12783350, 6572974 and 16566770 (ball brands) and 20439094 (printed
 * figures on the blocks) for 37887283, 4464780, 36188826, 15589132,
 * 38398119, 6572969, 9117912 and 31470217.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone } from "../library-template";

export const SPORTS_WARM_KEY = "sports-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SPORTS_WARM_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(10926537, 1920),
  sunHall: pexels(38919355, 1200),
  archCourt: pexels(6010282, 1200),
  newsletter: pexels(39370297, 1200),
  // Category photos.
  catStrength: pexels(669576, 1200),
  catRacket: pexels(30894524, 1200),
  catBall: pexels(6572987, 1200),
  catCamping: pexels(26776491, 1200),
  catAccessories: pexels(35215418, 1200),
  catCycling: pexels(36440179, 1200),
};

const NAME = L("مشوار", "Meshwar");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المعدات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L(
      "معدات لرياضة الويك إند والرحلات: الملعب الصبح، والتخييم بالليل.",
      "Gear for weekend sport and trips: the court by morning, the camp by night.",
    ),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل المعدات", "All gear"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١١٥ ٣٦٢ ٨٠٩٤"), phone("+20 115 362 8094")),
    "‏hello@store.com": L("‏hello@meshwar.eg", "hello@meshwar.eg"),
    "١٢ شارع النيل، الزمالك، القاهرة": L("٩ شارع ٢٣٣، دجلة، المعادي، القاهرة", "9 Road 233, Degla, Maadi, Cairo"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم من ١٠ الصبح لـ ١٠ بالليل", "Daily, 10am to 10pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مشوار. كل الحقوق محفوظة.", "© 2026 Meshwar. All rights reserved."),
    // The storefront adds its own "Powered by" line, so the design's credit stays empty.
    "بواسطة طلبي": L("", ""),
  },
  links: { "https://wa.me/": "https://wa.me/201153628094", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.hero],
    text: {
      "صورة الواجهة": L("ملعب بادل وقت الشروق", "A padel court at sunrise"),
      "المجموعة الجديدة": L("رياضة الويك إند", "Weekend sport"),
      "معمول بكميات صغيرة": L("الجمعة الصبح في الملعب", "Friday morning on court"),
      "قطع مختارة بعناية، بنعملها بكميات صغيرة عشان كل واحدة تفضل مميزة.": L(
        "مضارب، كور وحديد للبيت، ومعدات رحلات لما الشلة تقرر تطلع. كله مختار عشان يتلعب بيه سنين.",
        "Rackets, balls and home weights, plus camping gear for when friends decide to head out. All chosen to be played with for years.",
      ),
      "تسوّق المجموعة": L("تسوّق المعدات", "Shop the gear"),
      "حكايتنا": L("حكايتنا", "Our story"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-chips", {
    text: { "إيه اللي في بالك؟": L("مشوار النهارده لفين؟", "Where’s today’s outing?") },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-carousel", {
    text: { "الأكثر مبيعاً": L("اللي الشلة بتطلبه", "What our regulars order") },
    links: { "/products": BEST },
    lists: [{ limit: 8 }],
  }),
  lib("about-split-story", {
    photo: [undefined, undefined, PHOTOS.sunHall],
    text: {
      "صورة القصة": L("صالة رياضية مشمسة بأرضية لامعة", "A sunlit sports hall with a glossy floor"),
      "من ورشتنا": L("من المعادي", "From Maadi"),
      "متصمم عشانك ومعمول في القاهرة": L("بدأنا بشلة وكورة", "It started with friends and a ball"),
      "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": L(
        "كنا شلة بتلعب كل جمعة في نادي المعادي، وبتطلع سيناء كل شهر. فتحنا مشوار عشان نلاقي معدات حلوة بسعر معقول من غير لف.",
        "We were friends who played every Friday at the Maadi club and went to Sinai every month. We opened Meshwar to find good gear at a fair price without the hunt.",
      ),
      "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": L(
        "+١٥٠٠٠ عميل بيلعبوا ويخيّموا بمعدات من مشوار، وتقييمنا ٤٫٨ من ٥.",
        "15,000+ customers play and camp with Meshwar gear, rated 4.8 out of 5.",
      ),
      "حكايتنا": L("اقرا حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("الكل", "All"),
    muted: [3],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "landscape" } } },
  }),
  lib("newsletter-photo", {
    photo: [undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("كرسيين تخييم وترابيزة في مرج أخضر", "Two camp chairs and a table in a green meadow"),
      "للمشتركين": L("جواب مشوار", "The Meshwar letter"),
      "خد ١٠٪ خصم على أول طلب": L("أفكار لمشوار الويك إند", "Ideas for your weekend"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L(
        "رسالة كل خميس: أماكن تخييم حلوة، ملاعب جديدة في القاهرة والمعدات اللي وصلت.",
        "A letter every Thursday: good camping spots, new courts in Cairo and the gear that just arrived.",
      ),
      "بدون رسائل مزعجة. تقدر تلغي في أي وقت.": L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("معدات لرياضة الويك إند والرحلات، من المعادي.", "Gear for weekend sport and trips, from Maadi.")),
  aboutStory(lib, {
    photo: PHOTOS.archCourt,
    alt: L("ملعب تنس أخضر قدام قناطر بيضا", "A green tennis court in front of white arches"),
    eyebrow: L("من ٢٠١٨", "Since 2018"),
    title: L("الرياضة أحلى مع الصحاب", "Sport is better with friends"),
    text: L(
      "بنختار معدات بسيطة وبتستحمل: مضرب ينفع للجمعة والسبت، وخيمة تتنصب في عشر دقايق.",
      "We choose simple, sturdy gear: a racket that works every weekend, a tent that goes up in ten minutes.",
    ),
    more: L("ولو حاجة باظت في أول سنة، بنصلّحها أو نبدّلها.", "If anything breaks in its first year, we repair or replace it."),
    button: L("تسوّق المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("معدات لرياضة الويك إند والرحلات، من المعادي.", "Gear for weekend sport and trips, from Maadi."),
  categories: [
    ["strength-training", "حديد البيت", "Home strength", PHOTOS.catStrength],
    ["racket-sports", "مضارب وريشة", "Rackets", PHOTOS.catRacket],
    ["ball-sports", "كور وملاعب", "Balls", PHOTOS.catBall],
    ["camping", "تخييم ورحلات", "Camping", PHOTOS.catCamping],
    ["training-accessories", "إكسسوارات التمرين", "Accessories", PHOTOS.catAccessories],
    ["cycling", "العجل", "Cycling", PHOTOS.catCycling],
  ],
  products: [
    // Home strength
    ["mirror-dumbbell-row", "strength-training", "صف دمبل رمادي ٢-٢٠ كجم", "Grey Dumbbell Row, 2–20 kg", P(4164765), 13900, { rating: 4.7, sold90: 14 }],
    ["iron-gym-dumbbells", "strength-training", "دمبل حديد بطارات", "Iron Plate Dumbbells", P(35567437), 2400, { rating: 4.6, sold90: 39 }],
    ["knurled-handle-dumbbell", "strength-training", "دمبل بمقبض محزز", "Knurled-Grip Dumbbell", P(29495718), 1100, { rating: 4.8, sold90: 26 }],
    ["black-kettlebell-set", "strength-training", "طقم كيتل بل أسود", "Black Kettlebell Set", P(7671465), 5200, { isFeatured: true, rating: 4.9, sold90: 64 }],
    ["rubber-plate-rack", "strength-training", "رف طارات مطاط", "Rubber Plate Rack", P(27810162), 16500, { rating: 4.5, sold90: 6 }],
    ["rubber-dumbbell-set", "strength-training", "طقم دمبل مطاط", "Rubber Dumbbell Set", P(7187871), 4600, { compareAtPrice: 5200, rating: 4.7, sold90: 22 }],
    ["vinyl-dumbbells-5", "strength-training", "زوج دمبل فينيل ٥ كجم", "Vinyl Dumbbell Pair, 5 kg", P(37887283), 780, { rating: 4.8, sold90: 51 }],
    ["cable-weight-stack", "strength-training", "طارات جهاز كابل", "Cable Machine Weight Stack", P(4464780), 9800, { rating: 4.4, sold90: 4, inStock: false }],
    // Rackets
    ["clay-court-racket", "racket-sports", "مضرب تنس للملاعب الرملية", "Clay Court Tennis Racket", P(5739115), 3300, { rating: 4.8, sold90: 33 }],
    ["tennis-ball-basket", "racket-sports", "سلة كور تنس مع مضرب", "Tennis Ball Basket and Racket", P(35214651), 2150, { rating: 4.6, sold90: 18 }],
    ["badminton-racket-pair", "racket-sports", "مضربين ريشة مع ٣ ريشات", "Badminton Pair with 3 Shuttles", P(6307230), 1250, { rating: 4.7, sold90: 57 }],
    ["feather-shuttle-set", "racket-sports", "ريش طبيعي على المضرب", "Feather Shuttle Set", P(6878113), 340, { rating: 4.5, sold90: 24 }],
    ["teal-table-tennis-set", "racket-sports", "طقم بينج بونج للترابيزة", "Table Tennis Set", P(3846048), 690, { compareAtPrice: 790, rating: 4.6, sold90: 29 }],
    ["single-badminton-racket", "racket-sports", "مضرب ريشة خفيف", "Light Badminton Racket", P(7235235), 850, { rating: 4.4, sold90: 12 }],
    ["blue-paddle-and-ball", "racket-sports", "مضرب بينج بونج أزرق", "Blue Table Tennis Paddle", P(13793163), 420, { rating: 4.5, sold90: 15 }],
    ["cork-shuttlecock", "racket-sports", "ريشة فلين للمحترفين", "Pro Cork Shuttlecock", P(36188826), 95, { rating: 4.8, sold90: 20 }],
    // Balls
    ["futsal-ball", "ball-sports", "كورة خماسي", "Five-a-Side Football", P(36938346), 990, { rating: 4.7, sold90: 61 }],
    ["corner-match-ball", "ball-sports", "كورة ماتش أبيض وأحمر", "White and Red Match Ball", P(37187415), 1150, { rating: 4.8, sold90: 28 }],
    ["leather-glove-and-ball", "ball-sports", "جوانتي بيسبول جلد مع كورة", "Leather Glove and Ball", P(1661950), 1850, { rating: 4.6, sold90: 9 }],
    ["neon-turf-football", "ball-sports", "كورة نجيل صناعي فسفوري", "Neon Turf Football", P(15589132), 720, { rating: 4.5, sold90: 23 }],
    ["baseball-gear-bundle", "ball-sports", "عدة بيسبول كاملة", "Baseball Gear Bundle", P(5184714), 3900, { rating: 4.7, sold90: 7 }],
    ["sunset-basketball", "ball-sports", "كورة سلة للملاعب المفتوحة", "Outdoor Court Basketball", P(38398119), 890, { rating: 4.6, sold90: 19 }],
    ["golf-balls-on-tees", "ball-sports", "كور جولف مع تيز", "Golf Balls with Tees", P(6572969), 560, { compareAtPrice: 640, rating: 4.4, sold90: 11 }],
    ["playground-basketball", "ball-sports", "كورة سلة للملعب", "Playground Basketball", P(9117912), 780, { rating: 4.7, sold90: 35 }],
    // Camping
    ["striped-folding-chair", "camping", "كرسي رحلات مقلم", "Striped Folding Chair", P(12737640), 1250, { rating: 4.7, sold90: 42 }],
    ["green-camp-chair", "camping", "كرسي تخييم أخضر", "Green Camp Chair", P(35223576), 980, { isFeatured: true, rating: 4.8, sold90: 30 }],
    ["gas-stove-kettle", "camping", "سخان غاز بالكنكة", "Gas Stove with Kettle", P(19715432), 1450, { rating: 4.6, sold90: 25 }],
    ["striped-hammock", "camping", "هاموك قماش مقلم", "Striped Hammock", P(29221542), 1650, { rating: 4.9, sold90: 48 }],
    ["red-camp-chair", "camping", "كرسي رحلات أحمر", "Red Camp Chair", P(7348926), 1050, { rating: 4.5, sold90: 16 }],
    ["camp-kettle-stove", "camping", "كنكة تخييم على موقد", "Camp Kettle and Burner", P(29295215), 1350, { rating: 4.7, sold90: 21 }],
    ["rope-net-hammock", "camping", "هاموك شبك", "Rope Net Hammock", P(33213075), 890, { compareAtPrice: 990, rating: 4.4, sold90: 13 }],
    ["red-kerosene-lantern", "camping", "فانوس جاز أحمر", "Red Kerosene Lantern", P(11056057), 620, { rating: 4.8, sold90: 37 }],
    // Accessories
    ["red-mats-and-ropes", "training-accessories", "مراتب ومعاهم حبال نط", "Mats with Jump Ropes", P(6339715), 1490, { rating: 4.6, sold90: 18 }],
    ["black-gym-rings", "training-accessories", "حلقات جمباز سودا", "Black Gym Rings", P(17101731), 1150, { rating: 4.7, sold90: 22 }],
    ["wooden-gym-rings", "training-accessories", "حلقات خشب بأحزمة", "Wooden Rings with Straps", P(4164508), 1350, { rating: 4.9, sold90: 15 }],
    ["yellow-mat-slam-ball", "training-accessories", "مرتبة صفرا مع كورة سلام", "Yellow Mat with Slam Ball", P(31470217), 1750, { rating: 4.5, sold90: 9 }],
    // Cycling
    ["rust-orange-bike", "cycling", "عجلة كلاسيك برتقالي", "Rust-Orange Classic Bike", P(32403277), 8800, { rating: 4.6, sold90: 7 }],
    ["beach-cruiser", "cycling", "عجلة كروزر للبحر", "Beach Cruiser", P(13012115), 9900, { rating: 4.8, sold90: 10 }],
    ["country-trail-bike", "cycling", "عجلة للمدقات الريفية", "Country Trail Bike", P(17923397), 10500, { rating: 4.7, sold90: 8 }],
    ["red-fender-bike", "cycling", "عجلة برفرف أحمر", "Red-Fender Bike", P(14356390), 7600, { rating: 4.5, sold90: 5 }],
  ],
});

export const SPORTS_WARM = libraryTemplate({
  key: SPORTS_WARM_KEY,
  version: 1,
  name: L("مشوار", "Meshwar"),
  description: L(
    "متجر رياضة دافي لروح الويك إند: ملعب بادل وقت الشروق، كروت أقسام وأربع صفوف للأقسام. لمتاجر الرياضة والرحلات.",
    "Warm weekend sport: a padel court at sunrise, category cards and four category rows. For sport and outdoor shops.",
  ),
  category: "sports",
  sortOrder: 1490,
  palette: ["#f6efe4", "#ece0cd", "#a4471f", "#d9a441"],
  colors: {
    primary: "#a4471f",
    secondary: "#ece0cd",
    background: "#f6efe4",
    foreground: "#2e261e",
    muted: "#6a5c4d",
    border: "#ddcdb6",
    accent: "#d9a441",
  },
  fonts: { heading: "El Messiri", body: "Tajawal" },
  radius: 12,
  containerMaxWidth: 1360,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("حكايتنا", "Our story") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تعالى زورنا", "Come and visit"),
        text: L(
          `٩ شارع ٢٣٣، دجلة، المعادي، القاهرة، ${phone("٠١١٥ ٣٦٢ ٨٠٩٤")}`,
          `9 Road 233, Degla, Maadi, Cairo | ${phone("+20 115 362 8094")}`,
        ),
        heading: L("اسألنا عن أي مشوار", "Ask us about any trip"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والضمان ومعدات الرحلات.", "Delivery, guarantee and camping gear."),
        question: L("الخيمة والكراسي بيوصلوا قبل الويك إند؟", "Will camping gear arrive before the weekend?"),
        answer: L(
          "لو طلبت قبل الأربع الضهر، بيوصل القاهرة والجيزة يوم الخميس. وبنبعت مع كل خيمة ورقة تركيب بسيطة بالعربي.",
          "Order before Wednesday noon and it reaches Cairo and Giza on Thursday. Every tent ships with simple set-up notes in Arabic.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من صحاب مشوار", "From Meshwar regulars"), related: L("يكمّل مشوارك", "Completes your trip") },
  },
});
