/**
 * Beauty Bold (2026-10-28, beauty niche, bold / colour-pop): blush paper,
 * a hot pink and a deep violet over near-black ink, Lalezar headings over
 * Tajawal, round 20px corners and a 1300px container. A loud, playful home
 * like a makeup counter: a scrolling ticker header, a three-slide hero
 * carousel of colour-block flat lays, big-type category rows, tabbed
 * products, the "with every order" promise list beside a dark flat lay,
 * four category rows with rounded frames, a WhatsApp-or-email newsletter
 * and the links footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye on a contact sheet (2026-10-28):
 * product flat lays and still lifes on colour, no people, no hands, no
 * brand labels, none used twice, none shared with another template.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const BEAUTY_BOLD_KEY = "beauty-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(BEAUTY_BOLD_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideLilac: pexels(7712475, 1920),
  slideSponges: pexels(7712467, 1920),
  slideBrushes: pexels(7512746, 1920),
  darkFlatLay: pexels(8558431, 1200),
  aboutPage: pexels(8558547, 1200),
  // Category tiles.
  catSerums: pexels(6694179, 1200),
  catMoisturizers: pexels(4841492, 1200),
  catMakeup: pexels(7256147, 1200),
  catHair: pexels(8468177, 1200),
  catCleansers: pexels(8015698, 1200),
  catBody: pexels(1298624, 1200),
  catTools: pexels(6963155, 1200),
};

const NAME = L("بمبي", "Bombi");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر خلال ٣ أيام", "Delivery across Egypt in 3 days"),
    "الدفع عند الاستلام": L("ادفعي عند الاستلام", "Pay on delivery"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّعي طلبك من صفحة طلباتي", "Track your order from My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر مبيعًا", "Best sellers"),
    "من نحن": L("عن بمبي", "About"),
    "تواصل معنا": L("تتبّعي طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ب", "B"),
    "اسم متجرك": NAME,
    "كل المنتجات": L("كل المنتجات", "All products"),
    "وصل حديثًا": L("وصل حديثًا", "New in"),
    "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
    "من نحن": L("عن بمبي", "About Bombi"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ بمبي. كل الحقوق محفوظة.", "© 2026 Bombi. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST], "https://wa.me/": "https://wa.me/201117642380" },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideLilac, PHOTOS.slideSponges, PHOTOS.slideBrushes],
    text: {
      "صورة الحملة الأولى": L("فرش وبلاشر وإسفنجات على خلفية ليلكي", "Brushes, blush and sponges on lilac"),
      "وصل حديثًا": L("وصل حديثًا", "Just landed"),
      "الموسم الجديد وصل": L("ألوان بتعلي صوتك", "Colour that turns you up"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("روج، بلاشر وظلال بدرجات جريئة، توصلك خلال ٣ أيام.", "Lipsticks, blush and shadows in bold shades, at your door in three days."),
      "تسوّق الجديد": L("شوفي الجديد", "Shop new in"),
      "صورة الحملة الثانية": L("إسفنجات مكياج ملونة وباليت ظلال", "Colourful makeup sponges and an eyeshadow palette"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("اللي الكل بيسأل عليه", "The ones everyone asks about"),
      "القطع اللي بترجع لها كل مرة.": L("ثابتة طول اليوم، وبتمشي مع كل لون بشرة.", "Long-wearing, and made for every skin tone."),
      "شوف الأكثر مبيعًا": L("شوفي الأكثر مبيعًا", "Shop best sellers"),
      "صورة الحملة الثالثة": L("فرش مكياج دهبي وفضي على خلفية فوشيا", "Gold and silver makeup brushes on fuchsia"),
      "عروض الأسبوع": L("أدوات المكياج", "The brush edit"),
      "خصومات لفترة محدودة": L("الفرشة الصح بتفرق", "The right brush makes the look"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("فرش ناعمة للبودرة والبلاشر والهايلايتر، بتدوم سنين.", "Soft brushes for powder, blush and highlighter, made to last for years."),
      "تسوّق العروض": L("تسوّقي كل المنتجات", "Shop everything"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
  }),
  lib("categories-big-type", {
    text: { "منتج": L("منتج", "products") },
  }),
  lib("products-tabbed", {
    text: {
      "المتجر": L("المتجر", "The shop"),
      "منتجاتنا": L("اختاري على مزاجك", "Pick your mood"),
      "وصل جديد": L("وصل جديد", "New in"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "العروض": L("الأعلى تقييمًا", "Top rated"),
    },
    links: { "/products": [NEW, BEST, RATED] },
    lists: [{ source: "best-sellers" }],
  }),
  lib("about-list", {
    photo: [undefined, undefined, undefined, undefined, undefined, PHOTOS.darkFlatLay],
    text: {
      "صورة المتجر": L("فرش وماسكرا وبلاشر على رخام أسود ووردي", "Brushes, a mascara wand and blush on black and pink marble"),
      "مع كل طلب": L("مع كل طلب من بمبي", "With every Bombi order"),
      "كل منتج بيتراجع قبل ما يوصلك": L("مكياج أصلي، متجرب على بشرتنا", "Genuine makeup, tried on our own skin"),
      "فاتورة رسمية وضمان": L("منتجات أصلية بتاريخ صلاحية واضح", "Genuine products with clear expiry dates"),
      "تغليف محمي من الصدمات": L("تغليف وردي محمي من الكسر", "Pink, break-proof packaging"),
      "رقم تتبع على واتساب": L("رقم تتبع وتنسيق لون على واتساب", "Tracking and shade advice on WhatsApp"),
      "اعرف أكتر": L("اعرفي حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("شوفي الكل", "See all"),
    muted: [1, 3],
    nodes: { "صورة المنتج": { style: { radius: 20 } } },
  }),
  lib("newsletter-channels", {
    text: {
      "العروض توصلك زي ما تحب": L("الألوان الجديدة توصلك زي ما تحبي", "New shades, the way you like"),
      "على واتساب أو على الإيميل، رسالة واحدة في الأسبوع ومن غير إزعاج.": L(
        "على واتساب أو الإيميل: الدرجات الجديدة ولوك الأسبوع، رسالة واحدة ومن غير إزعاج.",
        "On WhatsApp or email: new shades and the look of the week, one message and no spam.",
      ),
      "على رقم موبايلك": L("على رقم موبايلك", "On your mobile"),
      "على بريدك": L("على بريدك", "In your inbox"),
      "تقدر تلغي الاشتراك في أي وقت.": L("تقدري تلغي الاشتراك في أي وقت.", "Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن بمبي", "About Bombi"), L("مكياج بألوان جريئة، من مصر الجديدة.", "Bold-colour makeup from Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("رموش وفرش وأدوات على خلفية وردي", "Lashes, brushes and tools on pink"),
    eyebrow: L("من ٢٠٢١", "Since 2021"),
    title: L("بدأنا من ستوري على إنستجرام", "We started with an Instagram story"),
    text: L(
      "صاحبتين بيحبوا الألوان قرروا يبيعوا الدرجات اللي ما كانوش لاقيينها في مصر. النهارده بنشحن لأكتر من ٣٠ ألف عميلة.",
      "Two friends who loved colour started selling the shades they couldn’t find in Egypt. Today we ship to more than 30,000 customers.",
    ),
    more: L("وكل درجة بنجربها على أكتر من لون بشرة قبل ما تنزل الموقع.", "Every shade is tried on several skin tones before it goes live."),
    button: L("تسوّقي الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("مكياج وعناية بألوان جريئة، من مصر الجديدة.", "Bold-colour makeup and skincare from Heliopolis."),
  categories: [
    ["serums", "السيرومات والزيوت", "Serums and oils", PHOTOS.catSerums],
    ["moisturizers", "الكريمات", "Creams", PHOTOS.catMoisturizers],
    ["makeup", "المكياج", "Makeup", PHOTOS.catMakeup],
    ["hair-care", "الشعر", "Hair", PHOTOS.catHair],
    ["cleansers", "الغسول", "Cleansers", PHOTOS.catCleansers],
    ["body-care", "الجسم", "Body", PHOTOS.catBody],
    ["tools", "الأدوات", "Tools", PHOTOS.catTools],
  ],
  products: [
    // Serums and oils
    ["vitamin-c-serum-duo", "serums", "ثنائي سيروم فيتامين سي", "Vitamin C Serum Duo", P(8102129), 1150, { isFeatured: true, rating: 4.8, sold90: 141 }],
    ["gold-cap-glow-serum", "serums", "سيروم جلو بغطا دهبي", "Gold Cap Glow Serum", P(12449960), 1290, { compareAtPrice: 1490, rating: 4.9, sold90: 58 }],
    ["midnight-face-oil", "serums", "زيت وش ميدنايت", "Midnight Face Oil", P(18708753), 760, { rating: 4.6, sold90: 34 }],
    ["night-repair-serum", "serums", "سيروم إصلاح ليلي", "Night Repair Serum", P(8102021), 890, { rating: 4.7, sold90: 76 }],
    ["rose-petal-face-oil", "serums", "زيت وش بورق الورد", "Rose Petal Face Oil", P(4041231), 690, { rating: 4.7, sold90: 47 }],
    ["herbal-face-oil", "serums", "زيت وش بالأعشاب", "Herbal Face Oil", P(6694183), 540, { rating: 4.5, sold90: 22 }],
    ["amber-booster-drops", "serums", "نقط بوستر عنبري", "Amber Booster Drops", P(6693978), 590, { rating: 4.6, sold90: 19 }],
    ["roll-on-eye-serum", "serums", "سيروم عين رول أون", "Roll-On Eye Serum", P(6693878), 420, { rating: 4.8, sold90: 63 }],
    // Creams
    ["rain-pump-lotion", "moisturizers", "لوشن ترطيب بمضخة", "Hydra Pump Lotion", P(7814719), 520, { rating: 4.6, sold90: 44 }],
    ["pump-lotion-cream-duo", "moisturizers", "ثنائي لوشن وكريم", "Lotion and Cream Duo", P(27544682), 790, { isFeatured: true, rating: 4.8, sold90: 72 }],
    ["ruby-night-cream", "moisturizers", "كريم روبي الليلي", "Ruby Night Cream", P(17856248), 650, { rating: 4.7, sold90: 39 }],
    ["gold-cap-luxe-cream", "moisturizers", "كريم الغطا الدهبي", "Gold Cap Luxe Cream", P(34544440), 1190, { rating: 4.9, sold90: 26 }],
    ["mini-hand-cream-duo", "moisturizers", "ثنائي كريم إيد ميني", "Mini Hand Cream Duo", P(7256065), 280, { rating: 4.5, sold90: 88 }],
    ["blush-moisturizer-tube", "moisturizers", "مرطب بلاش أنبوبة", "Blush Moisturizer Tube", P(27544683), 390, { compareAtPrice: 450, rating: 4.6, sold90: 51 }],
    ["honey-balm-jar", "moisturizers", "بلسم العسل", "Honey Balm", P(8015480), 340, { rating: 4.7, sold90: 29 }],
    ["olive-hand-cream", "moisturizers", "كريم إيد بالزيتون", "Olive Hand Cream", P(7005933), 260, { rating: 4.4, sold90: 17 }],
    // Makeup
    ["nude-lip-gloss", "makeup", "جلوس نود", "Nude Lip Gloss", P(17806623), 240, { isFeatured: true, rating: 4.8, sold90: 156 }],
    ["lipstick-shade-scatter", "makeup", "مجموعة روج ميني", "Mini Lipstick Set", P(7256139), 690, { rating: 4.7, sold90: 61 }],
    ["hot-pink-lipstick", "makeup", "روج هوت بينك", "Hot Pink Lipstick", P(7810567), 260, { rating: 4.5, sold90: 38 }],
    ["pearl-powder-brush", "makeup", "بودرة لؤلؤ مع فرشة", "Pearl Powder with Brush", P(7256134), 390, { rating: 4.6, sold90: 73 }],
    ["glitter-brush-set", "makeup", "طقم فرش جليتر", "Glitter Brush Set", P(12449962), 450, { rating: 4.8, sold90: 49 }],
    ["electric-blue-mascara", "makeup", "ماسكرا إلكتريك بلو", "Electric Blue Mascara", P(3373731), 310, { rating: 4.6, sold90: 27, inStock: false }],
    ["shimmer-eyeshadow-grid", "makeup", "ظلال شيمر ٩ درجات", "Shimmer Eyeshadow Nine", P(7256131), 480, { rating: 4.7, sold90: 44 }],
    ["peach-liquid-liner", "makeup", "آيلاينر سائل بيتش", "Peach Liquid Liner", P(16695682), 290, { compareAtPrice: 340, rating: 4.9, sold90: 52 }],
    // Hair
    ["gold-shine-shampoo", "hair-care", "شامبو جولد شاين", "Gold Shine Shampoo", P(13006784), 320, { rating: 4.6, sold90: 41 }],
    ["shampoo-conditioner-trio", "hair-care", "ثلاثي شامبو وبلسم", "Shampoo and Conditioner Trio", P(4176618), 690, { isFeatured: true, rating: 4.8, sold90: 57 }],
    ["heat-protect-mist", "hair-care", "سبراي حماية من الحرارة", "Heat Protect Mist", P(8166452), 290, { rating: 4.7, sold90: 46 }],
    ["pastel-hair-minis", "hair-care", "عبوات شعر ميني باستيل", "Pastel Hair Minis", P(6690245), 360, { rating: 4.5, sold90: 23 }],
    ["comb-oil-gift-set", "hair-care", "طقم مشط وزيت شعر", "Comb and Hair Oil Set", P(8468166), 450, { rating: 4.7, sold90: 31 }],
    ["pick-comb", "hair-care", "مشط أفرو أزرق", "Blue Pick Comb", P(7123549), 120, { rating: 4.4, sold90: 19 }],
    ["hair-colour-brush-kit", "hair-care", "طقم فرش صبغة", "Hair Colour Brush Kit", P(8468178), 220, { rating: 4.5, sold90: 14 }],
    ["wooden-bristle-brush", "hair-care", "طقم فرشة خشب ومقص", "Bristle Brush and Scissors Set", P(11357067), 290, { rating: 4.6, sold90: 12 }],
    // Cleansers
    ["pastel-cleanser-set", "cleansers", "طقم غسول باستيل", "Pastel Cleanser Set", P(7321507), 690, { rating: 4.7, sold90: 39 }],
    ["gentle-pump-cleanser", "cleansers", "غسول لطيف بمضخة", "Gentle Pump Cleanser", P(8074069), 350, { rating: 4.6, sold90: 33 }],
    ["honey-cleansing-balm", "cleansers", "بلسم تنظيف بالعسل", "Honey Cleansing Balm", P(10650934), 420, { rating: 4.8, sold90: 28 }],
    ["pastel-gel-cleansers", "cleansers", "غسول جل باستيل", "Pastel Gel Cleansers", P(8533223), 560, { rating: 4.5, sold90: 16 }],
    // Body
    ["lemon-soap-cubes", "body-care", "صابون الليمون مكعبات", "Lemon Soap Cubes", P(7814808), 180, { rating: 4.6, sold90: 24 }],
    ["rose-soap-brush-stack", "body-care", "صابون الورد مع فرشة", "Rose Soap with Body Brush", P(9475428), 260, { rating: 4.7, sold90: 18 }],
    ["ocean-swirl-soap", "body-care", "صابون أوشن سويرل", "Ocean Swirl Soap", P(14017562), 150, { rating: 4.5, sold90: 21 }],
    ["matcha-swirl-soap", "body-care", "صابون ماتشا سويرل", "Matcha Swirl Soap", P(14017553), 150, { rating: 4.8, sold90: 15 }],
    // Tools
    ["rose-quartz-roller", "tools", "رولر وجوا شا كوارتز", "Rose Quartz Roller and Gua Sha", P(6663677), 590, { rating: 4.7, sold90: 26 }],
    ["self-care-roller-kit", "tools", "طقم رولر للعناية", "Self-Care Roller Kit", P(8903614), 790, { rating: 4.8, sold90: 13 }],
    ["dark-jade-roller", "tools", "طقم رولر يشم غامق", "Dark Jade Roller Set", P(11595256), 650, { rating: 4.6, sold90: 11 }],
  ],
});

export const BEAUTY_BOLD = libraryTemplate({
  key: BEAUTY_BOLD_KEY,
  version: 1,
  name: L("بمبي", "Bombi"),
  description: L(
    "مكياج بألوان جريئة: سلايدر ألوان، أقسام بخط كبير، تبويبات منتجات وصفوف بإطارات مدورة. لمتاجر المكياج والجمال.",
    "Bold-colour makeup: a colour-pop slider, big-type categories, tabbed products and rounded category rows. For makeup and beauty stores.",
  ),
  category: "beauty",
  sortOrder: 1330,
  palette: ["#fff6f9", "#fde3ee", "#c2185b", "#5e1f8c"],
  colors: {
    primary: "#c2185b",
    secondary: "#fde3ee",
    background: "#fff6f9",
    foreground: "#1f0f19",
    muted: "#6d5664",
    border: "#f2cddc",
    accent: "#5e1f8c",
  },
  fonts: { heading: "Lalezar", body: "Tajawal" },
  radius: 20,
  containerMaxWidth: 1300,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن بمبي", "About"), seo: { title: L("عن بمبي", "About Bombi") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("محتارة في الدرجة؟", "Not sure about a shade?"),
        text: L("ابعتيلنا صورة على واتساب ونختارلك الدرجة. ٧ شارع الأهرام، مصر الجديدة، القاهرة.", "Send us a photo on WhatsApp and we’ll pick your shade. 7 El Ahram St, Heliopolis, Cairo."),
        heading: L("كلّمينا", "Talk to us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الدرجات والتوصيل والاستبدال.", "Shades, delivery and exchanges."),
        question: L("لو الدرجة ما طلعتش مناسبة؟", "What if the shade doesn’t suit me?"),
        answer: L(
          "لو المنتج لسه مقفول، تقدري تستبدليه بدرجة تانية خلال ١٤ يوم. والتوصيل في القاهرة والجيزة خلال يومين.",
          "If the product is still sealed, you can swap it for another shade within 14 days. Cairo and Giza delivery takes two days.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    surface: "card",
    band: "brand",
    extras: ["product-perks", "product-shipping"],
    copy: { reviews: L("رأي اللي جربوه", "From people who tried it"), related: L("يكمّل اللوك", "Completes the look") },
  },
});
