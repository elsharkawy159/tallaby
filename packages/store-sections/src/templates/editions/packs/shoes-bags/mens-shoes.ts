/**
 * The men's shoes edition (niche editions, ROADMAP F-90): a men's shoe shop,
 * "Qaleb" (Arabic for the shoe last a pair is built on). Sixteen pairs in
 * four categories of four (loafers, oxfords and derbies, boots, sandals and
 * casual), white-background packshots (`editionPhoto`, square, one pair
 * each). Data only. No React here.
 *
 * Shipped on zay only: ghorza, the niche's other planned look, is not
 * edition-ready yet.
 *
 * Materials are named from what each packshot shows and stay the same in
 * every name and line: suede (navy loafers, tan driving moccasins, brown
 * Chelsea boots, tan desert boots on a crepe sole), leather (everything
 * else: penny and tassel loafers, oxfords, brogues, derbies, black Chelsea
 * boots, lace-up boots, sandals, slides, white sneakers, navy boat shoes).
 * Sizes 40 to 46 appear in copy only.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * shop shelves, steps, rugs and wood; no people, legs, feet or hands, no
 * readable lettering or brand marks (insoles and soles checked), none used by
 * a template or another pack, none twice.
 * Hero 40321494 (wide: dark brown derbies on a pale shop shelf, a stone wall
 * behind) and 8159429 (tall: tan boots and cap-toe shoes on white marble
 * steps). Tiles: loafers 19335787 (brown leather moccasin loafers on a cream
 * rug), oxfords and derbies 6765524 (brown wingtip brogues with cedar shoe
 * trees on a shop stand), boots 37595187 (a row of Chelsea boots along a
 * lit wooden shelf; the price tags are blurred and unreadable), sandals and
 * casual 35059665 (two-buckle suede sandals by a succulent against pale
 * planks). Banner 9992898 (perforated dark brown derbies on a log, a blurred
 * room around them). Story / about 5710709 (worn brown lace-up boots under a
 * light shelf with dried wheat and a notebook). Zay's hero collage: 7887198
 * (4:5, tan leather boat shoes on dark), 25381178 (square, cognac penny
 * loafers on white soles), 8553594 (4:3, tan brogue toes on a woven
 * herringbone tray).
 *
 * Left out after the check: 33812005 (a label with lettering on a shoe, and
 * insole print), 34621983 ("DAN…" stamped on an insole), 29258015 and
 * 27742731 (brand-style buckles), 35641834 and 7248031 (insole lettering),
 * 7330204 (GREYDER on the insoles), 8159364 (an insole logo), 9003700 (a
 * brand mark on the insoles), 32900824 (a part-hidden stamp inside the
 * sandal), 2244753, 12208951 and 9108931 (footbed lettering), 9511915
 * (RONSON lettering), 1454720 (a sewn label), 6592321, 6627030 and the
 * lifestyle searches (people, legs or feet), 23692992 (a women's sandal).
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews, so zay's
 * home ends on its best-seller carousel.
 *
 * No hero video: zay's collage hero has none.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "mens-shoes";
const P = (slug: string) => editionPhoto(NICHE, slug);

const TILES = [pexels(19335787, 1200), pexels(6765524, 1200), pexels(37595187, 1200), pexels(35059665, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@qaleb.example";

export const MENS_SHOES: Edition = {
  niche: NICHE,
  looks: ["zay"],
  priceBand: { min: 600, max: 4200 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("قالب", "Qaleb"),
    description: L(
      "أحذية رجالي جلد طبيعي وسويد: لوفر وأكسفورد وبوتات وصنادل، للشغل والسهرة والإجازة.",
      "Men's shoes in leather and suede: loafers, oxfords, boots and sandals, for work, evenings and days off.",
    ),
    categories: [
      ["loafers", "لوفر وموكاسان", "Loafers & moccasins", TILES[0]!],
      ["oxfords-derbies", "أكسفورد وديربي", "Oxfords & derbies", TILES[1]!],
      ["boots", "بوتات", "Boots", TILES[2]!],
      ["sandals-casual", "صنادل وكاجوال", "Sandals & casual", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category.
    products: [
      ["brown-penny-loafers", "loafers", "لوفر بيني جلد بني", "Brown Leather Penny Loafers", P("brown-penny-loafers"), 1850, { isFeatured: true, rating: 4.8, sold90: 236 }],
      ["black-oxford-shoes", "oxfords-derbies", "جزمة أكسفورد جلد أسود", "Black Leather Oxford Shoes", P("black-oxford-shoes"), 2400, { isFeatured: true, rating: 4.8, sold90: 198 }],
      ["brown-chelsea-boots", "boots", "بوت تشيلسي سويد بني", "Brown Suede Chelsea Boots", P("brown-chelsea-boots"), 2850, { isFeatured: true, rating: 4.7, sold90: 142 }],
      ["white-leather-sneakers-men", "sandals-casual", "كوتشي جلد أبيض", "White Leather Sneakers", P("white-leather-sneakers-men"), 1650, { isFeatured: true, rating: 4.7, sold90: 287 }],
      ["navy-suede-loafers", "loafers", "لوفر سويد كحلي", "Navy Suede Loafers", P("navy-suede-loafers"), 1750, { compareAtPrice: 2100, rating: 4.6, sold90: 121 }],
      ["brown-brogues", "oxfords-derbies", "جزمة بروج جلد بني", "Brown Leather Brogues", P("brown-brogues"), 2650, { rating: 4.8, sold90: 109 }],
      ["black-chelsea-boots", "boots", "بوت تشيلسي جلد أسود", "Black Leather Chelsea Boots", P("black-chelsea-boots"), 3200, { rating: 4.8, sold90: 133 }],
      ["navy-boat-shoes", "sandals-casual", "حذاء مراكب جلد كحلي", "Navy Leather Boat Shoes", P("navy-boat-shoes"), 1450, { rating: 4.6, sold90: 154 }],
      ["black-tassel-loafers", "loafers", "لوفر جلد أسود بشرّابة", "Black Leather Tassel Loafers", P("black-tassel-loafers"), 1950, { rating: 4.7, sold90: 167 }],
      ["dark-brown-derby-shoes", "oxfords-derbies", "جزمة ديربي جلد بني غامق", "Dark Brown Leather Derby Shoes", P("dark-brown-derby-shoes"), 2200, { rating: 4.7, sold90: 176 }],
      ["tan-desert-boots", "boots", "بوت ديزرت سويد هافان", "Tan Suede Desert Boots", P("tan-desert-boots"), 2300, { rating: 4.6, sold90: 118 }],
      ["brown-leather-sandals-men", "sandals-casual", "صندل جلد بني", "Brown Leather Sandals", P("brown-leather-sandals-men"), 950, { rating: 4.6, sold90: 241 }],
      ["tan-driving-moccasins", "loafers", "موكاسان سواقة سويد هافان", "Tan Suede Driving Moccasins", P("tan-driving-moccasins"), 1450, { rating: 4.7, sold90: 189 }],
      ["burgundy-oxford-shoes", "oxfords-derbies", "جزمة أكسفورد جلد نبيتي", "Burgundy Leather Oxford Shoes", P("burgundy-oxford-shoes"), 2500, { compareAtPrice: 2900, rating: 4.7, sold90: 84 }],
      ["dark-brown-lace-up-boots", "boots", "بوت برباط جلد بني غامق", "Dark Brown Leather Lace-Up Boots", P("dark-brown-lace-up-boots"), 3600, { compareAtPrice: 3990, rating: 4.8, sold90: 72 }],
      ["black-leather-slides-men", "sandals-casual", "شبشب جلد أسود", "Black Leather Slides", P("black-leather-slides-men"), 750, { rating: 4.5, sold90: 263 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(40321494, 1920), tall: pexels(8159429, 1200) },
    tiles: TILES,
    banner: pexels(9992898, 2000),
    story: pexels(5710709, 1200),
    // Zay's hero collage: 1 portrait 4:5, 2 square, 3 landscape 4:3, one per caption (`custom.hero-piece-1..3`).
    custom: {
      "hero-piece-1": pexels(7887198, 1200),
      "hero-piece-2": pexels(25381178, 900),
      "hero-piece-3": pexels(8553594, 1400),
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفع عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("دوّر على لوفر، أكسفورد، بوت…", "Search loafers, oxfords, boots…") },
    hero: {
      alt: L("جزم ديربي جلد بني غامق على رف فاتح في محل", "Dark brown leather derbies on a pale shop shelf"),
      eyebrow: L("جلد وسويد", "Leather and suede"),
      title: L("الجوز اللي يكمّل لبسك", "The pair that finishes the outfit"),
      line: L(
        "لوفر للشغل، وأكسفورد للمناسبات، وبوت للشتا، وصندل للإجازة، بمقاسات من ٤٠ لـ ٤٦.",
        "Loafers for work, oxfords for occasions, boots for winter and sandals for days off, in sizes 40 to 46.",
      ),
      cta: L("شوف الجديد", "See what is new"),
    },
    categories: { title: L("اختار على حسب المشوار", "Choose by the occasion") },
    products: {
      primary: {
        title: L("على الرف دلوقتي", "On the shelf now"),
        line: L("آخر الموديلات اللي وصلت، والأكتر طلبًا، والأعلى تقييمًا.", "The newest pairs, the most ordered and the best rated."),
      },
    },
    story: {
      alt: L("بوت جلد بني متلبّس كتير تحت رف فاتح عليه سنابل قمح ونوتة", "Worn brown leather boots under a light shelf with dried wheat and a notebook"),
      eyebrow: L("الجلد بيحلو مع الوقت", "Leather gets better with time"),
      title: L("جزمة تعيش معاك سنين", "A pair that lasts for years"),
      text: L(
        "بنكتب خامة كل جوز ونوع نعله في صفحته: جلد طبيعي أو سويد، نعل جلد أو كاوتش أو كريب. ومع شوية عناية، الجلد بيلين وياخد شكل رجلك.",
        "Every pair's page names its upper and its sole: leather or suede, a leather, rubber or crepe sole. With a little care, leather softens and takes the shape of your foot.",
      ),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    // Zay's carousel of best sellers.
    rows: [{ title: L("بيرجعوا ياخدوا لون تاني", "They come back for another colour") }],
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتلنا طول رجلك بالسنتيمتر على واتساب", "Send us your foot length in centimetres on WhatsApp") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "Hear about new pairs first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    // Zay's large sign-off line.
    footer: { line: L("ابدأ من رجلك", "Start from your feet") },
    about: {
      line: L("أحذية رجالي جلد وسويد، مختارة على الخامة والمقاس.", "Men's leather and suede shoes, chosen for their make and their fit."),
      alt: L("بوت جلد بني متلبّس كتير تحت رف فاتح عليه سنابل قمح ونوتة", "Worn brown leather boots under a light shelf with dried wheat and a notebook"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("كل جزمة بتبدأ من قالب", "Every shoe starts from a last"),
      text: L(
        "قالب اسمه جاي من القالب الخشب اللي الجزمة بتتعمل عليه، لأن هو اللي بيحدد هتريّحك ولا لأ. فبنختار كل موديل على حسب قالبه وجلده ونعله، وبنكتب مقاساته من ٤٠ لـ ٤٦ في صفحته.",
        "Qaleb is named after the wooden last a shoe is built on, because the last decides whether it will be comfortable. So we choose every style for its last, its leather and its sole, and list its sizes from 40 to 46 on its page.",
      ),
      more: L("ولو المقاس مش مظبوط عليك، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّق الأحذية", "Shop the shoes"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتار بين مقاسين؟ اسألنا", "Between two sizes? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات والتوصيل.", "Sizes, materials and delivery."),
      question: L("أختار مقاسي إزاي؟", "How do I pick my size?"),
      answer: L(
        "قيس طول رجلك بالسنتيمتر من الكعب لأطول صباع وقارنه بجدول المقاسات في صفحة الموديل. اللوفر والأكسفورد بيبقوا مظبوطين على الرجل، فلو بين مقاسين خد الأكبر، ولو محتار ابعتلنا المقاس ونقولك الأنسب.",
        "Measure your foot in centimetres from the heel to the longest toe and compare it with the size chart on the style's page. Loafers and oxfords fit close, so if you are between two sizes take the larger one; if you are unsure, send us the measurement and we will tell you which fits.",
      ),
    },
    custom: {
      // Zay: the store's short name inside a sentence ("Why Qaleb?", "About Qaleb").
      "store-short": L("قالب", "Qaleb"),
      // Zay's hero captions, numbered under the collage photos: boat shoes, penny loafers, brogues.
      "hero-piece-1": L("كاجوال", "Casual"),
      "hero-piece-2": L("لوفر", "Loafers"),
      "hero-piece-3": L("بروج", "Brogues"),
      // Zay's comparison: rows 1 and 3 are ticked for the store only, row 2 for both.
      "compare-row-1": L("الخامة ونوع النعل مكتوبين لكل جوز", "Upper and sole named for every pair"),
      "compare-row-2": L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      "compare-row-3": L("مقاسات من ٤٠ لـ ٤٦ لكل موديل", "Sizes 40 to 46 in every style"),
    },
  },
  productPage: { copy: { reviews: L("آراء اللي لبسوها", "From people who wear them"), related: L("موديلات ممكن تعجبك", "Pairs you may like") } },
};
