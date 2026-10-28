/**
 * Perfumes Warm (2026-10-28, perfumes niche, warm / editorial): rose-sand
 * paper, rosewood red and saffron gold, El Messiri headings over Almarai,
 * soft 6px corners and a 1360px container. An old attar house, told like a
 * magazine: the ticker header, a three-slide hero carousel (amber bottles on
 * a wooden tray, sandalwood chips, attars in a carved box), the first
 * category large beside the rest in a list, a shelf of favourites, the
 * family story beside a jar of frankincense, four category rows with
 * portrait photos, a photo newsletter card and the classic footer. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28): bottles,
 * attars, resins, burners and diffusers only, no people or hands, no brand
 * names or readable labels, none used twice. Carousel 7795762, 34086126,
 * 8796361; about 13933906 (home), 36203521 (about page); newsletter 5590679;
 * tiles 7670686, 7796225, 6693877, 18294700, 7436114, 34972176, 932577;
 * products listed in DEMO.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const PERFUMES_WARM_KEY = "perfumes-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PERFUMES_WARM_KEY, getDesign(id)!, { corners: 6, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideTray: pexels(7795762, 1920),
  slideSandalwood: pexels(34086126, 1920),
  slideAttarBox: pexels(8796361, 1920),
  frankincense: pexels(13933906, 1200),
  aboutPage: pexels(36203521, 1200),
  newsletter: pexels(5590679, 1200),
  // Category list.
  catWomen: pexels(7670686, 1200),
  catMen: pexels(7796225, 1200),
  catOud: pexels(6693877, 1200),
  catBakhoor: pexels(18294700, 1200),
  catHome: pexels(7436114, 1200),
  catGifts: pexels(34972176, 1200),
  catMinis: pexels(932577, 1200),
};

const NAME = L("صندل", "Sandal");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("عيّنة هدية مع كل طلب", "A free sample with every order"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّع طلبك من صفحة طلباتي", "Track your order in My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الروايح", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("المفضّلة", "Favourites"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L("عطارة عيلة من خان الخليلي، من ١٩٦٢.", "A family attar house from Khan El Khalili, since 1962."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الروايح", "All scents"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الاستبدال والاسترجاع", "Exchanges & refunds"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١١٥ ٣٦٢ ٨٠٤٧"), "+20 115 362 8047"),
    "١٢ شارع النيل، الزمالك، القاهرة": L(`٨ شارع المعز، الجمالية، القاهرة، ${handle("hello@sandal.eg")}`, "8 El Moez St, El Gamaleya, Cairo, hello@sandal.eg"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم من ١١ الصبح لـ ١١ بالليل", "Daily, 11am to 11pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ صندل. كل الحقوق محفوظة.", "© 2026 Sandal. All rights reserved."),
    // The storefront adds its own platform credit, so the design’s one stays blank.
    "بواسطة طلبي": L("", ""),
  },
  links: { "https://wa.me/": "https://wa.me/201153628047", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideTray, PHOTOS.slideSandalwood, PHOTOS.slideAttarBox],
    text: {
      "صورة الحملة الأولى": L("زجاجات عنبري ومعطّر أعواد على صينية خشب", "Amber bottles and a reed diffuser on a wooden tray"),
      "وصل حديثًا": L("مجموعة الشتا", "The winter blends"),
      "الموسم الجديد وصل": L("روايح دافية لليالي الطويلة", "Warm scents for long nights"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("عنبر وصندل وعود، متعتّقين في قوارير زجاج زي ما جدّنا كان بيعمل.", "Amber, sandalwood and oud, aged in glass the way our grandfather did it."),
      "تسوّق الجديد": L("شوف الجديد", "Shop new in"),
      "صورة الحملة الثانية": L("قطع خشب صندل وورق شجر على ترابيزة خشب", "Sandalwood pieces and leaves on a wooden table"),
      "الأكثر مبيعًا": L("خشب الصندل", "Sandalwood"),
      "المفضّلة عند عملائنا": L("الريحة اللي اتسمّينا على اسمها", "The scent we are named after"),
      "القطع اللي بترجع لها كل مرة.": L("صندل هندي مطحون بإيدينا، في عطور وبخور وزيوت.", "Indian sandalwood, ground by hand, in perfumes, bakhoor and oils."),
      "شوف الأكثر مبيعًا": L("شوف المفضّلة", "Shop favourites"),
      "صورة الحملة الثالثة": L("قوارير عطر زيتي في صندوق خشب محفور", "Perfume oil bottles in a carved wooden box"),
      "عروض الأسبوع": L("صندوق العطّار", "The attar box"),
      "خصومات لفترة محدودة": L("هدية بتتفتح على مهل", "A gift that opens slowly"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("عطور زيتي في صناديق خشب، بتتكتب عليها الإهداء بخط إيد.", "Perfume oils in wooden boxes, with your message written by hand."),
      "تسوّق العروض": L("تسوّق الهدايا", "Shop gifts"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-feature-list", {
    text: {
      "الأقسام": L("رفوف العطارة", "Around the shop"),
      "كل الأقسام": L("كل الروايح", "Shop all"),
      "منتج": L("منتجات", "items"),
    },
    // The eyebrow reads the same Arabic as the title, so it is hidden.
    nodes: { "التسمية": { style: { hidden: true } } },
  }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("المفضّل عند زباينّا", "Our regulars’ favourites"),
      "وصل جديد": L("الأكثر طلبًا", "Best sellers"),
      "الأكثر مبيعًا": L("وصل حديثًا", "New in"),
      "عليه خصم": L("الأعلى تقييمًا", "Top rated"),
      "كل المنتجات": L("كل الروايح", "View all scents"),
    },
    links: { "/products": [BEST, NEW, RATED, SHOP] },
    lists: [{ source: "best-sellers" }],
  }),
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.frankincense],
    text: {
      "إزاي بنشتغل": L("من خان الخليلي", "From Khan El Khalili"),
      "كل منتج بيتراجع قبل ما يوصلك": L("تلات أجيال بتوزن العطر بالقطرة", "Three generations weighing scent drop by drop"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "فتح جدّي الدكان في شارع المعز سنة ١٩٦٢. لسه بنطحن الصندل ونعتّق العنبر بنفسنا، وبنعبّي كل قارورة قدامك لو جيت تزورنا.",
        "My grandfather opened the shop on El Moez Street in 1962. We still grind the sandalwood and age the amber ourselves, and fill each bottle in front of you when you visit.",
      ),
      "اعرف أكتر": L("اقرا حكايتنا", "Read our story"),
      "صورة المتجر": L("برطمان لبان وعيدان بالو سانتو وقرفة على حجر غامق", "A jar of frankincense with palo santo and cinnamon on dark stone"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("كل الروايح", "Shop all"),
    muted: [2, 4],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-photo", {
    photo: [undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("مبخرة نحاس معلّقة طالع منها دخان", "A hanging brass censer with rising smoke"),
      "للمشتركين": L("جواب صندل", "The Sandal letter"),
      "خد ١٠٪ خصم على أول طلب": L("حكاية ريحة، كل شهر", "One scent story a month"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L(
        "خلطة جديدة من الدكان، وسر من كراسة جدّي عن إزاي تبخّر البيت وتعتّق العطر.",
        "A new blend from the shop, and a secret from grandfather’s notebook on scenting the house and ageing perfume.",
      ),
      "بدون رسائل مزعجة. تقدر تلغي في أي وقت.": L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("عطارة عيلة من خان الخليلي، من ١٩٦٢.", "A family attar house from Khan El Khalili, since 1962.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("مبخرة نحاس محفورة وملعقة نحاس على مفرش", "An engraved brass burner and a brass spoon on a cloth"),
    eyebrow: L("من ١٩٦٢", "Since 1962"),
    title: L("دكان صغير ريحته بتوصل لآخر الشارع", "A small shop you can smell from the end of the street"),
    text: L(
      "كل الحكاية بدأت بقوارير زجاج ملوّن وميزان نحاس. النهارده بنبعت نفس الخلطات لكل محافظات مصر.",
      "It all began with coloured glass flacons and a brass scale. Today we send the same blends to every governorate in Egypt.",
    ),
    more: L("ولسه أي حد يقدر يطلب خلطته الخاصة، ونحفظها باسمه في الكراسة.", "Anyone can still order their own blend, and we keep it in the notebook under their name."),
    button: L("تسوّق المفضّلة", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عطارة عيلة من خان الخليلي، من ١٩٦٢.", "A family attar house from Khan El Khalili, since 1962."),
  categories: [
    ["womens-perfumes", "عطور الستات", "For her", PHOTOS.catWomen],
    ["mens-perfumes", "عطور الرجالة", "For him", PHOTOS.catMen],
    ["oud-attars", "العود والعطور الزيتي", "Oud & attars", PHOTOS.catOud],
    ["bakhoor-incense", "البخور والمباخر", "Bakhoor & burners", PHOTOS.catBakhoor],
    ["home-fragrance", "ريحة البيت", "Home fragrance", PHOTOS.catHome],
    ["gift-sets", "هدايا العطّار", "Gift boxes", PHOTOS.catGifts],
    ["travel-minis", "أحجام صغيرة", "Minis", PHOTOS.catMinis],
  ],
  products: [
    // For her
    ["dried-rose-edp", "womens-perfumes", "ورد مجفف ٥٠ مل", "Dried Rose EDP 50ml", P(30999401), 2350, { isFeatured: true, rating: 4.9, sold90: 84 }],
    ["carnation-cloud-edp", "womens-perfumes", "قرنفل وردي ٥٠ مل", "Pink Carnation EDP 50ml", P(11699570), 2150, { rating: 4.8, sold90: 61 }],
    ["green-attar-crystal", "womens-perfumes", "كريستال مسك أخضر ٣٠ مل", "Green Musk Crystal 30ml", P(10629797), 1850, { rating: 4.7, sold90: 47 }],
    ["three-sisters-edt", "womens-perfumes", "تلات أخوات ١٠٠ مل", "Three Sisters EDT 100ml", P(264870), 1950, { compareAtPrice: 2250, rating: 4.6, sold90: 38 }],
    ["clay-musk-edp", "womens-perfumes", "مسك الطين ٥٠ مل", "Clay Musk EDP 50ml", P(7005940), 2450, { rating: 4.8, sold90: 42 }],
    ["pomegranate-edp", "womens-perfumes", "رمّان أحمر ٥٠ مل", "Red Pomegranate EDP 50ml", P(35825554), 2250, { rating: 4.7, sold90: 29 }],
    ["pearl-ribbon-edp", "womens-perfumes", "فيونكة اللولي ١٠٠ مل", "Pearl Ribbon EDP 100ml", P(36910564), 2650, { rating: 4.6, sold90: 23 }],
    ["peach-facet-edp", "womens-perfumes", "خوخ ناعم ٣٠ مل", "Soft Peach EDP 30ml", P(16266287), 1650, { rating: 4.5, sold90: 19, inStock: false }],
    // For him
    ["amber-gentleman-edp", "mens-perfumes", "عنبر الباشا ١٠٠ مل", "The Pasha’s Amber EDP 100ml", P(12146871), 2850, { isFeatured: true, rating: 4.9, sold90: 79 }],
    ["old-wood-edp", "mens-perfumes", "خشب قديم ١٠٠ مل", "Old Wood EDP 100ml", P(30232707), 2650, { rating: 4.8, sold90: 58 }],
    ["pine-star-edt", "mens-perfumes", "صنوبر الشتا ١٠٠ مل", "Winter Pine EDT 100ml", P(18490313), 2150, { rating: 4.6, sold90: 36 }],
    ["smoke-stone-edp", "mens-perfumes", "دخان وحجر ٥٠ مل", "Smoke & Stone EDP 50ml", P(7814963), 2450, { rating: 4.7, sold90: 31 }],
    ["saffron-stone-edp", "mens-perfumes", "زعفران الصخر ٥٠ مل", "Saffron Rock EDP 50ml", P(8166627), 2250, { compareAtPrice: 2550, rating: 4.7, sold90: 27 }],
    ["desert-sand-edt", "mens-perfumes", "رملة سيوة ١٠٠ مل", "Siwa Sand EDT 100ml", P(8361539), 1950, { rating: 4.6, sold90: 33 }],
    ["cashmere-amber-edp", "mens-perfumes", "عنبر الكشمير ٣٠ مل", "Cashmere Amber EDP 30ml", P(11161892), 1450, { rating: 4.5, sold90: 24 }],
    ["snow-musk-edt", "mens-perfumes", "مسك التلج ٥٠ مل", "Snow Musk EDT 50ml", P(15433488), 1750, { rating: 4.4, sold90: 17 }],
    // Oud & attars
    ["floating-amber-attar", "oud-attars", "عنبر معتّق ١٢ مل", "Aged Amber Attar 12ml", P(5790458), 1950, { isFeatured: true, rating: 5, sold90: 66 }],
    ["pink-pharaonic-flacon", "oud-attars", "قارورة فرعوني وردي بمسك", "Pink Pharaonic Flacon with Musk", P(36389331), 1250, { rating: 4.9, sold90: 54 }],
    ["chamomile-oud-rollers", "oud-attars", "تلاتة رول عود بالبابونج ١٠ مل", "Chamomile Oud Roll-on Trio 10ml", P(6694207), 1350, { rating: 4.8, sold90: 41 }],
    ["twin-gold-attar", "oud-attars", "عطر زيتي مزدوج ٢ × ٦ مل", "Twin Gold Attar 2 × 6ml", P(12402366), 1550, { rating: 4.7, sold90: 35 }],
    ["amber-pharaonic-flacon", "oud-attars", "قارورة فرعوني عسلي بعنبر", "Honey Pharaonic Flacon with Amber", P(36389344), 1350, { rating: 4.8, sold90: 28 }],
    ["gilded-attar-pair", "oud-attars", "عطر زيتي مذهّب ٢ × ٦ مل", "Gilded Attar Pair 2 × 6ml", P(34154866), 1850, { compareAtPrice: 2100, rating: 4.7, sold90: 22 }],
    ["stone-roller-oud", "oud-attars", "رول عود على الحجر ١٠ مل", "Oud Roll-on 10ml", P(6694132), 890, { rating: 4.6, sold90: 31 }],
    ["violet-pharaonic-flacon", "oud-attars", "قارورة فرعوني بنفسجي بياسمين", "Violet Pharaonic Flacon with Jasmine", P(36389334), 1250, { rating: 4.8, sold90: 19 }],
    // Bakhoor & burners
    ["brass-candle-burner", "bakhoor-incense", "مبخرة نحاس بالشمعة", "Brass Candle Burner", P(40403077), 1150, { rating: 4.8, sold90: 37 }],
    ["rose-petal-incense", "bakhoor-incense", "حامل بخور بورق الورد", "Rose-Petal Incense Holder", P(7303268), 590, { rating: 4.7, sold90: 26 }],
    ["stone-bowl-bakhoor", "bakhoor-incense", "مبخرة حجر بالفحم", "Stone Bakhoor Bowl", P(40382311), 950, { rating: 4.8, sold90: 31 }],
    ["lace-incense-holder", "bakhoor-incense", "حامل بخور نحاس على الدانتيل", "Brass Incense Holder on Lace", P(10733080), 2450, { rating: 4.9, sold90: 14 }],
    ["rose-water-sprinkler", "bakhoor-incense", "مرشّ ماء ورد نحاس", "Brass Rose-Water Sprinkler", P(17874858), 1650, { rating: 4.7, sold90: 18 }],
    ["lotus-window-holder", "bakhoor-incense", "حامل أعواد اللوتس", "Lotus Stick Holder", P(29393578), 480, { rating: 4.5, sold90: 21 }],
    ["red-temple-sticks", "bakhoor-incense", "أعواد بخور حمرا طويلة (٤٠)", "Long Red Incense Sticks, 40", P(36206271), 260, { rating: 4.6, sold90: 44 }],
    ["bronze-night-mabkhara", "bakhoor-incense", "مبخرة برونز الليل", "Bronze Night Mabkhara", P(17860048), 1550, { compareAtPrice: 1750, rating: 4.8, sold90: 16 }],
    // Home fragrance
    ["amber-globe-diffuser", "home-fragrance", "معطّر الكورة العنبري ٢٠٠ مل", "Amber Globe Diffuser 200ml", P(6766577), 850, { rating: 4.7, sold90: 27 }],
    ["rose-reed-diffuser", "home-fragrance", "معطّر الورد البلدي ٢٠٠ مل", "Egyptian Rose Diffuser 200ml", P(7524980), 790, { rating: 4.8, sold90: 22 }],
    ["linen-room-diffuser", "home-fragrance", "معطّر أوضة النوم ١٥٠ مل", "Bedroom Diffuser 150ml", P(6603480), 690, { rating: 4.5, sold90: 13 }],
    // Gift boxes
    ["red-black-gift-boxes", "gift-sets", "علب هدايا الأحمر والأسود", "Red & Black Gift Boxes", P(7985007), 2650, { rating: 4.7, sold90: 15 }],
    ["violet-ribbon-box", "gift-sets", "علبة الهدية بالشريطة البنفسجي", "The Violet Ribbon Box", P(36663543), 3950, { rating: 4.9, sold90: 12 }],
    // Minis
    ["amber-vial-ten", "travel-minis", "١٠ قوارير عنبري ٥ مل", "Ten Amber Vials 5ml", P(6914956), 650, { rating: 4.6, sold90: 34 }],
    ["roller-six-set", "travel-minis", "طقم ٦ رول أون", "Six Roll-on Set", P(6693889), 1150, { rating: 4.7, sold90: 25 }],
    ["wood-block-rollers", "travel-minis", "رول أون على قاعدة خشب", "Roll-ons on a Wood Block", P(6694211), 790, { rating: 4.5, sold90: 18 }],
  ],
});

export const PERFUMES_WARM = libraryTemplate({
  key: PERFUMES_WARM_KEY,
  version: 1,
  name: L("صندل", "Sandal"),
  description: L(
    "عطارة دافية بروح مجلة: سلايدر بتلات صور، أقسام بصورة كبيرة وحكاية الدكان. للعطارين ومتاجر العود والبخور.",
    "A warm, editorial attar house: a three-slide hero, categories beside one large photo and the shop’s story. For attar, oud and bakhoor stores.",
  ),
  category: "beauty",
  sortOrder: 1400,
  palette: ["#faf4ee", "#efe1d6", "#5b2333", "#b07d2b"],
  colors: {
    primary: "#5b2333",
    secondary: "#efe1d6",
    background: "#faf4ee",
    foreground: "#2a1418",
    muted: "#6c5753",
    border: "#e2cfc3",
    accent: "#b07d2b",
  },
  fonts: { heading: "El Messiri", body: "Almarai" },
  radius: 6,
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
        title: L("تعالى الدكان", "Come to the shop"),
        text: L("٨ شارع المعز، الجمالية، القاهرة. مفتوح كل يوم من ١١ الصبح لـ ١١ بالليل.", "8 El Moez St, El Gamaleya, Cairo. Open daily, 11am to 11pm."),
        heading: L("اطلب خلطتك الخاصة", "Order your own blend"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العطور الزيتي والبخور والتوصيل.", "Perfume oils, bakhoor and delivery."),
        question: L("إيه الفرق بين العطر الزيتي والبرفان؟", "What is the difference between an attar and a spray perfume?"),
        answer: L(
          "العطر الزيتي مفيهوش كحول، بيتحط نقطة على النبض وبيعيش يوم كامل وريحته بتقرّب من الجلد. البرفان بيفوح أكتر في أول ساعات. وعندنا الاتنين من نفس الخلطات.",
          "An attar has no alcohol: one drop on the pulse lasts all day and stays close to the skin. A spray projects more in the first hours. We make both from the same blends.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من زباين الدكان", "From our regulars"), related: L("روايح تليق معاه", "Scents that go with it") },
  },
});
