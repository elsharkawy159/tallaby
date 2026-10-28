/**
 * Beauty Warm (2026-10-28, beauty niche, warm / editorial): cream paper,
 * cinnamon brown and amber, Aref Ruqaa headings over Noto Kufi Arabic,
 * soft 10px corners and a 1380px container. A slow, apothecary-like home:
 * the top bar header, a three-photo collage of the bath ritual, a featured
 * category with the rest listed beside it, a best-seller campaign beside a linen flat
 * lay, the workshop story beside a window-sill photo, four category rows
 * with landscape photos, the founder’s letter newsletter and the line
 * footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye on a contact sheet (2026-10-28):
 * amber glass, wood, linen and natural still lifes only, no people, no
 * hands, no brand labels, none used twice, none shared with another
 * template.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone } from "../library-template";

export const BEAUTY_WARM_KEY = "beauty-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BEAUTY_WARM_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  bath: pexels(6811898, 1920),
  amberTray: pexels(7795864, 1200),
  peachFlatLay: pexels(7796746, 1200),
  linenFlatLay: pexels(7795453, 1200),
  windowSill: pexels(6628482, 1200),
  aboutPage: pexels(7795829, 1200),
  // Category cards.
  catSerums: pexels(6693972, 1200),
  catMoisturizers: pexels(8101674, 1200),
  catMakeup: pexels(34321279, 1200),
  catHair: pexels(4154198, 1200),
  catCleansers: pexels(7796692, 1200),
  catBody: pexels(7777105, 1200),
  catTools: pexels(7815027, 1200),
};

const NAME = L("عنبر", "Anbar");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("معمول بإيد في مصر · توصيل لكل المحافظات", "Handmade in Egypt · Delivery nationwide"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "تتبّع طلبك": L("تتبّعي", "Track order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-line", {
  text: {
    "م": L("ع", "A"),
    "اسم متجرك": NAME,
    "من نحن": L("حكايتنا", "Our story"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ عنبر · ٣١ شارع ٩، المعادي، القاهرة · hello@anbar.eg", "© 2026 Anbar · 31 Road 9, Maadi, Cairo · hello@anbar.eg"),
  },
  links: { "https://wa.me/": "https://wa.me/201024719356" },
});

const home: Design[] = [
  lib("hero-collage", {
    photo: [PHOTOS.bath, PHOTOS.amberTray, PHOTOS.peachFlatLay],
    text: {
      "حكاية الموسم": L("طقوس عنبر", "The Anbar ritual"),
      "٣ قطع تكفي أسبوعًا كاملًا": L("ساعة لنفسك، كل ليلة", "An hour for yourself, every night"),
      "نسّقها معًا أو مع ما تملكه بالفعل، وكل قطعة متاحة بأكثر من لون.": L(
        "زيوت وصابون وكريمات بالأعشاب، معمولة على مهل في ورشتنا بالمعادي من مكونات مصرية.",
        "Herbal oils, soaps and creams, made slowly in our Maadi workshop from Egyptian ingredients.",
      ),
      "تسوّق اللوك": L("تسوّقي الطقوس", "Shop the ritual"),
      "القطعة الأولى": L("حمّام دافي", "A warm bath"),
      "القطعة الثانية": L("زيوت العنبر", "Amber oils"),
      "القطعة الثالثة": L("أدوات طبيعية", "Natural tools"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-feature-list", {
    text: {
      "الأقسام": L("من الرف للحمّام", "From shelf to bath"),
      "كل الأقسام": L("كل المنتجات", "Shop all"),
      "منتج": L("منتج", "products"),
    },
  }),
  lib("products-campaign", {
    photo: [undefined, undefined, undefined, PHOTOS.linenFlatLay],
    text: {
      "صورة الحملة": L("زجاجات عنبري وفوط كتان على مفرش", "Amber bottles and linen towels on a throw"),
      "الخط الجديد": L("الأكثر طلبًا", "Most loved"),
      "اختارناها لك بعناية": L("اللي بيخلص الأول", "What sells out first"),
      "قطع جديدة من خطنا الجديد، معمولة عشان تعيش معاك.": L(
        "المنتجات اللي عميلاتنا بيرجعوا يطلبوها كل شهر.",
        "The products our customers reorder every month.",
      ),
      "تسوّق المجموعة": L("كل الأكثر طلبًا", "All best sellers"),
    },
    links: { "/products": BEST },
  }),
  lib("about-split-story", {
    photo: [undefined, undefined, PHOTOS.windowSill],
    text: {
      "صورة القصة": L("حافة شباك عليها مراية وشمعة وناشر عطر", "A window sill with a mirror, a candle and a diffuser"),
      "من ورشتنا": L("من ورشتنا", "From our workshop"),
      "متصمم عشانك ومعمول في القاهرة": L("معمول بإيد، على مهل", "Made by hand, slowly"),
      "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": L(
        "بنقطّر الزيوت ونصب الصابون بإيدينا في دفعات صغيرة، بزيت زيتون من سيوة وعسل من الفيوم.",
        "We blend oils and pour soap by hand in small batches, with olive oil from Siwa and honey from Fayoum.",
      ),
      "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": L(
        "+١٥٠٠٠ عميلة في مصر بتستخدم عنبر، وتقييمنا ٤٫٩ من ٥.",
        "15,000+ customers across Egypt use Anbar, rated 4.9 out of 5.",
      ),
      "حكايتنا": L("اقري حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("كل المنتجات", "Shop all"),
    muted: [1, 3],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "landscape" } } },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("رسالة كل شهر", "A letter every month"),
      "أهلًا،": L("أهلًا يا جميلة،", "Hello, lovely,"),
      "كل خميس بكتب رسالة قصيرة فيها أحسن حاجة جربناها الأسبوع ده، وعرض للمشتركين بس.": L(
        "أول كل شهر بنكتبلك رسالة قصيرة من الورشة: الدفعة الجديدة، وصفة بسيطة لروتين البيت، وإيه اللي بنجربه دلوقتي.",
        "On the first of every month we write you a short note from the workshop: the new batch, a simple home ritual, and what we are testing now.",
      ),
      "أ": L("ع", "A"),
      "أحمد": L("فريق عنبر", "The Anbar team"),
      "صاحب المتجر": L("من ورشة المعادي", "From our Maadi workshop"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكاية عنبر", "The Anbar story"), L("زيوت وصابون معمولين بإيد في المعادي.", "Oils and soaps made by hand in Maadi.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("زجاجة سيروم عنبري في صندوق بامبو على صينية خشب", "An amber serum bottle in a bamboo box on a wooden tray"),
    eyebrow: L("من ٢٠١٧", "Since 2017"),
    title: L("بدأت من مطبخ البيت", "It began in a home kitchen"),
    text: L(
      "مريم بدأت تعمل صابون لنفسها ولعيلتها، ولما صحابها طلبوا منه، بقت الورشة الصغيرة اللي في المعادي.",
      "Mariam started making soap for herself and her family. When friends began asking for it, it became our small workshop in Maadi.",
    ),
    more: L("وكل منتج لسه بيتعمل في دفعات صغيرة ويتلف بإيد.", "Every product is still made in small batches and wrapped by hand."),
    button: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("زيوت وصابون وكريمات بالأعشاب، معمولين بإيد في المعادي.", "Herbal oils, soaps and creams, handmade in Maadi."),
  categories: [
    ["serums", "الزيوت والسيرومات", "Oils and serums", PHOTOS.catSerums],
    ["moisturizers", "الكريمات والزبدة", "Creams and butters", PHOTOS.catMoisturizers],
    ["makeup", "المكياج", "Makeup", PHOTOS.catMakeup],
    ["hair-care", "العناية بالشعر", "Hair care", PHOTOS.catHair],
    ["cleansers", "الغسول", "Cleansers", PHOTOS.catCleansers],
    ["body-care", "الصابون", "Soaps", PHOTOS.catBody],
    ["tools", "الأدوات", "Tools", PHOTOS.catTools],
  ],
  products: [
    // Oils and serums
    ["amber-glow-serum", "serums", "سيروم عنبر للنضارة", "Amber Glow Serum", P(7796985), 690, { isFeatured: true, rating: 4.9, sold90: 124 }],
    ["linen-calm-serum", "serums", "سيروم الكتان المهدئ", "Linen Calm Serum", P(8100775), 620, { isFeatured: true, rating: 4.7, sold90: 66 }],
    ["date-seed-face-oil", "serums", "زيت وش بنوى البلح", "Date Seed Face Oil", P(7795816), 540, { rating: 4.8, sold90: 48 }],
    ["rose-renewal-serum", "serums", "سيروم الورد للتجديد", "Rose Renewal Serum", P(8100777), 650, { compareAtPrice: 740, rating: 4.7, sold90: 39 }],
    ["cork-dropper-serum", "serums", "سيروم الفلين بالأعشاب", "Herbal Cork Serum", P(7796984), 680, { rating: 4.6, sold90: 31 }],
    ["golden-tray-oil", "serums", "زيت الوش الدهبي", "Golden Face Oil", P(7795654), 590, { rating: 4.8, sold90: 27 }],
    ["cedar-face-oil", "serums", "زيت وش بالأرز", "Cedar Face Oil", P(6693977), 480, { rating: 4.6, sold90: 35 }],
    ["apothecary-oil-trio", "serums", "ثلاثي زيوت الصيدلية", "Apothecary Oil Trio", P(8709577), 1250, { rating: 4.9, sold90: 18 }],
    // Creams and butters
    ["lavender-face-cream", "moisturizers", "كريم وش باللافندر", "Lavender Face Cream", P(6167444), 420, { isFeatured: true, rating: 4.8, sold90: 83 }],
    ["bamboo-lid-day-cream", "moisturizers", "كريم نهاري بغطا بامبو", "Bamboo-Lid Day Cream", P(8102023), 460, { rating: 4.7, sold90: 52 }],
    ["shea-balm", "moisturizers", "بلسم زبدة الشيا", "Shea Balm", P(6963141), 280, { rating: 4.8, sold90: 61 }],
    ["whipped-body-cream", "moisturizers", "كريم جسم مخفوق", "Whipped Body Cream", P(4735910), 390, { rating: 4.6, sold90: 44 }],
    ["amber-body-balm", "moisturizers", "بلسم جسم عنبري", "Amber Body Balm", P(7795662), 520, { compareAtPrice: 600, rating: 4.7, sold90: 29 }],
    ["soft-rose-cream", "moisturizers", "كريم الورد الناعم", "Soft Rose Cream", P(7797119), 380, { rating: 4.5, sold90: 23 }],
    ["honey-body-butter", "moisturizers", "زبدة جسم بعسل الفيوم", "Fayoum Honey Body Butter", P(7796229), 350, { isFeatured: true, rating: 4.9, sold90: 57 }],
    ["turmeric-glow-butter", "moisturizers", "زبدة الكركم للإشراق", "Turmeric Glow Butter", P(12572310), 360, { rating: 4.6, sold90: 21, inStock: false }],
    // Makeup
    ["classic-red-lipstick", "makeup", "روج أحمر كلاسيك", "Classic Red Lipstick", P(7810641), 260, { rating: 4.7, sold90: 46 }],
    ["bronzing-pearls", "makeup", "لؤلؤ برونزر", "Bronzing Pearls", P(7290178), 590, { isFeatured: true, rating: 4.8, sold90: 52 }],
    ["dewy-lipstick-duo", "makeup", "ثنائي روج لامع", "Dewy Lipstick Duo", P(6867202), 420, { rating: 4.6, sold90: 34 }],
    ["blush-palette", "makeup", "باليت بلاشر", "Blush Palette", P(5403547), 480, { rating: 4.7, sold90: 38 }],
    ["nude-eyeshadow-pans", "makeup", "ظلال نود ريفيل", "Nude Eyeshadow Pans", P(7256063), 520, { compareAtPrice: 590, rating: 4.8, sold90: 29 }],
    ["marble-brush-set", "makeup", "طقم فرش مكياج رخامي", "Marble Makeup Brush Set", P(7446413), 560, { rating: 4.6, sold90: 25 }],
    ["cocoa-lip-tint-palette", "makeup", "باليت تينت كاكاو", "Cocoa Tint Palette", P(3689976), 450, { rating: 4.5, sold90: 19 }],
    ["powder-blush-pans", "makeup", "بودرة وبلاشر ريفيل", "Powder and Blush Pans", P(8776816), 340, { rating: 4.7, sold90: 22 }],
    // Hair care
    ["amber-wash-conditioner", "hair-care", "ثنائي شامبو وبلسم عنبري", "Amber Wash and Conditioner", P(4154194), 540, { rating: 4.8, sold90: 47 }],
    ["hair-oil-wooden-comb", "hair-care", "زيت شعر ومشط خشب", "Hair Oil and Wooden Comb", P(19572634), 420, { rating: 4.7, sold90: 36 }],
    ["wooden-comb-set", "hair-care", "طقم أمشاط خشب", "Wooden Comb Set", P(7428093), 190, { rating: 4.6, sold90: 28 }],
    ["pear-wood-comb", "hair-care", "مشط خشب الكمثرى", "Pear-Wood Comb", P(15694771), 240, { rating: 4.8, sold90: 33 }],
    ["boar-bristle-brush", "hair-care", "فرشة شعر طبيعي", "Natural Bristle Brush", P(30696697), 320, { rating: 4.5, sold90: 17 }],
    ["rosemary-hair-oil", "hair-care", "زيت شعر بالروزماري", "Rosemary Hair Oil", P(7795849), 380, { rating: 4.7, sold90: 42 }],
    ["amber-claw-clip", "hair-care", "مشبك شعر عنبري", "Amber Claw Clip", P(20166053), 160, { rating: 4.4, sold90: 15 }],
    ["pearl-hair-clips", "hair-care", "مشابك شعر لولي", "Pearl Hair Clips", P(4515450), 180, { rating: 4.6, sold90: 24 }],
    // Cleansers
    ["amber-face-wash", "cleansers", "غسول وش عنبري", "Amber Face Wash", P(8217468), 320, { rating: 4.7, sold90: 39 }],
    ["botanical-cleansing-gel", "cleansers", "جل تنظيف بالأعشاب", "Botanical Cleansing Gel", P(8172121), 350, { rating: 4.6, sold90: 26 }],
    ["cotton-rounds-dish", "cleansers", "قطن تنظيف قابل للغسيل", "Reusable Cotton Rounds", P(6690165), 150, { rating: 4.5, sold90: 31 }],
    ["organic-cotton-pads", "cleansers", "علبة قطن عضوي", "Organic Cotton Pads", P(6682981), 120, { rating: 4.4, sold90: 19 }],
    // Soaps
    ["oat-soap-brush", "body-care", "صابون الشوفان مع فرشة", "Oat Soap with Body Brush", P(6187621), 290, { rating: 4.8, sold90: 27 }],
    ["citrus-soap-stack", "body-care", "صابون الحمضيات", "Citrus Soap Stack", P(7615805), 170, { rating: 4.6, sold90: 22 }],
    ["olive-soap-board", "body-care", "صابون زيت الزيتون السيوي", "Siwa Olive Oil Soap", P(6621284), 140, { rating: 4.9, sold90: 35 }],
    // Tools
    ["jade-roller-gua-sha", "tools", "رولر وجوا شا يشم", "Jade Roller and Gua Sha", P(6766261), 560, { rating: 4.7, sold90: 21 }],
    ["jade-roller-trio", "tools", "طقم رولر يشم", "Jade Roller Set", P(11806210), 620, { rating: 4.8, sold90: 14 }],
    ["rosemary-tray-roller", "tools", "رولر يشم على صينية خشب", "Jade Roller on a Wooden Tray", P(6621435), 690, { rating: 4.6, sold90: 11 }],
    ["rose-quartz-duo", "tools", "ثنائي كوارتز وردي", "Rose Quartz Duo", P(6663589), 540, { rating: 4.7, sold90: 18 }],
  ],
});

export const BEAUTY_WARM = libraryTemplate({
  key: BEAUTY_WARM_KEY,
  version: 1,
  name: L("عنبر", "Anbar"),
  description: L(
    "عناية طبيعية بدفا: كولاج لطقوس الحمّام، قسم مميز مع باقي الأقسام وصفوف بصور عريضة. لمتاجر الصابون والزيوت والعناية الطبيعية.",
    "Warm, natural care: a bath-ritual collage, a featured-category list and wide-photo rows. For soap, oil and natural skincare shops.",
  ),
  category: "beauty",
  sortOrder: 1340,
  palette: ["#f8f1e7", "#efe2cf", "#7a3e1d", "#b8742a"],
  colors: {
    primary: "#7a3e1d",
    secondary: "#efe2cf",
    background: "#f8f1e7",
    foreground: "#2b1d14",
    muted: "#6b5646",
    border: "#e0cfb7",
    accent: "#9a5d1c",
  },
  fonts: { heading: "Aref Ruqaa", body: "Noto Kufi Arabic" },
  radius: 10,
  containerMaxWidth: 1380,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "About"), seo: { title: L("حكاية عنبر", "The Anbar story") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زوري الورشة", "Visit the workshop"),
        text: L(`الورشة: ٣١ شارع ٩، المعادي، القاهرة · ${phone("٠١٠٢ ٤٧١ ٩٣٥٦")}`, "Workshop: 31 Road 9, Maadi, Cairo · +20 102 471 9356"),
        heading: L("ابعتيلنا سؤالك", "Send us your question"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المكونات والصلاحية والتوصيل.", "Ingredients, shelf life and delivery."),
        question: L("المنتجات بتعيش قد إيه؟", "How long do the products last?"),
        answer: L(
          "الصابون بيعيش سنة، والزيوت والكريمات ٦ شهور بعد الفتح. تاريخ الدفعة مكتوب بخط إيدينا على كل علبة.",
          "Soaps keep for a year, oils and creams for six months after opening. The batch date is handwritten on every box.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من بيوت عميلاتنا", "From our customers’ homes"), related: L("يكمّل طقوسك", "Completes your ritual") },
  },
});
