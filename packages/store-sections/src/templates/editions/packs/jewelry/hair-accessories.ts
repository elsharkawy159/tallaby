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
 * Generated photos (2026-11-15, `docs/systems/editions-photos.md`, checked
 * by eye; `scene-<slot>` in the same bucket) now replace every Pexels photo
 * `kholkhal` draws: the three hero slides, the four tiles, the banner, the
 * story and the about page. Still Pexels, drawn by no look: hero tall
 * 4515450.
 *
 * Looks: `kholkhal`, the niche's template (one template per niche, ROADMAP
 * F-90): its default content and demo are this pack, so the template and the
 * edition are one shop. It is the pack's only look (the accessories switch,
 * 2026-11-12, took `karat` off). No `reviews`: a pack holds no invented
 * buyer quotes.
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
const scene = (slot: string) => editionPhoto("hair-accessories", `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  scene("tile-1"), // an amber tortoise claw clip on white faux fur
  scene("tile-2"), // ivory, blush and champagne satin scrunchies stacked on a round lilac box
  scene("tile-3"), // a padded black velvet headband and a pearl headband on butter yellow
  scene("tile-4"), // a pearl barrette, a black bow barrette and crystal slides on blush sand
];

export const HAIR_ACCESSORIES: Edition = {
  niche: "hair-accessories",
  looks: ["kholkhal"],
  priceBand: { min: 60, max: 450 },
  // Square packshots on pure white: a square white stage shows them whole, and every piece reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("فيونكة", "Fyonka"),
    description: L(
      "توك وسكرانشي وأطواق وبنس للشعر، للاستخدام اليومي وللإهداء.",
      "Claw clips, scrunchies, headbands and hair pins, for every day and for gifts.",
    ),
    categories: [
      ["claw-clips", "توك كلبس", "Claw clips", TILES[0]!],
      ["scrunchies", "سكرانشي", "Scrunchies", TILES[1]!],
      ["headbands", "أطواق الشعر", "Headbands", TILES[2]!],
      ["pins-barrettes", "بنس وتوك صغيرة", "Pins & barrettes", TILES[3]!],
    ],
    // Newest first.
    products: [
      ["tortoise-claw-clip", "claw-clips", "توكة كلبس كبيرة بنقشة الصدف", "Large Tortoise Claw Clip", shot("tortoise-claw-clip"), 180, { isFeatured: true, rating: 4.9, sold90: 342 }],
      ["silk-scrunchie-set", "scrunchies", "طقم ٣ سكرانشي ساتان (عاجي ووردي وشمبانيا)", "Satin Scrunchie Set of 3 (Ivory, Blush, Champagne)", shot("silk-scrunchie-set"), 240, { isFeatured: true, rating: 4.8, sold90: 296 }],
      ["padded-black-headband", "headbands", "طوق شعر مخمل أسود منفوخ", "Padded Black Velvet Headband", shot("padded-black-headband"), 260, { isFeatured: true, compareAtPrice: 320, rating: 4.7, sold90: 188 }],
      ["pearl-barrette", "pins-barrettes", "توكة بنسة باللؤلؤ", "Pearl Barrette", shot("pearl-barrette"), 190, { rating: 4.8, sold90: 214 }],
      ["black-matte-claw-clip", "claw-clips", "توكة كلبس سوداء غير لامعة", "Matte Black Claw Clip", shot("black-matte-claw-clip"), 150, { rating: 4.7, sold90: 268 }],
      ["velvet-scrunchie-set", "scrunchies", "طقم ٣ سكرانشي مخمل (أسود وخمري وأخضر)", "Velvet Scrunchie Set of 3 (Black, Burgundy, Green)", shot("velvet-scrunchie-set"), 210, { rating: 4.7, sold90: 173 }],
      ["pearl-headband", "headbands", "طوق شعر باللؤلؤ", "Pearl Headband", shot("pearl-headband"), 340, { rating: 4.8, sold90: 156 }],
      ["black-bow-barrette", "pins-barrettes", "توكة فيونكة ساتان سوداء", "Black Satin Bow Barrette", shot("black-bow-barrette"), 170, { rating: 4.6, sold90: 191 }],
      ["cream-claw-clip", "claw-clips", "توكة كلبس كريمي", "Cream Claw Clip", shot("cream-claw-clip"), 160, { rating: 4.6, sold90: 147 }],
      ["satin-bow-scrunchie", "scrunchies", "سكرانشي ساتان وردي بفيونكة", "Pink Satin Bow Scrunchie", shot("satin-bow-scrunchie"), 130, { rating: 4.8, sold90: 233 }],
      ["knotted-satin-headband", "headbands", "طوق شعر ساتان بعقدة بلون الشمبانيا", "Champagne Knotted Satin Headband", shot("knotted-satin-headband"), 240, { rating: 4.6, sold90: 129 }],
      ["gold-hair-pins-set", "pins-barrettes", "طقم بنس شعر ذهبي", "Gold-Tone Hair Pin Set", shot("gold-hair-pins-set"), 120, { rating: 4.5, sold90: 205 }],
      ["pearl-mini-claw-clips", "claw-clips", "طقم ٤ توك كلبس صغيرة باللؤلؤ", "Pearl Mini Claw Clips, Set of 4", shot("pearl-mini-claw-clips"), 220, { rating: 4.7, sold90: 162 }],
      ["cotton-scrunchie-pack", "scrunchies", "عبوة ٥ سكرانشي قطن بألوان هادئة", "Cotton Scrunchie Pack of 5 (Neutrals)", shot("cotton-scrunchie-pack"), 160, { rating: 4.6, sold90: 251 }],
      ["tortoise-thin-headband", "headbands", "طوق شعر رفيع بنقشة الصدف", "Thin Tortoise Headband", shot("tortoise-thin-headband"), 140, { rating: 4.5, sold90: 118 }],
      ["crystal-hair-slides", "pins-barrettes", "زوج توك كريستال", "Crystal Hair Slides, Pair", shot("crystal-hair-slides"), 230, { compareAtPrice: 280, rating: 4.7, sold90: 137 }],
    ],
  }),
  photos: {
    // Pastel snap clips and small claw clips on white and lilac paper, a cherry clip as the accent (wide); pearl hair pins and peonies (tall, Pexels, drawn by no look).
    hero: { wide: scene("hero-wide"), tall: pexels(4515450, 1200) },
    tiles: TILES,
    // A soft pile of velvet and satin scrunchies on pale lilac fabric, in the middle (it carries the Scrunchies row).
    banner: scene("banner"),
    // A white box tied with a cherry satin bow, a cream claw clip on the lid (the gift wrapping story).
    story: scene("story"),
    // A shop table with clips, scrunchies and headbands sorted into lilac trays, gift boxes beside them (landscape, the about page).
    about: scene("about"),
    custom: {
      // `kholkhal`: the hero carousel's second and third slides (wide, cropped tall on phones; subject centred).
      "hero-2": scene("hero-2"), // a tortoise, a matte black and a cream claw clip in a row on a white knit
      "hero-3": scene("hero-3"), // an open lilac gift box with scrunchies, a pearl barrette and gold pins, a cherry ribbon beside it
    },
  },
  copy: {
    announcement: [
      L("توك وسكرانشي وأطواق للشعر", "Clips, scrunchies and headbands"),
      L("خامة كل قطعة مذكورة في صفحتها", "Every piece's material on its page"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("عن فيونكة", "About Fyonka"), search: L("ابحث عن توكة أو سكرانشي", "Search clips and scrunchies") },
    hero: {
      alt: L("توك شعر صغيرة وكلبسات بألوان الباستيل على ورق أبيض وليلكي", "Pastel snap clips and small claw clips on white and lilac paper"),
      eyebrow: L("وصل حديثًا", "Just landed"),
      title: L("توك وسكرانشي لكل يوم", "Clips and scrunchies for every day"),
      line: L(
        "توك كلبس وسكرانشي وأطواق وبنس بألوان متعددة، للاستخدام اليومي أو للإهداء.",
        "Claw clips, scrunchies, headbands and pins in pretty colours, for every day or as a gift.",
      ),
      cta: L("تصفّح الجديد", "See what's new"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: {
      primary: {
        eyebrow: L("اختياراتنا", "Our favourites"),
        title: L("القطع الأكثر طلبًا", "Our most-ordered pieces"),
        line: L(
          "الكلبس الكبير بنقشة الصدف وطقم السكرانشي الساتان وطوق الشعر المخمل: ثلاث قطع تناسب أي إطلالة.",
          "The big tortoise claw clip, the satin scrunchie set and the velvet headband: three that go with anything.",
        ),
        cta: L("كل الأكثر طلبًا", "All best sellers"),
      },
    },
    story: {
      alt: L("علبة بيضاء بفيونكة ساتان حمراء وفوقها توكة كلبس كريمية", "A white box tied with a red satin bow, a cream claw clip on the lid"),
      eyebrow: L("تفاصيل كل قطعة", "Every detail"),
      title: L("خامات ومقاسات واضحة", "Clear materials and sizes"),
      text: L(
        "نذكر خامة كل قطعة ومقاسها في صفحتها.",
        "Each piece's page lists its material and size.",
      ),
      cta: L("تعرّف علينا", "Read our story"),
    },
    trust: [
      { title: L("خامات مذكورة", "Materials listed"), line: L("لكل قطعة خامتها ومقاسها", "Material and size for every piece") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("توك وسكرانشي وأطواق وبنس", "Clips, scrunchies, headbands and pins") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("تعرّف على القطع الجديدة أولًا", "Hear about new pieces first"),
      line: L(
        "رسالة كل أسبوعين: الألوان الجديدة وأفكار تسريحات سريعة بالتوك والسكرانشي.",
        "One letter every two weeks: new colours and quick hairstyle ideas with clips and scrunchies.",
      ),
      note: L("بدون رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: {
      line: L(
        "إكسسوارات شعر بألوان متعددة وأسعار مناسبة.",
        "Pretty hair accessories at friendly prices.",
      ),
    },
    about: {
      line: L("إكسسوارات شعر جميلة بأسعار مناسبة.", "Pretty hair accessories at sensible prices."),
      alt: L("طاولة عليها توك وسكرانشي وأطواق مرتبة في صوانٍ ليلكية", "A table of clips, scrunchies and headbands sorted into lilac trays"),
      eyebrow: L("من نحن", "Who we are"),
      title: L("بدأت بفيونكة واحدة", "It started with one bow"),
      text: L(
        "فيونكة متجر لإكسسوارات الشعر: توك وسكرانشي وأطواق وبنس. نختار كل قطعة بعناية، ونذكر خامتها ومقاسها في صفحتها.",
        "Fyonka sells hair accessories: clips, scrunchies, headbands and pins. We choose every piece with care, and list its material and size on its page.",
      ),
      more: L(
        "ونذكر لكل قطعة اسمها الحقيقي: نقشة الصدف مطبوعة على الريزن، واللؤلؤ صناعي، والكريستال ليس ألماسًا، والبنس معدن بلون ذهبي. ومذكور في صفحة كل قطعة.",
        "And we call everything by its real name: tortoise is a print on resin, the pearls are faux, the crystals are not diamonds, and the pins are gold-tone metal. Each product page says which.",
      ),
      cta: L("تصفّح الجديد", "See what's new"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L(
        "تبحث عن مقاس مناسب أو هدية؟ اسألنا عن أي قطعة.",
        "Looking for the right size or a gift? Ask us about any piece.",
      ),
      heading: L("اسأل عن توكة أو عن طلبك", "Ask about a clip or your order"),
    },
    faq: {
      line: L("المقاسات والخامات وطريقة الطلب.", "Sizes, materials and ordering."),
      question: L("كيف أختار مقاس الكلبس؟", "Which claw clip size should I choose?"),
      answer: L(
        "للشعر الكثيف أو الطويل اختر الكلبس الكبير، وللشعر الخفيف أو القصير تثبّته الأحجام الصغيرة أفضل. والسكرانشي بدون أجزاء معدنية.",
        "For thick or long hair, take the large claw clip; for fine or short hair, the small ones hold better. Our scrunchies have no metal parts.",
      ),
    },
    // `kholkhal`: slide 2's button, and the button of the scrunchie campaign beside its row.
    nav: [
      { label: L("تسوّق الكلبس", "Shop claw clips"), href: `/products?search=${encodeURIComponent("كلبس")}` },
      { label: L("تسوّق السكرانشي", "Shop scrunchies"), href: `/products?search=${encodeURIComponent("سكرانشي")}` },
    ],
    // `kholkhal`: "shop by hair type", three ready-made searches; each option is the item, its search, and `custom.finder-N-for` / `-under`.
    finder: {
      title: L("اختر حسب نوع الشعر", "Shop by hair type"),
      line: L("كل خيار يعرض القطع المناسبة له.", "Each option opens the pieces that suit it."),
      options: [
        { label: L("كلبس كبير", "a big claw clip"), href: `/products?search=${encodeURIComponent("كلبس")}` },
        { label: L("سكرانشي ساتان", "a satin scrunchie"), href: `/products?search=${encodeURIComponent("سكرانشي")}` },
        { label: L("بنس صغيرة", "small pins"), href: `/products?search=${encodeURIComponent("بنس")}` },
      ],
    },
    custom: {
      // `kholkhal`: the story's second paragraph (one sentence, after `story.text`).
      "story-more": L(
        "ولأي سؤال عن القطع، تواصل معنا.",
        "For any question about our pieces, contact us.",
      ),
      // `kholkhal`: hero slides 2 and 3 (`photos.custom.hero-2`, `-3`). Titles of at most 6 words; slide 2's button is `nav.0`, slide 3's opens the shop from the lowest price.
      "hero-2-alt": L("ثلاث توك كلبس بنقشة الصدف وبالأسود والكريمي فوق بلوفر أبيض", "Tortoise, black and cream claw clips on a white knit"),
      "hero-2-eyebrow": L("كلبس بمقاسات متعددة", "Claw clips in several sizes"),
      "hero-2-title": L("تسريحة سريعة في ثانية", "Hair up in a second"),
      "hero-2-line": L("كلبس كبير للشعر الكثيف، وصغير للشعر الخفيف.", "Large claw clips for thick hair, small ones for fine hair."),
      "hero-3-alt": L("علبة هدية ليلكية فيها سكرانشي وتوكة لؤلؤ وبنس ذهبي", "A lilac gift box with scrunchies, a pearl barrette and gold pins"),
      "hero-3-eyebrow": L("هدية صغيرة", "A little gift"),
      "hero-3-title": L("هدايا بأقل من ٢٥٠ جنيه", "Gifts under EGP 250"),
      "hero-3-line": L("توك وبنس مناسبة للإهداء في أي مناسبة.", "Clips and pins to give for any occasion."),
      "hero-3-cta": L("تسوّق الهدايا", "Shop gifts"),
      // `kholkhal`: the finder's three sentences, after each option's item ("for …", "under …"). Prices are true of the catalog.
      "finder-1-for": L("شعر كثيف", "thick hair"),
      "finder-1-under": L("٢٥٠ جنيه", "EGP 250"),
      "finder-2-for": L("شعر مجعد", "curly hair"),
      "finder-2-under": L("٢٥٠ جنيه", "EGP 250"),
      "finder-3-for": L("شعر خفيف", "fine hair"),
      "finder-3-under": L("٢٠٠ جنيه", "EGP 200"),
      // `kholkhal`: the campaign beside the scrunchie row, on `photos.banner` (landscape on desktop, tall on phones).
      "banner-alt": L("كومة سكرانشي مخمل وساتان على قماش ليلكي", "A pile of velvet and satin scrunchies on lilac fabric"),
      "banner-eyebrow": L("ساتان ومخمل وقطن", "Satin, velvet and cotton"),
      "banner-title": L("سكرانشي بدون معدن", "Scrunchies with no metal"),
      "banner-line": L("بدون أجزاء معدنية، بخامات الساتان والمخمل والقطن.", "No metal parts, in satin, velvet and cotton."),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("تُلبس معها", "Wear it with") } },
};
