/**
 * Barber (template 64, men's grooming; Claude Design "Storefront
 * Templates"): stone paper, a deep barbershop green for actions and a brass
 * gold highlight, Changa headings over Cairo and tight 4px corners. A Dokki
 * barbershop that also sells its oils: a split-screen welcome, the chair
 * price menu, book your chair, the beard kit, who is cutting and WhatsApp
 * reviews. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-21): empty barbershop
 * interiors, amber beard oil bottles, a balm jar, razors, brushes and combs
 * on plain surfaces. No people, no hands and no brand labels. The team grid
 * uses initials, not photos.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Maktab Barber itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays as it was.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, initialOf, primaryHref, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, pexels } from "../library-template";

export const BARBER_KEY = "barber";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BARBER_KEY, getDesign(id)!, { corners: 4, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const PHOTOS = {
  shopHero: pexels(20785318),
  shopAbout: pexels(1895701),
  cedarOil: pexels(6694147, 900),
  sandalOil: pexels(8709583, 900),
  beardBalm: pexels(27544670, 900),
  shavingSoap: pexels(995300, 900),
  safetyRazor: pexels(15088735, 900),
  brushStand: pexels(9201296, 900),
  aftershave: pexels(8789597, 900),
  beardComb: pexels(15694772, 900),
  razorComb: pexels(9456811, 900),
  barberKit: pexels(36305681, 900),
};

const NAME = L("مكتب الحلّاق", "Maktab Barber");

/**
 * Maktab Barber's own content: what the look is built with when no edition
 * is applied (the template `barber` has always meant). The store name and
 * description and the category tiles come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The header search placeholder: three things a buyer types.
  labels: { search: L("ابحث عن زيت لحية، موس، طقم…", "Search beard oil, razors, kits…") },
  // The split hero: its first button goes to the whole catalog, the second (`custom.hero-cta-2`) to the contact page.
  hero: {
    alt: L("كراسي حلاقة جلدية في صالون", "Leather barber chairs in a barbershop"),
    eyebrow: L("أدوات الحلاقة", "Shaving tools"),
    title: L("أدوات الحلاقة والعناية للرجال", "Shaving and grooming tools for men"),
    line: L("زيوت لحية وأمواس وفرش وأطقم حلاقة.", "Beard oils, razors, brushes and shaving kits."),
    cta: L("تسوق العناية", "Shop grooming"),
  },
  categories: { title: L("اللحية أم الحلاقة؟", "Beard or shave?") },
  // A grid of what `journey.primary` shows: the title must say the same.
  products: {
    primary: {
      title: L("منتجات العناية", "Grooming products"),
      line: L("زيوت وبلسم وأدوات حلاقة مختارة.", "Chosen oils, balms and shaving tools."),
    },
  },
  // Optional, with `custom.reviews-reply` (all three messages, or leave `reviews` out). Three WhatsApp-style messages, each with a name; the store answers the first one.
  reviews: {
    title: L("آراء العملاء", "Customer reviews"),
    items: [
      {
        quote: L("رائحة زيت السيدار خفيفة واستخدامه سهل.", "The cedar oil has a light scent and is easy to use."),
        name: L("أحمد س.", "Ahmed S."),
      },
      {
        quote: L("فرشاة الحلاقة متينة وخاماتها جيدة.", "The shaving brush is sturdy and well made."),
        name: L("كريم م.", "Karim M."),
      },
      {
        quote: L("الطقم كامل ومرتب في علبته.", "The kit is complete and neatly boxed."),
        name: L("مصطفى ع.", "Mostafa A."),
      },
    ],
  },
  // The footer's sign-off line (two or three words).
  footer: { line: L("أدوات حلاقة وعناية للرجال", "Shaving and grooming for men") },
  about: {
    line: L("منتجات الحلاقة والعناية باللحية والشعر.", "Shaving, beard and hair care products."),
    alt: L("كرسي حلاقة بجانب جدار من الطوب ونباتات", "A barber chair beside a brick wall and plants"),
    eyebrow: L("من نحن", "About us"),
    title: L("أدوات حلاقة مختارة بعناية", "Shaving tools chosen with care"),
    text: L("نقدّم زيوت اللحية وصابون الحلاقة والأمواس والفرش، ونختار كل منتج بعناية.", "We offer beard oils, shaving soap, razors and brushes, each chosen with care."),
    more: L("وفي كل صفحة منتج المكونات وطريقة الاستخدام.", "Every product page lists the ingredients and how to use it."),
    // Goes to the whole catalog.
    cta: L("تسوق العناية", "Shop grooming"),
  },
  contact: {
    title: L("تواصل معنا", "Contact us"),
    line: L("١٢ شارع مصدق، الدقي، الجيزة.", "12 Mosadak St, Dokki, Giza."),
    heading: L("لأي سؤال، تواصل معنا", "Questions? Contact us"),
  },
  faq: {
    line: L("المنتجات والاستخدام والطلبات.", "Products, use and orders."),
    question: L("كيف أختار زيت اللحية المناسب؟", "How do I choose a beard oil?"),
    answer: L("اقرأ وصف كل زيت ورائحته في صفحة المنتج، وتواصل معنا لأي سؤال.", "Read each oil's description and scent on its product page, and contact us with any question."),
  },
  custom: {
    // The store's short name inside "About …" (the about page).
    "store-short": L("مكتب", "Maktab"),
    // The hero's second button (it goes to the contact page) and the footer's sign-off button (WhatsApp), two or three words each.
    "hero-cta-2": L("تواصل معنا", "Contact us"),
    "footer-cta": L("راسلنا", "Message us"),
    // The price menu: a title and a line, then three groups (3, 2 and 2 items), each item a name and a price.
    "service-title": L("خدمات الحلاقة", "Barber services"),
    "service-line": L("الأسعار تشمل الغسيل والتصفيف.", "Prices include wash and styling."),
    "service-1-title": L("الشعر", "Hair"),
    "service-1-1-name": L("قص", "Cut"),
    "service-1-1-price": L("٢٥٠ ج.م", "EGP 250"),
    "service-1-2-name": L("قص وغسيل", "Cut and wash"),
    "service-1-2-price": L("٣٢٠ ج.م", "EGP 320"),
    "service-1-3-name": L("قص أطفال", "Kids' cut"),
    "service-1-3-price": L("١٨٠ ج.م", "EGP 180"),
    "service-2-title": L("اللحية", "Beard"),
    "service-2-1-name": L("تهذيب", "Trim"),
    "service-2-1-price": L("١٥٠ ج.م", "EGP 150"),
    "service-2-2-name": L("حلاقة بالمنشفة الساخنة", "Hot towel shave"),
    "service-2-2-price": L("٢٢٠ ج.م", "EGP 220"),
    "service-3-title": L("الباقات", "Packages"),
    "service-3-1-name": L("قص الشعر واللحية", "Cut and beard"),
    "service-3-1-price": L("٣٥٠ ج.م", "EGP 350"),
    "service-3-2-name": L("باقة العريس", "Groom's package"),
    "service-3-2-price": L("٩٥٠ ج.م", "EGP 950"),
    // The store's answer to the first review.
    "reviews-reply": L("يسعدنا ذلك، شكرًا لك!", "Glad to hear it, thank you!"),
  },
  // hero.tall: the split hero's photo (square on desktop, so the subject sits in the middle); story: the about page (4:5).
  photos: { hero: { tall: PHOTOS.shopHero }, story: PHOTOS.shopAbout },
};

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade is a slot of `c`; generic shop labels
 * (Top rated, Reviews) and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const x = c.custom;
  const short = x["store-short"]!;
  const aboutShort = L(`عن ${short.ar}`, `About ${short.en}`);

  const header = lib("header-brand-bar", {
    text: {
      "م": initialOf(name),
      "اسم متجرك": name,
      "ابحث في المتجر": c.labels.search,
    },
  });

  const footer = lib("footer-signoff", {
    text: {
      "شكرًا لزيارتك": c.footer.line,
      "تواصل معنا على واتساب": x["footer-cta"]!,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "العروض": L("الأعلى تقييماً", "Top rated"),
    },
    links: { "/products": [undefined, NEW, BEST, RATED] },
  });

  // Absent in an edition without buyer quotes: the section is left out.
  const reviews: LookContent["reviews"] | undefined = c.reviews;
  const reply: LookContent["custom"][string] | undefined = x["reviews-reply"];
  const home: Design[] = [
    lib("hero-halves", {
      photo: [undefined, c.photos.hero.tall],
      text: {
        "مجموعة الموسم": c.hero.eyebrow,
        "صوت أنقى، كل يوم": c.hero.title,
        "منتجات مختارة بمواصفات واضحة لكل يوم.": c.hero.line,
        "تسوق الآن": c.hero.cta,
        "العروض": x["hero-cta-2"]!,
        "صورة الحملة": c.hero.alt,
      },
      links: { "/products": [SHOP, "/contact"] },
    }),
    lib("categories-chips", { text: { "عمّ تبحث؟": c.categories.title } }),
    lib("products-grid", {
      text: { "وصل حديثًا": c.products.primary.title, "أحدث المنتجات في المتجر.": c.products.primary.line },
      links: { "/products": primaryHref(journey.primary) },
      // The grid shows the newest by default; another journey names its list.
      ...(journey.primary === "newest" ? {} : { lists: [{ source: journey.primary }] }),
    }),
    lib("service-price-menu", {
      text: {
        "أسعار الخدمات": x["service-title"]!,
        "الأسعار شاملة قطع الغيار الأصلية والضمان.": x["service-line"]!,
        "الهواتف": x["service-1-title"]!,
        "تغيير بطارية": x["service-1-1-name"]!,
        "٦٥٠ ج.م": x["service-1-1-price"]!,
        "تغيير شاشة": x["service-1-2-name"]!,
        "٢٤٠٠ ج.م": x["service-1-2-price"]!,
        "منفذ الشحن": x["service-1-3-name"]!,
        "٤٥٠ ج.م": x["service-1-3-price"]!,
        "الشاشات والمنزل": x["service-2-title"]!,
        "تركيب حائط": x["service-2-1-name"]!,
        "٣٥٠ ج.م": x["service-2-1-price"]!,
        "ضبط جهاز الاستقبال": x["service-2-2-name"]!,
        "١٥٠ ج.م": x["service-2-2-price"]!,
        "السماعات": x["service-3-title"]!,
        "تغيير وسائد الأذن": x["service-3-1-name"]!,
        "١٢٠ ج.م": x["service-3-1-price"]!,
        "تنظيف وفحص": x["service-3-2-name"]!,
        "٨٠ ج.م": x["service-3-2-price"]!,
      },
    }),
    // v5 (2026-11-25, owner): the store's 1st category as a carousel (`journey.rows`), three across: the look's packs hold three products a category (the row rule).
    lib("products-category-carousel", {
      lists: [{ offset: journey.rows[0]! - 1 }, { categoryIndex: journey.rows[0]!, limit: 3 }],
      nodes: { "منتجات القسم": { style: { columns: 3 } } },
    }),
    ...(reviews && reply
      ? [
          lib("testimonials-chat", {
            text: {
              "من الواتساب": L("الآراء", "Reviews"),
              "رسائل تسعدنا": reviews.title,
              "مريم أ.": reviews.items[0]!.name,
              "طلبت يوم الأحد ووصل الثلاثاء. التغليف كان مرتبًا والمنتج كما في الصور تمامًا.": reviews.items[0]!.quote,
              "هذا يسعدنا جدًا، شكرًا لك!": reply,
              "عمر ك.": reviews.items[1]!.name,
              "بدّلت المقاس بسهولة، والفريق ردّ عليّ خلال دقائق.": reviews.items[1]!.quote,
              "يوسف م.": reviews.items[2]!.name,
              "ثاني مرة أطلب. كل شيء أصلي والفاتورة داخل العلبة.": reviews.items[2]!.quote,
            },
          }),
        ]
      : []),
  ];

  const about: Design[] = [
    pageHeader(lib, "about-header", aboutShort, c.about.line),
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
      { slug: "about", name: L(aboutShort.ar, "About"), seo: { title: aboutShort }, sections: about },
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
  description: L("زيوت لحية وأطقم وأدوات حلاقة للرجال.", "Beard oils, kits and shaving tools for men."),
  categories: [
    ["beard", "اللحية", "Beard", PHOTOS.cedarOil],
    ["shave", "الحلاقة", "Shave", PHOTOS.safetyRazor],
    ["kits", "أطقم", "Kits", PHOTOS.barberKit],
    ["balms", "بلسم وشمع للشعر", "Balms & wax", PHOTOS.beardBalm],
    ["razors", "أمواس", "Razors", PHOTOS.razorComb],
    ["brushes", "فرش حلاقة", "Brushes", PHOTOS.brushStand],
    ["aftershave", "كولونيا بعد الحلاقة", "Aftershave", PHOTOS.aftershave],
    ["combs", "أمشاط", "Combs", PHOTOS.beardComb],
  ],
  products: [
    ["cedar-beard-oil", "beard", "زيت لحية بالسيدار", "Cedar Beard Oil", PHOTOS.cedarOil, 320, { isFeatured: true, rating: 4.8, sold90: 240 }],
    ["beard-balm", "balms", "بلسم لحية", "Beard Balm", PHOTOS.beardBalm, 260, { compareAtPrice: 310, sold90: 88 }],
    ["shaving-soap", "shave", "صابون حلاقة", "Shaving Soap", PHOTOS.shavingSoap, 190, { rating: 4.7, sold90: 130 }],
    ["barber-kit", "kits", "طقم الحلاقة", "Barber Kit", PHOTOS.barberKit, 1150, { isFeatured: true, rating: 4.9, sold90: 60 }],
    ["sandalwood-beard-oil", "beard", "زيت لحية بالصندل", "Sandalwood Beard Oil", PHOTOS.sandalOil, 340, { sold90: 72 }],
    // v5: a third beard product, so the category carousel (the 1st category) shows a full row.
    ["cedar-beard-balm", "beard", "بلسم لحية بالسيدار", "Cedar Beard Balm", PHOTOS.beardBalm, 280, { sold90: 48 }],
    ["safety-razor", "razors", "موس أمان", "Safety Razor", PHOTOS.safetyRazor, 450, { sold90: 54 }],
    ["shaving-brush-stand", "brushes", "فرشاة حلاقة مع حامل", "Shaving Brush & Stand", PHOTOS.brushStand, 690, { compareAtPrice: 820, sold90: 30 }],
    ["cooling-aftershave", "aftershave", "كولونيا منعشة بعد الحلاقة", "Cooling Aftershave", PHOTOS.aftershave, 280, { sold90: 66 }],
    ["wooden-beard-comb", "combs", "مشط لحية خشبي", "Wooden Beard Comb", PHOTOS.beardComb, 120, { sold90: 110 }],
    ["straight-razor-comb", "razors", "موس حلاقة ومشط", "Straight Razor & Comb", PHOTOS.razorComb, 520, { sold90: 22 }],
  ],
});

export const BARBER = editionTemplate({
  key: BARBER_KEY,
  // v5 (2026-11-25, owner): products by category as a carousel after the service prices.
  version: 5,
  changelog: "Barber v5: products by category as a carousel on the home",
  productPage: { surface: "flat", thumbs: "bottom", band: "brand", copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
  name: L("باربر", "Barber"),
  description: L(
    "عناية رجالي: أسعار الكرسي، احجز معاد، طقم الدقن، الباربرز وآراء الزباين. أربع صفحات جاهزة.",
    "Men's grooming: chair prices, booking, the beard kit, the barbers and regulars' reviews. Four ready pages.",
  ),
  category: "beauty",
  style: ["classic"],
  sortOrder: 640,
  palette: ["#f2f0eb", "#e2ddd3", "#c9a227", "#1f3d36"],
  colors: {
    primary: "#1f3d36",
    secondary: "#e2ddd3",
    background: "#ffffff",
    foreground: "#151515",
    muted: "#57534c",
    border: "#d2cbbd",
    accent: "#c9a227",
  },
  fonts: { heading: "Changa", body: "Cairo" },
  radius: 4,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "labels.search",
    "hero",
    "categories.title",
    "products.primary.title",
    "products.primary.line",
    "footer.line",
    "about",
    "contact",
    "faq",
    "photos.hero.tall",
    "photos.story",
    "custom.store-short",
    "custom.hero-cta-2",
    "custom.footer-cta",
    "custom.service-title",
    "custom.service-line",
    "custom.service-1-title",
    "custom.service-1-1-name",
    "custom.service-1-1-price",
    "custom.service-1-2-name",
    "custom.service-1-2-price",
    "custom.service-1-3-name",
    "custom.service-1-3-price",
    "custom.service-2-title",
    "custom.service-2-1-name",
    "custom.service-2-1-price",
    "custom.service-2-2-name",
    "custom.service-2-2-price",
    "custom.service-3-title",
    "custom.service-3-1-name",
    "custom.service-3-1-price",
    "custom.service-3-2-name",
    "custom.service-3-2-price",
  ],
  // Buyer quotes are demo claims: a pack writes real ones (with the store's reply) or leaves them out (the section is then not built).
  // A grid of the newest products; the category carousel shows the store's 1st category.
  optional: ["reviews", "custom.reviews-reply"],
  journey: { primary: "newest", rows: [1] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
});
