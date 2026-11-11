/**
 * The hair accessories pack (niche editions, ROADMAP F-90): a playful,
 * gift-friendly hair shop, "Fyonka" (Egyptian for a bow). Claw clips,
 * scrunchies, headbands and pins at pocket-money prices. Honest materials:
 * resin claw clips (tortoise is a print, not shell), satin, velvet and
 * cotton scrunchies, faux pearls, crystals (not diamonds) and gold-tone
 * metal. Data only; the looks draw it.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("hair-accessories", <slug>)`), square, one each.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * clips, scrunchies, ribbons and pearls on pastel paper, fur, sand and
 * linen; no people, hair on heads, hands or other body parts, no logos or
 * lettering, none used by a template or another pack, none twice. Hero
 * 8468179 (wide: pastel snap clips scattered on white, peach and pink paper)
 * and 4515450 (tall: pearl hair pins, peonies and a glass jewelry box).
 * Tiles: claw clips 20166053 (an amber claw clip on white fur), scrunchies
 * 6044137 (satin scrunchies on a round linen box with limonium), headbands
 * 27592172 (a fluffy teddy headband on butter yellow), pins and barrettes
 * 9750766 (a mother-of-pearl hair slide on blush sand). Banner 15130427
 * (three spools of silk ribbon beside a white rose, a calm grey field).
 * Story 30056548 (a cream satin bow on white paper). About 4491555 (a
 * flower crown on gold polka-dot gift paper, white space to the right).
 * `karat` lookbook 9093777, 33343186, 37801583, 35993344, 19457054; story
 * rings 7123092, 9428776, 23440285, 19507872.
 *
 * Left out after the check: 6983530 (a brand mark on the glasses case),
 * 18031831 (a lip tint label), 18017909 (a supplement label), 30988733,
 * 34976482 and 10279606 (magazine and book text), 37420551 (a brand card
 * behind the bows), 36553497 (a perfume label), 34076070, 25355735,
 * 15392698 and 32390801 (cosmetics and pillow lettering), 5492871 (a card
 * and a photo of a person), 10605234 (a photo of a person in a frame),
 * 12352240 (a printed diary), 37801575 (printed pages), 36755056 (a book
 * spine), 25864738 (engraved names), 39231684 (a printed card, dark),
 * 5486793 (a label on a spool), 8084058 (a watch face), 33343184 (a clip
 * shaped like a cartoon mouse), 36625574 (gloves read as hands),
 * 29908760 (too dark for this look), 7123108 (the shoot of a bow photo a
 * template uses), 6044139, 7123123 and 7123100 (second frames of photos
 * used here). Unavailable on Pexels: 7153787, 37801577, 39082782.
 * Already used by a template: 20166054, 20166056, 8468177, 7123549,
 * 18421514, 31854724.
 *
 * Looks: `kholkhal`, the niche's template (one template per niche, ROADMAP
 * F-90): its default content and demo are this pack, so the template and the
 * edition are one shop. `karat` still draws the pack until the accessories
 * switch takes it off (`distinct.test.ts` lists the niche as pending). No
 * `reviews`: a pack holds no invented buyer quotes, and without them `karat`
 * leaves its reviews section out.
 *
 * Kholkhal's own photos (2026-11-11, checked by eye, none used elsewhere):
 * hero slides 2 and 3, 20178660 (a gold shell claw clip on a white knit in
 * window light) and 31702117 (embroidered snap clips on white). Left out:
 * 13455596 (shop cards with a brand name on the bows), 31854721 (lettering on
 * a soap), 40888671 (a bottle label behind the clip), 19832003 (a second bow
 * beside the story's), 8100399 and 37472875 (bridal pins, too dark or too
 * formal for the shop), 30284737 (a handbag takes the frame).
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("hair-accessories", slug);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(20166053, 1200), // an amber claw clip on white fur
  pexels(6044137, 1200), // satin scrunchies on a round linen box with limonium
  pexels(27592172, 1200), // a fluffy teddy headband on butter yellow
  pexels(9750766, 1200), // a mother-of-pearl hair slide on blush sand
];

export const HAIR_ACCESSORIES: Edition = {
  niche: "hair-accessories",
  looks: ["kholkhal", "karat"],
  priceBand: { min: 60, max: 450 },
  // Square packshots on pure white: a square white stage shows them whole, and every piece reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("فيونكة", "Fyonka"),
    description: L(
      "توك وسكرانشي وتوكات راس وبنس للشعر، للبس كل يوم وللهدايا.",
      "Claw clips, scrunchies, headbands and hair pins, for every day and for gifts.",
    ),
    categories: [
      ["claw-clips", "توك كلبس", "Claw clips", TILES[0]!],
      ["scrunchies", "سكرانشي", "Scrunchies", TILES[1]!],
      ["headbands", "توكات راس", "Headbands", TILES[2]!],
      ["pins-barrettes", "بنس وتوك صغيرة", "Pins & barrettes", TILES[3]!],
    ],
    // Newest first (the `karat` shelf's first tab).
    products: [
      ["tortoise-claw-clip", "claw-clips", "توكة كلبس تورتواز كبيرة", "Large Tortoise Claw Clip", shot("tortoise-claw-clip"), 180, { isFeatured: true, rating: 4.9, sold90: 342 }],
      ["silk-scrunchie-set", "scrunchies", "طقم ٣ سكرانشي ساتان (أوف وايت وروز وشمبانيا)", "Satin Scrunchie Set of 3 (Ivory, Blush, Champagne)", shot("silk-scrunchie-set"), 240, { isFeatured: true, rating: 4.8, sold90: 296 }],
      ["padded-black-headband", "headbands", "توكة راس قطيفة سودا منفوخة", "Padded Black Velvet Headband", shot("padded-black-headband"), 260, { isFeatured: true, compareAtPrice: 320, rating: 4.7, sold90: 188 }],
      ["pearl-barrette", "pins-barrettes", "توكة بنسة باللولي", "Pearl Barrette", shot("pearl-barrette"), 190, { rating: 4.8, sold90: 214 }],
      ["black-matte-claw-clip", "claw-clips", "توكة كلبس سودا مط", "Matte Black Claw Clip", shot("black-matte-claw-clip"), 150, { rating: 4.7, sold90: 268 }],
      ["velvet-scrunchie-set", "scrunchies", "طقم ٣ سكرانشي قطيفة (أسود ونبيتي وأخضر)", "Velvet Scrunchie Set of 3 (Black, Burgundy, Green)", shot("velvet-scrunchie-set"), 210, { rating: 4.7, sold90: 173 }],
      ["pearl-headband", "headbands", "توكة راس باللولي", "Pearl Headband", shot("pearl-headband"), 340, { rating: 4.8, sold90: 156 }],
      ["black-bow-barrette", "pins-barrettes", "توكة فيونكة ساتان سودا", "Black Satin Bow Barrette", shot("black-bow-barrette"), 170, { rating: 4.6, sold90: 191 }],
      ["cream-claw-clip", "claw-clips", "توكة كلبس كريمي", "Cream Claw Clip", shot("cream-claw-clip"), 160, { rating: 4.6, sold90: 147 }],
      ["satin-bow-scrunchie", "scrunchies", "سكرانشي ساتان بفيونكة بمبي", "Pink Satin Bow Scrunchie", shot("satin-bow-scrunchie"), 130, { rating: 4.8, sold90: 233 }],
      ["knotted-satin-headband", "headbands", "توكة راس ساتان بعقدة شمبانيا", "Champagne Knotted Satin Headband", shot("knotted-satin-headband"), 240, { rating: 4.6, sold90: 129 }],
      ["gold-hair-pins-set", "pins-barrettes", "طقم بنس شعر دهبي", "Gold-Tone Hair Pin Set", shot("gold-hair-pins-set"), 120, { rating: 4.5, sold90: 205 }],
      ["pearl-mini-claw-clips", "claw-clips", "طقم ٤ توك كلبس صغيرة باللولي", "Pearl Mini Claw Clips, Set of 4", shot("pearl-mini-claw-clips"), 220, { rating: 4.7, sold90: 162 }],
      ["cotton-scrunchie-pack", "scrunchies", "باكيت ٥ سكرانشي قطن بألوان هادية", "Cotton Scrunchie Pack of 5 (Neutrals)", shot("cotton-scrunchie-pack"), 160, { rating: 4.6, sold90: 251 }],
      ["tortoise-thin-headband", "headbands", "توكة راس رفيعة تورتواز", "Thin Tortoise Headband", shot("tortoise-thin-headband"), 140, { rating: 4.5, sold90: 118 }],
      ["crystal-hair-slides", "pins-barrettes", "جوز توك كريستال", "Crystal Hair Slides, Pair", shot("crystal-hair-slides"), 230, { compareAtPrice: 280, rating: 4.7, sold90: 137 }],
    ],
  }),
  photos: {
    // Pastel snap clips scattered on white, peach and pink paper (wide), pearl hair pins and peonies (tall).
    hero: { wide: pexels(8468179, 1920), tall: pexels(4515450, 1200) },
    tiles: TILES,
    // Three spools of silk ribbon beside a white rose, a calm grey field.
    banner: pexels(15130427, 1920),
    // A cream satin bow on white paper (the gift wrapping story).
    story: pexels(30056548, 1200),
    // A flower crown on gold polka-dot gift paper (landscape, the about page).
    about: pexels(4491555, 1200),
    custom: {
      // `kholkhal`: the hero carousel's second and third slides (wide, cropped tall on phones; subject centred).
      "hero-2": pexels(20178660, 1920), // a gold shell claw clip on a white knit in window light
      "hero-3": pexels(31702117, 1920), // embroidered snap clips laid in two rows on white
      // `karat` lookbook, square: one large photo, then four small ones (subjects centred: the bento crops to the middle).
      "lookbook-1": pexels(9093777, 1200), // a lilac daisy scrunchie beside a cup of daisies on white
      "lookbook-2": pexels(33343186, 900), // cream and beige claw clips with white pebbles
      "lookbook-3": pexels(37801583, 900), // a pearl bracelet and peach ribbon on a pink plate
      "lookbook-4": pexels(35993344, 900), // a tangle of pink satin ribbon
      "lookbook-5": pexels(19457054, 900), // ivory satin ribbon and a bow on a wooden table
      // `karat` story rings 5 to 8 (rings 1 to 4 show the category tiles).
      "stories-5": pexels(7123092, 900), // pink crepe ribbon, pompoms and gift bows
      "stories-6": pexels(9428776, 900), // pearl strands and white coral on linen
      "stories-7": pexels(23440285, 900), // a pile of champagne silk ribbon
      "stories-8": pexels(19507872, 900), // gold and pink gift bows on white
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("كل طلب بيوصل في كيس صغير بفيونكة، جاهز للهدية", "Every order arrives in a little bow-tied pouch, ready to gift"),
    ],
    labels: { about: L("عن فيونكة", "About Fyonka"), search: L("دوّري على توكة أو سكرانشي", "Search clips and scrunchies") },
    hero: {
      alt: L("توك شعر صغيرة بألوان باستيل على ورق أبيض وخوخي وبمبي", "Pastel snap clips scattered on white, peach and pink paper"),
      eyebrow: L("وصل جديد", "Just landed"),
      title: L("توك وسكرانشي لكل يوم", "Clips and scrunchies for every day"),
      line: L(
        "توك كلبس وسكرانشي وتوكات راس وبنس بألوان حلوة، تلمّي بيها شعرك في ثانية أو تهاديها لصاحبتك.",
        "Claw clips, scrunchies, headbands and pins in pretty colours, to put your hair up in a second or to give to your best friend.",
      ),
      cta: L("شوفي الجديد", "See what's new"),
    },
    categories: { title: L("اختاري توكتك", "Pick your clip") },
    products: {
      primary: {
        alt: L("توك كلبس ولولي وسكرانشي ساتان", "Claw clips, pearls and satin scrunchies"),
        eyebrow: L("المفضلين عندنا", "Our favourites"),
        // Read over the shelf tabs (`karat`), so it names no number.
        title: L("اللي البنات بيطلبوه تاني وتالت", "The ones girls keep coming back for"),
        line: L(
          "الكلبس التورتواز الكبير، وطقم السكرانشي الساتان، وتوكة الراس القطيفة: تلاتة يمشوا مع أي لبس.",
          "The big tortoise claw clip, the satin scrunchie set and the velvet headband: three that go with anything.",
        ),
        cta: L("كل الأكثر طلبًا", "All best sellers"),
      },
    },
    story: {
      alt: L("فيونكة ساتان كريمي على ورق أبيض", "A cream satin bow on white paper"),
      eyebrow: L("جاهزة للهدية", "Ready to gift"),
      title: L("كل طلب بيتغلف بفيونكة", "Every order is tied with a bow"),
      text: L(
        "بنجرب كل توكة قبل ما تتشحن: السوستة بتقفل كويس، والأطراف ناعمة ومش بتشد الشعر.",
        "We test every clip before it ships: the spring closes firmly and the edges are smooth, so nothing pulls your hair.",
      ),
      cta: L("اعرفي حكايتنا", "Read our story"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("لأي محافظة في مصر", "To any governorate in Egypt") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفعي لما الطلب يوصلك", "Pay when your order arrives") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("خلال ١٤ يوم لو القطعة مستعملتيهاش", "Within 14 days if the piece is unused") },
      { title: L("تغليف هدية", "Gift wrapping"), line: L("كيس بفيونكة وكارت مع كل طلب", "A bow-tied pouch and a card with every order") },
    ],
    newsletter: {
      title: L("أول ما ينزل جديد هتعرفي", "Hear about new pieces first"),
      line: L(
        "رسالة كل أسبوعين: الألوان الجديدة وأفكار تسريحات سريعة بالتوك والسكرانشي.",
        "One letter every two weeks: new colours and quick hairstyle ideas with clips and scrunchies.",
      ),
      note: L("من غير رسايل كتير. تقدري تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: {
      line: L(
        "إكسسوارات شعر بألوان حلوة وأسعار في المتناول، متغلفة وجاهزة للهدية، وبتوصلك لحد البيت.",
        "Pretty hair accessories at friendly prices, wrapped and ready to gift, delivered to your door.",
      ),
    },
    about: {
      line: L("توكة حلوة تفرق في يومك، من غير ما تفكري في السعر.", "A pretty clip can make your day, without thinking twice about the price."),
      alt: L("تاج ورد على ورق هدايا أبيض بنقط دهبي", "A flower crown on white gift paper with gold dots"),
      eyebrow: L("مين إحنا", "Who we are"),
      title: L("بدأت بفيونكة واحدة", "It started with one bow"),
      text: L(
        "بدأنا فيونكة عشان نلاقي توك وسكرانشي شكلها حلو ومتينة وسعرها معقول. بنختار كل قطعة بنفسنا ونجربها على الشعر الخفيف والتقيل قبل ما ننزلها.",
        "We started Fyonka to find clips and scrunchies that look lovely, last, and cost a sensible amount. We choose every piece ourselves and try it on fine and thick hair before we list it.",
      ),
      more: L(
        "وبنقول على كل حاجة اسمها الحقيقي: التورتواز نقشة على ريزن، واللولي صناعي، والكريستال مش ألماظ، والبنس معدن بلون دهبي. ومكتوب في صفحة كل قطعة.",
        "And we call everything by its real name: tortoise is a print on resin, the pearls are faux, the crystals are not diamonds, and the pins are gold-tone metal. Each product page says which.",
      ),
      cta: L("شوفي الجديد", "See what's new"),
    },
    contact: {
      title: L("كلّمينا", "Talk to us"),
      line: L(
        "محتارة في مقاس الكلبس أو عايزة هدية؟ قولي لنا نوع شعرك أو الميزانية ونرشح لك.",
        "Not sure which clip size suits you, or looking for a gift? Tell us your hair type or your budget and we suggest a few pieces.",
      ),
      heading: L("اسألي عن توكة أو عن طلبك", "Ask about a clip or your order"),
    },
    faq: {
      line: L("المقاسات والخامات والتوصيل.", "Sizes, materials and delivery."),
      question: L("أختار مقاس الكلبس إزاي؟", "Which claw clip size should I choose?"),
      answer: L(
        "لو شعرك تقيل أو طويل خدي الكلبس الكبير، ولو خفيف أو قصير الصغير هيمسكه أحسن. والسكرانشي مفيهوش معدن، فمش بيكسر الشعر ولا بيعمل علامة.",
        "For thick or long hair, take the large claw clip; for fine or short hair, the small ones hold better. Our scrunchies have no metal parts, so they do not snap hair or leave a dent.",
      ),
    },
    // `kholkhal`: slide 2's button, and the button of the scrunchie campaign beside its row.
    nav: [
      { label: L("تسوقي الكلبس", "Shop claw clips"), href: `/products?search=${encodeURIComponent("كلبس")}` },
      { label: L("تسوقي السكرانشي", "Shop scrunchies"), href: `/products?search=${encodeURIComponent("سكرانشي")}` },
    ],
    // `kholkhal`: "shop by hair type", three ready-made searches; each option is the item, its search, and `custom.finder-N-for` / `-under`.
    finder: {
      title: L("قولي لنا شعرك عامل إزاي", "Tell us about your hair"),
      line: L("كل جملة بتفتح التوك اللي تناسبها.", "Each sentence opens the pieces that suit it."),
      options: [
        { label: L("كلبس كبير", "a big claw clip"), href: `/products?search=${encodeURIComponent("كلبس")}` },
        { label: L("سكرانشي ساتان", "a satin scrunchie"), href: `/products?search=${encodeURIComponent("سكرانشي")}` },
        { label: L("بنس صغيرة", "small pins"), href: `/products?search=${encodeURIComponent("بنس")}` },
      ],
    },
    custom: {
      // `kholkhal`: the story's second paragraph (one sentence, after `story.text`).
      "story-more": L(
        "وبعدين بنحطها في كيس صغير ونربطه بفيونكة، ولو هدية اكتبي لنا الإهداء ونكتبه على كارت.",
        "Then it goes into a little pouch tied with a bow, and if it is a gift, send us your message and we write it on a card.",
      ),
      // `kholkhal`: hero slides 2 and 3 (`photos.custom.hero-2`, `-3`). Titles of at most 6 words; slide 2's button is `nav.0`, slide 3's opens the shop from the lowest price.
      "hero-2-alt": L("توكة كلبس دهبي على شكل صدفة فوق بلوفر أبيض", "A gold shell claw clip on a white knit"),
      "hero-2-eyebrow": L("كلبس بكل المقاسات", "Claw clips in every size"),
      "hero-2-title": L("شعرك فوق في ثانية", "Hair up in a second"),
      "hero-2-line": L("كلبس يمسك الشعر التقيل من غير ما يوجع، وصغير للشعر الخفيف.", "Claw clips that hold thick hair without pinching, and small ones for fine hair."),
      "hero-3-alt": L("توك صغيرة متطرزة بورد على خلفية بيضا", "Embroidered snap clips on white"),
      "hero-3-eyebrow": L("هدية صغيرة", "A little gift"),
      "hero-3-title": L("هدايا تحت ٢٥٠ جنيه", "Gifts under EGP 250"),
      "hero-3-line": L("توك وبنس تتهادى في أي مناسبة، وكلها بتتغلف بفيونكة.", "Clips and pins to give for any occasion, each one wrapped with a bow."),
      "hero-3-cta": L("تسوقي الهدايا", "Shop gifts"),
      // `kholkhal`: the finder's three sentences, after each option's item ("for …", "under …"). Prices are true of the catalog.
      "finder-1-for": L("شعر تقيل", "thick hair"),
      "finder-1-under": L("٢٥٠ جنيه", "EGP 250"),
      "finder-2-for": L("شعر كيرلي", "curly hair"),
      "finder-2-under": L("٢٥٠ جنيه", "EGP 250"),
      "finder-3-for": L("شعر خفيف", "fine hair"),
      "finder-3-under": L("٢٠٠ جنيه", "EGP 200"),
      // `kholkhal`: the campaign beside the scrunchie row, on `photos.banner` (landscape on desktop, tall on phones).
      "banner-alt": L("تلات بكر شريط حرير جنب وردة بيضا", "Three spools of silk ribbon beside a white rose"),
      "banner-eyebrow": L("ساتان وقطيفة وقطن", "Satin, velvet and cotton"),
      "banner-title": L("سكرانشي مش بيشد الشعر", "Scrunchies that never pull"),
      "banner-line": L("من غير معدن، فمش بيكسر الشعر ولا بيعمل علامة.", "No metal parts, so they never snap hair or leave a dent."),
      // `karat`: the store's short name inside a sentence.
      "store-short": L("فيونكة", "Fyonka"),
      // `karat`: the hero's small line and its round sticker (a price point, not an offer).
      "hero-note": L("ألوان الموسم", "This season's colours"),
      "hero-sticker-1": L("هدايا تحت", "Gifts under"),
      "hero-sticker-2": L("٢٥٠", "250"),
      "hero-sticker-3": L("جنيه", "EGP"),
      // `karat`: the eight story rings. 1 to 4 show the category tiles, in the categories' order.
      "stories-1": L("كلبس", "Claw clips"),
      "stories-2": L("سكرانشي", "Scrunchies"),
      "stories-3": L("توكات راس", "Headbands"),
      "stories-4": L("بنس", "Pins"),
      "stories-5": L("بمبي", "Pink"),
      "stories-6": L("لولي", "Pearls"),
      "stories-7": L("ساتان", "Satin"),
      "stories-8": L("هدايا", "Gifts"),
      // `karat`: the lookbook's brand tile. No invented handle: the seller's own replaces it.
      "lookbook-handle": L("فيونكة على إنستجرام", "Fyonka on Instagram"),
      "lookbook-line": L("تسريحات سريعة جديدة كل أسبوع", "New quick hairstyles every week"),
    },
  },
  productPage: { copy: { reviews: L("قالوا إيه عن التوكة دي", "What buyers say"), related: L("تتلبس معاها", "Wear it with") } },
};
