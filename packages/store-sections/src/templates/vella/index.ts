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
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

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

const header = lib("header-announcement-strip", {
  text: {
    "اسم متجرك": NAME,
    "أهلًا بيك في متجرنا": L("أهلًا بيك في فيلا", "Welcome to Vella"),
    "شحن مجاني للطلبات الكبيرة": L("شحن مجاني للطلبات فوق ٧٥٠٠ جنيه", "Free shipping above 7,500 EGP"),
    "تفاصيل بتفرق": L("تفاصيل بتفرق", "Details that make a difference"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ فيلا. كل الحقوق محفوظة.", "© 2026 Vella. All rights reserved."),
    "أساسيات كل يوم، مختارة بعناية.": L("فيلا: أزياء نسائية عصرية، صُممت عشانك.", "Vella: contemporary women's fashion, designed for you."),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L("٠١٢٣ ٤٥٦ ٧٨٩٠", "+20 123 456 7890"),
    "‏hello@store.com": L("‏vella@vella.eg", "vella@vella.eg"),
    "١٢ شارع النيل، الزمالك، القاهرة": L("القاهرة، مصر", "Cairo, Egypt"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم، ١٠ ص – ١٠ م", "Every day, 10am to 10pm"),
  },
});

/** One product row per category place (hoodies, dresses, sweatpants, sports), tall photos. */
const ROW_LIMITS = [4, 8, 4, 4];
const rows = ROW_LIMITS.map((limit, i) =>
  lib("products-category-carousel", {
    as: `category-row-${i + 1}`,
    text: { "عرض الكل": L("عرض الكل", "View all") },
    lists: [{ offset: i }, { categoryIndex: i + 1, limit }],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
);

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 30 } } },
    text: {
      "فيديو الواجهة": L("شماعة عليها قطع شتوية بنقوش", "A rail of patterned winter pieces"),
      "المجموعة الجديدة": L("مجموعة الشتاء", "Winter collection"),
      "مساحتك، بطريقتك": L("أناقة معمولة ليكِ", "Elegance made for you"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L("تفاصيل بتفرق، وستايل يبدأ من هنا.", "Details that make a difference. Your look starts here."),
      "تسوّق الآن": L("تسوّقي الآن", "Shop now"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-portrait-labels", {
    text: { "المجموعات": L("المجموعات", "Collections"), "تسوّق الآن": L("تسوّقي الآن", "Shop now") },
  }),
  lib("text-big-marquee"),
  rows[0]!,
  lib("about-fullbleed", {
    photo: [undefined, undefined, PHOTOS.banner],
    text: {
      "صورة القصة": L("شماعة صغيرة عليها ثلاث قطع على حيطة رمادي فاتح", "A small rail with three pieces on a pale grey wall"),
      "حكايتنا": L("انضمي لينا", "Join us"),
      "تفاصيل صغيرة تصنع الفرق": L("كوني من اللي بيعرفوا يلبسوا", "Be one of the women who wear it well"),
      "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.": L(
        "اكتشفي قطعتك المفضلة الجاية، من تشكيلة مختارة بعناية كل أسبوع.",
        "Discover your next favorite piece, from a range chosen with care every week.",
      ),
      "اعرف أكثر": L("تسوّقي الجديد", "Shop new in"),
    },
    links: { "/about": NEW },
  }),
  ...rows.slice(1),
  lib("newsletter-centered", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("اشتركي في نشرتنا", "Subscribe to our newsletter"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L("تابعي جديد القطع وتحديثات المخزون وأكتر.", "Follow for tailored new arrivals, stock updates and more."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن فيلا", "About Vella"), L("أزياء نسائية عصرية، صُممت عشانك.", "Contemporary women's fashion, designed for you.")),
  aboutStory(lib, {
    photo: PHOTOS.about,
    alt: L("تريكو بألوان الكريمي والتوبي بإضاءة ناعمة", "Cream and taupe knits in soft light"),
    eyebrow: L("حكايتنا", "Our story"),
    title: L("الموضة تعبير عن نفسك", "Fashion is how you express yourself"),
    text: L(
      "بدأت فيلا بشغف للستايل العصري والأناقة. بنختار قطعنا بعناية عشان تجمع بين أحدث الترندات والراحة اللي بتدوم.",
      "Vella began with a passion for modern style. We choose every piece to mix the latest trends with comfort that lasts.",
    ),
    more: L("وأي قطعة مش مظبوطة عليكي، بنبدلها خلال ١٤ يوم.", "And if a piece does not suit you, we exchange it within 14 days."),
    button: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

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

export const VELLA = libraryTemplate({
  key: VELLA_KEY,
  version: 1,
  name: NAME,
  description: L(
    "أزياء نسائية بأسلوب نضيف: شريط رسائل أسود متحرك، فيديو بعرض الشاشة، أقسام بصور طولية وصف منتجات لكل قسم. لمتاجر الملابس النسائية.",
    "Clean women's fashion: a sliding black message strip, a full-width video, tall collection photos and a product row per category. For women's clothing stores.",
  ),
  category: "fashion",
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
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن فيلا", "About"), seo: { title: L("عن فيلا", "About Vella") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمينا", "Talk to us"),
        text: L(`القاهرة، مصر، ${phone("٠١٢٣ ٤٥٦ ٧٨٩٠")}، ${handle("vella@vella.eg")}`, "Cairo, Egypt | +20 123 456 7890 | vella@vella.eg"),
        heading: L("محتاجة مساعدة في المقاس؟ اسألينا", "Need help with sizing? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والشحن والاستبدال.", "Sizing, shipping and exchanges."),
        question: L("إزاي أعرف مقاسي؟", "How do I find my size?"),
        answer: L(
          "جدول المقاسات موجود في كل صفحة منتج بالسنتيمتر. ولو بين مقاسين، اختاري الأكبر لقصة مريحة أكتر.",
          "A size guide in centimetres is on every product page. If you are between sizes, size up for a more relaxed fit.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("آراء عميلاتنا", "Customer reviews"), related: L("كمّلي اللوك", "Complete the look") },
  },
});
