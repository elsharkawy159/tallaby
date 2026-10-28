/**
 * Electronics Luxe (2026-10-28, electronics niche, premium / minimal): cool
 * paper, graphite ink and a steel-blue accent, Noto Kufi Arabic headings
 * over IBM Plex Sans Arabic, near-square 4px corners and a wide 1440px
 * container. A calm, gallery-like gadget store: top bar header, a background
 * video of white headphones on a stand, ringed category circles, the pick of the
 * week, the studio story beside a tidy desk, four category rows, a topics
 * newsletter and the ruled footer. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye at full size (2026-10-28):
 * white and neutral studio shots of the products only, no people, no
 * readable brand logos, none used twice. Video 8004701 (poster 8004701);
 * about 19513471, about page 6373177; tiles 34075324, 1034651, 10104937,
 * 129208, 12955888, 8959622; products as listed in `DEMO`. Browser QA swaps:
 * about 4006143 (laptop logo) for 19513471; the speakers tile 128611 (near
 * black) for 1034651; same-shoot photos 3394665, 3394653, 3921695 and the
 * tile 3921630 for 8380417, 14272792, 16886332 and 10104937; the near-black
 * mouse 12029640 for 34396238; the camera 37853793 (lettering) for the lens
 * 34956920. Re-check swaps: tile 10104937 (AUKEY) for 914912; speakers
 * 4790261, 4790268 (amazon) for 11337255, 36326800; cable 3921633 (ADAM)
 * for the hub 20076003; same-shoot headphones 3394659, 3394656 for 4812934,
 * 33034333.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const ELECTRONICS_LUXE_KEY = "electronics-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ELECTRONICS_LUXE_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(8004701, "8004701-uhd_2560_1440_25fps.mp4"),
  heroPoster: pexelsVideoPoster(8004701),
  whiteDesk: pexels(19513471, 1200),
  flatLay: pexels(6373177, 1200),
  // Category cards.
  catHeadphones: pexels(34075324, 1200),
  catSpeakers: pexels(1034651, 1200),
  catPhone: pexels(914912, 1200),
  catComputers: pexels(129208, 1200),
  catWatches: pexels(12955888, 1200),
  catCameras: pexels(8959622, 1200),
};

const NAME = L("أثير", "Atheer");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("توصيل خلال ٤٨ ساعة في القاهرة والجيزة", "48h delivery in Cairo & Giza"),
    "الدفع عند الاستلام": L("ضمان رسمي سنتين على كل جهاز", "2-year official warranty"),
    "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل الأجهزة", "Shop"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("الاستوديو", "Studio"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("أ", "A"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L(
      `أجهزة أصلية مختارة بعناية، بضمان رسمي سنتين. ٢٦ شارع البرازيل، الزمالك، القاهرة، ${phone("٠١٢٨ ٤١٥ ٧٧٢٠")}، ${handle("hello@atheer.eg")}`,
      "Carefully chosen genuine devices with a two-year official warranty. 26 Brazil St, Zamalek, Cairo · +20 128 415 7720 · hello@atheer.eg",
    ),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل الأجهزة", "All devices"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الضمان والاستبدال", "Warranty & exchanges"),
    "من نحن": L("عن أثير", "About Atheer"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ أثير. كل الحقوق محفوظة.", "© 2026 Atheer. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST, RATED], "https://wa.me/": "https://wa.me/201284157720" },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 50 } } },
    text: {
      "فيديو الواجهة": L("سماعة بيضا على حامل معدن", "White headphones on a metal stand"),
      "المجموعة الجديدة": L("مختارات الخريف ٢٠٢٦", "The Autumn 2026 edit"),
      "مساحتك، بطريقتك": L("صوت أنقى", "Purer sound"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "جادجتس مختارة بإيدينا، بضمان رسمي سنتين.",
        "Hand-picked gadgets, with a 2-year warranty.",
      ),
      "تسوّق الآن": L("اكتشف المختارات", "Explore the edit"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-circles", {
    text: { "بتدوّر على إيه؟": L("تسوّق حسب الجهاز", "Shop by device") },
  }),
  lib("products-feature", {
    text: {
      "اختيارنا ليك": L("اختيار الأسبوع من الاستوديو", "This week’s studio pick"),
      "اختيار الأسبوع": L("اختيار الأسبوع", "Pick of the week"),
    },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("about-list", {
    photo: [undefined, undefined, undefined, undefined, undefined, PHOTOS.whiteDesk],
    text: {
      "صورة المتجر": L("كيبورد وموبايل وماوس على مكتب أبيض", "A keyboard, phone and mouse on a white desk"),
      "مع كل طلب": L("من استوديو أثير", "From the Atheer studio"),
      "كل منتج بيتراجع قبل ما يوصلك": L("بنجرب كل جهاز قبل ما نبيعه", "We test every device before we sell it"),
      "فاتورة رسمية وضمان": L("فاتورة رسمية وضمان سنتين", "Official invoice, 2-year warranty"),
      "تغليف محمي من الصدمات": L("فحص صوت وبطارية قبل التغليف", "Sound and battery checked before packing"),
      "رقم تتبع على واتساب": L("استبدال خلال ١٤ يوم لو مش مرتاح", "Exchange within 14 days if it isn’t right"),
      "اعرف أكتر": L("زور الاستوديو", "Visit the studio"),
    },
  }),
  ...categoryRows(lib, { viewAll: L("عرض الكل", "View all"), muted: [1, 3] }),
  lib("newsletter-interests", {
    text: {
      "إيه اللي يهمك؟": L("اختار اللي يهمك من أثير", "Choose what you want from Atheer"),
      "هنبعتلك اللي يخصك بس، مرة في الأسبوع.": L(
        "رسالة واحدة في الشهر بالأجهزة اللي وصلت ورأينا فيها بعد التجربة.",
        "One letter a month with what just arrived and what we thought after testing it.",
      ),
      "وصل حديثًا": L("وصل حديثًا", "New in"),
      "العروض": L("مراجعات", "Reviews"),
      "هدايا": L("أفكار هدايا", "Gift ideas"),
      "نصايح": L("نصايح للاستخدام", "How-to tips"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن أثير", "About Atheer"), L("أجهزة أصلية مختارة بعناية، من الزمالك.", "Carefully chosen genuine devices, from Zamalek.")),
  aboutStory(lib, {
    photo: PHOTOS.flatLay,
    alt: L("ساعة ذكية وموبايل ودفتر على خلفية سودا", "A smartwatch, phone and notebook laid flat on black"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("أقل أجهزة، اختيار أدق", "Fewer devices, chosen more carefully"),
    text: L(
      "بدأنا استوديو صغير في الزمالك لأننا تعبنا من رفوف مليانة أجهزة شبه بعض. إحنا بنختار جهاز أو اتنين من كل نوع، بعد ما نعيش بيهم أسبوع.",
      "We opened a small Zamalek studio because we were tired of shelves full of look-alike devices. We pick one or two of each kind, after living with them for a week.",
    ),
    more: L("وكل جهاز بيوصلك بفاتورة رسمية وضمان سنتين، وفريقنا بيرد عليك على واتساب في أي وقت.", "Every device arrives with an official invoice and a two-year warranty, and our team answers on WhatsApp any time."),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أجهزة أصلية مختارة بعناية، بضمان رسمي سنتين.", "Carefully chosen genuine devices, with a two-year official warranty."),
  categories: [
    ["headphones", "السماعات", "Headphones", PHOTOS.catHeadphones],
    ["speakers", "السبيكرات", "Speakers", PHOTOS.catSpeakers],
    ["phone-accessories", "إكسسوارات الموبايل", "Phone accessories", PHOTOS.catPhone],
    ["computers", "اللابتوب والملحقات", "Laptops & peripherals", PHOTOS.catComputers],
    ["smartwatches", "الساعات الذكية", "Smartwatches", PHOTOS.catWatches],
    ["cameras", "الكاميرات", "Cameras", PHOTOS.catCameras],
  ],
  products: [
    // Headphones
    ["halo-on-ear-white", "headphones", "سماعة هالو بلوتوث بيضا", "Halo On-Ear Bluetooth, White", P(3394650), 2450, { isFeatured: true, rating: 4.9, sold90: 112 }],
    ["pearl-true-wireless", "headphones", "إيربودز لاسلكي لؤلؤي", "Pearl True Wireless Earbuds", P(8380417), 2890, { compareAtPrice: 3290, rating: 4.8, sold90: 86 }],
    ["fold-wired-white", "headphones", "سماعة فولد سلك قابلة للطي", "Fold Wired Headphones", P(9058878), 950, { rating: 4.5, sold90: 64 }],
    ["white-wireless-earbuds", "headphones", "إيربودز لاسلكي أبيض", "White Wireless Earbuds", P(4812934), 1890, { rating: 4.7, sold90: 51 }],
    ["studio-stand-edition", "headphones", "سماعة ستوديو بحامل ألومنيوم", "Studio Headphones with Aluminium Stand", P(27350775), 6900, { rating: 5, sold90: 23 }],
    ["midnight-over-ear", "headphones", "سماعة أوفر إير ميدنايت", "Midnight Over-Ear Headphones", P(33034333), 4650, { rating: 4.8, sold90: 38 }],
    ["white-wired-earphones", "headphones", "سماعة أذن سلك بيضا", "White Wired Earphones", P(14272792), 390, { rating: 4.6, sold90: 29 }],
    ["monitor-pro-black", "headphones", "سماعة مونيتور برو سودا", "Monitor Pro Studio Headphones, Black", P(12266869), 4200, { rating: 4.9, sold90: 17, inStock: false }],
    // Speakers
    ["orbit-wood-speaker", "speakers", "سبيكر أوربت بإطار خشب", "Orbit Wood-Trim Speaker", P(9842750), 1850, { rating: 4.8, sold90: 47 }],
    ["pebble-mini-chalk", "speakers", "سبيكر بيبل ميني طباشيري", "Pebble Mini Smart Speaker, Chalk", P(4132534), 1450, { rating: 4.6, sold90: 73 }],
    ["globe-smart-speaker", "speakers", "سبيكر جلوب ذكي", "Globe Smart Speaker", P(14309809), 2650, { isFeatured: true, compareAtPrice: 2990, rating: 4.7, sold90: 172 }],
    ["pearl-fabric-speaker", "speakers", "سبيكر بيرل قماش", "Pearl Fabric Wireless Speaker", P(11103381), 2200, { rating: 4.8, sold90: 34 }],
    ["graphite-travel-speaker", "speakers", "سبيكر سفر جرافيت", "Graphite Travel Speaker", P(7772558), 1290, { rating: 4.5, sold90: 58 }],
    ["linen-tower-speaker", "speakers", "سبيكر برج كتان", "Linen Tower Speaker", P(11337255), 2100, { rating: 4.7, sold90: 19 }],
    ["denim-mini-speaker", "speakers", "سبيكر ميني دينم", "Denim Mini Smart Speaker", P(36326800), 1550, { rating: 4.6, sold90: 15 }],
    ["dot-light-speaker", "speakers", "سبيكر دوت بإضاءة", "Dot Mini Speaker with Lights", P(1072851), 1350, { rating: 4.4, sold90: 27 }],
    // Phone accessories
    ["usb-c-hub", "phone-accessories", "هب USB-C متعدد المنافذ", "USB-C Multiport Hub", P(20076003), 1450, { rating: 4.8, sold90: 140 }],
    ["dual-charger-set", "phone-accessories", "طقم شواحن USB-C مزدوج", "Dual USB-C Charger Set", P(16886332), 1250, { isFeatured: true, rating: 4.9, sold90: 168 }],
    ["marble-wireless-pad", "phone-accessories", "شاحن لاسلكي رخام ودهبي", "Marble Wireless Charging Pad", P(5961044), 1150, { compareAtPrice: 1350, rating: 4.7, sold90: 66 }],
    ["compact-wall-charger", "phone-accessories", "شاحن حيطة صغير", "Compact Wall Charger", P(3921708), 450, { rating: 4.6, sold90: 120 }],
    ["white-usb-cable", "phone-accessories", "كابل USB أبيض ١ متر", "White USB Cable, 1 m", P(12997239), 190, { rating: 4.5, sold90: 118 }],
    ["bamboo-phone-stand", "phone-accessories", "حامل موبايل بامبو", "Bamboo Phone Stand", P(4065883), 350, { rating: 4.8, sold90: 54 }],
    ["bamboo-phone-dock", "phone-accessories", "قاعدة موبايل بامبو", "Bamboo Phone Dock", P(6373077), 420, { rating: 4.7, sold90: 31 }],
    ["white-cable-set", "phone-accessories", "طقم كابلات شحن أبيض", "White Charging Cable Set", P(5208832), 520, { rating: 4.4, sold90: 47 }],
    // Laptops & peripherals
    ["air-13-laptop", "computers", "لابتوب إير ١٣ بوصة", "Air 13in Ultra-Thin Laptop", P(8534378), 48900, { isFeatured: true, rating: 4.9, sold90: 165 }],
    ["silver-14-laptop", "computers", "لابتوب ١٤ بوصة فضي", "14in Silver Laptop", P(8532637), 39500, { rating: 4.7, sold90: 26 }],
    ["slim-white-laptop", "computers", "لابتوب سليم إصدار أبيض", "Slim Laptop, White Edition", P(10655906), 42900, { compareAtPrice: 45900, rating: 4.8, sold90: 14 }],
    ["creator-16-laptop", "computers", "لابتوب كرييتور ١٦ بوصة مع ماوس", "Creator 16in Laptop with Mouse", P(12951088), 72500, { rating: 5, sold90: 9 }],
    ["wired-usb-mouse", "computers", "ماوس USB سلك", "Wired USB Mouse", P(20510003), 290, { rating: 4.5, sold90: 104 }],
    ["business-laptop-set", "computers", "لابتوب بيزنس مع ماوس لاسلكي", "Business Laptop with Wireless Mouse", P(16645416), 31900, { rating: 4.6, sold90: 18 }],
    ["white-wireless-mouse", "computers", "ماوس لاسلكي أبيض", "White Wireless Mouse", P(34396238), 1650, { rating: 4.7, sold90: 61 }],
    ["compact-mech-keyboard", "computers", "كيبورد ميكانيكال صغير أسود", "Compact Mechanical Keyboard, Black", P(11382767), 3400, { rating: 4.8, sold90: 37 }],
    // Smartwatches
    ["sport-watch-white", "smartwatches", "ساعة ذكية بحزام رياضي أبيض", "Smartwatch, White Sport Band", P(29730990), 8900, { rating: 4.8, sold90: 44 }],
    ["mesh-band-watch", "smartwatches", "ساعة ذكية بحزام شبكي", "Smartwatch, Mesh Band", P(9142237), 10500, { isFeatured: true, rating: 4.9, sold90: 178 }],
    ["black-watch-charger", "smartwatches", "ساعة ذكية سودا بشاحن مغناطيسي", "Black Smartwatch with Magnetic Charger", P(1334602), 7900, { compareAtPrice: 8900, rating: 4.6, sold90: 33 }],
    ["metal-band-watch", "smartwatches", "ساعة ذكية بحزام معدن أسود", "Smartwatch, Black Metal Band", P(3646165), 11200, { rating: 4.7, sold90: 12 }],
    // Cameras
    ["white-mirrorless-kit", "cameras", "كاميرا ميرورلس بيضا بعدسة كيت", "White Mirrorless Camera with Kit Lens", P(4540452), 24500, { rating: 4.8, sold90: 16 }],
    ["blush-instant-camera", "cameras", "كاميرا فورية روز", "Instant Camera, Blush", P(17378226), 3900, { rating: 4.7, sold90: 39 }],
    ["dslr-zoom-kit", "cameras", "كاميرا DSLR بعدسة زووم", "DSLR with Zoom Lens", P(6891485), 36900, { rating: 4.9, sold90: 8 }],
    ["portrait-prime-lens", "cameras", "عدسة بورتريه ثابتة", "Portrait Prime Lens", P(34956920), 18900, { rating: 4.5, sold90: 11 }],
  ],
});

export const ELECTRONICS_LUXE = libraryTemplate({
  key: ELECTRONICS_LUXE_KEY,
  version: 1,
  name: L("أثير", "Atheer"),
  description: L(
    "إلكترونيات بهدوء فاخر: فيديو لسماعة على حامل، أقسام في دواير وأربع صفوف منتجات. لمتاجر السماعات والجادجتس الراقية.",
    "Quiet, premium electronics: a headphone-stand video, category circles and four product rows. For premium audio and gadget stores.",
  ),
  category: "electronics",
  sortOrder: 1260,
  palette: ["#f6f7f9", "#eceef2", "#1c1f24", "#5b6b82"],
  colors: {
    primary: "#1c1f24",
    secondary: "#eceef2",
    background: "#f6f7f9",
    foreground: "#121418",
    muted: "#5d6470",
    border: "#dde1e7",
    accent: "#5b6b82",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "IBM Plex Sans Arabic" },
  radius: 4,
  containerMaxWidth: 1440,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن أثير", "About"), seo: { title: L("عن أثير", "About Atheer") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زورنا أو كلمنا", "Visit or call us"),
        text: L("الاستوديو: ٢٦ شارع البرازيل، الزمالك، القاهرة. مفتوح من ١١ الصبح لـ ١٠ بالليل.", "Studio: 26 Brazil St, Zamalek, Cairo. Open 11am to 10pm."),
        heading: L("محتار بين جهازين؟ اسألنا", "Torn between two devices? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتوصيل والاستبدال.", "Warranty, delivery and exchanges."),
        question: L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
        answer: L(
          "كل جهاز عليه ضمان رسمي سنتين ضد عيوب الصناعة. لو حصلت مشكلة ابعتلنا على واتساب، وبنستلم الجهاز من عندك ونرجعهولك متصلح أو نبدله.",
          "Every device carries a two-year official warranty against manufacturing faults. If something goes wrong, message us on WhatsApp and we collect the device, then return it repaired or replaced.",
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
    copy: { reviews: L("آراء عملائنا", "What our customers say"), related: L("يكمّل جهازك", "Goes with your device") },
  },
});
