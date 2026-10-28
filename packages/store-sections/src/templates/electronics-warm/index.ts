/**
 * Electronics Warm (2026-10-28, electronics niche, warm / editorial): oat
 * paper, espresso ink and a burnt-copper brand with a honey accent, Reem
 * Kufi headings over Almarai, soft 12px corners and a 1360px container. A
 * cosy desk-setup store with a magazine feel: the announcement header, a
 * split hero beside a coffee-and-tablet flat lay, the first category as a
 * big photo with the rest in a ruled list, a shelf of best sellers, the
 * founders' story over a full-bleed desk photo, four category rows with
 * portrait photos, a personal letter newsletter and the classic footer.
 * Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28): products
 * on wood and in warm light only, no people, no readable brand logos, none
 * used twice. Hero 7241341; about 31236097, about page 28461166; tiles 30836158, 6587321,
 * 4387770, 35504606, 7792388, 3945312; products as listed in `DEMO`.
 * Swapped for a readable logo or a weak frame: headphones 30428610 and
 * 30428608 (Marshall) for 5269759 and 15487609; speakers 32300575 (logo) and
 * 19652337 (mostly empty) for 6039721 and 374671; cameras 16104735 (Zenit)
 * and 2518136 (Polaroid) for 36229141 and 14844400; the headphones tile
 * 32151781 (lettering) for 30836158. Browser QA swaps: about 28896170 (name
 * card, logos) for 31236097; phone 8156983 (a person in a magazine) and
 * 3042448 (lettering) for 5741881 and 16003896; cameras 35719107, 14731845,
 * 36229141 and 14844400 (lettering) for 39660776, 235180, 20524086 and
 * 7768261; same-shoot 5208777, 19482598 for 14706040, 1666313; watch
 * 14691503 (book lettering) for 38919178. Re-check swaps: camera 39660776
 * (MINOLTA) for 34694355; keyboards row 7151696, 7151698 (logi), 5152261
 * (ulanzi), 15372897 (mat text) for 7172686, 35655038, 27791751, 33456959;
 * same-shoot 374770 and 5269752 for 20802447 and 33174697.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const ELECTRONICS_WARM_KEY = "electronics-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ELECTRONICS_WARM_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(7241341, 1920),
  story: pexels(31236097, 1200),
  aboutPage: pexels(28461166, 1200),
  // Category photos.
  catHeadphones: pexels(30836158, 1200),
  catSpeakers: pexels(6587321, 1200),
  catPhone: pexels(4387770, 1200),
  catComputers: pexels(35504606, 1200),
  catWatches: pexels(7792388, 1200),
  catCameras: pexels(3945312, 1200),
};

const NAME = L("مكتبي", "Maktabi");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("ضمان سنة", "1-year warranty"),
    "م": L("م", "M"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L("جادجتس دافية لمكتب بتحب تقعد عليه.", "Warm gadgets for a desk you love sitting at."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل المنتجات", "All products"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الضمان والاستبدال", "Warranty & exchanges"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١١٤ ٧٢٦ ٥٠٣٨"), "+20 114 726 5038"),
    "١٢ شارع النيل، الزمالك، القاهرة": L(`١٧ شارع ٩، المعادي، القاهرة، ${handle("hello@maktabi.eg")}`, "17 Road 9, Maadi, Cairo | hello@maktabi.eg"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم من ١٢ الضهر لـ ١٠ بالليل", "Daily, noon to 10pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ مكتبي. كل الحقوق محفوظة.", "© 2026 Maktabi. All rights reserved."),
    // The storefront already adds its own "Powered by" credit, so the design's line stays empty.
    "بواسطة طلبي": L("", ""),
  },
  links: { "https://wa.me/": "https://wa.me/201147265038", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.hero],
    text: {
      "كوليكشن الموسم": L("ركن الشتا", "The winter desk"),
      "صوت أنقى، كل يوم": L("مكتب يدفّي يومك", "A desk that warms up your day"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "سماعات وكيبوردات وإكسسوارات بألوان الخشب والكريم، بنختارها عشان تحب تقعد على مكتبك.",
        "Headphones, keyboards and accessories in wood and cream tones, chosen so you love sitting at your desk.",
      ),
      "تسوق الآن": L("تسوّق المكتب", "Shop the desk"),
      "العروض": L("وصل حديثًا", "New in"),
      "صورة الحملة": L("تابلت وسماعة وفنجان قهوة على مكتب خشب", "A tablet, headphones and a cup of coffee on a wooden desk"),
    },
    links: { "/products": [SHOP, NEW] },
  }),
  lib("categories-feature-list", {
    text: {
      "الأقسام": L("أقسام المكتب", "Around the desk"),
      "كل الأقسام": L("كل المنتجات", "Shop all"),
      "منتج": L("منتجات", "items"),
    },
    // The eyebrow repeats the title's Arabic, so its row is hidden.
    nodes: { "التسمية": { style: { hidden: true } } },
    lists: [undefined, { limit: 5 }],
  }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("المفضّل عند عملائنا", "Our customers’ favourites"),
      "وصل جديد": L("الأكثر طلبًا", "Best sellers"),
      "الأكثر مبيعًا": L("وصل حديثًا", "New in"),
      "عليه خصم": L("الأعلى تقييمًا", "Top rated"),
      "كل المنتجات": L("كل المنتجات", "View all products"),
    },
    links: { "/products": [BEST, NEW, RATED, SHOP] },
    lists: [{ source: "best-sellers" }],
  }),
  lib("about-fullbleed", {
    photo: [undefined, undefined, PHOTOS.story],
    text: {
      "صورة القصة": L("أباجورة صفرا ونبتة جنب شاشة على مكتب", "A yellow lamp and a plant beside a monitor on a desk"),
      "حكايتنا": L("من المعادي", "From Maadi"),
      "تفاصيل صغيرة تصنع الفرق": L("المكتب الحلو بيخلّي الشغل أحلى", "A good desk makes the work better"),
      "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.": L(
        "إحنا اتنين بنشتغل من البيت من سنين، وكنا بندوّر على جادجتس شكلها دافي زي باقي البيت. +٩٠٠٠ مكتب في مصر فيه حاجة من عندنا، وتقييمنا ٤٫٩ من ٥.",
        "We are two people who have worked from home for years, looking for gadgets as warm as the rest of the house. 9,000+ desks in Egypt have something from us, rated 4.9 out of 5.",
      ),
      "اعرف أكثر": L("اقرا حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("عرض الكل", "View all"),
    muted: [1, 3],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("رسالة من مكتبي", "A letter from Maktabi"),
      "أهلًا،": L("أهلًا يا صاحب المكتب،", "Hello, fellow desk lover,"),
      "كل خميس بكتب رسالة قصيرة فيها أحسن حاجة جربناها الأسبوع ده، وعرض للمشتركين بس.": L(
        "كل أول شهر بنكتبلك رسالة قصيرة فيها جهاز جربناه على مكتبنا، وصورة سيت أب من عملائنا، ونصيحة تريّح ضهرك.",
        "On the first of every month we write a short note with a device we tried on our own desk, a setup photo from a customer and a tip to save your back.",
      ),
      "أ": L("م", "M"),
      "أحمد": L("فريق مكتبي", "The Maktabi team"),
      "صاحب المتجر": L("المعادي، القاهرة", "Maadi, Cairo"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("جادجتس دافية لمكتب بتحب تقعد عليه، من المعادي.", "Warm gadgets for a desk you love, from Maadi.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("ركن مكتب بلمبة صفرا ونباتات", "A desk corner with a yellow lamp and plants"),
    eyebrow: L("من ٢٠٢١", "Since 2021"),
    title: L("بدأنا من مكتبنا إحنا", "It started at our own desk"),
    text: L(
      "لما بقينا نشتغل من البيت، كل حاجة على المكتب كانت سودا وباردة. فبدأنا ندوّر على كيبوردات وسماعات بألوان الخشب والكريم، وصحابنا طلبوا مننا نجيبلهم زيها.",
      "When we started working from home, everything on the desk was black and cold. So we hunted for keyboards and headphones in wood and cream tones, and our friends asked us to get them the same.",
    ),
    more: L("النهارده بنختار كل منتج بنفسنا، وبنجربه على مكتبنا أسبوع قبل ما ينزل المتجر.", "Today we still choose every product ourselves and test it on our own desk for a week before we list it."),
    button: L("تسوّق المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("جادجتس دافية لمكتب بتحب تقعد عليه، من المعادي.", "Warm gadgets for a desk you love, from Maadi."),
  categories: [
    ["headphones", "السماعات", "Headphones", PHOTOS.catHeadphones],
    ["speakers", "السبيكرات", "Speakers", PHOTOS.catSpeakers],
    ["phone-accessories", "إكسسوارات الموبايل", "Phone accessories", PHOTOS.catPhone],
    ["computers", "الكيبورد والماوس", "Keyboards & mice", PHOTOS.catComputers],
    ["smartwatches", "الساعات الذكية", "Smartwatches", PHOTOS.catWatches],
    ["cameras", "الكاميرات والعدسات", "Cameras & lenses", PHOTOS.catCameras],
  ],
  products: [
    // Headphones
    ["cream-blue-headphones", "headphones", "سماعة كريم وأزرق", "Cream and Blue Over-Ear Headphones", P(28872795), 2650, { isFeatured: true, rating: 4.9, sold90: 72 }],
    ["pastel-wireless", "headphones", "سماعة لاسلكية باستيل", "Pastel Wireless Headphones", P(17743351), 2350, { rating: 4.7, sold90: 58 }],
    ["headphone-hooks-four", "headphones", "شماعات سماعات حيطة، طقم ٤", "Headphone Wall Hooks, Set of Four", P(38725881), 650, { rating: 4.8, sold90: 44 }],
    ["silver-over-ear", "headphones", "سماعة أوفر إير فضي", "Silver Wireless Over-Ear Headphones", P(11945638), 4900, { compareAtPrice: 5400, rating: 4.8, sold90: 31 }],
    ["graphite-silver-headphones", "headphones", "سماعة جرافيت بكبايات فضي", "Graphite Headphones with Silver Cups", P(5269759), 1950, { rating: 4.6, sold90: 39 }],
    ["slate-on-ear", "headphones", "سماعة أون إير رصاصي", "Slate On-Ear Headphones", P(15487609), 1250, { rating: 4.5, sold90: 27 }],
    ["coiled-studio", "headphones", "سماعة ستوديو بسلك سوستة", "Studio Headphones with Coiled Cable", P(12266868), 3900, { rating: 4.9, sold90: 22 }],
    ["onyx-over-ear", "headphones", "سماعة أوفر إير أونيكس", "Onyx Over-Ear Headphones", P(33174697), 3650, { rating: 4.6, sold90: 19, inStock: false }],
    // Speakers
    ["wood-bookshelf-pair", "speakers", "زوج سبيكر رف خشب مع أمبليفاير", "Wooden Bookshelf Speakers with Amp", P(19482597), 12500, { rating: 4.9, sold90: 14 }],
    ["pebble-voice-speaker", "speakers", "سبيكر صوتي بيبل", "Pebble Voice Speaker", P(1666313), 1650, { compareAtPrice: 1890, rating: 4.8, sold90: 11 }],
    ["stone-mini-speaker", "speakers", "سبيكر ميني ذكي رمادي", "Mini Smart Speaker, Stone", P(1279365), 1450, { rating: 4.6, sold90: 48 }],
    ["fabric-handle-speaker", "speakers", "سبيكر قماش بمقبض", "Fabric Speaker with Handle", P(20802447), 2250, { rating: 4.5, sold90: 66 }],
    ["bedside-smart-speaker", "speakers", "سبيكر ذكي للكومودينو", "Smart Speaker, Bedside Edition", P(977296), 2450, { rating: 4.7, sold90: 25 }],
    ["party-handle-speaker", "speakers", "سبيكر حفلات بإيد", "Party Bluetooth Speaker with Handle", P(13658010), 1650, { rating: 4.4, sold90: 37 }],
    ["cloud-grey-speaker", "speakers", "سبيكر كلاود رمادي فاتح", "Cloud Grey Bluetooth Speaker", P(6039721), 1890, { rating: 4.7, sold90: 42 }],
    ["kitchen-pocket-speaker", "speakers", "سبيكر مطبخ صغير", "Kitchen Pocket Speaker", P(374671), 790, { rating: 4.5, sold90: 33 }],
    // Phone accessories
    ["braided-bw-cable", "phone-accessories", "كابل مضفر أبيض وأسود", "Braided Cable, Black and White", P(5208772), 290, { rating: 4.8, sold90: 133 }],
    ["slim-power-bank", "phone-accessories", "باور بانك سليم ١٠٠٠٠ مللي", "Slim 10,000mAh Power Bank", P(14706040), 1150, { isFeatured: true, rating: 4.7, sold90: 81 }],
    ["keyring-power-banks", "phone-accessories", "باور بانك ميدالية", "Key-Ring Power Bank", P(38649173), 590, { rating: 4.6, sold90: 64 }],
    ["rope-phone-stand", "phone-accessories", "حامل موبايل حبل مجدول", "Braided Rope Phone Stand", P(16003896), 690, { rating: 4.8, sold90: 29 }],
    ["navy-ribbed-case", "phone-accessories", "جراب كحلي مضلّع", "Navy Ribbed Phone Case", P(5741881), 550, { compareAtPrice: 650, rating: 4.7, sold90: 46 }],
    ["tan-leather-case", "phone-accessories", "جراب جلد عسلي", "Tan Leather Phone Case", P(7742554), 690, { rating: 4.9, sold90: 57 }],
    ["clear-case-cable", "phone-accessories", "جراب شفاف مع كابل شحن", "Clear Case with Charging Cable", P(4195333), 420, { rating: 4.5, sold90: 71 }],
    ["fast-charge-cable", "phone-accessories", "كابل شحن سريع", "Fast Charge Cable", P(17800265), 250, { rating: 4.6, sold90: 98 }],
    // Keyboards & mice
    ["sage-mech-keyboard", "computers", "كيبورد ميكانيكال سيج", "Mechanical Keyboard, Sage Grey", P(12561283), 3650, { rating: 4.9, sold90: 34 }],
    ["clear-case-keyboard", "computers", "كيبورد ٧٥٪ بإطار شفاف", "Clear-Case 75% Keyboard", P(27791751), 3250, { rating: 4.8, sold90: 27 }],
    ["retro-keycap-keyboard", "computers", "كيبورد بزراير ريترو", "Retro Keycap Keyboard", P(6804466), 2950, { compareAtPrice: 3300, rating: 4.7, sold90: 31 }],
    ["slate-low-profile-keyboard", "computers", "كيبورد لو بروفايل رصاصي", "Slate Low-Profile Keyboard", P(33456959), 3900, { isFeatured: true, rating: 5, sold90: 19 }],
    ["pastel-keyboard-mouse", "computers", "كيبورد باستيل مع ماوس مريح", "Pastel Keyboard with Ergonomic Mouse", P(38094551), 4450, { rating: 4.8, sold90: 16 }],
    ["dial-mech-keyboard", "computers", "كيبورد ميكانيكال أسود بزرار دوّار", "Black Mechanical Keyboard with Dial", P(36203655), 3400, { rating: 4.6, sold90: 23 }],
    ["vertical-mouse-graphite", "computers", "ماوس رأسي جرافيت", "Vertical Mouse, Graphite", P(7172686), 1850, { rating: 4.7, sold90: 45 }],
    ["cream-keyboard-coiled", "computers", "كيبورد كريم بسلك سوستة", "Cream Keyboard with Coiled Cable", P(35655038), 3450, { rating: 4.5, sold90: 28 }],
    // Smartwatches
    ["milanese-band-watch", "smartwatches", "ساعة ذكية بحزام ميلانيز", "Smartwatch, Milanese Band", P(38919178), 9200, { rating: 4.8, sold90: 26 }],
    ["classic-round-watch", "smartwatches", "ساعة ذكية مدورة كلاسيك", "Classic Round Smartwatch", P(51011), 6400, { rating: 4.6, sold90: 18 }],
    ["orange-band-watch", "smartwatches", "ساعة ذكية بحزام برتقالي", "Smartwatch, Orange Band", P(37735302), 3900, { rating: 4.7, sold90: 35 }],
    ["app-view-watch", "smartwatches", "ساعة ذكية بشاشة تطبيقات", "Smartwatch, App View", P(11617966), 8700, { compareAtPrice: 9500, rating: 4.5, sold90: 14 }],
    // Cameras & lenses
    ["wooden-field-camera", "cameras", "كاميرا خشب كلاسيك بحامل", "Wooden Field Camera with Tripod", P(34694355), 12500, { rating: 4.8, sold90: 12 }],
    ["vintage-28mm-lens", "cameras", "عدسة ٢٨ مم فينتدج", "Vintage 28mm Lens", P(235180), 2400, { rating: 4.7, sold90: 9 }],
    ["dslr-zoom-kit", "cameras", "كاميرا DSLR مع عدسة زووم", "DSLR Body with Zoom Lens", P(20524086), 21500, { rating: 4.6, sold90: 6 }],
    ["full-frame-dslr", "cameras", "كاميرا DSLR فول فريم", "Full-Frame DSLR", P(7768261), 32900, { rating: 4.9, sold90: 8 }],
  ],
});

export const ELECTRONICS_WARM = libraryTemplate({
  key: ELECTRONICS_WARM_KEY,
  version: 1,
  name: L("مكتبي", "Maktabi"),
  description: L(
    "جادجتس دافية بروح مجلة: واجهة بنصين، أول قسم بصورة كبيرة وحكاية المؤسسين. لمتاجر إكسسوارات المكتب والسيت أب.",
    "Warm, editorial gadgets: a split hero, the first category as a big photo and the founders’ story. For desk-setup and accessory stores.",
  ),
  category: "electronics",
  sortOrder: 1280,
  palette: ["#f5efe6", "#ebe1d3", "#8a4b22", "#d99a4e"],
  colors: {
    primary: "#8a4b22",
    secondary: "#ebe1d3",
    background: "#f5efe6",
    foreground: "#2a211a",
    muted: "#6d5f52",
    border: "#ddcfbd",
    accent: "#d99a4e",
  },
  fonts: { heading: "Reem Kufi", body: "Almarai" },
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
        title: L("تعالى اشرب قهوة معانا", "Come for a coffee"),
        text: L("١٧ شارع ٩، المعادي، القاهرة. مفتوح كل يوم من ١٢ الضهر لـ ١٠ بالليل.", "17 Road 9, Maadi, Cairo. Open daily from noon to 10pm."),
        heading: L("ابعتلنا صورة مكتبك ونقترح عليك", "Send us a photo of your desk and we’ll suggest"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتوصيل والكاميرات.", "Warranty, delivery and cameras."),
        question: L("الكاميرات والعدسات المستعملة متجربة؟", "Are the used cameras and lenses tested?"),
        answer: L(
          "أيوه، كل كاميرا وعدسة بتتنضف وتتجرب قبل ما نعرضها، وعليها ضمان ٣ شهور. ولو محتاج بطارية أو كارت ذاكرة، اسألنا على واتساب.",
          "Yes. Every camera and lens is cleaned and tested before we list it, with a three-month warranty. If you need a battery or a memory card, ask us on WhatsApp.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من مكاتب عملائنا", "From our customers’ desks"), related: L("يليق على مكتبك", "Suits your desk") },
  },
});
