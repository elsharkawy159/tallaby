/**
 * The sneakers edition (niche editions, ROADMAP F-90): a street sneaker shop,
 * "Raseef" (Arabic for the pavement a pair is worn on). Sixteen pairs in four
 * categories of four (everyday white, running, high-tops, slip-ons and
 * canvas), white-background packshots (`editionPhoto`, square, one pair
 * each). Data only. No React here.
 *
 * Shipped on streetwear only: sports-bold and stride, the niche's other
 * planned looks, are not edition-ready yet.
 *
 * Brand rule: every pair is unbranded. No product, category or line names a
 * brand or says a pair is "inspired by" one. Materials are named from what
 * each packshot shows: leather (the white, green-heel and chunky low-tops,
 * the brown high-top), suede (the cream low-top on a gum sole, the grey
 * high-top), mesh or knit (the runners), canvas (everything else). Sizes 36
 * to 45 appear in copy only.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * shop shelves, studio paper, a clothesline and power lines; no people, legs,
 * feet or hands, no logos, stripes, swooshes or readable lettering, none used
 * by a template or another pack, none twice.
 * Hero 1020372 (wide: a pink metal shelf of pastel knit runners on black;
 * the shoes are small and their side marks unreadable) and 11827147 (tall:
 * one white and black chunky sneaker alone on an orange wooden shoe rack).
 * Tiles: everyday white 7193625 (cream leather low-tops from above on pale
 * boards), running 9207813 (mint knit runners against a coral wall),
 * high-tops 29253011 (black canvas mid-tops pegged on a clothesline over a
 * striped concrete wall), slip-ons and canvas 5488660 (burgundy canvas
 * low-tops on orange and blue paper; a heel tab too small to read). Banner
 * 13807630 (white and olive sneakers on oak shop shelves). Story / about
 * 4296075 (white canvas low-tops with zigzag stitching on red, orange and
 * green paper). Streetwear's lookbook (square crops): 12969390 (black canvas
 * toes with red piping from above on white), 12559681 (a pair hanging from
 * power lines against a blue sky), 8248705 (a yellow leaf on a black leather
 * toe), 35582921 (grey laces through black nubuck, close up), 7193623 (cream
 * low-tops on a cane chair).
 *
 * Left out after the check: 1447262 (insole lettering), 1456733, 28271086
 * and 26891191 (three-stripe marks), 267326 (side logos), 26555806 (ankle
 * patch and sole lettering), 28144050 (script lettering on the tongue),
 * 1667434 (tongue lettering), 8858124 (a heel logo), 34003824 (a label at
 * the edge), 14525665 (a side tag with a brand name), 11324548 (lettering on
 * the laces), 2547007 (size tags), 3987284, 30128844, 4271563, 4271570,
 * 4271574, 4271576, 4271578, 4271584 and 12969235 (ankle patches, tongue
 * labels or box lettering), 9250037, 2529157, 16947118, 38487263,
 * 12628400, 18375077, 28593086, 19294576, 13691725, 29573336, 39559877,
 * 3067850, 12286497, 38914244, 35618111, 35618110, 35618109, 14447345,
 * 13157838, 3434962, 3927385 and 4695175 (logos or lettering), photos with
 * people, legs or feet (10924114, 11663405, 14471259, 1477538, 15657483,
 * 18603067, 18715694, 2456362, 26837733, 27863940, 28953576, 29639772,
 * 31064307, 9660906, 8481617, 18202585, 8003531, 7857502, 8605035,
 * 33231313, 8092975, 27100548, 2084829, 29548615, 9333372, 11545378),
 * 33366585, 33622444, 2908975, 12252417, 12081507, 8633771, 5698848 and
 * 36738046 (shop clutter with brand marks or signs), 10643476 (insole
 * print), 2918534 (logos on the tongues), 11513443 and 10497369 (swooshes).
 * Already used by a template or another pack: 7916058, 7857501, 8117154,
 * 7543640.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews, so
 * streetwear's about page is built without that section.
 *
 * No hero video: none found without people, feet or logos.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "sneakers";
const P = (slug: string) => editionPhoto(NICHE, slug);

const TILES = [pexels(7193625, 1200), pexels(9207813, 1200), pexels(29253011, 1200), pexels(5488660, 1200)];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@raseef.example";
const HANDLE = handle("@raseef");

export const SNEAKERS: Edition = {
  niche: NICHE,
  looks: ["streetwear"],
  priceBand: { min: 700, max: 2800 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("رصيف", "Raseef"),
    description: L(
      "كوتشيات بيضا لكل يوم، ورانينج وهاي توب وسليب أون، بمقاسات من ٣٦ لـ ٤٥.",
      "Everyday white sneakers, runners, high-tops and slip-ons, in sizes 36 to 45.",
    ),
    categories: [
      ["everyday-white", "أبيض لكل يوم", "Everyday white", TILES[0]!],
      ["running", "رانينج", "Running", TILES[1]!],
      ["high-tops", "هاي توب", "High-tops", TILES[2]!],
      ["slip-ons-canvas", "سليب أون وكانفس", "Slip-ons & canvas", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category.
    products: [
      ["white-leather-low-top", "everyday-white", "كوتشي جلد أبيض سادة", "White Leather Low-Top", P("white-leather-low-top"), 1450, { isFeatured: true, rating: 4.8, sold90: 312 }],
      ["black-mesh-runner", "running", "كوتشي رانينج شبك أسود", "Black Mesh Runner", P("black-mesh-runner"), 1150, { isFeatured: true, rating: 4.7, sold90: 274 }],
      ["black-canvas-high-top", "high-tops", "هاي توب كانفس أسود", "Black Canvas High-Top", P("black-canvas-high-top"), 950, { isFeatured: true, rating: 4.8, sold90: 251 }],
      ["navy-canvas-slip-on", "slip-ons-canvas", "سليب أون كانفس كحلي", "Navy Canvas Slip-On", P("navy-canvas-slip-on"), 750, { rating: 4.6, sold90: 198 }],
      ["white-chunky-sneaker", "everyday-white", "كوتشي شانكي أبيض بنعل عالي", "White Chunky Sneaker", P("white-chunky-sneaker"), 1850, { compareAtPrice: 2200, isFeatured: true, rating: 4.7, sold90: 236 }],
      ["grey-knit-runner", "running", "كوتشي رانينج تريكو رمادي", "Grey Knit Runner", P("grey-knit-runner"), 1250, { rating: 4.6, sold90: 187 }],
      ["brown-leather-high-top", "high-tops", "هاي توب جلد بني", "Brown Leather High-Top", P("brown-leather-high-top"), 2600, { rating: 4.8, sold90: 94 }],
      ["black-checker-slip-on", "slip-ons-canvas", "سليب أون كاروهات أبيض وأسود", "Black and White Checkerboard Slip-On", P("black-checker-slip-on"), 850, { rating: 4.7, sold90: 223 }],
      ["white-green-heel-low-top", "everyday-white", "كوتشي جلد أبيض بكعب أخضر", "White Leather Low-Top with a Green Heel", P("white-green-heel-low-top"), 1550, { rating: 4.7, sold90: 168 }],
      ["navy-orange-runner", "running", "كوتشي رانينج كحلي وبرتقالي", "Navy and Orange Runner", P("navy-orange-runner"), 1350, { compareAtPrice: 1600, rating: 4.6, sold90: 176 }],
      ["white-canvas-high-top", "high-tops", "هاي توب كانفس أبيض", "White Canvas High-Top", P("white-canvas-high-top"), 950, { rating: 4.6, sold90: 205 }],
      ["beige-canvas-low-top", "slip-ons-canvas", "كوتشي كانفس بيج", "Beige Canvas Low-Top", P("beige-canvas-low-top"), 790, { rating: 4.5, sold90: 141 }],
      ["cream-suede-low-top", "everyday-white", "كوتشي شمواه كريمي بنعل عسلي", "Cream Suede Low-Top on a Gum Sole", P("cream-suede-low-top"), 1750, { rating: 4.8, sold90: 117 }],
      ["white-pink-runner", "running", "كوتشي رانينج أبيض وبمبي", "White and Pink Runner", P("white-pink-runner"), 1250, { rating: 4.7, sold90: 162 }],
      ["grey-suede-high-top", "high-tops", "هاي توب شمواه رمادي", "Grey Suede High-Top", P("grey-suede-high-top"), 2200, { compareAtPrice: 2500, rating: 4.7, sold90: 83 }],
      ["olive-canvas-low-top", "slip-ons-canvas", "كوتشي كانفس زيتي", "Olive Canvas Low-Top", P("olive-canvas-low-top"), 790, { rating: 4.6, sold90: 129 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(1020372, 1920), tall: pexels(11827147, 1200) },
    tiles: TILES,
    banner: pexels(13807630, 2000),
    story: pexels(4296075, 1200),
    custom: {
      // Streetwear's lookbook, square: one large photo, then four small ones.
      "lookbook-1": pexels(12969390, 1200),
      "lookbook-2": pexels(12559681, 900),
      "lookbook-3": pexels(8248705, 900),
      "lookbook-4": pexels(35582921, 900),
      "lookbook-5": pexels(7193623, 900),
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("ادفع عند الاستلام", "Pay on delivery"),
      L("استبدال المقاس خلال ١٤ يوم", "Size exchange within 14 days"),
    ],
    labels: { search: L("دوّر على رانينج، هاي توب، أبيض…", "Search runners, high-tops, white pairs…") },
    hero: {
      alt: L("رف بمبي عليه كوتشيات رانينج بألوان هادية على خلفية سودا", "A pink shelf of pastel runners against black"),
      eyebrow: L("وصل الموسم الجديد", "The new season is in"),
      title: L("كوتشي للشارع، مريح لآخر اليوم", "Street pairs, comfy all day"),
      line: L(
        "أبيض سادة، رانينج خفيف، هاي توب وسليب أون، بمقاسات من ٣٦ لـ ٤٥ وتوصيل لحد باب البيت.",
        "Plain whites, light runners, high-tops and slip-ons, in sizes 36 to 45, delivered to your door.",
      ),
      cta: L("تسوّق الكوتشيات", "Shop the pairs"),
    },
    categories: { title: L("اختار ستايلك", "Pick your style") },
    products: {
      primary: {
        // Streetwear: the eyebrow is also the footer's link to the newest products.
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("آخر حاجة نزلت", "Fresh drops"),
        line: L("أحدث الكوتشيات اللي وصلت المحل.", "The latest pairs to land in the shop."),
      },
    },
    story: {
      alt: L("كوتشي كانفس أبيض بخياطة زجزاج على ورق ملوّن", "White canvas low-tops with zigzag stitching on coloured paper"),
      eyebrow: L("بنختار بالعين والرجل", "Picked by eye and by foot"),
      title: L("مش أي كوتشي يدخل الرف", "Not every pair makes the shelf"),
      text: L(
        "بنلبس كل موديل قبل ما ننزّله: نشوف النعل بيستحمل الأسفلت، والخياطة ماسكة، والمقاس مظبوط على الجدول. واللي ما يعجبناش ما بيوصلكش.",
        "We wear every style before we stock it: we check the sole takes the asphalt, the stitching holds and the size matches the chart. What does not pass never reaches you.",
      ),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    // Streetwear's bento of best sellers.
    rows: [{ title: L("الأكتر طلبًا", "Most wanted") }],
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنوصّل لكل محافظات مصر", "We deliver to every governorate") },
      { title: L("استبدال المقاس", "Size exchange"), line: L("خلال ١٤ يوم من الاستلام", "Within 14 days of delivery") },
      { title: L("مساعدة في المقاس", "Help with sizing"), line: L("ابعتلنا طول رجلك بالسنتيمتر على واتساب", "Send us your foot length in centimetres on WhatsApp") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "Hear about new drops first"),
      line: L("رسالة لما ينزل موديل جديد، مش أكتر.", "One letter when a new style lands, nothing more."),
    },
    // Streetwear's large sign-off line.
    footer: { line: L("امشي براحتك", "Walk your way") },
    about: {
      line: L("كوتشيات للشارع ولكل يوم، مختارة على الراحة والشكل.", "Sneakers for the street and every day, chosen for comfort and looks."),
      alt: L("كوتشي كانفس أبيض بخياطة زجزاج على ورق ملوّن", "White canvas low-tops with zigzag stitching on coloured paper"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("الكوتشي اللي بتعيش فيه", "The pair you live in"),
      text: L(
        "رصيف بدأ من مشوار طويل وكوتشي وجّع رجلنا. من ساعتها بنختار كل موديل على حسب نعله وخامته وراحته في المشي، وبنكتب مقاساته من ٣٦ لـ ٤٥ في صفحته.",
        "Raseef started with a long walk and a pair that hurt. Since then we choose every style for its sole, its material and how it walks, and list its sizes from 36 to 45 on its page.",
      ),
      more: L("ولو المقاس مش مظبوط عليك، بنبدّله خلال ١٤ يوم.", "And if the size is not right, we exchange it within 14 days."),
      cta: L("تسوّق الكوتشيات", "Shop the pairs"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("محتار بين مقاسين؟ اسألنا", "Between two sizes? Ask us"),
    },
    faq: {
      line: L("المقاسات والتوصيل والاستبدال.", "Sizes, delivery and exchanges."),
      question: L("أختار مقاسي إزاي؟", "How do I pick my size?"),
      answer: L(
        "قيس طول رجلك بالسنتيمتر وقارنه بجدول المقاسات في صفحة الموديل. الرانينج مظبوط على المقاس، والهاي توب الكانفس ضيق شوية، فلو بين مقاسين خد الأكبر. ولو محتار ابعتلنا القياس ونقولك الأنسب.",
        "Measure your foot length in centimetres and match it to the size chart on the style's page. Runners fit true to size and canvas high-tops run a little narrow, so if you are between two sizes take the larger one. If you are unsure, send us the measurement and we will tell you which fits.",
      ),
    },
    custom: {
      // Streetwear: the store's short name inside a sentence ("About Raseef").
      "store-short": L("رصيف", "Raseef"),
      // Streetwear's line beside the hero.
      "hero-note": L("أبيض · رانينج · هاي توب", "White · Running · High-tops"),
      // Streetwear's round hero sticker: the size range, not an offer.
      "hero-sticker-1": L("مقاسات", "Sizes"),
      "hero-sticker-2": L("٣٦–٤٥", "36–45"),
      "hero-sticker-3": L("للكل", "for all"),
      "banner-alt": L("كوتشيات أبيض وزيتي على رفوف خشب في محل", "White and olive sneakers on wooden shop shelves"),
      "banner-title": L("على الرف دلوقتي", "On the shelf now"),
      "banner-line": L("موديلات خفيفة بنعل طري، للمشي والشغل والخروج.", "Light pairs on soft soles, for walking, work and going out."),
      "craft-statement": L("كوتشي واحد مريح أحسن من خمسة في الدولاب.", "One comfortable pair beats five in the closet."),
      "craft-statement-cta": L("كل الكوتشيات", "Shop all pairs"),
      // Demo handle: the seller's own replaces it.
      "lookbook-handle": L(HANDLE, HANDLE),
      "lookbook-line": L("صور جديدة كل أسبوع", "New photos every week"),
    },
  },
  // Streetwear's rail shows the newest products.
  journey: { primary: "newest" },
  productPage: { copy: { reviews: L("آراء اللي لبسوه", "From people who wear them"), related: L("موديلات ممكن تعجبك", "Pairs you may like") } },
};
