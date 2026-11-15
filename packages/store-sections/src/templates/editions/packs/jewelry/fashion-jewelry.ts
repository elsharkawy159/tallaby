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
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene-<slot>` in the same bucket) now replace every Pexels photo
 * `zahra` draws: the hero, the four tiles, the story, the about page and the
 * anatomy photo (made so the four dots land on the clasp, the chain, the
 * crystals and the polishing cloth). Still Pexels, drawn by no look: hero
 * tall 9430468 and banner 11185142.
 *
 * Looks: `zahra` only (the niche's template, one template per niche; the
 * accessories switch, 2026-11-12, took `karat` and `jewelry-luxe` off). Four
 * products per category. No `reviews`: a pack holds no invented buyer quotes.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("fashion-jewelry", slug);
const scene = (slot: string) => editionPhoto("fashion-jewelry", `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  scene("tile-1"), // a coin necklace and a herringbone chain on white marble
  scene("tile-2"), // chunky gold hoops and pearl drops on white satin
  scene("tile-3"), // a paperclip chain, a pink beaded and a crystal tennis bracelet on a cloud dish
  scene("tile-4"), // a signet ring, a pearl ring and thin silver rings in a pearly dish
];

export const FASHION_JEWELRY: Edition = {
  niche: "fashion-jewelry",
  looks: ["zahra"],
  priceBand: { min: 250, max: 1500 },
  // Square packshots on pure white: a square white stage shows them whole, and every piece reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("حِلية", "Hilya"),
    description: L(
      "سلاسل وأقراط وأساور وخواتم بطلاء ذهبي وفضي، للاستخدام اليومي وللإهداء.",
      "Gold-tone and silver necklaces, earrings, bracelets and rings, for every day and for gifts.",
    ),
    categories: [
      ["necklaces", "سلاسل", "Necklaces", TILES[0]!],
      ["earrings", "أقراط", "Earrings", TILES[1]!],
      ["bracelets", "أساور", "Bracelets", TILES[2]!],
      ["rings", "خواتم", "Rings", TILES[3]!],
    ],
    // Newest first.
    products: [
      ["gold-coin-layered-necklace", "necklaces", "سلسلة ذهبية بطبقتين ودلاية عملة", "Gold Layered Coin Necklace", shot("gold-coin-layered-necklace"), 650, { isFeatured: true, rating: 4.8, sold90: 212 }],
      ["gold-hoop-earrings", "earrings", "قرط دائري ذهبي عريض", "Chunky Gold Hoop Earrings", shot("gold-hoop-earrings"), 380, { isFeatured: true, rating: 4.9, sold90: 318 }],
      ["gold-chain-bracelet", "bracelets", "سوار ذهبي بحلقات مستطيلة", "Gold Paperclip Chain Bracelet", shot("gold-chain-bracelet"), 450, { isFeatured: true, rating: 4.7, sold90: 176 }],
      ["gold-signet-ring", "rings", "خاتم ختم ذهبي", "Gold Signet Ring", shot("gold-signet-ring"), 350, { rating: 4.6, sold90: 143 }],
      ["pearl-pendant-necklace", "necklaces", "سلسلة رفيعة بدلاية لؤلؤ", "Pearl Pendant Necklace", shot("pearl-pendant-necklace"), 480, { rating: 4.8, sold90: 167 }],
      ["pearl-drop-earrings", "earrings", "قرط لؤلؤ متدلٍّ", "Pearl Drop Earrings", shot("pearl-drop-earrings"), 340, { rating: 4.7, sold90: 189 }],
      ["beaded-charm-bracelet", "bracelets", "سوار خرز وردي بدلاية ذهبية", "Pink Beaded Charm Bracelet", shot("beaded-charm-bracelet"), 290, { rating: 4.6, sold90: 154 }],
      ["pearl-cocktail-ring", "rings", "خاتم كوكتيل باللؤلؤ", "Pearl Cocktail Ring", shot("pearl-cocktail-ring"), 390, { rating: 4.5, sold90: 88 }],
      ["gold-herringbone-necklace", "necklaces", "سلسلة ذهبية بنقشة متعرجة", "Gold Herringbone Necklace", shot("gold-herringbone-necklace"), 720, { compareAtPrice: 850, rating: 4.7, sold90: 121 }],
      ["crystal-stud-earrings", "earrings", "قرط كريستال صغير", "Crystal Stud Earrings", shot("crystal-stud-earrings"), 260, { rating: 4.8, sold90: 274 }],
      ["silver-cuff-bracelet", "bracelets", "سوار فضي مفتوح", "Silver Cuff Bracelet", shot("silver-cuff-bracelet"), 520, { rating: 4.6, sold90: 97 }],
      ["crystal-solitaire-ring", "rings", "خاتم بفص كريستال واحد", "Crystal Solitaire Ring", shot("crystal-solitaire-ring"), 420, { compareAtPrice: 490, rating: 4.7, sold90: 158 }],
      ["silver-heart-pendant-necklace", "necklaces", "سلسلة فضية بدلاية قلب", "Silver Heart Pendant Necklace", shot("silver-heart-pendant-necklace"), 420, { rating: 4.8, sold90: 201 }],
      ["silver-chain-drop-earrings", "earrings", "قرط سلسلة فضي طويل", "Silver Chain Drop Earrings", shot("silver-chain-drop-earrings"), 320, { rating: 4.5, sold90: 112 }],
      ["gold-tennis-bracelet", "bracelets", "سوار تنس ذهبي بالكريستال", "Gold Crystal Tennis Bracelet", shot("gold-tennis-bracelet"), 890, { compareAtPrice: 1050, rating: 4.7, sold90: 134 }],
      ["stackable-silver-rings", "rings", "طقم خواتم فضية متراكبة", "Stackable Silver Rings Set", shot("stackable-silver-rings"), 360, { rating: 4.6, sold90: 186 }],
    ],
  }),
  photos: {
    // Gold-tone rings, a layered coin necklace and pearl drops on blush plaster (the wide one); the tall one, drawn by no look, is Pexels.
    hero: { wide: scene("hero-wide"), tall: pexels(9430468, 1200) },
    tiles: TILES,
    // Five stone-bead bracelets on white painted boards (a calm field for copy).
    banner: pexels(11185142, 1920),
    // A blush gift box tied with dusty-rose ribbon, a petrol velvet ring box and ribbon spools on linen (the gift wrapping story).
    story: scene("story"),
    // Silver and gold rings and a fine chain around a shell on blush (landscape, the about page).
    about: scene("about"),
    // `zahra`: one piece with four note dots (not shop the look), in percent from the photo's left and top on its 4:5 crop: the plating, the chain, the stones, care.
    look: {
      src: scene("anatomy"),
      dots: [
        { x: 51, y: 27 },
        { x: 35, y: 43 },
        { x: 60, y: 66 },
        { x: 46, y: 70 },
      ],
    },
  },
  copy: {
    announcement: [
      L("سلاسل وأقراط وأساور وخواتم", "Necklaces, earrings, bracelets and rings"),
      L("خامة كل قطعة مذكورة في صفحتها", "Every piece's material on its page"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("عن حِلية", "About Hilya"), search: L("ابحث عن قطعة", "Search for a piece") },
    hero: {
      alt: L("خواتم ذهبية وسلسلة عملات وقرط لؤلؤ على خلفية وردية", "Gold-tone rings, a coin necklace and pearl drops on blush plaster"),
      eyebrow: L("وصل حديثًا", "Just landed"),
      title: L("إكسسوارات بطلاء ذهبي وفضي", "Gold-tone and silver jewelry"),
      line: L(
        "سلاسل وأقراط وأساور وخواتم للاستخدام اليومي أو للإهداء.",
        "Necklaces, earrings, bracelets and rings to wear every day or to give.",
      ),
      cta: L("تصفّح الجديد", "See what's new"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        eyebrow: L("اختياراتنا", "Our favourites"),
        title: L("القطع الأكثر طلبًا", "Our most-ordered pieces"),
        line: L(
          "سلسلة العملة بطبقتين والقرط الذهبي العريض والسوار بالحلقات المستطيلة: تُلبس معًا أو كل قطعة وحدها.",
          "The layered coin necklace, the chunky gold hoops and the paperclip bracelet: wear them together or one at a time.",
        ),
        cta: L("كل الأكثر طلبًا", "All best sellers"),
      },
    },
    story: {
      alt: L("علبة هدية بشريطة وردية وعلبة خاتم مخملية وبكرات شرائط على قماش", "A gift box with a pink ribbon, a velvet ring box and ribbon spools on linen"),
      eyebrow: L("تفاصيل كل قطعة", "Every detail"),
      title: L("القفل واللحام واللمعة", "Clasp, joins and shine"),
      text: L(
        "نذكر في صفحة كل قطعة خامتها وطولها ونوع قفلها.",
        "Each piece's page lists its material, length and clasp.",
      ),
      cta: L("تعرّف علينا", "Read our story"),
    },
    // `zahra`: the heading over the anatomy photo (its notes are `custom.anatomy-N-*`).
    look: {
      alt: L("سلسلة ذهبية بفصوص كريستال على حجر أمام لفّة ورق وردي", "A gold-tone crystal necklace on a pale stone before a roll of pink paper"),
      eyebrow: L("من قريب", "Up close"),
      title: L("تعرّف على القطعة قبل شرائها", "Know the piece before you buy"),
      text: L("اضغط على أي نقطة في الصورة لترى خامتها وطولها وطريقة العناية بها.", "Tap a dot on the photo for its material, its length and how to care for it."),
    },
    trust: [
      { title: L("خامات مذكورة", "Materials listed"), line: L("لكل قطعة خامتها وطولها", "Material and length for every piece") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("سلاسل وأقراط وأساور وخواتم", "Necklaces, earrings, bracelets and rings") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على القطع الجديدة أولًا", "Hear about new pieces first"),
      line: L(
        "رسالة كل أسبوعين: القطع الجديدة وأفكار لتنسيق السلاسل والخواتم معًا.",
        "One letter every two weeks: new pieces and ideas for layering necklaces and stacking rings.",
      ),
      note: L("بدون رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: {
      line: L(
        "إكسسوارات بطلاء ذهبي وفضي بأسعار مناسبة.",
        "Gold-tone and silver fashion jewelry at friendly prices.",
      ),
    },
    about: {
      line: L("إكسسوارات للاستخدام اليومي بأسعار مناسبة.", "Jewelry to wear every day, at sensible prices."),
      alt: L("خواتم فضية وذهبية وسلسلة حول صدفة على ورق وردي", "Silver and gold rings and a chain around a shell on blush paper"),
      eyebrow: L("من نحن", "Who we are"),
      title: L("قطع صغيرة بتفاصيل أنيقة", "Small pieces, fine details"),
      text: L(
        "حِلية متجر للإكسسوارات. نختار الستانلس ستيل بطلاء ذهب عيار ١٨ والمعادن بطلاء فضي، ونذكر خامة كل قطعة في صفحتها.",
        "Hilya sells fashion jewelry. We choose 18K gold-plated stainless steel and silver-plated metal, and name each piece's material on its page.",
      ),
      more: L(
        "ولا نسمّي قطعة ذهبًا أو ألماسًا وهي ليست كذلك: الكريستال كريستال، واللؤلؤ طبيعي أو صناعي، ومذكور في صفحة كل قطعة.",
        "And we never call anything gold or diamond when it is not: crystal is crystal, pearls are freshwater-style or faux, and each product page says which.",
      ),
      cta: L("تصفّح الجديد", "See what's new"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(
        "تبحث عن هدية؟ اسألنا عن أي قطعة أو عن طلبك.",
        "Looking for a gift? Ask us about any piece or your order.",
      ),
      heading: L("اسأل عن هدية أو عن طلبك", "Ask about a gift or your order"),
    },
    faq: {
      line: L("الخامات والعناية وطريقة الطلب.", "Materials, care and ordering."),
      question: L("هل هذه القطع من الذهب والفضة الحقيقيين؟", "Is this real gold and silver?"),
      answer: L(
        "لا، هذه إكسسوارات: ستانلس ستيل بطلاء ذهب عيار ١٨ أو معدن بطلاء فضي، والكريستال ليس ألماسًا. وللحفاظ على لمعتها، انزعها قبل الاستحمام واستخدام العطر واحفظها في كيسها.",
        "No, this is fashion jewelry: 18K gold-plated stainless steel or silver-plated metal, and the crystals are not diamonds. To keep the shine, take it off before showering or spraying perfume and keep it in its pouch.",
      ),
    },
    custom: {
      // `zahra`: the header's link to the whole catalog.
      "shop-all": L("كل الإكسسوارات", "All jewelry"),
      // `zahra`: the noun after a category's product count.
      "products-noun": L("قطعة", "pieces"),
      // `zahra`: the four anatomy notes, in the order of `photos.look.dots` (a title of one or two words, one line each).
      "anatomy-1-title": L("الطلاء", "The plating"),
      "anatomy-1-line": L("ستانلس ستيل بطلاء ذهب عيار ١٨.", "18K gold plating over stainless steel."),
      "anatomy-2-title": L("السلسلة", "The chain"),
      "anatomy-2-line": L("طولها ٤٢ سم مع وصلة ٥ سم وقفل لوبستر سهل الإغلاق.", "42 cm with a 5 cm extender and an easy lobster clasp."),
      "anatomy-3-title": L("الفصوص", "The stones"),
      "anatomy-3-line": L("كريستال مقصوص يلمع، ولا نسمّيه ألماسًا.", "Cut crystal that catches the light, and we never call it diamond."),
      "anatomy-4-title": L("العناية", "Care"),
      "anatomy-4-line": L("انزعها قبل الاستحمام واستخدام العطر، وامسحها بقطعة قماش جافة واحفظها في كيسها.", "Take it off before showering or perfume, wipe it dry and keep it in its pouch."),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("تُلبس معها", "Wear it with") } },
};
