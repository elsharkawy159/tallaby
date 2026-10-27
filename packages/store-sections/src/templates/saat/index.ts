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
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch, type ListPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

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

const header = lib("header-ruled", {
  text: { "م": L("ر", "S"), "اسم متجرك": NAME, "المتجر": L("ساعات", "Watches"), "العروض": L("سمارت", "Smart") },
  links: { "/products": [search("ساعة"), search("سمارت"), undefined, undefined] },
});

const footer = lib("footer-ruled", {
  text: {
    "م": L("ر", "S"),
    "اسم متجرك": NAME,
    "منتجات أصلية بضمان، توصلك لحد البيت.": L("ساعات عقارب بضمان سنتين، وتركيب أسورة ببلاش.", "Analogue watches with a two-year warranty and free strap fitting."),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ركن الساعات. كل الحقوق محفوظة.", "© 2026 Saat Corner. All rights reserved."),
    "العروض": L("الأعلى تقييماً", "Top rated"),
  },
  links: { "/products": [undefined, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.slimWide],
    text: {
      "كوليكشن الموسم": L("ضمان سنتين", "Two-year warranty"),
      "صوت أنقى، كل يوم": L("ساعات بعقارب", "Watches with hands"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "ساعات فيلد وكلاسيك وغطس بنصونها في محلنا في وسط البلد.",
        "Field, dress and dive watches serviced in our Downtown shop.",
      ),
      "تسوق الآن": L("تسوق الساعات", "Shop watches"),
      "العروض": L("مكتب الصيانة", "Service desk"),
      "صورة الحملة": L("ساعة كلاسيك بأسورة جلد على خشب", "A dress watch with a leather strap on wood"),
    },
    links: { "/products": [search("ساعة"), "/contact"] },
  }),
  lib("categories-ruled", { text: { "الأقسام": L("الكورنر", "The corner"), "تسوق بالقسم": L("اختار ساعتك", "Choose your watch") } }),
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("الأكثر مبيعاً", "Best sellers"),
      "أحدث المنتجات اللي نزلت المتجر.": L("الساعات اللي بتخرج من الكورنر كل أسبوع.", "The watches that leave the corner every week."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 4 }],
  }),
  lib("finder-versus", {
    text: {
      "تختار مين؟": L("عقارب ولا سمارت؟", "Analogue or smart?"),
      "٣٠ ساعة": L("٣ سنين", "3 years"),
      "٢٤ ساعة": L("٧ أيام", "7 days"),
      "عزل الضوضاء": L("تتصلح في المحل", "Serviced in store"),
      "٥٫٢ جم": L("مفيش", "None"),
      "الوزن": L("الإشعارات", "Notifications"),
      "٤٫٨ جم": L("على الشاشة", "On screen"),
      "IPX٤": L("٥٠ متر", "50 m"),
      "مقاومة المية": L("ضد المية", "Water resistance"),
      "IPX٥": L("١٠٠ متر", "100 m"),
    },
    // The second side drops the library offset (a store with one best seller would hide the section) and shows the newest watch instead.
    lists: [undefined, { source: "newest", offset: null } as ListPatch],
  }),
  lib("pay-installments", {
    text: {
      "قسّطها": L("قسّط ساعتك", "Spread the cost"),
      "١٢": L("٩", "9"),
      "٢٤": L("١٢", "12"),
      "٢٤ شهر": L("١٢ شهر", "12 months"),
      "من غير فوايد ولا مقدم مع شركات التقسيط.": L("من غير فوايد ولا مقدم، والضمان سنتين زي الكاش.", "No interest, no down payment, and the same two-year warranty."),
    },
  }),
  lib("team-branches", {
    text: {
      "الفروع": L("المحل", "Shop"),
      "زورنا": L("زور مكتب الصيانة", "Visit the service desk"),
      "فرع الدقي": L("وسط البلد", "Downtown"),
      "٢٤ شارع التحرير، الدقي": L("شارع طلعت حرب، وسط البلد", "Talaat Harb St, Downtown"),
      "يوميًا من ١٢ الضهر لـ ١١ م": L("يوميًا من ١١ ص لـ ١٠ م", "Daily, 11 am to 10 pm"),
      "فرع مدينة نصر": L("مصر الجديدة", "Heliopolis"),
      "سيتي ستارز، الدور الأول": L("شارع الكوربة، مصر الجديدة", "El Korba St, Heliopolis"),
      "فرع المعادي": L("الإسكندرية", "Alexandria"),
      "شارع ٩، المعادي": L("شارع فؤاد، محطة الرمل", "Fouad St, Raml Station"),
    },
    links: { "https://maps.google.com": MAPS },
  }),
  lib("testimonials-quote", {
    text: {
      "آراء العملاء": L("من زباين الكورنر", "From the corner's regulars"),
      "«من أحسن تجارب الشراء أونلاين. الطلب وصل بسرعة، والتغليف شيك، والمنتج أحلى من الصور.»": L(
        "«اشتريت الكلاسيك بالتاريخ بالتقسيط، ولما احتاجت ظبط رجعتها المحل وخلصت في ربع ساعة.»",
        "«I bought the Classic Date on instalments, and when it needed adjusting the shop sorted it in fifteen minutes.»",
      ),
      "مريم أ.": L("أحمد ن.", "Ahmed N."),
      "القاهرة": L("وسط البلد", "Downtown"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ركن الساعات", "About Saat Corner"), L("محل ساعات ومكتب صيانة في وسط البلد.", "A watch shop and service desk in Downtown Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.bench,
    alt: L("ساعة جيب مفتوحة وأدوات تصليح على ترابيزة الصيانة", "An open pocket watch and tools on the repair bench"),
    eyebrow: L("وسط البلد", "Downtown"),
    title: L("ساعات بنصلحها بإيدينا", "Watches we service ourselves"),
    text: L("بنبيع الساعة ونصونها في نفس المحل: بطارية، أسورة، أو صيانة كاملة.", "We sell the watch and service it in the same shop: a battery, a strap or a full service."),
    more: L("وكل ساعة عليها ضمان سنتين.", "And every watch carries a two-year warranty."),
    button: L("تسوق الساعات", "Shop watches"),
    href: search("ساعة"),
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ساعات عقارب بضمان سنتين.", "Analogue watches with a two-year warranty."),
  categories: [
    ["watches", "ساعات", "Watches", PHOTOS.dateWatch],
    ["smart", "سمارت", "Smart", PHOTOS.smartBlack],
    ["straps", "أساور", "Straps", PHOTOS.strap],
  ],
  products: [
    ["classic-date-watch", "watches", "ساعة كلاسيك بالتاريخ", "Classic Date Watch", PHOTOS.dateWatch, 2400, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["ultra-smartwatch", "smart", "ساعة سمارت ألترا", "Ultra Smartwatch", PHOTOS.smartBlack, 1450, { sold90: 96 }],
    ["slim-dress-watch", "watches", "ساعة رفيعة جلد", "Slim Dress Watch", PHOTOS.slim, 3200, { compareAtPrice: 3600, sold90: 44 }],
    ["pocket-watch", "watches", "ساعة جيب بالعلبة", "Pocket Watch in a Box", PHOTOS.pocketBox, 2900, { sold90: 18 }],
    ["black-chronograph", "watches", "ساعة كرونو سودا", "Black Chronograph", PHOTOS.chrono, 4200, { isFeatured: true, rating: 4.9, sold90: 30 }],
    ["white-smartwatch", "smart", "ساعة سمارت بيضا", "White Smartwatch", PHOTOS.smartWhite, 1250, { compareAtPrice: 1450, sold90: 70 }],
    ["restored-vintage-watch", "watches", "ساعة فينتدج متجددة", "Restored Vintage Watch", PHOTOS.vintageWall, 1850, { rating: 4.6, sold90: 26 }],
    ["leather-strap", "straps", "أسورة جلد سودا", "Black Leather Strap", PHOTOS.strap, 390, { sold90: 140 }],
  ],
});

export const SAAT = libraryTemplate({
  key: SAAT_KEY,
  version: 3,
  changelog: "Saat v3: categories, best sellers, section order",
  productPage: { surface: "flat", thumbs: "side", button: "outline", band: "paper", extras: ["product-perks"], copy: { back: L("رجوع للساعات", "Back to the watches"), reviews: L("رأي أصحاب الساعات", "From watch owners"), related: L("ساعات تانية للمقارنة", "More watches to compare") } },
  name: L("ساعات", "Saat"),
  description: L(
    "ساعات كلاسيك: هيرو نصين، عقارب ولا سمارت، التقسيط، أسعار الصيانة والفروع. أربع صفحات جاهزة.",
    "Classic watches: a split hero, analogue or smart, instalments, service prices and the shops. Four ready pages.",
  ),
  category: "jewelry",
  sortOrder: 840,
  palette: ["#f6f5f2", "#e9e6df", "#d9b56c", "#14532d"],
  colors: {
    primary: "#14532d",
    secondary: "#e9e6df",
    background: "#f6f5f2",
    foreground: "#1a1a1a",
    muted: "#5c5a55",
    border: "#dad5cb",
    accent: "#d9b56c",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "Noto Sans Arabic" },
  radius: 6,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عننا", "About"), seo: { title: L("عن ركن الساعات", "About Saat Corner") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل", "Contact"),
        text: L("شارع طلعت حرب، وسط البلد.", "Talaat Harb St, Downtown."),
        heading: L("اسأل عن ساعة أو صيانة", "Ask about a watch or a repair"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الضمان والصيانة والتوصيل.", "Warranty, servicing and delivery."),
        question: L("الضمان بيغطي إيه؟", "What does the warranty cover?"),
        answer: L("الماكينة سنتين من يوم الشراء، والصيانة في محلنا في وسط البلد.", "The movement for two years from purchase, serviced in our Downtown shop."),
      }),
    },
  ],
  demo: DEMO,
});
