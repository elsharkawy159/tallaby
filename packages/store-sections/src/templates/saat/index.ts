/**
 * Saat (template 84, classic watches; Claude Design "Storefront
 * Templates"): stone paper, a deep racing green for actions and a brass
 * highlight, Noto Naskh Arabic headings over Noto Sans Arabic and tight 6px
 * corners. A Downtown watch corner: watches with hands, analogue or smart,
 * best sellers, instalments, the shops and a regular's word. Built from
 * section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): watches on wood,
 * leather and in boxes, two smartwatches with blank screens, a leather
 * strap and a watchmaker's bench. No wrists, hands or people, and no
 * brand names on the dials (branded dials were left out).
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Saat Corner itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays 3.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch, type ListPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const SAAT_KEY = "saat";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(SAAT_KEY, getDesign(id)!, { corners: 6, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;
const MAPS = "https://maps.google.com/";

const PHOTOS = {
  slimWide: pexels(5058216),
  slim: pexels(5058216, 900),
  dateWatch: pexels(14525782, 900),
  smartBlack: pexels(11700618, 900),
  smartWhite: pexels(31406903, 900),
  pocketBox: pexels(17069426, 900),
  chrono: pexels(15019856, 900),
  strap: pexels(35136298, 900),
  bench: pexels(8327593),
  vintageWall: pexels(39081213, 900),
};

const NAME = L("ركن الساعات", "Saat Corner");

/**
 * Saat Corner's own content: what the look is built with when no edition is
 * applied (the template `saat` has always meant). The store name and
 * description and the category photos come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's two catalog links. The first is also where the hero's button and the about page's button go, so it is the trade's main product type.
  nav: [
    { label: L("ساعات", "Watches"), href: search("ساعة") },
    { label: L("سمارت", "Smart"), href: search("سمارت") },
  ],
  footer: { line: L("ساعات عقارب بضمان سنتين، وتركيب أسورة ببلاش.", "Analogue watches with a two-year warranty and free strap fitting.") },
  hero: {
    eyebrow: L("ضمان سنتين", "Two-year warranty"),
    title: L("ساعات بعقارب", "Watches with hands"),
    line: L("ساعات فيلد وكلاسيك وغطس بنصونها في محلنا في وسط البلد.", "Field, dress and dive watches serviced in our Downtown shop."),
    // The button goes to the first header link (`nav.0`), so it names that product type.
    cta: L("تسوق الساعات", "Shop watches"),
    alt: L("ساعة كلاسيك بأسورة جلد على خشب", "A dress watch with a leather strap on wood"),
  },
  categories: { title: L("اختار ساعتك", "Choose your watch") },
  products: {
    primary: {
      title: L("الأكثر مبيعاً", "Best sellers"),
      line: L("الساعات اللي بتخرج من الكورنر كل أسبوع.", "The watches that leave the corner every week."),
    },
  },
  // Optional. One large quote: the eyebrow over it, then the quote (inside «») and who said it.
  reviews: {
    title: L("من زباين الكورنر", "From the corner's regulars"),
    items: [
      {
        quote: L(
          "«اشتريت الكلاسيك بالتاريخ بالتقسيط، ولما احتاجت ظبط رجعتها المحل وخلصت في ربع ساعة.»",
          "«I bought the Classic Date on instalments, and when it needed adjusting the shop sorted it in fifteen minutes.»",
        ),
        name: L("أحمد ن.", "Ahmed N."),
      },
    ],
  },
  about: {
    line: L("محل ساعات ومكتب صيانة في وسط البلد.", "A watch shop and service desk in Downtown Cairo."),
    alt: L("ساعة جيب مفتوحة وأدوات تصليح على ترابيزة الصيانة", "An open pocket watch and tools on the repair bench"),
    eyebrow: L("وسط البلد", "Downtown"),
    title: L("ساعات بنصلحها بإيدينا", "Watches we service ourselves"),
    text: L("بنبيع الساعة ونصونها في نفس المحل: بطارية، أسورة، أو صيانة كاملة.", "We sell the watch and service it in the same shop: a battery, a strap or a full service."),
    more: L("وكل ساعة عليها ضمان سنتين.", "And every watch carries a two-year warranty."),
    // The button goes to the first header link (`nav.0`).
    cta: L("تسوق الساعات", "Shop watches"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("شارع طلعت حرب، وسط البلد.", "Talaat Harb St, Downtown."),
    heading: L("اسأل عن ساعة أو صيانة", "Ask about a watch or a repair"),
  },
  faq: {
    line: L("الضمان والصيانة والتوصيل.", "Warranty, servicing and delivery."),
    question: L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
    answer: L("الماكينة سنتين من يوم الشراء، والصيانة في محلنا في وسط البلد.", "The movement for two years from purchase, serviced in our Downtown shop."),
  },
  custom: {
    // The hero's second (outline) button. It goes to the contact page.
    "hero-cta-2": L("مكتب الصيانة", "Service desk"),
    // The small word over the categories title.
    "categories-eyebrow": L("الكورنر", "The corner"),
    // Head to head: two of the store's products side by side (A: the list's first product, B: the newest), with four rows of
    // label, A's value, B's value. The title is the question the two sides answer; each value is one to three words.
    // Optional: `versus-1-label` (the library's "Battery"), `versus-2-a` and `versus-2-b` (the library's "Yes" and "No").
    "versus-title": L("عقارب ولا سمارت؟", "Analogue or smart?"),
    "versus-1-a": L("٣ سنين", "3 years"),
    "versus-1-b": L("٧ أيام", "7 days"),
    "versus-2-label": L("تتصلح في المحل", "Serviced in store"),
    "versus-3-label": L("الإشعارات", "Notifications"),
    "versus-3-a": L("مفيش", "None"),
    "versus-3-b": L("على الشاشة", "On screen"),
    "versus-4-label": L("ضد المية", "Water resistance"),
    "versus-4-a": L("٥٠ متر", "50 m"),
    "versus-4-b": L("١٠٠ متر", "100 m"),
    // Instalments (terms of 3, 6, 9 and 12 months, set in the look): the small line over the product, and the promise under "12 months".
    "pay-eyebrow": L("قسّط ساعتك", "Spread the cost"),
    "pay-line": L("من غير فوايد ولا مقدم، والضمان سنتين زي الكاش.", "No interest, no down payment, and the same two-year warranty."),
    // Three shop cards: the small word and the title over them, then each shop's name, address and opening hours.
    // Optional: `branches-2-hours` and `branches-3-hours` (the library's "Daily, 10 am – 10 pm" and "Sat – Thu, 12 – 10 pm").
    "branches-eyebrow": L("المحل", "Shop"),
    "branches-title": L("زور مكتب الصيانة", "Visit the service desk"),
    "branches-1-name": L("وسط البلد", "Downtown"),
    "branches-1-address": L("شارع طلعت حرب، وسط البلد", "Talaat Harb St, Downtown"),
    "branches-1-hours": L("يوميًا من ١١ ص لـ ١٠ م", "Daily, 11 am to 10 pm"),
    "branches-2-name": L("مصر الجديدة", "Heliopolis"),
    "branches-2-address": L("شارع الكوربة، مصر الجديدة", "El Korba St, Heliopolis"),
    "branches-3-name": L("الإسكندرية", "Alexandria"),
    "branches-3-address": L("شارع فؤاد، محطة الرمل", "Fouad St, Raml Station"),
  },
  photos: {
    // The hero's half: one product on a plain surface, 16:9 (cropped to a square on phones, so keep the subject centred).
    hero: { wide: PHOTOS.slimWide },
    // The about page's photo (the look has no story block on its home page).
    story: PHOTOS.bench,
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade or the demo store is a slot of `c`;
 * generic shop labels (Top rated, About, the instalment terms, the
 * reviewer's place) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  const main = c.nav[0]!;
  const x = c.custom;
  // Optional: a pack without a buyer quote gets the home page without the quote section (it then ends on the branches).
  const reviews: LookContent["reviews"] | undefined = c.reviews;

  const header = lib("header-ruled", {
    text: { "م": initialOf(name), "اسم متجرك": name, "المتجر": main.label, "العروض": c.nav[1]!.label },
    links: { "/products": [main.href, c.nav[1]!.href, undefined, undefined] },
  });

  const footer = lib("footer-ruled", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "منتجات أصلية بضمان، توصلك لحد البيت.": c.footer.line,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.wide],
      text: {
        "كوليكشن الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": x["hero-cta-2"]!,
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [main.href, "/contact"] },
    }),
    lib("categories-ruled", { text: { "الأقسام": x["categories-eyebrow"]!, "تسوق بالقسم": c.categories.title } }),
    lib("products-grid", {
      text: {
        "وصل حديثًا": c.products.primary.title,
        "أحدث المنتجات اللي نزلت المتجر.": c.products.primary.line,
      },
      links: { "/products": primaryHref(journey.primary) },
      lists: [{ source: journey.primary, limit: 4 }],
    }),
    lib("finder-versus", {
      text: {
        "تختار مين؟": x["versus-title"]!,
        ...(x["versus-1-label"] && { "البطارية": x["versus-1-label"] }),
        "٣٠ ساعة": x["versus-1-a"]!,
        "٢٤ ساعة": x["versus-1-b"]!,
        "عزل الضوضاء": x["versus-2-label"]!,
        ...(x["versus-2-a"] && { "أيوه": x["versus-2-a"] }),
        ...(x["versus-2-b"] && { "لأ": x["versus-2-b"] }),
        "٥٫٢ جم": x["versus-3-a"]!,
        "الوزن": x["versus-3-label"]!,
        "٤٫٨ جم": x["versus-3-b"]!,
        "IPX٤": x["versus-4-a"]!,
        "مقاومة المية": x["versus-4-label"]!,
        "IPX٥": x["versus-4-b"]!,
      },
      // The second side drops the library offset (a store with one best seller would hide the section) and shows the newest watch instead.
      lists: [undefined, { source: "newest", offset: null } as ListPatch],
    }),
    lib("pay-installments", {
      text: {
        "قسّطها": x["pay-eyebrow"]!,
        "١٢": L("٩", "9"),
        "٢٤": L("١٢", "12"),
        "٢٤ شهر": L("١٢ شهر", "12 months"),
        "من غير فوايد ولا مقدم مع شركات التقسيط.": x["pay-line"]!,
      },
    }),
    lib("team-branches", {
      text: {
        "الفروع": x["branches-eyebrow"]!,
        "زورنا": x["branches-title"]!,
        "فرع الدقي": x["branches-1-name"]!,
        "٢٤ شارع التحرير، الدقي": x["branches-1-address"]!,
        "يوميًا من ١٢ الضهر لـ ١١ م": x["branches-1-hours"]!,
        "فرع مدينة نصر": x["branches-2-name"]!,
        "سيتي ستارز، الدور الأول": x["branches-2-address"]!,
        ...(x["branches-2-hours"] && { "يوميًا من ١٠ ص لـ ١٠ م": x["branches-2-hours"] }),
        "فرع المعادي": x["branches-3-name"]!,
        "شارع ٩، المعادي": x["branches-3-address"]!,
        ...(x["branches-3-hours"] && { "السبت – الخميس، ١٢ – ١٠ م": x["branches-3-hours"] }),
      },
      links: { "https://maps.google.com": MAPS },
    }),
    ...(reviews
      ? [
          lib("testimonials-quote", {
            text: {
              "آراء العملاء": reviews.title,
              "«من أحسن تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف شيك، والمنتج أحلى من الصور.»": reviews.items[0]!.quote,
              "مريم أ.": reviews.items[0]!.name,
              "القاهرة": L("وسط البلد", "Downtown"),
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
      href: main.href,
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
        name: L("تواصل", "Contact"),
        seo: { title: L("تواصل", "Contact") },
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
  description: L("ساعات عقارب بضمان سنتين.", "Analogue watches with a two-year warranty."),
  categories: [
    ["watches", "ساعات", "Watches", PHOTOS.dateWatch],
    ["smart", "سمارت", "Smart", PHOTOS.smartBlack],
    ["straps", "أساور", "Straps", PHOTOS.strap],
    ["dress", "ساعات سهرة", "Dress watches", PHOTOS.slim],
    ["chrono", "كرونوغراف", "Chronographs", PHOTOS.chrono],
    ["pocket", "ساعات جيب", "Pocket watches", PHOTOS.pocketBox],
    ["vintage", "فينتدج", "Vintage", PHOTOS.vintageWall],
    ["sport", "رياضي", "Sport", PHOTOS.smartBlack],
  ],
  products: [
    ["classic-date-watch", "watches", "ساعة كلاسيك بالتاريخ", "Classic Date Watch", PHOTOS.dateWatch, 2400, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["ultra-smartwatch", "sport", "ساعة سمارت ألترا", "Ultra Smartwatch", PHOTOS.smartBlack, 1450, { sold90: 96 }],
    ["slim-dress-watch", "dress", "ساعة رفيعة جلد", "Slim Dress Watch", PHOTOS.slim, 3200, { compareAtPrice: 3600, sold90: 44 }],
    ["pocket-watch", "pocket", "ساعة جيب بالعلبة", "Pocket Watch in a Box", PHOTOS.pocketBox, 2900, { sold90: 18 }],
    ["black-chronograph", "chrono", "ساعة كرونو سودا", "Black Chronograph", PHOTOS.chrono, 4200, { isFeatured: true, rating: 4.9, sold90: 30 }],
    ["white-smartwatch", "smart", "ساعة سمارت بيضا", "White Smartwatch", PHOTOS.smartWhite, 1250, { compareAtPrice: 1450, sold90: 70 }],
    ["restored-vintage-watch", "vintage", "ساعة فينتدج متجددة", "Restored Vintage Watch", PHOTOS.vintageWall, 1850, { rating: 4.6, sold90: 26 }],
    ["leather-strap", "straps", "أسورة جلد سودا", "Black Leather Strap", PHOTOS.strap, 390, { sold90: 140 }],
  ],
});

export const SAAT = editionTemplate({
  key: SAAT_KEY,
  version: 3,
  changelog: "Saat v3: categories, best sellers, section order",
  productPage: { surface: "flat", thumbs: "side", button: "outline", band: "paper", extras: ["product-perks"], copy: { reviews: L("رأي أصحاب الساعات", "From watch owners"), related: L("ساعات تانية للمقارنة", "More watches to compare") } },
  name: L("ساعات", "Saat"),
  description: L(
    "ساعات كلاسيك: هيرو نصين، عقارب ولا سمارت، التقسيط، أسعار الصيانة والفروع. أربع صفحات جاهزة.",
    "Classic watches: a split hero, analogue or smart, instalments, service prices and the shops. Four ready pages.",
  ),
  category: "jewelry",
  style: ["classic", "luxe"],
  sortOrder: 840,
  palette: ["#f6f5f2", "#e9e6df", "#d9b56c", "#14532d"],
  colors: {
    primary: "#14532d",
    secondary: "#e9e6df",
    background: "#ffffff",
    foreground: "#1a1a1a",
    muted: "#5c5a55",
    border: "#dad5cb",
    accent: "#d9b56c",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Noto Sans Arabic" },
  radius: 6,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "nav.0",
    "nav.1",
    "footer.line",
    "hero",
    "custom.hero-cta-2",
    "custom.categories-eyebrow",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "custom.versus-title",
    "custom.versus-1-a",
    "custom.versus-1-b",
    "custom.versus-2-label",
    "custom.versus-3-label",
    "custom.versus-3-a",
    "custom.versus-3-b",
    "custom.versus-4-label",
    "custom.versus-4-a",
    "custom.versus-4-b",
    "custom.pay-eyebrow",
    "custom.pay-line",
    "custom.branches-eyebrow",
    "custom.branches-title",
    "custom.branches-1-name",
    "custom.branches-1-address",
    "custom.branches-1-hours",
    "custom.branches-2-name",
    "custom.branches-2-address",
    "custom.branches-3-name",
    "custom.branches-3-address",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
  ],
  // Without one of these the section keeps the library's own wording (see `DEFAULT_CONTENT`).
  // Without `reviews` the closing quote section is not built.
  optional: ["custom.versus-1-label", "custom.versus-2-a", "custom.versus-2-b", "custom.branches-2-hours", "custom.branches-3-hours", "reviews"],
  // Four best sellers; the look has no category rows.
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
