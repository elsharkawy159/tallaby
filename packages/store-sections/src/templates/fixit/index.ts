/**
 * Fixit (template 39, phone repair and accessories; Claude Design
 * "Storefront Templates"): cool grey paper, a deep navy ink and a burnt
 * orange accent, Noto Kufi Arabic throughout and 14px corners. A repair
 * counter that also sells accessories: repair services, the repair journey,
 * repair prices by brand, two earbuds head to head, protection plans,
 * buying tips and support channels. Built from section
 * library designs (`fromLibrary`).
 *
 * Repairs are booked on WhatsApp (there is no repair-ticket status page),
 * and protection plans are not sold through checkout: their buttons open
 * WhatsApp. The price menu has room for two Samsung rows, so the design's
 * "back glass" row is left out. Head to head's second side shows the newest
 * product (as in Sada), so Air Buds 4 is listed first. "Buying guides"
 * (`finder-guides`) reads the store blog and renders empty without posts
 * (the template render check gives none), so the four guide tips are
 * numbered steps (`text-steps`), copy only.
 *
 * Photos: Pexels, each checked by eye (2026-10-23): earbuds in an open
 * case, white earbuds on a dark desk, a grey power bank and a solar power
 * bank, two USB-C wall chargers, mini power sticks on a shelf, a square
 * smartwatch, a USB-C cable on marble and chargers with a cable on marble.
 * No people, no hands and no brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch, type ListPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const FIXIT_KEY = "fixit";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FIXIT_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  pulseBuds: pexels(32880383, 900),
  airBuds: pexels(6889216, 900),
  magBank: pexels(3921705, 900),
  solarBank: pexels(518530, 900),
  dualCharger: pexels(4865059, 900),
  miniSticks: pexels(38649063, 900),
  watch: pexels(11700618, 900),
  cable: pexels(3921711, 900),
  bench: pexels(3921710),
};

const NAME = L("صلّح موبايل", "Sallah Mobile");

const header = lib("header-search", {
  text: {
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "ابحث عن منتج…": L("ابحث عن شاحن، سماعة، باور بانك…", "Search chargers, earbuds, power banks…"),
    "وصل حديثًا": L("الإكسسوارات", "Accessories"),
    "الأكثر مبيعًا": L("الأعلى تقييمًا", "Top rated"),
    "العروض": L("أدلة", "Guides"),
    "هدايا": L("مكتب الصيانة", "Repair desk"),
    "إكسسوارات": L("باور بانك", "Power banks"),
    "توصيل خلال ٤٨ ساعة": L("التصليح جاهز في ٢–٤ ساعات", "Repairs ready in 2–4 hours"),
  },
  links: { "/products": [undefined, SHOP, RATED, "/blog", "/contact", search("باور بانك")] },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ص", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ صلّح موبايل. كل الحقوق محفوظة.", "© 2026 Sallah Mobile. All rights reserved."),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("service-cards", {
    text: {
      "خدمات بعد البيع": L("بنصلّح في المحل، في نفس اليوم", "Fixed in our shop, same day"),
      "عشان جهازك يفضل شغال زي الجديد.": L("تغيير شاشة وبطارية وسوكت ونقل داتا، بضمان ٣ شهور.", "Screens, batteries, ports and data transfer, with a 3-month warranty."),
      "تركيب في البيت": L("تغيير شاشة", "Screen replacement"),
      "نركّب الشاشة أو الرسيفر ونظبط القنوات.": L("شاشات أصلية وهاي كوبي بضمان ٣ شهور.", "Original and high-copy screens with a 3-month warranty."),
      "من ٢٥٠ ج.م": L("من ٩٠٠ ج.م", "From EGP 900"),
      "صيانة وإصلاح": L("تغيير بطارية", "Battery replacement"),
      "تغيير بطارية أو شاشة في نفس اليوم.": L("بتخلص في حوالي ساعة وانت مستني.", "Done in about an hour while you wait."),
      "من ١٥٠ ج.م": L("من ٤٥٠ ج.م", "From EGP 450"),
      "استبدل القديم": L("سوكت الشحن", "Charging port"),
      "جيب جهازك القديم وخد خصم على الجديد.": L("الموبايل مش بيشحن أو الكابل بيفلت؟ بنغير السوكت.", "Phone not charging or loose cable? We swap the port."),
      "مجانًا": L("من ٣٠٠ ج.م", "From EGP 300"),
      "مد الضمان": L("نقل الداتا", "Data transfer"),
      "سنة أو سنتين زيادة على ضمان الوكيل.": L("الأرقام والصور والشاتات تتنقل للموبايل الجديد.", "Contacts, photos and chats moved to your new phone."),
      "من ١٩٩ ج.م": L("مجانًا", "Free"),
    },
  }),
  lib("service-journey", {
    text: {
      "جهازك هيرجع إمتى؟": L("موبايلك هيرجع إمتى؟", "When do you get it back?"),
      "في الفرع أو مع المندوب": L("في المحل أو مع المندوب", "At the shop or by our courier"),
      "ساعتين": L("نص ساعة", "30 min"),
      "٤ ساعات": L("١–٣ ساعات", "1–3 h"),
      "نكلمك يوم ما يخلص": L("بنكلمك أول ما يخلص", "We call you the moment it is ready"),
      "٢٤ ساعة": L("٤ ساعات", "4 hours"),
    },
  }),
  lib("service-price-menu", {
    text: {
      "أسعار الخدمات": L("أسعار الصيانة", "Repair prices"),
      "الأسعار شاملة قطع الغيار الأصلية والضمان.": L("الأسعار شاملة القطع وضمان ٣ شهور.", "Prices include parts and a 3-month warranty."),
      "الموبايل": L("آيفون", "iPhone"),
      "تغيير بطارية": L("بطارية", "Battery"),
      "٦٥٠ ج.م": L("١٢٥٠ ج.م", "EGP 1,250"),
      "تغيير شاشة": L("شاشة", "Screen"),
      "٢٤٠٠ ج.م": L("٣٩٠٠ ج.م", "EGP 3,900"),
      "سوكت الشحن": L("سوكت شحن", "Charging port"),
      "٤٥٠ ج.م": L("٦٥٠ ج.م", "EGP 650"),
      "الشاشات والبيت": L("سامسونج", "Samsung"),
      "تركيب حائط": L("بطارية", "Battery"),
      "٣٥٠ ج.م": L("٨٥٠ ج.م", "EGP 850"),
      "ضبط رسيفر": L("شاشة", "Screen"),
      "١٥٠ ج.م": L("٢٩٠٠ ج.م", "EGP 2,900"),
      "السماعات": L("أي موبايل", "Any phone"),
      "تغيير وسايد": L("تنظيف وفحص", "Clean and check"),
      "١٢٠ ج.م": L("١٠٠ ج.م", "EGP 100"),
      "تنظيف وفحص": L("سوفت وير", "Software reset"),
      "٨٠ ج.م": L("١٥٠ ج.م", "EGP 150"),
    },
  }),
  lib("finder-versus", {
    text: {
      "تختار مين؟": L("تختار أنهي سماعة؟", "Which earbuds?"),
      "٥٫٢ جم": L("جوه الودن", "In-ear"),
      "الوزن": L("التثبيت", "Fit"),
      "٤٫٨ جم": L("مفتوحة", "Open-fit"),
      "IPX٤": L("لأ", "No"),
      "مقاومة المية": L("شحن لاسلكي", "Wireless charging"),
      "IPX٥": L("أيوه", "Yes"),
    },
    lists: [undefined, { source: "newest", offset: null } as ListPatch],
  }),
  lib("service-plans", {
    text: {
      "الضمان": L("الحماية", "Protection"),
      "احمي جهازك أكتر": L("احمي موبايلك مدة أطول", "Cover your phone for longer"),
      "سنة": L("٦ شهور", "6 months"),
      "١٩٩ ج.م": L("٢٩٩ ج.م", "EGP 299"),
      "إصلاح الأعطال": L("فحص مجاني", "Free diagnosis"),
      "فني في البيت": L("خصم ١٠٪ على القطع", "10% off parts"),
      "سنتين": L("سنة", "1 year"),
      "٣٤٩ ج.م": L("٥٤٩ ج.م", "EGP 549"),
      "جهاز بديل وقت الصيانة": L("بطارية مجانية مرة وموبايل بديل", "One free battery and a loan phone"),
      "٣ سنين": L("سنتين", "2 years"),
      "٤٧٩ ج.م": L("٨٩٩ ج.م", "EGP 899"),
      "كل مزايا السنتين": L("كل مزايا السنة", "Everything in 1 year"),
    },
  }),
  lib("text-steps", {
    name: L("قبل ما تشتري", "Before you buy"),
    text: {
      "إزاي ترجّع منتج": L("قبل ما تشتري", "Before you buy"),
      "ابعتلنا على واتساب": L("اختار السماعة حسب مكانها", "Pick earbuds by where you wear them"),
      "خلال ١٤ يوم من الاستلام مع رقم الطلب.": L("اللي بيركب مواصلات محتاج عزل ضوضاء، واللي بيجري محتاج تثبيت كويس.", "Commuters need noise cancelling; runners need a secure fit."),
      "جهّز المنتج": L("الشحن السريع مش بيأذي", "Fast charging is safe"),
      "في علبته الأصلية بكل الإكسسوارات.": L("الموبايل بيتفق مع الشاحن على السرعة. الحرارة هي العدو مش الوات.", "The phone agrees the speed with the charger. Heat is the enemy, not watts."),
      "المندوب يستلم": L("اعرف إمتى تغير البطارية", "Know when to change the battery"),
      "خلال يومين شغل من عنوانك.": L("لو بيفصل على ٢٠٪ أو الضهر بيتفتح، بطّل تشحنه وهاته.", "If it dies at 20% or the back lifts, stop charging and bring it in."),
      "فلوسك ترجع": L("10K ولا 20K؟", "10K or 20K?"),
      "بنفس طريقة الدفع خلال ٥ أيام.": L("باور ١٠ آلاف بيشحن أغلب الموبايلات مرتين. خد ٢٠ ألف للسفر.", "A 10,000 mAh bank charges most phones twice. Pick 20K for trips."),
    },
  }),
  lib("service-support", {
    text: {
      "من ١٠ ص لـ ١٠ م": L("من ١١ ص لـ ١١ م", "11 am – 11 pm"),
      "زور فرع": L("زور المحل", "Visit the shop"),
      "٣ فروع في القاهرة": L("عباس العقاد، مدينة نصر", "Abbas El Akkad, Nasr City"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن صلّح موبايل", "About Sallah Mobile"), L("مكتب صيانة ومحل إكسسوارات في مدينة نصر من ٢٠١٨.", "A repair counter and accessories shop in Nasr City since 2018.")),
  aboutStory(lib, {
    photo: PHOTOS.bench,
    alt: L("شواحن وكابل على رخام", "Chargers and a cable on marble"),
    eyebrow: L("من ٢٠١٨", "Since 2018"),
    title: L("تصليح وانت مستني", "Repairs while you wait"),
    text: L("مكتب صيانة صغير في مدينة نصر بيغير الشاشات والبطاريات في نفس اليوم، وبيبعتلك السعر قبل ما يلمس الموبايل.", "A small repair counter in Nasr City that swaps screens and batteries the same day, and sends you the price before touching the phone."),
    more: L("وجنبه رف إكسسوارات بنستعملها إحنا الأول: شواحن وسماعات وباور بانك.", "And next to it a shelf of accessories we use ourselves first: chargers, earbuds and power banks."),
    button: L("تسوق الإكسسوارات", "Shop accessories"),
    href: SHOP,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("تصليح موبايل وانت مستني، وإكسسوارات بتعيش.", "Phone repair while you wait, and accessories that last."),
  categories: [
    ["chargers", "شواحن وكابلات", "Chargers & cables", PHOTOS.dualCharger],
    ["audio", "سماعات", "Audio", PHOTOS.pulseBuds],
    ["power", "باور بانك", "Power banks", PHOTOS.magBank],
    ["watches", "ساعات", "Watches", PHOTOS.watch],
  ],
  products: [
    ["air-buds-4", "audio", "سماعة إير 4", "Air Buds 4", PHOTOS.airBuds, 1390, { rating: 4.5, sold90: 140 }],
    ["pulse-buds-pro", "audio", "سماعة بالس برو", "Pulse Buds Pro", PHOTOS.pulseBuds, 1730, { compareAtPrice: 2100, isFeatured: true, rating: 4.7, sold90: 212 }],
    ["maggo-power-bank", "power", "باور بانك ماج 10K", "MagGo 10K Power Bank", PHOTOS.magBank, 1835, { sold90: 96 }],
    ["solar-power-bank", "power", "باور بانك سولار 20K", "Solar 20K Power Bank", PHOTOS.solarBank, 1080, { sold90: 58 }],
    ["dual-usb-c-charger", "chargers", "شاحن USB-C مزدوج ٣٥ وات", "Dual USB-C Charger 35W", PHOTOS.dualCharger, 390, { compareAtPrice: 460, sold90: 180 }],
    ["mini-power-stick", "chargers", "باور ستيك ميني", "Mini Power Stick", PHOTOS.miniSticks, 480, { sold90: 44 }],
    ["usb-c-cable", "chargers", "كابل USB-C مضفر", "Braided USB-C Cable", PHOTOS.cable, 180, { sold90: 120 }],
    ["ultra-3-smartwatch", "watches", "ساعة ألترا 3", "Ultra 3 Smartwatch", PHOTOS.watch, 1450, { isFeatured: true, sold90: 73 }],
  ],
});

export const FIXIT = libraryTemplate({
  key: FIXIT_KEY,
  version: 1,
  name: L("فيكس إت", "Fixit"),
  description: L(
    "صيانة موبايل وإكسسوارات: خدمات الصيانة ورحلتها، أسعار حسب الماركة، مقارنة سماعتين، باقات حماية، أدلة شراء والدعم. أربع صفحات جاهزة.",
    "Phone repair and accessories: repair services and journey, prices by brand, two earbuds compared, protection plans, buying guides and support. Four ready pages.",
  ),
  category: "mobile-accessories",
  sortOrder: 390,
  palette: ["#f4f6f8", "#e3e9ef", "#c2410c", "#102030"],
  colors: {
    primary: "#102030",
    secondary: "#e3e9ef",
    background: "#f4f6f8",
    foreground: "#102030",
    muted: "#52606d",
    border: "#d5dde5",
    accent: "#c2410c",
  },
  fonts: { heading: "Noto Kufi Arabic", body: "Noto Kufi Arabic" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن صلّح موبايل", "About"), seo: { title: L("عن صلّح موبايل", "About Sallah Mobile") }, sections: about },
    {
      slug: "contact",
      name: L("مكتب الصيانة", "Repair desk"),
      seo: { title: L("مكتب الصيانة", "Repair desk") },
      sections: contactPage(lib, {
        title: L("مكتب الصيانة", "Repair desk"),
        text: L("١٢ شارع عباس العقاد، مدينة نصر. من ١١ ص لـ ١١ م.", "12 Abbas El Akkad St, Nasr City. 11 am – 11 pm."),
        heading: L("قولنا موبايلك فيه إيه وهنبعتلك السعر", "Tell us what is wrong and we will send the price"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الصيانة والضمان والطلبات.", "Repairs, warranty and orders."),
        question: L("التصليح عليه ضمان؟", "Is there a warranty on repairs?"),
        answer: L("أيوه، ٣ شهور على القطعة والشغل. لو حصلت مشكلة هاته المحل ونصلحه ببلاش.", "Yes, 3 months on the part and the work. If anything goes wrong, bring it in and we fix it free."),
      }),
    },
  ],
  demo: DEMO,
});
