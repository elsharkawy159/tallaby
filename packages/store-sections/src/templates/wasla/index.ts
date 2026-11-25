/**
 * Wasla (2026-10-29, phone and device accessories, after the layout and feel
 * of the WoodMart "Accessories" demo; no code, copy or photos taken from it):
 * white paper, light-grey panels, a calm blue, Alexandria throughout, square
 * corners and a 1320px container. The icon header, a panel slider with the
 * product beside the copy, grey category circles with counts, new arrivals
 * under category tabs, three plain feature columns, the cases as a carousel
 * (the store's 1st category; 2026-11-25), four collection panels of uneven
 * widths, a centred best sellers row and the dark footer bar (all built for
 * this look on 2026-10-29). Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-29): accessories only on plain
 * backgrounds, no people or hands, no readable brand lettering or logos, none
 * used twice and none shared with another template. Slides 3921628, 7742552,
 * 1643753; collection panels 374117, 29301897, 5208826, 7742585; categories
 * 7742544, 5083411, 12997240, 4097203, 32977238, 37475662; products as listed
 * in `DEMO`. Left out as borderline: 845239 (faint regulatory print), 2779018
 * (app icons on the watch face). Browser QA swap: panel 7742587 (a hand
 * holding a phone grip) for 5208826, moved from the cable products. Slide 2
 * 4574587 (the red case filled the frame) for 7742552: a small bull emblem
 * on the orange case, no lettering (owner approved, 2026-10-29).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const WASLA_KEY = "wasla";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(WASLA_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideCharger: pexels(3921628, 1600),
  slideCase: pexels(7742552, 1600),
  slideCable: pexels(1643753, 1600),
  panelCases: pexels(374117, 1000),
  panelStraps: pexels(29301897, 1000),
  panelCableSet: pexels(5208826, 1000),
  panelPad: pexels(7742585, 1000),
  // Category circles.
  catCases: pexels(7742544, 600),
  catWireless: pexels(5083411, 600),
  catCables: pexels(12997240, 600),
  catWallChargers: pexels(4097203, 600),
  catStraps: pexels(32977238, 600),
  catPowerBanks: pexels(37475662, 600),
};

const NAME = L("وصلة", "Wasla");

const header = lib("header-icons", {
  text: {
    "اسم متجرك": NAME,
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر مبيعًا", "Best sellers"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-dark-bar", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ وصلة. كل الحقوق محفوظة.", "© 2026 Wasla. All rights reserved."),
  },
});

const home: Design[] = [
  lib("hero-carousel-panel", {
    photo: [PHOTOS.slideCharger, PHOTOS.slideCase, PHOTOS.slideCable],
    text: {
      "صورة الشريحة الأولى": L("شاحن جداري أبيض على رخام فاتح", "A white wall charger on pale marble"),
      "صورة الشريحة الثانية": L("ست جرابات جلد ملوّنة متجاورة", "Six coloured leather cases in a row"),
      "صورة الشريحة الثالثة": L("كابل مضفّر بألوان قوس قزح على أبيض", "A rainbow braided cable on white"),
    },
    links: { "/about": ["/about", "/products", "/about"] },
  }),
  lib("categories-counts"),
  lib("products-category-tabs"),
  lib("features-columns"),
  // The store's 1st category (cases, in the demo) as a carousel.
  lib("products-category-carousel", { lists: [undefined, { limit: 4 }] }),
  lib("categories-panels", {
    photo: [PHOTOS.panelCases, PHOTOS.panelStraps, PHOTOS.panelCableSet, PHOTOS.panelPad],
    text: {
      "مختارات": L("طقم كامل", "Complete set"),
      "حوامل بألوان مبهجة": L("كابل وشاحن في علبة واحدة", "Cable and charger in one box"),
    },
    links: { "/products": [SHOP, SHOP, NEW, BEST] },
  }),
  lib("products-centered-row"),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن وصلة", "About Wasla"), L("إكسسوارات للهاتف والساعة الذكية.", "Phone and smartwatch accessories.")),
  aboutStory(lib, {
    photo: P(3921703),
    alt: L("شاحن متنقل أسود وشواحن على رخام", "A black power bank and chargers on marble"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("إكسسوارات لهاتفك وساعتك", "Accessories for your phone and watch"),
    text: L(
      "نختار جرابات وشواحن وكابلات وأساور، ونكتب الموديلات المتوافقة مع كل منتج.",
      "We choose cases, chargers, cables and straps, and list the compatible models for every product.",
    ),
    more: L("تواصل معنا لأي سؤال عن توافق منتج مع هاتفك.", "Contact us with any question about whether a product fits your phone."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("جرابات وشواحن وكابلات لهاتفك وساعتك.", "Cases, chargers and cables for your phone and watch."),
  categories: [
    ["cases", "الجرابات", "Cases", PHOTOS.catCases],
    ["wireless-chargers", "الشواحن اللاسلكية", "Wireless chargers", PHOTOS.catWireless],
    ["cables", "الكابلات", "Cables", PHOTOS.catCables],
    ["wall-chargers", "الشواحن الجدارية", "Wall chargers", PHOTOS.catWallChargers],
    ["straps", "أساور الساعات", "Watch straps", PHOTOS.catStraps],
    ["power-banks", "الشواحن المتنقلة", "Power banks", PHOTOS.catPowerBanks],
  ],
  products: [
    // Cases
    ["brown-leather-case", "cases", "جراب جلد بني", "Brown Leather Case", P(7538510), 450, { isFeatured: true, rating: 4.8, sold90: 96 }],
    ["black-marble-case", "cases", "جراب رخامي أسود", "Black Marble Case", P(28077969), 220, { rating: 4.6, sold90: 74 }],
    ["black-folio-case", "cases", "جراب محفظة أسود", "Black Folio Wallet Case", P(14979770), 390, { compareAtPrice: 450, rating: 4.7, sold90: 58 }],
    ["clear-shockproof-case", "cases", "جراب شفاف ضد الصدمات", "Clear Shockproof Case", P(7360460), 180, { rating: 4.5, sold90: 140 }],
    ["navy-stand-case", "cases", "جراب كحلي بحامل", "Navy Case with Stand", P(15678381), 260, { rating: 4.6, sold90: 41 }],
    ["orange-silicone-case", "cases", "جراب سيليكون برتقالي", "Orange Silicone Case", P(12708808), 199, { rating: 4.7, sold90: 88 }],
    // Wireless chargers
    ["slim-wireless-pad", "wireless-chargers", "شاحن لاسلكي رفيع", "Slim Wireless Charging Pad", P(5948344), 550, { isFeatured: true, rating: 4.8, sold90: 72 }],
    ["clock-charging-stand", "wireless-chargers", "حامل شحن مغناطيسي بساعة", "Magnetic Charging Stand with Clock", P(19238582), 1250, { rating: 4.7, sold90: 29 }],
    ["ambient-light-charger", "wireless-chargers", "شاحن لاسلكي بإضاءة", "Ambient Light Wireless Charger", P(27302515), 890, { compareAtPrice: 990, rating: 4.6, sold90: 33 }],
    ["watch-charging-dock", "wireless-chargers", "قاعدة شحن للساعة الذكية", "Smartwatch Charging Dock", P(39559134), 650, { rating: 4.5, sold90: 21 }],
    // Cables
    ["usb-c-cable-white", "cables", "كابل USB-C أبيض", "USB-A to USB-C Cable, White", P(36100789), 120, { rating: 4.7, sold90: 160 }],
    ["lightning-cable-blue", "cables", "كابل Lightning", "Lightning Cable", P(28042836), 150, { rating: 4.6, sold90: 110 }],
    ["braided-black-cable", "cables", "كابل شحن مضفّر أسود", "Braided Black Charging Cable", P(28190367), 175, { isFeatured: true, rating: 4.8, sold90: 130 }],
    ["heavy-duty-orange-cable", "cables", "كابل USB متين برتقالي", "Heavy-Duty Orange USB Cable", P(4219862), 140, { rating: 4.5, sold90: 64 }],
    ["car-lightning-cable", "cables", "كابل Lightning للسيارة", "Lightning Car Cable", P(12671356), 160, { rating: 4.4, sold90: 37 }],
    // Wall chargers
    ["usb-wall-charger-white", "wall-chargers", "شاحن جداري USB أبيض", "USB Wall Charger, White", P(3921717), 180, { rating: 4.6, sold90: 95 }],
    ["dual-fold-charger", "wall-chargers", "شاحن سفر برجل قابلة للطي", "Foldable Travel Charger", P(14468975), 320, { rating: 4.7, sold90: 46 }],
    ["charger-strip-set", "wall-chargers", "طقم ٣ شواحن", "Three-Charger Set", P(16886334), 590, { rating: 4.5, sold90: 23 }],
    ["charger-with-cable", "wall-chargers", "شاحن جداري مع كابل", "Wall Charger with Cable", P(5208825), 290, { isFeatured: true, rating: 4.8, sold90: 81 }],
    // Watch straps
    ["white-sport-band", "straps", "سوار رياضي أبيض", "White Sport Band", P(13598510), 250, { rating: 4.7, sold90: 66 }],
    ["white-silicone-band", "straps", "سوار سيليكون أبيض", "White Silicone Band", P(9584702), 220, { rating: 4.6, sold90: 48 }],
    ["orange-rubber-strap", "straps", "سوار مطاطي برتقالي", "Orange Rubber Strap", P(15649364), 240, { rating: 4.6, sold90: 39 }],
    ["black-textured-band", "straps", "سوار أسود محبّب", "Black Textured Band", P(39076652), 280, { isFeatured: true, rating: 4.8, sold90: 57 }],
    ["pink-woven-loop", "straps", "سوار منسوج وردي", "Woven Loop Band, Pink", P(13991170), 320, { compareAtPrice: 380, rating: 4.7, sold90: 34 }],
    ["yellow-braided-loop", "straps", "سوار مضفّر أصفر", "Braided Loop Band, Yellow", P(12466396), 340, { rating: 4.6, sold90: 22 }],
    ["pink-silicone-band", "straps", "سوار سيليكون وردي", "Pink Silicone Band", P(31406908), 220, { rating: 4.5, sold90: 44 }],
    // Power banks
    ["black-power-bank", "power-banks", "شاحن متنقل أسود", "Black Power Bank", P(3921703), 690, { rating: 4.7, sold90: 63 }],
  ],
});

export const WASLA = libraryTemplate({
  key: WASLA_KEY,
  version: 2,
  changelog: "Wasla v2: a cases carousel (the store's 1st category) on the home",
  name: NAME,
  description: L(
    "متجر إكسسوارات مرتب: شرائح بلوح فاتح، دوائر أقسام، منتجات بتبويبات وألواح عروض رمادية. لمتاجر الجرابات والشواحن والكابلات.",
    "A clean, tidy accessories store: a light panel slider, category circles, tabbed products and grey offer panels. For case, charger and cable shops.",
  ),
  category: "mobile-accessories",
  style: ["minimal"],
  sortOrder: 1500,
  palette: ["#ffffff", "#f3f3f3", "#2e6bc6", "#242424"],
  colors: {
    primary: "#2e6bc6",
    secondary: "#f3f3f3",
    background: "#ffffff",
    foreground: "#242424",
    muted: "#6b6b6b",
    border: "#e6e6e6",
    accent: "#e8f0fb",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 0,
  containerMaxWidth: 1320,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن وصلة", "About"), seo: { title: L("عن وصلة", "About Wasla") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L(`تواصل معنا لأي سؤال عن منتج أو طلب: ${phone("٠١١٢ ٤٦٨ ٣٠٥٩")}، ${handle("hello@wasla.eg")}`, "Contact us with any question about a product or order: +20 112 468 3059 · hello@wasla.eg"),
        heading: L("هل الجراب مناسب لهاتفك؟ اسألنا", "Not sure a case fits your phone? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوافق والمقاسات والطلبات.", "Fit, sizes and orders."),
        question: L("كيف أعرف أن الجراب مناسب لهاتفي؟", "How do I know a case fits my phone?"),
        answer: L(
          "الموديلات المتوافقة مكتوبة في صفحة كل جراب. تواصل معنا إن لم تكن متأكدًا.",
          "Compatible models are listed on every case page. Contact us if you are not sure.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("آراء عملائنا", "Customer reviews"), related: L("منتجات تناسبه", "Goes well with") },
  },
});
