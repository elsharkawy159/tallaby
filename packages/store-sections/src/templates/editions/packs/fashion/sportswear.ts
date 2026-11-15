/**
 * The sportswear edition (niche editions, ROADMAP F-90): a training and
 * activewear shop, "Tamreen" (Arabic for a workout). Sixteen pieces in four
 * categories of four (training tops, leggings and joggers, shorts, jackets
 * and hoodies), white-background flat lays (`editionPhoto`, square). Data
 * only. No React here.
 *
 * Madar (sports-luxe) is the niche's template (one template per niche,
 * 2026-11-12): its default content and demo are this pack, so the template
 * and the edition are one store. Streetwear keeps drawing the pack until the
 * fashion switch, with its own hero (the gym still life) through `perLook`.
 * Madar also reads the fabric guide (`fabric-N-*`, three fabric close-ups),
 * the sign-up's photo and alt, its eyebrow and note, and `shop-all`.
 *
 * Brand rule: every piece is unbranded; nothing names a brand or says a piece
 * is "inspired by" one. Fabrics are named the same way everywhere:
 * quick-dry polyester (the tee, the long sleeve, the quarter-zip, the running
 * and training shorts), polyester mesh (the tank), polyester tricot (the
 * track pants and the zip jacket), nylon with elastane (the leggings, the
 * cycling shorts, the sports bra), cotton fleece (the joggers, the sweat
 * shorts, the hoodie), light nylon (the windbreaker). Sizes S to XXL appear
 * in copy only.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene()` below) replace every Pexels photo `sports-luxe` draws.
 * The Pexels notes below describe the photos they replaced and the ones
 * no look draws, which stay.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * running tracks, locker rooms and gym kit still lifes; no people, hands or
 * feet, no logos, stripe marks or brand lettering (lane and locker numbers
 * only), none used by a template or another pack, none twice.
 * Madar's photos (2026-11-12, new, each checked by eye at 1600px: fabric
 * close-ups only, no lettering, labels, people or hands; none used by a
 * template or another pack): hero 1487809 (a slate-blue performance weave in
 * soft folds), fabric guide 10221743 (pale perforated sports mesh), 4863009
 * (teal stretch jersey with a sheen, crumpled), 34860712 (heather grey cotton
 * jersey), sign-up 18372335 (a cobalt technical knit, flat). Looked at and
 * left out: 31961168 and 9594679 (folded joggers, hoodies on a rack: used by
 * streetwear), 9594671 (used by fashion-warm), 31961165 (a printed logo on
 * the joggers), 30095407 and 37468337 (lettering on the hoodie and cap),
 * 4004222 (a brand name on the bra), 11059828 and 11059826 (printed numbers
 * and labels), 4440572 (hands), 5648264 (sweaters, not training wear),
 * 34851009 (purple mesh, off the palette), 33653656 (graphite waffle mesh:
 * a fourth fabric the guide has no row for), 1487835 (charcoal satin, close
 * to the hero), 7981247 (stripe marks), 40489941 (jersey numbers and crests).
 * Streetwear's hero 8032746 (wide: a rolled black mat, a jump rope, a glass bottle, two
 * black dumbbells and white wristbands on a herringbone floor) and 5274793
 * (tall: a white metal bottle with a carabiner on a rubber track). Tiles:
 * training tops 37496664 (an open red locker with a key tag), leggings and
 * joggers 36717697 (a rolled taupe mat, a black dumbbell and a teal band on
 * white), shorts 8454925 (the curve of an orange running track), jackets and
 * hoodies 12255816 (a wall of pale grey lockers). Banner 37718513 (lanes 1 to
 * 4 of a red track with a long shadow). Story / about 4162550 (charcoal
 * lockers and slatted wooden benches in a changing room). Streetwear's
 * lookbook (square crops): 9091137 (pink dumbbells, a bottle, a hand grip and
 * burgundy knit slip-ons on slate), 30726631 (a white bottle on turf by a
 * goal net; its label is too small to read), 18502968 (straight and curved
 * lane lines on a red track), 4162586 (black locker doors numbered 328 to
 * 332), 8533779 (relay marks painted on a track).
 *
 * Left out after the check: 34213999 (a letter on the bottle, marks on the
 * dumbbells), 8155100 and 4047134 (brand names on the dumbbells), 4164452,
 * 35306856, 7811531 and 3999606 (brand names on the plates), 19025674 (brand
 * marks on the dumbbells), 7188082 and 7188094 (wall slogan, ball brand,
 * cartons), 17755959 (swooshes), 4712426 and 5274535 (ball brands), 7743320
 * (a cap emblem), 3875521 (swooshes on shoes), 32979381 (lettered locker
 * tags), 6197729 (a school name on a hurdle), 20414085 (a university crest),
 * 7201151 (lettering on the windows), 11412586 (a barcode; same shoot as
 * 9091137), 6339694 (feet), 3763878 (a figure in the distance). Already used
 * by a template: 6339731, 40371837, 7186312, 4793245, 8032842, 14502911,
 * 6339679, 8611295, 6752177, 4164772, 7016908, 6740821, 669580, 8978325,
 * 27810157, 6339692, 16513602, 669577, 8612034, 13863727, 7671465, 6339721,
 * 8032916, 6339678, 19190279, 4325462, 4325439, 3927387, 9545907, 16513603,
 * 6207519, 39059979, 6207527, 7671458, 32610335, 27810160, 31470217,
 * 7690201, 8611246, 37887283, 4162451, 3931367, 29224210, 35567437,
 * 14289784, 4793211, 10448088, 4164765, 29495718, 4164763, 35651163,
 * 6550849, 40371850, 38919355.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews, so
 * streetwear's about page is built without that section.
 *
 * No hero video: none found without people.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "sportswear";
const P = (slug: string) => editionPhoto(NICHE, slug);
/** Generated scenes (2026-11-15, docs/systems/editions-photos.md, checked by eye), same bucket: `scene-<slot>`. */
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@tamreen.example";
const HANDLE = handle("@tamreen");

export const SPORTSWEAR: Edition = {
  niche: NICHE,
  looks: ["sports-luxe"],
  priceBand: { min: 350, max: 1800 },
  // The flat lays are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("تمرين", "Tamreen"),
    description: L(
      "ملابس تمرين: تيشيرتات وليجينز وشورتات وجاكيتات، بمقاسات من S حتى XXL.",
      "Training wear: tops, leggings, shorts and jackets, in sizes S to XXL.",
    ),
    categories: [
      ["training-tops", "بلوزات تمرين", "Training tops", TILES[0]!],
      ["leggings-joggers", "ليجينز وبناطيل رياضية", "Leggings & joggers", TILES[1]!],
      ["shorts", "شورتات", "Shorts", TILES[2]!],
      ["jackets-hoodies", "جاكيتات وهوديز", "Jackets & hoodies", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category.
    products: [
      ["black-training-tshirt", "training-tops", "تيشيرت تمرين أسود سريع الجفاف", "Black Quick-Dry Training Tee", P("black-training-tshirt"), 450, { isFeatured: true, rating: 4.8, sold90: 342 }],
      ["black-high-waist-leggings", "leggings-joggers", "ليجينز أسود بخصر عالٍ", "Black High-Waist Leggings", P("black-high-waist-leggings"), 750, { isFeatured: true, rating: 4.8, sold90: 296 }],
      ["black-running-shorts", "shorts", "شورت جري أسود ببطانة", "Black Running Shorts with Liner", P("black-running-shorts"), 550, { isFeatured: true, rating: 4.7, sold90: 231 }],
      ["black-zip-training-jacket", "jackets-hoodies", "جاكيت تمرين أسود بسحّاب", "Black Zip Training Jacket", P("black-zip-training-jacket"), 1450, { isFeatured: true, rating: 4.7, sold90: 118 }],
      ["teal-sports-bra", "training-tops", "برا رياضي أزرق مخضر", "Teal Sports Bra", P("teal-sports-bra"), 520, { compareAtPrice: 650, rating: 4.7, sold90: 187 }],
      ["grey-training-joggers", "leggings-joggers", "بنطلون رياضي رمادي", "Grey Training Joggers", P("grey-training-joggers"), 890, { rating: 4.6, sold90: 204 }],
      ["navy-training-shorts", "shorts", "شورت تمرين كحلي", "Navy Training Shorts", P("navy-training-shorts"), 480, { rating: 4.6, sold90: 176 }],
      ["grey-zip-hoodie", "jackets-hoodies", "هودي رمادي بسحّاب", "Grey Zip Hoodie", P("grey-zip-hoodie"), 1350, { rating: 4.8, sold90: 143 }],
      ["white-mesh-tank-top", "training-tops", "توب شبك أبيض بدون أكمام", "White Mesh Tank Top", P("white-mesh-tank-top"), 390, { rating: 4.5, sold90: 158 }],
      ["navy-seamless-leggings", "leggings-joggers", "ليجينز كحلي بدون خياطات", "Navy Seamless Leggings", P("navy-seamless-leggings"), 850, { compareAtPrice: 990, rating: 4.7, sold90: 162 }],
      ["olive-cycling-shorts", "shorts", "شورت دراجات زيتي", "Olive Cycling Shorts", P("olive-cycling-shorts"), 450, { rating: 4.6, sold90: 139 }],
      ["white-windbreaker", "jackets-hoodies", "جاكيت واقٍ من الرياح أبيض", "White Windbreaker", P("white-windbreaker"), 1250, { compareAtPrice: 1500, rating: 4.6, sold90: 97 }],
      ["grey-long-sleeve-training-top", "training-tops", "توب تمرين رمادي بكم طويل", "Grey Long-Sleeve Training Top", P("grey-long-sleeve-training-top"), 590, { rating: 4.6, sold90: 128 }],
      ["black-track-pants", "leggings-joggers", "بنطلون رياضي أسود بخط جانبي", "Black Track Pants", P("black-track-pants"), 950, { rating: 4.7, sold90: 151 }],
      ["grey-sweat-shorts", "shorts", "شورت قطني رمادي", "Grey Sweat Shorts", P("grey-sweat-shorts"), 520, { rating: 4.5, sold90: 133 }],
      ["navy-quarter-zip-top", "jackets-hoodies", "توب كحلي بسحّاب ربعي", "Navy Quarter-Zip Top", P("navy-quarter-zip-top"), 1150, { rating: 4.7, sold90: 109 }],
    ],
  }),
  photos: {
    // Madar's hero: the fabric itself. `tall` is streetwear's phone photo (Madar crops `wide`).
    // The tall hero is drawn by no look (Pexels).
    hero: { wide: scene("hero-wide"), tall: pexels(5274793, 1200) },
    tiles: TILES,
    banner: pexels(37718513, 2000),
    story: scene("story"),
    custom: {
      // Streetwear's lookbook, square: one large photo, then four small ones.
      "lookbook-1": pexels(9091137, 1200),
      "lookbook-2": pexels(30726631, 900),
      "lookbook-3": pexels(18502968, 900),
      "lookbook-4": pexels(4162586, 900),
      "lookbook-5": pexels(8533779, 900),
      // Madar's fabric guide, landscape close-ups in the order of its rows.
      "fabric-1": scene("fabric-1"),
      "fabric-2": scene("fabric-2"),
      "fabric-3": scene("fabric-3"),
      // Madar's sign-up, beside the form (square on desktop, a band on phones).
      newsletter: scene("newsletter"),
    },
  },
  copy: {
    announcement: [
      L("ملابس تمرين بمقاسات من S حتى XXL", "Training wear in sizes S to XXL"),
      L("تفاصيل ومقاسات واضحة لكل قطعة", "Clear details and sizes for every piece"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { search: L("ابحث عن ليجينز، شورت، هودي…", "Search leggings, shorts, hoodies…") },
    hero: {
      alt: L("ملابس تمرين مطوية على مقعد رمادي: تيشيرت وليجينز كوبالت وجاكيت", "Training pieces folded on a graphite bench: a tee, cobalt leggings and a jacket"),
      eyebrow: L("وصلت ملابس تمرين جديدة", "New training wear is in"),
      title: L("ملابس تمرين للحركة", "Training wear made to move"),
      line: L(
        "تيشيرتات سريعة الجفاف وليجينز وشورتات وجاكيتات، بمقاسات من S حتى XXL.",
        "Quick-dry tees, leggings, shorts and jackets, in sizes S to XXL.",
      ),
      cta: L("تسوّق ملابس التمرين", "Shop training wear"),
    },
    categories: { title: L("جهّز نفسك للتمرين", "Gear up for your workout") },
    products: {
      primary: {
        // Streetwear: the eyebrow is also the footer's link to the newest products.
        eyebrow: L("وصل حديثًا", "New in"),
        title: L("أحدث القطع", "Fresh in the shop"),
        line: L("أحدث قطع التمرين في المتجر.", "The latest training pieces to arrive."),
      },
    },
    story: {
      alt: L("طقم تمرين كوبالت مطوي وزجاجة ماء ستيل على مقعد خشبي في غرفة تبديل", "A folded cobalt training set and a steel bottle on a changing-room bench"),
      eyebrow: L("الخامة أولًا", "Fabric first"),
      title: L("خامات مذكورة لكل قطعة", "Fabrics named on every piece"),
      text: L(
        "نذكر خامة كل قطعة ومقاساتها في صفحتها: بوليستر سريع الجفاف ونايلون بإيلاستين وقطن فليس.",
        "Each piece's page names its fabric and sizes: quick-dry polyester, nylon with elastane and cotton fleece.",
      ),
      cta: L("تعرّف علينا", "Our story"),
    },
    // Streetwear's bento of best sellers.
    rows: [{ title: L("الأكثر طلبًا", "Most ordered") }],
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("تفاصيل ومقاسات واضحة لكل قطعة", "Clear details and sizes for every piece") },
      { title: L("خامات مذكورة", "Fabrics listed"), line: L("الخامة في صفحة كل قطعة", "Fabric listed on every product page") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على القطع الجديدة أولًا", "Hear about new pieces first"),
      line: L("رسالة عند وصول تشكيلة جديدة فقط.", "One letter when a new range lands, nothing more."),
      eyebrow: L("التشكيلة القادمة", "The next range"),
      note: L("يمكنك إلغاء الاشتراك في أي وقت.", "Unsubscribe any time."),
    },
    // Streetwear's large sign-off line.
    footer: { line: L("ملابس تمرين لكل يوم", "Training wear for every day") },
    about: {
      line: L("ملابس تمرين للصالة الرياضية والجري.", "Training wear for the gym and the run."),
      alt: L("طقم تمرين كوبالت مطوي وزجاجة ماء ستيل على مقعد خشبي في غرفة تبديل", "A folded cobalt training set and a steel bottle on a changing-room bench"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("ملابس مصممة للحركة", "Made to move in"),
      text: L(
        "تمرين متجر لملابس التمرين. نختار كل قطعة حسب خامتها: بوليستر سريع الجفاف للتيشيرتات والشورتات، ونايلون بإيلاستين لليجينز، وقطن فليس للهوديز والبناطيل الرياضية، ونذكر مقاساتها من S حتى XXL بالسنتيمتر في صفحتها.",
        "Tamreen sells training wear. We choose every piece for its fabric: quick-dry polyester for tees and shorts, nylon with elastane for leggings, cotton fleece for hoodies and joggers, and we list its sizes from S to XXL in centimetres on its page.",
      ),
      more: L("ولأي سؤال عن المقاس أو الخامة، تواصل معنا.", "For any question about size or fabric, contact us."),
      cta: L("تسوّق ملابس التمرين", "Shop training wear"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("لديك سؤال عن المقاس أو الخامة؟ اسألنا", "A question about size or fabric? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizes, fabrics and ordering."),
      question: L("كيف أختار مقاسي؟", "How do I pick my size?"),
      answer: L(
        "مقاسات كل قطعة مذكورة في صفحتها بالسنتيمتر من S حتى XXL. الليجينز وشورتات الدراجات بقصّة ضيقة، فإذا كنت بين مقاسين اختر الأكبر، والهوديز والبناطيل الرياضية أوسع قليلًا. ولأي سؤال، تواصل معنا.",
        "Each piece lists its sizes from S to XXL in centimetres on its page. Leggings and cycling shorts have a close fit, so if you are between two sizes take the larger one; hoodies and joggers run a little roomy. For any question, contact us.",
      ),
    },
    custom: {
      // Streetwear: the store's short name inside a sentence ("About Tamreen").
      "store-short": L("تمرين", "Tamreen"),
      // Streetwear's line beside the hero.
      "hero-note": L("بلوزات · ليجينز · شورتات", "Tops · Leggings · Shorts"),
      // Streetwear's round hero sticker: the size range, not an offer.
      "hero-sticker-1": L("مقاسات", "Sizes"),
      "hero-sticker-2": L("من S حتى XXL", "S to XXL"),
      "hero-sticker-3": L("للجميع", "for all"),
      "banner-alt": L("حارات مرقّمة على مضمار جري أحمر", "Numbered lanes on a red running track"),
      "banner-title": L("جاهز للجري", "Ready to run"),
      "banner-line": L("شورتات ببطانة وتيشيرتات خفيفة سريعة الجفاف.", "Lined shorts and light, quick-dry tees."),
      "craft-statement": L("ملابس تمرين بخامات مختارة لكل حركة.", "Training wear in fabrics chosen for every move."),
      "craft-statement-cta": L("كل ملابس التمرين", "Shop all training wear"),
      // Demo handle: the seller's own replaces it.
      "lookbook-handle": L(HANDLE, HANDLE),
      "lookbook-line": L("صور من تشكيلتنا", "Photos from our range"),
      // Madar: the header's link to the whole catalog.
      "shop-all": L("كل ملابس التمرين", "Shop all"),
      // Madar's fabric guide, one row per fabric: the pieces made of it, its name (also the photo's alt), what it does.
      "fabric-1-pieces": L("تيشيرتات، شورتات، توب بسحّاب ربعي", "Tees, shorts, the quarter-zip"),
      "fabric-1-name": L("بوليستر سريع الجفاف", "Quick-dry polyester"),
      "fabric-1-text": L(
        "نسيج بفتحات صغيرة تسمح بمرور الهواء ويجف بسرعة.",
        "A knit with tiny vents that lets air through and dries fast.",
      ),
      "fabric-2-pieces": L("ليجينز، شورتات دراجات، برا رياضي", "Leggings, cycling shorts, the sports bra"),
      "fabric-2-name": L("نايلون بإيلاستين", "Nylon with elastane"),
      "fabric-2-text": L(
        "قماش ناعم ومشدود يتمدد في كل اتجاه ويعود إلى شكله.",
        "Smooth, firm fabric that stretches every way and springs back.",
      ),
      "fabric-3-pieces": L("هوديز، بناطيل رياضية، شورت قطني", "Hoodies, joggers, sweat shorts"),
      "fabric-3-name": L("قطن فليس", "Cotton fleece"),
      "fabric-3-text": L(
        "قطن من الخارج ووبر ناعم من الداخل، دافئ في أيام الشتاء.",
        "Cotton outside, soft brushed loops inside, warm on winter days.",
      ),
      "newsletter-alt": L("توب تمرين كوبالت بسحّاب ربعي مطوي", "A cobalt quarter-zip training top, folded flat"),
    },
  },
  // Both looks show the newest products first.
  journey: { primary: "newest" },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قد يعجبك أيضًا", "You may also like") } },
};
