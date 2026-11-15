/**
 * The gold jewelry pack (niche editions, ROADMAP F-90): a real-gold
 * jeweller, an Egyptian gold shop, "El Sayegh" (Arabic for "the goldsmith").
 * Rings and wedding bands, chains and pendants, bangles and bracelets, and
 * earrings in 18K and 21K gold, sixteen products in four categories of four.
 * Gold is sold by weight: each title names the karat and the approximate
 * weight, and the copy says the price follows the day's gold price plus the
 * making charge. The demo prices are plausible for each weight; the pack
 * states no price per gram. No compare-at prices: a jeweller does not
 * discount the gold itself. Data only; the looks draw it.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("gold-jewelry", <slug>)`), square, one each.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * gold on black, velvet, stone and white; no people, hands or other body
 * parts, no logos, lettering or readable hallmarks, none used by a template
 * or another pack, none twice. Hero 20493839 (wide: two granulated bangles
 * with a green stone on dark cloth) and 3266700 (tall: two-tone gold hoops
 * on black, reflected). Tiles: rings 34372573 (two thin gold bands on white
 * pebbles beside linen), chains 29013500 (a bust hung with rope chains in a
 * shop window), bracelets 40315331 (woven gold bangles stacked in a tray),
 * earrings 16935587 (twisted gold hoops on rippled white). Banner 4295007 (a
 * three-row coin necklace on a black bust, black all round). Story 8431786
 * (a beam balance with a black weight on grey: gold is weighed). About
 * 29612233 (wedding bands in a red box among rose petals). `jewelry-luxe`
 * spotlight 30311749 (a gold bangle, a ring and a ring box on red and white).
 * Known and accepted: 30311749 has an unreadable, out-of-focus dark mark at
 * its top edge, outside the 4:5 crop's centre.
 *
 * Left out after the check: 7314466 (a "GOLD" karat sign in the window),
 * 8705767, 8705779 and 8706554 ("SALE" and "Disc. 70%" tags), 19216751 (a
 * lettered card), 31730435 (an engraved script pendant), 6263070 (a cross
 * pendant and a brush maker's name), 248077 (an ornate religious book
 * cover), 33873067 (a Pyrex jug), 35933227 ("585" hallmarks, 14K, readable
 * when zoomed), 29043373 (a lion-and-key medallion that reads like a fashion
 * house's mark), 13174712 (engraving inside the bands), 7707115 and 7472644
 * (coins and printed paper), 18157532 (a maker's name on a case), 18157530
 * (a diamond pendant, not this shop), 38239304, 14509641 and 8433597 (hands
 * or a wrist), 11790262, 8123210, 12145309 and 8274718 (book or magazine
 * text), 17323508 (a name in the box), 5413308, 5413309, 5413310 and 5413313
 * (a brand on the boxes), 20429577 (silver bangles), 9585690 (a pearl hair
 * clip, not this shop). Already used by a template or a pack: 7314460,
 * 8105129, 4735888, 4735895, 12753202, 12585697, 37485307, 37485309,
 * 38827895, 38827915, 32874211, 13524236, 30206324, 37488824, 29624003,
 * 35205571, 7679824, 7679654, 12155925, 19783942, 34365842, 12168883,
 * 32989030, 32989025, 37401774, 37401771, 13292955, 29736434, 5301351,
 * 34399114, 33873069, 10816570, 12865908, 24815712, 33452872. Same shoot as
 * a used photo, so not used: 28933800, 28933801 (28933799), 37485314
 * (37485307), 32989026 (32989025), 13524237 (13524236), 37401986
 * (37401771), 34399145 (34399114), 29502933 (29502931), 20493840 (the
 * hero's own shoot).
 *
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene-<slot>` in the same bucket) now replace every Pexels photo
 * `jewelry-luxe` draws: the hero, the four tiles, the story, the about page
 * and the spotlight. Still Pexels, drawn by no look: hero tall 3266700 and
 * banner 4295007.
 *
 * Looks: `jewelry-luxe` only, the niche's template (one template per niche;
 * `mahr` was deleted with the accessories switch, 2026-11-12). Four products per category, so each `jewelry-luxe`
 * category row is one full row of four. The three featured pieces (the
 * wedding band, the rope chain and the bangle set) fill the spotlight. No
 * `reviews`: a pack holds no invented buyer quotes.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("gold-jewelry", slug);
const scene = (slot: string) => editionPhoto("gold-jewelry", `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  scene("tile-1"), // two plain gold bands and a twisted ring on a white stone block
  scene("tile-2"), // a rope chain with a disc pendant and a Cuban chain on black velvet
  scene("tile-3"), // three bangles and a link bracelet in a black lacquer tray
  scene("tile-4"), // small hoops and crescent earrings on a rippled white dish
];

export const GOLD_JEWELRY: Edition = {
  niche: "gold-jewelry",
  looks: ["jewelry-luxe"],
  priceBand: { min: 4000, max: 60000 },
  // Square packshots on pure white: a square white stage shows each piece whole, and every one reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("الصايغ", "El Sayegh"),
    description: L(
      "ذهب عيار ١٨ و٢١: دبل وخواتم وسلاسل وأساور وأقراط، بالوزن والعيار لكل قطعة.",
      "18K and 21K gold: wedding bands, rings, chains, bangles and earrings, with the weight and karat of every piece.",
    ),
    categories: [
      ["rings", "دبل وخواتم", "Bands and rings", TILES[0]!],
      ["chains", "سلاسل ودلايات", "Chains and pendants", TILES[1]!],
      ["bracelets", "أساور", "Bangles and bracelets", TILES[2]!],
      ["earrings", "أقراط", "Earrings", TILES[3]!],
    ],
    // Newest first. The wedding band, the rope chain and the bangle set are featured: they fill `jewelry-luxe`'s spotlight.
    // Each title names the karat and the approximate weight; the price is a demo price for that weight.
    products: [
      ["gold-wedding-band", "rings", "دبلة سادة عيار ٢١، حوالي ٢٫٨ جرام", "Plain Wedding Band, 21K, about 2.8 g", shot("gold-wedding-band"), 14600, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["gold-rope-chain", "chains", "سلسلة حبل مبرومة عيار ٢١، حوالي ٨ جرام", "Rope Chain, 21K, about 8 g", shot("gold-rope-chain"), 42500, { isFeatured: true, rating: 4.8, sold90: 96 }],
      ["gold-bangle-set", "bracelets", "طقم ٣ أساور عيار ٢١، حوالي ١١٫٥ جرام", "Set of Three Bangles, 21K, about 11.5 g", shot("gold-bangle-set"), 59500, { isFeatured: true, rating: 4.9, sold90: 71 }],
      ["gold-small-hoops", "earrings", "قرط حلقي صغير عيار ١٨، حوالي ١٫٤ جرام", "Small Hoop Earrings, 18K, about 1.4 g", shot("gold-small-hoops"), 6400, { rating: 4.8, sold90: 188 }],
      ["gold-twist-ring", "rings", "خاتم مبروم عيار ١٨، حوالي ٢٫٢ جرام", "Twisted Ring, 18K, about 2.2 g", shot("gold-twist-ring"), 9900, { rating: 4.7, sold90: 132 }],
      ["gold-name-plate-pendant", "chains", "دلاية اسم مستطيلة عيار ٢١، حوالي ٢٫٥ جرام", "Name Plate Pendant, 21K, about 2.5 g", shot("gold-name-plate-pendant"), 12900, { rating: 4.8, sold90: 157 }],
      ["gold-engraved-bangle", "bracelets", "سوار محفور عيار ٢١، حوالي ٧ جرام", "Engraved Bangle, 21K, about 7 g", shot("gold-engraved-bangle"), 36800, { rating: 4.8, sold90: 83 }],
      ["gold-drop-earrings", "earrings", "قرط متدلٍّ عيار ١٨، حوالي ٢٫٤ جرام", "Drop Earrings, 18K, about 2.4 g", shot("gold-drop-earrings"), 10800, { rating: 4.7, sold90: 104 }],
      ["gold-floral-ring", "rings", "خاتم وردة محفورة عيار ٢١، حوالي ٢٫٦ جرام", "Engraved Flower Ring, 21K, about 2.6 g", shot("gold-floral-ring"), 13500, { rating: 4.8, sold90: 119 }],
      ["gold-hand-pendant", "chains", "دلاية كف عيار ٢١، حوالي ١٫٨ جرام", "Hand Pendant, 21K, about 1.8 g", shot("gold-hand-pendant"), 9400, { rating: 4.7, sold90: 141 }],
      ["gold-link-bracelet", "bracelets", "سوار حلقات عيار ١٨، حوالي ٥ جرام", "Link Bracelet, 18K, about 5 g", shot("gold-link-bracelet"), 22800, { rating: 4.7, sold90: 92 }],
      ["gold-stud-earrings", "earrings", "قرط صغير بشكل زر عيار ١٨، حوالي ٠٫٩ جرام", "Small Stud Earrings, 18K, about 0.9 g", shot("gold-stud-earrings"), 4300, { rating: 4.8, sold90: 203 }],
      ["gold-wide-band-ring", "rings", "خاتم عريض غير لامع عيار ٢١، حوالي ٤٫٣ جرام", "Wide Brushed Band, 21K, about 4.3 g", shot("gold-wide-band-ring"), 22200, { rating: 4.7, sold90: 77 }],
      ["gold-cuban-chain", "chains", "سلسلة كوبان عيار ٢١، حوالي ١٠٫٥ جرام", "Cuban Link Chain, 21K, about 10.5 g", shot("gold-cuban-chain"), 55500, { rating: 4.8, sold90: 58 }],
      ["gold-charm-bracelet", "bracelets", "سوار بدلايات عملات عيار ٢١، حوالي ٦ جرام", "Coin Charm Bracelet, 21K, about 6 g", shot("gold-charm-bracelet"), 31500, { rating: 4.8, sold90: 88 }],
      ["gold-crescent-earrings", "earrings", "قرط هلال عيار ٢١، حوالي ٢ جرام", "Crescent Earrings, 21K, about 2 g", shot("gold-crescent-earrings"), 10600, { rating: 4.7, sold90: 112 }],
    ],
  }),
  photos: {
    // `jewelry-luxe` shows the wide one: the bangles sit low in the middle, so a square crop on phones keeps them.
    hero: { wide: scene("hero-wide"), tall: pexels(3266700, 1200) },
    tiles: TILES,
    // A three-row coin necklace on a black bust, black all round: a 21:9 crop keeps the necklace in the middle.
    banner: pexels(4295007, 1920),
    // A brass beam balance, a black weight in one pan and a small gold chain in the other (`jewelry-luxe`'s story block: gold is weighed in front of you).
    story: scene("story"),
    // Two wedding bands in a black velvet box on ivory silk, three red petals beside it (`jewelry-luxe`'s about page).
    about: scene("about"),
    custom: {
      // `jewelry-luxe` spotlight, 4:5: a gold bangle, a ring and an open black ring box on champagne silk.
      "spot-photo": scene("spot-photo"),
    },
  },
  copy: {
    announcement: [
      L("ذهب عيار ١٨ و٢١", "18K and 21K gold"),
      L("الوزن والعيار مذكوران لكل قطعة", "Weight and karat listed for every piece"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("عن الصايغ", "About El Sayegh"), search: L("ابحث عن قطعة ذهب", "Search for a gold piece") },
    hero: {
      alt: L("سواران من الذهب المخرّم وسلسلة مبرومة على حرير أسود", "Two granulated gold bangles and a rope chain on black silk"),
      eyebrow: L("ذهب عيار ١٨ و٢١", "18K and 21K gold"),
      title: L("ذهب بالوزن والعيار", "Gold by weight and karat"),
      line: L(
        "دبل وخواتم وسلاسل وأساور وأقراط، ووزن كل قطعة وعيارها مذكوران في صفحتها.",
        "Bands, rings, chains, bangles and earrings, with each piece's weight and karat on its page.",
      ),
      cta: L("تسوّق الذهب", "Shop gold"),
    },
    categories: { title: L("اختر قطعتك", "Choose your piece") },
    products: {
      primary: {
        alt: L("سوار ذهبي وخاتم وعلبة دبل سوداء على حرير شامبين", "A gold bangle, a ring and a black ring box on champagne silk"),
        eyebrow: L("الأكثر طلبًا", "Most asked for"),
        title: L("قطع الشبكة الأكثر طلبًا", "Our most-asked-for pieces"),
        line: L(
          "دبلة سادة عيار ٢١ وسلسلة حبل مبرومة وطقم ٣ أساور، ووزن كل قطعة وعيارها مذكوران.",
          "A plain 21K wedding band, a rope chain and a set of three bangles: each with its weight and karat written down.",
        ),
        cta: L("كل القطع المطلوبة", "All popular pieces"),
      },
    },
    story: {
      alt: L("ميزان بكفتين، في إحداهما ثقل أسود وفي الأخرى سلسلة ذهبية", "A beam balance with a black weight in one pan and a gold chain in the other"),
      eyebrow: L("الوزن والعيار", "Weight and karat"),
      title: L("وزن كل قطعة مذكور", "Every piece's weight listed"),
      text: L(
        "نذكر وزن كل قطعة وعيارها في صفحتها، ويُحسب السعر حسب سعر الجرام والمصنعية.",
        "Every piece's weight and karat are on its page, and its price follows the gram price plus the making charge.",
      ),
      cta: L("تعرّف علينا", "Our story"),
    },
    trust: [
      { title: L("عيار واضح", "Clear karat"), line: L("ذهب عيار ١٨ و٢١", "18K and 21K gold") },
      { title: L("الوزن مذكور", "Weight listed"), line: L("لكل قطعة وزنها وعيارها", "Weight and karat for every piece") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على الموديلات الجديدة أولًا", "See new designs first"),
      line: L("رسالة واحدة شهريًا: الموديلات الجديدة ونصائح لاختيار العيار والمقاس.", "One letter a month: new designs and tips on choosing the karat and size."),
      note: L("بدون رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: {
      line: L(
        "ذهب عيار ١٨ و٢١ بالوزن والعيار لكل قطعة.",
        "18K and 21K gold, with the weight and karat of every piece.",
      ),
    },
    about: {
      line: L("متجر ذهب يبيع بالوزن، والوزن مذكور.", "A gold shop that sells by weight, and writes the weight down."),
      alt: L("دبلتان ذهبيتان في علبة مخملية سوداء بجوار أوراق ورد حمراء", "Two gold wedding bands in a black velvet box beside red rose petals"),
      eyebrow: L("من نحن", "Who we are"),
      title: L("الذهب أمانة", "Gold is a trust"),
      text: L(
        "الصايغ متجر ذهب يبيع عيار ١٨ و٢١، ويُحسب سعر كل قطعة حسب سعر الجرام يوم الشراء والمصنعية.",
        "El Sayegh sells 18K and 21K gold, and each piece's price is the gram price on the day you buy plus the making charge.",
      ),
      more: L(
        "ولأي سؤال عن الوزن أو العيار أو المقاس، تواصل معنا.",
        "For any question about weight, karat or size, contact us.",
      ),
      cta: L("تسوّق الذهب", "Shop gold"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(
        "اسأل عن وزن قطعة أو مقاس دبلة.",
        "Ask about a piece's weight or a ring size.",
      ),
      heading: L("اسأل عن قطعة أو عن طلبك", "Ask about a piece or your order"),
    },
    faq: {
      line: L("السعر والوزن والعيار.", "Price, weight and karat."),
      question: L("لماذا قد يتغير سعر القطعة؟", "Why can a piece's price change?"),
      answer: L(
        "لأن سعر الذهب يتغير يوميًا. سعر القطعة هو وزنها مضروبًا في سعر جرام عيارها يوم الشراء، مضافًا إليه المصنعية.",
        "Because the gold price changes every day. A piece's price is its weight times the gram price of its karat on the day you buy, plus the making charge.",
      ),
    },
    custom: {
      // `jewelry-luxe`: the link to the whole catalog (header, footer, the spotlight's "view all").
      "shop-all": L("كل الذهب", "All gold"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("قطع ذهب قد تعجبك", "More gold pieces you may like") } },
};
