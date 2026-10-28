/**
 * Fashion Bold (2026-10-28, fashion niche, bold / streetwise): white paper,
 * deep ink, an electric cobalt brand and a lime accent, Changa headings over
 * Tajawal, rounded 18px corners and a 1300px container. A loud, colourful
 * home: the top bar header, a three-slide hero carousel of rails, categories
 * as a big-type list, best sellers in a bento, the shop story in a cobalt
 * panel, four category rows with rounded frames, a cobalt newsletter strip
 * and the sign-off footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28): garments on
 * rails and hangers, folded knits, shoes, belts and bags only, no people or
 * hands, no readable labels or brand lettering, none used twice and none
 * shared with the other two fashion templates (re-checked at 2000px). Slides
 * 7679798, 4947543, 40450756; about 5490963, about page 32797310; tiles
 * 30927606, 36074834, 14642655, 11585383, 39525839, 31959217; products as
 * listed in `DEMO`. Swapped from the curator's list: dress 23501005 (a
 * "closed" sign) for 6833654; shirts 35646638 (lettered hangers), 18265937
 * (printed neck labels) for 11443064, 31842962; shirts tile 34156906
 * (printed labels) for 36074834; knit 45982 (readable label) for 33999761;
 * outerwear 39321486 (lettered shelf) for 5490205; outerwear tile 7679455
 * (a third shot of the leather rail) for 11585383; shoes 31129841, 27174537
 * (insole lettering) for 267301, 28821783, 10827097; shoes tile 36937550
 * (insole lettering) for 39525839; accessories 31959215 (same shoot as
 * 31959216), 1013482 (newspaper print) for 36933384, 34443362. At 2000px:
 * slide 18953509 (lettered hanger clips) for 40450756; dress 38547152
 * (hanger lettering) for 15120548; shirt 38928670 (embroidered logos) for
 * 7989576; knits 33999761, 9603624 (printed tags) for 36129313, 19933804;
 * jackets 19345119, 6044973, 7679725 (printed labels) for 9218524,
 * 36593272, 6334403; heels 28821783, 10827097 (insole print) dropped, so
 * shoes have 3; bag 36933384 (stamped brand) for 40125212.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const FASHION_BOLD_KEY = "fashion-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FASHION_BOLD_KEY, getDesign(id)!, { corners: 18, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideLeather: pexels(7679798, 1920),
  slideBoutique: pexels(4947543, 1920),
  slideHangers: pexels(40450756, 1920),
  colourRail: pexels(5490963, 1200),
  dressRail: pexels(32797310, 1200),
  // Category list photos.
  catDresses: pexels(30927606, 1200),
  catShirts: pexels(36074834, 1200),
  catKnitwear: pexels(14642655, 1200),
  catOuterwear: pexels(11585383, 1200),
  catShoes: pexels(39525839, 1200),
  catAccessories: pexels(31959217, 1200),
};

const NAME = L("ألوان", "Alwan");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("توصيل خلال ٤٨ ساعة في القاهرة والجيزة", "48-hour delivery in Cairo and Giza"),
    "الدفع عند الاستلام": L("قيس قبل ما تدفع", "Try it on before you pay"),
    "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر مبيعًا", "Best sellers"),
    "من نحن": L("عن ألوان", "About"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("البس اللي يشبهك", "Wear what feels like you"),
    "كلمنا على واتساب": L("كلمنا على واتساب", "Chat on WhatsApp"),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل القطع", "All pieces"),
    "وصل حديثًا": L("وصل حديثًا", "New in"),
    "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
    "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
    "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
    "من نحن": L("عن ألوان", "About Alwan"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ ألوان. كل الحقوق محفوظة.", "© 2026 Alwan. All rights reserved."),
  },
  links: { "https://wa.me/": "https://wa.me/201118264057", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideLeather, PHOTOS.slideBoutique, PHOTOS.slideHangers],
    text: {
      "صورة الحملة الأولى": L("شماعة طويلة عليها جواكت جلد", "A long rail of leather jackets"),
      "وصل حديثًا": L("وصل حديثًا", "Just landed"),
      "الموسم الجديد وصل": L("الجلد رجع بقوة", "Leather is back"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("جواكت جلد ودنيم بقصّات جديدة، وتوصيل خلال يومين.", "Leather and denim jackets in new cuts, delivered in two days."),
      "تسوّق الجديد": L("شوف الجديد", "Shop new in"),
      "صورة الحملة الثانية": L("شماعة بوتيك بألوان باستيل", "A boutique rail in pastel tones"),
      "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("القطع اللي بتخلص الأول", "The pieces that sell out first"),
      "القطع اللي بترجع لها كل مرة.": L("فساتين وتيشيرتات بألوان تفرّح، ومقاسات من S لـ 3XL.", "Dresses and tees in happy colours, sized S to 3XL."),
      "شوف الأكثر مبيعًا": L("شوف الأكثر مبيعًا", "Shop best sellers"),
      "صورة الحملة الثالثة": L("شماعة تيشيرتات بألوان كتير", "A rail of tees in many colours"),
      "عروض الأسبوع": L("نسّق بنفسك", "Mix it up"),
      "خصومات لفترة محدودة": L("قطعتين وعشر إطلالات", "Two pieces, ten looks"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("قمصان، تريكو وجواكت بتتنسق مع بعض بسهولة.", "Shirts, knits and jackets that work together."),
      "تسوّق العروض": L("تسوّق كل القطع", "Shop everything"),
    },
    links: { "/products": [NEW, BEST, SHOP] },
    // Tablets and phones: the copy sits over the bright top of the photos, so the shade darkens all of it.
    nodes: { "التظليل": { tablet: { background: "black", opacity: 60 }, mobile: { background: "black", opacity: 60 } } },
  }),
  lib("categories-big-type", {
    text: { "منتج": L("قطع", "pieces") },
  }),
  lib("products-bento", {
    text: {
      "الأكثر طلبًا": L("الأكثر مبيعًا", "Best sellers"),
      "الكل بيسأل عليهم": L("القطع اللي الكل لابسها", "What everyone is wearing"),
      "عرض الكل": L("الكل", "All"),
    },
    links: { "/products": BEST },
  }),
  lib("about-inset", {
    photo: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, PHOTOS.colourRail],
    text: {
      "إزاي بنشتغل": L("من وسط البلد", "From Downtown Cairo"),
      "كل منتج بيتراجع قبل ما يوصلك": L("ألوان جريئة لكل يوم", "Bold colour for every day"),
      "فريقنا بيراجع كل منتج ويتأكد منه قبل التغليف.": L(
        "+٣٠٠٠٠ طلب من كل محافظات مصر. بنصمم في وسط البلد ونخيط في ورش مصرية، وكل قطعة بتتقاس قبل ما تتغلف.",
        "30,000+ orders across Egypt. We design in Downtown Cairo, sew in Egyptian workshops and check the fit of every piece before it ships.",
      ),
      "اعرف أكتر": L("اعرف حكايتنا", "Our story"),
      "صورة المتجر": L("شماعة ملابس ملونة وجنبها ورد أصفر", "A colourful clothing rail with yellow flowers"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("شوف الكل", "See all"),
    muted: [1, 3],
    nodes: { "صورة المنتج": { style: { radius: 18 } } },
  }),
  lib("newsletter-strip", {
    text: {
      "اعرف الجديد الأول": L("اعرف الدروب الجاي قبل الكل", "Hear about the next drop first"),
      "المجموعات الجديدة والعروض الخاصة، مرة في الأسبوع.": L("الألوان الجديدة وأفكار للتنسيق، مرة في الأسبوع.", "New colours and styling ideas, once a week."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن ألوان", "About Alwan"), L("ملابس بألوان جريئة، متصممة في وسط البلد.", "Bold, colourful clothes, designed in Downtown Cairo.")),
  aboutStory(lib, {
    photo: PHOTOS.dressRail,
    alt: L("فساتين بألوان وطبعات جريئة على الشماعة", "Dresses in bold colours and prints on a rail"),
    eyebrow: L("من ٢٠١٨", "Since 2018"),
    title: L("الدولاب مش لازم يكون رمادي", "Your wardrobe doesn't have to be grey"),
    text: L("بدأنا بعشرين تيشيرت بألوان مختلفة على صفحة إنستجرام، وخلصوا في يوم. من ساعتها وإحنا بنعمل ألوان تفرّح.", "We started with twenty tees in different colours on Instagram, and they sold out in a day. We have made joyful colour ever since."),
    more: L("بنخيط في ورش مصرية، وبنوصل لكل المحافظات، والاستبدال ببلاش خلال ١٤ يوم.", "We sew in Egyptian workshops, deliver to every governorate and exchange for free within 14 days."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ملابس بألوان جريئة، متصممة في وسط البلد.", "Bold, colourful clothes, designed in Downtown Cairo."),
  categories: [
    ["dresses", "الفساتين", "Dresses", PHOTOS.catDresses],
    ["shirts", "التيشيرتات والقمصان", "Tees & shirts", PHOTOS.catShirts],
    ["knitwear", "التريكو", "Knitwear", PHOTOS.catKnitwear],
    ["outerwear", "الجواكت", "Jackets", PHOTOS.catOuterwear],
    ["shoes", "الأحذية", "Shoes", PHOTOS.catShoes],
    ["accessories", "الأحزمة والشنط", "Belts & bags", PHOTOS.catAccessories],
  ],
  products: [
    // Dresses
    ["swirl-halter-dress", "dresses", "فستان هولتر بنقشة", "Swirl Halter Dress", P(14513896), 1450, { isFeatured: true, rating: 4.8, sold90: 74 }],
    ["lace-slip-dress", "dresses", "فستان دانتيل سليب", "Lace Slip Dress", P(15120548), 1190, { rating: 4.7, sold90: 48 }],
    ["sunflower-maxi-dress", "dresses", "فستان ماكسي أصفر مطبوع", "Sunflower Maxi Dress", P(19895977), 1650, { compareAtPrice: 1900, rating: 4.6, sold90: 39 }],
    ["navy-flow-maxi", "dresses", "فستان ماكسي كحلي", "Navy Flow Maxi", P(38571600), 1390, { rating: 4.5, sold90: 27 }],
    ["cobalt-shirt-dress", "dresses", "فستان قميص كوبالت", "Cobalt Shirt Dress", P(31871752), 1290, { rating: 4.8, sold90: 33 }],
    ["teal-satin-slip", "dresses", "فستان ساتان تيل", "Teal Satin Slip Dress", P(4103436), 1750, { rating: 4.9, sold90: 22 }],
    ["floral-wrap-dress", "dresses", "فستان ملفوف مورد", "Floral Wrap Dress", P(31683078), 1550, { rating: 4.6, sold90: 18, inStock: false }],
    ["pink-sequin-party-dress", "dresses", "فستان ترتر بينك", "Pink Sequin Party Dress", P(6833654), 2100, { rating: 4.7, sold90: 15 }],
    // Tees & shirts
    ["rainbow-tee-rail", "shirts", "تيشيرت قطن بألوان", "Colour Pop Tee", P(26601197), 390, { rating: 4.8, sold90: 96 }],
    ["sunny-shirt-rail", "shirts", "قميص قطن صيفي", "Summer Cotton Shirt", P(7989576), 550, { isFeatured: true, rating: 4.7, sold90: 61 }],
    ["linen-overshirt-mix", "shirts", "قميص كتان أوفر سايز", "Oversized Linen Shirt", P(8483487), 890, { rating: 4.8, sold90: 44 }],
    ["blush-boxy-tee", "shirts", "تيشيرت بوكسي بينك", "Blush Boxy Tee", P(9558761), 420, { rating: 4.6, sold90: 38 }],
    ["rose-shirt-edit", "shirts", "قميص بلوزة روز", "Rose Button Shirt", P(4153098), 790, { rating: 4.5, sold90: 21 }],
    ["botanical-print-tee", "shirts", "تيشيرت بطبعة نبات", "Botanical Print Tee", P(31995174), 450, { compareAtPrice: 520, rating: 4.7, sold90: 30 }],
    ["warm-tone-shirts", "shirts", "قميص قطن بألوان دافية", "Warm Tone Cotton Shirt", P(11443064), 690, { rating: 4.6, sold90: 25 }],
    ["tropical-camp-shirt", "shirts", "قميص صيفي استوائي", "Tropical Camp Shirt", P(31842962), 750, { rating: 4.8, sold90: 34 }],
    // Knitwear
    ["pastel-knit-stack", "knitwear", "بلوفر باستيل", "Pastel Knit Sweater", P(34854182), 1150, { rating: 4.7, sold90: 42 }],
    ["fair-isle-red-sweater", "knitwear", "بلوفر نقشة شتوي أحمر", "Red Fair Isle Sweater", P(35210034), 1290, { rating: 4.8, sold90: 36 }],
    ["nordic-cable-stack", "knitwear", "بلوفر نوردي ضفاير", "Nordic Cable Sweater", P(11541395), 1350, { isFeatured: true, rating: 4.9, sold90: 57 }],
    ["red-cropped-cardigan", "knitwear", "كارديجان أحمر قصير", "Red Cropped Cardigan", P(36129313), 1190, { rating: 4.6, sold90: 29 }],
    ["cream-tie-knit", "knitwear", "بلوفر كريمي بربطة", "Cream Tie Knit", P(14641436), 990, { rating: 4.5, sold90: 19 }],
    ["cotton-stripe-knit", "knitwear", "بلوفر قطن مقلم", "Cotton Stripe Knit", P(6702574), 1090, { compareAtPrice: 1290, rating: 4.7, sold90: 24 }],
    ["blossom-knit-stack", "knitwear", "بلوفر كروشيه وردي", "Blossom Crochet Knit", P(19933804), 1250, { rating: 4.6, sold90: 16 }],
    ["button-knit-cardigan", "knitwear", "كارديجان بزرار دهبي", "Gold Button Cardigan", P(14641434), 1390, { rating: 4.8, sold90: 13 }],
    // Jackets
    ["cream-studio-blazer", "outerwear", "بليزر كريمي واسع", "Relaxed Cream Blazer", P(9218524), 1850, { rating: 4.8, sold90: 52 }],
    ["denim-jacket-rail", "outerwear", "جاكيت جينز", "Classic Denim Jacket", P(7679722), 1650, { isFeatured: true, rating: 4.9, sold90: 68 }],
    ["houndstooth-blazer", "outerwear", "بليزر هاوندستوث", "Houndstooth Blazer", P(36593272), 2400, { rating: 4.7, sold90: 31 }],
    ["cognac-leather-jacket", "outerwear", "جاكيت جلد كونياك", "Cognac Leather Jacket", P(7679685), 3900, { compareAtPrice: 4400, rating: 4.8, sold90: 26 }],
    ["red-quilted-jacket", "outerwear", "جاكيت مبطن أحمر", "Red Quilted Jacket", P(1488470), 1950, { rating: 4.6, sold90: 23 }],
    ["olive-field-jacket", "outerwear", "جاكيت فيلد زيتي", "Olive Field Jacket", P(5490205), 2100, { rating: 4.5, sold90: 14 }],
    ["quilted-velvet-hoodie", "outerwear", "جاكيت قطيفة مبطن", "Quilted Velvet Jacket", P(6334403), 3600, { rating: 4.7, sold90: 20 }],
    ["long-puffer-coat", "outerwear", "بالطو بافر طويل", "Long Puffer Coat", P(6045058), 2900, { rating: 4.6, sold90: 11 }],
    // Shoes
    ["chunky-white-sneakers", "shoes", "كوتشي أبيض تقيل", "Chunky White Sneakers", P(11324546), 1450, { rating: 4.8, sold90: 59 }],
    ["blue-canvas-boat-shoes", "shoes", "حذاء كانفاس أزرق", "Blue Canvas Shoes", P(40325298), 990, { rating: 4.6, sold90: 28 }],
    ["croc-bit-loafers", "shoes", "لوفر كروكو بحلية", "Croc Bit Loafers", P(267301), 1350, { rating: 4.7, sold90: 22 }],
    // Belts & bags
    ["colour-leather-belts", "accessories", "حزام جلد بألوان", "Colour Leather Belt", P(31959216), 450, { rating: 4.7, sold90: 37 }],
    ["python-print-belts", "accessories", "حزام بنقشة ثعبان", "Python Print Belt", P(8539466), 520, { rating: 4.6, sold90: 24 }],
    ["straw-panama-hats", "accessories", "برنيطة قش بانما", "Straw Panama Hat", P(40125212), 950, { rating: 4.8, sold90: 32 }],
    ["statement-buckle-belts", "accessories", "حزام مطاط بإبزيم", "Statement Buckle Belt", P(32498619), 390, { rating: 4.5, sold90: 18 }],
    ["studded-leather-belts", "accessories", "حزام جلد بمسامير", "Studded Leather Belt", P(34443362), 480, { rating: 4.4, sold90: 12 }],
  ],
});

export const FASHION_BOLD = libraryTemplate({
  key: FASHION_BOLD_KEY,
  version: 1,
  name: L("ألوان", "Alwan"),
  description: L(
    "أزياء بألوان جريئة: سلايدر بثلاث صور، أقسام بخط كبير وأربع صفوف منتجات. للبراندات الشبابية اللي عايزة طاقة.",
    "Bold, colourful fashion: a three-slide hero, big-type categories and four product rows. For young brands that want energy.",
  ),
  category: "fashion",
  sortOrder: 1240,
  palette: ["#ffffff", "#f0f2ff", "#2340d8", "#d8f24a"],
  colors: {
    primary: "#2340d8",
    secondary: "#f0f2ff",
    background: "#ffffff",
    foreground: "#111321",
    muted: "#565a6e",
    border: "#dfe3f5",
    accent: "#d8f24a",
  },
  fonts: { heading: "Changa", body: "Tajawal" },
  radius: 18,
  containerMaxWidth: 1300,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن ألوان", "About"), seo: { title: L("عن ألوان", "About Alwan") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L(
          `٢٤ شارع طلعت حرب، وسط البلد، القاهرة، ${phone("+20 111 826 4057")}، ${handle("hello@alwan.eg")}`,
          `24 Talaat Harb St, Downtown, Cairo | ${phone("+20 111 826 4057")} | ${handle("hello@alwan.eg")}`,
        ),
        heading: L("محتار في المقاس؟ ابعتلنا", "Unsure about size? Ask us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتوصيل والاستبدال.", "Sizes, delivery and exchanges."),
        question: L("أقدر أقيس قبل ما أدفع؟", "Can I try it on before paying?"),
        answer: L(
          "أيوه، المندوب بيستناك تقيس، ولو المقاس مش مظبوط بترجّع القطعة معاه من غير ما تدفع حاجة.",
          "Yes. The courier waits while you try it on, and if the size is wrong you hand it back without paying.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "side",
    band: "brand",
    extras: ["product-perks"],
    copy: { reviews: L("قالوا عن ألوان", "What people say"), related: L("نسّقها مع", "Style it with") },
  },
});
