/**
 * Fashion Luxe (2026-10-28, fashion niche, premium / minimal): bone paper,
 * jet-black ink and a soft taupe, Reem Kufi headings over Noto Sans Arabic,
 * square corners and a wide 1400px container. A quiet atelier home: the
 * centred-logo ticker header, a background video of a clothes rail, the
 * ruled category index, tabbed best sellers, the atelier story beside a
 * full photo, four category rows with tall portrait frames, a slim ruled
 * newsletter and the centred links footer. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos and video: Pexels, each checked by eye at 2000px (2026-10-28):
 * garments on hangers and rails, folded knits, shoes and bags only, no
 * people or hands, no readable labels or brand lettering, none used twice
 * and none shared with the other two fashion templates.
 * Video 8580858 (poster: a rail with knits, loafers and a straw tote); about
 * 15945663, about page 5490979; tiles 20352727, 28321438, 7691347, 36553733,
 * 7887198, 35930907; products as listed in `DEMO`. At 2000px: knit tile
 * 9603630 (printed size tags) for 7691347; shirt 17315934 (size cube on the
 * hanger) for 250290; knit 7691347 (moved to the tile) for 30263569. Swapped from the curator's
 * list: dresses 15591288 (same gown as 15591289), 22598655 (a cross on the
 * table), 4716575 (handwritten hanger tag) for 10460442, 8459382, 23020995;
 * dress tile 30922972 (handwritten ribbon) for 20352727; shirts 12039633
 * (same tee as 12025472), 14459666 (printed logo), 13094233 (brand label)
 * for 2112648, 35750806, 36593273; knit 15667095 (a perfume bottle) for
 * 14641595; accessories 16739804, 38990554 (dial lettering), 33853704
 * (a hand), 9267583 (a printed card), 35666033 (embossed brand) for
 * 38339998, 6651193, 4164506; accessories tile 9267583 for 35930907.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const FASHION_LUXE_KEY = "fashion-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(FASHION_LUXE_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  heroVideo: pexelsVideo(8580858, "8580858-hd_1920_1080_30fps.mp4"),
  heroPoster: pexelsVideoPoster(8580858),
  boutique: pexels(15945663, 1200),
  rail: pexels(5490979, 1200),
  // Category tiles.
  catDresses: pexels(20352727, 1200),
  catShirts: pexels(28321438, 1200),
  catKnitwear: pexels(7691347, 1200),
  catOuterwear: pexels(36553733, 1200),
  catShoes: pexels(7887198, 1200),
  catAccessories: pexels(35930907, 1200),
};

const NAME = L("حرير", "Hareer");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("ادفع عند الاستلام", "Pay on delivery"),
    "استبدال سهل خلال ١٤ يوم": L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("الأتيليه", "Atelier"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-links", {
  text: {
    "م": L("ح", "H"),
    "اسم متجرك": NAME,
    "كل المنتجات": L("كل القطع", "All pieces"),
    "وصل حديثًا": L("وصل حديثًا", "New in"),
    "الأكثر مبيعًا": L("الأكثر طلبًا", "Best sellers"),
    "الشحن والتوصيل": L("الشحن والتوصيل", "Shipping"),
    "الاسترجاع والاستبدال": L("الاستبدال", "Exchanges"),
    "الأسئلة الشائعة": L("الأسئلة الشائعة", "FAQ"),
    "من نحن": L("عن حرير", "About"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ حرير. كل الحقوق محفوظة.", "© 2026 Hareer. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST], "https://wa.me/": "https://wa.me/201227409315" },
  // Phones: the links wrap, so a dot could end a line alone.
  nodes: { "فاصل": { mobile: { hidden: true } } },
});

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 35 } } },
    text: {
      "فيديو الواجهة": L("شماعة عليها تريكو وجنبها شنطة قش", "A rail of knits beside a straw tote"),
      "المجموعة الجديدة": L("مجموعة خريف ٢٠٢٦", "Autumn 2026"),
      "مساحتك، بطريقتك": L("أناقة هادية تعيش معاك", "Quiet pieces, made to last"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "قطن مصري، كتان مغسول وصوف ناعم. كل قطعة متفصلة في أتيليه حرير في جاردن سيتي.",
        "Egyptian cotton, washed linen and soft wool. Every piece is cut and sewn in our Garden City atelier.",
      ),
      "تسوّق الآن": L("اكتشف المجموعة", "Explore the edit"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  lib("categories-ruled", {
    text: {
      "الأقسام": L("الأقسام", "Departments"),
      "تسوق بالقسم": L("الدولاب كله في مكان واحد", "The whole wardrobe"),
      "منتج": L("قطع", "pieces"),
    },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-tabs-grid", {
    text: {
      "وصل حديثاً": L("القطع الأكثر طلبًا", "Most-loved pieces"),
      "الجديد": L("الأكثر طلبًا", "Best sellers"),
      "الأكثر مبيعاً": L("وصل حديثًا", "New in"),
      "الأعلى تقييمًا": L("الأعلى تقييمًا", "Top rated"),
    },
    links: { "/products?sort=newest": BEST, "/products?sort=popularity": NEW, "/products": BEST },
    lists: [{ source: "best-sellers" }],
    // Tablets: 4 columns, so the 8 best sellers fill two rows.
    nodes: { "المنتجات": { tablet: { columns: 4 } } },
  }),
  lib("about-fullbleed", {
    photo: [undefined, undefined, PHOTOS.boutique],
    text: {
      "صورة القصة": L("ركن في البوتيك بشماعات ومعطفين", "A boutique corner with a rail and two coats"),
      "حكايتنا": L("من ٢٠٠٩", "Since 2009"),
      "تفاصيل صغيرة تصنع الفرق": L("الخياطة هي الحكاية كلها", "It is all in the tailoring"),
      "بدأنا بفكرة بسيطة: منتجات نحب نستخدمها بنفسنا، بجودة نقدر نضمنها وسعر عادل. كل قطعة بنختارها بعناية وبنتابعها لحد ما توصلك.": L(
        "بدأنا أتيليه صغير في جاردن سيتي، ولسه بنقص ونخيط كل قطعة هناك. قماش مختار من المحلة، تشطيب يدوي وكميات قليلة من كل موديل.",
        "We began as a small Garden City atelier and still cut and sew every piece there: fabric from Mahalla, hand finishing and small runs of each style.",
      ),
      "اعرف أكثر": L("زور الأتيليه", "Visit the atelier"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("عرض الكل", "View all"),
    muted: [2, 4],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-ruled", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("شوف المجموعة الجديدة قبل الكل", "See each new collection first"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("رسالة واحدة في الشهر من الأتيليه.", "One letter a month from the atelier."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن حرير", "About Hareer"), L("ملابس متفصلة في القاهرة، من ٢٠٠٩.", "Clothes tailored in Cairo, since 2009.")),
  aboutStory(lib, {
    photo: PHOTOS.rail,
    alt: L("شماعة عليها قطع بألوان هادية", "A rail of pieces in muted tones"),
    eyebrow: L("الأتيليه", "The atelier"),
    title: L("قطع أقل، معمولة أحسن", "Fewer pieces, better made"),
    text: L("بنعمل مجموعتين في السنة بس، وكل موديل بيتخيط بكميات صغيرة عشان التشطيب يفضل مظبوط.", "We make two collections a year, and each style is sewn in small runs so the finish stays right."),
    more: L("وأي قطعة تحتاج تعديل في المقاس، بنظبطها في الأتيليه من غير مصاريف.", "Any piece that needs altering is adjusted at the atelier, free of charge."),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("ملابس متفصلة في القاهرة، من ٢٠٠٩.", "Clothes tailored in Cairo, since 2009."),
  categories: [
    ["dresses", "الفساتين", "Dresses", PHOTOS.catDresses],
    ["shirts", "القمصان والتيشيرتات", "Shirts", PHOTOS.catShirts],
    ["knitwear", "التريكو", "Knitwear", PHOTOS.catKnitwear],
    ["outerwear", "الجواكت والبالطوهات", "Outerwear", PHOTOS.catOuterwear],
    ["shoes", "الأحذية", "Shoes", PHOTOS.catShoes],
    ["accessories", "الإكسسوارات", "Accessories", PHOTOS.catAccessories],
  ],
  products: [
    // Dresses
    ["ruby-tulle-gown", "dresses", "فستان سهرة تول أحمر", "Ruby Tulle Gown", P(15591289), 12900, { isFeatured: true, rating: 4.9, sold90: 58 }],
    ["red-lace-dress", "dresses", "فستان دانتيل أحمر", "Red Lace Dress", P(6639264), 7800, { rating: 4.8, sold90: 36 }],
    ["ivory-off-shoulder", "dresses", "فستان أوف شولدر عاجي", "Ivory Off-Shoulder Dress", P(11813835), 9400, { compareAtPrice: 10900, rating: 4.7, sold90: 29 }],
    ["boho-summer-dresses", "dresses", "فستان صيفي بوهو", "Boho Summer Dress", P(10460442), 3200, { rating: 4.6, sold90: 41 }],
    ["satin-bridal-gown", "dresses", "فستان ساتان أبيض", "White Satin Gown", P(8459382), 18500, { rating: 5, sold90: 12 }],
    ["lace-sleeve-gown", "dresses", "فستان دانتيل بأكمام", "Lace Long-Sleeve Gown", P(37008324), 14200, { rating: 4.8, sold90: 17 }],
    ["strapless-ball-gown", "dresses", "فستان سواريه بدون حمالات", "Strapless Ball Gown", P(23020995), 16800, { rating: 4.7, sold90: 9, inStock: false }],
    ["vintage-lace-dress", "dresses", "فستان دانتيل فينتدج", "Vintage Lace Dress", P(3932950), 5600, { rating: 4.5, sold90: 21 }],
    // Shirts & tees
    ["essential-white-tee", "shirts", "تيشيرت قطن أبيض", "Essential White Tee", P(12025472), 690, { rating: 4.8, sold90: 84 }],
    ["rail-white-tee", "shirts", "تيشيرت أبيض مفصل", "Fitted White Tee", P(11671964), 750, { rating: 4.7, sold90: 46 }],
    ["washed-linen-shirt", "shirts", "قميص قطن ملون", "Cotton Colour Shirt", P(250290), 1850, { isFeatured: true, rating: 4.9, sold90: 63 }],
    ["white-shirt-edit", "shirts", "طقم قمصان بيضا", "White Shirt Edit", P(8306388), 1450, { rating: 4.6, sold90: 22 }],
    ["noir-cotton-tee", "shirts", "تيشيرت قطن أسود", "Noir Cotton Tee", P(8532616), 690, { rating: 4.8, sold90: 52 }],
    ["stone-crew-tees", "shirts", "تيشيرت رقبة مدورة حجري", "Stone Crew Tee", P(2112648), 720, { compareAtPrice: 850, rating: 4.5, sold90: 31 }],
    ["mixed-weave-shirts", "shirts", "قميص كاروه قطن", "Cotton Check Shirt", P(35750806), 1290, { rating: 4.6, sold90: 19 }],
    ["poplin-shirt-houndstooth", "shirts", "قميص بوبلين أبيض", "White Poplin Shirt", P(36593273), 1590, { rating: 4.7, sold90: 14 }],
    // Knitwear
    ["cream-caramel-knit", "knitwear", "بلوفر كريمي وكراميل", "Cream & Caramel Knit", P(14642651), 2400, { rating: 4.8, sold90: 39 }],
    ["cable-knit-stack", "knitwear", "بلوفر ضفاير صوف", "Cable Knit Sweater", P(13889763), 2650, { isFeatured: true, rating: 4.9, sold90: 71 }],
    ["wrap-rib-cardigan", "knitwear", "كارديجان ريب بحزام", "Belted Rib Cardigan", P(10296683), 2900, { rating: 4.7, sold90: 27 }],
    ["chunky-cream-sweater", "knitwear", "بلوفر كريمي تقيل", "Chunky Cream Sweater", P(14641430), 2350, { compareAtPrice: 2750, rating: 4.6, sold90: 33 }],
    ["basket-knits", "knitwear", "طقم بلوفرات ناعمة", "Soft Knit Trio", P(5789591), 3900, { rating: 4.5, sold90: 15 }],
    ["v-neck-cardigan", "knitwear", "كارديجان رقبة V", "V-Neck Cardigan", P(9603627), 2200, { rating: 4.7, sold90: 24 }],
    ["toffee-rib-stack", "knitwear", "بلوفر ريب توفي", "Toffee Rib Sweater", P(30263569), 2100, { rating: 4.6, sold90: 18 }],
    ["bobble-knit-cardigan", "knitwear", "كارديجان بنقوش بارزة", "Bobble Knit Cardigan", P(14641595), 2750, { rating: 4.8, sold90: 12 }],
    // Outerwear
    ["cream-linen-blazer", "outerwear", "بليزر كتان كريمي", "Cream Linen Blazer", P(32427323), 4900, { rating: 4.9, sold90: 66 }],
    ["white-summer-blazer", "outerwear", "بليزر صيفي أبيض", "White Summer Blazer", P(30005364), 4600, { rating: 4.7, sold90: 28 }],
    ["cobalt-evening-jacket", "outerwear", "جاكيت سهرة أزرق", "Cobalt Evening Jacket", P(4259798), 5800, { compareAtPrice: 6500, rating: 4.6, sold90: 16 }],
    ["oatmeal-wool-coat", "outerwear", "بالطو صوف شوفاني", "Oatmeal Wool Coat", P(4268528), 6900, { isFeatured: true, rating: 4.8, sold90: 37 }],
    ["camel-overcoat", "outerwear", "بالطو جملي طويل", "Camel Overcoat", P(10838789), 7400, { rating: 4.9, sold90: 44 }],
    ["forest-tailored-blazer", "outerwear", "بليزر أخضر غامق", "Forest Tailored Blazer", P(35865086), 5200, { rating: 4.7, sold90: 20 }],
    ["noir-long-coat", "outerwear", "بالطو أسود طويل", "Noir Long Coat", P(1853988), 6600, { rating: 4.5, sold90: 11 }],
    ["tangerine-blazer", "outerwear", "بليزر برتقالي", "Tangerine Blazer", P(3093408), 4300, { rating: 4.6, sold90: 13 }],
    // Shoes
    ["tan-cap-toe-oxfords", "shoes", "حذاء أكسفورد عسلي", "Tan Cap-Toe Oxfords", P(12210270), 3200, { rating: 4.8, sold90: 57 }],
    ["chestnut-derbies", "shoes", "حذاء ديربي كستنائي", "Chestnut Derbies", P(33039735), 3450, { rating: 4.7, sold90: 23 }],
    ["black-wingtips", "shoes", "حذاء بروج أسود", "Black Wingtip Brogues", P(15557045), 3600, { rating: 4.9, sold90: 30 }],
    ["espresso-perforated-derby", "shoes", "حذاء ديربي مخرم بني", "Perforated Espresso Derby", P(9992898), 2950, { rating: 4.6, sold90: 18 }],
    // Accessories
    ["teal-top-handle-bag", "accessories", "شنطة يد تيل", "Teal Top-Handle Bag", P(4830924), 3800, { rating: 4.8, sold90: 49 }],
    ["straw-bow-hat", "accessories", "برنيطة قش بفيونكة", "Straw Hat with Bow", P(38339998), 950, { rating: 4.7, sold90: 26 }],
    ["leather-wallet-pair", "accessories", "محفظة جلد طبيعي", "Leather Wallet", P(6651193), 1150, { rating: 4.6, sold90: 22 }],
    ["saddle-leather-belts", "accessories", "حزام جلد سرج", "Saddle Leather Belt", P(4164506), 890, { rating: 4.5, sold90: 15 }],
  ],
});

export const FASHION_LUXE = libraryTemplate({
  key: FASHION_LUXE_KEY,
  version: 1,
  name: L("حرير", "Hareer"),
  description: L(
    "أزياء راقية بهدوء: فيديو لشماعة الموسم، فهرس أقسام وأربع صفوف بصور طولية. لبوتيكات الملابس الراقية.",
    "Quiet luxury fashion: a video of the season's rail, a ruled category index and four rows of tall photos. For premium clothing boutiques.",
  ),
  category: "fashion",
  sortOrder: 1230,
  palette: ["#f7f6f3", "#ecebe6", "#161616", "#a08c72"],
  colors: {
    primary: "#161616",
    secondary: "#ecebe6",
    background: "#f7f6f3",
    foreground: "#141414",
    muted: "#64615c",
    border: "#dcdad3",
    accent: "#a08c72",
  },
  fonts: { heading: "Reem Kufi", body: "Noto Sans Arabic" },
  radius: 0,
  containerMaxWidth: 1400,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن حرير", "About"), seo: { title: L("عن حرير", "About Hareer") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زورنا في الأتيليه", "Visit the atelier"),
        text: L(
          `١٨ شارع أحمد باشا، جاردن سيتي، القاهرة، ${phone("+20 122 740 9315")}، ${handle("atelier@hareer.eg")}`,
          `18 Ahmed Pasha St, Garden City, Cairo | ${phone("+20 122 740 9315")} | ${handle("atelier@hareer.eg")}`,
        ),
        heading: L("احجز ميعاد قياس", "Book a fitting"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("المقاسات والتعديل والاستبدال.", "Sizing, alterations and exchanges."),
        question: L("لو المقاس مش مظبوط أعمل إيه؟", "What if the size is not right?"),
        answer: L(
          "تقدر تستبدل المقاس خلال ١٤ يوم، أو تعدي على الأتيليه ونظبط القطعة عليك من غير مصاريف.",
          "Exchange the size within 14 days, or drop by the atelier and we will alter the piece to fit, free of charge.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    surface: "flat",
    band: "paper",
    extras: ["product-perks"],
    copy: { reviews: L("آراء عميلاتنا", "What our clients say"), related: L("قطع تكمّل اللوك", "Complete the look") },
  },
});
