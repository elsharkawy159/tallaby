/**
 * Perfumes Luxe (2026-10-28, perfumes niche, premium / minimal): porcelain
 * paper, midnight-ink type and champagne gold, Amiri headings over Noto Kufi
 * Arabic, square corners and a wide 1440px container. A quiet perfume-house
 * home: the top bar header, a split hero of two faceted bottles on white
 * silk, category cards with counts, the house pick beside its best sellers,
 * the atelier story over a wall of essences, four category rows, a ruled
 * newsletter and the wordmark footer. Built from section library designs
 * (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28): bottles,
 * oils, incense and diffusers only, no people or hands, no brand names or
 * readable labels, none used twice. Hero 2221692; about 12008120 (home),
 * 8450508 (about page); tiles 34089130, 8361482, 6693945, 38485071,
 * 18987024, 19791015, 14696052; products listed in DEMO.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const PERFUMES_LUXE_KEY = "perfumes-luxe";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(PERFUMES_LUXE_KEY, getDesign(id)!, { corners: 0, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(2221692, 1920),
  essenceWall: pexels(12008120, 1200),
  aboutPage: pexels(8450508, 1200),
  // Category cards.
  catWomen: pexels(34089130, 1200),
  catMen: pexels(8361482, 1200),
  catOud: pexels(6693945, 1200),
  catBakhoor: pexels(38485071, 1200),
  catHome: pexels(18987024, 1200),
  catGifts: pexels(19791015, 1200),
  catMinis: pexels(14696052, 1200),
};

const NAME = L("نفحة", "Nafha");

const header = lib("header-topbar", {
  text: {
    "توصيل سريع لكل محافظات مصر": L("توصيل لكل محافظات مصر خلال ٤٨ ساعة", "Delivery across Egypt"),
    "الدفع عند الاستلام": L("تغليف هدية مجاني مع كل زجاجة", "Free gift wrapping"),
    "تتبّع طلبك": L("تتبّع طلبك", "Track order"),
    "اسم متجرك": NAME,
    "المتجر": L("كل العطور", "Shop"),
    "العروض": L("وصل حديثًا", "New"),
    "المدونة": L("الأكثر طلبًا", "Best"),
    "من نحن": L("الأتيليه", "Atelier"),
  },
  links: { "/products": [undefined, NEW, undefined], "/blog": BEST },
});

const footer = lib("footer-wordmark", {
  text: {
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل العطور", "All fragrances"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "من نحن": L("عن نفحة", "About Nafha"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١٢٢ ٥٧١ ٠٤٨٣"), "+20 122 571 0483"),
    "‏hello@store.com": L(handle("hello@nafha.eg"), "hello@nafha.eg"),
    "اسم متجرك": NAME,
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ نفحة. كل الحقوق محفوظة.", "© 2026 Nafha. All rights reserved."),
  },
  links: { "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.hero],
    text: {
      "كوليكشن الموسم": L("مجموعة الياسمين ٢٠٢٦", "The Jasmine 2026 edition"),
      "صوت أنقى، كل يوم": L("عطر يفضل معاك بعد ما تمشي", "A scent that stays after you leave"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "بنركّب كل عطر في الأتيليه بالزمالك، بياسمين مصري من الغربية وزيوت مختارة بالقطرة.",
        "Every fragrance is blended in our Zamalek atelier with Egyptian jasmine from Gharbia and oils measured drop by drop.",
      ),
      "تسوق الآن": L("اكتشف المجموعة", "Discover the edition"),
      "العروض": L("وصل حديثًا", "New in"),
      "صورة الحملة": L("زجاجة عطر كريستال جنب فرع زهر بنفسجي", "A crystal perfume bottle beside a sprig of violet flowers"),
    },
    links: { "/products": [SHOP, NEW] },
  }),
  lib("categories-chips", {
    text: { "إيه اللي في بالك؟": L("عالم نفحة", "The world of Nafha") },
    lists: [{ limit: 6 }],
    nodes: { "الأقسام": { style: { columns: 3 } } },
  }),
  lib("products-feature", {
    text: {
      "اختيارنا ليك": L("اختيار الأتيليه", "The atelier’s choice"),
      "اختيار الأسبوع": L("عطر الموسم", "Scent of the season"),
    },
    lists: [undefined, { source: "best-sellers" }],
  }),
  lib("about-overlap", {
    person: [undefined, undefined, undefined, undefined, PHOTOS.essenceWall],
    text: {
      "صورة المتجر": L("صفوف زجاجات خلاصات بألوان هادية على رفوف بيضا", "Rows of essence bottles in soft colours on white shelves"),
      "من داخل المتجر": L("من ٢٠٠٩", "Since 2009"),
      "بدأنا من محل صغير": L("مكتبة روايح في قلب الزمالك", "A library of scents in the heart of Zamalek"),
      "نختار كل منتج بعناية ونغلّفه بأيدينا، ونعرف عملاءنا بالاسم.": L(
        "عندنا أكتر من ٣٠٠ خلاصة على الرف. كل عطر بيتركّب ويرتاح ٦ أسابيع قبل ما يتعبّى، وكل زجاجة عليها رقم دفعتها.",
        "We keep more than 300 essences on the shelf. Every fragrance rests six weeks before bottling, and every bottle carries its batch number.",
      ),
      "اعرف أكثر": L("زور الأتيليه", "Visit the atelier"),
    },
  }),
  ...categoryRows(lib, { viewAll: L("عرض الكل", "View all"), muted: [2, 4] }),
  lib("newsletter-ruled", {
    text: {
      "خد ١٠٪ خصم على أول طلب": L("رسالة نفحة", "The Nafha letter"),
      "عروض للمشتركين بس، مرة في الأسبوع.": L(
        "مرة في الشهر: عطر جديد من الأتيليه، حكاية مكوّن، وإزاي تختار عطرك حسب الموسم.",
        "Once a month: a new fragrance from the atelier, the story of one ingredient and how to choose a scent for the season.",
      ),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("عن نفحة", "About Nafha"), L("بيت عطور صغير في الزمالك، من ٢٠٠٩.", "A small perfume house in Zamalek, since 2009.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("قوارير زيوت بالزهور على رخام في معمل العطور", "Flower-oil vials on marble in the perfume lab"),
    eyebrow: L("الأتيليه", "The atelier"),
    title: L("كل عطر بيتعمل على مهل", "Every fragrance is made slowly"),
    text: L(
      "بدأت نفحة بعطّارة واحدة وكراسة تركيبات ورثتها من جدتها. النهارده بنركّب العطور بإيدينا في أتيليه صغير على النيل.",
      "Nafha began with one perfumer and a notebook of formulas inherited from her grandmother. Today we still blend by hand in a small atelier by the Nile.",
    ),
    more: L("وبنعمل لك عيّنة مجانية من أي عطر قبل ما تشتري الزجاجة الكبيرة.", "And we make you a free sample of any fragrance before you buy the full bottle."),
    button: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("بيت عطور صغير في الزمالك، من ٢٠٠٩.", "A small perfume house in Zamalek, since 2009."),
  categories: [
    ["womens-perfumes", "عطور حريمي", "For her", PHOTOS.catWomen],
    ["mens-perfumes", "عطور رجالي", "For him", PHOTOS.catMen],
    ["oud-attars", "العود والزيوت", "Oud & oils", PHOTOS.catOud],
    ["bakhoor-incense", "البخور", "Bakhoor & incense", PHOTOS.catBakhoor],
    ["home-fragrance", "معطّرات البيت", "Home fragrance", PHOTOS.catHome],
    ["gift-sets", "الهدايا", "Gift sets", PHOTOS.catGifts],
    ["travel-minis", "أحجام السفر", "Travel minis", PHOTOS.catMinis],
  ],
  products: [
    // For her
    ["yasmine-gharbia-edp", "womens-perfumes", "ياسمين الغربية ٥٠ مل", "Gharbia Jasmine EDP 50ml", P(8450248), 3450, { isFeatured: true, rating: 4.9, sold90: 36 }],
    ["rose-quartz-edp", "womens-perfumes", "روز كوارتز ٣٠ مل", "Rose Quartz EDP 30ml", P(16266286), 2650, { rating: 4.8, sold90: 47 }],
    ["fig-leaf-edt", "womens-perfumes", "ورق التين ١٠٠ مل", "Fig Leaf EDT 100ml", P(3831748), 2900, { rating: 4.7, sold90: 41 }],
    ["blush-musk-edp", "womens-perfumes", "مسك بلاش ٥٠ مل", "Blush Musk EDP 50ml", P(7005938), 3200, { compareAtPrice: 3600, rating: 4.8, sold90: 62 }],
    ["orange-blossom-edp", "womens-perfumes", "زهر البرتقال ٥٠ مل", "Orange Blossom EDP 50ml", P(1666404), 3100, { rating: 4.9, sold90: 44 }],
    ["neroli-tray-edp", "womens-perfumes", "نيرولي مع علبتها ٥٠ مل", "Neroli EDP 50ml, boxed", P(7670678), 3350, { rating: 4.6, sold90: 22 }],
    ["amber-veil-edp", "womens-perfumes", "عنبر فيل ٧٥ مل", "Amber Veil EDP 75ml", P(11027941), 3900, { rating: 4.7, sold90: 18, inStock: false }],
    ["peony-crystal-edp", "womens-perfumes", "بيوني كريستال ٥٠ مل", "Peony Crystal EDP 50ml", P(9464725), 3250, { rating: 4.5, sold90: 15 }],
    // For him
    ["white-cedar-edp", "mens-perfumes", "أرز أبيض ١٠٠ مل", "White Cedar EDP 100ml", P(15926320), 3800, { isFeatured: true, rating: 4.9, sold90: 88 }],
    ["sea-salt-cologne", "mens-perfumes", "ملح البحر ١٠٠ مل", "Sea Salt Cologne 100ml", P(3640668), 2700, { rating: 4.7, sold90: 46 }],
    ["vetiver-frost-edp", "mens-perfumes", "فيتيفر فروست ٥٠ مل", "Vetiver Frost EDP 50ml", P(7814730), 3400, { rating: 4.8, sold90: 55 }],
    ["cedar-pine-edt", "mens-perfumes", "أرز وصنوبر ١٠٠ مل", "Cedar & Pine EDT 100ml", P(18490314), 2950, { compareAtPrice: 3300, rating: 4.6, sold90: 33 }],
    ["blue-iris-edp", "mens-perfumes", "إيريس أزرق ١٠٠ مل", "Blue Iris EDP 100ml", P(33994391), 3600, { rating: 4.8, sold90: 28 }],
    ["stone-musk-edp", "mens-perfumes", "مسك الحجر ٥٠ مل", "Stone Musk EDP 50ml", P(7814959), 3150, { rating: 4.7, sold90: 24 }],
    ["chalk-musk-edt", "mens-perfumes", "مسك أبيض ١٠٠ مل", "White Musk EDT 100ml", P(3785784), 2450, { rating: 4.5, sold90: 19 }],
    ["obsidian-gold-edp", "mens-perfumes", "أوبسيديان جولد ٥٠ مل", "Obsidian Gold EDP 50ml", P(10688062), 4200, { rating: 4.9, sold90: 31 }],
    // Oud & oils
    ["cambodi-oud-oil", "oud-attars", "دهن عود كمبودي ١٢ مل", "Cambodian Oud Oil 12ml", P(8054393), 3800, { isFeatured: true, rating: 5, sold90: 74 }],
    ["rose-taif-oil", "oud-attars", "زيت ورد طائفي ١٥ مل", "Taif Rose Oil 15ml", P(35909808), 2900, { rating: 4.8, sold90: 37 }],
    ["sandal-mysore-oil", "oud-attars", "زيت صندل ميسوري ١٥ مل", "Mysore Sandal Oil 15ml", P(6914550), 2600, { rating: 4.7, sold90: 29 }],
    ["musk-tahara-flacon", "oud-attars", "مسك الطهارة في قارورة فرعوني", "White Musk in a Pharaonic Flacon", P(36389341), 1450, { rating: 4.9, sold90: 52 }],
    ["amber-elixir-oil", "oud-attars", "إكسير العنبر ١٢ مل", "Amber Elixir Oil 12ml", P(7797738), 2200, { compareAtPrice: 2500, rating: 4.6, sold90: 26 }],
    ["neroli-dropper-oil", "oud-attars", "زيت نيرولي بالقطّارة ١٥ مل", "Neroli Dropper Oil 15ml", P(7796589), 1650, { rating: 4.5, sold90: 21 }],
    ["saffron-oud-oil", "oud-attars", "عود بالزعفران ١٥ مل", "Saffron Oud Oil 15ml", P(7796460), 3400, { rating: 4.8, sold90: 18 }],
    ["vanilla-amber-oil", "oud-attars", "زيت عنبر وفانيليا ٣٠ مل", "Vanilla Amber Oil 30ml", P(6914610), 1450, { rating: 4.6, sold90: 34 }],
    // Bakhoor & incense
    ["sand-incense-sticks", "bakhoor-incense", "أعواد بخور الرمل (٢٠ عود)", "Sand Incense Sticks, 20", P(6512311), 280, { rating: 4.6, sold90: 41 }],
    ["colour-incense-bundle", "bakhoor-incense", "باقة أعواد ملونة (٦٠ عود)", "Coloured Incense Bundle, 60", P(18343929), 420, { rating: 4.5, sold90: 33 }],
    ["rope-incense", "bakhoor-incense", "بخور حبل مجدول", "Braided Rope Incense", P(11434878), 360, { rating: 4.7, sold90: 27 }],
    ["stone-bakhoor-bowl", "bakhoor-incense", "مبخرة حجر صابوني", "Soapstone Bakhoor Bowl", P(40382309), 1250, { isFeatured: true, rating: 4.9, sold90: 22 }],
    ["mirror-incense-tray", "bakhoor-incense", "حامل بخور مطعّم بالمرايا", "Mirror-Inlaid Incense Holder", P(7303267), 650, { rating: 4.8, sold90: 19 }],
    ["clay-incense-stand", "bakhoor-incense", "حامل بخور فخار", "Clay Incense Stand", P(8903271), 480, { rating: 4.6, sold90: 15 }],
    ["lotus-brass-holder", "bakhoor-incense", "حامل لوتس نحاس", "Brass Lotus Holder", P(10733075), 890, { compareAtPrice: 990, rating: 4.7, sold90: 12 }],
    ["ebony-incense-boat", "bakhoor-incense", "حامل أبنوس للأعواد", "Ebony Incense Boat", P(19848825), 540, { rating: 4.5, sold90: 9 }],
    // Home fragrance
    ["linen-reed-diffuser", "home-fragrance", "معطّر أعواد كتان ٢٠٠ مل", "Linen Reed Diffuser 200ml", P(6801190), 950, { rating: 4.8, sold90: 31 }],
    ["clear-reed-diffuser", "home-fragrance", "معطّر أعواد شفاف ١٥٠ مل", "Clear Reed Diffuser 150ml", P(8534248), 820, { rating: 4.6, sold90: 22 }],
    ["gypsophila-diffuser", "home-fragrance", "معطّر جبسوفيلا ٢٠٠ مل", "Gypsophila Reed Diffuser 200ml", P(7436108), 1050, { rating: 4.7, sold90: 17 }],
    ["wax-seal-diffuser", "home-fragrance", "معطّر بختم الشمع ٢٥٠ مل", "Wax-Seal Reed Diffuser 250ml", P(6958992), 1150, { rating: 4.9, sold90: 14 }],
    // Gift sets
    ["black-ribbon-box", "gift-sets", "علبة الهدية السودا", "The Black Ribbon Box", P(5872188), 4800, { rating: 4.9, sold90: 12 }],
    ["red-ribbon-mini", "gift-sets", "هدية الشريطة الحمرا", "The Red Ribbon Gift", P(697224), 2400, { rating: 4.7, sold90: 9 }],
    ["kraft-gold-gift", "gift-sets", "هدية الكرافت بالشريطة الدهبي", "The Kraft and Gold Gift", P(34972173), 3200, { rating: 4.8, sold90: 11 }],
    // Travel minis
    ["four-colour-minis", "travel-minis", "طقم ٤ ميني ملوّن", "Four-Colour Mini Set", P(36569345), 1650, { rating: 4.8, sold90: 38 }],
    ["roll-on-discovery", "travel-minis", "طقم رول أون للتجربة", "Roll-on Discovery Set", P(6707564), 950, { rating: 4.7, sold90: 29 }],
    ["cork-vials", "travel-minis", "قوارير فلّين للتجربة (٦)", "Cork Tester Vials, 6", P(7234628), 480, { rating: 4.5, sold90: 16 }],
  ],
});

export const PERFUMES_LUXE = libraryTemplate({
  key: PERFUMES_LUXE_KEY,
  version: 1,
  name: L("نفحة", "Nafha"),
  description: L(
    "بيت عطور هادي وفخم: هيرو بصورتين، اختيار الأتيليه وأربع صفوف للأقسام. لمتاجر العطور الراقية والنيش.",
    "A calm, luxurious perfume house: a split hero, the atelier’s pick and four category rows. For niche and premium perfume stores.",
  ),
  category: "beauty",
  sortOrder: 1380,
  palette: ["#f7f6f2", "#ecebe6", "#1d2533", "#a8874e"],
  colors: {
    primary: "#1d2533",
    secondary: "#ecebe6",
    background: "#f7f6f2",
    foreground: "#161a22",
    muted: "#5d626b",
    border: "#dcdad3",
    accent: "#a8874e",
  },
  fonts: { heading: "Amiri", body: "Noto Kufi Arabic" },
  radius: 0,
  containerMaxWidth: 1440,
  header,
  footer,
  pages: [
    { slug: "home", name: L("الرئيسية", "Home"), sections: home },
    { slug: "about", name: L("عن نفحة", "About"), seo: { title: L("عن نفحة", "About Nafha") }, sections: about },
    {
      slug: "contact",
      name: L("تواصل", "Contact"),
      seo: { title: L("تواصل", "Contact") },
      sections: contactPage(lib, {
        title: L("زورنا في الأتيليه", "Visit the atelier"),
        text: L("١٢ شارع البرازيل، الزمالك، القاهرة. من ١٢ الضهر لـ ١٠ بالليل.", "12 Brazil St, Zamalek, Cairo. Noon to 10pm."),
        heading: L("احجز جلسة اختيار عطر", "Book a fragrance consultation"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("العيّنات والثبات والتوصيل.", "Samples, longevity and delivery."),
        question: L("أقدر أجرّب العطر قبل ما أشتري؟", "Can I try a fragrance before buying?"),
        answer: L(
          "أيوه، اطلب عيّنة ٢ مل من أي عطر مع طلبك، ولو عجبك تمنها بيتحسب من الزجاجة الكبيرة. التوصيل في القاهرة والجيزة خلال ٤٨ ساعة.",
          "Yes. Add a 2ml sample of any fragrance to your order, and its price counts towards the full bottle. Cairo and Giza delivery takes 48 hours.",
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
    copy: { reviews: L("آراء عملاء الأتيليه", "From our clients"), related: L("عطور من نفس العائلة", "From the same family") },
  },
});
