/**
 * Grocery Warm (2026-10-28, grocery & food niche, warm / farm-to-table):
 * wheat paper, terracotta brown and olive, Aref Ruqaa headings over Almarai,
 * soft 12px corners and a 1360px container. A slow, farm-shop home: the
 * centred-logo header with a scrolling ticker, one wide photo of an olive
 * grove over a harvest-day strip, the first aisle as a big photo beside a
 * ruled list of the others, best sellers in classic cards, the bakery story
 * overlapping a photo, four category rows with 4:3 photos, a photo
 * newsletter card and the classic footer. Built from section library
 * designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-28): food on dark wood and
 * stone, no people or hands, no labels or brands, none used twice. Hero:
 * 38928225 (olive grove). Scenes: 35993723 (bread shelves, home story),
 * 35042437 (honey jars and honeycomb, about page), 28039613 (fruit tree,
 * newsletter). Tiles: 3084068, 34973888, 27304312, 37978583 (nuts and dried
 * fruit bowl, replaces 35042439, which repeated the about-page scene),
 * 8287394, 30497987. Products: listed in `DEMO` below; QA 2026-10-28 replaced
 * 5199274 (a sign), 15841781 (lettering behind) and 5590958 (embossed jar).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels, phone } from "../library-template";

export const GROCERY_WARM_KEY = "grocery-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GROCERY_WARM_KEY, getDesign(id)!, { corners: 12, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(38928225, 1920),
  breadShelves: pexels(35993723, 1200),
  honeyTable: pexels(35042437, 1200),
  newsletter: pexels(28039613, 1200),
  // Category photos.
  catFruits: pexels(3084068, 1200),
  catVegetables: pexels(34973888, 1200),
  catBakery: pexels(27304312, 1200),
  catPantry: pexels(37978583, 1200),
  catDairy: pexels(8287394, 1200),
  catCoffee: pexels(30497987, 1200),
};

const NAME = L("غيط", "Gheit");

/** A phone number that keeps its digit groups in order and on one line. */
const tel = (number: string) => phone(number).replace(/ /g, "\u00a0");

const header = lib("header-centered-ticker", {
  text: {
    "توصيل لكل محافظات مصر": L("من غيطنا في الفيوم لبيتك في القاهرة", "From our Fayoum farm to your Cairo home"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "استبدال سهل خلال ١٤ يوم": L("تتبّع طلبك من صفحة طلباتي", "Track your order from My orders"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("حصاد الأسبوع", "This week’s harvest"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تتبّع طلبك", "Track order"),
  },
  links: { "/products": [undefined, undefined, NEW], "/blog": BEST, "/contact": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L("خضار وفاكهة من غيطنا، وعيش وعسل وجبن من جيرانا في الفيوم.", "Produce from our farm, with bread, honey and cheese from our Fayoum neighbours."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل المنتجات", "All products"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(tel("٠١١٢ ٥٨٣ ٤٠٦٧"), tel("+20 112 583 4067")),
    "‏hello@store.com": L("‏hello@gheit.eg", "hello@gheit.eg"),
    "١٢ شارع النيل، الزمالك، القاهرة": L("٣١ شارع ٢٣١، دجلة، المعادي، القاهرة", "31 Road 231, Degla, Maadi, Cairo"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم من ٨ الصبح لـ ١٠ بالليل", "Daily, 8am to 10pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ غيط. كل الحقوق محفوظة.", "© 2026 Gheit. All rights reserved."),
    // The storefront adds its own "Powered by" line, so the design's credit stays empty.
    "بواسطة طلبي": L("", ""),
  },
  links: { "https://wa.me/": "https://wa.me/201125834067", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-banner", {
    photo: [PHOTOS.hero],
    text: {
      "صورة الواجهة": L("غيط زيتون قديم في نور العصر", "An old olive grove in the afternoon light"),
      "موسم جديد": L("من الغيط", "From the farm"),
      "ادخل الموسم الجديد بخطوة واثقة": L("أكل بيتي، من أرض بنعرفها", "Home food, from land we know"),
      "قطع مريحة وطبقات سهلة تتلبس كل يوم.": L(
        "خضار وفاكهة بتتقطف يوم ما بتتشحن، وعيش بلدي وعسل وجبن من جيرانا في الفيوم.",
        "Produce picked the day it ships, with country bread, honey and cheese from our Fayoum neighbours.",
      ),
      "تسوّق المجموعة": L("تسوّق الحصاد", "Shop the harvest"),
      "الجديد": L("وصل النهارده", "Fresh today"),
      "الإطلاق الجاي": L("يوم الحصاد الجاي", "The next harvest day"),
      "قطع جديدة بتنزل كل خميس، كن أول من يشوفها.": L(
        "بنقطف كل خميس الفجر. اطلب من دلوقتي وخلّي سلتك أول سلة تخرج.",
        "We harvest every Thursday at dawn. Order now and your basket leaves first.",
      ),
      "شوف الجديد": L("احجز سلتك", "Reserve your basket"),
    },
    links: { "/products": SHOP },
  }),
  lib("categories-feature-list", {
    text: {
      "الأقسام": L("من الغيط والفرن والمخزن", "From the field, the oven and the larder"),
      "كل الأقسام": L("كل المنتجات", "All"),
      "منتج": L("منتجات", "items"),
    },
    lists: [undefined, { limit: 5 }],
    // The eyebrow and the title share the design's copy, so only the title stays.
    nodes: { "التسمية": { style: { hidden: true } } },
  }),
  lib("products-classic", {
    text: {
      "جديدنا": L("بيتطلب كل أسبوع", "Ordered every week"),
      "وصل حديثًا": L("المفضّل في بيوت عملائنا", "Favourites in our customers’ homes"),
    },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers" }],
    // Four across on tablets too, so the eight cards fill two rows (the design's three left a gap).
    nodes: { "المنتجات": { tablet: { columns: 4 } } },
  }),
  lib("about-overlap", {
    person: [undefined, undefined, undefined, undefined, PHOTOS.breadShelves],
    text: {
      "صورة المتجر": L("أرفف خشب مليانة أرغفة خبز طازة", "Wooden shelves stacked with freshly baked loaves"),
      "من داخل المتجر": L("من ٢٠١٤", "Since 2014"),
      "بدأنا من محل صغير": L("بدأنا بفرن وغيط صغير", "We began with an oven and a small field"),
      "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": L(
        "عيلة واحدة في قرية تونس بالفيوم، بتزرع من غير كيماويات وبتخبز العيش في فرن طين. النهارده بنوصل لـ +٦٠٠٠ بيت في القاهرة كل أسبوع.",
        "One family in Tunis village, Fayoum, farming without chemicals and baking in a clay oven. Today we reach 6,000+ Cairo homes every week.",
      ),
      "اعرف أكثر": L("اقرا حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("كل المنتجات", "Shop all"),
    nodes: { "صورة البطاقة": { style: { aspectRatio: "landscape" } } },
  }),
  lib("newsletter-photo", {
    photo: [undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("شجرة فاكهة في غيط مشمس", "A fruit tree in a sunny field"),
      "للمشتركين": L("جواب الغيط", "Letters from the farm"),
      "خد ١٠٪ خصم على أول طلب": L("اعرف إيه اللي هيتقطف الأسبوع ده", "Know what’s being picked this week"),
      "اشترك عشان توصلك المنتجات الجديدة والعروض الخاصة.": L(
        "رسالة كل يوم أربع: إيه اللي نضج في الغيط، وصفة بيتي من ستّنا، ومواعيد زيارات المزرعة.",
        "A letter every Wednesday: what ripened in the field, a home recipe from our grandmother and farm visit dates.",
      ),
      "بدون رسائل مزعجة. تقدر تلغي في أي وقت.": L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("أكل بيتي من غيطنا في الفيوم، من ٢٠١٤.", "Home food from our Fayoum farm, since 2014.")),
  aboutStory(lib, {
    photo: PHOTOS.honeyTable,
    alt: L("برطمانات عسل بالمكسرات وأقراص شمع العسل", "Jars of honey with nuts and honeycomb"),
    eyebrow: L("من قرية تونس", "From Tunis village"),
    title: L("الأرض بتدّي اللي تاخده", "The land gives back what it’s given"),
    text: L(
      "بنزرع بالسماد البلدي، وبنسيب الأرض ترتاح كل موسم، وبنقطف على مهلنا عشان الطعم يفضل زي زمان.",
      "We farm with natural compost, rest the land every season and pick slowly, so the taste stays the way it used to be.",
    ),
    more: L("والعسل والجبن والعيش من جيرانا في القرية، بنعرف كل واحد فيهم بالاسم.", "The honey, cheese and bread come from our village neighbours, and we know each of them by name."),
    button: L("تسوّق المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("أكل بيتي من غيطنا في الفيوم: خضار وفاكهة وعيش وعسل.", "Home food from our Fayoum farm: produce, bread and honey."),
  categories: [
    ["fruits", "فواكه", "Fruits", PHOTOS.catFruits],
    ["vegetables", "خضار", "Vegetables", PHOTOS.catVegetables],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.catBakery],
    ["pantry", "المؤن والمكسرات", "Pantry, nuts & honey", PHOTOS.catPantry],
    ["dairy-cheese", "ألبان وجبن", "Dairy & cheese", PHOTOS.catDairy],
    ["coffee-tea", "قهوة وشاي", "Coffee & tea", PHOTOS.catCoffee],
  ],
  products: [
    // Fruits
    ["farm-figs", "fruits", "تين فيومي، ١ كجم", "Fayoum Figs, 1 kg", P(9725821), 90, { isFeatured: true, rating: 4.9, sold90: 136 }],
    ["peaches", "fruits", "خوخ بلدي، ١ كجم", "Local Peaches, 1 kg", P(9265739), 55, { rating: 4.7, sold90: 98 }],
    ["pomegranates", "fruits", "رمان، ١ كجم", "Pomegranates, 1 kg", P(12148143), 45, { rating: 4.8, sold90: 112 }],
    ["plums", "fruits", "برقوق أحمر، ١ كجم", "Red Plums, 1 kg", P(7974816), 60, { compareAtPrice: 70, rating: 4.6, sold90: 64 }],
    ["raspberries", "fruits", "توت أحمر، علبة ١٢٥ جم", "Raspberries, 125 g", P(1046350), 120, { rating: 4.7, sold90: 41 }],
    ["baladi-lemons", "fruits", "ليمون بلدي، ٥٠٠ جم", "Baladi Lemons, 500 g", P(6249228), 25, { rating: 4.8, sold90: 187 }],
    ["pears", "fruits", "كمثرى، ١ كجم", "Pears, 1 kg", P(12336371), 70, { rating: 4.5, sold90: 52 }],
    ["kiwi", "fruits", "كيوي، ٥٠٠ جم", "Kiwi, 500 g", P(7255620), 65, { rating: 4.4, sold90: 38, inStock: false }],
    // Vegetables
    ["heirloom-tomatoes", "vegetables", "طماطم بلدي، ١ كجم", "Heirloom Tomatoes, 1 kg", P(29081091), 30, { isFeatured: true, rating: 4.9, sold90: 264 }],
    ["zucchini", "vegetables", "كوسة، ١ كجم", "Zucchini, 1 kg", P(20180750), 25, { rating: 4.7, sold90: 171 }],
    ["eggplants", "vegetables", "باذنجان عروس، ١ كجم", "Baby Eggplants, 1 kg", P(16732700), 22, { rating: 4.6, sold90: 133 }],
    ["cauliflower", "vegetables", "قرنبيط، حبة", "Cauliflower, 1 head", P(7342178), 30, { rating: 4.5, sold90: 76 }],
    ["lettuce", "vegetables", "خس بلدي، ٢ حبة", "Baladi Lettuce, 2 heads", P(28524414), 15, { rating: 4.7, sold90: 118 }],
    ["radishes", "vegetables", "فجل، ربطة", "Radishes, 1 bunch", P(191043), 10, { rating: 4.6, sold90: 89 }],
    ["sweet-potatoes", "vegetables", "بطاطا، ١ كجم", "Sweet Potatoes, 1 kg", P(7456548), 25, { compareAtPrice: 30, rating: 4.8, sold90: 102 }],
    ["baladi-carrots", "vegetables", "جزر بلدي بالعرش، ١ كجم", "Baladi Carrots with Tops, 1 kg", P(1306559), 18, { rating: 4.7, sold90: 94 }],
    // Bakery
    ["sourdough-loaf", "bakery", "عيش ساوردو، رغيف كبير", "Sourdough Loaf", P(11842163), 85, { isFeatured: true, rating: 4.9, sold90: 158 }],
    ["artisan-baguettes", "bakery", "باجيت فرن طين، ٢ قطعة", "Clay-Oven Baguettes, 2 pcs", P(30926138), 45, { rating: 4.7, sold90: 121 }],
    ["butter-cookies", "bakery", "بسكويت زبدة، ٥٠٠ جم", "Butter Cookies, 500 g", P(797761), 140, { rating: 4.8, sold90: 97 }],
    ["baklava", "bakery", "بقلاوة بالفستق، ٥٠٠ جم", "Pistachio Baklava, 500 g", P(5323489), 320, { compareAtPrice: 360, rating: 4.9, sold90: 84 }],
    ["focaccia", "bakery", "فوكاتشيا بالزعتر وزيت الزيتون", "Thyme & Olive Oil Focaccia", P(30666814), 75, { rating: 4.6, sold90: 57 }],
    ["sesame-bagels", "bakery", "بيغل بالسمسم، ٤ قطع", "Sesame Bagels, 4 pcs", P(11599632), 70, { rating: 4.5, sold90: 43 }],
    ["rye-loaf", "bakery", "عيش شعير، رغيف", "Rye Loaf", P(2661996), 80, { rating: 4.6, sold90: 49 }],
    ["croissants", "bakery", "كرواسون بالكريمة، ٤ قطع", "Cream Croissants, 4 pcs", P(10641331), 110, { rating: 4.7, sold90: 76 }],
    // Pantry, nuts & honey
    ["siwa-dates", "pantry", "بلح سيوي، ١ كجم", "Siwa Dates, 1 kg", P(15913423), 150, { rating: 4.8, sold90: 143 }],
    ["walnuts", "pantry", "عين جمل بقشره، ٥٠٠ جم", "Walnuts in Shell, 500 g", P(14655679), 180, { rating: 4.6, sold90: 61 }],
    ["almonds", "pantry", "لوز محمص، ٢٥٠ جم", "Roasted Almonds, 250 g", P(6802627), 175, { rating: 4.7, sold90: 79 }],
    ["pistachios", "pantry", "فستق بقشره، ٢٥٠ جم", "Pistachios in Shell, 250 g", P(6086412), 240, { rating: 4.8, sold90: 88 }],
    ["wild-honey", "pantry", "عسل نحل جبلي، ٥٠٠ جم", "Wild Mountain Honey, 500 g", P(13246534), 280, { isFeatured: true, rating: 5, sold90: 126 }],
    ["honeycomb", "pantry", "شمع عسل، ٣٥٠ جم", "Honeycomb, 350 g", P(4921856), 320, { rating: 4.9, sold90: 54 }],
    ["strawberry-jam", "pantry", "مربى فراولة بيتي، ٣٥٠ جم", "Homemade Strawberry Jam, 350 g", P(26727863), 90, { rating: 4.7, sold90: 67 }],
    ["green-olives", "pantry", "زيتون أخضر مخلل، ٥٠٠ جم", "Pickled Green Olives, 500 g", P(12474258), 70, { rating: 4.6, sold90: 92 }],
    // Dairy & cheese
    ["farm-eggs", "dairy-cheese", "بيض بلدي، ١٥ بيضة", "Free-Range Eggs, 15 pcs", P(4184073), 110, { rating: 4.9, sold90: 214 }],
    ["butter", "dairy-cheese", "زبدة بلدي، ٢٥٠ جم", "Baladi Butter, 250 g", P(11978743), 130, { rating: 4.8, sold90: 102 }],
    ["feta-cubes", "dairy-cheese", "جبنة فيتا، ٥٠٠ جم", "Feta Cubes, 500 g", P(19460144), 95, { rating: 4.6, sold90: 87 }],
    ["mountain-tomme", "dairy-cheese", "جبنة قديمة معتّقة، ٢٥٠ جم", "Aged Farm Cheese, 250 g", P(9494774), 160, { rating: 4.7, sold90: 46 }],
    // Coffee & tea
    ["clay-teapot", "coffee-tea", "براد شاي فخار", "Clay Teapot", P(12755354), 260, { rating: 4.7, sold90: 28 }],
    ["herbal-tea", "coffee-tea", "خلطة أعشاب، ١٠٠ جم", "Herbal Tea Blend, 100 g", P(28448494), 65, { rating: 4.6, sold90: 58 }],
    ["coffee-beans", "coffee-tea", "بن محوّج، ٢٥٠ جم", "Spiced Coffee Beans, 250 g", P(4129105), 190, { rating: 4.8, sold90: 71 }],
    ["black-tea", "coffee-tea", "شاي أسود صعيدي، ٢٥٠ جم", "Saidi Black Tea, 250 g", P(6341404), 60, { rating: 4.5, sold90: 96 }],
  ],
});

export const GROCERY_WARM = libraryTemplate({
  key: GROCERY_WARM_KEY,
  version: 1,
  name: L("غيط", "Gheit"),
  description: L(
    "بقالة دافية من المزرعة: صورة غيط كبيرة، يوم الحصاد، وحكاية الفرن. لمتاجر الأكل البيتي والمنتجات الطبيعية.",
    "A warm farm-to-table grocer: a big field photo, harvest day and the bakery story. For home-food and natural produce stores.",
  ),
  category: "food",
  sortOrder: 1370,
  palette: ["#f6efe2", "#ebe0cb", "#8a4a2b", "#6b7a3a"],
  colors: {
    primary: "#8a4a2b",
    secondary: "#ebe0cb",
    background: "#f6efe2",
    foreground: "#2e241b",
    muted: "#6c5e4e",
    border: "#dccdb4",
    accent: "#6b7a3a",
  },
  fonts: { heading: "Aref Ruqaa", body: "Almarai" },
  radius: 12,
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
        title: L("تعالى زورنا", "Come and visit"),
        text: L("محلنا: ٣١ شارع ٢٣١، دجلة، المعادي، القاهرة. والمزرعة في قرية تونس، الفيوم، بالحجز.", "Our shop: 31 Road 231, Degla, Maadi, Cairo. The farm is in Tunis village, Fayoum, by booking."),
        heading: L("احجز زيارة للغيط أو اسألنا عن أي منتج", "Book a farm visit or ask us about anything"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الحصاد والتوصيل والسلال الأسبوعية.", "Harvest, delivery and weekly baskets."),
        question: L("الخضار بيتقطف إمتى؟", "When is the produce picked?"),
        answer: L(
          "بنقطف الخميس الفجر وبنوصل القاهرة والجيزة نفس اليوم. ولو اشتركت في السلة الأسبوعية، بتوصلك كل خميس من غير ما تطلب.",
          "We pick on Thursday at dawn and deliver across Cairo and Giza the same day. Subscribe to the weekly basket and it arrives every Thursday without reordering.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من سفرة عملائنا", "From our customers’ tables"), related: L("يحلى معاه", "Goes well with") },
  },
});
