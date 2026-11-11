/**
 * Perfumes Bold (perfumes niche, bold): white paper, oxblood red and a bright
 * saffron gold, Alexandria headings over Tajawal, 12px corners and a 1320px
 * container.
 *
 * v2 (look-first pilot, 2026-11-11, ROADMAP F-89, docs/systems/plan.md §10):
 * one shoot of pale studio packshots on a product stage, and a home that
 * alternates products with photo-led breaks. Home (9 sections):
 *   1. `hero-video`: the crystal-capped bottle video, lighter dim
 *   2. `categories-photo-tiles`: five warm portrait tiles
 *   3. `products-rail`: best sellers, two rows of four
 *   4. `about-product-anatomy`: one bottle with three note dots (cap, juice,
 *      glass base); the template's signature section
 *   5. `products-category-carousel`: the first category (women)
 *   6. `about-two-tone`: the ingredients story on the oxblood, `reveal-scrub`
 *   7. `products-spotlight`: a tall tile beside the three newest (the attars)
 *   8. `features-icon-cards`: delivery, cash on delivery, exchange, WhatsApp
 *   9. `newsletter-big`
 * Header `header-announcement`, footer `footer-signoff`. Scroll effects: the
 * hero's `fade-exit` and the two-tone's `reveal-scrub` (two per page at most).
 * Built from section library designs (`fromLibrary`); `tweak` sets what a
 * patch cannot reach by layer label (each dot's place, the anatomy photo's
 * ratio, the tile columns).
 *
 * Photos and video: Pexels, checked 2026-11-11, white-studio packshots for
 * the products; no people, no brand names, none used twice. Video 8447362
 * (file 8447362-uhd_2732_1440_25fps.mp4) with its poster. Category tiles:
 * women 40618550, men 8789603, oud 11435366, home 7795826, gifts 36482359.
 * Anatomy 20419734 (dots at the cap 49/15, the juice 50/58, the base 50/85).
 * Two-tone 10487658 (saffron). Spotlight tile 8284238. About page 8450207.
 * Products are listed in DEMO.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import type { NodeTemplate } from "../../elements/tree";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, pexelsVideo, pexelsVideoPoster, phone } from "../library-template";

export const PERFUMES_BOLD_KEY = "perfumes-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PERFUMES_BOLD_KEY, getDesign(id)!, { corners: 12, ...patch });

const mapTree = (node: NodeTemplate, fn: (node: NodeTemplate) => NodeTemplate): NodeTemplate => {
  const next = fn(node);
  return { ...next, children: next.children?.map((child) => mapTree(child, fn)) };
};

/**
 * A library copy with values a patch cannot name: nodes that share one layer
 * label (the anatomy dots) or have none (its photo). Props and styles only,
 * never the structure, so the section still stores as a library ref.
 */
const tweak = (design: Design, fn: (node: NodeTemplate) => NodeTemplate): Design => ({ ...design, tree: (t) => mapTree(design.tree(t), fn) });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const WHATSAPP = "https://wa.me/201098436215";

/**
 * A packshot cropped to the 3:4 product stage on its subject (the photo
 * host's focal-point crop): `x` / `y` are where the bottle sits in the photo
 * (0–1) and `z` zooms in on a small one, so the grid reads as one shoot.
 */
const P = (id: number, x = 0.5, y = 0.5, z = 1) => `${pexels(id, 800)}&h=1067&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${z}`;
const PHOTOS = {
  heroVideo: pexelsVideo(8447362, "8447362-uhd_2732_1440_25fps.mp4"),
  heroPoster: pexelsVideoPoster(8447362),
  anatomy: pexels(20419734, 1200),
  saffron: pexels(10487658, 1280),
  spotlight: pexels(8284238, 1200),
  aboutPage: pexels(8450207, 1200),
  // Category tiles.
  catWomen: pexels(40618550, 900),
  catMen: pexels(8789603, 900),
  catOud: pexels(11435366, 900),
  catHome: pexels(7795826, 900),
  catGifts: pexels(36482359, 900),
};

const NAME = L("شذا", "Shaza");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("توصيل لكل محافظات مصر · استبدال خلال ١٤ يوم", "Delivery across Egypt · 14-day exchange"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("ش", "S"),
    "اسم متجرك": NAME,
    "المتجر": L("كل العطور", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّع طلبك", "Track order"),
    "من نحن": L("عن شذا", "About"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("سيب أثر في كل مكان تدخله", "Leave a trail wherever you go"),
    "كلمنا على واتساب": L("اسألنا على واتساب", "Ask us on WhatsApp"),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل العطور", "All fragrances"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الاستبدال والاسترجاع", "Exchanges & refunds"),
    "من نحن": L("عن شذا", "About Shaza"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ شذا. كل الحقوق محفوظة.", "© 2026 Shaza. All rights reserved."),
  },
  links: { "https://wa.me/": WHATSAPP, "/products": [SHOP, NEW, BEST, RATED] },
});

/** The anatomy dots, in tree order: percent from the photo's left and top (the fourth is hidden). */
const DOTS = [
  { x: 49, y: 15 },
  { x: 50, y: 58 },
  { x: 50, y: 85 },
] as const;

function anatomy(): Design {
  // Counts the dots of one build; reset at the section root, since a design's tree is built many times.
  let dot = 0;
  return tweak(
    lib("about-product-anatomy", {
      photo: [undefined, PHOTOS.anatomy],
      text: {
        "التفاصيل": L("جوّه الزجاجة", "Inside the bottle"),
        "اللي بيفرق في كل جزء": L("كل جزء في الزجاجة له شغلانة", "Every part of the bottle has a job"),
        "دوس على أي نقطة في الصورة وشوف تفاصيل الجزء ده.": L("دوس على أي نقطة وشوف إيه اللي بيخلّي العطر يعيش.", "Tap a dot to see what makes the scent last."),
        "صورة المنتج": L("زجاجة عطر أزرق بغطا أسود على خلفية رمادي فاتح", "A blue perfume bottle with a black cap on a pale grey backdrop"),
        "الخامة": L("الغطا والبخّاخ", "Cap & atomiser"),
        "خامة متينة تستحمل الاستخدام اليومي.": L(
          "غطا تقيل بيقفل بإحكام، وتحته بخّاخ ناعم بيطلّع رذاذ خفيف ومتوزّع من غير تنقيط.",
          "A weighted cap that shuts tight over a fine-mist atomiser: an even cloud, never a drip.",
        ),
        "التشطيب": L("العطر نفسه", "The juice"),
        "تشطيب نضيف في كل تفصيلة، من أول نظرة.": L(
          "أو دو بارفان بتركيز ٢٠٪: بيعيش من ٨ لـ ١٢ ساعة على الجلد، وأكتر على الهدوم.",
          "Eau de parfum at 20% concentration: 8 to 12 hours on skin, longer on clothes.",
        ),
        "المقاس": L("القاعدة الزجاج", "The glass base"),
        "مقاس عملي يناسب أغلب الاستخدامات.": L(
          "زجاج سميك بقاعدة تقيلة: الزجاجة ثابتة على التسريحة، والعطر محمي من الحرارة.",
          "Thick glass on a heavy base: steady on the dresser, and it shields the scent from heat.",
        ),
      },
      nodes: { "الصورة": { style: { maxWidth: "460px" } } },
    }),
    (node) => {
      if (node.type === "section") dot = 0;
      if (node.type === "image") return { ...node, style: { ...node.style, aspectRatio: "portrait" }, breakpointStyles: { ...node.breakpointStyles, mobile: { ...node.breakpointStyles?.mobile, aspectRatio: "portrait" } } };
      if (node.type !== "hotspot") return node;
      const at = DOTS[dot++];
      return at ? { ...node, props: { ...node.props, x: at.x, y: at.y } } : { ...node, style: { ...node.style, hidden: true }, breakpointStyles: { tablet: { hidden: true }, mobile: { hidden: true } } };
    },
  );
}

const home: Design[] = [
  lib("hero-video", {
    photo: [PHOTOS.heroPoster],
    nodes: { "الفيديو": { props: { url: PHOTOS.heroVideo } }, "التعتيم": { style: { opacity: 28 } } },
    text: {
      "فيديو الواجهة": L("زجاجة عطر بغطا كريستال جنب فازة زهور على حيطة حمرا", "A crystal-capped perfume bottle beside a vase of flowers against a red wall"),
      "المجموعة الجديدة": L("مجموعة الليل", "The After Dark collection"),
      "مساحتك، بطريقتك": L("ريحتك أول حاجة بتوصل", "Your scent arrives before you do"),
      "قطع مختارة بعناية، وتوصيل سريع لحد باب البيت.": L(
        "عطور بتركيز عالي بتفضل معاك طول اليوم، من العود للعنبر للورد البلدي.",
        "High-concentration fragrances that stay with you all day, from oud to amber to Egyptian rose.",
      ),
      "تسوّق الآن": L("تسوّق المجموعة", "Shop the collection"),
      "شوف الجديد": L("وصل حديثًا", "New in"),
    },
    links: { "/products": SHOP, "/products?sort=newest": NEW },
  }),
  tweak(
    lib("categories-photo-tiles", {
      text: { "تسوّق حسب القسم": L("اختار على مزاجك", "Shop by mood") },
      lists: [{ limit: 5 }],
    }),
    (node) =>
      node.type === "categoryList"
        ? {
            ...node,
            // Five tiles: one row on desktop and tablets, a swipe row on phones (a 2-column grid would orphan the fifth).
            props: { ...node.props, mobileRail: true },
            style: { ...node.style, columns: 5, gap: 16 },
            breakpointStyles: { ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, columns: 5, gap: 12 } },
          }
        : node,
  ),
  // A real two-column grid on phones (the rail's swipe row shows one card and a half there).
  tweak(
    lib("products-rail", {
      text: {
        "بيحبوها": L("اللي الكل بيسأل عليه", "The ones everyone asks about"),
        "الأكثر مبيعًا": L("الأكثر مبيعًا", "Best sellers"),
        "عرض الكل": L("عرض الكل", "View all"),
      },
      links: { "/products": BEST },
    }),
    // Four across on tablets too, so eight products never leave a short last row.
    (node) =>
      node.type === "productList"
        ? { ...node, props: { ...node.props, mobileRail: false }, breakpointStyles: { ...node.breakpointStyles, tablet: { ...node.breakpointStyles?.tablet, columns: 4, gap: 16 } } }
        : node,
  ),
  anatomy(),
  // The first category (women): its four leading products in one row (the demo has six, and a row never ends short).
  lib("products-category-carousel", {
    as: "category-row-1",
    text: { "عرض الكل": L("شوف الكل", "See all") },
    lists: [{ offset: 0 }, { categoryIndex: 1, limit: 4 }],
  }),
  lib("about-two-tone", {
    photo: [undefined, undefined, PHOTOS.saffron],
    text: {
      "صناعة مصرية": L("المكوّنات", "The ingredients"),
      "متعمول عشان يريّحك ويعيش معاك": L("زعفران، ورد وعود. من غير اختصارات", "Saffron, rose and oud. No shortcuts"),
      "خامات مختارة وتفاصيل متشطبة بإيدينا، عشان تفضل معاك سنين.": L(
        "بنختار الخامة الأول وبعدين نبني عليها العطر: زعفران حقيقي، ورد بلدي مجفف ودهن عود معتّق.",
        "We pick the raw material first, then build the scent around it: real saffron, dried Egyptian rose and aged oud oil.",
      ),
      "تسوّق الآن": L("اعرف حكايتنا", "Our story"),
      "صورة البانر": L("خيوط زعفران حمرا في معلقة خشب", "Red saffron threads in a wooden spoon"),
    },
    links: { "/products": "/about" },
  }),
  lib("products-spotlight", {
    photo: [undefined, undefined, PHOTOS.spotlight],
    text: {
      "صورة المجموعة": L("زجاجتين عنبري على قماش دافي في ضوء دهبي", "Two amber bottles on warm fabric in golden light"),
      "مجموعة": L("وصل حديثًا", "New in"),
      "مجموعة الموسم": L("العطور الزيتية والعود", "Attars & oud oils"),
      "قطع مختارة بعناية، بخامات حلوة وتفاصيل هادية.": L("نقطة واحدة تكفي. زيوت مركّزة من غير كحول، في قوارير زجاج.", "One drop is enough. Concentrated oils with no alcohol, in glass bottles."),
      "تسوّق المجموعة": L("تسوّق الجديد", "Shop new in"),
      "من المجموعة": L("آخر ما نزل", "Just landed"),
      "عرض الكل": L("عرض الكل", "View all"),
    },
    links: { "/products": NEW },
  }),
  lib("features-icon-cards", {
    text: {
      "لماذا تشتري منا": L("ليه شذا", "Why Shaza"),
      "تسوّق وأنت مطمئن": L("اطلب وانت مطمّن", "Order with peace of mind"),
      "توصيل سريع": L("توصيل لكل المحافظات", "Delivery across Egypt"),
      "من يوم إلى ٤ أيام لكل المحافظات": L("من يومين لـ ٤ أيام، والزجاجة متغلّفة ضد الكسر", "2 to 4 days, packed so the bottle arrives whole"),
      "أو ادفع بالبطاقة والمحفظة": L("افتح الطرد وادفع وانت مستلم", "Pay when the parcel reaches you"),
      "استرجاع سهل": L("استبدال خلال ١٤ يوم", "14-day exchange"),
      "١٤ يومًا لتغيّر رأيك": L("طالما الزجاجة لسه مقفولة", "As long as the bottle is still sealed"),
      "دعم على واتساب": L("محتار؟ نرشّحلك", "Not sure? We’ll pick with you"),
      "أشخاص حقيقيون طوال الأسبوع": L("قولنا بتحب إيه على واتساب", "Tell us what you like on WhatsApp"),
    },
  }),
  lib("newsletter-big", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("اعرف الريحة الجديدة قبل الكل", "Smell the next drop first"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L("إيميل واحد في الأسبوع بالعطور الجديدة ونصيحة تخلّي عطرك يعيش أطول.", "One email a week with new scents and a tip to make yours last longer."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن شذا", "About Shaza"), L("عطور تركيز عالي، متركّبة في مصر الجديدة.", "High-concentration fragrances, blended in Heliopolis.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("طاولة تركيب العطور بزجاجات عنبرية ومكونات طبيعية", "A perfume-making table with amber bottles and natural ingredients"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("العطر لازم يتحس من أول رشّة", "A scent should be felt from the first spray"),
    text: L(
      "بدأنا بعطر عود واحد بعناه لأصحابنا، وطلبوه تاني بعد أسبوع. من ساعتها وإحنا بنعمل عطور جريئة وثابتة بسعر معقول.",
      "We started with one oud fragrance sold to friends, who ordered it again a week later. We have made bold, long-lasting scents at fair prices ever since.",
    ),
    more: L("كل زجاجة بتتعبّى وتتغلّف في معملنا بمصر الجديدة، وبتوصلك في علبة تستاهل تتهادى.", "Every bottle is filled and packed in our Heliopolis lab and arrives in a box worth gifting."),
    button: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("عطور تركيز عالي، متركّبة في مصر الجديدة.", "High-concentration fragrances, blended in Heliopolis."),
  categories: [
    ["womens-perfumes", "عطور حريمي", "Women", PHOTOS.catWomen],
    ["mens-perfumes", "عطور رجالي", "Men", PHOTOS.catMen],
    ["oud-attars", "العود والزيوت", "Oud & oils", PHOTOS.catOud],
    ["home-fragrance", "البيت والبخور", "Home & incense", PHOTOS.catHome],
    ["gift-sets", "الهدايا والميني", "Gifts & minis", PHOTOS.catGifts],
  ],
  // Newest first in the order written: the three attars lead "New in" (the spotlight).
  products: [
    // Oud & oils
    ["ornate-glass-attar", "oud-attars", "قارورة عطر زجاج مزخرف ١٢ مل", "Ornate Glass Attar Bottle 12ml", P(36389336), 2650, { isFeatured: true, rating: 4.9, sold90: 128 }],
    ["dropper-oud-oil", "oud-attars", "دهن عود بالقطّارة ١٠ مل", "Dropper Oud Oil 10ml", P(8054398), 2400, { rating: 4.8, sold90: 96 }],
    ["blue-glass-attar", "oud-attars", "قارورة عطر زجاج أزرق ٦ مل", "Blue Glass Attar Bottle 6ml", P(36389333), 1450, { rating: 4.7, sold90: 41 }],
    ["amber-oud-oil", "oud-attars", "دهن عود كهرمان ٣٠ مل", "Amber Oud Oil 30ml", P(8054396), 2950, { compareAtPrice: 3300, rating: 4.8, sold90: 38 }],
    ["amber-oil-5ml", "oud-attars", "زيت عنبر ٥ مل", "Amber Oil 5ml", P(6915311, 0.5, 0.5, 1.4), 1250, { rating: 4.6, sold90: 29 }],
    ["vintage-amber-bottle", "oud-attars", "زجاجة العنبر العتيقة ٥٠ مل", "Vintage Amber Bottle 50ml", P(5978582), 1850, { rating: 4.7, sold90: 33 }],
    // Women
    ["rouge-sensation-edp", "womens-perfumes", "روج سنسيشن ٥٠ مل", "Rouge Sensation EDP 50ml", P(32630384), 2150, { isFeatured: true, rating: 4.9, sold90: 142 }],
    ["pearl-clear-edp", "womens-perfumes", "بيرل كلير ١٠٠ مل", "Pearl Clear EDP 100ml", P(15574229, 0.62, 0.5, 1), 1750, { rating: 4.8, sold90: 104 }],
    ["dried-rose-edp", "womens-perfumes", "ورد مجفف ٧٥ مل", "Dried Rose EDP 75ml", P(1190829, 0.3, 0.5, 1), 2250, { rating: 4.8, sold90: 88 }],
    ["rose-duo-mist-set", "womens-perfumes", "سيت رشّاشين وردي", "Rose Duo Mist Set", P(36437999, 0.42, 0.5, 1), 1450, { rating: 4.7, sold90: 76 }],
    ["seashell-star-edp", "womens-perfumes", "نجمة الصدف ٣٠ مل", "Seashell Star EDP 30ml", P(16266295, 0.5, 0.6, 1.5), 1250, { rating: 4.6, sold90: 52 }],
    ["rose-petal-edp", "womens-perfumes", "روز بيتال ٥٠ مل", "Rose Petal EDP 50ml", P(32645088, 0.5, 0.6, 1.4), 1850, { rating: 4.5, sold90: 27, inStock: false }],
    // Men
    ["mahogany-amber-edp", "mens-perfumes", "ماهوجني عنبر ١٠٠ مل", "Mahogany Amber EDP 100ml", P(4735929, 0.5, 0.6, 1.3), 2150, { isFeatured: true, rating: 4.9, sold90: 117 }],
    ["black-oud-edt", "mens-perfumes", "عود أسود ٥٠ مل", "Black Oud EDT 50ml", P(6800931, 0.5, 0.62, 2.6), 1650, { rating: 4.7, sold90: 44 }],
    ["desert-night-edt", "mens-perfumes", "ليل الصحرا ٥٠ مل", "Desert Night EDT 50ml", P(6801173, 0.72, 0.55, 2.3), 1650, { rating: 4.6, sold90: 36 }],
    ["mens-body-mist", "mens-perfumes", "بودي مست رجالي ١٠٠ مل", "Men’s Body Mist 100ml", P(6801177, 0.35, 0.5, 2.2), 990, { rating: 4.5, sold90: 31 }],
    ["frost-cork-edt", "mens-perfumes", "فروست كورك ١٠٠ مل", "Frost Cork EDT 100ml", P(8776570, 0.52, 0.6, 2.2), 1450, { rating: 4.5, sold90: 22 }],
    // Home scents & incense
    ["amber-bottle-diffuser", "home-fragrance", "معطّر الزجاجة العنبري ٢٠٠ مل", "Amber Bottle Diffuser 200ml", P(8313229), 790, { rating: 4.8, sold90: 81 }],
    ["clear-glass-diffuser", "home-fragrance", "معطّر الزجاج الشفاف", "Clear Glass Diffuser", P(18987029), 890, { rating: 4.7, sold90: 47 }],
    ["room-spray-150ml", "home-fragrance", "معطّر غرف ١٥٠ مل", "Room Spray 150ml", P(15766704), 520, { rating: 4.6, sold90: 43 }],
    ["grey-pillar-candle", "home-fragrance", "شمعة رمادي", "Grey Pillar Candle", P(6800787, 0.5, 0.6, 1.4), 390, { rating: 4.6, sold90: 34 }],
    ["white-candle-marble", "home-fragrance", "شمعة بيضا على رخام", "White Candle on Marble", P(7815528, 0.5, 0.65, 1.4), 450, { rating: 4.7, sold90: 39 }],
    ["marble-incense-dish", "home-fragrance", "طبق بخور رخام", "Marble Incense Dish", P(17840019), 690, { rating: 4.8, sold90: 49 }],
    ["palo-santo-dish", "home-fragrance", "طبق بالو سانتو سيراميك", "Ceramic Palo Santo Dish", P(5706231, 0.7, 0.55, 1.3), 590, { rating: 4.5, sold90: 19 }],
    ["cat-incense-holder", "home-fragrance", "حامل بخور القطة", "Cat Incense Holder", P(15580445), 450, { rating: 4.7, sold90: 26 }],
    // Gifts & minis
    ["black-gift-box-set", "gift-sets", "طقم علب الهدايا السودا", "Black Gift Box Set", P(4271698, 0.58, 0.5, 1), 3250, { rating: 4.8, sold90: 28 }],
    ["black-gift-box-tower", "gift-sets", "برج علب الهدايا السودا", "Black Gift Box Tower", P(4271695), 2950, { rating: 4.8, sold90: 24 }],
    ["black-box-collection", "gift-sets", "مجموعة العلب السودا", "Black Box Collection", P(4271699), 2450, { rating: 4.7, sold90: 18 }],
    ["large-black-gift-box", "gift-sets", "علبة هدية سودا كبيرة", "Large Black Gift Box", P(4271697), 3950, { rating: 4.9, sold90: 16 }],
    ["four-roll-ons-set", "gift-sets", "طقم ٤ رول أون", "Four Roll-ons Set", P(6707556), 990, { rating: 4.7, sold90: 58 }],
    ["five-amber-roll-ons", "gift-sets", "طقم ٥ رول أون عنبري", "Five Amber Roll-ons", P(6693894), 1250, { rating: 4.6, sold90: 32 }],
    ["dried-flower-cork-vial", "gift-sets", "قارورة فلّين بزهور مجففة", "Dried Flower Cork Vial", P(8090382), 450, { rating: 4.5, sold90: 21 }],
    ["glass-sample-vial", "gift-sets", "عيّنة زجاج ٣ مل", "Glass Sample Vial 3ml", P(5922087, 0.47, 0.78, 3), 190, { rating: 4.6, sold90: 37 }],
  ],
});

export const PERFUMES_BOLD = libraryTemplate({
  key: PERFUMES_BOLD_KEY,
  version: 2,
  name: L("شذا", "Shaza"),
  description: L(
    "عطور جريئة: فيديو في الواجهة، صور أقسام دافية، زجاجة بتفاصيلها على الصورة، وكل المنتجات بشكل تصوير واحد.",
    "Bold fragrances: a video hero, warm category tiles, one bottle explained dot by dot, and every product framed as one shoot.",
  ),
  category: "beauty",
  style: ["bold"],
  sortOrder: 1390,
  palette: ["#ffffff", "#f7ecee", "#8c1230", "#d9a425"],
  colors: {
    primary: "#8c1230",
    secondary: "#f7ecee",
    background: "#ffffff",
    foreground: "#170c10",
    muted: "#5f5258",
    border: "#ecd9de",
    accent: "#d9a425",
  },
  fonts: { heading: "Alexandria", body: "Tajawal" },
  radius: 12,
  containerMaxWidth: 1320,
  productStage: { ratio: "3:4", fit: "cover", background: "#f1efee" },
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن شذا", "About"), seo: { title: L("عن شذا", "About Shaza") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L(`٣٥ شارع الأهرام، مصر الجديدة، القاهرة · ${phone("٠١٠٩ ٨٤٣ ٦٢١٥")} · ${handle("hello@shaza.eg")}`, "35 El Ahram St, Heliopolis, Cairo · +20 109 843 6215 · hello@shaza.eg"),
        heading: L("محتار تختار إيه؟ قولنا بتحب إيه", "Not sure what to pick? Tell us what you like"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الثبات والتوصيل والاستبدال.", "Longevity, delivery and exchanges."),
        question: L("العطر بيثبت قد إيه؟", "How long does the scent last?"),
        answer: L(
          "عطورنا تركيزها ٢٠٪، فبتعيش من ٨ لـ ١٢ ساعة على الجلد وأكتر على الهدوم. ولو مش عاجبك استبدله خلال ١٤ يوم طالما الزجاجة مقفولة.",
          "Our fragrances are 20% concentrate, lasting 8 to 12 hours on skin and longer on clothes. Exchange any sealed bottle within 14 days.",
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
    copy: { reviews: L("قالوا عن ريحتنا", "What they said about it"), related: L("هتحبه برضه", "You’ll love these too") },
  },
});
