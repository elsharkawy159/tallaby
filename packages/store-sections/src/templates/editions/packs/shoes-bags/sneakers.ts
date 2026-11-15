/**
 * The sneakers edition (niche editions, ROADMAP F-90): a street sneaker shop,
 * "Raseef" (Arabic for the pavement a pair is worn on). Sixteen pairs in four
 * categories of four (everyday white, running, high-tops, slip-ons and
 * canvas), white-background packshots (`editionPhoto`, square, one pair
 * each). Data only. No React here.
 *
 * Shipped on sports-bold (Nabd, the niche's template) and on streetwear
 * (see Looks below).
 *
 * Brand rule: every pair is unbranded. No product, category or line names a
 * brand or says a pair is "inspired by" one. Materials are named from what
 * each packshot shows: leather (the white, green-heel and chunky low-tops,
 * the brown high-top), suede (the cream low-top on a gum sole, the grey
 * high-top), mesh or knit (the runners), canvas (everything else). Sizes 36
 * to 45 appear in copy only.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `sports-bold` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
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
 *
 * Looks: `sports-bold` Nabd (the niche's template, one template per niche;
 * it shows the pack itself and is its own content), then `streetwear` until
 * the shoes-and-bags switch takes it off. Nabd's photos are the pack's own,
 * moved between slots (2026-11-12, each looked at again at full size): the
 * hero tile is 4296075 (the white canvas pair on red, orange and green
 * paper; at 3648px the only marks are the zigzag stitching and two coloured
 * windows in the heel of the sole, no lettering), the home story sits on the
 * banner 13807630, and the about page shows 11827147 (the lone chunky
 * sneaker on the orange shelf) as `story`. Streetwear keeps its hero (the
 * pink shelf 1020372 and 11827147 on phones) and its story photo 4296075
 * through `perLook`. No new Pexels photo. Nabd also reads the hero's size
 * tile, the head-to-head (a runner against an everyday white, four spec
 * rows), the high-tops panel, the promises' heading, the sign-up's four
 * topics, the footer's phone and email and `custom.shop-all`.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "sneakers";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** A catalog search for a word in the products' names. */
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Nabd's round tiles, square, each pair centred so the ring keeps it whole. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@raseef.example";
const HANDLE = handle("@raseef");

export const SNEAKERS: Edition = {
  niche: NICHE,
  looks: ["sports-bold"],
  priceBand: { min: 700, max: 2800 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("رصيف", "Raseef"),
    description: L(
      "أحذية رياضية بيضاء يومية وأحذية جري وهاي توب وأحذية بدون رباط، بمقاسات من ٣٦ حتى ٤٥.",
      "Everyday white sneakers, runners, high-tops and slip-ons, in sizes 36 to 45.",
    ),
    categories: [
      ["everyday-white", "أحذية بيضاء يومية", "Everyday white", TILES[0]!],
      ["running", "أحذية الجري", "Running", TILES[1]!],
      ["high-tops", "هاي توب", "High-tops", TILES[2]!],
      ["slip-ons-canvas", "أحذية قماش وبدون رباط", "Slip-ons & canvas", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. Featured (Nabd's hero pair, the newest featured one): the
    // chunky white, so it is never one of the head-to-head's two pairs (the first runner and the first everyday white).
    products: [
      ["white-leather-low-top", "everyday-white", "حذاء رياضي جلد أبيض سادة", "White Leather Low-Top", P("white-leather-low-top"), 1450, { rating: 4.8, sold90: 312 }],
      ["black-mesh-runner", "running", "حذاء جري شبك أسود", "Black Mesh Runner", P("black-mesh-runner"), 1150, { rating: 4.7, sold90: 274 }],
      ["black-canvas-high-top", "high-tops", "هاي توب قماش أسود", "Black Canvas High-Top", P("black-canvas-high-top"), 950, { rating: 4.8, sold90: 251 }],
      ["navy-canvas-slip-on", "slip-ons-canvas", "حذاء قماش كحلي بدون رباط", "Navy Canvas Slip-On", P("navy-canvas-slip-on"), 750, { rating: 4.6, sold90: 198 }],
      ["white-chunky-sneaker", "everyday-white", "حذاء رياضي أبيض بنعل سميك مرتفع", "White Chunky Sneaker", P("white-chunky-sneaker"), 1850, { compareAtPrice: 2200, isFeatured: true, rating: 4.7, sold90: 236 }],
      ["grey-knit-runner", "running", "حذاء جري تريكو رمادي", "Grey Knit Runner", P("grey-knit-runner"), 1250, { rating: 4.6, sold90: 187 }],
      ["brown-leather-high-top", "high-tops", "هاي توب جلد بني", "Brown Leather High-Top", P("brown-leather-high-top"), 2600, { rating: 4.8, sold90: 94 }],
      ["black-checker-slip-on", "slip-ons-canvas", "حذاء بدون رباط بمربعات أبيض وأسود", "Black and White Checkerboard Slip-On", P("black-checker-slip-on"), 850, { rating: 4.7, sold90: 223 }],
      ["white-green-heel-low-top", "everyday-white", "حذاء رياضي جلد أبيض بكعب أخضر", "White Leather Low-Top with a Green Heel", P("white-green-heel-low-top"), 1550, { rating: 4.7, sold90: 168 }],
      ["navy-orange-runner", "running", "حذاء جري كحلي وبرتقالي", "Navy and Orange Runner", P("navy-orange-runner"), 1350, { compareAtPrice: 1600, rating: 4.6, sold90: 176 }],
      ["white-canvas-high-top", "high-tops", "هاي توب قماش أبيض", "White Canvas High-Top", P("white-canvas-high-top"), 950, { rating: 4.6, sold90: 205 }],
      ["beige-canvas-low-top", "slip-ons-canvas", "حذاء رياضي قماش بيج", "Beige Canvas Low-Top", P("beige-canvas-low-top"), 790, { rating: 4.5, sold90: 141 }],
      ["cream-suede-low-top", "everyday-white", "حذاء رياضي سويد كريمي بنعل عسلي", "Cream Suede Low-Top on a Gum Sole", P("cream-suede-low-top"), 1750, { isFeatured: true, rating: 4.8, sold90: 117 }],
      ["white-pink-runner", "running", "حذاء جري أبيض ووردي", "White and Pink Runner", P("white-pink-runner"), 1250, { rating: 4.7, sold90: 162 }],
      ["grey-suede-high-top", "high-tops", "هاي توب سويد رمادي", "Grey Suede High-Top", P("grey-suede-high-top"), 2200, { compareAtPrice: 2500, rating: 4.7, sold90: 83 }],
      ["olive-canvas-low-top", "slip-ons-canvas", "حذاء رياضي قماش زيتي", "Olive Canvas Low-Top", P("olive-canvas-low-top"), 790, { rating: 4.6, sold90: 129 }],
    ],
  }),
  photos: {
    // Nabd's hero tile is `tall` (4296075, square: the pair stays whole in its square tile); `wide` is streetwear's.
    // The wide hero is drawn by no look (Pexels).
    hero: { wide: pexels(1020372, 1920), tall: scene("hero-tall") },
    tiles: TILES,
    banner: scene("banner"),
    // Nabd: the home story sits on `banner`; `story` is the about page's photo.
    story: scene("story"),
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
      L("أحذية رياضية بمقاسات من ٣٦ حتى ٤٥", "Sneakers in sizes 36 to 45"),
      L("جدول مقاسات لكل موديل", "A size chart for every style"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    // Nabd: a header link to the high-tops (the store's 3rd category), also the high-tops panel's button.
    nav: [{ label: L("هاي توب", "High-tops"), href: search("هاي توب") }],
    labels: { search: L("ابحث عن حذاء جري، هاي توب، أبيض…", "Search runners, high-tops, white pairs…") },
    hero: {
      alt: L("زوج أحذية قماش بيضاء على ورق أحمر ورمادي في الشمس", "A pair of white canvas low-tops on red and grey paper in the sun"),
      eyebrow: L("وصلت تشكيلة الموسم", "The new season is in"),
      title: L("أحذية رياضية لكل يوم", "Sneakers for every day"),
      line: L(
        "أحذية بيضاء سادة وأحذية جري خفيفة وهاي توب وأحذية بدون رباط، بمقاسات من ٣٦ حتى ٤٥.",
        "Plain whites, light runners, high-tops and slip-ons, in sizes 36 to 45.",
      ),
      cta: L("تسوّق الأحذية", "Shop the pairs"),
    },
    categories: { title: L("اختر التصميم", "Pick your style") },
    products: {
      primary: {
        // Streetwear: the eyebrow is also the footer's link to the newest products.
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("أحدث الموديلات", "The newest pairs"),
        line: L("أحدث الأحذية في المتجر.", "The latest pairs to land in the shop."),
      },
    },
    story: {
      alt: L("حذاء رياضي أبيض وكحلي بنعل سميك على قاعدة إسمنتية أمام جدار أحمر", "One white and navy chunky sneaker on a concrete plinth against a red wall"),
      eyebrow: L("النعل والخامة", "Sole and material"),
      title: L("مواصفات واضحة لكل موديل", "Clear specs for every style"),
      text: L(
        "نذكر خامة كل موديل ونوع نعله وجدول مقاساته في صفحته.",
        "Each style's page lists its material, its sole and its size chart.",
      ),
      cta: L("تعرّف علينا", "Our story"),
    },
    // Streetwear's bento of best sellers.
    rows: [{ title: L("الأكثر طلبًا", "Most wanted") }],
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("جدول مقاسات لكل موديل", "A size chart for every style") },
      { title: L("خامات مذكورة", "Materials listed"), line: L("النعل والخامة لكل موديل", "Sole and material for every style") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "Hear about new drops first"),
      line: L("رسالة عند وصول موديل جديد فقط.", "One letter when a new style lands, nothing more."),
    },
    // Streetwear's large sign-off line.
    footer: { line: L("أحذية رياضية لكل يوم", "Sneakers for every day") },
    about: {
      line: L("أحذية رياضية للخروج ولكل يوم، مختارة بعناية.", "Sneakers for going out and every day, chosen with care."),
      alt: L("حذاء رياضي أبيض وكحلي بنعل سميك على قاعدة إسمنتية أمام جدار أحمر", "One white and navy chunky sneaker on a concrete plinth against a red wall"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("حذاء رياضي لكل يوم", "A pair for every day"),
      text: L(
        "رصيف متجر للأحذية الرياضية. نختار كل موديل حسب نعله وخامته، ونذكر مقاساته من ٣٦ حتى ٤٥ في صفحته.",
        "Raseef sells sneakers. We choose every style for its sole and its material, and list its sizes from 36 to 45 on its page.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or material, contact us."),
      cta: L("تسوّق الأحذية", "Shop the pairs"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("بين مقاسين؟ اسألنا", "Between two sizes? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizes, materials and ordering."),
      question: L("كيف أختار مقاسي؟", "How do I pick my size?"),
      answer: L(
        "قارن مقاسك المعتاد بجدول المقاسات في صفحة الموديل. أحذية الجري بمقاس قياسي، والهاي توب القماش ضيق قليلًا، فإذا كنت بين مقاسين فاختر الأكبر. ولأي سؤال، تواصل معنا.",
        "Compare your usual size with the size chart on the style's page. Runners fit true to size and canvas high-tops run a little narrow, so if you are between two sizes take the larger one. For any question, contact us.",
      ),
    },
    custom: {
      // Streetwear: the store's short name inside a sentence ("About Raseef").
      "store-short": L("رصيف", "Raseef"),
      // Streetwear's line beside the hero.
      "hero-note": L("أبيض · جري · هاي توب", "White · Running · High-tops"),
      // Streetwear's round hero sticker: the size range, not an offer.
      "hero-sticker-1": L("مقاسات", "Sizes"),
      "hero-sticker-2": L("٣٦–٤٥", "36–45"),
      "hero-sticker-3": L("للجميع", "for all"),
      "banner-alt": L("أحذية رياضية بألوان هادئة على رفوف خشبية في متجر", "Sneakers in quiet colours on oak shop shelves"),
      "banner-title": L("تشكيلة المتجر", "On the shelf now"),
      "banner-line": L("موديلات خفيفة بنعل طري، للمشي والعمل والخروج.", "Light pairs on soft soles, for walking, work and going out."),
      "craft-statement": L("حذاء واحد مريح أفضل من خمسة في الخزانة.", "One comfortable pair beats five in the closet."),
      "craft-statement-cta": L("كل الأحذية", "Shop all pairs"),
      // Demo handle: the seller's own replaces it.
      "lookbook-handle": L(HANDLE, HANDLE),
      "lookbook-line": L("صور من تشكيلتنا", "Photos from our range"),
      // Nabd: the header's link to the whole catalog, and the footer's phone and email.
      "shop-all": L("كل الأحذية", "All pairs"),
      "contact-phone": L(PHONE_AR, PHONE_EN),
      "contact-email": L(handle(EMAIL), EMAIL),
      // Nabd's hero: the line under the size range (`hero-sticker-2`) on the brand tile, one short line.
      "hero-sizes-line": L("في كل موديل، مع جدول مقاسات واضح", "in every style, with a clear size chart"),
      // Nabd's head-to-head: the newest runner (the store's 2nd category) against the newest everyday white (its 1st).
      // A title, then four rows: a label of one or two words and a short value for each side. The dot marks the
      // better side: the runner in rows 1 and 2, the everyday white in rows 3 and 4.
      "versus-title": L("حذاء جري أم أبيض يومي؟", "A runner or an everyday white?"),
      "versus-1-label": L("التهوية", "Airflow"),
      "versus-1-a": L("شبك جيد التهوية", "Breathable mesh"),
      "versus-1-b": L("جلد مغلق", "Closed leather"),
      "versus-2-label": L("الوزن", "Weight"),
      "versus-2-a": L("خفيف للجري", "Light for running"),
      "versus-2-b": L("جلد أثقل قليلًا", "Leather, a little heavier"),
      "versus-3-label": L("التنضيف", "Cleaning"),
      "versus-3-a": L("غسل يدوي", "Hand wash"),
      "versus-3-b": L("مسح بقطعة قماش مبللة", "A damp cloth"),
      "versus-4-label": L("يناسب", "Goes with"),
      "versus-4-a": L("ملابس التمرين", "Gym clothes"),
      "versus-4-b": L("كل الإطلالات", "Anything"),
      // Nabd's high-tops panel beside three high-tops (the store's 3rd category): a small label, a title, one line, a button to the high-tops.
      "panel-eyebrow": L("هاي توب", "High-tops"),
      "panel-title": L("تصميم مرتفع بخامات متعددة", "A high cut in many materials"),
      "panel-line": L("قماش وجلد وسويد بنعل مطاطي.", "Canvas, leather and suede on rubber soles."),
      "panel-cta": L("كل الهاي توب", "All high-tops"),
      // Nabd's promises: the heading and its line over the first three promises.
      "trust-title": L("ما نقدّمه مع كل موديل", "What comes with every style"),
      "trust-line": L("تفاصيل تساعدك في الاختيار.", "Details that help you choose."),
      // Nabd's sign-up: four topics the letters cover (one or two words each).
      "newsletter-interest-1": L("موديلات جديدة", "New styles"),
      "newsletter-interest-2": L("عودة المقاسات", "Sizes back in"),
      "newsletter-interest-3": L("أحذية الجري", "Running"),
      "newsletter-interest-4": L("العناية بالأحذية", "Sneaker care"),
    },
  },
  // Nabd's grid and streetwear's rail show the newest products.
  journey: { primary: "newest" },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("موديلات قد تعجبك", "Pairs you may like") } },
};
