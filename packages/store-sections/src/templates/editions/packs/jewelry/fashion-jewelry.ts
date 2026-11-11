/**
 * The fashion jewelry pack (niche editions, ROADMAP F-90): an everyday
 * accessories shop, "Hilya" (Arabic for an ornament). Gold-tone and silver
 * fashion jewelry at gift prices: necklaces, earrings, bracelets and rings.
 * Honest materials: gold-plated stainless steel, sterling silver plated,
 * crystals (not diamonds) and freshwater-style pearls. Data only; the looks
 * draw it.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("fashion-jewelry", <slug>)`), square, one each.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * jewelry on dishes, fabric and plaster, blush, white and beige; no people,
 * hands or other body parts, no logos or lettering, none used by a template
 * or another pack, none twice. Hero 9430992 (wide: silver rings, speckled
 * stones and dried limonium on blush) and 9430468 (tall: a silver chain
 * draped over a stone, same blush set). Tiles: necklaces 4735887 (two gold
 * coin necklaces on white marble; it replaced 34317579 on 2026-11-11, whose
 * sprig outweighed the tiny necklace), earrings 13081070
 * (chunky gold hoops on white satin), bracelets 36823002 (a pearl bracelet
 * on a white cloud dish), rings 9714276 (rings in a pearly clay dish on white
 * sheets). Banner 11185142 (five stone-bead bracelets on white boards).
 * Story 4714615 (vintage earrings, a velvet ring box and silk ribbon spools).
 * About 9430429 (silver rings and a chain around a shell on blush).
 * `jewelry-luxe` spotlight 6716445 (a pearl set in two-tone metal on pink).
 * `karat` lookbook 34501351, 12144978, 36229131, 34544786, 38480376; story
 * rings 15518758, 7743156, 9430463, 4155247.
 *
 * Left out after the check: 9173459 (crosses and a religious medallion),
 * 9478069 (letter pendants and a printed card), 37801576 and 37801574
 * (printed book pages), 20559488 (a magazine masthead), 2872405 (product
 * labels), 9430422 (a person at the table), 38984019 (engraved lettering on
 * the cuff), 5987971 (lettering on the box), 38909368 (a "SIZE" tag),
 * 39332734 (a shop sign behind the stand), 31854723 (an engraved bar),
 * 31576814 (small letter charms on the clasps), 18808762, 18680832 and
 * 10474286 (printed cards and lettering), 9144528 (a jar label), 7700270 and
 * 14579309 (diamond and bridal looks, not this shop), 19480676 and 19480678
 * (bridal hair vines, a wax seal). Already used by a template: 4155252,
 * 4155255, 7248760, 4004225, 26570970, 26791734, 29502931, 9149232,
 * 4735892, 9888084, 36229128, 37401770, 28933799, 17261921, 10897815,
 * 16664386, 7882737, 26592836, 12452943, 12194363, 37560446, 19029553.
 * Close to karat's own hoop shoot (12194350, 12194361), so not used:
 * 12194345, 12194348.
 *
 * Anatomy (`zahra`'s note dots, `photos.look`): 27357178 (a gold-tone
 * crystal necklace on a pebble before a pink paper roll; checked by eye
 * 2026-11-11, no people or lettering, used nowhere else). Its dots: the
 * plating, the chain, the stones, care.
 *
 * Looks: `zahra` (the niche's template, one template per niche; it shows
 * the pack itself), then `karat` and `jewelry-luxe` until the accessories
 * switch takes them off. Four products per category, so each
 * `jewelry-luxe` category row is one full row of four. No `reviews`: a pack
 * holds no invented buyer quotes, and without them `karat` leaves its
 * reviews section out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("fashion-jewelry", slug);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(4735887, 1200), // two gold coin necklaces on white marble
  pexels(13081070, 1200), // chunky gold hoops on white satin
  pexels(36823002, 1200), // a pearl bracelet on a white cloud dish
  pexels(9714276, 1200), // rings in a pearly clay dish on white sheets
];

export const FASHION_JEWELRY: Edition = {
  niche: "fashion-jewelry",
  looks: ["zahra", "karat", "jewelry-luxe"],
  priceBand: { min: 250, max: 1500 },
  // Square packshots on pure white: a square white stage shows them whole, and every piece reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("حِلية", "Hilya"),
    description: L(
      "سلاسل وحلقان وانسيالات وخواتم مطلية دهب وفضة، للبس كل يوم وللهدايا.",
      "Gold-tone and silver necklaces, earrings, bracelets and rings, for every day and for gifts.",
    ),
    categories: [
      ["necklaces", "سلاسل", "Necklaces", TILES[0]!],
      ["earrings", "حلقان", "Earrings", TILES[1]!],
      ["bracelets", "انسيالات وأساور", "Bracelets", TILES[2]!],
      ["rings", "خواتم", "Rings", TILES[3]!],
    ],
    // Newest first. The three featured pieces fill `jewelry-luxe`'s spotlight.
    products: [
      ["gold-coin-layered-necklace", "necklaces", "سلسلة طبقتين دهبي بدلاية عملة", "Gold Layered Coin Necklace", shot("gold-coin-layered-necklace"), 650, { isFeatured: true, rating: 4.8, sold90: 212 }],
      ["gold-hoop-earrings", "earrings", "حلق هوب دهبي عريض", "Chunky Gold Hoop Earrings", shot("gold-hoop-earrings"), 380, { isFeatured: true, rating: 4.9, sold90: 318 }],
      ["gold-chain-bracelet", "bracelets", "انسيال دهبي بحلقات بيبر كليب", "Gold Paperclip Chain Bracelet", shot("gold-chain-bracelet"), 450, { isFeatured: true, rating: 4.7, sold90: 176 }],
      ["gold-signet-ring", "rings", "خاتم سيجنت دهبي", "Gold Signet Ring", shot("gold-signet-ring"), 350, { rating: 4.6, sold90: 143 }],
      ["pearl-pendant-necklace", "necklaces", "سلسلة رفيعة بدلاية لولي", "Pearl Pendant Necklace", shot("pearl-pendant-necklace"), 480, { rating: 4.8, sold90: 167 }],
      ["pearl-drop-earrings", "earrings", "حلق لولي مدلدل", "Pearl Drop Earrings", shot("pearl-drop-earrings"), 340, { rating: 4.7, sold90: 189 }],
      ["beaded-charm-bracelet", "bracelets", "انسيال خرز بمبي بدلاية دهبي", "Pink Beaded Charm Bracelet", shot("beaded-charm-bracelet"), 290, { rating: 4.6, sold90: 154 }],
      ["pearl-cocktail-ring", "rings", "خاتم كوكتيل باللولي", "Pearl Cocktail Ring", shot("pearl-cocktail-ring"), 390, { rating: 4.5, sold90: 88 }],
      ["gold-herringbone-necklace", "necklaces", "سلسلة هيرينج بون دهبي", "Gold Herringbone Necklace", shot("gold-herringbone-necklace"), 720, { compareAtPrice: 850, rating: 4.7, sold90: 121 }],
      ["crystal-stud-earrings", "earrings", "حلق كريستال صغير", "Crystal Stud Earrings", shot("crystal-stud-earrings"), 260, { rating: 4.8, sold90: 274 }],
      ["silver-cuff-bracelet", "bracelets", "أسورة فضي مفتوحة", "Silver Cuff Bracelet", shot("silver-cuff-bracelet"), 520, { rating: 4.6, sold90: 97 }],
      ["crystal-solitaire-ring", "rings", "خاتم سوليتير كريستال", "Crystal Solitaire Ring", shot("crystal-solitaire-ring"), 420, { compareAtPrice: 490, rating: 4.7, sold90: 158 }],
      ["silver-heart-pendant-necklace", "necklaces", "سلسلة فضي بدلاية قلب", "Silver Heart Pendant Necklace", shot("silver-heart-pendant-necklace"), 420, { rating: 4.8, sold90: 201 }],
      ["silver-chain-drop-earrings", "earrings", "حلق سلسلة فضي طويل", "Silver Chain Drop Earrings", shot("silver-chain-drop-earrings"), 320, { rating: 4.5, sold90: 112 }],
      ["gold-tennis-bracelet", "bracelets", "انسيال تنس دهبي بكريستال", "Gold Crystal Tennis Bracelet", shot("gold-tennis-bracelet"), 890, { compareAtPrice: 1050, rating: 4.7, sold90: 134 }],
      ["stackable-silver-rings", "rings", "طقم خواتم فضي للستاكينج", "Stackable Silver Rings Set", shot("stackable-silver-rings"), 360, { rating: 4.6, sold90: 186 }],
    ],
  }),
  photos: {
    // One shoot: silver pieces, speckled stones and dried flowers on blush paper.
    hero: { wide: pexels(9430992, 1920), tall: pexels(9430468, 1200) },
    tiles: TILES,
    // Five stone-bead bracelets on white painted boards (a calm field for copy).
    banner: pexels(11185142, 1920),
    // Vintage earrings, a velvet ring box and silk ribbon spools on linen (the gift wrapping story).
    story: pexels(4714615, 1200),
    // Silver rings and a chain around a shell on blush (landscape, the about page).
    about: pexels(9430429, 1200),
    // `zahra`: one piece with four note dots (not shop the look), in percent from the photo's left and top on its 4:5 crop: the plating, the chain, the stones, care.
    look: {
      src: pexels(27357178, 1200),
      dots: [
        { x: 51, y: 27 },
        { x: 35, y: 43 },
        { x: 60, y: 66 },
        { x: 46, y: 70 },
      ],
    },
    custom: {
      // `jewelry-luxe` spotlight, 4:5: a pearl set in two-tone metal on pink paper.
      "spot-photo": pexels(6716445, 1200),
      // `karat` lookbook, square: one large photo, then four small ones (subjects centred: the bento crops to the middle).
      "lookbook-1": pexels(34501351, 1200), // earrings and a pearl scrunchie bracelet on white chiffon
      "lookbook-2": pexels(12144978, 900), // braided gold hoops on kraft paper
      "lookbook-3": pexels(36229131, 900), // pearl strands and clip earrings in a mother-of-pearl shell
      "lookbook-4": pexels(34544786, 900), // studs and pearls in a teal leaf dish
      "lookbook-5": pexels(38480376, 900), // enamel bangles and bead bracelets on grey felt
      // `karat` story rings 5 to 8 (rings 1 to 4 show the category tiles).
      "stories-5": pexels(15518758, 900), // twisted gold hoops hanging from a leaf
      "stories-6": pexels(7743156, 900), // a pearl wrap bracelet and a pearl strand on tulle
      "stories-7": pexels(9430463, 900), // silver rings and a chain on a stone, blush
      "stories-8": pexels(4155247, 900), // gold chains and rings in a brass dish among leaves
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("كل طلب بيتغلف في كيس قطيفة جاهز للهدية", "Every order comes in a velvet pouch, ready to gift"),
    ],
    labels: { about: L("عن حِلية", "About Hilya"), search: L("دوّري على قطعة", "Search for a piece") },
    hero: {
      alt: L("خواتم فضي وأحجار صغيرة وورد مجفف على ورق وردي", "Silver rings, small stones and dried flowers on blush paper"),
      eyebrow: L("وصل جديد", "Just landed"),
      title: L("إكسسوار يكمّل لبسك", "Jewelry that finishes your outfit"),
      line: L(
        "سلاسل وحلقان وانسيالات وخواتم مطلية دهب وفضة، تلبسيها كل يوم أو تهاديها لحد بتحبيه.",
        "Gold-tone and silver necklaces, earrings, bracelets and rings to wear every day, or to give to someone you love.",
      ),
      cta: L("شوفي الجديد", "See what's new"),
    },
    categories: { title: L("اختاري القطعة", "Choose your piece") },
    products: {
      primary: {
        alt: L("طقم لولي بمعدن دهبي وفضي على ورق بمبي", "A pearl set in gold and silver tones on pink paper"),
        eyebrow: L("المفضلين عندنا", "Our favourites"),
        // Read by both looks: over the three featured pieces (`jewelry-luxe`) and over the shelf tabs (`karat`), so it names no number.
        title: L("القطع اللي الكل بيسأل عليها", "The pieces everyone asks about"),
        line: L(
          "سلسلة العملة بطبقتين، والهوب الدهبي العريض، وانسيال البيبر كليب: يتلبسوا مع بعض أو كل واحد لوحده.",
          "The layered coin necklace, the chunky gold hoops and the paperclip bracelet: wear them together or one at a time.",
        ),
        cta: L("كل الأكثر طلبًا", "All best sellers"),
      },
    },
    story: {
      alt: L("حلق قديم الطراز وعلبة خاتم قطيفة وبكر شرايط حرير على قماش", "Vintage-style earrings, a velvet ring box and silk ribbon spools on linen"),
      eyebrow: L("جاهزة للهدية", "Ready to gift"),
      title: L("كل قطعة بتوصل متغلفة", "Every piece arrives wrapped"),
      text: L(
        "بنراجع كل قطعة قبل ما تتشحن: القفل، اللحام، واللمعة. وبعدين بنحطها في كيس قطيفة مع كارت صغير، ولو هدية اكتبي لنا الإهداء ونكتبه بخط إيدنا.",
        "We check every piece before it ships: the clasp, the joins and the shine. Then it goes into a velvet pouch with a small card, and if it is a gift, send us your message and we write it by hand.",
      ),
      cta: L("اعرفي حكايتنا", "Read our story"),
    },
    // `zahra`: the heading over the anatomy photo (its notes are `custom.anatomy-N-*`).
    look: {
      alt: L("سلسلة دهبي بفصوص كريستال على حجر صغير قدام لفة ورق وردي", "A gold-tone crystal necklace on a small pebble before a roll of pink paper"),
      eyebrow: L("من قريب", "Up close"),
      title: L("اعرفي القطعة قبل ما تلبسيها", "Know the piece before you wear it"),
      text: L("دوسي على أي نقطة في الصورة وشوفي خامتها وطولها وإزاي تحافظي عليها.", "Tap a dot on the photo for its material, its length and how to care for it."),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("لأي محافظة في مصر", "To any governorate in Egypt") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفعي لما الطلب يوصلك", "Pay when your order arrives") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("خلال ١٤ يوم لو القطعة مالبستيهاش", "Within 14 days if the piece is unworn") },
      { title: L("تغليف هدية", "Gift wrapping"), line: L("كيس قطيفة وكارت مع كل طلب", "A velvet pouch and a card with every order") },
    ],
    newsletter: {
      title: L("أول ما ينزل جديد هتعرفي", "Hear about new pieces first"),
      line: L(
        "رسالة كل أسبوعين: القطع الجديدة وأفكار تنسيق السلاسل والخواتم مع بعض.",
        "One letter every two weeks: new pieces and ideas for layering necklaces and stacking rings.",
      ),
      note: L("من غير رسايل كتير. تقدري تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: {
      line: L(
        "إكسسوارات مطلية دهب وفضة بأسعار في المتناول، متغلفة وجاهزة للهدية، وبتوصلك لحد البيت.",
        "Gold-tone and silver fashion jewelry at friendly prices, wrapped and ready to gift, delivered to your door.",
      ),
    },
    about: {
      line: L("إكسسوارات حلوة تتلبس كل يوم، من غير ما تفكري في السعر.", "Pretty jewelry to wear every day, without thinking twice about the price."),
      alt: L("خواتم فضي وسلسلة حوالين صدفة على ورق وردي", "Silver rings and a chain around a shell on blush paper"),
      eyebrow: L("مين إحنا", "Who we are"),
      title: L("قطع صغيرة تفرق في اليوم", "Small pieces that lift your day"),
      text: L(
        "بدأنا حِلية عشان نلاقي إكسسوار شكله غالي وسعره معقول. بنختار ستانلس ستيل مطلي دهب عيار ١٨ وفضة مطلية، عشان القطعة تستحمل لبس كل يوم.",
        "We started Hilya to find jewelry that looks precious at a sensible price. We choose 18K gold-plated stainless steel and silver-plated pieces, so each one holds up to daily wear.",
      ),
      more: L(
        "ومش بنقول على حاجة إنها دهب أو ألماظ وهي مش كده: الكريستال كريستال، واللولي لولي مية عذبة أو صناعي، ومكتوب في صفحة كل قطعة.",
        "And we never call anything gold or diamond when it is not: crystal is crystal, pearls are freshwater-style or faux, and each product page says which.",
      ),
      cta: L("شوفي الجديد", "See what's new"),
    },
    contact: {
      title: L("كلّمينا", "Talk to us"),
      line: L(
        "محتارة تختاري هدية؟ قولي لنا الميزانية وذوق اللي هتهاديها ونرشح لك.",
        "Not sure which gift to choose? Tell us your budget and her style and we suggest a few pieces.",
      ),
      heading: L("اسألي عن هدية أو عن طلبك", "Ask about a gift or your order"),
    },
    faq: {
      line: L("الخامات والعناية والتوصيل.", "Materials, care and delivery."),
      question: L("القطع دي دهب وفضة حقيقي؟", "Is this real gold and silver?"),
      answer: L(
        "لأ، دي إكسسوارات: ستانلس ستيل مطلي دهب عيار ١٨ أو فضة مطلية، والكريستال مش ألماظ. عشان تفضل تلمع، اقلعيها قبل الدش والبرفان واحفظيها في الكيس بتاعها.",
        "No, this is fashion jewelry: 18K gold-plated stainless steel or silver-plated metal, and the crystals are not diamonds. To keep the shine, take it off before showering or spraying perfume and keep it in its pouch.",
      ),
    },
    custom: {
      // `jewelry-luxe`: the link to the whole catalog (header, footer, the spotlight's "view all").
      "shop-all": L("كل الإكسسوارات", "All jewelry"),
      // `karat`: the store's short name inside a sentence.
      "store-short": L("حِلية", "Hilya"),
      // `karat`: the hero's small line and its round sticker (a price point, not an offer).
      "hero-note": L("تشكيلة الموسم", "This season"),
      "hero-sticker-1": L("هدايا تحت", "Gifts under"),
      "hero-sticker-2": L("٥٠٠", "500"),
      "hero-sticker-3": L("جنيه", "EGP"),
      // `karat`: the eight story rings. 1 to 4 show the category tiles, in the categories' order.
      "stories-1": L("سلاسل", "Necklaces"),
      "stories-2": L("حلقان", "Earrings"),
      "stories-3": L("انسيالات", "Bracelets"),
      "stories-4": L("خواتم", "Rings"),
      "stories-5": L("هوب", "Hoops"),
      "stories-6": L("لولي", "Pearls"),
      "stories-7": L("فضي", "Silver"),
      "stories-8": L("دهبي", "Gold-tone"),
      // `karat`: the lookbook's brand tile. No invented handle: the seller's own replaces it.
      "lookbook-handle": L("حِلية على إنستجرام", "Hilya on Instagram"),
      "lookbook-line": L("أفكار تنسيق جديدة كل أسبوع", "New styling ideas every week"),
      // `zahra`: the noun after a category's product count.
      "products-noun": L("قطعة", "pieces"),
      // `zahra`: the four anatomy notes, in the order of `photos.look.dots` (a title of one or two words, one line each).
      "anatomy-1-title": L("الطلاء", "The plating"),
      "anatomy-1-line": L("ستانلس ستيل مطلي دهب عيار ١٨، خفيف على البشرة الحساسة.", "18K gold plating over stainless steel, gentle on sensitive skin."),
      "anatomy-2-title": L("السلسلة", "The chain"),
      "anatomy-2-line": L("طولها ٤٢ سم ومعاها وصلة ٥ سم، بقفل لوبستر تقفليه لوحدك.", "42 cm with a 5 cm extender and a lobster clasp you can close on your own."),
      "anatomy-3-title": L("الفصوص", "The stones"),
      "anatomy-3-line": L("كريستال مقصوص بيلمع، ومش بنقول عليه ألماظ.", "Cut crystal that catches the light, and we never call it diamond."),
      "anatomy-4-title": L("العناية", "Care"),
      "anatomy-4-line": L("اقلعيها قبل الدش والبرفان، امسحيها بقماشة ناشفة واحفظيها في كيسها.", "Take it off before showering or perfume, wipe it dry and keep it in its pouch."),
    },
  },
  productPage: { copy: { reviews: L("قالوا إيه عن القطعة دي", "What buyers say"), related: L("تتلبس معاها", "Wear it with") } },
  // Jewelry-luxe's own shop (owner, 2026-11-11: two looks of one niche must not look duplicated): "Bareeq", a warm
  // gold glow for work and evenings, best sellers in the spotlight. Same pieces and prices; its own copy, photos
  // and journey. The spotlight photo stays the pack's: only this look shows it.
  perLook: {
    "jewelry-luxe": {
      store: {
        name: L("بريق", "Bareeq"),
        description: L("إكسسوارات مطلية دهب بلمسة هادية، للبس كل يوم وللسهرة.", "Gold-tone jewelry with a quiet shine, for every day and evenings out."),
      },
      copy: {
        announcement: [
          L("قطع جديدة كل شهر", "New pieces every month"),
          L("الدفع عند الاستلام", "Cash on delivery"),
          L("تغليف هدية مع كل طلب", "Gift wrapping with every order"),
        ],
        labels: { about: L("عن بريق", "About Bareeq") },
        hero: {
          alt: L("حلق دهبي وانسيال رفيع على ترابيزة برتقالي في نور الشمس", "Gold earrings and a fine bracelet on a terracotta table in sunlight"),
          eyebrow: L("لمعة المسا", "Evening shine"),
          title: L("لمعة دهبي من غير تكلّف", "A gold glow, kept simple"),
          line: L(
            "سلاسل وحلقان وانسيالات وخواتم مطلية دهب، تكمّل لبس الشغل وتنوّر السهرة.",
            "Gold-plated necklaces, earrings, bracelets and rings that finish a work outfit and light up an evening.",
          ),
          cta: L("اكتشفي القطع", "Discover the pieces"),
        },
        categories: { title: L("اختاري على حسب القطعة", "Shop by piece") },
        products: {
          primary: {
            eyebrow: L("الأكثر طلبًا", "Most ordered"),
            title: L("القطع اللي بترجع تتطلب", "The pieces people reorder"),
            line: L("القطع اللي عميلاتنا بيرجعوا يطلبوها، لنفسهم أو هدية.", "The pieces our customers come back for, for themselves or as gifts."),
            cta: L("شوفي الكل", "See them all"),
          },
        },
        story: {
          alt: L("سلاسل دهبي متكوّمة على طبق بورسلين قديم", "Gold chains heaped on an old porcelain plate"),
          eyebrow: L("إزاي بنختار", "How we choose"),
          title: L("سلسلة واحدة، طرق كتير", "One chain, many ways to wear it"),
          text: L(
            "بنختار سلاسل تتلبس لوحدها أو فوق بعض، وبنكتب طول كل سلسلة بالسنتيمتر عشان تعرفي هتقع فين.",
            "We choose chains that work alone or layered, and list each length in centimetres so you know where it will sit.",
          ),
          cta: L("حكايتنا", "Our story"),
        },
        trust: [
          { title: L("قطع جديدة كل شهر", "New every month"), line: L("تشكيلة صغيرة بتتجدد", "A small range that keeps changing") },
          { title: L("طول السلسلة مكتوب", "Chain length listed"), line: L("بالسنتيمتر في كل صفحة", "In centimetres on every page") },
          { title: L("استبدال سهل", "Easy exchange"), line: L("خلال ١٤ يوم لو القطعة مالبستيهاش", "Within 14 days if the piece is unworn") },
          { title: L("تغليف هدية", "Gift wrapping"), line: L("مع كل طلب", "With every order") },
        ],
        newsletter: {
          title: L("قطعة جديدة كل شهر", "A new piece every month"),
          line: L("رسالة في أول كل شهر فيها القطع الجديدة وإزاي تنسّقيها.", "A letter at the start of each month with the new pieces and how to wear them."),
        },
        footer: { line: L("بريق: إكسسوارات مطلية دهب، للبس كل يوم وللسهرة.", "Bareeq: gold-plated jewelry for every day and evenings out.") },
        about: {
          line: L("إكسسوارات مطلية دهب بلمسة هادية.", "Gold-plated jewelry with a quiet shine."),
          alt: L("انسيال دهبي بحلقات عريضة على حجر رمادي جنب ورد توليب", "A chunky gold link bracelet on grey stone beside tulips"),
          eyebrow: L("عن بريق", "About Bareeq"),
          title: L("لمعة صغيرة تكفي", "A little shine is enough"),
          text: L(
            "بريق بدأ من علبة إكسسوار مليانة قطع بنحبها ومش بنلبسها. فبقينا نختار قطع بسيطة مطلية دهب عيار ١٨، تتلبس مع قميص الشغل زي ما تتلبس مع فستان السهرة.",
            "Bareeq began with a jewelry box full of pieces we loved but never wore. So we choose simple 18K gold-plated pieces that go with a work shirt as well as an evening dress.",
          ),
          more: L(
            "وصفحة كل قطعة بتقول خامتها بالظبط: ستانلس مطلي، فضة مطلية، كريستال أو لولي صناعي.",
            "And each page names the exact material: plated steel, plated silver, crystal or faux pearl.",
          ),
          cta: L("اكتشفي القطع", "Discover the pieces"),
        },
        contact: {
          title: L("كلّمينا", "Talk to us"),
          line: L(
            "عايزة تنسّقي سلاسل مع بعض؟ ابعتي لنا صورة لبسك ونقترح عليكي.",
            "Want to layer necklaces? Send us a photo of your outfit and we suggest a few.",
          ),
          heading: L("اسألي عن تنسيق أو عن طلبك", "Ask about styling or your order"),
        },
        faq: {
          line: L("العناية والخامات والتوصيل.", "Care, materials and delivery."),
          question: L("إزاي أحافظ على لمعة القطعة؟", "How do I keep a piece shining?"),
          answer: L(
            "اقلعيها قبل الدش والرياضة والبرفان، وامسحيها بقماشة ناعمة ناشفة، واحفظيها في الكيس بتاعها بعيد عن الرطوبة.",
            "Take it off before showering, exercise and perfume, wipe it with a soft dry cloth and keep it in its pouch away from damp.",
          ),
        },
      },
      // Pexels, checked by eye 2026-11-11 (no people, hands or lettering): warm gold on cream, blush and terracotta.
      photos: {
        hero: { wide: pexels(12320900, 1920), tall: pexels(19564918, 1200) },
        tiles: [pexels(34372550, 1200), pexels(28716777, 1200), pexels(12638300, 1200), pexels(11567607, 1200)],
        // Jewelry-luxe shows no banner; given so the two looks share no photo.
        banner: pexels(7232404, 1920),
        story: pexels(10816570, 1200),
        about: pexels(20559476, 1200),
      },
      // The spotlight shows the best sellers (karat's shelf opens on the newest).
      journey: { primary: "best-sellers" },
    },
  },
};
