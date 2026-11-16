/**
 * Lahma (template 71, butcher and meat boxes; Claude Design "Storefront
 * Templates"): warm cream paper, a deep butcher's red for actions and a
 * mustard highlight, Changa headings over Cairo text and tight 6px
 * corners. A farm butcher: the Eid box poster, this week's cuts, the grill
 * pack bundle, cold-chain zones, open before you pay and the regulars'
 * reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): a rib roast on a board,
 * raw cuts with a pepper mill, minced beef, kofta on a grill and on a
 * plate, lamb chops, sausages, a pot roast, a grilled steak and half a
 * grilled chicken. No people, no hands, no logos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * El Gazzar itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const LAHMA_KEY = "lahma";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LAHMA_KEY, getDesign(id)!, { corners: 6, ...patch });

const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  ribRoast: pexels(33157191, 900),
  ribRoastWide: pexels(33157191),
  rawCuts: pexels(28881694, 900),
  rawCutsWide: pexels(28881694),
  steakCut: pexels(36319691, 900),
  minced: pexels(128401, 900),
  koftaGrill: pexels(31249644, 900),
  koftaPlate: pexels(32986492, 900),
  lambChops: pexels(6281506, 900),
  sausages: pexels(10794112, 900),
  potRoast: pexels(6545671, 900),
  grilledSteak: pexels(28292008, 900),
  chicken: pexels(36895285, 900),
};

const NAME = L("الجزار", "El Gazzar");

/**
 * El Gazzar's own content: what the look is built with when no edition is
 * applied (the template `lahma` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن كفتة، ريش، ستيك…", "Search kofta, chops, steak…") },
  // Only `nav.0.href` is read: where the hero's and the about page's buttons go.
  nav: [{ label: L("صناديق", "Boxes"), href: search("بوكس") }],
  // The poster hero: an eyebrow, a title, a line and a button (to `nav.0.href`), plus `custom.hero-note` and the round sticker (`custom.hero-sticker-1..3`, a price point, not an offer).
  hero: {
    alt: L("قطعية ريش على لوح خشب", "A rib cut on a wooden board"),
    eyebrow: L("صناديق العيد", "Eid boxes"),
    title: L("قطعيات لحوم طازجة", "Fresh cuts of meat"),
    line: L("لحم بقري وضاني ودواجن ومشويات، بوزن واضح لكل قطعية.", "Beef, lamb, chicken and grill cuts, with a clear weight for every cut."),
    cta: L("تسوّق الصناديق", "Shop boxes"),
  },
  categories: { title: L("ماذا ستطبخ اليوم؟", "What are you cooking today?") },
  // The bento block: a small eyebrow over its title.
  products: { primary: { eyebrow: L("الأكثر طلبًا", "Most ordered"), title: L("هذا الأسبوع", "This week") } },
  // Optional, with `custom.reviews-city-1..4`: a wall of six short buyer quotes under a title. Without them the home page ends on the delivery zones.
  reviews: {
    title: L("آراء العملاء", "Customer reviews"),
    items: [
      { quote: L("قطعيات صندوق العيد نظيفة ومقطعة جيدًا.", "The Eid box cuts were clean and well trimmed.") },
      { quote: L("الكفتة متبلة جيدًا ولا تحتاج إلى إضافات.", "The kofta is well seasoned and needs nothing else.") },
      { quote: L("الريش الضاني طرية ومناسبة للشوي.", "The lamb chops are tender and good for grilling.") },
      { quote: L("اللحم المفروم طازج وجودته ممتازة.", "The minced beef is fresh and of great quality.") },
      { quote: L("اللحم البلدي بطعم ممتاز.", "The local beef tastes great.") },
      { quote: L("السجق البلدي متبل بشكل متوازن.", "The beef sausage is evenly seasoned.") },
    ],
  },
  // The footer's sign-off line.
  footer: { line: L("قطعيات لحوم طازجة", "Fresh cuts of meat") },
  about: {
    line: L("لحوم ودواجن ومشويات طازجة.", "Fresh meat, poultry and grill cuts."),
    alt: L("قطعيات لحم طازجة على لوح", "Fresh cuts of meat on a board"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("قطعيات مختارة بعناية", "Cuts chosen with care"),
    text: L("نختار القطعيات بعناية، ونعرض الوزن ونوع التقطيع لكل منتج بوضوح.", "We choose every cut with care and show its weight and cut type clearly."),
    more: L("تواصل معنا لأي سؤال عن قطعية أو وزن.", "Contact us with any question about a cut or a weight."),
    // Goes to `nav.0.href`.
    cta: L("تسوّق الصناديق", "Shop boxes"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("يوميًا من ٧ ص حتى ١١ م.", "Every day, 7 am to 11 pm."),
    heading: L("اسأل عن قطعية أو وزن", "Ask about a cut or a weight"),
  },
  faq: {
    line: L("القطعيات والأوزان والحفظ.", "Cuts, weights and storage."),
    question: L("كيف أحفظ اللحوم بعد الاستلام؟", "How should I store meat after delivery?"),
    answer: L("احفظها في الثلاجة واستخدمها خلال يومين، أو في الفريزر لمدة أطول.", "Keep it in the fridge and use it within two days, or freeze it for longer."),
  },
  custom: {
    // The footer's sign-off button (WhatsApp), two or three words.
    "footer-cta": L("تواصل معنا", "Contact us"),
    // The hero's small line and its round sticker (three short parts: a word, a number, a unit).
    "hero-note": L("قطعيات لحوم مختارة", "Selected meat cuts"),
    "hero-sticker-1": L("من", "From"),
    "hero-sticker-2": L("٢٤٠٠", "2,400"),
    "hero-sticker-3": L("ج.م", "EGP"),
    // The delivery zones: an eyebrow, a title, a line, a note, then five zones, each a name, a delivery time and a fee.
    "zones-eyebrow": L("توصيل مبرد", "Cold chain"),
    "zones-title": L("توصيل مبرد", "Cold-chain delivery"),
    "zones-line": L("سيارات مبردة من المتجر حتى عنوانك.", "Chilled vans from the shop to your address."),
    "zones-note": L("توصيل مجاني للطلبات فوق ١٬٠٠٠ ج.م", "Free delivery on orders over EGP 1,000"),
    "zone-1-name": L("وسط القاهرة", "Downtown Cairo"),
    "zone-1-time": L("نفس اليوم", "Same day"),
    "zone-1-price": L("٤٠ ج.م", "EGP 40"),
    "zone-2-name": L("الجيزة والدقي", "Giza & Dokki"),
    "zone-3-name": L("مدينة نصر ومصر الجديدة", "Nasr City & Heliopolis"),
    "zone-3-time": L("نفس اليوم", "Same day"),
    "zone-3-price": L("٤٠ ج.م", "EGP 40"),
    "zone-4-name": L("٦ أكتوبر والشيخ زايد", "6th of October & Sheikh Zayed"),
    "zone-4-time": L("نفس اليوم", "Same day"),
    "zone-4-price": L("٥٥ ج.م", "EGP 55"),
    "zone-5-name": L("العاصمة الجديدة", "New Capital"),
    "zone-5-time": L("اليوم التالي", "Next day"),
    "zone-5-price": L("٧٠ ج.م", "EGP 70"),
    // With `reviews`: four cities shown on the wall.
    "reviews-city-1": L("مدينة نصر", "Nasr City"),
    "reviews-city-2": L("الدقي", "Dokki"),
    "reviews-city-3": L("المعادي", "Maadi"),
    "reviews-city-4": L("الشيخ زايد", "Sheikh Zayed"),
  },
  // hero.wide: the poster hero; story: the about page.
  photos: { hero: { wide: PHOTOS.ribRoastWide }, story: PHOTOS.rawCutsWide },
};

/**
 * The home's products grid (owner, 2026-11-16: every home has one): the
 * newest products, or the best sellers when the main list already shows the
 * newest, so an edition never repeats its main list.
 */
function gridPatch(primary: LookJourney["primary"]): LibraryPatch {
  return primary === "newest"
    ? {
        text: {
          "وصل حديثًا": L("الأكثر طلبًا", "Best sellers"),
          "أحدث المنتجات في المتجر.": L("المنتجات الأكثر طلبًا في المتجر.", "The store's most ordered products."),
        },
        links: { "/products": BEST },
        lists: [{ source: "best-sellers", limit: 8 }],
      }
    : {
        text: {
          "وصل حديثًا": L("وصل حديثًا", "New in"),
          "أحدث المنتجات في المتجر.": L("أحدث المنتجات في المتجر.", "The newest products in the store."),
        },
        links: { "/products": NEW },
        lists: [{ source: "newest", limit: 8 }],
      };
}

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Top rated) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const main = c.nav[0]!.href;
  const tiles = c.photos.tiles.length;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  // The logo letter skips the article ("الجزار" → "ج", "El Gazzar" → "G").
  const ar = name.ar.startsWith("ال") && [...name.ar].length > 2 ? name.ar.slice(2) : name.ar;
  const en = /^(El|Al) \S/.test(name.en) ? name.en.slice(3) : name.en;
  const initial = initialOf(L(ar, en));

  const header = lib("header-brand-bar", {
    text: {
      "م": initial,
      "اسم متجرك": name,
      "ابحث في المتجر": c.labels.search,
    },
  });

  const footer = lib("footer-signoff", {
    text: {
      "شكرًا لزيارتك": c.footer.line,
      "تواصل معنا على واتساب": x["footer-cta"]!,
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const city: LookContent["custom"][string] | undefined = x["reviews-city-1"];
  const home: Design[] = [
    lib("hero-poster", {
      photo: [undefined, undefined, c.photos.hero.wide],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "وصل حديثًا": x["hero-note"]!,
        "صورة الحملة": c.hero.alt,
        "مجموعة": x["hero-sticker-1"]!,
        "٢٠٢٦": x["hero-sticker-2"]!,
        "الجديدة": x["hero-sticker-3"]!,
        "الموسم الجديد وصل": c.hero.title,
        "قطع خفيفة بخامات طبيعية ومقاسات كاملة.": c.hero.line,
        "اكتشف المجموعة": c.hero.cta,
      },
      links: { "/products": main },
    }),
    lib("categories-circles", {
      text: { "ما الذي تبحث عنه؟": c.categories.title },
      // Six across by design; a store with another number of categories gets one full row of them (phones swipe).
      ...(tiles !== 6 && { nodes: { "الأقسام": { style: { columns: tiles }, tablet: { columns: tiles } } } }),
    }),
    lib("products-bento", {
      text: {
        "الأكثر طلبًا": c.products.primary.eyebrow,
        "منتجات يكثر الطلب عليها": c.products.primary.title,
      },
      links: { "/products": BEST },
    }),
    lib("pay-zones", {
      text: {
        "التوصيل": x["zones-eyebrow"]!,
        "نوصّل إلى كل مصر": x["zones-title"]!,
        "المدة والمصاريف حسب محافظتك.": x["zones-line"]!,
        "توصيل مجاني للطلبات فوق ١٬٥٠٠ ج.م": x["zones-note"]!,
        "القاهرة والجيزة": x["zone-1-name"]!,
        "١–٢ يوم": x["zone-1-time"]!,
        "٥٠ ج.م": x["zone-1-price"]!,
        "الإسكندرية والدلتا": x["zone-2-name"]!,
        "مدن القناة": x["zone-3-name"]!,
        "٢–٣ أيام": x["zone-3-time"]!,
        "٦٥ ج.م": x["zone-3-price"]!,
        "الصعيد": x["zone-4-name"]!,
        "٣–٥ أيام": x["zone-4-time"]!,
        "٨٠ ج.م": x["zone-4-price"]!,
        "البحر الأحمر وسيناء": x["zone-5-name"]!,
        "٤–٦ أيام": x["zone-5-time"]!,
        "٩٥ ج.م": x["zone-5-price"]!,
      },
    }),
    // v5 (2026-11-16, owner): every home has a real products grid; it shows what the main list does not.
    lib("products-grid", gridPatch(journey.primary)),
    ...(reviews && city
      ? [
          lib("testimonials-wall", {
            text: {
              "ماذا يقولون عنا": reviews.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": reviews.items[1]!.quote,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[2]!.quote,
              "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": reviews.items[3]!.quote,
              "أسعار معقولة وجودة أفضل مما توقعت.": reviews.items[4]!.quote,
              "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": reviews.items[5]!.quote,
              "المنصورة": city,
              "الإسكندرية": x["reviews-city-2"]!,
              "أسيوط": x["reviews-city-3"]!,
              "طنطا": x["reviews-city-4"]!,
            },
            links: { "/products": RATED },
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
      href: main,
    }),
  ];

  return {
    header,
    footer,
    pages: [
      { slug: "home", name: L("الرئيسية", "Home"), sections: home },
      { slug: "about", name: L(aboutName.ar, "About"), seo: { title: aboutName }, sections: about },
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
  description: L("قطعيات لحوم ودواجن طازجة.", "Fresh cuts of meat and poultry."),
  categories: [
    ["beef", "لحم بلدي", "Beef", PHOTOS.steakCut],
    ["grill", "مشويات", "Grill", PHOTOS.koftaGrill],
    ["boxes", "صناديق", "Boxes", PHOTOS.rawCuts],
    ["lamb", "ضاني", "Lamb", PHOTOS.lambChops],
    ["chicken", "دجاج", "Chicken", PHOTOS.chicken],
    ["sausage", "سجق ومصنعات", "Sausage & deli", PHOTOS.sausages],
  ],
  products: [
    ["family-meat-box", "boxes", "بوكس لحم العائلة ٥ كيلو", "Family Meat Box, 5 kg", PHOTOS.rawCuts, 2400, { isFeatured: true, rating: 4.8, sold90: 120 }],
    ["kofta-1kg", "grill", "كفتة ١ كيلو", "Kofta Mix, 1 kg", PHOTOS.koftaGrill, 420, { sold90: 210 }],
    ["minced-beef-1kg", "beef", "لحم مفروم ١ كيلو", "Minced Beef, 1 kg", PHOTOS.minced, 380, { sold90: 200 }],
    ["kofta-plate", "grill", "كفتة مشوية جاهزة", "Ready Grilled Kofta", PHOTOS.koftaPlate, 460, { compareAtPrice: 520, sold90: 190 }],
    ["rib-roast", "beef", "ريش بالعضم", "Bone-In Rib Roast", PHOTOS.ribRoast, 1350, { rating: 4.9, sold90: 44 }],
    ["steak-cut", "beef", "ستيك بلدي ١ كيلو", "Local Steak, 1 kg", PHOTOS.steakCut, 520, { sold90: 90 }],
    ["lamb-chops", "lamb", "ريش ضاني ١ كيلو", "Lamb Chops, 1 kg", PHOTOS.lambChops, 640, { sold90: 66 }],
    ["beef-sausage", "sausage", "سجق بلدي ١ كيلو", "Beef Sausage, 1 kg", PHOTOS.sausages, 340, { sold90: 110 }],
    ["pot-roast-box", "boxes", "بوكس الروستو", "Pot Roast Box", PHOTOS.potRoast, 900, { sold90: 38 }],
    ["grill-steak-box", "boxes", "بوكس الشوي", "Grill Box", PHOTOS.grilledSteak, 1500, { inStock: false, sold90: 30 }],
    ["marinated-chicken", "chicken", "دجاج متبل للشوي", "Marinated Chicken", PHOTOS.chicken, 260, { sold90: 80 }],
  ],
});

export const LAHMA = editionTemplate({
  key: LAHMA_KEY,
  version: 5,
  changelog: "Lahma v5: a products grid on the home",
  productPage: { thumbs: "bottom", band: "brand", extras: ["product-shipping"], copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("لحمة", "Lahma"),
  description: L(
    "جزارة وبوكسات لحوم: بوستر بوكسات العيد، قطعيات الأسبوع، توصيل مبرد وافتح قبل ما تدفع. أربع صفحات جاهزة.",
    "Butcher and meat boxes: Eid box poster, this week’s cuts, cold-chain delivery and open before you pay. Four ready pages.",
  ),
  category: "food",
  style: ["bold"],
  sortOrder: 710,
  palette: ["#faf7f3", "#efe6dc", "#f4c95d", "#9b1c1c"],
  colors: {
    primary: "#9b1c1c",
    secondary: "#efe6dc",
    background: "#ffffff",
    foreground: "#241510",
    muted: "#665247",
    border: "#e2d5c6",
    accent: "#f4c95d",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 6,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "nav.0.href",
    "hero",
    "categories.title",
    "products.primary.eyebrow",
    "products.primary.title",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.story",
    "custom.footer-cta",
    "custom.hero-note",
    "custom.hero-sticker-1",
    "custom.hero-sticker-2",
    "custom.hero-sticker-3",
    "custom.zones-eyebrow",
    "custom.zones-title",
    "custom.zones-line",
    "custom.zones-note",
    "custom.zone-1-name",
    "custom.zone-1-time",
    "custom.zone-1-price",
    "custom.zone-2-name",
    "custom.zone-3-name",
    "custom.zone-3-time",
    "custom.zone-3-price",
    "custom.zone-4-name",
    "custom.zone-4-time",
    "custom.zone-4-price",
    "custom.zone-5-name",
    "custom.zone-5-time",
    "custom.zone-5-price",
  ],
  // Buyer quotes are demo claims: a pack writes real ones (with four cities) or leaves them out (the section is then not built).
  // The bento block shows the design's own list, so `primary` is not read; no category rows.
  optional: ["reviews", "custom.reviews-city-1", "custom.reviews-city-2", "custom.reviews-city-3", "custom.reviews-city-4"],
  journey: { primary: "best-sellers", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
