/**
 * Volt (template 06, mobile accessories; Claude Design "Storefront
 * Templates"): white paper, navy ink, an electric blue for actions and a
 * lime highlight, Alexandria throughout and 14px corners. A quick-buy
 * store: a chip rail header, a big-word launch, compact rows, spend tiers, a
 * comparison and WhatsApp-style reviews. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): chargers, cables, power
 * banks, earbuds and watches on plain backgrounds. No people and no visible
 * brand logos.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const VOLT_KEY = "volt";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(VOLT_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  powerBank: pexels(3921704, 900),
  powerBankSilver: pexels(4072683, 900),
  powerBankSmall: pexels(3921705, 900),
  cable: pexels(3921713, 900),
  charger: pexels(3921632, 900),
  buds: pexels(3921817, 900),
  budsCase: pexels(9130517, 900),
  budsOpen: pexels(3921830, 900),
  headphones: pexels(7772548, 900),
  watch: pexels(13007642, 900),
  watchDesk: pexels(27355743, 900),
  carMount: pexels(7738878, 900),
};

const NAME = L("شحن موبايل", "Shahn Mobile");

const header = lib("header-chips", {
  text: { "م": L("ش", "S"), "اسم متجرك": NAME, "ابحث عن منتج…": L("ابحث عن شاحن، كابل، سماعة…", "Search chargers, cables, earbuds…") },
});

const footer = lib("footer-help", {
  text: {
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شحن موبايل. كل الحقوق محفوظة.", "© 2026 Shahn Mobile. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-big-word", { text: { "جديد": L("طاقة", "POWER") } }),
  lib("categories-chips", { text: { "إيه اللي في بالك؟": L("بتدور على إيه؟", "What are you after?") } }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("إكسسوارات بأسعار عادلة", "Accessories at fair prices") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers" }],
  }),
  lib("promo-tiers", {}),
  lib("features-compare", {
    text: {
      "إحنا ولا غيرنا؟": L("ليه تشتري مننا؟", "Why buy from us?"),
      "متجرنا": NAME,
      "غيرنا": L("محلات تانية", "Other shops"),
      "ضمان محلي": L("ضمان استبدال سنة", "1-year replacement warranty"),
    },
  }),
  lib("testimonials-chat", {
    text: {
      "رسايل بتفرّحنا": L("رسايل من عملائنا", "Messages from our customers"),
      "مريم أ.": L("أحمد س.", "Ahmed S."),
      "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": L(
        "الباور بانك وصل تاني يوم الصبح وبيشحن بالسرعة الكاملة فعلاً.",
        "The power bank arrived the next morning and it really charges at full speed.",
      ),
      "ده يسعدنا جدًا، شكرًا ليكي!": L("مبسوطين إنه وصلك بسرعة، استمتع بيه.", "Glad it reached you fast, enjoy it."),
      "عمر ك.": L("منى ك.", "Mona K."),
      "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": L(
        "السماعة كان فيها تشويش، بدّلوها في يومين من غير نقاش.",
        "The earbuds had a crackle; they swapped them in two days without arguing.",
      ),
      "يوسف م.": L("عمر ف.", "Omar F."),
      "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": L(
        "حامل العربية كويس. الشفاط ماسك حتى والتابلوه سخن.",
        "Good car mount. The suction holds on a hot dashboard too.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(
    lib,
    "about-header",
    L("عن شحن موبايل", "About Shahn Mobile"),
    L("محل إكسسوارات صغير في مدينة نصر بيجرّب كل حاجة بيبيعها.", "A small accessories shop in Nasr City that tests everything it sells."),
  ),
  aboutStory(lib, {
    photo: PHOTOS.charger,
    alt: L("شاحن وكابل على رخامة", "A charger and cable on marble"),
    eyebrow: L("مدينة نصر", "Nasr City"),
    title: L("بنجرّب كل شاحن قبل ما نبيعه", "We test every charger before we sell it"),
    text: L("بنقيس سرعة الشحن الحقيقية لكل باور بانك وكابل، ومش بنبيع حاجة مش بتوصل للرقم اللي مكتوب عليها.", "We measure the real charging speed of every power bank and cable, and never sell anything that misses its label."),
    more: L("وضمان الاستبدال سنة كاملة على كل حاجة.", "And every item has a full 1-year replacement warranty."),
    button: L("تسوّق الأكثر مبيعاً", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("شواحن وكابلات وسماعات بتشتغل من غير وجع دماغ.", "Chargers, cables and audio that just work."),
  categories: [
    ["power", "باور بانك", "Power banks", PHOTOS.powerBank],
    ["audio", "سماعات", "Earbuds & audio", PHOTOS.buds],
    ["wearables", "ساعات ذكية", "Smartwatches", PHOTOS.watch],
    ["cables", "كابلات وشواحن", "Cables & chargers", PHOTOS.cable],
    ["car", "إكسسوارات عربية", "Car accessories", PHOTOS.carMount],
  ],
  products: [
    ["magsnap-10k", "power", "باور بانك ماج سناب 10K", "MagSnap 10K Power Bank", PHOTOS.powerBank, 1290, { compareAtPrice: 1490, isFeatured: true, rating: 4.8, sold90: 412 }],
    ["slim-20k", "power", "باور بانك سليم 20K", "Slim 20K Power Bank", PHOTOS.powerBankSilver, 990, { rating: 4.7, sold90: 263 }],
    ["mini-power-stick", "power", "باور ستيك ميني", "Mini Power Stick", PHOTOS.powerBankSmall, 390, { sold90: 150 }],
    ["pulse-buds-pro", "audio", "سماعة بالس برو", "Pulse Buds Pro", PHOTOS.budsOpen, 1590, { compareAtPrice: 1890, rating: 4.6, sold90: 198 }],
    ["air-buds-4", "audio", "سماعة إير 4", "Air Buds 4", PHOTOS.buds, 1190, { sold90: 121 }],
    ["night-buds", "audio", "سماعة نايت", "Night Buds", PHOTOS.budsCase, 790, { compareAtPrice: 890, sold90: 88 }],
    ["studio-headphones", "audio", "سماعة ستوديو", "Studio Headphones", PHOTOS.headphones, 890, { sold90: 64 }],
    ["ultra-3-watch", "wearables", "ساعة ألترا 3", "Ultra 3 Smartwatch", PHOTOS.watch, 1450, { isFeatured: true, rating: 4.4, sold90: 92 }],
    ["usb-c-braided-cable", "cables", "كابل USB-C مضفّر", "Braided USB-C Cable", PHOTOS.cable, 190, { rating: 4.6, sold90: 330 }],
    ["fast-wall-charger", "cables", "شاحن حيطة سريع", "Fast Wall Charger", PHOTOS.charger, 350, { sold90: 120 }],
    ["car-mount-360", "car", "حامل موبايل للعربية 360°", "360° Car Mount", PHOTOS.carMount, 350, { inStock: false, rating: 4.5, sold90: 330 }],
  ],
});

export const VOLT = libraryTemplate({
  key: VOLT_KEY,
  version: 1,
  name: L("فولت", "Volt"),
  description: L(
    "إكسسوارات موبايل: كلمة كبيرة للمنتج، صفوف شراء سريع، عروض بالمبلغ ومقارنة. أربع صفحات جاهزة.",
    "Mobile accessories: a big-word launch, quick-buy rows, spend tiers and a comparison. Four ready pages.",
  ),
  category: "mobile-accessories",
  sortOrder: 60,
  palette: ["#ffffff", "#c6ff3d", "#2d5bff", "#0d1631"],
  colors: {
    primary: "#2d5bff",
    secondary: "#eef1f8",
    background: "#ffffff",
    foreground: "#0d1631",
    muted: "#4f5873",
    border: "#dde2ee",
    accent: "#c6ff3d",
  },
  fonts: { heading: "Alexandria", body: "Alexandria" },
  radius: 14,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن شحن موبايل", "About Shahn Mobile") }, sections: about },
    {
      slug: "contact",
      name: L("الدعم", "Support"),
      seo: { title: L("الدعم", "Support") },
      sections: contactPage(lib, {
        title: L("الدعم", "Support"),
        text: L("اسألنا أنهي كابل أو شاحن يناسب موبايلك.", "Ask us which cable or charger fits your phone."),
        heading: L("ابعتلنا موديل موبايلك", "Send us your phone model"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والتوصيل والاستبدال.", "Warranty, delivery and replacements."),
        question: L("إيه ضمان الاستبدال؟", "What is the replacement warranty?"),
        answer: L(
          "أي منتج فيه عيب صناعة خلال سنة بنبدّله بجديد. ابعتلنا رقم الطلب وصورة للمشكلة.",
          "Any item with a manufacturing fault within a year is replaced with a new one. Send us the order number and a photo of the problem.",
        ),
      }),
    },
  ],
  demo: DEMO,
});
