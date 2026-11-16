/**
 * Fashion Warm (2026-10-28, fashion niche, warm / editorial): linen paper,
 * terracotta and a camel accent, Amiri headings over Tajawal, soft 10px
 * corners and a 1360px container. A slow, magazine-like home: the
 * announcement header, a split hero of a wooden-hanger rail, captioned
 * category cards with counts, a grid of the best sellers (v2), the
 * making story in three photos, four category rows with tall frames, a
 * personal letter newsletter and the classic footer. Built from section
 * library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28): garments on
 * hangers, hooks and rails, folded knits, shoes, belts and bags only, no
 * people or hands, no readable labels or brand lettering, none used twice
 * and none shared with the other two fashion templates (re-checked at
 * 2000px: dresses 20194301 (printed packaging), 18984514 (mostly empty
 * hangers) for 15535548, 8459374; tee 37704845 (same tee as 37704849) for
 * 26601192; cardigan 9603628 (printed tags) for 30263575).
 * Hero 8311879; campaign 5424912; story 6347892, 35033800, 10558182; about
 * page 10557058; tiles 2814866, 996329, 14686151, 8112996, 31129829,
 * 11962316; products as listed in `DEMO`. The curator's knit pile
 * (5603009 … 5602986) and beige tee (37704849 … 37704848) are cut to two
 * shots each, kept apart. Swapped from the curator's list: hero 10558197
 * (bottle labels) dropped; dresses 6371823 (an arm), 18746998 and 20352730
 * (lettered hangers) for 35865069, 10328731, 18984514, and 2814866 moved to
 * the tile; dress tile 10689371 (a branded dispenser) for 2814866; shirts
 * 11739279 (book titles), 37704844, 37704850 (same tee) for 3735641,
 * 17281873, 12955555; shirts tile 37704848 (same tee) for 996329; knit
 * 5603004, 5603008, 5602987 (same pile), 5602986 tile for 19112315,
 * 5789582, 12944791 and tile 14686151; outerwear 31733950 (collar label),
 * 5490201 (printed tee) for 15124231, 9218536; shoes 30156657 (lace tags),
 * 26925256 (insole lettering) for 27658532, 12164656; accessories 31367059
 * (stamped belt), 37326652, 37326646, 28028316 (embossed brand and card
 * print) for 4830923, 35222039; accessories tile 28028316 for 11962316.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const FASHION_WARM_KEY = "fashion-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FASHION_WARM_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(8311879, 1920),
  storeRail: pexels(6347892, 1200),
  storeStand: pexels(35033800, 1200),
  storeShirts: pexels(10558182, 1200),
  aboutPage: pexels(10557058, 1200),
  // Category cards.
  catDresses: pexels(2814866, 1200),
  catShirts: pexels(996329, 1200),
  catKnitwear: pexels(14686151, 1200),
  catOuterwear: pexels(8112996, 1200),
  catShoes: pexels(31129829, 1200),
  catAccessories: pexels(11962316, 1200),
};

const NAME = L("نَوْل", "Nawl");

const header = lib("header-announcement", {
  text: {
    "تشكيلة الموسم الجديد وصلت": L("قطن وكتان وصوف طبيعي", "Natural cotton, linen and wool"),
    "الدفع عند الاستلام": L("تفاصيل ومقاسات واضحة لكل قطعة", "Clear details and sizes for every piece"),
    "م": L("ن", "N"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L("ملابس من القطن والكتان والصوف الطبيعي.", "Clothes in natural cotton, linen and wool."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل القطع", "All pieces"),
    "وصل حديثًا": L("وصل حديثًا", "New in"),
    "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
    "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
    "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact us"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("+20 106 352 7184"), phone("+20 106 352 7184")),
    "‏hello@store.com": L(handle("hello@nawl.eg"), handle("hello@nawl.eg")),
    "١٢ شارع النيل، الزمالك، القاهرة": L("٩ شارع ٢٣١، المعادي، القاهرة", "9 Road 231, Maadi, Cairo"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم، ١١ ص – ١٠ م", "Daily, 11am – 10pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نَوْل. كل الحقوق محفوظة.", "© 2026 Nawl. All rights reserved."),
    "بواسطة طلبي": L("", ""),
  },
  links: { "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-split", {
    photo: [PHOTOS.hero],
    text: {
      "صورة الواجهة": L("شماعات خشبية عليها قمصان وجينز", "Wooden hangers with shirts and denim"),
      "المجموعة الجديدة": L("مجموعة القطن والكتان", "The cotton and linen edit"),
      "مختارة بعناية": L("ملابس بسيطة لكل يوم", "Simple clothes for every day"),
      "قطع مختارة بعناية، لكل قطعة تفاصيلها المميزة.": L(
        "قطن وكتان مغسول بألوان ترابية هادئة.",
        "Cotton and washed linen in calm earth tones.",
      ),
      "تسوّق المجموعة": L("تسوّق المجموعة", "Shop the edit"),
      "حكايتنا": L("حكايتنا", "Our story"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-captioned", {
    text: {
      "اكتشف الأقسام": L("تسوّق حسب القسم", "Shop by category"),
      "كل الأقسام": L("كل القطع", "Shop all"),
      "منتج": L("قطع", "pieces"),
    },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  // v2 (2026-11-16, owner): a real products grid replaces the campaign (one photo and four cards); the home stays at nine sections.
  lib("products-grid", {
    text: {
      "وصل حديثًا": L("القطع الأكثر طلبًا", "The most ordered pieces"),
      "أحدث المنتجات في المتجر.": L("خامات طبيعية وقصّات مريحة تناسب كل الإطلالات.", "Natural fabrics and easy cuts that go with everything."),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 8 }],
  }),
  lib("about-stories", {
    photo: [undefined, PHOTOS.storeRail, PHOTOS.storeStand, PHOTOS.storeShirts],
    text: {
      "كيف نعمل": L("كيف نختار القطع", "How we choose"),
      "من اختيارنا إلى طلبك": L("من اختيارنا إلى طلبك", "From our pick to your order"),
      "نختار": L("نختار", "We choose"),
      "كل منتج بعناية.": L("خامات طبيعية مثل القطن والكتان.", "Natural fabrics such as cotton and linen."),
      "نراجع": L("نراجع", "We check"),
      "تفاصيل كل منتج قبل عرضه.": L("المقاسات والخامة لكل قطعة.", "The sizes and fabric of every piece."),
      "نساعدك": L("نساعدك", "We help"),
      "في أي سؤال عن منتجاتنا.": L("في أي سؤال عن المقاس أو القطعة.", "With any question about a size or a piece."),
      "خطوة": L("خطوة", "Step"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("كل القطع", "Shop all"),
    muted: [1, 3],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("رسالة نَوْل", "The Nawl letter"),
      "أهلًا،": L("أهلًا،", "Hello,"),
      "نكتب رسالة قصيرة عن أحدث المنتجات في المتجر.": L(
        "نكتب رسالة قصيرة عن القطع الجديدة وطرق تنسيقها.",
        "A short letter about new pieces and how to style them.",
      ),
      "أ": L("ن", "N"),
      "أحمد": L("فريق نَوْل", "The Nawl team"),
      "صاحب المتجر": L("من نَوْل", "From Nawl"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("ملابس من القطن والكتان الطبيعي.", "Clothes in natural cotton and linen.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("ركن فيه شماعة خضراء ونباتات", "A corner with a green rail and plants"),
    eyebrow: L("منتجاتنا", "Our pieces"),
    title: L("ملابس لكل يوم", "Clothes made for every day"),
    text: L("نختار قطعًا من القطن والكتان والصوف، ونعرض الخامة والمقاسات لكل قطعة بوضوح.", "We pick cotton, linen and wool pieces, with the fabric and sizes of each shown clearly."),
    more: L("تواصل معنا لأي سؤال عن منتجاتنا.", "Contact us with any question about our products."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ملابس من القطن والكتان الطبيعي.", "Clothes in natural cotton and linen."),
  categories: [
    ["dresses", "الفساتين", "Dresses", PHOTOS.catDresses],
    ["shirts", "القمصان والتيشيرتات", "Shirts & tees", PHOTOS.catShirts],
    ["knitwear", "التريكو", "Knitwear", PHOTOS.catKnitwear],
    ["outerwear", "الجواكت والمعاطف", "Outerwear", PHOTOS.catOuterwear],
    ["shoes", "الأحذية", "Shoes", PHOTOS.catShoes],
    ["accessories", "الإكسسوارات", "Accessories", PHOTOS.catAccessories],
  ],
  products: [
    // Dresses
    ["meadow-cotton-dress", "dresses", "فستان قطن واسع", "Meadow Cotton Dress", P(15114700), 1650, { isFeatured: true, rating: 4.8, sold90: 47 }],
    ["ivory-satin-gown", "dresses", "فستان ساتان عاجي", "Ivory Satin Gown", P(38273589), 6900, { rating: 4.9, sold90: 18 }],
    ["doorway-tulle-dress", "dresses", "فستان تول أبيض", "White Tulle Dress", P(28651555), 5400, { rating: 4.7, sold90: 21 }],
    ["v-neck-lace-dress", "dresses", "فستان دانتيل رقبة V", "V-Neck Lace Dress", P(19882184), 5900, { compareAtPrice: 6600, rating: 4.8, sold90: 16 }],
    ["floral-galabeya-dress", "dresses", "فستان مورد طويل", "Long Floral Dress", P(15535548), 3900, { rating: 4.6, sold90: 12 }],
    ["beaded-bodice-gown", "dresses", "فستان مطرز", "Beaded Bodice Gown", P(35865069), 7400, { rating: 4.7, sold90: 9 }],
    ["red-wrap-dresses", "dresses", "فستان لف أحمر", "Red Wrap Dress", P(10328731), 1850, { rating: 4.6, sold90: 26 }],
    ["bridal-lace-rail", "dresses", "فستان دانتيل عاجي", "Ivory Lace Dress", P(8459374), 1290, { rating: 4.5, sold90: 31, inStock: false }],
    // Shirts & tees
    ["sand-pocket-tee", "shirts", "تيشيرت جيب رملي", "Sand Pocket Tee", P(37704849), 590, { isFeatured: true, rating: 4.8, sold90: 72 }],
    ["linen-overshirts", "shirts", "قميص كتان بمقاس واسع", "Linen Overshirt", P(7671163), 1350, { rating: 4.7, sold90: 38 }],
    ["closet-dress-shirts", "shirts", "قميص قطن رسمي", "Cotton Dress Shirt", P(965632), 990, { rating: 4.6, sold90: 29 }],
    ["soft-crew-tees", "shirts", "تيشيرت قطن ناعم", "Soft Crew Tee", P(3735641), 520, { rating: 4.7, sold90: 44 }],
    ["warm-tone-tees", "shirts", "تيشيرت بألوان دافئة", "Warm Tone Tee", P(26601192), 590, { compareAtPrice: 690, rating: 4.5, sold90: 22 }],
    ["charcoal-crew-tee", "shirts", "تيشيرت فحمي", "Charcoal Crew Tee", P(8532638), 540, { rating: 4.6, sold90: 34 }],
    ["white-linen-shirts", "shirts", "قميص كتان أبيض", "White Linen Shirt", P(17281873), 1250, { rating: 4.9, sold90: 51 }],
    ["red-stripe-shirt", "shirts", "قميص مقلم أحمر", "Red Stripe Shirt", P(12955555), 1090, { rating: 4.7, sold90: 19 }],
    // Knitwear
    ["striped-mohair-knit", "knitwear", "بلوفر موهير مقلم", "Striped Mohair Knit", P(5603009), 1750, { rating: 4.8, sold90: 33 }],
    ["mustard-rib-sweater", "knitwear", "بلوفر مضلع بلون الخردل", "Mustard Rib Sweater", P(30263571), 1450, { isFeatured: true, rating: 4.9, sold90: 58 }],
    ["autumn-cable-cardigan", "knitwear", "كارديجان مضفّر رمادي", "Grey Cable Cardigan", P(19112315), 1890, { rating: 4.7, sold90: 27 }],
    ["caramel-twist-knit", "knitwear", "بلوفر كراميل", "Caramel Knit", P(14641423), 1390, { rating: 4.6, sold90: 24 }],
    ["oat-wool-sweater", "knitwear", "بلوفر صوف شوفاني", "Oat Wool Sweater", P(5789582), 1590, { rating: 4.7, sold90: 20 }],
    ["camel-knit-stack", "knitwear", "بلوفر مضلع جملي", "Camel Rib Sweater", P(30263575), 1690, { compareAtPrice: 1950, rating: 4.5, sold90: 15 }],
    ["stool-knit-bundle", "knitwear", "بلوفر صوف بني سميك", "Chunky Brown Sweater", P(5602996), 1790, { rating: 4.8, sold90: 13 }],
    ["berry-stripe-sweater", "knitwear", "بلوفر توتي مقلم", "Berry Stripe Sweater", P(12944791), 1290, { rating: 4.6, sold90: 22 }],
    // Outerwear
    ["camel-coats-copper-rail", "outerwear", "معطف جملي", "Camel Coat", P(10772702), 3900, { rating: 4.9, sold90: 41 }],
    ["waxed-field-jackets", "outerwear", "جاكيت شمع زيتي", "Waxed Field Jacket", P(5490207), 3200, { rating: 4.7, sold90: 25 }],
    ["trench-on-hooks", "outerwear", "معطف ترنش بيج", "Beige Trench Coat", P(7790205), 3600, { isFeatured: true, rating: 4.8, sold90: 36 }],
    ["shearling-collar-jacket", "outerwear", "جاكيت بياقة فرو", "Shearling Collar Jacket", P(8113000), 4200, { rating: 4.6, sold90: 17 }],
    ["pastel-hoodie-jackets", "outerwear", "جاكيت بقلنسوة بألوان هادئة", "Pastel Hooded Jacket", P(9594671), 1450, { rating: 4.5, sold90: 23 }],
    ["vintage-colour-jackets", "outerwear", "جاكيت ملون بطابع كلاسيكي", "Vintage Colour Jacket", P(9393922), 1650, { rating: 4.4, sold90: 11 }],
    ["sunlit-work-jacket", "outerwear", "جاكيت عمل كحلي", "Navy Work Jacket", P(15124231), 2100, { rating: 4.7, sold90: 19 }],
    ["studio-cream-blazer", "outerwear", "بليزر كريمي", "Cream Blazer", P(9218536), 2900, { compareAtPrice: 3300, rating: 4.8, sold90: 14 }],
    // Shoes
    ["cognac-heeled-boots", "shoes", "بوت كعب كونياك", "Cognac Heeled Boots", P(27658532), 2650, { rating: 4.8, sold90: 29 }],
    ["woven-mesh-slides", "shoes", "شبشب شبك منسوج", "Woven Mesh Slides", P(31451024), 890, { rating: 4.6, sold90: 33 }],
    ["handmade-leather-slippers", "shoes", "بابوج جلد يدوي", "Handmade Leather Slippers", P(12164656), 1100, { rating: 4.7, sold90: 21 }],
    ["tan-slingback-heels", "shoes", "صندل مفتوح الكعب عسلي", "Tan Slingback Heels", P(36581188), 1490, { rating: 4.5, sold90: 16 }],
    // Accessories
    ["leather-belt-set", "accessories", "حزام جلد طبيعي", "Natural Leather Belt", P(31959214), 590, { rating: 4.7, sold90: 30 }],
    ["quilted-zip-wallets", "accessories", "محفظة سوستة مبطنة", "Quilted Zip Wallet", P(22434780), 690, { rating: 4.6, sold90: 24 }],
    ["teal-satchel", "accessories", "حقيبة يد فيروزية", "Teal Satchel", P(4830923), 2900, { rating: 4.8, sold90: 18 }],
    ["buckle-belt-wall", "accessories", "حزام بإبزيم ملون", "Coloured Buckle Belt", P(35222039), 520, { rating: 4.5, sold90: 12 }],
  ],
});

export const FASHION_WARM = libraryTemplate({
  key: FASHION_WARM_KEY,
  version: 2,
  changelog: "Nawl v2: a products grid on the home",
  name: L("نَوْل", "Nawl"),
  description: L(
    "أزياء دافئة بروح المجلات: صورة كبيرة، حملة بصورة وأربعة صفوف للأقسام. لعلامات القطن والكتان والأعمال اليدوية.",
    "Warm, editorial fashion: a large hero photo, a campaign panel and four category rows. For cotton, linen and handmade labels.",
  ),
  category: "fashion",
  style: ["warm"],
  sortOrder: 1250,
  palette: ["#f5efe6", "#ebe1d3", "#9a4a2c", "#c79a6b"],
  colors: {
    primary: "#9a4a2c",
    secondary: "#ebe1d3",
    background: "#ffffff",
    foreground: "#2d241e",
    muted: "#6b5d52",
    border: "#ddd0bf",
    accent: "#c79a6b",
  },
  fonts: { heading: "Amiri", body: "Tajawal" },
  radius: 10,
  containerMaxWidth: 1360,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("حكايتنا", "Our story"), seo: { title: L("حكايتنا", "Our story") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("تواصل معنا", "Contact us"),
        text: L("تواصل معنا لأي سؤال عن منتج أو طلب.", "Contact us with any question about a product or an order."),
        heading: L("اسأل عن مقاس أو قطعة", "Ask about a size or a piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("القماش والمقاسات والعناية.", "Fabric, sizing and care."),
        question: L("كيف أغسل الكتان؟", "How do I wash linen?"),
        answer: L(
          "اغسله على ٣٠ درجة مقلوبًا وانشره في الظل. يصبح الكتان أنعم مع كل غسلة ولا يحتاج إلى كي كثير.",
          "Wash it inside out at 30°C and dry it in the shade. Linen softens with every wash and needs little ironing.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من عملاء نَوْل", "From Nawl customers"), related: L("قطع تناسبها", "Pieces that suit it") },
  },
});
