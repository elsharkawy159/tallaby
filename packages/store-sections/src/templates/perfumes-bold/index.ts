/**
 * Perfumes Bold (2026-10-28, perfumes niche, bold / promotional): white
 * paper, oxblood red and a bright saffron gold, Alexandria headings over
 * Tajawal, 12px corners and a 1320px container. A loud, after-dark home: the
 * announcement header, a background video of a crystal-capped bottle beside a
 * vase of flowers, round category stories, a rail of best sellers, the brand story over
 * a dark floral still life, four category rows with rounded frames, the big
 * newsletter and the sign-off footer. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye at full size (2026-10-28):
 * bottles, oils, burners and diffusers only, no people or hands, no brand
 * names or readable labels, none used twice. Video 8447362 (file
 * 8447362-uhd_2732_1440_25fps.mp4) with its poster; about 7814535 (home),
 * 7814724 (about page); tiles 31650365, 8361491, 6707562, 248032, 18245863,
 * 7984846, 6914953; products listed in DEMO.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const PERFUMES_BOLD_KEY = "perfumes-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PERFUMES_BOLD_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const WHATSAPP = "https://wa.me/201098436215";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(8447362, "8447362-uhd_2732_1440_25fps.mp4"),
  heroPoster: pexelsVideoPoster(8447362),
  darkFlowers: pexels(7814535, 1200),
  aboutPage: pexels(7814724, 1200),
  // Category stories.
  catWomen: pexels(31650365, 1200),
  catMen: pexels(8361491, 1200),
  catOud: pexels(6707562, 1200),
  catBakhoor: pexels(248032, 1200),
  catHome: pexels(18245863, 1200),
  catGifts: pexels(7984846, 1200),
  catMinis: pexels(6914953, 1200),
};

const NAME = L("شذا", "Shaza");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("ثبات ١٢ ساعة · توصيل لكل محافظات مصر", "12-hour wear · Delivery across Egypt"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل العطور", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("عن شذا", "About"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("سيب أثر في كل مكان تدخله", "Leave a trail wherever you go"),
    "كلمنا على واتساب": L("اسألنا على واتساب", "Ask us on WhatsApp"),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل العطور", "All fragrances"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الاستبدال والاسترجاع", "Exchanges & refunds"),
    "من نحن": L("عن شذا", "About Shaza"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شذا. كل الحقوق محفوظة.", "© 2026 Shaza. All rights reserved."),
  },
  links: { "https://wa.me/": WHATSAPP, "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 40 } } },
    text: {
      "فيديو الواجهة": L("زجاجة عطر بغطا كريستال جنب فازة زهور على حيطة حمرا", "A crystal-capped perfume bottle beside a vase of flowers against a red wall"),
      "المجموعة الجديدة": L("مجموعة الليل", "The After Dark collection"),
      "مساحتك، بطريقتك": L("ريحتك أول حاجة بتوصل", "Your scent arrives before you do"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "عطور تركيز عالي بتعيش ١٢ ساعة على الهدوم، من العود للفانيليا للورد البلدي.",
        "High-concentration fragrances that last 12 hours on clothes, from oud to vanilla to Egyptian rose.",
      ),
      "تسوّق الآن": L("تسوّق المجموعة", "Shop the collection"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-circles", {
    text: { "بتدوّر على إيه؟": L("ريحتك المزاج ده إيه؟", "What’s your mood today?") },
  }),
  lib("products-rail", {
    text: {
      "بيحبوها": L("اللي الكل بيسأل عليه", "The ones everyone asks about"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "عرض الكل": L("عرض الكل", "View all"),
    },
  }),
  lib("about-wide", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.darkFlowers],
    text: {
      "كل منتج بيتراجع قبل ما يوصلك": L("بنجرّب كل عطر ١٢ ساعة قبل ما ينزل", "Every scent is worn for 12 hours before it launches"),
      "صورة المتجر": L("زجاجة عطر وسط ورد ملوّن ونقط مية على سطح أسود", "A perfume bottle among bright flowers and water drops on a black surface"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف، عشان تفتح العلبة وانت مطمن.": L(
        "+٢٥٠٠٠ زجاجة خرجت من مصر الجديدة لكل المحافظات. بنركّب بتركيز ٢٠٪، وبنختبر الثبات على القماش والجلد، واللي مايكملش اليوم مايتباعش.",
        "25,000+ bottles shipped from Heliopolis across Egypt. We blend at 20% concentration, test wear on fabric and skin, and anything that fades before evening never reaches the shelf.",
      ),
      "شوف إزاي بنشتغل": L("اعرف حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("شوف الكل", "See all"),
    muted: [1, 3],
    nodes: { "صورة المنتج": { style: { radius: 12 } } },
  }),
  lib("newsletter-big", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("اعرف الريحة الجديدة قبل الكل", "Smell the next drop first"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("إيميل واحد في الأسبوع بالعطور الجديدة ونصيحة تخلّي عطرك يعيش أطول.", "One email a week with new scents and a tip to make yours last longer."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن شذا", "About Shaza"), L("عطور تركيز عالي، متركّبة في مصر الجديدة.", "High-concentration fragrances, blended in Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("قارورة عطر وفرع ورد بنفسجي في إضاءة غامقة", "A perfume vial and a purple flower stem in dark light"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("العطر لازم يتحس من أول رشّة", "A scent should be felt from the first spray"),
    text: L(
      "بدأنا بعطر عود واحد بعناه لأصحابنا، وطلبوه تاني بعد أسبوع. من ساعتها وإحنا بنعمل عطور جريئة وثابتة بسعر معقول.",
      "We started with one oud fragrance sold to friends, who ordered it again a week later. We have made bold, long-lasting scents at fair prices ever since.",
    ),
    more: L("كل زجاجة بتتعبّى وتتغلّف في معملنا بمصر الجديدة، وبتوصلك في علبة تستاهل تتهادى.", "Every bottle is filled and packed in our Heliopolis lab and arrives in a box worth gifting."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عطور تركيز عالي، متركّبة في مصر الجديدة.", "High-concentration fragrances, blended in Heliopolis."),
  categories: [
    ["womens-perfumes", "عطور حريمي", "Women", PHOTOS.catWomen],
    ["mens-perfumes", "عطور رجالي", "Men", PHOTOS.catMen],
    ["oud-attars", "العود والزيوت", "Oud & oils", PHOTOS.catOud],
    ["bakhoor-incense", "البخور والمباخر", "Bakhoor", PHOTOS.catBakhoor],
    ["home-fragrance", "معطّرات البيت", "Home scents", PHOTOS.catHome],
    ["gift-sets", "الهدايا", "Gifts", PHOTOS.catGifts],
    ["travel-minis", "أحجام الشنطة", "Minis", PHOTOS.catMinis],
  ],
  products: [
    // Women
    ["ruby-noir-edp", "womens-perfumes", "روبي نوار ٥٠ مل", "Ruby Noir EDP 50ml", P(35824747), 1950, { isFeatured: true, rating: 4.9, sold90: 142 }],
    ["pearl-bow-edp", "womens-perfumes", "بيرل بو ١٠٠ مل", "Pearl Bow EDP 100ml", P(36910560), 2250, { rating: 4.8, sold90: 97 }],
    ["pearl-lace-edp", "womens-perfumes", "بيرل لايس ٥٠ مل", "Pearl Lace EDP 50ml", P(5357791), 1750, { rating: 4.7, sold90: 74 }],
    ["prism-silk-extrait", "womens-perfumes", "بريزم سيلك إكستريه ٣٠ مل", "Prism Silk Extrait 30ml", P(16085723), 2650, { compareAtPrice: 2950, rating: 4.9, sold90: 88 }],
    ["fuchsia-crush-edp", "womens-perfumes", "فوشيا كراش ٥٠ مل", "Fuchsia Crush EDP 50ml", P(9464723), 1850, { rating: 4.6, sold90: 52 }],
    ["tangerine-pop-edp", "womens-perfumes", "تانجرين بوب ٥٠ مل", "Tangerine Pop EDP 50ml", P(8166972), 1650, { rating: 4.7, sold90: 61 }],
    ["satin-musk-edp", "womens-perfumes", "ساتان مسك ٧٥ مل", "Satin Musk EDP 75ml", P(8553210), 2450, { rating: 4.8, sold90: 39 }],
    ["desert-gold-edp", "womens-perfumes", "ديزرت جولد ٥٠ مل", "Desert Gold EDP 50ml", P(29614397), 1150, { rating: 4.5, sold90: 33, inStock: false }],
    // Men
    ["matte-black-edp", "mens-perfumes", "مات بلاك ١٠٠ مل", "Matte Black EDP 100ml", P(5994299), 2350, { isFeatured: true, rating: 4.9, sold90: 131 }],
    ["gold-edge-edp", "mens-perfumes", "جولد إدج ١٠٠ مل", "Gold Edge EDP 100ml", P(7702669), 2650, { rating: 4.8, sold90: 86 }],
    ["saffron-flash-edp", "mens-perfumes", "سافرون فلاش ٥٠ مل", "Saffron Flash EDP 50ml", P(28745493), 1850, { rating: 4.7, sold90: 63 }],
    ["ice-stone-edt", "mens-perfumes", "آيس ستون ١٠٠ مل", "Ice Stone EDT 100ml", P(7814961), 1950, { compareAtPrice: 2200, rating: 4.6, sold90: 48 }],
    ["amber-arch-edp", "mens-perfumes", "عنبر آرش ١٠٠ مل", "Amber Arch EDP 100ml", P(8167961), 2150, { rating: 4.8, sold90: 57 }],
    ["oud-trio-set", "mens-perfumes", "طقم العود التلاتي", "The Oud Trio Set", P(36355219), 2850, { rating: 4.9, sold90: 72 }],
    ["cognac-wood-edp", "mens-perfumes", "كونياك وود ١٠٠ مل", "Cognac Wood EDP 100ml", P(8166570), 2050, { rating: 4.6, sold90: 34 }],
    ["bronze-spray-edp", "mens-perfumes", "برونز ٥٠ مل", "Bronze EDP 50ml", P(8789609), 1750, { rating: 4.5, sold90: 27 }],
    // Oud & oils
    ["emerald-drop-oud", "oud-attars", "دهن عود إمرالد ١٢ مل", "Emerald Drop Oud Oil 12ml", P(4021773), 2400, { rating: 4.8, sold90: 46 }],
    ["lava-stone-oud", "oud-attars", "عود لافا ستون ١٢ مل", "Lava Stone Oud Oil 12ml", P(8054327), 2650, { isFeatured: true, rating: 4.9, sold90: 58 }],
    ["amber-oud-trio", "oud-attars", "طقم عود وعنبر ٣ زجاجات", "Oud & Amber Trio", P(6621462), 3450, { rating: 4.7, sold90: 31 }],
    ["flower-infusion-oil", "oud-attars", "زيت زهور منقوع ١٠ مل", "Flower-Infused Oil 10ml", P(8450212), 1250, { rating: 4.6, sold90: 29 }],
    ["crystal-bowl-oud", "oud-attars", "دهن عود في كاسة كريستال ٣٠ مل", "Crystal Bowl Oud Oil 30ml", P(37000509), 1650, { rating: 4.7, sold90: 35 }],
    ["pure-drop-oud", "oud-attars", "عود بيور دروب ١٥ مل", "Pure Drop Oud Oil 15ml", P(35874415), 2950, { compareAtPrice: 3300, rating: 4.8, sold90: 22 }],
    ["black-stone-oil", "oud-attars", "زيت عنبر الحجر الأسود ٣٠ مل", "Black Stone Amber Oil 30ml", P(18708752), 1850, { rating: 4.6, sold90: 18 }],
    ["twin-attar-cubes", "oud-attars", "عطر زيتي مزدوج ٢ × ٦ مل", "Twin Attar Set 2 × 6ml", P(12402360), 1450, { rating: 4.5, sold90: 24 }],
    // Bakhoor
    ["bronze-dome-mabkhara", "bakhoor-incense", "مبخرة برونز بقبة", "Bronze Dome Mabkhara", P(17860008), 1450, { rating: 4.9, sold90: 44 }],
    ["silver-deer-burner", "bakhoor-incense", "مبخرة الغزال الفضي", "Silver Stag Burner", P(10694212), 1850, { rating: 4.7, sold90: 21 }],
    ["copper-filigree-mabkhara", "bakhoor-incense", "مبخرة نحاس مخرّمة", "Copper Filigree Mabkhara", P(18724948), 1250, { rating: 4.8, sold90: 33 }],
    ["blue-backflow-burner", "bakhoor-incense", "مبخرة الشلال الأزرق", "Blue Backflow Burner", P(14974513), 690, { rating: 4.6, sold90: 52 }],
    ["moroccan-incense-box", "bakhoor-incense", "مبخرة مغربي مربعة", "Moroccan Square Burner", P(38112011), 990, { rating: 4.5, sold90: 17 }],
    ["snake-incense-holder", "bakhoor-incense", "حامل بخور التعبان", "Serpent Incense Holder", P(15877826), 590, { rating: 4.7, sold90: 26 }],
    ["porcelain-oil-burner", "bakhoor-incense", "مبخرة زيوت بورسلين", "Porcelain Oil Burner", P(20390728), 750, { rating: 4.6, sold90: 19 }],
    ["bamboo-stick-holder", "bakhoor-incense", "حامل أعواد بامبو", "Bamboo Stick Holder", P(9547310), 320, { rating: 4.4, sold90: 23 }],
    // Home scents
    ["golden-glow-diffuser", "home-fragrance", "معطّر جولدن جلو ٢٠٠ مل", "Golden Glow Diffuser 200ml", P(14766418), 890, { rating: 4.8, sold90: 39 }],
    ["amber-bottle-diffuser", "home-fragrance", "معطّر الزجاجة العنبري ٢٠٠ مل", "Amber Bottle Diffuser 200ml", P(8313229), 790, { rating: 4.6, sold90: 25 }],
    ["black-reed-diffuser", "home-fragrance", "معطّر الأعواد السودا", "Black Reed Diffuser", P(29149066), 1150, { rating: 4.7, sold90: 18 }],
    // Gifts
    ["sparkle-gift-box", "gift-sets", "علبة الهدية اللامعة", "The Sparkle Gift Box", P(6166572), 2950, { rating: 4.8, sold90: 28 }],
    ["gold-bow-gift", "gift-sets", "صندوق الفيونكة الدهبي", "The Gold Bow Box", P(35159213), 3950, { rating: 4.9, sold90: 16 }],
    // Minis
    ["clear-roller-10ml", "travel-minis", "رول أون شفاف ١٠ مل", "Clear Roll-on 10ml", P(31797988), 390, { rating: 4.6, sold90: 64 }],
    ["amber-roller-six", "travel-minis", "طقم ٦ رول أون عنبري", "Six Amber Roll-ons", P(6693891), 1450, { rating: 4.7, sold90: 37 }],
    ["cork-mini-duo", "travel-minis", "اتنين ميني بالفلّين", "Cork Mini Duo", P(672051), 990, { rating: 4.5, sold90: 21 }],
  ],
});

export const PERFUMES_BOLD = libraryTemplate({
  key: PERFUMES_BOLD_KEY,
  version: 1,
  name: L("شذا", "Shaza"),
  description: L(
    "عطور جريئة بطاقة عالية: فيديو في الواجهة، أقسام دايرية وأربع صفوف منتجات. للمتاجر اللي بتبيع كتير وبسرعة.",
    "Bold, high-energy fragrances: a video hero, round categories and four product rows. For stores that sell fast and in volume.",
  ),
  category: "beauty",
  sortOrder: 1390,
  palette: ["#ffffff", "#f7ecee", "#8c1230", "#d9a425"],
  colors: {
    primary: "#8c1230",
    secondary: "#f7ecee",
    background: "#ffffff",
    foreground: "#170c10",
    muted: "#5f5258",
    border: "#ecd9de",
    accent: "#d9a425",
  },
  fonts: { heading: "Alexandria", body: "Tajawal" },
  radius: 12,
  containerMaxWidth: 1320,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن شذا", "About"), seo: { title: L("عن شذا", "About Shaza") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L(`٣٥ شارع الأهرام، مصر الجديدة، القاهرة · ${phone("٠١٠٩ ٨٤٣ ٦٢١٥")} · ${handle("hello@shaza.eg")}`, "35 El Ahram St, Heliopolis, Cairo · +20 109 843 6215 · hello@shaza.eg"),
        heading: L("محتار تختار إيه؟ قولنا بتحب إيه", "Not sure what to pick? Tell us what you like"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الثبات والتوصيل والاستبدال.", "Longevity, delivery and exchanges."),
        question: L("العطر بيثبت قد إيه؟", "How long does the scent last?"),
        answer: L(
          "عطورنا تركيزها ٢٠٪، فبتعيش من ٨ لـ ١٢ ساعة على الجلد وأكتر على الهدوم. ولو مش عاجبك استبدله خلال ١٤ يوم طالما الزجاجة مقفولة.",
          "Our fragrances are 20% concentrate, lasting 8 to 12 hours on skin and longer on clothes. Exchange any sealed bottle within 14 days.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    surface: "card",
    band: "brand",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("قالوا عن ريحتنا", "What they said about it"), related: L("هتحبه برضه", "You’ll love these too") },
  },
});
