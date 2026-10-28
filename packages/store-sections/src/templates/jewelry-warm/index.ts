/**
 * Jewelry Warm (2026-10-28, jewelry niche, warm / editorial): sand paper,
 * espresso ink and a bronze brand with a honey-gold accent, Noto Naskh
 * Arabic headings over IBM Plex Sans Arabic, soft 10px corners and a 1360px
 * container. A slow, handmade-feeling home: the announcement header, a split
 * hero beside a gold-and-greenery flat lay, the first category as a big
 * photo with the rest in a ruled list, a shelf of favourites, the family
 * story beside a wooden tray of gold, four category rows with portrait
 * photos on wood, linen and satin, a personal letter newsletter and the
 * classic footer. Built from section library designs (`fromLibrary`).
 *
 * Photos: Pexels, each checked by eye at full size (2026-10-28, again at
 * 2000px after browser QA): jewelry, brooches, hair accessories, sunglasses
 * and bags on wood, linen and warm light, no people or figures, no readable
 * brand or model lettering, none used twice. Hero 4155255; about 4155252,
 * about page 4155250 (one shoot, on different pages); tiles 12290110,
 * 13292955, 5830200, 37560446, 6160287, 29538707, 28387111; products as
 * listed in `DEMO`.
 * Swapped before QA: ring 17261921 (a library stock photo); earrings
 * 15799478 (lettered plaque); bracelets 38909337 (same bracelet as
 * 38909356), 37129473 (cartoon beads); bracelets tile 18039203 (lettered
 * tags); watch 26626530 (tiny dial text); bags 27046143 (brand plate),
 * 23223849 (a hand), 10919291 and 9327162 (used by older templates).
 * Swapped after QA: watches (brand lettering on the tile and dials) became
 * brooches and hair accessories; ring 13524236 (a blurred person behind)
 * for 29624003; necklaces 29736434 and 29736433 (zodiac water-bearer
 * figure, one shoot) for 6858599 and 10897849; sunglasses tile 11882776 (a
 * person reflected in the lens) for 29538707, product 26050118 (temple
 * text) dropped; bag 27046146 (embossed patch) dropped; bracelets 10887448
 * and 11635474 (same mookaite shoot as 11051718) for 11178580 and 31005906.
 */
import { getDesign, type Design } from "../../designs";
import { L } from "../../designs/_kit";
import { categoryRows } from "../_category-rows";
import { fromLibrary, type LibraryPatch } from "../_library";
import { aboutStory, contactPage, faqPage, pageHeader } from "../_pages";
import { demoStore, handle, libraryTemplate, pexels, phone } from "../library-template";

export const JEWELRY_WARM_KEY = "jewelry-warm";

const lib = (id: string, patch: LibraryPatch = {}): Design => fromLibrary(JEWELRY_WARM_KEY, getDesign(id)!, { corners: 10, ...patch });

const SHOP = "/products";
const NEW = "/products?sort=newest";
const BEST = "/products?sort=popularity";
const RATED = "/products?sort=rating";

const P = (id: number) => pexels(id, 800);
const PHOTOS = {
  hero: pexels(4155255, 1920),
  story: pexels(4155252, 1200),
  aboutPage: pexels(4155250, 1200),
  // Category photos.
  catRings: pexels(12290110, 1200),
  catNecklaces: pexels(13292955, 1200),
  catEarrings: pexels(5830200, 1200),
  catBracelets: pexels(37560446, 1200),
  catBrooches: pexels(6160287, 1200),
  catSunglasses: pexels(29538707, 1200),
  catBags: pexels(28387111, 1200),
};

const NAME = L("تِبر", "Tibr");

const header = lib("header-announcement", {
  text: {
    "توصيل مجاني للطلبات فوق ١٥٠٠ ج.م": L("أهلًا بيكي في تِبر · توصيل لكل محافظات مصر", "Welcome to Tibr · Delivery across Egypt"),
    "الدفع عند الاستلام": L("الدفع عند الاستلام", "Cash on delivery"),
    "م": L("ت", "T"),
    "اسم متجرك": NAME,
    "المتجر": L("كل القطع", "Shop all"),
    "العروض": L("وصل حديثًا", "New in"),
    "المدونة": L("تتبّعي طلبك", "Track order"),
    "من نحن": L("حكايتنا", "Our story"),
  },
  links: { "/products": [undefined, NEW, undefined, undefined, NEW], "/blog": "/profile/orders" },
});

const footer = lib("footer-classic", {
  text: {
    "اسم متجرك": NAME,
    "أساسيات كل يوم، مختارة بعناية.": L("دهب وفضة وخرز معمولين على مهل، لكل يوم.", "Gold, silver and beads made slowly, for every day."),
    "تسوّق": L("تسوّق", "Shop"),
    "كل المنتجات": L("كل القطع", "All pieces"),
    "العروض": L("الأعلى تقييمًا", "Top rated"),
    "المساعدة": L("المساعدة", "Help"),
    "الاسترجاع والاستبدال": L("الاستبدال والتلميع", "Exchanges & polishing"),
    "من نحن": L("حكايتنا", "Our story"),
    "تواصل معنا": L("تواصل معنا", "Contact"),
    "٠١٠٠ ١٢٣ ٤٥٦٧": L(phone("٠١١٢ ٦٥٣ ٠٨٧٤"), "+20 112 653 0874"),
    "١٢ شارع النيل، الزمالك، القاهرة": L(`١٤ شارع ٢٥٠، المعادي، القاهرة · ${handle("hello@tibr.eg")}`, "14 Road 250, Maadi, Cairo · hello@tibr.eg"),
    "السبت إلى الخميس، ١٠ ص – ١٠ م": L("كل يوم من ١١ الصبح لـ ١٠ بالليل", "Daily, 11am to 10pm"),
    "© ٢٠٢٦ اسم متجرك. كل الحقوق محفوظة.": L("© ٢٠٢٦ تِبر. كل الحقوق محفوظة.", "© 2026 Tibr. All rights reserved."),
  },
  links: { "https://wa.me/": "https://wa.me/201126530874", "/products": [SHOP, NEW, BEST, RATED] },
});

const home: Design[] = [
  lib("hero-halves", {
    photo: [undefined, PHOTOS.hero],
    text: {
      "كوليكشن الموسم": L("مجموعة الخريف", "The autumn edit"),
      "صوت أنقى، كل يوم": L("دهب دافي يتلبس كل يوم", "Warm gold for every day"),
      "منتجات أصلية بضمان محلي، توصلك خلال ٤٨ ساعة.": L(
        "سلاسل رفيعة وغوايش وخواتم بلمسة يدوية، معمولة في ورشتنا بالمعادي عشان تعيش معاكي سنين.",
        "Fine chains, bangles and rings with a handmade touch, made in our Maadi workshop to stay with you for years.",
      ),
      "تسوق الآن": L("تسوّقي المجموعة", "Shop the edit"),
      "العروض": L("وصل حديثًا", "New in"),
      "صورة الحملة": L("سلاسل وأساور دهب على سطح أبيض جنب ورق شجر ودانتيل", "Gold chains and bangles on a white surface with leaves and lace"),
    },
    links: { "/products": [SHOP, NEW] },
  }),
  lib("categories-feature-list", {
    text: {
      "الأقسام": L("في الصندوق بتاعنا", "Inside our jewelry box"),
      "كل الأقسام": L("الكل", "All"),
      "منتج": L("قطعة", "pieces"),
    },
    lists: [undefined, { limit: 6 }],
  }),
  lib("products-shelf", {
    text: {
      "تسوّق حسب مزاجك": L("المفضّل عند عميلاتنا", "Our customers' favourites"),
      "وصل جديد": L("الأكثر طلبًا", "Best sellers"),
      "الأكثر مبيعًا": L("وصل حديثًا", "New in"),
      "عليه خصم": L("الأعلى تقييمًا", "Top rated"),
      "كل المنتجات": L("كل القطع", "View all pieces"),
    },
    links: { "/products": [BEST, NEW, RATED, SHOP] },
    lists: [{ source: "best-sellers" }],
  }),
  lib("about-split-story", {
    photo: [undefined, undefined, PHOTOS.story],
    text: {
      "صورة القصة": L("خواتم وغوايش دهب جنب صينية خشب", "Gold rings and bangles beside a wooden tray"),
      "من ورشتنا": L("من ورشتنا", "From our workshop"),
      "متصمم عشانك ومعمول في القاهرة": L("معمول بالإيد، عشان يتورث", "Made by hand, made to be passed on"),
      "بنعمل كميات صغيرة عشان كل قطعة تفضل مميزة ومفيش حاجة تترمي.": L(
        "بنشتغل دهب عيار ٢١ وفضة ٩٢٥ وأحجار طبيعية، وبنعمل كميات صغيرة عشان كل قطعة تخلص على إيد صايغ واحد.",
        "We work in 21-karat gold, 925 silver and natural stones, in small batches, so each piece is finished by one goldsmith.",
      ),
      "كل قطعة بتتقص وتتخيط عند فريقنا في المعادي.": L(
        "+١٥٠٠٠ عميلة في مصر عندها قطعة من تِبر، وتقييمنا ٤٫٩ من ٥.",
        "15,000+ women across Egypt own a Tibr piece, rated 4.9 out of 5.",
      ),
      "حكايتنا": L("اقري حكايتنا", "Read our story"),
    },
  }),
  ...categoryRows(lib, {
    viewAll: L("كل القطع", "Shop all"),
    muted: [1, 4],
    nodes: { "صورة البطاقة": { style: { aspectRatio: "portrait" } } },
  }),
  lib("newsletter-letter", {
    text: {
      "رسالة كل أسبوع": L("رسالة من الورشة", "A letter from the workshop"),
      "أهلًا،": L("أهلًا بيكي،", "Hello, friend,"),
      "كل خميس بكتب رسالة قصيرة فيها أحسن حاجة جربناها الأسبوع ده، وعرض للمشتركين بس.": L(
        "كل أول شهر بنكتبلك رسالة قصيرة فيها قطعة جديدة طلعت من الورشة، وحكاية عميلة لبست دهبنا في يوم مهم، ونصيحة تحافظي بيها على اللمعة.",
        "On the first of every month we write a short note with a new piece from the workshop, the story of a client who wore our gold on a big day and a tip to keep it shining.",
      ),
      "أ": L("ت", "T"),
      "أحمد": L("فريق تِبر", "The Tibr team"),
      "صاحب المتجر": L("ورشة المعادي", "Our Maadi workshop"),
    },
  }),
];

const about: Design[] = [
  pageHeader(lib, "about-header", L("حكايتنا", "Our story"), L("دهب وفضة معمولين على مهل في المعادي.", "Gold and silver made slowly in Maadi.")),
  aboutStory(lib, {
    photo: PHOTOS.aboutPage,
    alt: L("غويشة وسلسلة دهب في صينية خشب", "A gold bangle and chain in a wooden tray"),
    eyebrow: L("من ٢٠١٩", "Since 2019"),
    title: L("ورشة صغيرة في المعادي", "A small workshop in Maadi"),
    text: L(
      "بدأت تِبر من شنطة دهب ستي. كانت كل قطعة فيها ليها حكاية، وأنا كنت عايزة أعمل قطع لسه بتتحكي حكايات زيها.",
      "Tibr began with my grandmother's jewelry pouch. Every piece in it had a story, and I wanted to make pieces that still tell stories like hers.",
    ),
    more: L("ولسه كل قطعة بتتشطب بالإيد، وبنلمّع أي قطعة من عندنا ببلاش مهما كان عمرها.", "Every piece is still hand-finished, and we polish any Tibr piece free, whatever its age."),
    button: L("تسوّقي المفضّل", "Shop favourites"),
    href: BEST,
  }),
];

const DEMO = demoStore({
  name: NAME,
  description: L("دهب وفضة معمولين على مهل في المعادي.", "Gold and silver made slowly in Maadi."),
  categories: [
    ["rings", "الخواتم والدبل", "Rings & bands", PHOTOS.catRings],
    ["necklaces", "السلاسل", "Necklaces", PHOTOS.catNecklaces],
    ["earrings", "الحلقان", "Earrings", PHOTOS.catEarrings],
    ["bracelets", "الأساور والخرز", "Bracelets & beads", PHOTOS.catBracelets],
    ["brooches", "البروشات والشعر", "Brooches & hair", PHOTOS.catBrooches],
    ["sunglasses", "النضارات الشمس", "Sunglasses", PHOTOS.catSunglasses],
    ["bags", "الشنط الجلد", "Leather bags", PHOTOS.catBags],
  ],
  products: [
    // Rings & bands
    ["twin-wedding-bands", "rings", "دبلتين دهب", "Gold Wedding Bands", P(9080072), 21500, { rating: 4.9, sold90: 48 }],
    ["gold-ring-trio", "rings", "تلات خواتم دهب", "Gold Ring Trio", P(13524238), 28900, { rating: 4.8, sold90: 31 }],
    ["cluster-ring-and-band", "rings", "خاتم كلاستر ودبلة", "Cluster Ring and Band", P(7093179), 24500, { compareAtPrice: 26900, rating: 4.7, sold90: 22 }],
    ["two-tone-stacking-bands", "rings", "دبل دهب لونين", "Two-Tone Bands", P(34948823), 16900, { rating: 4.8, sold90: 27 }],
    ["bands-in-walnut-box", "rings", "دبل في علبة جوز", "Bands in a Walnut Box", P(29624003), 19800, { isFeatured: true, rating: 4.9, sold90: 25 }],
    ["two-stone-ring", "rings", "خاتم بفصين", "Two-Stone Gold Ring", P(1457801), 13500, { rating: 4.9, sold90: 36 }],
    ["stackable-ring-set", "rings", "طقم خواتم رفيعة", "Stackable Ring Set", P(10897815), 4900, { rating: 4.7, sold90: 54 }],
    ["rose-gold-bands", "rings", "دبل روز جولد", "Rose Gold Bands", P(25946875), 18500, { rating: 4.8, sold90: 19, inStock: false }],
    // Necklaces
    ["onyx-clover-pendant", "necklaces", "سلسلة برسيم عقيق", "Onyx Clover Pendant", P(33452872), 5400, { rating: 4.8, sold90: 57 }],
    ["molten-gold-pendant", "necklaces", "سلسلة دلاية دهب مموجة", "Molten Gold Pendant", P(6858599), 6900, { rating: 4.9, sold90: 42 }],
    ["vintage-locket-set", "necklaces", "سلاسل دلايات فينتدج", "Vintage Locket Set", P(38492235), 6900, { rating: 4.7, sold90: 29 }],
    ["curb-chain-necklace", "necklaces", "سلسلة كارتييه عريضة", "Gold Curb Chain", P(28900486), 9800, { compareAtPrice: 11200, rating: 4.8, sold90: 33 }],
    ["embroidered-pendants", "necklaces", "سلاسل دلايات مطرزة", "Embroidered Pendants", P(35756968), 2400, { rating: 4.7, sold90: 21 }],
    ["sequin-chain-necklace", "necklaces", "سلسلة ترتر دهب", "Gold Sequin Chain", P(10897849), 4600, { isFeatured: true, rating: 4.6, sold90: 25 }],
    ["gold-charm-plate", "necklaces", "طقم سلاسل وتشارمز", "Chain and Charm Set", P(8105117), 8600, { rating: 4.5, sold90: 18 }],
    ["chunky-link-chains", "necklaces", "سلاسل جنزير تقيل", "Chunky Link Chains", P(10816570), 12400, { rating: 4.8, sold90: 16 }],
    // Earrings
    ["emerald-chandeliers", "earrings", "حلق شاندلييه زمرد", "Emerald Chandeliers", P(32989030), 14500, { rating: 4.9, sold90: 26 }],
    ["gold-ball-studs", "earrings", "حلق كور دهب", "Gold Ball Studs", P(17368722), 2600, { rating: 4.8, sold90: 63 }],
    ["twisted-gold-hoops", "earrings", "حلق هوب مبروم", "Twisted Gold Hoops", P(26592836), 5800, { rating: 4.7, sold90: 44 }],
    ["filigree-drop-earrings", "earrings", "حلق فيليجري مدلدل", "Filigree Drops", P(32989025), 11200, { isFeatured: true, rating: 4.8, sold90: 22 }],
    ["honeycomb-huggies", "earrings", "حلق هاجي خلية نحل", "Honeycomb Huggies", P(32797484), 6400, { compareAtPrice: 7200, rating: 4.7, sold90: 31 }],
    ["silver-jhumka-studs", "earrings", "حلق فضة ولولي", "Silver Pearl Studs", P(22821354), 3200, { rating: 4.6, sold90: 24 }],
    ["star-lattice-earrings", "earrings", "حلق نجمة مفرغة", "Star Lattice Earrings", P(38404664), 7900, { rating: 4.8, sold90: 17 }],
    ["hoop-star-charm", "earrings", "حلق هوب بنجمة", "Hoop with Star Charm", P(34372559), 2900, { rating: 4.5, sold90: 28 }],
    // Bracelets & beads
    ["shell-charm-bracelet", "bracelets", "أسورة تشارمز صدف", "Shell Charm Bracelet", P(38909356), 3900, { rating: 4.8, sold90: 38 }],
    ["howlite-charm-bracelet", "bracelets", "أسورة هاوليت", "Howlite Charm Bracelet", P(20768643), 1250, { rating: 4.7, sold90: 34 }],
    ["wooden-bead-bracelets", "bracelets", "أساور خرز خشب", "Wooden Bead Bracelets", P(19029553), 650, { rating: 4.6, sold90: 59 }],
    ["mookaite-bead-bracelet", "bracelets", "أسورة خرز موكايت", "Mookaite Bracelet", P(11051718), 950, { rating: 4.7, sold90: 27 }],
    ["silver-sea-charm-bracelet", "bracelets", "أسورة تشارمز بحر", "Sea Charm Bracelet", P(38827930), 2800, { compareAtPrice: 3200, rating: 4.8, sold90: 22 }],
    ["aqua-jasper-bracelet", "bracelets", "أسورة جاسبر وأكوا", "Aqua Jasper Bracelet", P(11178580), 890, { rating: 4.6, sold90: 31 }],
    ["pearl-seed-bracelet", "bracelets", "أسورة لولي رفيعة", "Seed Pearl Bracelet", P(11075158), 1450, { rating: 4.9, sold90: 25 }],
    ["rosewood-bead-bracelet", "bracelets", "أسورة خرز خشب ورد", "Rosewood Bead Bracelet", P(31005906), 780, { rating: 4.5, sold90: 19 }],
    // Brooches & hair
    ["vintage-pearl-brooch", "brooches", "بروش لولي فينتدج", "Vintage Pearl Brooch", P(4974342), 2600, { isFeatured: true, rating: 4.8, sold90: 23 }],
    ["tortoise-clip-pair", "brooches", "مشبكين شعر", "Claw Clip Pair", P(18421514), 450, { rating: 4.6, sold90: 46 }],
    ["wooden-comb-pair", "brooches", "مشطين خشب", "Wooden Comb Pair", P(11751917), 350, { rating: 4.7, sold90: 39 }],
    ["filigree-lace-brooch", "brooches", "بروش فيليجري", "Filigree Brooch", P(37736472), 1800, { rating: 4.7, sold90: 14 }],
    ["daisy-pearl-brooch", "brooches", "بروش وردة باللولي", "Daisy Pearl Brooch", P(17434773), 3900, { rating: 4.9, sold90: 18 }],
    ["pearl-blossom-comb", "brooches", "مشط شعر ورد ولولي", "Pearl Blossom Comb", P(8281562), 1650, { rating: 4.8, sold90: 21 }],
    // Sunglasses
    ["tortoise-cat-eye", "sunglasses", "نضارة كات آي ترتر", "Tortoise Cat-Eye", P(10837797), 1650, { rating: 4.7, sold90: 32 }],
    ["round-wire-sunglasses", "sunglasses", "نضارة مدورة سلك", "Round Wire Sunglasses", P(3030690), 1250, { rating: 4.6, sold90: 26 }],
    ["white-cat-eye", "sunglasses", "نضارة كات آي بيضا", "White Cat-Eye", P(27347004), 1350, { rating: 4.5, sold90: 21 }],
    ["burgundy-round-sunglasses", "sunglasses", "نضارة مدورة نبيتي", "Burgundy Round", P(40474279), 1750, { rating: 4.7, sold90: 15 }],
    // Leather bags
    ["tan-buckle-crossbody", "bags", "شنطة كروس عسلي", "Tan Buckle Crossbody", P(8502477), 3200, { isFeatured: true, rating: 4.7, sold90: 27 }],
    ["ostrich-shoulder-bag", "bags", "شنطة جلد نعام", "Ostrich Shoulder Bag", P(30975807), 6800, { rating: 4.9, sold90: 12 }],
    ["patchwork-leather-clutch", "bags", "كلاتش جلد باتشورك", "Patchwork Clutch", P(15568699), 2900, { rating: 4.6, sold90: 18 }],
  ],
});

export const JEWELRY_WARM = libraryTemplate({
  key: JEWELRY_WARM_KEY,
  version: 1,
  name: L("تِبر", "Tibr"),
  description: L(
    "مجوهرات دافية بروح مجلة: صورة دهب على خشب، أقسام بعدد القطع وحكاية الورشة. للمتاجر الهاند ميد والدهب اليومي.",
    "Warm, editorial jewelry: gold on wood, categories with piece counts and the workshop story. For handmade and everyday-gold stores.",
  ),
  category: "jewelry",
  sortOrder: 1430,
  palette: ["#f6efe4", "#ece1d0", "#8a5a2b", "#c99a4b"],
  colors: {
    primary: "#8a5a2b",
    secondary: "#ece1d0",
    background: "#f6efe4",
    foreground: "#2d241b",
    muted: "#6f6152",
    border: "#dccdb7",
    accent: "#c99a4b",
  },
  fonts: { heading: "Noto Naskh Arabic", body: "IBM Plex Sans Arabic" },
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
        title: L("تعالي زورينا", "Come and visit"),
        text: L("١٤ شارع ٢٥٠، المعادي، القاهرة. مفتوح كل يوم من ١١ الصبح لـ ١٠ بالليل.", "14 Road 250, Maadi, Cairo. Open daily from 11am to 10pm."),
        heading: L("اسألينا عن أي قطعة", "Ask us about any piece"),
      }),
    },
    {
      slug: "faq",
      name: L("الأسئلة الشائعة", "FAQ"),
      seo: { title: L("الأسئلة الشائعة", "FAQ") },
      sections: faqPage(lib, {
        text: L("الخامات والمقاسات والعناية.", "Materials, sizing and care."),
        question: L("إزاي أحافظ على لمعة الدهب؟", "How do I keep my gold shining?"),
        answer: L(
          "امسحيه بقماشة ناعمة بعد كل لبسة، وشيليه قبل الشاور والبرفان. ومرة في السنة هاتيه الورشة ونلمّعه ببلاش.",
          "Wipe it with a soft cloth after each wear and take it off before showering or perfume. Once a year, bring it to the workshop and we polish it free.",
        ),
      }),
    },
  ],
  demo: DEMO,
  productPage: {
    thumbs: "bottom",
    band: "shelf",
    extras: ["product-perks"],
    copy: { reviews: L("من عميلاتنا", "From our clients"), related: L("قطع تليق معاها", "Pieces that suit it") },
  },
});
