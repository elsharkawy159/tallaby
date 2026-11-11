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
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Shahn Mobile itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const VOLT_KEY = "volt";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(VOLT_KEY, getDesign(id)!, { corners: 14, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  powerBank: pexels(3921704, 900),
  powerBankSilver: pexels(4072683, 900),
  powerBankWide: pexels(4072683, 1600),
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

/**
 * Shahn Mobile's own content: what the look is built with when no edition is
 * applied (the template `volt` has always meant). The store name and
 * description and the category chips come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن شاحن، كابل، سماعة…", "Search chargers, cables, earbuds…") },
  categories: { title: L("بتدور على إيه؟", "What are you after?") },
  // Compact quick-buy rows of what `journey.primary` shows.
  products: { primary: { title: L("إكسسوارات بأسعار عادلة", "Accessories at fair prices") } },
  // Optional, with `custom.reviews-reply`: three WhatsApp-style messages from buyers, each with a name.
  reviews: {
    title: L("رسايل من عملائنا", "Messages from our customers"),
    items: [
      {
        quote: L("الباور بانك وصل تاني يوم الصبح وبيشحن بالسرعة الكاملة فعلاً.", "The power bank arrived the next morning and it really charges at full speed."),
        name: L("أحمد س.", "Ahmed S."),
      },
      {
        quote: L("السماعة كان فيها تشويش، بدّلوها في يومين من غير نقاش.", "The earbuds had a crackle; they swapped them in two days without arguing."),
        name: L("منى ك.", "Mona K."),
      },
      {
        quote: L("حامل العربية كويس. الشفاط ماسك حتى والتابلوه سخن.", "Good car mount. The suction holds on a hot dashboard too."),
        name: L("عمر ف.", "Omar F."),
      },
    ],
  },
  about: {
    line: L("محل إكسسوارات صغير في مدينة نصر بيجرّب كل حاجة بيبيعها.", "A small accessories shop in Nasr City that tests everything it sells."),
    alt: L("شاحن وكابل على رخامة", "A charger and cable on marble"),
    eyebrow: L("مدينة نصر", "Nasr City"),
    title: L("بنجرّب كل شاحن قبل ما نبيعه", "We test every charger before we sell it"),
    text: L("بنقيس سرعة الشحن الحقيقية لكل باور بانك وكابل، ومش بنبيع حاجة مش بتوصل للرقم اللي مكتوب عليها.", "We measure the real charging speed of every power bank and cable, and never sell anything that misses its label."),
    more: L("وضمان الاستبدال سنة كاملة على كل حاجة.", "And every item has a full 1-year replacement warranty."),
    // Goes to the best sellers.
    cta: L("تسوّق الأكثر مبيعاً", "Shop best sellers"),
  },
  contact: {
    title: L("الدعم", "Support"),
    line: L("اسألنا أنهي كابل أو شاحن يناسب موبايلك.", "Ask us which cable or charger fits your phone."),
    heading: L("ابعتلنا موديل موبايلك", "Send us your phone model"),
  },
  faq: {
    line: L("الضمان والتوصيل والاستبدال.", "Warranty, delivery and replacements."),
    question: L("إيه ضمان الاستبدال؟", "What is the replacement warranty?"),
    answer: L(
      "أي منتج فيه عيب صناعة خلال سنة بنبدّله بجديد. ابعتلنا رقم الطلب وصورة للمشكلة.",
      "Any item with a manufacturing fault within a year is replaced with a new one. Send us the order number and a photo of the problem.",
    ),
  },
  custom: {
    // The hero's giant word behind the store's first featured product: ONE short word (Latin capitals in English), never a phrase.
    "hero-word": L("طاقة", "POWER"),
    // The second of the comparison's five rows, ticked for the store AND for other shops: a promise other shops make too. The other four rows are the library's (genuine with an invoice, 14-day returns, cash on delivery, WhatsApp reply in minutes).
    "compare-row-2": L("ضمان استبدال سنة", "1-year replacement warranty"),
    // Optional, with `reviews`: the store's short answer under the first message.
    "reviews-reply": L("مبسوطين إنه وصلك بسرعة، استمتع بيه.", "Glad it reached you fast, enjoy it."),
  },
  // The look's only photo block is the about page's (4:5). The hero shows the first featured product's own photo.
  photos: { story: PHOTOS.charger },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Top rated, Why buy from us?, Other shops, Support) and the layout stay
 * here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const initial = initialOf(name);
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);

  const header = lib("header-chips", {
    text: { "م": initial, "اسم متجرك": name, "ابحث عن منتج…": c.labels.search },
  });

  const footer = lib("footer-help", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer messages: the section is left out (it needs the quotes and the store's reply).
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const reply: LookContent["custom"][string] | undefined = c.custom["reviews-reply"];
  const home: Design[] = [
    lib("hero-big-word", { text: { "جديد": c.custom["hero-word"]! } }),
    lib("categories-chips", { text: { "إيه اللي في بالك؟": c.categories.title } }),
    lib("products-rows", {
      text: { "إكسسوارات بسعر حلو": c.products.primary.title },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary }],
    }),
    lib("features-compare", {
      text: {
        "إحنا ولا غيرنا؟": L("ليه تشتري مننا؟", "Why buy from us?"),
        "متجرنا": name,
        "غيرنا": L("محلات تانية", "Other shops"),
        "ضمان محلي": c.custom["compare-row-2"]!,
      },
    }),
    ...(reviews && reply
      ? [
          lib("testimonials-chat", {
            text: {
              "رسايل بتفرّحنا": reviews.title,
              "مريم أ.": reviews.items[0]!.name,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "ده يسعدنا جدًا، شكرًا ليكي!": reply,
              "عمر ك.": reviews.items[1]!.name,
              "بدّلت المقاس بدون أي تعب، والفريق رد علي في دقائق.": reviews.items[1]!.quote,
              "يوسف م.": reviews.items[2]!.name,
              "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": reviews.items[2]!.quote,
            },
          }),
        ]
      : []),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutName, c.about.line),
    aboutStory(lib, {
      photo: c.photos.story,
      alt: c.about.alt,
      eyebrow: c.about.eyebrow,
      title: c.about.title,
      text: c.about.text,
      more: c.about.more,
      button: c.about.cta,
      href: BEST,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L("عننا", "About"), seo: { title: aboutName }, sections: about },
      {
        slug: "contact",
        name: L("الدعم", "Support"),
        seo: { title: L("الدعم", "Support") },
        sections: contactPage(lib, { title: c.contact.title, text: c.contact.line, heading: c.contact.heading }),
      },
      {
        slug: "faq",
        name: L("الأسئلة الشائعة", "FAQ"),
        seo: { title: L("الأسئلة الشائعة", "FAQ") },
        sections: faqPage(lib, { text: c.faq.line, question: c.faq.question, answer: c.faq.answer }),
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("شواحن وكابلات وسماعات بتشتغل من غير وجع دماغ.", "Chargers, cables and audio that just work."),
  categories: [
    ["power", "باور بانك", "Power banks", PHOTOS.powerBank],
    ["audio", "سماعات", "Earbuds & audio", PHOTOS.buds],
    ["wearables", "ساعات ذكية", "Smartwatches", PHOTOS.watch],
    ["cables", "كابلات وشواحن", "Cables & chargers", PHOTOS.cable],
    ["car", "إكسسوارات عربية", "Car accessories", PHOTOS.carMount],
    ["headphones", "سماعات راس", "Headphones", PHOTOS.headphones],
    ["chargers", "شواحن", "Chargers", PHOTOS.charger],
    ["bundles", "باقات", "Bundles", PHOTOS.powerBankSilver],
  ],
  products: [
    // The first featured product fills hero-big-word: a wide landscape photo (template-rules, owner 2026-10-27).
    ["magsnap-10k", "power", "باور بانك ماج سناب 10K", "MagSnap 10K Power Bank", PHOTOS.powerBankWide, 1290, { compareAtPrice: 1490, isFeatured: true, rating: 4.8, sold90: 412 }],
    ["slim-20k", "power", "باور بانك سليم 20K", "Slim 20K Power Bank", PHOTOS.powerBank, 990, { rating: 4.7, sold90: 263 }],
    ["mini-power-stick", "power", "باور ستيك ميني", "Mini Power Stick", PHOTOS.powerBankSmall, 390, { sold90: 150 }],
    ["pulse-buds-pro", "audio", "سماعة بالس برو", "Pulse Buds Pro", PHOTOS.budsOpen, 1590, { compareAtPrice: 1890, rating: 4.6, sold90: 198 }],
    ["air-buds-4", "audio", "سماعة إير 4", "Air Buds 4", PHOTOS.buds, 1190, { sold90: 121 }],
    ["night-buds", "audio", "سماعة نايت", "Night Buds", PHOTOS.budsCase, 790, { compareAtPrice: 890, sold90: 88 }],
    ["studio-headphones", "headphones", "سماعة ستوديو", "Studio Headphones", PHOTOS.headphones, 890, { sold90: 64 }],
    ["ultra-3-watch", "wearables", "ساعة ألترا 3", "Ultra 3 Smartwatch", PHOTOS.watch, 1450, { isFeatured: true, rating: 4.4, sold90: 92 }],
    ["usb-c-braided-cable", "cables", "كابل USB-C مضفّر", "Braided USB-C Cable", PHOTOS.cable, 190, { rating: 4.6, sold90: 330 }],
    ["fast-wall-charger", "chargers", "شاحن حيطة سريع", "Fast Wall Charger", PHOTOS.charger, 350, { sold90: 120 }],
    ["car-mount-360", "car", "حامل موبايل للعربية 360°", "360° Car Mount", PHOTOS.carMount, 350, { inStock: false, rating: 4.5, sold90: 330 }],
    ["travel-power-bundle", "bundles", "باقة السفر: باور بانك وكابل", "Travel Bundle: Power Bank & Cable", PHOTOS.powerBankSilver, 1390, { compareAtPrice: 1580, sold90: 47 }],
  ],
});

export const VOLT = editionTemplate({
  key: VOLT_KEY,
  version: 4,
  changelog: "Volt v4: wide hero photo",
  name: L("فولت", "Volt"),
  description: L(
    "إكسسوارات موبايل: كلمة كبيرة للمنتج، صفوف شراء سريع ومقارنة. أربع صفحات جاهزة.",
    "Mobile accessories: a big-word launch, quick-buy rows and a comparison. Four ready pages.",
  ),
  category: "mobile-accessories",
  style: ["bold"],
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
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "categories.title",
    "products.primary.title",
    "about",
    "contact",
    "faq",
    "custom.hero-word",
    "custom.compare-row-2",
    "photos.story",
  ],
  // Buyer messages are demo claims: a pack writes real ones (with the store's reply) or leaves both out, and the section is then not built.
  optional: ["reviews", "custom.reviews-reply"],
  // Best sellers in compact rows; no category rows.
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { reviews: L("آراء الزباين", "What buyers say"), related: L("اشتريها معاها", "Grab it with") } },
});
