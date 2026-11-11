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
 * No buyer quotes (`reviews`): a pack holds no invented reviews (neither look
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
  looks: ["fashion-luxe", "vella"],
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
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفعي عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { about: L("حكايتنا", "Our story") },
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
    },
  },
  productPage: { copy: { reviews: L("آراء عميلاتنا", "What our customers say"), related: L("أحذية ممكن تعجبك", "Shoes you may like") } },
};
