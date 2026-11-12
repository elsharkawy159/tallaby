/**
 * Zay (template 50, men’s essentials; Claude Design "Storefront Templates"):
 * cool grey paper, near-black ink, a navy for actions and a periwinkle
 * highlight, Readex Pro throughout and sharp 4px corners. A basics shop
 * (v3): the weekday kit as a three-photo collage, the categories in big
 * type, this week’s shelf, why Zay, the reorders and WhatsApp reviews. Built
 * from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): tees and shirts on rails
 * and hangers, folded knits, a suit jacket on a wall hook, a shirt shelf and
 * a leather work bag. No people, no hands, no mannequins and no logos (the
 * design's photos of models were all replaced).
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Zay Men itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays 3.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";
import { templatePreview } from "../preview";

export const ZAY_KEY = "zay";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(ZAY_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

const PHOTOS = {
  teeRail: pexels(39277919, 900),
  threeTees: pexels(18199559, 900),
  foldedKnits: pexels(30569741, 900),
  beanie: pexels(30263573, 900),
  workBag: pexels(10919291, 900),
  overshirt: pexels(5424909, 900),
  plaidRail: pexels(39176732, 900),
  poplinRail: pexels(7755387, 900),
  suitJacket: pexels(37524688, 900),
  dressShirt: pexels(1682699, 900),
  shirtShelf: pexels(29765480),
};

const NAME = L("زي مِن", "Zay Men");

/**
 * Zay Men's own content: what the look is built with when no edition is
 * applied (the template `zay` has always meant). The store name and
 * description and the category photos come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header's search placeholder.
  labels: { search: L("ابحث عن تيشيرت، قميص، تريكو…", "Search tees, shirts, knitwear…") },
  // The footer's large sign-off line: two to four words.
  footer: { line: L("البس ببساطة", "Dress simple") },
  // The collage hero has no single photo: its three photos and their captions are `hero-piece-1..3` below.
  hero: {
    eyebrow: L("طقم الأسبوع", "The weekday kit"),
    title: L("٣ قطع تكفي أسبوعك", "Three pieces, your whole week"),
    line: L("قطن مصري تقيل وقصّات مظبوطة، كل قطعة بتتلبس مع التانية.", "Heavy Egyptian cotton and fits that work: every piece goes with the others."),
    // The button goes to the newest products.
    cta: L("تسوق الأساسيات", "Shop the basics"),
  },
  // The shelf's title, over its tabs (new, best sellers, top rated).
  products: { primary: { title: L("الأسبوع ده", "This week") } },
  // The carousel of best sellers: its title.
  rows: [{ title: L("بيرجعوا يطلبوه", "The ones they reorder") }],
  // Optional, with `custom.reviews-reply` (all three messages, or leave `reviews` out). Three WhatsApp-style messages from buyers, each with a name; the store answers the first one (`custom.reviews-reply`).
  reviews: {
    title: L("من واتساب", "From WhatsApp"),
    items: [
      {
        quote: L(
          "التيشيرت التقيل ده أحسن حاجة اشتريتها السنة دي. اتغسل عشر مرات ولسه زي ما هو.",
          "This heavy tee is the best thing I bought this year. Ten washes and it still holds its shape.",
        ),
        name: L("أحمد س.", "Ahmed S."),
      },
      {
        quote: L("طلبت الفيت السليم وطلع ضيق، بدّلته بالريجيولار ببلاش في يومين.", "Ordered the slim fit and it was tight; swapped it for regular for free in two days."),
        name: L("مصطفى ع.", "Mostafa A."),
      },
      { quote: L("خدت طقم الشغل كله، والأوفرشيرت شكله غالي جداً.", "Took the whole weekday kit; the overshirt looks expensive."), name: L("كريم ن.", "Karim N.") },
    ],
  },
  about: {
    line: L("زي مِن أساسيات رجالي مظبوطة، بـ٣ قصّات.", "Zay Men makes men’s basics that fit, in three cuts."),
    alt: L("قمصان متطبقة على رفوف خشب", "Folded shirts on wooden shelves"),
    eyebrow: L("من ٢٠٢١", "Since 2021"),
    title: L("أساسيات، بس مظبوطة", "Basics, done properly"),
    text: L("كل قطعة بـ٣ قصّات: سليم وريجيولار وواسع، عشان تلاقي مقاسك من أول مرة.", "Every piece comes in three fits, slim, regular and relaxed, so you find your size first time."),
    more: L("قطن مصري ٢٤٠ جرام، متقصوص ومتخيط في المحلة.", "240 g Egyptian cotton, cut and sewn in El Mahalla."),
    // The button goes to the whole catalog.
    cta: L("تسوق الأساسيات", "Shop the basics"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("كل يوم من ١٢ الضهر لـ ١٠ بالليل، على الإيميل أو واتساب.", "Every day, 12 pm to 10 pm, by email or WhatsApp."),
    heading: L("اسأل عن مقاس أو قصّة", "Ask about a size or fit"),
  },
  faq: {
    line: L("القصّات والمقاسات والتوصيل.", "Fits, sizes and delivery."),
    question: L("أختار أنهي قصّة؟", "Which fit should I pick?"),
    answer: L("السليم على الجسم، والريجيولار مريح، والواسع أوفر سايز. جدول المقاسات في صفحة كل منتج.", "Slim sits close, regular is easy and relaxed is oversized. Each product page has the size chart."),
  },
  custom: {
    // The store's short name, as it reads inside a sentence: "About Zay", "Why Zay?", and the store's column in the comparison.
    "store-short": L("زي", "Zay"),
    // The hero's three captions, numbered 01 to 03 under the photos `hero-piece-1..3`: a product type each, one or two words.
    "hero-piece-1": L("تيشيرت تقيل", "Heavy tee"),
    "hero-piece-2": L("تريكو", "Knitwear"),
    "hero-piece-3": L("أوفرشيرت", "Overshirt"),
    // The first three of the comparison's five rows (the last two are the library's: cash on delivery, WhatsApp reply in minutes).
    // Rows 1 and 3 are ticked for the store only: what other shops do not offer. Row 2 is ticked for both.
    "compare-row-1": L("قطن مصري ٢٤٠ جرام", "Egyptian cotton, 240 g"),
    "compare-row-2": L("تبديل مقاس ببلاش", "Free size exchange"),
    "compare-row-3": L("٣ قصّات في كل مقاس", "Three fits in every size"),
    // Optional, with `reviews`: the store's short answer under the first buyer message.
    "reviews-reply": L("ده يسعدنا جداً، شكراً يا أحمد!", "So happy to hear that, thanks Ahmed!"),
  },
  photos: {
    // The about page's photo (the look has no story block on its home page).
    story: PHOTOS.shirtShelf,
    // The hero's collage: three different products, one per caption. 1: portrait 4:5 (the largest); 2: square; 3: landscape 4:3.
    custom: {
      "hero-piece-1": pexels(18199559, 1200),
      "hero-piece-2": PHOTOS.foldedKnits,
      "hero-piece-3": pexels(5424909, 1400),
    },
  },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade or the demo store is a slot of `c`;
 * generic shop labels (Top rated, Reviews) and the layout stay here.
 */
function look(c: LookContent, _journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const short = x["store-short"]!;
  const aboutName = L(`عن ${short.ar}`, `About ${short.en}`);
  // Optional, together: a pack without buyer messages (or without the store's reply) gets the home page without the chat section.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const reply: LookContent["custom"][string] | undefined = x["reviews-reply"];

  const header = lib("header-chips", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "ابحث عن منتج…": c.labels.search,
    },
  });

  const footer = lib("footer-signoff", {
    text: {
      "شكرًا إنك عدّيت علينا": c.footer.line,
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": aboutName,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  const home: Design[] = [
    lib("hero-collage", {
      photo: [c.photos.custom["hero-piece-1"]!, c.photos.custom["hero-piece-2"]!, c.photos.custom["hero-piece-3"]!],
      text: {
        "حكاية الموسم": c.hero.eyebrow,
        "٣ قطع تكفي أسبوعًا كاملًا": c.hero.title,
        "نسّقها معًا أو مع ما تملكه بالفعل، وكل قطعة متاحة بأكثر من لون.": c.hero.line,
        "تسوّق اللوك": c.hero.cta,
        "القطعة الأولى": x["hero-piece-1"]!,
        "القطعة الثانية": x["hero-piece-2"]!,
        "القطعة الثالثة": x["hero-piece-3"]!,
      },
      links: { "/products": NEW },
    }),
    lib("categories-big-type"),
    lib("products-shelf", {
      text: {
        "تسوّق حسب مزاجك": c.products.primary.title,
        "عليه خصم": L("الأعلى تقييماً", "Top rated"),
      },
      links: { "/products": [NEW, BEST, RATED, SHOP] },
    }),
    lib("features-compare", {
      text: {
        "إحنا ولا غيرنا؟": L(`ليه ${short.ar}؟`, `Why ${short.en}?`),
        "متجرنا": short,
        "منتجات أصلية بفاتورة": x["compare-row-1"]!,
        "ضمان محلي": x["compare-row-2"]!,
        "استرجاع خلال ١٤ يوم": x["compare-row-3"]!,
      },
    }),
    lib("products-carousel", {
      text: { "الأكثر مبيعاً": c.rows[0]!.title },
      links: { "/products": BEST },
    }),
    ...(reviews && reply
      ? [
          lib("testimonials-chat", {
            text: {
              "من الواتساب": L("الآراء", "Reviews"),
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
      href: SHOP,
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
  description: L("أساسيات مظبوطة، بـ٣ قصّات.", "Basics that fit, in three cuts."),
  categories: [
    ["tees", "تيشيرتات", "Tees", PHOTOS.threeTees],
    ["shirts", "قمصان وأوفرشيرت", "Shirts & overshirts", PHOTOS.plaidRail],
    ["knit", "تريكو", "Knitwear", PHOTOS.foldedKnits],
    ["bags", "شنط", "Bags", PHOTOS.workBag],
    ["overshirts", "أوفرشيرت", "Overshirts", PHOTOS.overshirt],
    ["tailoring", "بدل وجواكت", "Tailoring", PHOTOS.suitJacket],
    ["formal", "قمصان رسمي", "Dress shirts", PHOTOS.dressShirt],
    ["accessories", "إكسسوارات", "Accessories", PHOTOS.beanie],
  ],
  products: [
    ["heavy-cotton-tee", "tees", "تيشيرت قطن تقيل", "Heavy Cotton Tee", PHOTOS.teeRail, 450, { isFeatured: true, rating: 4.8, sold90: 320 }],
    ["merino-crew-knit", "knit", "بلوفر ميرينو", "Merino Crew Knit", PHOTOS.foldedKnits, 990, { sold90: 44 }],
    ["leather-work-bag", "bags", "شنطة شغل جلد", "Leather Work Bag", PHOTOS.workBag, 2100, { rating: 4.8, sold90: 62 }],
    ["tee-three-pack", "tees", "٣ تيشيرتات", "Tee Three-Pack", PHOTOS.threeTees, 1150, { compareAtPrice: 1350, sold90: 88 }],
    ["sand-overshirt", "overshirts", "أوفرشيرت رملي", "Sand Overshirt", PHOTOS.overshirt, 1990, { rating: 4.7, sold90: 110 }],
    ["plaid-flannel-shirt", "shirts", "قميص فلانيل كاروهات", "Plaid Flannel Shirt", PHOTOS.plaidRail, 1290, { sold90: 52 }],
    ["poplin-shirt", "shirts", "قميص بوبلين", "Poplin Shirt", PHOTOS.poplinRail, 990, { sold90: 70 }],
    ["unlined-suit-jacket", "tailoring", "جاكت بدلة من غير بطانة", "Unlined Suit Jacket", PHOTOS.suitJacket, 2900, { sold90: 21 }],
    ["salmon-dress-shirt", "formal", "قميص سلمون", "Salmon Dress Shirt", PHOTOS.dressShirt, 1150, { compareAtPrice: 1350, sold90: 30 }],
    ["rib-beanie", "accessories", "طاقية تريكو مقلّمة", "Striped Rib Beanie", PHOTOS.beanie, 350, { inStock: false, sold90: 18 }],
  ],
});

export const ZAY = editionTemplate({
  // Gallery card screenshots of the home with its niche pack (owner, 2026-11-12; apps/ecommerce/public/template-previews).
  preview: templatePreview(ZAY_KEY, "menswear", { ar: 2100, en: 2140 }),
  key: ZAY_KEY,
  version: 3,
  changelog: "Zay v3: new hero, categories, section order",
  productPage: { thumbs: "side", band: "brand", extras: ["product-perks"], copy: { reviews: L("اللي جرّبوه على واتساب", "Tried and reviewed on WhatsApp"), related: L("كمّل أسبوعك", "Complete your week") } },
  name: L("زي", "Zay"),
  description: L(
    "أساسيات رجالي: طقم الأسبوع، الأقسام، رف الأسبوع، المقارنة، اللي بيرجعوا يطلبوه وآراء واتساب. أربع صفحات جاهزة.",
    "Men’s essentials: the weekday kit, categories, this week’s shelf, a comparison, the reorders and WhatsApp reviews. Four ready pages.",
  ),
  category: "fashion",
  style: ["minimal", "classic"],
  sortOrder: 500,
  palette: ["#f3f4f6", "#e5e7eb", "#c7d2fe", "#1f3a5f"],
  colors: {
    primary: "#1f3a5f",
    secondary: "#e5e7eb",
    background: "#ffffff",
    foreground: "#111827",
    muted: "#4b5563",
    border: "#d1d5db",
    accent: "#c7d2fe",
  },
  fonts: { heading: "Readex Pro", body: "Readex Pro" },
  radius: 4,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "footer.line",
    "custom.store-short",
    "hero.eyebrow",
    "hero.title",
    "hero.line",
    "hero.cta",
    "custom.hero-piece-1",
    "custom.hero-piece-2",
    "custom.hero-piece-3",
    "photos.custom.hero-piece-1",
    "photos.custom.hero-piece-2",
    "photos.custom.hero-piece-3",
    "products.primary.title",
    "custom.compare-row-1",
    "custom.compare-row-2",
    "custom.compare-row-3",
    "rows.0.title",
    "about",
    "contact",
    "faq",
    "photos.story",
  ],
  // The chat of three buyer messages and the store's reply, together: without either the section is not built (the home then ends on the carousel).
  optional: ["reviews", "custom.reviews-reply"],
  // The shelf has its own tabs (new, best sellers, top rated), so `primary` is not read; the look has no category rows.
  journey: { primary: "newest", rows: [] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
