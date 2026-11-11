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
 * Looks: `jewelry-luxe` (its other planned looks, `mahr` and `kholkhal`, are
 * not edition-ready). Four products per category, so each `jewelry-luxe`
 * category row is one full row of four. The three featured pieces (the
 * wedding band, the rope chain and the bangle set) fill the spotlight. No
 * `reviews`: a pack holds no invented buyer quotes.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("gold-jewelry", slug);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(34372573, 1200), // two thin gold bands on white pebbles beside linen
  pexels(29013500, 1200), // a bust hung with rope chains in a shop window
  pexels(40315331, 1200), // woven gold bangles stacked in a tray
  pexels(16935587, 1200), // twisted gold hoops on rippled white
];

export const GOLD_JEWELRY: Edition = {
  niche: "gold-jewelry",
  // `mahr` and `kholkhal` are planned looks for this niche but not edition-ready yet.
  looks: ["jewelry-luxe"],
  priceBand: { min: 4000, max: 60000 },
  // Square packshots on pure white: a square white stage shows each piece whole, and every one reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("الصايغ", "El Sayegh"),
    description: L(
      "دهب عيار ١٨ و٢١ بالوزن: دبل وخواتم وسلاسل وغوايش وحلقان، مدموغة وبفاتورة.",
      "18K and 21K gold sold by weight: wedding bands, rings, chains, bangles and earrings, hallmarked and invoiced.",
    ),
    categories: [
      ["rings", "دبل وخواتم", "Bands and rings", TILES[0]!],
      ["chains", "سلاسل وتعاليق", "Chains and pendants", TILES[1]!],
      ["bracelets", "غوايش وانسيالات", "Bangles and bracelets", TILES[2]!],
      ["earrings", "حلقان", "Earrings", TILES[3]!],
    ],
    // Newest first. The wedding band, the rope chain and the bangle set are featured: they fill `jewelry-luxe`'s spotlight.
    // Each title names the karat and the approximate weight; the price is a demo price for that weight.
    products: [
      ["gold-wedding-band", "rings", "دبلة سادة عيار ٢١، حوالي ٢٫٨ جرام", "Plain Wedding Band, 21K, about 2.8 g", shot("gold-wedding-band"), 14600, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["gold-rope-chain", "chains", "سلسلة حبل مبرومة عيار ٢١، حوالي ٨ جرام", "Rope Chain, 21K, about 8 g", shot("gold-rope-chain"), 42500, { isFeatured: true, rating: 4.8, sold90: 96 }],
      ["gold-bangle-set", "bracelets", "طقم ٣ غوايش عيار ٢١، حوالي ١١٫٥ جرام", "Set of Three Bangles, 21K, about 11.5 g", shot("gold-bangle-set"), 59500, { isFeatured: true, rating: 4.9, sold90: 71 }],
      ["gold-small-hoops", "earrings", "حلق حلقة صغير عيار ١٨، حوالي ١٫٤ جرام", "Small Hoop Earrings, 18K, about 1.4 g", shot("gold-small-hoops"), 6400, { rating: 4.8, sold90: 188 }],
      ["gold-twist-ring", "rings", "خاتم مبروم عيار ١٨، حوالي ٢٫٢ جرام", "Twisted Ring, 18K, about 2.2 g", shot("gold-twist-ring"), 9900, { rating: 4.7, sold90: 132 }],
      ["gold-name-plate-pendant", "chains", "تعليقة اسم مستطيلة عيار ٢١، حوالي ٢٫٥ جرام", "Name Plate Pendant, 21K, about 2.5 g", shot("gold-name-plate-pendant"), 12900, { rating: 4.8, sold90: 157 }],
      ["gold-engraved-bangle", "bracelets", "غويشة محفورة عيار ٢١، حوالي ٧ جرام", "Engraved Bangle, 21K, about 7 g", shot("gold-engraved-bangle"), 36800, { rating: 4.8, sold90: 83 }],
      ["gold-drop-earrings", "earrings", "حلق مدلّى عيار ١٨، حوالي ٢٫٤ جرام", "Drop Earrings, 18K, about 2.4 g", shot("gold-drop-earrings"), 10800, { rating: 4.7, sold90: 104 }],
      ["gold-floral-ring", "rings", "خاتم وردة محفورة عيار ٢١، حوالي ٢٫٦ جرام", "Engraved Flower Ring, 21K, about 2.6 g", shot("gold-floral-ring"), 13500, { rating: 4.8, sold90: 119 }],
      ["gold-hand-pendant", "chains", "تعليقة كف عيار ٢١، حوالي ١٫٨ جرام", "Hand Pendant, 21K, about 1.8 g", shot("gold-hand-pendant"), 9400, { rating: 4.7, sold90: 141 }],
      ["gold-link-bracelet", "bracelets", "انسيال حلقات عيار ١٨، حوالي ٥ جرام", "Link Bracelet, 18K, about 5 g", shot("gold-link-bracelet"), 22800, { rating: 4.7, sold90: 92 }],
      ["gold-stud-earrings", "earrings", "حلق زرار صغير عيار ١٨، حوالي ٠٫٩ جرام", "Small Stud Earrings, 18K, about 0.9 g", shot("gold-stud-earrings"), 4300, { rating: 4.8, sold90: 203 }],
      ["gold-wide-band-ring", "rings", "خاتم عريض مطفي عيار ٢١، حوالي ٤٫٣ جرام", "Wide Brushed Band, 21K, about 4.3 g", shot("gold-wide-band-ring"), 22200, { rating: 4.7, sold90: 77 }],
      ["gold-cuban-chain", "chains", "سلسلة كوبان عيار ٢١، حوالي ١٠٫٥ جرام", "Cuban Link Chain, 21K, about 10.5 g", shot("gold-cuban-chain"), 55500, { rating: 4.8, sold90: 58 }],
      ["gold-charm-bracelet", "bracelets", "انسيال بدلايات عملات عيار ٢١، حوالي ٦ جرام", "Coin Charm Bracelet, 21K, about 6 g", shot("gold-charm-bracelet"), 31500, { rating: 4.8, sold90: 88 }],
      ["gold-crescent-earrings", "earrings", "حلق هلال عيار ٢١، حوالي ٢ جرام", "Crescent Earrings, 21K, about 2 g", shot("gold-crescent-earrings"), 10600, { rating: 4.7, sold90: 112 }],
    ],
  }),
  photos: {
    // `jewelry-luxe` shows the wide one: the bangles sit low in the middle, so a square crop on phones keeps them.
    hero: { wide: pexels(20493839, 1920), tall: pexels(3266700, 1200) },
    tiles: TILES,
    // A three-row coin necklace on a black bust, black all round: a 21:9 crop keeps the necklace in the middle.
    banner: pexels(4295007, 1920),
    // A beam balance with a black weight on grey (`jewelry-luxe`'s story block: gold is weighed in front of you).
    story: pexels(8431786, 1200),
    // Wedding bands in a red box among rose petals (`jewelry-luxe`'s about page).
    about: pexels(29612233, 1200),
    custom: {
      // `jewelry-luxe` spotlight, 4:5: a gold bangle, a ring and a ring box on red and white.
      "spot-photo": pexels(30311749, 1200),
    },
  },
  copy: {
    announcement: [
      L("الأسعار ماشية مع سعر الدهب النهارده", "Prices follow today's gold price"),
      L("فاتورة بالعيار والوزن مع كل قطعة", "An invoice with the karat and weight for every piece"),
      L("توصيل مؤمَّن لكل محافظات مصر", "Insured delivery across Egypt"),
    ],
    labels: { about: L("عن الصايغ", "About El Sayegh"), search: L("دوّر على قطعة دهب", "Search for a gold piece") },
    hero: {
      alt: L("غويشتين دهب مخرّمين بحجر أخضر على قماش غامق", "Two granulated gold bangles with a green stone on dark cloth"),
      eyebrow: L("دهب عيار ١٨ و٢١", "18K and 21K gold"),
      title: L("دهب بالوزن وبالفاتورة", "Gold by weight, with an invoice"),
      line: L(
        "دبل وخواتم وسلاسل وغوايش وحلقان مدموغة. السعر بيتحسب على سعر جرام النهارده والمصنعية، والوزن مكتوب في الفاتورة.",
        "Hallmarked bands, rings, chains, bangles and earrings. The price is today's gold price plus the making charge, and the weight is on the invoice.",
      ),
      cta: L("تسوّق الدهب", "Shop gold"),
    },
    categories: { title: L("اختار قطعتك", "Choose your piece") },
    products: {
      primary: {
        alt: L("غويشة دهب وخاتم وعلبة دبل على أحمر وأبيض", "A gold bangle, a ring and a ring box on red and white"),
        eyebrow: L("الأكتر طلبًا", "Most asked for"),
        title: L("قطع الشبكة اللي الكل بيسأل عليها", "The pieces everyone asks about"),
        line: L(
          "دبلة سادة عيار ٢١، وسلسلة حبل مبرومة، وطقم ٣ غوايش: كل قطعة بوزنها وعيارها مكتوبين.",
          "A plain 21K wedding band, a rope chain and a set of three bangles: each with its weight and karat written down.",
        ),
        cta: L("كل القطع المطلوبة", "All popular pieces"),
      },
    },
    story: {
      alt: L("ميزان بكفتين وعليه سنجة سودا على خلفية رمادي", "A beam balance with a black weight on a grey background"),
      eyebrow: L("قبل ما تدفع", "Before you pay"),
      title: L("بنوزن كل قطعة قدامك", "Every piece is weighed in front of you"),
      text: L(
        "كل قطعة بتتوزن على ميزان مظبوط، والوزن والعيار والمصنعية بيتكتبوا في الفاتورة. لو طلبت أونلاين، بنبعت لك صورة الميزان قبل الشحن.",
        "Every piece is weighed on a calibrated scale, and the weight, karat and making charge go on the invoice. If you order online, we send you a photo of the scale before we ship.",
      ),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    trust: [
      { title: L("دهب مدموغ", "Hallmarked gold"), line: L("عيار ١٨ و٢١ بدمغة واضحة", "18K and 21K with a clear hallmark") },
      { title: L("فاتورة بالوزن", "Invoice by weight"), line: L("العيار والوزن والمصنعية مكتوبين", "Karat, weight and making charge listed") },
      { title: L("استبدال بسعر اليوم", "Exchange at the day's price"), line: L("رجّع القطعة بالفاتورة واستبدلها بالوزن", "Bring the piece with its invoice and exchange it by weight") },
      { title: L("توصيل مؤمَّن", "Insured delivery"), line: L("لأي محافظة في مصر", "To any governorate in Egypt") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "See new designs first"),
      line: L("رسالة واحدة في الشهر: الموديلات الجديدة ونصايح تختار بيها العيار والمقاس.", "One letter a month: new designs and tips on choosing the karat and size."),
      note: L("من غير رسايل كتير. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: {
      line: L(
        "دهب عيار ١٨ و٢١ مدموغ، بالوزن وبالفاتورة، وبنستبدل بسعر اليوم. وبيوصلك لحد البيت.",
        "Hallmarked 18K and 21K gold, sold by weight with an invoice, exchanged at the day's price, and delivered to your door.",
      ),
    },
    about: {
      line: L("محل دهب بيبيع بالوزن، والوزن مكتوب.", "A gold shop that sells by weight, and writes the weight down."),
      alt: L("دبلتين دهب في علبة حمرا وسط ورد", "Two gold wedding bands in a red box among rose petals"),
      eyebrow: L("مين إحنا", "Who we are"),
      title: L("الدهب أمانة، والفاتورة كلمة", "Gold is trust, and the invoice is our word"),
      text: L(
        "الصايغ محل دهب عائلي. بنبيع دهب عيار ١٨ و٢١ بس، كل قطعة مدموغة، وسعرها بيتحسب على سعر جرام يوم الشراء والمصنعية، من غير أي حاجة مستخبية.",
        "El Sayegh is a family gold shop. We sell only 18K and 21K gold, every piece is hallmarked, and its price is the gold price on the day you buy plus the making charge, with nothing hidden.",
      ),
      more: L(
        "واللي بتشتريه مننا بيفضل قيمته معاك: هات القطعة بالفاتورة في أي وقت، ونستبدلها لك بالوزن بسعر اليوم. والأسعار المعروضة في الموقع بتتحدث مع سعر الدهب.",
        "And what you buy from us keeps its value: bring the piece back with its invoice any time, and we exchange it by weight at the day's price. The prices on the site follow the gold price.",
      ),
      cta: L("تسوّق الدهب", "Shop gold"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(
        "اسأل عن وزن قطعة، أو عن مقاس دبلة، أو عن حفر اسم على التعليقة، والتاجر هيرد عليك بنفسه.",
        "Ask about a piece's weight, a ring size, or a name engraved on a pendant, and the jeweller will answer you himself.",
      ),
      heading: L("اسأل عن قطعة أو عن طلبك", "Ask about a piece or your order"),
    },
    faq: {
      line: L("السعر والفاتورة والاستبدال.", "Price, invoice and exchange."),
      question: L("ليه سعر القطعة ممكن يتغير؟", "Why can a piece's price change?"),
      answer: L(
        "لأن سعر الدهب بيتغير كل يوم. سعر القطعة هو وزنها في سعر جرام العيار بتاعها يوم الشراء، زائد المصنعية. بنأكد معاك السعر النهائي على الهاتف قبل ما نشحن، وبيتكتب في الفاتورة.",
        "Because the gold price changes every day. A piece's price is its weight times the gram price of its karat on the day you buy, plus the making charge. We confirm the final price with you by phone before we ship, and it goes on the invoice.",
      ),
    },
    custom: {
      // `jewelry-luxe`: the link to the whole catalog (header, footer, the spotlight's "view all").
      "shop-all": L("كل الدهب", "All gold"),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي اشتروا", "From people who bought it"), related: L("قطع دهب تانية هتعجبك", "More gold pieces you may like") } },
};
