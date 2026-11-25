/**
 * Loaf (template 19, sourdough bakery and subscriptions; Claude Design
 * "Storefront Templates"): warm flour paper, a dark crust brown for
 * actions and a golden highlight, Lalezar display type over Tajawal and
 * round 24px corners. A bakery that sells a weekly loaf: bread on a big
 * word, flour-water-salt, today's shelf, the subscription, regulars and
 * FAQs. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-20): sourdough loaves,
 * croissants and buns. No people, hands or brand marks.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Loaf & Co. itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const LOAF_KEY = "loaf";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(LOAF_KEY, getDesign(id)!, { corners: 24, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  sourdough: pexels(30890566, 900),
  sourdoughWide: pexels(30890566, 1600),
  scored: pexels(27418961, 900),
  rustic: pexels(28354523, 900),
  loavesBuns: pexels(8633662, 900),
  croissants: pexels(20002837, 900),
  croissantCoffee: pexels(34800842, 900),
  briocheBoard: pexels(20200307, 900),
  sesameBuns: pexels(38433899, 900),
};

const NAME = L("لوف آند كو", "Loaf & Co.");

/**
 * Loaf & Co.'s own content: what the look is built with when no edition is
 * applied (the template `loaf` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The big-word hero: `title` is the one big word (the trade), `cta` the button under the first featured product.
  hero: { title: L("خبز", "BREAD"), cta: L("اطلب الرغيف", "Order the loaf") },
  categories: { title: L("من الفرن", "Out of the oven") },
  // The shelf's title over its tabs (new, `custom.shelf-best-label` for the best sellers, top rated).
  products: { primary: { title: L("مخبوزات طازجة", "Fresh bakes") } },
  // The photo-and-checklist block: an eyebrow, a title, a text, four points (`custom.story-point-1..4`) and a button to the catalog.
  story: {
    alt: L("رغيف ساوردو على كتان", "Sourdough on linen"),
    eyebrow: L("الاشتراكات", "Subscriptions"),
    title: L("اشتراك الخبز الأسبوعي", "The weekly bread subscription"),
    text: L("اختر رغيفك المفضل واشترك فيه أسبوعيًا.", "Choose your favourite loaf and subscribe weekly."),
    cta: L("اشترك", "Subscribe"),
  },
  // Optional, with `custom.reviews-city-1..6`: a wall of six buyer quotes with names under a title. Without them the home page goes from the note to the questions.
  reviews: {
    title: L("آراء العملاء", "Customer reviews"),
    items: [
      { quote: L("خبز الساوردو بقشرة مقرمشة ولب طري.", "The sourdough has a crisp crust and a soft crumb."), name: L("هبة م.", "Heba M.") },
      { quote: L("الكرواسون هش وبطعم الزبدة.", "The croissants are flaky and buttery."), name: L("عمرو س.", "Amr S.") },
      { quote: L("خبز الشوفان بطعم ممتاز.", "The rye loaf tastes great."), name: L("داليا ك.", "Dalia K.") },
      { quote: L("الرغيف الريفي طازج ورائحته جميلة.", "The rustic loaf is fresh and smells lovely."), name: L("نهى ر.", "Noha R.") },
      { quote: L("البريوش طري جدًا.", "The brioche is very soft."), name: L("مي ح.", "Mai H.") },
      { quote: L("خبز السمسم مناسب للإفطار.", "The sesame buns are good for breakfast."), name: L("طارق ع.", "Tarek A.") },
    ],
  },
  // The footer's sign-up: a title and one line.
  newsletter: { title: L("أخبار المخبز مرة في الأسبوع", "Bakery news, once a week"), line: L("الأرغفة الجديدة وقائمة مخبوزات نهاية الأسبوع.", "New loaves and the weekend pastry list.") },
  about: {
    line: L("مخبز ساوردو ومخبوزات طازجة.", "A sourdough bakery with fresh pastries."),
    alt: L("أرغفة ساوردو وخبز طازج", "Sourdough loaves and fresh rolls"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("خبز مخمّر ببطء", "Slowly fermented bread"),
    text: L("نخمّر العجين ببطء ونخبز الأرغفة والمخبوزات بمكونات بسيطة.", "We ferment slowly and bake loaves and pastries with simple ingredients."),
    more: L("تجد مكونات كل منتج في صفحته.", "Every product's ingredients are on its page."),
    // Goes to the whole catalog.
    cta: L("اطلب الآن", "Order now"),
  },
  contact: {
    title: L("تواصل", "Contact"),
    line: L("٥ شارع بغداد، الكوربة، مصر الجديدة.", "5 Baghdad St, Korba, Heliopolis."),
    heading: L("اسأل عن اشتراك أو طلب كبير", "Ask about a subscription or a large order"),
  },
  // The FAQ page shows its header line and the numbered questions of the design (`question` and `answer` are not shown).
  faq: { line: L("الاشتراكات والطلب والخبز.", "Subscriptions, ordering and bread.") },
  custom: {
    // The header's line under the store name, a few words.
    tagline: L("خبز ساوردو ومخبوزات", "Sourdough and pastries"),
    // The header's link to the best sellers, and the about page's name (header, footer, page title).
    "best-label": L("الأكثر طلبًا", "Most ordered"),
    "about-label": L("المخبز", "The bakery"),
    // The shelf's best-sellers tab, one word.
    "shelf-best-label": L("الخبز", "Bread"),
    // The checklist's four points, three to five words each.
    "story-point-1": L("خبز ومخبوزات طازجة", "Fresh bread and pastries"),
    "story-point-2": L("مكونات واضحة لكل منتج", "Clear ingredients for every product"),
    "story-point-3": L("أوزان وأسعار واضحة", "Clear weights and prices"),
    "story-point-4": L("تواصل معنا لأي سؤال", "Contact us with any question"),
    // The centred note: an eyebrow, a title and a text.
    "note-eyebrow": L("من المخبز", "From the bakery"),
    "note-title": L("دقيق وماء وملح", "Flour, water and salt"),
    "note-text": L(
      "مكونات بسيطة وتخمير بطيء لكل رغيف.",
      "Simple ingredients and a slow ferment for every loaf.",
    ),
    // The home page's two questions, each a short question and a one-line answer.
    "faq-1-question": L("كم يستغرق التوصيل؟", "How long does delivery take?"),
    "faq-1-answer": L("تظهر تكلفة الشحن ومدته عند إتمام الطلب.", "Shipping cost and time are shown at checkout."),
    "faq-2-question": L("كيف أوقف الاشتراك؟", "How do I pause my subscription?"),
    "faq-2-answer": L("تواصل معنا قبل موعد الطلب التالي لإيقاف الاشتراك.", "Contact us before your next order to pause it."),
    // With `reviews`: each quote's city.
    "reviews-city-1": L("مصر الجديدة", "Heliopolis"),
    "reviews-city-2": L("مدينة نصر", "Nasr City"),
    "reviews-city-3": L("القاهرة", "Cairo"),
    "reviews-city-4": L("الكوربة", "Korba"),
    "reviews-city-5": L("مصر الجديدة", "Heliopolis"),
    "reviews-city-6": L("الكوربة", "Korba"),
  },
  // story: the checklist block's photo; about: the about page (it falls back to the story's).
  photos: { story: PHOTOS.scored, about: PHOTOS.loavesBuns },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Order, FAQ, New, Top rated, Order now, Good to know) and the layout stay
 * here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const aboutLabel = x["about-label"]!;
  const tiles = c.photos.tiles.length;

  const header = lib("header-centered", {
    text: {
      "المتجر": L("اطلب", "Order"),
      "العروض": x["best-label"]!,
      "اسم متجرك": name,
      "مختارات بعناية": x.tagline!,
      "المدونة": L("الأسئلة", "FAQ"),
      "من نحن": aboutLabel,
    },
    links: { "/products": [SHOP, BEST, undefined, SHOP, BEST], "/blog": "/faq" },
  });

  const footer = lib("footer-signup", {
    text: {
      "اشترك في النشرة": c.newsletter.title,
      "منتجات جديدة وأخبار المتجر.": c.newsletter.line,
      "م": initialOf(name),
      "اسم متجرك": name,
      // A name that ends with a full stop ("Loaf & Co.") keeps one.
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(L(name.ar, name.en.replace(/\.$/, ""))),
      "العروض": L("الأعلى تقييماً", "Top rated"),
      "من نحن": aboutLabel,
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const city: LookContent["custom"][string] | undefined = x["reviews-city-1"];
  const r = reviews?.items;
  const home: Design[] = [
    lib("hero-big-word", { text: { "جديد": c.hero.title, "اطلبها": c.hero.cta } }),
    lib("categories-circles", {
      text: { "ما الذي تبحث عنه؟": c.categories.title },
      // Six across by design; a store with another number of categories gets one full row of them (phones swipe).
      ...(tiles !== 6 && { nodes: { "الأقسام": { style: { columns: tiles }, tablet: { columns: tiles } } } }),
    }),
    lib("products-shelf", {
      text: {
        "تسوّق حسب اختيارك": c.products.primary.title,
        "وصل جديد": L("جديد", "New"),
        "الأكثر مبيعًا": x["shelf-best-label"]!,
        "عليه خصم": L("الأعلى تقييماً", "Top rated"),
      },
      links: { "/products": [NEW, BEST, RATED, SHOP] },
    }),
    lib("features-checklist", {
      person: [undefined, undefined, undefined, undefined, undefined, c.photos.story],
      text: {
        "فريق يجهز الطلبات": c.story.alt,
        "كيف نعمل": c.story.eyebrow,
        "كل التفاصيل قبل أن تطلب": c.story.title,
        "نعرض صور كل منتج ومواصفاته وسعره بوضوح، لتطلب وأنت مطمئن.": c.story.text,
        "صور واضحة لكل منتج": x["story-point-1"]!,
        "مواصفات ومقاسات مفصّلة": x["story-point-2"]!,
        "أسعار واضحة على كل منتج": x["story-point-3"]!,
        "تواصل معنا لأي سؤال": x["story-point-4"]!,
        "اعرف أكثر": c.story.cta,
      },
      links: { "/about": SHOP },
    }),
    lib("text-centered", {
      text: {
        "ملاحظة": x["note-eyebrow"]!,
        "مواعيد شهر رمضان": x["note-title"]!,
        "طوال الشهر نعمل من ٨ مساءً حتى ٢ صباحًا، والطلبات عبر الإنترنت مستمرة كالمعتاد.": x["note-text"]!,
        "تسوّق الآن": L("اطلب الآن", "Order now"),
      },
    }),
    // v6 (2026-11-25, owner): every home has products by category in a swipe row: the store's category at `journey.rows[0]`.
    // 2 across: the demo's category holds 2 (one full row, the row rule); a store's own category fills the swipe.
    lib("products-category-carousel", { lists: [{ offset: journey.rows[0]! - 1 }, { categoryIndex: journey.rows[0]!, limit: 2 }], nodes: { "منتجات القسم": { style: { columns: 2 }, tablet: { columns: 2 } } } }),
    ...(r && city
      ? [
          lib("testimonials-wall", {
            text: {
              "ماذا يقولون عنا": reviews!.title,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": r[0]!.quote,
              "م": initialOf(r[0]!.name),
              "مريم أ.": r[0]!.name,
              "القاهرة": city,
              "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": r[1]!.quote,
              "ي": initialOf(r[1]!.name),
              "يوسف م.": r[1]!.name,
              "المنصورة": x["reviews-city-2"]!,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": r[2]!.quote,
              "ع": initialOf(r[2]!.name),
              "عمر ك.": r[2]!.name,
              "الإسكندرية": x["reviews-city-3"]!,
              "وصل إلى أسيوط في ٣ أيام، وهذا لم أكن أتوقعه.": r[3]!.quote,
              "س": initialOf(r[3]!.name),
              "سلمى ر.": r[3]!.name,
              "أسيوط": x["reviews-city-4"]!,
              "أسعار معقولة وجودة أفضل مما توقعت.": r[4]!.quote,
              "ن": initialOf(r[4]!.name),
              "نور ح.": r[4]!.name,
              "الجيزة": x["reviews-city-5"]!,
              "خدمة العملاء محترمة جدًا وساعدوني في اختيار المنتج المناسب.": r[5]!.quote,
              "ك": initialOf(r[5]!.name),
              "كريم ع.": r[5]!.name,
              "طنطا": x["reviews-city-6"]!,
              "كل الآراء": L("اطلب الآن", "Order now"),
            },
            links: { "/products": SHOP },
          }),
        ]
      : []),
    lib("faq-columns", {
      as: "home-faq",
      text: {
        "أسئلة شائعة": L("معلومات تهمك", "Good to know"),
        "كم يستغرق التوصيل؟": x["faq-1-question"]!,
        "تظهر تكلفة الشحن ومدته عند إتمام الطلب.": x["faq-1-answer"]!,
        "ما سياسة الاسترجاع؟": x["faq-2-question"]!,
        "راجع سياسة الاستبدال والاسترجاع في صفحة السياسات.": x["faq-2-answer"]!,
      },
    }),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutLabel, c.about.line),
    aboutStory(lib, {
      photo: c.photos.about ?? c.photos.story,
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
      { slug: "about", name: aboutLabel, seo: { title: aboutLabel }, sections: about },
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
        sections: [pageHeader(lib, "faq-header", L("الأسئلة الشائعة", "FAQ"), c.faq.line), lib("faq-numbered", {})],
      },
    ],
  };
}

const DEMO = demoStore({
  name: NAME,
  description: L("خبز ساوردو ومخبوزات طازجة.", "Sourdough bread and fresh pastries."),
  categories: [
    ["bread", "خبز", "Bread", PHOTOS.rustic],
    ["pastry", "مخبوزات", "Pastry", PHOTOS.croissants],
    ["buns", "بريوش وخبز صغير", "Brioche & rolls", PHOTOS.sesameBuns],
    ["sourdough", "ساوردو", "Sourdough", PHOTOS.sourdough],
    ["subscriptions", "اشتراكات", "Subscriptions", PHOTOS.loavesBuns],
    ["breakfast", "إفطار", "Breakfast", PHOTOS.croissantCoffee],
  ],
  products: [
    // The first featured product fills hero-big-word: a wide landscape photo (template-rules, owner 2026-10-27).
    ["country-sourdough", "sourdough", "ساوردو بلدي", "Country Sourdough", PHOTOS.sourdoughWide, 120, { isFeatured: true, rating: 4.9, sold90: 640 }],
    ["scored-wheat-loaf", "bread", "رغيف قمح منقوش", "Scored Wheat Loaf", PHOTOS.scored, 140, { sold90: 60 }],
    ["rustic-white", "bread", "رغيف أبيض ريفي", "Rustic White Loaf", PHOTOS.rustic, 110, { sold90: 150 }],
    ["weekly-loaf-subscription", "subscriptions", "اشتراك رغيف أسبوعي", "Weekly Loaf Subscription", PHOTOS.loavesBuns, 380, { isFeatured: true, sold90: 110 }],
    ["butter-croissant", "pastry", "كرواسون زبدة", "Butter Croissant", PHOTOS.croissants, 45, { rating: 4.9, sold90: 520 }],
    ["croissant-breakfast", "breakfast", "إفطار كرواسون وقهوة", "Croissant Breakfast", PHOTOS.croissantCoffee, 95, { sold90: 90 }],
    ["brioche-box", "buns", "علبة بريوش", "Brioche Box", PHOTOS.briocheBoard, 180, { compareAtPrice: 210, sold90: 90 }],
    ["sesame-buns", "buns", "خبز سمسم", "Sesame Buns, 6", PHOTOS.sesameBuns, 75, { inStock: false, sold90: 70 }],
  ],
});

export const LOAF = editionTemplate({
  key: LOAF_KEY,
  version: 6,
  changelog: "Loaf v6: products by category in a swipe row on the home",
  name: L("لوف", "Loaf"),
  description: L(
    "مخبز واشتراكات ساوردو: كلمة كبيرة، رف طازة النهارده واشتراك أسبوعي. أربع صفحات جاهزة.",
    "Sourdough bakery and subscriptions: a big word, today’s shelf and a weekly loaf. Four ready pages.",
  ),
  category: "food",
  style: ["warm", "bold"],
  sortOrder: 190,
  palette: ["#fff6ea", "#f4e3c8", "#f2b44a", "#3b2416"],
  colors: {
    primary: "#3b2416",
    secondary: "#f4e3c8",
    background: "#ffffff",
    foreground: "#3b2416",
    muted: "#6e5847",
    border: "#ecd8bb",
    accent: "#f2b44a",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 24,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "hero.title",
    "hero.cta",
    "categories.title",
    "products.primary.title",
    "story",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq.line",
    "photos.story",
    "custom.tagline",
    "custom.best-label",
    "custom.about-label",
    "custom.shelf-best-label",
    "custom.story-point-1",
    "custom.story-point-2",
    "custom.story-point-3",
    "custom.story-point-4",
    "custom.note-eyebrow",
    "custom.note-title",
    "custom.note-text",
    "custom.faq-1-question",
    "custom.faq-1-answer",
    "custom.faq-2-question",
    "custom.faq-2-answer",
  ],
  // Buyer quotes are demo claims: a pack writes real ones (with six cities) or leaves them out (the section is then not built); `photos.about` falls back to the story's.
  // The shelf has its own tabs, so `primary` is not read; one category carousel, of the store's 1st category (an edition can pick another).
  optional: ["reviews", "photos.about", "custom.reviews-city-1", "custom.reviews-city-2", "custom.reviews-city-3", "custom.reviews-city-4", "custom.reviews-city-5", "custom.reviews-city-6"],
  journey: { primary: "newest", rows: [1] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: { surface: "shelf", thumbs: "bottom", band: "brand", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
});
