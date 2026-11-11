/**
 * The women's shoes edition (niche editions, ROADMAP F-90): a women's shoe
 * shop, "Hanem". Sixteen pairs in four categories of four (heels, flats and
 * ballerinas, sandals, boots: one full row of four on every category row),
 * white-background packshots (`editionPhoto`, square, one pair each). Data
 * only. No React here.
 *
 * Materials are named only as the packshots show them and stay the same in
 * every name and line: patent (black pumps), suede (burgundy kitten heels,
 * camel boots), metallic (gold sandals, silver Mary Janes), leather (loafers,
 * woven sandals, ankle, knee and Chelsea boots), canvas and jute (the wedge).
 * Sizes 36 to 41 appear in copy only.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px or more
 * (2026-11-11): shelves, steps, sand and a sunlit wall; no people, legs, feet
 * or hands, no readable lettering or brand marks, none used by a template or
 * another pack, none twice. Some insoles carry a small dark label patch that
 * stays unreadable even at full size (14928875, 20682702, 16217395); photos
 * whose insole or sole lettering can be read were left out (below).
 * Hero 14928875 (wide: gold block-heel sandals on a white floating shelf) and
 * 20682702 (tall: white pumps against a sunlit wall with palm shadows).
 * Tiles: heels 13788573 (blue suede heels on a cowhide bench), flats
 * 37853534 (tan cross-strap ballerinas on a shop shelf), sandals 38583189
 * (tan sandals in white sand), boots 5863649 (rows of ankle boots on shop
 * shelves). Banner 16217395 (orange block-heel sandals on pale cracked
 * concrete, an empty field for copy on the left). Story / about 40773101
 * (green polka-dot slingbacks on a boutique shelf).
 * Shop the look 27256446: three pointed pumps on white steps, orange at the
 * top left, yellow in the middle, black at the bottom right. The dots are the
 * demo's three newest products, the closest pair to each (the burgundy suede
 * kitten heels, the beige pointed flats, the black patent pumps), so those
 * three stay first in `products`.
 *
 * Left out after the check: 5863630 (shop hang tags with a logo), 134064
 * (printed size and lettering inside), 29393718, 3682290, 3682293, 26925259,
 * 27174538, 27046139, 15766325, 18267917, 31450993, 9108930, 28861498,
 * 36593274, 34317569, 22589308, 35828603 (brand lettering on the insole or
 * sole), 9267585 (printed cards), 7543640 (sneaker logos), 27256462,
 * 27256473, 27256456, 27658707, 26774382 (brand emblems on boots or zips),
 * 27204307 and 17018821 (marks on the insole), 34334686 (insole lettering and
 * a fingertip), 10070653, 26796156, 27063075, 27046150, 32498579 (legs or
 * hands), 14783240 (sneakers, not this trade), 15106682 (sport sandals, not
 * this trade).
 *
 * Looks: `kasr` (the niche's template, one template per niche; it shows the
 * pack itself, Hanem), then `fashion-luxe` and `vella` until the shoes-and-bags
 * switch takes them off. For Kasr (checked by eye 2026-11-12 at 1400px or
 * more, no people, feet or lettering, used nowhere else): the hero's two side
 * campaigns, 27274309 (a black block-heel ankle boot on a white plinth) and
 * 15792209 (a coral strappy heel on a wooden block). Rejected: 13035176 (a
 * scuffed sole), 26965810, 30826570, 4109843, 10528003, 9327154 (insole
 * lettering or marks), 3782768 (lettering on the strap), 6046186, 6639326
 * (brand logos), 31450714, 1335450 (legs), 6371793 (peach, off the palette).
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews (no look
 * shows a reviews section).
 *
 * No hero video: none found without people or feet.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "womens-shoes";
const P = (slug: string) => editionPhoto(NICHE, slug);

const TILES = [pexels(13788573, 1200), pexels(37853534, 1200), pexels(38583189, 1200), pexels(5863649, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@hanem.example";

export const WOMENS_SHOES: Edition = {
  niche: NICHE,
  looks: ["kasr", "fashion-luxe", "vella"],
  priceBand: { min: 500, max: 4000 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("هانم", "Hanem"),
    description: L(
      "كعب وفلات وصنادل وبوتات حريمي، بمقاسات من ٣٦ لـ ٤١.",
      "Women's heels, flats, sandals and boots, in sizes 36 to 41.",
    ),
    categories: [
      ["heels", "كعب", "Heels", TILES[0]!],
      ["flats", "فلات وباليرينا", "Flats & ballerinas", TILES[1]!],
      ["sandals", "صنادل", "Sandals", TILES[2]!],
      ["boots", "بوتات", "Boots", TILES[3]!],
    ],
    // Newest first. The first three are the shop-the-look dots, top to bottom in the photo: orange, yellow, black.
    products: [
      ["burgundy-kitten-heels", "heels", "صندل كعب رفيع شامواه نبيتي مفتوح من ورا", "Burgundy Suede Kitten-Heel Slingbacks", P("burgundy-kitten-heels"), 1350, { rating: 4.7, sold90: 118 }],
      ["beige-pointed-flats", "flats", "فلات بيج بوز مدبّب", "Beige Pointed Flats", P("beige-pointed-flats"), 950, { rating: 4.6, sold90: 173 }],
      ["black-pointed-pumps", "heels", "جزمة كعب عالي لميع سوداء بوز مدبّب", "Black Patent Pointed Pumps", P("black-pointed-pumps"), 1450, { isFeatured: true, rating: 4.8, sold90: 226 }],
      // Heels
      ["nude-block-heels", "heels", "صندل كعب عريض بيج بحزام كاحل", "Nude Block-Heel Ankle-Strap Sandals", P("nude-block-heels"), 1250, { isFeatured: true, rating: 4.7, sold90: 194 }],
      ["gold-strappy-heels", "heels", "صندل سواريه سيور دهبي ميتاليك", "Gold Metallic Strappy Heels", P("gold-strappy-heels"), 1650, { compareAtPrice: 1900, rating: 4.8, sold90: 87 }],
      // Flats and ballerinas
      ["black-ballerina-flats", "flats", "باليرينا سوداء بفيونكة", "Black Bow Ballerina Flats", P("black-ballerina-flats"), 890, { isFeatured: true, rating: 4.8, sold90: 241 }],
      ["tan-leather-loafers-women", "flats", "لوفر جلد هافان حريمي", "Women's Tan Leather Loafers", P("tan-leather-loafers-women"), 1390, { rating: 4.7, sold90: 132 }],
      ["silver-mary-janes", "flats", "ماري جين فضي ميتاليك بتوكة", "Silver Metallic Mary Janes", P("silver-mary-janes"), 1050, { compareAtPrice: 1200, rating: 4.6, sold90: 104 }],
      // Sandals
      ["white-flat-sandals", "sandals", "صندل فلات أبيض بسيرين", "White Two-Strap Flat Sandals", P("white-flat-sandals"), 690, { rating: 4.6, sold90: 212 }],
      ["tan-woven-sandals", "sandals", "صندل جلد مضفّر هافان", "Tan Woven Leather Sandals", P("tan-woven-sandals"), 980, { rating: 4.7, sold90: 149 }],
      ["black-platform-sandals", "sandals", "صندل بلاتفورم أسود بتوكة", "Black Platform Buckle Sandals", P("black-platform-sandals"), 1190, { rating: 4.6, sold90: 126 }],
      ["beige-wedge-sandals", "sandals", "صندل ويدج كانفاس بيج بنعل خيش", "Beige Canvas Jute Wedge Sandals", P("beige-wedge-sandals"), 1290, { rating: 4.7, sold90: 98 }],
      // Boots
      ["black-ankle-boots", "boots", "هاف بوت جلد أسود بكعب عريض", "Black Leather Block-Heel Ankle Boots", P("black-ankle-boots"), 2350, { isFeatured: true, rating: 4.8, sold90: 157 }],
      ["camel-suede-boots", "boots", "هاف بوت شامواه جملي", "Camel Suede Ankle Boots", P("camel-suede-boots"), 2450, { compareAtPrice: 2800, rating: 4.7, sold90: 91 }],
      ["brown-knee-boots", "boots", "بوت جلد بني لحد الركبة", "Brown Leather Knee Boots", P("brown-knee-boots"), 3400, { rating: 4.8, sold90: 64 }],
      ["white-chelsea-boots", "boots", "بوت تشيلسي جلد أبيض", "White Leather Chelsea Boots", P("white-chelsea-boots"), 2250, { rating: 4.6, sold90: 83 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(14928875, 1920), tall: pexels(20682702, 1200) },
    tiles: TILES,
    banner: pexels(16217395, 2000),
    story: pexels(40773101, 1200),
    // The dots, in percent from the photo's left and top: the orange, the yellow and the black pump.
    look: {
      src: pexels(27256446, 1400),
      dots: [
        { x: 30, y: 33 },
        { x: 48, y: 54 },
        { x: 62, y: 78 },
      ],
    },
    // `kasr`: the hero's two side campaigns, 4:3 (boots for winter, heels for evenings).
    custom: {
      "hero-side-1": pexels(27274309, 1200),
      "hero-side-2": pexels(15792209, 1200),
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفعي عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story") },
    // Kasr's header and hero links, each to a search that finds that kind of pair.
    nav: [
      { label: L("بوتات", "Boots"), href: `/products?search=${encodeURIComponent("بوت")}` },
      { label: L("كعب", "Heels"), href: `/products?search=${encodeURIComponent("كعب")}` },
      { label: L("صنادل", "Sandals"), href: `/products?search=${encodeURIComponent("صندل")}` },
      { label: L("فلات", "Flats"), href: `/products?search=${encodeURIComponent("فلات")}` },
    ],
    hero: {
      alt: L("صندل كعب دهبي على رف أبيض فاضي", "Gold block-heel sandals on an empty white shelf"),
      eyebrow: L("تشكيلة الموسم", "This season's pairs"),
      title: L("لكل خطوة جوز يليق بيها", "A fitting pair for every step"),
      line: L(
        "كعب للسهرة، فلات للشغل، صنادل للصيف وبوتات للشتا، بمقاسات من ٣٦ لـ ٤١.",
        "Heels for the evening, flats for work, sandals for summer and boots for winter, in sizes 36 to 41.",
      ),
      cta: L("تسوّقي الأحذية", "Shop the shoes"),
    },
    categories: { title: L("اختاري على حسب يومك", "Shop by your day") },
    products: {
      primary: {
        title: L("الأكثر طلبًا", "Most-ordered pairs"),
        line: L("الموديلات اللي عميلاتنا بيرجعوا يطلبوها.", "The styles our customers come back for."),
      },
    },
    story: {
      alt: L("صندل كعب أخضر منقّط بفيونكة على رف في بوتيك", "Green polka-dot slingbacks with a bow on a boutique shelf"),
      eyebrow: L("المقاس أول حاجة", "Fit comes first"),
      title: L("جزمة مريحة من أول لبسة", "Comfortable from the first wear"),
      text: L(
        "بنقيس كل موديل قبل ما ينزل: طول الكعب وعرض البوز ونوع النعل، وبنكتبهم مع الخامة في صفحة كل جوز.",
        "We measure every style before it is listed: heel height, toe width and the sole, and we list them with the material on each pair's page.",
      ),
      cta: L("شوفي الجديد", "See what is new"),
    },
    look: {
      alt: L("تلات جزم كعب بوز مدبّب على سلالم بيضاء: برتقاني وأصفر وأسود", "Three pointed pumps on white steps: orange, yellow and black"),
      eyebrow: L("لوك المكتب", "The office look"),
      title: L("بوز مدبّب لكل يوم", "Pointed toes for every day"),
      text: L("دوسي على أي نقطة في الصورة وشوفي أقرب جوز ليها من تشكيلتنا.", "Tap a dot on the photo to see the closest pair from our range."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتيلنا طول رجلك بالسنتيمتر على واتساب", "Send us your foot length in centimetres on WhatsApp") },
      { title: L("ادفعي عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرفي الموديلات الجديدة أول واحدة", "Hear about new pairs first"),
      line: L("رسالة لما تنزل تشكيلة جديدة، مش أكتر.", "One letter when a new range arrives, nothing more."),
    },
    footer: { line: L("هانم: أحذية حريمي لكل خطوة في يومك.", "Hanem: women's shoes for every step of your day.") },
    about: {
      line: L("أحذية حريمي مختارة على المقاس والراحة.", "Women's shoes chosen for fit and comfort."),
      alt: L("صندل كعب أخضر منقّط على رف خشب في بوتيك", "Green polka-dot slingbacks on a wooden boutique shelf"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("جزمة حلوة ومريحة كمان", "Pretty pairs that feel good too"),
      text: L(
        "هانم بدأت من سؤال بنسمعه كتير: فيه جزمة شيك ومريحة في نفس الوقت؟ عشان كده بنجرّب كل موديل ونكتب مقاساته وخامته بالظبط قبل ما يتعرض.",
        "Hanem began with a question we hear a lot: is there a pair that is smart and comfortable at once? So we try every style and list its exact measurements and material before it is listed.",
      ),
      more: L("ولو المقاس مش مظبوط عليكي، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّقي الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("كلّمينا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("مش متأكدة من مقاسك؟ اسألينا", "Not sure of your size? Ask us"),
    },
    faq: {
      line: L("المقاسات والتوصيل والاستبدال.", "Sizing, delivery and exchanges."),
      question: L("إزاي أعرف مقاسي؟", "How do I find my size?"),
      answer: L(
        "قيسي طول رجلك بالسنتيمتر من الكعب لأطول صباع، وقارنيه بجدول المقاسات في صفحة الموديل. ولو بين مقاسين، ابعتيلنا القياس ونقولك الأنسب.",
        "Measure your foot in centimetres from the heel to the longest toe and compare it with the size chart on the style's page. If you are between two sizes, send us the measurement and we will tell you which fits.",
      ),
    },
    // Vella's footer contact column: demo values, the seller's own replace them.
    custom: {
      "contact-phone": L("٠١٠٠ ٠٠٠ ٠٠٠٠", PHONE_EN),
      "contact-email": L(`البريد: ${handle(EMAIL)}`, EMAIL),
      "contact-address": L("القاهرة، مصر", "Cairo, Egypt"),
      "contact-hours": L("كل يوم، ١١ ص – ١١ م", "Every day, 11am to 11pm"),
      // Vella's footer link to the whole catalog (its default reads "Offers").
      "footer-offers": L("كل الأحذية", "All shoes"),
      // fashion-luxe: the link to the whole catalog, and the noun after a category tile's count.
      "shop-all": L("كل الأحذية", "All shoes"),
      "products-noun": L("موديلات", "styles"),
      // Kasr's hero: the label on the ticket (like the end of a shoe box), then the two side campaigns (a tag and a title each; the title is also the photo's alt).
      "hero-label": L("مقاسات من ٣٦ لـ ٤١", "Sizes 36 to 41"),
      "hero-side-1-tag": L("للشتا", "For winter"),
      "hero-side-1-title": L("بوت بكعب عريض ثابت", "Boots on a steady block heel"),
      "hero-side-2-tag": L("للسهرة", "For evenings"),
      "hero-side-2-title": L("كعب رفيع بسيور", "Strappy high heels"),
      // Kasr's categories: the small line over their title.
      "categories-eyebrow": L("على حسب النوع", "By type"),
      // Kasr's size guide (the trade's own section): a title and a line, then three groups of rows (a size and its foot length).
      "size-title": L("مقاسك بالسنتيمتر", "Your size in centimetres"),
      "size-line": L(
        "قيسي رجلك من الكعب لأطول صباع. ولو بين مقاسين، خدي الأكبر في الكعب والبوز المدبّب.",
        "Measure from your heel to your longest toe. Between two sizes? Go up in heels and pointed toes.",
      ),
      "size-group-1": L("مقاس ٣٦ لـ ٣٨", "Sizes 36 to 38"),
      "size-group-2": L("مقاس ٣٩ و٤٠", "Sizes 39 and 40"),
      "size-group-3": L("مقاس ٤١، وبين مقاسين", "Size 41, and in between"),
      "size-row-1-name": L("مقاس ٣٦", "Size 36"),
      "size-row-1-value": L("٢٣ سم", "23 cm"),
      "size-row-2-name": L("مقاس ٣٧", "Size 37"),
      "size-row-2-value": L("٢٣٫٥ سم", "23.5 cm"),
      "size-row-3-name": L("مقاس ٣٨", "Size 38"),
      "size-row-3-value": L("٢٤ سم", "24 cm"),
      "size-row-4-name": L("مقاس ٣٩", "Size 39"),
      "size-row-4-value": L("٢٥ سم", "25 cm"),
      "size-row-5-name": L("مقاس ٤٠", "Size 40"),
      "size-row-5-value": L("٢٥٫٥ سم", "25.5 cm"),
      "size-row-6-name": L("مقاس ٤١", "Size 41"),
      "size-row-6-value": L("٢٦ سم", "26 cm"),
      "size-row-7-name": L("بين مقاسين؟", "Between two sizes?"),
      "size-row-7-value": L("خدي الأكبر في الكعب", "Go up in heels"),
      // Kasr's campaign beside the sandals row, on `photos.banner`; its button is `nav.2`.
      "banner-alt": L("صندل شامواه برتقاني بكعب عريض على أرضية أسمنت فاتحة", "Orange suede block-heel sandals on pale concrete"),
      "banner-eyebrow": L("للصيف", "For summer"),
      "banner-title": L("صنادل تكمّل بيها المشوار", "Sandals for the long walk"),
      "banner-line": L("كعب عريض ثابت وسيور ناعمة، من الفلات للويدج.", "Steady block heels and soft straps, from flats to wedges."),
      // Kasr's promises: the title on the bordeaux tile beside the first three promises.
      "promises-title": L("كل جوز بيتقاس قبل ما يتعرض", "Every pair is measured before it is listed"),
    },
  },
  productPage: { copy: { reviews: L("آراء عميلاتنا", "What our customers say"), related: L("أحذية ممكن تعجبك", "Shoes you may like") } },
  // Vella's own shop (owner, 2026-11-11: two looks of one niche must not look duplicated): "Mishya", shoes made
  // for walking all day, winter boots first. Same pairs and prices; its own copy, photos and row order.
  perLook: {
    vella: {
      store: {
        name: L("مِشية", "Mishya"),
        description: L("جزم وبوتات وصنادل حريمي تمشي بيها اليوم كله.", "Women's shoes, boots and sandals made for walking all day."),
      },
      copy: {
        announcement: [
          L("البوتات الشتوي وصلت", "Winter boots are in"),
          L("التوصيل لكل مصر", "Delivery across Egypt"),
          L("مقاسات من ٣٦ لـ ٤١", "Sizes 36 to 41"),
        ],
        hero: {
          alt: L("جزمة كعب قطيفة حمرا على سلالم خشب في جنينة", "Red velvet pumps on wooden garden steps"),
          eyebrow: L("موسم الخروج", "Out and about"),
          title: L("امشي بثقة طول اليوم", "Walk tall all day"),
          line: L("بوتات للشتا، كعب للسهرة، فلات للشغل وصنادل للصيف.", "Boots for winter, heels for evenings, flats for work and sandals for summer."),
          cta: L("اختاري جوزك", "Find your pair"),
        },
        categories: { title: L("على حسب المشوار", "Shop by where you are going") },
        products: {
          primary: {
            title: L("الجزم اللي بتخلص بسرعة", "The pairs that sell out"),
            line: L("الموديلات اللي بنرجّع مقاساتها كل أسبوع.", "The styles we restock every week."),
          },
        },
        // The band over the banner (silver heels against white blinds); its button goes to the newest pairs.
        story: {
          alt: L("صندل كعب فضي قدام شيش أبيض", "Silver strappy heels against white blinds"),
          eyebrow: L("سهرة الويك إند", "The weekend plan"),
          title: L("كعب يستحمل السهرة كلها", "Heels that last the whole night"),
          text: L(
            "بنختار كعب ثابت ونعل مبطّن، وبنكتب طول الكعب بالسنتيمتر في صفحة كل جوز.",
            "We choose steady heels and padded insoles, and list the heel height in centimetres on each pair's page.",
          ),
          cta: L("تسوّقي الجديد", "Shop new in"),
        },
        trust: [
          { title: L("اتجربت في مشوار", "Walk-tested"), line: L("كل موديل اتلبس قبل ما ينزل", "Every style is worn before it is listed") },
          { title: L("تبديل المقاس", "Size swaps"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
          { title: L("طول الكعب مكتوب", "Heel height listed"), line: L("بالسنتيمتر في كل صفحة", "In centimetres on every page") },
          { title: L("ادفعي عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
        ],
        newsletter: {
          title: L("البوتات الجديدة أول بأول", "New boots as they land"),
          line: L("رسالة لما ينزل موديل جديد أو يرجع مقاس خلص.", "A letter when a new style lands or a sold-out size returns."),
        },
        footer: { line: L("مِشية: جزم حريمي تمشي بيها اليوم كله.", "Mishya: women's shoes for walking all day.") },
        about: {
          line: L("جزم حريمي معمولة للمشي، مش للصورة بس.", "Women's shoes made for walking, not just for photos."),
          alt: L("جزمة كعب سودا على كرسي أبيض", "Black heels on a white chair"),
          eyebrow: L("عننا", "About us"),
          title: L("الجزمة الحلوة لازم تتمشي", "A good pair has to walk"),
          text: L(
            "مِشية بدأت من كعب جميل وجعنا بعد ساعة. من ساعتها بنلبس كل موديل في مشوار حقيقي قبل ما ينزل، ونكتب نوع النعل وطول الكعب بالظبط.",
            "Mishya began with a beautiful heel that hurt after an hour. Since then we wear every style on a real errand before it is listed, and note the sole and the exact heel height.",
          ),
          more: L("ولو المقاس مش مريح، بنبدّله خلال ١٤ يوم.", "And if the size is not comfortable, we exchange it within 14 days."),
          cta: L("الأكثر طلبًا عندنا", "Our best sellers"),
        },
        contact: {
          title: L("اسألينا", "Ask us"),
          line: L(`المنصورة، مصر، ${PHONE_AR}، ${handle("hello@mishya.example")}`, `Mansoura, Egypt | ${PHONE_EN} | hello@mishya.example`),
          heading: L("مش عارفة مقاسك في الموديل ده؟ اسألينا", "Not sure of your size in this style? Ask us"),
        },
        faq: {
          line: L("المقاسات والتوصيل والتبديل.", "Sizes, delivery and swaps."),
          question: L("البوت بييجي على المقاس ولا آخد أكبر؟", "Do the boots run true to size?"),
          answer: L(
            "أغلب البوتات على المقاس العادي، ولو بتلبسي شراب تقيل خدي نمرة أكبر. صفحة كل موديل بتقول لو قالبه ضيق أو واسع.",
            "Most boots run true to size; if you wear thick socks, take one size up. Each style's page says if it runs small or large.",
          ),
        },
        custom: {
          "contact-email": L(`البريد: ${handle("hello@mishya.example")}`, "hello@mishya.example"),
          "contact-address": L("المنصورة، مصر", "Mansoura, Egypt"),
          "contact-hours": L("السبت للخميس، ١٠ ص – ١٠ م", "Saturday to Thursday, 10am to 10pm"),
        },
      },
      // Pexels, checked by eye 2026-11-11 (no people, feet or readable lettering): red, white and black.
      photos: {
        hero: { wide: pexels(14943486, 1920), tall: pexels(5713781, 1200) },
        tiles: [pexels(4374434, 1200), pexels(5168562, 1200), pexels(23692992, 1200), pexels(38356064, 1200)],
        banner: pexels(34538740, 2000),
        story: pexels(3782771, 1200),
      },
      // Boots first (the season), then heels, flats and sandals.
      journey: { rows: [4, 1, 2, 3] },
    },
  },
};
