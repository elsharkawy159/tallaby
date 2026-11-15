/**
 * The belts and wallets edition (niche editions, ROADMAP F-90): a leather
 * small-goods shop, "Seer" (Arabic سَيْر, a leather strap). Sixteen pieces in
 * four categories of four (belts, wallets, card holders and money clips, key
 * holders and small goods), white-background packshots (`editionPhoto`,
 * square, one piece each). Gift-friendly: every piece leaves in a gift box,
 * and initials can be stamped on a wallet or card holder on request. Data
 * only. No React here.
 *
 * The niche's template is jewelry-warm (Tibr; one template per niche,
 * docs/systems/one-template-per-niche.md): the copy and photos are written
 * for it, its only look (the accessories switch, 2026-11-12, took zay off).
 *
 * On jewelry-warm: the hero 6653239 is cropped tall on phones with the copy
 * on it; the workshop band (`about-overlap`) is the banner 4452611; the care
 * block shows the story photo 4452395 beside four care steps
 * (`custom.care-*`), and the about page shows it too.
 *
 * Material, kept the same everywhere: every piece is genuine leather (the
 * packshots show smooth or lightly grained hide, a woven strap on the braided
 * belt, a black face and brown back on the reversible belt). Colours and
 * hardware as the packshots show them: silver buckles on the black, braided
 * and reversible belts (the reversible one on a swivel buckle), a brass
 * buckle on the brown belt, a gold-tone zip on the navy wallet, a steel clip
 * on the tan money clip wallet, a silver snap and clasp on the black key
 * case, a silver ring on the brown key ring, a silver snap on the coin pouch.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * hides, rolls, tools and finished goods on wood, cloth and paper; no people,
 * hands or body parts, no readable lettering or brand marks, none used by a
 * template or another pack, none twice.
 * Hero 6653239 (wide: a leather knife, an awl, a stitch-spacing wheel and a
 * groover on a tan hide over a wooden table) and 4452397 (tall: the edge of
 * a tan hide over pale weathered planks). Tiles: belts 31323080 (three
 * rolled belts, black, brown and dark brown, with gunmetal buckles on grey
 * cloth), wallets 6127090 (a tan grained wallet on folds of black cloth),
 * card holders and clips 4452516 (rolls of brown, burgundy and teal leather),
 * key holders and small goods 37326800 (snap-flap leather pouches with
 * contrast stitching). Banner 4452611 (leather tools, a waxed thread spool
 * and cut pieces on a cutting mat; the stamps on the blades are blurred and
 * unreadable). Story / about 4452395 (a cognac hide over darker hides on a
 * wooden table).
 *
 * Left out after the check: Vlada Karpovich's leather series (4452375,
 * 4452378, 4452379, 4452384, 4452396, 4452398, 4452402, 4452506, 4452507,
 * 4452521, 4452522, 4452630, 4452637, 4452639, 4452641, 4452642, 4452643)
 * for the maker's stamped "AM POINT" mark and other lettering, 4452372,
 * 4452377 and 4452385 (printed maps), 4452523 (printed notebook), 4452612
 * ("transotype" on the mat), 4452601 and 4452602 (a printer brand, a
 * mirror reflection), the series' photos of people or hands (4452394,
 * 4452400, 4452401, 4452503, 4452504, 4452508, 4452509, 4452512–4452514,
 * 4452517–4452520, 4452524–4452530 and the maker at work in
 * 4452600–4452644), 27467355, 27467367, 27467423, 28027963, 28028171, 28028262,
 * 28028264, 28028334, 28086429, 37326704 and 37326710 (embossed
 * "PERGAMON"), 7085799 ("KALIBRADO" boxes), 7952556 and 17923962 (printed
 * cards), 33428311 ("RUBCO" on a tool), 32954513 (an embossed logo), 1023937
 * (logos on some keepers), 1132269 (a brand on sunglasses), 302854 (a
 * banknote and a branded buckle), 12444591 (coins), 33023215 (a logo
 * keychain and lettered box), 15440423 (a lettered book), 15862185 and
 * 11271784 (logos), 5963183, 6649425, 10634549 and 35392687 (hands).
 * Already used by a template or pack: 4452383, 4452393, 4452399, 4452603,
 * 915917, 28028234, 28028316, 31367058, 31367059, 31959214–31959217,
 * 34443363, 35222039, 35322142, 35322147, 37326646, 37326652, 37326694.
 * Checked and clean but not used: 6653230, 4452502, 4452511.
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene-<slot>` in the same bucket) now replace every Pexels photo
 * `jewelry-warm` draws: the hero, the four tiles, the workshop banner and
 * the story (also the about page). Still Pexels, drawn by no look: hero
 * tall 4452397.
 *
 * No buyer quotes (`reviews`): a pack holds no invented reviews.
 *
 * No hero video: jewelry-warm plays none.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, handle, pexels, phone } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "belts-wallets";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

const TILES = [
  scene("tile-1"), // black, brown and tan braided belts rolled on canvas grey
  scene("tile-2"), // a tan bifold and a navy zip wallet on black cloth
  scene("tile-3"), // green and brown card holders and a tan money clip on cordovan leather
  scene("tile-4"), // a black key case, a brown key ring and a black coin pouch on light wood
];

// Demo contact details: a seller replaces every one of them.
const PHONE_AR = phone("٠١٠٠ ٠٠٠ ٠٠٠٠");
const PHONE_EN = "+20 100 000 0000";
const EMAIL = "hello@seer.example";

export const BELTS_WALLETS: Edition = {
  niche: NICHE,
  looks: ["jewelry-warm"],
  priceBand: { min: 150, max: 1500 },
  // The packshots are square on pure white: shown whole on a white stage, so a grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("سَيْر", "Seer"),
    description: L(
      "أحزمة ومحافظ وحافظات بطاقات وميداليات من الجلد الطبيعي.",
      "Genuine leather belts, wallets, card holders and key rings.",
    ),
    categories: [
      ["belts", "أحزمة", "Belts", TILES[0]!],
      ["wallets", "محافظ", "Wallets", TILES[1]!],
      ["card-holders", "حافظات بطاقات ومشابك", "Card holders & clips", TILES[2]!],
      ["small-goods", "ميداليات وجلديات صغيرة", "Key holders & small goods", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category.
    products: [
      ["brown-leather-belt", "belts", "حزام جلد بني بإبزيم نحاسي", "Brown Leather Belt, Brass Buckle", P("brown-leather-belt"), 690, { isFeatured: true, rating: 4.8, sold90: 214 }],
      ["black-bifold-wallet", "wallets", "محفظة جلد سوداء قابلة للطي", "Black Leather Bifold Wallet", P("black-bifold-wallet"), 590, { isFeatured: true, rating: 4.8, sold90: 263 }],
      ["brown-card-holder", "card-holders", "حافظة بطاقات جلد بنية", "Brown Leather Card Holder", P("brown-card-holder"), 320, { isFeatured: true, rating: 4.7, sold90: 241 }],
      ["tan-passport-cover", "small-goods", "غلاف جواز سفر جلد بني فاتح", "Tan Leather Passport Cover", P("tan-passport-cover"), 420, { isFeatured: true, compareAtPrice: 490, rating: 4.7, sold90: 96 }],
      ["black-leather-belt", "belts", "حزام جلد أسود بإبزيم فضي", "Black Leather Belt, Silver Buckle", P("black-leather-belt"), 650, { rating: 4.8, sold90: 287 }],
      ["navy-zip-wallet", "wallets", "محفظة جلد كحلية بسحّاب", "Navy Leather Zip-Around Wallet", P("navy-zip-wallet"), 890, { rating: 4.6, sold90: 88 }],
      ["green-card-holder", "card-holders", "حافظة بطاقات جلد خضراء", "Green Leather Card Holder", P("green-card-holder"), 340, { rating: 4.7, sold90: 132 }],
      ["black-key-holder", "small-goods", "حافظة مفاتيح جلد سوداء", "Black Leather Key Case", P("black-key-holder"), 280, { rating: 4.6, sold90: 154 }],
      ["tan-braided-belt", "belts", "حزام جلد مضفّر بني فاتح", "Tan Braided Leather Belt", P("tan-braided-belt"), 750, { compareAtPrice: 890, rating: 4.7, sold90: 119 }],
      ["brown-bifold-wallet", "wallets", "محفظة جلد بنية قابلة للطي", "Brown Leather Bifold Wallet", P("brown-bifold-wallet"), 620, { rating: 4.8, sold90: 238 }],
      ["tan-money-clip-wallet", "card-holders", "محفظة جلد بني فاتح بمشبك نقود", "Tan Leather Money Clip Wallet", P("tan-money-clip-wallet"), 480, { rating: 4.6, sold90: 107 }],
      ["brown-leather-keychain", "small-goods", "ميدالية مفاتيح جلد بني", "Brown Leather Key Ring", P("brown-leather-keychain"), 160, { rating: 4.7, sold90: 312 }],
      ["reversible-black-brown-belt", "belts", "حزام جلد بوجهين أسود وبني", "Reversible Black and Brown Leather Belt", P("reversible-black-brown-belt"), 850, { rating: 4.8, sold90: 176 }],
      ["tan-long-wallet", "wallets", "محفظة جلد طويلة بني فاتح", "Tan Leather Long Wallet", P("tan-long-wallet"), 950, { compareAtPrice: 1150, rating: 4.7, sold90: 74 }],
      ["black-card-holder", "card-holders", "حافظة بطاقات جلد سوداء", "Black Leather Card Holder", P("black-card-holder"), 320, { rating: 4.8, sold90: 296 }],
      ["black-coin-pouch", "small-goods", "محفظة عملات جلد سوداء", "Black Leather Coin Pouch", P("black-coin-pouch"), 240, { rating: 4.6, sold90: 128 }],
    ],
  }),
  photos: {
    // A leatherworker's bench, a finished belt and wallet among the tools (wide); the tall one, drawn by no look, is Pexels.
    hero: { wide: scene("hero-wide"), tall: pexels(4452397, 1200) },
    tiles: TILES,
    // Leather tools, waxed thread and cut wallet pieces on a green cutting mat under a brass lamp.
    banner: scene("banner"),
    // A brown belt and a black wallet beside a tin of balm, a cloth and a brush (the care block and the about page).
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("أحزمة ومحافظ من الجلد الطبيعي", "Genuine leather belts and wallets"),
      L("صور ومواصفات لكل قطعة", "Photos and details for every piece"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("ابحث عن حزام، محفظة، حافظة بطاقات…", "Search belts, wallets, card holders…") },
    hero: {
      alt: L("حزام ومحفظة من الجلد البني بين أدوات العمل على جلد بني فاتح", "A brown belt and a wallet among leather tools on a tan hide"),
      eyebrow: L("جلد طبيعي", "Genuine leather"),
      title: L("جلديات من الجلد الطبيعي", "Genuine leather goods"),
      line: L(
        "أحزمة ومحافظ وحافظات بطاقات وميداليات من الجلد الطبيعي.",
        "Belts, wallets, card holders and key rings in genuine leather.",
      ),
      cta: L("تصفّح الجديد", "See what is new"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        title: L("تشكيلة المتجر", "On the shelf now"),
        line: L("أحدث القطع والأكثر طلبًا والأعلى تقييمًا.", "The newest pieces, the most ordered and the best rated."),
      },
    },
    story: {
      alt: L("حزام بني ومحفظة سوداء بجوار علبة ملمّع جلد وقطعة قماش وفرشاة", "A brown belt and a black wallet beside leather balm, a cloth and a brush"),
      eyebrow: L("العناية بالجلد", "Leather care"),
      title: L("جلد طبيعي بتفاصيل واضحة", "Genuine leather, clear details"),
      text: L(
        "يلين الجلد الطبيعي مع الاستعمال ويغمق لونه قليلًا، ونذكر في صفحة كل قطعة لونها وخامتها ونوع الإبزيم أو السحّاب.",
        "Genuine leather softens with use and darkens a little. Every piece's page names its colour, its leather and its buckle or zip.",
      ),
      cta: L("تعرّف علينا", "Our story"),
    },
    trust: [
      { title: L("صور ومواصفات", "Photos and details"), line: L("لكل قطعة لونها وخامتها", "Colour and leather for every piece") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("أحزمة ومحافظ وميداليات", "Belts, wallets and key rings") },
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("طول كل حزام بالسنتيمتر", "Every belt's length in centimetres") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على القطع الجديدة أولًا", "Hear about new pieces first"),
      line: L("رسالة عند وصول ألوان أو موديلات جديدة فقط.", "One letter when new colours or styles arrive, nothing more."),
    },
    footer: { line: L("جلديات من الجلد الطبيعي", "Genuine leather goods") },
    about: {
      line: L("جلديات صغيرة من الجلد الطبيعي، لك أو للإهداء.", "Small leather goods in genuine leather, for you or as a gift."),
      alt: L("حزام بني ومحفظة سوداء بجوار علبة ملمّع جلد وقطعة قماش وفرشاة", "A brown belt and a black wallet beside leather balm, a cloth and a brush"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("كل شيء يبدأ من سَيْر", "It all starts with a strap"),
      text: L(
        "سَيْر هو شريط الجلد الذي يُصنع منه الحزام، ومنه بدأنا. نختار الجلد حسب ملمسه وسُمكه، والخياطة حسب متانتها، والإبزيم والسحّاب حسب وزنهما، ونذكر ذلك كله في صفحة كل قطعة.",
        "Seer is Arabic for the leather strap a belt is cut from, and that is where we started. We choose the leather for its feel and thickness, the stitching for its strength and the buckles and zips for their weight, and we write it all on each piece's page.",
      ),
      more: L("ولأي سؤال عن القطع، تواصل معنا.", "For any question about our pieces, contact us."),
      cta: L("تسوّق الجلديات", "Shop the leather goods"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("تبحث عن هدية؟ اسألنا", "Looking for a gift? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizes, leather and ordering."),
      question: L("كيف أعرف مقاس الحزام؟", "How do I find my belt size?"),
      answer: L(
        "قِس حزامًا لديك بالسنتيمتر من الإبزيم حتى الثقب الذي تستخدمه، وقارن الرقم بالمقاسات المذكورة في صفحة كل حزام.",
        "Measure a belt you own in centimetres from the buckle to the hole you use, and compare it with the sizes on each belt's page.",
      ),
    },
    custom: {
      // jewelry-warm: the workshop band's wide photo (`photos.banner`), its alt text.
      "banner-alt": L("أدوات العمل بالجلد وبكرة خيط مشمّع وقطع محفظة على لوح القص", "Leather tools, waxed thread and cut wallet pieces on a cutting mat"),
      // jewelry-warm's care block, beside the story photo: a title, one line and four short care steps.
      "care-title": L("العناية بالجلد", "Caring for leather"),
      "care-text": L("يحتاج الجلد الطبيعي إلى عناية بسيطة ليبقى طريًّا ويتحسّن لونه مع الوقت.", "Genuine leather needs a few simple habits to stay supple and age well."),
      "care-point-1": L("إذا ابتلّ، جفّفه بقطعة قماش واتركه في الهواء", "If it gets wet, blot it and let it air-dry"),
      "care-point-2": L("ادهنه بكريم الجلد كل بضعة أشهر", "Condition it every few months"),
      "care-point-3": L("أبعده عن الشمس والحرارة", "Keep it away from sun and heat"),
      "care-point-4": L("خزّن الحزام ملفوفًا، لا معلّقًا من الإبزيم", "Store a belt rolled, not hung by its buckle"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قطع تكمّل الهدية", "Pieces to finish the gift") } },
};
