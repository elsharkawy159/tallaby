/**
 * Vella (2026-10-30, women's winter fashion, after the layout of the Void
 * Fashion store on EasyOrders; no code, copy or photos taken from it): white
 * paper, black ink and one red accent, Rubik throughout, square corners and a
 * 1400px container. A black sliding announcement strip over a one-line
 * header, a full-width background video, tall collection photos with a Shop
 * now link, a big scrolling words band, one product row per category, a wide
 * banner between the rows, a brand statement, the quick-questions FAQ, a
 * centred newsletter and the dark footer. Built from section library designs
 * (`fromLibrary`); the header and the portrait collections are new for it.
 *
 * Photos and video: Pexels, picked by the curator and checked by eye
 * (2026-10-30): garments on hangers, rails and flat lays, no people or hands,
 * no readable brand lettering, none shared with another template. Video
 * 8844337 (portrait; poster used until it loads), banner 9594682, about
 * 14641427, tiles 17076381, 7417471, 31961166, 3927384; products as listed in
 * `DEMO`. Pexels has few clean sweatpants and sports packshots without a
 * body, so those two categories hold four products each.
 *
 * Edition-ready (ROADMAP F-90, `../editions/README.md`): the sections are
 * built by `look(content, journey)`, and `DEFAULT_CONTENT` with `DEMO` is
 * Vella itself. The output is unchanged from before the conversion
 * (`../editions/look-guard.test.ts`), so the version stays 1.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { copyrightLine, editionTemplate, type LookParts } from "../editions/apply";
import type { LookContent, LookDefaults, LookJourney } from "../editions/types";
import { demoStore, handle, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const VELLA_KEY = "vella";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(VELLA_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(8844337, "8844337-uhd_1440_2560_30fps.mp4"),
  heroPoster: pexelsVideoPoster(8844337),
  banner: pexels(9594682, 2000),
  about: pexels(14641427, 1200),
  catHoodies: pexels(17076381, 1000),
  catDresses: pexels(7417471, 1000),
  catSweatpants: pexels(31961166, 1000),
  catSports: pexels(3927384, 1000),
};

const NAME = L("فيلا", "Vella");

/**
 * Vella's own content: what the look is built with when no edition is applied
 * (the template `vella` has always meant). The store name and description and
 * the category photos come from `DEMO`.
 */
const DEFAULT_CONTENT: LookDefaults = {
  // The black strip's three sliding messages, two to five words each.
  announcement: [
    L("أهلًا بيك في فيلا", "Welcome to Vella"),
    L("شحن مجاني للطلبات فوق ٧٥٠٠ جنيه", "Free shipping above 7,500 EGP"),
    L("تفاصيل بتفرق", "Details that make a difference"),
  ],
  footer: { line: L("فيلا: أزياء نسائية عصرية، صُممت عشانك.", "Vella: contemporary women's fashion, designed for you.") },
  hero: {
    alt: L("شماعة عليها قطع شتوية بنقوش", "A rail of patterned winter pieces"),
    eyebrow: L("مجموعة الشتاء", "Winter collection"),
    title: L("أناقة معمولة ليكِ", "Elegance made for you"),
    line: L("تفاصيل بتفرق، وستايل يبدأ من هنا.", "Details that make a difference. Your look starts here."),
    cta: L("تسوّقي الآن", "Shop now"),
  },
  categories: { title: L("المجموعات", "Collections") },
  // The full-width band between the first and second category rows. Its button goes to the newest products.
  story: {
    alt: L("شماعة صغيرة عليها ثلاث قطع على حيطة رمادي فاتح", "A small rail with three pieces on a pale grey wall"),
    eyebrow: L("انضمي لينا", "Join us"),
    title: L("كوني من اللي بيعرفوا يلبسوا", "Be one of the women who wear it well"),
    text: L("اكتشفي قطعتك المفضلة الجاية، من تشكيلة مختارة بعناية كل أسبوع.", "Discover your next favorite piece, from a range chosen with care every week."),
    cta: L("تسوّقي الجديد", "Shop new in"),
  },
  newsletter: {
    title: L("اشتركي في نشرتنا", "Subscribe to our newsletter"),
    line: L("تابعي جديد القطع وتحديثات المخزون وأكتر.", "Follow for tailored new arrivals, stock updates and more."),
  },
  about: {
    line: L("أزياء نسائية عصرية، صُممت عشانك.", "Contemporary women's fashion, designed for you."),
    alt: L("تريكو بألوان الكريمي والتوبي بإضاءة ناعمة", "Cream and taupe knits in soft light"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("الموضة تعبير عن نفسك", "Fashion is how you express yourself"),
    text: L(
      "بدأت فيلا بشغف للستايل العصري والأناقة. بنختار قطعنا بعناية عشان تجمع بين أحدث الترندات والراحة اللي بتدوم.",
      "Vella began with a passion for modern style. We choose every piece to mix the latest trends with comfort that lasts.",
    ),
    more: L("وأي قطعة مش مظبوطة عليكي، بنبدلها خلال ١٤ يوم.", "And if a piece does not suit you, we exchange it within 14 days."),
    // The button goes to the best sellers.
    cta: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
  },
  contact: {
    title: L("كلمينا", "Talk to us"),
    line: L(`القاهرة، مصر، ${phone("٠١٢٣ ٤٥٦ ٧٨٩٠")}، ${handle("vella@vella.eg")}`, "Cairo, Egypt | +20 123 456 7890 | vella@vella.eg"),
    heading: L("محتاجة مساعدة في المقاس؟ اسألينا", "Need help with sizing? Ask us"),
  },
  faq: {
    line: L("المقاسات والشحن والاستبدال.", "Sizing, shipping and exchanges."),
    question: L("إزاي أعرف مقاسي؟", "How do I find my size?"),
    answer: L(
      "جدول المقاسات موجود في كل صفحة منتج بالسنتيمتر. ولو بين مقاسين، اختاري الأكبر لقصة مريحة أكتر.",
      "A size guide in centimetres is on every product page. If you are between sizes, size up for a more relaxed fit.",
    ),
  },
  // The footer's contact column, one short line each: the store's phone, email, address and opening hours.
  custom: {
    "contact-phone": L("٠١٢٣ ٤٥٦ ٧٨٩٠", "+20 123 456 7890"),
    "contact-email": L("\u200fvella@vella.eg", "vella@vella.eg"),
    "contact-address": L("القاهرة، مصر", "Cairo, Egypt"),
    "contact-hours": L("كل يوم، ١٠ ص – ١٠ م", "Every day, 10am to 10pm"),
  },
  photos: {
    // The poster is drawn first; the video plays over it (Vella's is a portrait video, cropped to the screen).
    hero: { wide: PHOTOS.heroPoster, video: PHOTOS.heroVideo },
    // The full-width story band: a wide photo with a calm area for the white copy over it.
    banner: PHOTOS.banner,
    // The about page's photo.
    story: PHOTOS.about,
  },
};

/** How many products each category row shows, by the row's position on the page. */
const ROW_LIMITS = [4, 8, 4, 4];

/**
 * The look: every section from a content object (`DEFAULT_CONTENT`, or an
 * edition's). What names the trade or the demo store is a slot of `c`;
 * generic shop labels (New in, Best sellers, Shop now, View all), the
 * library's scrolling words ("Your style, your way") and the layout stay here.
 */
function look(c: LookContent, journey: LookJourney): LookParts {
  const name = c.store.name;
  const aboutName = L(`عن ${name.ar}`, `About ${name.en}`);
  // Optional: the footer's "العروض / Offers" link (it goes to the whole catalog) under another label. Without it the library's label stays.
  const footerOffers = c.custom["footer-offers"];

  const header = lib("header-announcement-strip", {
    text: {
      "اسم متجرك": name,
      "أهلًا بيك في متجرنا": c.announcement[0]!,
      "شحن مجاني للطلبات الكبيرة": c.announcement[1]!,
      "تفاصيل بتفرق": c.announcement[2]!,
      "العروض": L("وصل حديثًا", "New in"),
      "المدونة": L("الأكثر طلبًا", "Best sellers"),
    },
    links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
  });

  const footer = lib("footer-classic", {
    text: {
      "اسم متجرك": name,
      "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": copyrightLine(name),
      "أساسيات كل يوم، مختارة بعناية.": c.footer.line,
      "٠١٠٠ ١٢٣ ٤٥٦٧": c.custom["contact-phone"]!,
      "\u200fhello@store.com": c.custom["contact-email"]!,
      "١٢ شارع النيل، الزمالك، القاهرة": c.custom["contact-address"]!,
      "السبت إلى الخميس، ١٠ ص – ١٠ م": c.custom["contact-hours"]!,
      ...(footerOffers && { "العروض": footerOffers }),
    },
  });

  /** One product row per category place in `journey.rows`, tall photos. */
  const rows = journey.rows.map((place, i) =>
    lib("products-category-carousel", {
      as: `category-row-${place}`,
      text: { "عرض الكل": L("عرض الكل", "View all") },
      lists: [{ offset: place - 1 }, { categoryIndex: place, limit: ROW_LIMITS[i] }],
      nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
    }),
  );

  const video = c.photos.hero.video;
  const home: Design[] = [
    lib("hero-video", {
      photo: [c.photos.hero.wide],
      // Without a video the design shows its poster alone.
      nodes: { ...(video && { "الفيديو": { props: { url: video } } }), "التعتيم": { style: { opacity: 30 } } },
      text: {
        "فيديو الواجهة": c.hero.alt,
        "المجموعة الجديدة": c.hero.eyebrow,
        "مساحتك، بطريقتك": c.hero.title,
        "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": c.hero.line,
        "تسوّق الآن": c.hero.cta,
        "شوف الجديد": L("وصل حديثًا", "New in"),
      },
      links: { "/products": SHOP, "/products?sort=newest": NEW },
    }),
    lib("categories-portrait-labels", {
      text: { "المجموعات": c.categories.title, "تسوّق الآن": c.custom["categories-cta"] ?? L("تسوّقي الآن", "Shop now") },
    }),
    lib("text-big-marquee"),
    rows[0]!,
    lib("about-fullbleed", {
      photo: [undefined, undefined, c.photos.banner],
      text: {
        "صورة القصة": c.story.alt,
        "حكايتنا": c.story.eyebrow,
        "تفاصيل صغيرة تصنع الفرق": c.story.title,
        "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.": c.story.text,
        "اعرف أكثر": c.story.cta,
      },
      links: { "/about": NEW },
    }),
    ...rows.slice(1),
    lib("newsletter-centered", {
      text: {
        "خد ١٠٪ خصم على أول طلب": c.newsletter.title,
        "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": c.newsletter.line,
      },
    }),
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
  description: L("أزياء نسائية عصرية، صُممت عشانك.", "Contemporary women's fashion, designed for you."),
  categories: [
    ["hoodies", "هوديز", "Hoodies", PHOTOS.catHoodies],
    ["blouses-dresses", "بلوزات وفساتين", "Blouses & Dresses", PHOTOS.catDresses],
    ["sweatpants", "سويت بانتس", "Sweatpants", PHOTOS.catSweatpants],
    ["sports-wear", "ملابس رياضية", "Sports Wear", PHOTOS.catSports],
  ],
  products: [
    // Hoodies
    ["rainbow-fleece-hoodie", "hoodies", "هودي فليس ملون", "Rainbow Fleece Hoodie", P(17076381), 1150, { isFeatured: true, rating: 4.8, sold90: 82 }],
    ["colour-block-sweatshirt", "hoodies", "سويت شيرت كولور بلوك", "Colour-Block Sweatshirt", P(4192904), 999, { compareAtPrice: 1200, rating: 4.7, sold90: 61 }],
    ["sage-oversized-sweatshirt", "hoodies", "سويت شيرت أوفر سايز أخضر", "Sage Oversized Sweatshirt", P(9594694), 1050, { rating: 4.6, sold90: 44 }],
    ["colour-block-zip-sweatshirt", "hoodies", "سويت شيرت بسوستة", "Colour-Block Zip Sweatshirt", P(18904630), 1100, { rating: 4.7, sold90: 38 }],
    ["grey-hoodie-pair", "hoodies", "هودي رمادي", "Grey Hoodie", P(34460035), 1025, { rating: 4.5, sold90: 52 }],
    ["green-chunky-pullover", "hoodies", "بلوفر تريكو أخضر غامق", "Forest Green Chunky Pullover", P(3353621), 1333, { compareAtPrice: 1730, rating: 4.8, sold90: 27 }],
    // Blouses & dresses
    ["pastel-floral-tunic", "blouses-dresses", "فستان تونيك باستيل", "Pastel Floral Tunic Dress", P(19895950), 2766, { rating: 4.7, sold90: 40 }],
    ["midnight-floral-mini", "blouses-dresses", "فستان ميني بورود", "Midnight Floral Mini Dress", P(19895953), 3499, { isFeatured: true, rating: 4.8, sold90: 55 }],
    ["bohemian-print-dress", "blouses-dresses", "فستان بوهو مطبوع", "Bohemian Print Dress", P(19895954), 4200, { rating: 4.6, sold90: 31 }],
    ["cream-puff-sleeve-blouse", "blouses-dresses", "بلوزة كريمي بأكمام منفوخة", "Cream Puff-Sleeve Blouse", P(23495731), 1899, { rating: 4.8, sold90: 66 }],
    ["ivory-cropped-blouse", "blouses-dresses", "بلوزة كروب عاجي", "Ivory Cropped Blouse", P(5204832), 1450, { rating: 4.5, sold90: 48 }],
    ["white-tiered-midi", "blouses-dresses", "فستان ميدي أبيض", "White Tiered Midi Dress", P(7417471), 5200, { compareAtPrice: 5900, rating: 4.9, sold90: 36 }],
    ["black-floral-slip", "blouses-dresses", "فستان سليب أسود", "Black Floral Slip Dress", P(18984545), 3800, { rating: 4.7, sold90: 29 }],
    ["paisley-print-blouse", "blouses-dresses", "بلوزة بيزلي", "Paisley Print Blouse", P(38194953), 2200, { rating: 4.6, sold90: 24 }],
    // Sweatpants
    ["grey-fleece-joggers", "sweatpants", "جوجر فليس رمادي", "Grey Fleece Joggers", P(31961166), 799, { isFeatured: true, rating: 4.8, sold90: 91 }],
    ["rust-wide-leg-trousers", "sweatpants", "بنطلون واسع صدئي", "Rust Wide-Leg Trousers", P(4458521), 1099, { rating: 4.6, sold90: 43 }],
    ["olive-cargo-trousers", "sweatpants", "بنطلون كارجو زيتي", "Olive Cargo Trousers", P(20094389), 999, { rating: 4.7, sold90: 35 }],
    ["two-tone-lounge-pants", "sweatpants", "بنطلون بيت بلونين", "Two-Tone Lounge Pants", P(6046228), 599, { compareAtPrice: 898, rating: 4.5, sold90: 58 }],
    // Sports wear
    ["mauve-seamless-set", "sports-wear", "طقم سيملس موف", "Mauve Seamless Sports Set", P(3927384), 1250, { isFeatured: true, rating: 4.8, sold90: 47 }],
    ["mauve-leggings-set", "sports-wear", "طقم موف بليجنز", "Mauve Set with Leggings", P(3927383), 1450, { rating: 4.7, sold90: 33 }],
    ["mauve-training-set", "sports-wear", "طقم تمرين موف", "Mauve Training Set", P(3927388), 1350, { rating: 4.6, sold90: 25 }],
    ["white-ribbed-sports-bra", "sports-wear", "سبورت برا أبيض ريب", "White Ribbed Sports Bra", P(4397836), 450, { rating: 4.5, sold90: 62 }],
  ],
});

export const VELLA = editionTemplate({
  key: VELLA_KEY,
  version: 1,
  name: NAME,
  description: L(
    "أزياء نسائية بأسلوب نضيف: شريط رسائل أسود متحرك، فيديو بعرض الشاشة، أقسام بصور طولية وصف منتجات لكل قسم. لمتاجر الملابس النسائية.",
    "Clean women's fashion: a sliding black message strip, a full-width video, tall collection photos and a product row per category. For women's clothing stores.",
  ),
  category: "fashion",
  style: ["minimal"],
  sortOrder: 1600,
  palette: ["#ffffff", "#f4f4f5", "#131316", "#d22b2e"],
  colors: {
    primary: "#131316",
    secondary: "#f4f4f5",
    background: "#ffffff",
    foreground: "#131316",
    muted: "#6b6b70",
    border: "#e4e4e7",
    accent: "#d22b2e",
  },
  fonts: { heading: "Rubik", body: "Rubik" },
  radius: 0,
  containerMaxWidth: 1400,
  lib,
  look,
  // Every slot `look` reads; an edition must hold them all.
  slots: [
    "announcement.0",
    "announcement.1",
    "announcement.2",
    "footer.line",
    "custom.contact-phone",
    "custom.contact-email",
    "custom.contact-address",
    "custom.contact-hours",
    "hero",
    "categories.title",
    "story",
    "newsletter.title",
    "newsletter.line",
    "about",
    "contact",
    "faq",
    "photos.hero.wide",
    "photos.banner",
    "photos.story",
  ],
  // `custom.categories-cta`: the small link under each category photo (default "تسوّقي الآن / Shop now").
  // `custom.footer-offers`: the label of the footer's "العروض / Offers" link, which goes to the whole catalog (a pack should rename it: an edition shows no offers).
  optional: ["photos.hero.video", "custom.categories-cta", "custom.footer-offers"],
  // No main product section: the home page is one row per category (`primary` is not read). The rows hold 4, 8, 4 and 4 products.
  journey: { primary: "newest", rows: [1, 2, 3, 4] },
  defaultContent: DEFAULT_CONTENT,
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("آراء عميلاتنا", "Customer reviews"), related: L("كمّلي اللوك", "Complete the look") },
  },
});
