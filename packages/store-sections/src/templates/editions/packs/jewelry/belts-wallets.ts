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

const TILES = [pexels(31323080, 1200), pexels(6127090, 1200), pexels(4452516, 1200), pexels(37326800, 1200)];

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
      "أحزمة ومحافظ وكارد هولدر وميداليات من الجلد الطبيعي، بتتلف في علبة هدية.",
      "Genuine leather belts, wallets, card holders and key rings, each wrapped in a gift box.",
    ),
    categories: [
      ["belts", "أحزمة", "Belts", TILES[0]!],
      ["wallets", "محافظ", "Wallets", TILES[1]!],
      ["card-holders", "كارد هولدر ومشابك", "Card holders & clips", TILES[2]!],
      ["small-goods", "ميداليات وجلديات صغيرة", "Key holders & small goods", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category.
    products: [
      ["brown-leather-belt", "belts", "حزام جلد بني بتوكة نحاسي", "Brown Leather Belt, Brass Buckle", P("brown-leather-belt"), 690, { isFeatured: true, rating: 4.8, sold90: 214 }],
      ["black-bifold-wallet", "wallets", "محفظة جلد أسود بطيّة", "Black Leather Bifold Wallet", P("black-bifold-wallet"), 590, { isFeatured: true, rating: 4.8, sold90: 263 }],
      ["brown-card-holder", "card-holders", "كارد هولدر جلد بني", "Brown Leather Card Holder", P("brown-card-holder"), 320, { isFeatured: true, rating: 4.7, sold90: 241 }],
      ["tan-passport-cover", "small-goods", "جراب باسبور جلد هافان", "Tan Leather Passport Cover", P("tan-passport-cover"), 420, { isFeatured: true, compareAtPrice: 490, rating: 4.7, sold90: 96 }],
      ["black-leather-belt", "belts", "حزام جلد أسود بتوكة فضي", "Black Leather Belt, Silver Buckle", P("black-leather-belt"), 650, { rating: 4.8, sold90: 287 }],
      ["navy-zip-wallet", "wallets", "محفظة جلد كحلي بسوستة", "Navy Leather Zip-Around Wallet", P("navy-zip-wallet"), 890, { rating: 4.6, sold90: 88 }],
      ["green-card-holder", "card-holders", "كارد هولدر جلد أخضر", "Green Leather Card Holder", P("green-card-holder"), 340, { rating: 4.7, sold90: 132 }],
      ["black-key-holder", "small-goods", "جراب مفاتيح جلد أسود", "Black Leather Key Case", P("black-key-holder"), 280, { rating: 4.6, sold90: 154 }],
      ["tan-braided-belt", "belts", "حزام جلد مضفّر هافان", "Tan Braided Leather Belt", P("tan-braided-belt"), 750, { compareAtPrice: 890, rating: 4.7, sold90: 119 }],
      ["brown-bifold-wallet", "wallets", "محفظة جلد بني بطيّة", "Brown Leather Bifold Wallet", P("brown-bifold-wallet"), 620, { rating: 4.8, sold90: 238 }],
      ["tan-money-clip-wallet", "card-holders", "محفظة جلد هافان بمشبك فلوس", "Tan Leather Money Clip Wallet", P("tan-money-clip-wallet"), 480, { rating: 4.6, sold90: 107 }],
      ["brown-leather-keychain", "small-goods", "ميدالية مفاتيح جلد بني", "Brown Leather Key Ring", P("brown-leather-keychain"), 160, { rating: 4.7, sold90: 312 }],
      ["reversible-black-brown-belt", "belts", "حزام جلد بوشّين أسود وبني", "Reversible Black and Brown Leather Belt", P("reversible-black-brown-belt"), 850, { rating: 4.8, sold90: 176 }],
      ["tan-long-wallet", "wallets", "محفظة جلد طويلة هافان", "Tan Leather Long Wallet", P("tan-long-wallet"), 950, { compareAtPrice: 1150, rating: 4.7, sold90: 74 }],
      ["black-card-holder", "card-holders", "كارد هولدر جلد أسود", "Black Leather Card Holder", P("black-card-holder"), 320, { rating: 4.8, sold90: 296 }],
      ["black-coin-pouch", "small-goods", "بوك فكّة جلد أسود", "Black Leather Coin Pouch", P("black-coin-pouch"), 240, { rating: 4.6, sold90: 128 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(6653239, 1920), tall: pexels(4452397, 1200) },
    tiles: TILES,
    banner: pexels(4452611, 2000),
    story: pexels(4452395, 1200),
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("كل قطعة بتتلف في علبة هدية", "Every piece comes in a gift box"),
      L("ادفع عند الاستلام", "Pay on delivery"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("دوّر على حزام، محفظة، كارد هولدر…", "Search belts, wallets, card holders…") },
    hero: {
      alt: L("عِدّة شغل الجلد: سكينة ومخرز وعجلة تقسيم الغُرز على جلد هافان", "Leather tools: a knife, an awl and a stitch wheel on a tan hide"),
      eyebrow: L("جلد طبيعي", "Genuine leather"),
      title: L("جلد يعيش معاك سنين", "Leather that lasts for years"),
      line: L(
        "أحزمة ومحافظ وكارد هولدر وميداليات، لك أو هدية لحد بتحبه، ولو عايز حروف اسمك عليها بنكتبها.",
        "Belts, wallets, card holders and key rings, for you or as a gift, with your initials stamped on request.",
      ),
      cta: L("شوف الجديد", "See what is new"),
    },
    categories: { title: L("اختار اللي ناقصك", "Pick what you need") },
    products: {
      primary: {
        title: L("على الرف دلوقتي", "On the shelf now"),
        line: L("آخر القطع اللي وصلت، والأكتر طلبًا، والأعلى تقييمًا.", "The newest pieces, the most ordered and the best rated."),
      },
    },
    story: {
      alt: L("جلد هافان مفرود فوق جلود أغمق على ترابيزة خشب", "A cognac hide laid over darker hides on a wooden table"),
      eyebrow: L("الجلد بيحلو مع الوقت", "Leather gets better with time"),
      title: L("قطعة بتاخد شكلك", "A piece that takes your shape"),
      text: L(
        "الجلد الطبيعي بيلين مع الاستعمال ولونه بيغمق شوية، فالمحفظة بتاخد شكل جيبك والحزام بيتعوّد على وسطك. بنكتب في صفحة كل قطعة لونها وخامتها ونوع الإبزيم أو السوستة.",
        "Genuine leather softens with use and darkens a little, so a wallet takes the shape of your pocket and a belt settles to your waist. Every piece's page names its colour, its leather and its buckle or zip.",
      ),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    trust: [
      { title: L("علبة هدية", "A gift box"), line: L("كل قطعة بتوصل متغلّفة وجاهزة تتهادى", "Every piece arrives wrapped and ready to give") },
      { title: L("حروف اسمك", "Your initials"), line: L("بنكتبها على المحفظة أو الكارد هولدر لو طلبت", "Stamped on a wallet or card holder on request") },
      { title: L("مقاس الحزام", "Belt size"), line: L("ابعتلنا مقاس وسطك على واتساب ونظبطهولك", "Send us your waist size on WhatsApp and we fit it") },
      { title: L("ادفع عند الاستلام", "Pay on delivery"), line: L("كاش مع المندوب", "Cash to the courier") },
    ],
    newsletter: {
      title: L("اعرف القطع الجديدة أول واحد", "Hear about new pieces first"),
      line: L("رسالة لما تنزل ألوان أو موديلات جديدة، مش أكتر.", "One letter when new colours or styles arrive, nothing more."),
    },
    footer: { line: L("جلد بيكبر معاك", "Leather that ages with you") },
    about: {
      line: L("جلديات صغيرة من الجلد الطبيعي، تنفع لك وتنفع هدية.", "Small leather goods in genuine leather, for you or as a gift."),
      alt: L("جلد هافان مفرود فوق جلود أغمق على ترابيزة خشب", "A cognac hide laid over darker hides on a wooden table"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("كل حاجة بتبدأ من سَيْر", "It all starts with a strap"),
      text: L(
        "سَيْر يعني شريط الجلد اللي بيتعمل منه الحزام، ومنه بدأنا. بنختار الجلد على ملمسه وسُمكه، والخياطة على قوّتها، والإبزيم والسوستة على تقلهم، وبنكتب ده كله في صفحة كل قطعة.",
        "Seer is Arabic for the leather strap a belt is cut from, and that is where we started. We choose the leather for its feel and thickness, the stitching for its strength and the buckles and zips for their weight, and we write it all on each piece's page.",
      ),
      more: L("ولو بتشتري هدية، قولنا الاسم ونكتب الحروف على القطعة ونغلّفها.", "If it is a gift, tell us the name and we stamp the initials and wrap it."),
      cta: L("تسوّق الجلديات", "Shop the leather goods"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(`القاهرة، مصر، ${PHONE_AR}، ${handle(EMAIL)}`, `Cairo, Egypt | ${PHONE_EN} | ${EMAIL}`),
      heading: L("بتدوّر على هدية؟ اسألنا", "Looking for a gift? Ask us"),
    },
    faq: {
      line: L("المقاسات والخامة والهدايا والتوصيل.", "Sizes, leather, gifts and delivery."),
      question: L("أعرف مقاس الحزام إزاي؟", "How do I find my belt size?"),
      answer: L(
        "قيس حزام عندك من الإبزيم لحد الخرم اللي بتلبس عليه بالسنتيمتر، أو قيس وسطك فوق البنطلون وزوّد ٥ سم. ابعتلنا الرقم على واتساب ونقولك المقاس الأنسب، وبنقصّر الحزام على مقاسك قبل ما يتشحن.",
        "Measure a belt you own in centimetres from the buckle to the hole you use, or measure your waist over your trousers and add 5 cm. Send us the number on WhatsApp and we will tell you which size fits, and we shorten the belt to your size before it ships.",
      ),
    },
    custom: {
      // jewelry-warm: the workshop band's wide photo (`photos.banner`), its alt text.
      "banner-alt": L("عِدّة شغل الجلد وبكرة خيط مشمّع وقطع جلد على مفرش القص", "Leather tools, waxed thread and cut pieces on a cutting mat"),
      // jewelry-warm's care block, beside the story photo: a title, one line and four short care steps.
      "care-title": L("اعتني بيه، يعيش أكتر", "Look after it, it lasts"),
      "care-text": L("الجلد الطبيعي محتاج حاجات بسيطة عشان يفضل طري ولونه يحلو مع الوقت.", "Genuine leather needs a few simple habits to stay supple and age well."),
      "care-point-1": L("لو اتبل، نشّفه بقماشة وسيبه في الهوا", "If it gets wet, blot it and let it air-dry"),
      "care-point-2": L("ادهنه بكريم جلد كل كام شهر", "Condition it every few months"),
      "care-point-3": L("خليه بعيد عن الشمس والحرارة", "Keep it away from sun and heat"),
      "care-point-4": L("خزّن الحزام ملفوف، مش متعلّق من الإبزيم", "Store a belt rolled, not hung by its buckle"),
    },
  },
  productPage: { copy: { reviews: L("آراء اللي اشتروها", "From people who bought it"), related: L("قطع تكمّل الهدية", "Pieces to finish the gift") } },
};
