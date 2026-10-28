/**
 * Grocery Bold (2026-10-28, grocery & food niche, bold / fast delivery):
 * white paper, near-black ink, a leafy green and a ripe-tomato red,
 * Alexandria headings over Rubik, round 20px corners and a 1280px container.
 * A loud, app-like grocery home: the top bar header with Track order, a
 * three-slide market carousel, category cards with counts, quick-add
 * best-seller rows, the market story in a circle, four category rows with
 * rounded frames, a photo newsletter banner and the brand-coloured sign-off
 * footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye (2026-10-28): saturated food
 * close-ups and market stalls only, no people or hands, no labels or brands,
 * none used twice. Slides: 5418661, 616404, 5946083. Scenes: 30542312
 * (tropical fruit, home story), 40236126 (squash crates, about page),
 * 34786533 (bread, newsletter). Tiles: 16243826, 10041308, 30853716,
 * 32282191, 33313085, 12247242. Products: listed in `DEMO` below. QA 2026-10-28 replaced the slides (a hand,
 * a neon sign, newspaper), the story photo (fruit stickers) and two products
 * (17488699 sticker, 36183149 cup logo).
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, libraryTemplate, pexels } from "../library-template";

export const GROCERY_BOLD_KEY = "grocery-bold";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(GROCERY_BOLD_KEY, getDesign(id)!, { corners: 20, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";
const WHATSAPP = "https://wa.me/201095627314";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  slideGreens: pexels(5418661, 1920),
  slideBoard: pexels(616404, 1920),
  slideFruit: pexels(5946083, 1920),
  tropicalFruit: pexels(30542312, 1200),
  squashCrates: pexels(40236126, 1200),
  newsletter: pexels(34786533, 1200),
  // Category cards.
  catFruits: pexels(16243826, 1200),
  catVegetables: pexels(10041308, 1200),
  catBakery: pexels(30853716, 1200),
  catPantry: pexels(32282191, 1200),
  catDairy: pexels(33313085, 1200),
  catCoffee: pexels(12247242, 1200),
};

const NAME = L("طازة", "Taza");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("توصيل في ٦٠ دقيقة بالقاهرة والجيزة", "Delivery in 60 min"),
    "الدفع عند الاستلام": L("كاش أو كارت عند الاستلام", "Cash or card on delivery"),
    "تتبّع طلبك": L("تتبّع طلبك", "Track your order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل المنتجات", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("الأكثر طلبًا", "Best sellers"),
    "من نحن": L("عن طازة", "About"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-signoff", {
  text: {
    "شكرًا إنك عدّيت علينا": L("التلاجة فاضية؟ إحنا جايين", "Empty fridge? We’re on our way"),
    "كلمنا على واتساب": L("اطلب على واتساب", "Order on WhatsApp"),
    "تسوق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل المنتجات", "All products"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الاستبدال والاسترجاع", "Exchanges & refunds"),
    "من نحن": L("عن طازة", "About Taza"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ طازة. كل الحقوق محفوظة.", "© 2026 Taza. All rights reserved."),
  },
  links: { "https://wa.me/": WHATSAPP, "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-carousel", {
    photo: [PHOTOS.slideGreens, PHOTOS.slideBoard, PHOTOS.slideFruit],
    text: {
      "صورة الحملة الأولى": L("طماطم ودرة ومشروم وبصل أخضر على خلفية خضرا", "Tomatoes, corn, mushrooms and spring onions on green"),
      "وصل حديثًا": L("من السوق للبيت", "Market to door"),
      "الموسم الجديد وصل": L("السوق كله في موبايلك", "The whole market in your pocket"),
      "قطع مختارة بعناية، وتوصيل لحد باب البيت.": L("خضار وفاكهة بتتنقّي الصبح، وتوصل لحد باب البيت خلال ساعة.", "Produce picked over every morning, at your door within the hour."),
      "تسوّق الجديد": L("اطلب دلوقتي", "Order now"),
      "صورة الحملة الثانية": L("خضار ملوّن حوالين لوح خشب", "Colourful vegetables framing a wooden board"),
      "الأكثر مبيعًا": L("الأكثر طلبًا", "Best sellers"),
      "المفضّلة عند عملائنا": L("سلة البيت الأسبوعية", "The weekly home basket"),
      "القطع اللي بترجع لها كل مرة.": L("الطماطم والخيار والبطاطس اللي كل بيت بيطلبها كل أسبوع.", "The tomatoes, cucumbers and potatoes every home orders each week."),
      "شوف الأكثر مبيعًا": L("شوف الأكثر طلبًا", "Shop best sellers"),
      "صورة الحملة الثالثة": L("برتقال وجوافة ورمان وتفاح على خلفية صفرا", "Oranges, guavas, pomegranates and apples on yellow"),
      "عروض الأسبوع": L("فاكهة الموسم", "In season"),
      "خصومات لفترة محدودة": L("حلاوة الموسم وصلت", "The season’s sweetest is here"),
      "أسعار أقل على قطع مختارة، لحد ما الكمية تخلص.": L("برتقال وجوافة ورمان، مختارين حبة حبة.", "Oranges, guavas and pomegranates, picked one by one."),
      "تسوّق العروض": L("تسوّق الفاكهة", "Shop fruit"),
    },
    links: { "/products": [SHOP, BEST, SHOP] },
  }),
  lib("categories-chips", {
    text: { "إيه اللي في بالك؟": L("محتاج إيه النهارده؟", "What do you need today?") },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-rows", {
    text: { "إكسسوارات بسعر حلو": L("الأكثر طلبًا في طازة", "Most ordered at Taza"), "عرض الكل": L("الكل", "All") },
    links: { "/products": BEST },
    lists: [{ source: "best-sellers", limit: 8 }],
  }),
  lib("about-circle", {
    person: [PHOTOS.tropicalFruit],
    text: {
      "صورة الفريق": L("مانجا وفاكهة التنين وبرتقال متكوّمين", "Mangoes, dragon fruit and oranges piled together"),
      "إحنا مين": L("من سوق العبور", "From Obour market"),
      "فريق صغير بيحب اللي بيعمله": L("بنصحى قبل السوق عشان نختار الأحسن", "We’re up before the market to pick the best"),
      "بنرد على كل رسالة بنفسنا، وبنختار كل منتج كأننا هنستخدمه.": L(
        "+٣٥٠٠٠ بيت في القاهرة والجيزة بيطلب من طازة كل أسبوع. فريقنا بينقّي الخضار والفاكهة الفجر، ولو حاجة مش عاجباك بنرجّعلك فلوسها.",
        "35,000+ homes in Cairo and Giza order from Taza every week. Our team picks produce at dawn, and if anything disappoints you, you get your money back.",
      ),
      "قابل الفريق": L("اعرف حكايتنا", "Our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("شوف الكل", "See all"),
    muted: [1, 3],
    nodes: { "صورة المنتج": { style: { radius: 20 } } },
  }),
  lib("newsletter-banner", {
    photo: [undefined, undefined, undefined, undefined, PHOTOS.newsletter],
    text: {
      "صورة من المتجر": L("رغيف بلدي وباجيت طازة من الفرن", "Fresh country loaves and a baguette from the oven"),
      "خليك قريب": L("خليك قريب", "Stay close"),
      "اعرف المجموعة الجديدة قبل الكل": L("اعرف اللي وصل قبل ما يخلص", "Hear what’s in before it sells out"),
      "إيميل واحد في الأسبوع فيه القطع الجديدة والعروض الخاصة.": L(
        "إيميل واحد في الأسبوع: فاكهة الموسم، منتجات جديدة ووصفة سريعة للعشا.",
        "One email a week: fruit in season, new products and a quick dinner recipe.",
      ),
      "من غير رسائل مزعجة، وتقدر تلغي في أي وقت.": L("من غير رسائل مزعجة، وتقدر تلغي في أي وقت.", "No spam, unsubscribe any time."),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن طازة", "About Taza"), L("بقالة أونلاين بتوصل خلال ساعة، من ٢٠٢٠.", "An online grocer that delivers within the hour, since 2020.")),
  aboutStory(lib, {
    photo: PHOTOS.squashCrates,
    alt: L("صناديق خشب مليانة قرع ملوّن", "Wooden crates full of colourful squash"),
    eyebrow: L("من ٢٠٢٠", "Since 2020"),
    title: L("السوق بييجي لحد عندك", "The market comes to you"),
    text: L(
      "بدأنا بعربية واحدة وموتوسيكلين في مدينة نصر، والنهارده عندنا ٩ مخازن صغيرة في القاهرة والجيزة.",
      "We started with one van and two motorbikes in Nasr City; today we run nine small hubs across Cairo and Giza.",
    ),
    more: L("كل طلب بيتجهّز في أقرب مخزن ليك، عشان الخضار يوصل ساقع والعيش يوصل سخن.", "Every order is packed at the hub nearest you, so produce arrives cold and bread arrives warm."),
    button: L("اطلب الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بقالة أونلاين: خضار وفاكهة ومخبوزات، توصل خلال ساعة في القاهرة والجيزة.", "An online grocer: produce, bakery and pantry, delivered within the hour in Cairo and Giza."),
  categories: [
    ["fruits", "فواكه", "Fruits", PHOTOS.catFruits],
    ["vegetables", "خضار", "Vegetables", PHOTOS.catVegetables],
    ["bakery", "مخبوزات", "Bakery", PHOTOS.catBakery],
    ["pantry", "المؤن والمكسرات", "Pantry & nuts", PHOTOS.catPantry],
    ["dairy-cheese", "ألبان وجبن", "Dairy & cheese", PHOTOS.catDairy],
    ["coffee-tea", "قهوة وشاي", "Coffee & tea", PHOTOS.catCoffee],
  ],
  products: [
    // Fruits
    ["bananas", "fruits", "موز بلدي، ١ كجم", "Local Bananas, 1 kg", P(10112720), 35, { isFeatured: true, rating: 4.8, sold90: 412 }],
    ["oranges", "fruits", "برتقال أبو سرة، ٢ كجم", "Navel Oranges, 2 kg", P(11862537), 50, { rating: 4.7, sold90: 356 }],
    ["strawberries", "fruits", "فراولة، علبة ٥٠٠ جم", "Strawberries, 500 g", P(8105691), 45, { compareAtPrice: 55, rating: 4.9, sold90: 298 }],
    ["black-grapes", "fruits", "عنب أسود، ١ كجم", "Black Grapes, 1 kg", P(8796710), 60, { rating: 4.6, sold90: 187 }],
    ["watermelon", "fruits", "بطيخة صغيرة، ٤–٥ كجم", "Small Watermelon, 4–5 kg", P(12932797), 75, { rating: 4.5, sold90: 143 }],
    ["pineapple", "fruits", "أناناس، حبة", "Pineapple, 1 pc", P(7194817), 95, { rating: 4.7, sold90: 121 }],
    ["kiwi", "fruits", "كيوي، ٥٠٠ جم", "Kiwi, 500 g", P(867349), 70, { rating: 4.6, sold90: 104, inStock: false }],
    ["tangerines", "fruits", "يوسفي، ١ كجم", "Tangerines, 1 kg", P(4074999), 30, { rating: 4.8, sold90: 265 }],
    // Vegetables
    ["tomatoes", "vegetables", "طماطم، ١ كجم", "Tomatoes, 1 kg", P(7522774), 20, { isFeatured: true, rating: 4.7, sold90: 520 }],
    ["cucumbers", "vegetables", "خيار، ١ كجم", "Cucumbers, 1 kg", P(17975573), 18, { rating: 4.8, sold90: 448 }],
    ["carrots", "vegetables", "جزر، ١ كجم", "Carrots, 1 kg", P(12945065), 15, { rating: 4.6, sold90: 302 }],
    ["potatoes", "vegetables", "بطاطس، ٢ كجم", "Potatoes, 2 kg", P(10899606), 30, { rating: 4.7, sold90: 389 }],
    ["onions", "vegetables", "بصل أحمر، ٢ كجم", "Red Onions, 2 kg", P(6316541), 28, { rating: 4.5, sold90: 341 }],
    ["bell-peppers", "vegetables", "فلفل ألوان، ٥٠٠ جم", "Bell Peppers, 500 g", P(35525568), 40, { compareAtPrice: 48, rating: 4.8, sold90: 233 }],
    ["broccoli", "vegetables", "بروكلي، حبة", "Broccoli, 1 head", P(5725774), 35, { rating: 4.6, sold90: 158 }],
    ["cabbage", "vegetables", "كرنب أبيض، حبة", "White Cabbage, 1 head", P(6316537), 25, { rating: 4.4, sold90: 97 }],
    // Bakery
    ["glazed-donuts", "bakery", "دونات ملوّنة، ٤ قطع", "Iced Donuts, 4 pcs", P(7034120), 90, { rating: 4.7, sold90: 176 }],
    ["croissants", "bakery", "كرواسون زبدة، ٤ قطع", "Butter Croissants, 4 pcs", P(11675765), 100, { isFeatured: true, rating: 4.9, sold90: 244 }],
    ["cupcakes", "bakery", "كب كيك فراولة، ٤ قطع", "Strawberry Cupcakes, 4 pcs", P(8964308), 110, { rating: 4.6, sold90: 89 }],
    ["chocolate-cookies", "bakery", "كوكيز شوكولاتة، ٦ قطع", "Chocolate Cookies, 6 pcs", P(5846039), 85, { rating: 4.8, sold90: 192 }],
    ["brownies", "bakery", "براوني، ٤ قطع", "Brownies, 4 pcs", P(4655032), 120, { compareAtPrice: 140, rating: 4.9, sold90: 167 }],
    ["cinnamon-rolls", "bakery", "سينابون، ٤ قطع", "Cinnamon Rolls, 4 pcs", P(36897955), 130, { rating: 4.8, sold90: 151 }],
    ["muffins", "bakery", "مافن شوكولاتة شيبس، ٤ قطع", "Choc-Chip Muffins, 4 pcs", P(30387798), 95, { rating: 4.5, sold90: 78 }],
    ["baguettes", "bakery", "باجيت فرنساوي، ٢ قطعة", "French Baguettes, 2 pcs", P(38597841), 40, { rating: 4.7, sold90: 213 }],
    // Pantry & nuts
    ["cashews", "pantry", "كاجو محمص، ٢٥٠ جم", "Roasted Cashews, 250 g", P(9811624), 210, { rating: 4.8, sold90: 132 }],
    ["hazelnuts", "pantry", "بندق، ٢٥٠ جم", "Hazelnuts, 250 g", P(6316669), 190, { rating: 4.6, sold90: 74 }],
    ["raisins", "pantry", "زبيب أسود، ٢٥٠ جم", "Black Raisins, 250 g", P(12945019), 60, { rating: 4.5, sold90: 91 }],
    ["chickpeas", "pantry", "حمص الشام حب، ١ كجم", "Dried Chickpeas, 1 kg", P(28110905), 70, { rating: 4.7, sold90: 118 }],
    ["red-lentils", "pantry", "عدس أصفر، ١ كجم", "Red Lentils, 1 kg", P(34940649), 65, { rating: 4.8, sold90: 207 }],
    ["rice", "pantry", "أرز مصري، ٥ كجم", "Egyptian Rice, 5 kg", P(36346840), 160, { compareAtPrice: 180, rating: 4.7, sold90: 284 }],
    ["turmeric", "pantry", "كركم مطحون، ١٠٠ جم", "Ground Turmeric, 100 g", P(15623115), 35, { rating: 4.6, sold90: 66 }],
    ["peanut-butter", "pantry", "زبدة فول سوداني، ٣٥٠ جم", "Peanut Butter, 350 g", P(8611766), 95, { rating: 4.8, sold90: 143 }],
    // Dairy & cheese
    ["farm-eggs", "dairy-cheese", "بيض أحمر، ٣٠ بيضة", "Brown Eggs, 30 pcs", P(40207198), 165, { rating: 4.8, sold90: 376 }],
    ["cheddar-cubes", "dairy-cheese", "جبنة شيدر، ٢٥٠ جم", "Cheddar, 250 g", P(6004145), 120, { rating: 4.6, sold90: 112 }],
    ["gouda", "dairy-cheese", "جبنة جودا، ٢٥٠ جم", "Gouda, 250 g", P(33575864), 135, { rating: 4.7, sold90: 87 }],
    ["yogurt", "dairy-cheese", "زبادي بالفراولة، ٤ علب", "Strawberry Yogurt, 4 cups", P(38928050), 60, { rating: 4.5, sold90: 164 }],
    // Coffee & tea
    ["coffee-beans", "coffee-tea", "بن غامق، ٢٥٠ جم", "Dark Roast Beans, 250 g", P(16012139), 180, { rating: 4.7, sold90: 98 }],
    ["espresso-cup", "coffee-tea", "قهوة إسبريسو مطحونة، ٢٥٠ جم", "Ground Espresso, 250 g", P(12039010), 170, { rating: 4.6, sold90: 73 }],
    ["iced-hibiscus", "coffee-tea", "كركديه ساقع، لتر", "Iced Hibiscus, 1 L", P(32566391), 45, { rating: 4.8, sold90: 141 }],
    ["green-mint-tea", "coffee-tea", "شاي أخضر بالنعناع، ٢٠ كيس", "Green Mint Tea, 20 bags", P(36228289), 55, { rating: 4.5, sold90: 82 }],
  ],
});

export const GROCERY_BOLD = libraryTemplate({
  key: GROCERY_BOLD_KEY,
  version: 1,
  name: L("طازة", "Taza"),
  description: L(
    "بقالة سريعة بألوان السوق: سلايدر بثلاث صور، كروت أقسام وصفوف إضافة سريعة. لمتاجر التوصيل السريع والسوبر ماركت أونلاين.",
    "A fast grocery store in market colours: a three-slide hero, category cards and quick-add rows. For quick-delivery stores and online supermarkets.",
  ),
  category: "food",
  sortOrder: 1360,
  palette: ["#ffffff", "#eef7ea", "#1d7a3a", "#ff5a36"],
  colors: {
    primary: "#1d7a3a",
    secondary: "#eef7ea",
    background: "#ffffff",
    foreground: "#121a14",
    muted: "#55605a",
    border: "#d7e8d3",
    accent: "#ff5a36",
  },
  fonts: { heading: "Alexandria", body: "Rubik" },
  radius: 20,
  containerMaxWidth: 1280,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن طازة", "About"), seo: { title: L("عن طازة", "About Taza") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("كلمنا", "Talk to us"),
        text: L("٤٥ شارع مكرم عبيد، مدينة نصر، القاهرة. خدمة العملاء كل يوم من ٧ الصبح لـ ١٢ بالليل.", "45 Makram Ebeid St, Nasr City, Cairo. Customer care daily, 7am to midnight."),
        heading: L("في حاجة ناقصة في طلبك؟ قولنا", "Something missing from your order? Tell us"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("التوصيل والدفع والاسترجاع.", "Delivery, payment and refunds."),
        question: L("الطلب بيوصل في قد إيه؟", "How fast does my order arrive?"),
        answer: L(
          "خلال ٦٠ دقيقة في أغلب مناطق القاهرة والجيزة، من ٨ الصبح لـ ١٢ بالليل. ولو حاجة مش طازة، صوّرها وابعتها على واتساب ونرجّعلك فلوسها.",
          "Within 60 minutes in most of Cairo and Giza, 8am to midnight. If anything isn’t fresh, send us a photo on WhatsApp and we refund it.",
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
    copy: { reviews: L("رأي عملائنا", "What customers say"), related: L("ضيفه للسلة", "Add to the basket") },
  },
});
