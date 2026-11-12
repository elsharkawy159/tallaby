/**
 * The glasses pack (niche editions, ROADMAP F-90): "Bossa", an eyewear shop
 * with colourful sunglasses, optical frames, blue-light glasses and sport
 * and kids pairs at friendly prices. Data only; `karat` draws it.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("glasses", <slug>)`), square, one angle.
 *
 * Art-directed photos: Pexels, each checked by eye (2026-11-11): glasses on
 * pink, peach, red and pale paper, no people or hands, no lettering on the
 * temples, none used by a template or another pack, none twice. Hero
 * 26682030 (wide) and 12693047 (tall); tiles 20093375, 13697735, 35597800,
 * 5713793; banner 1313064 (karat shows none); story 10154994 (the about
 * page). Left out after the check: 9328548 and 26050118 (brand and model
 * lettering on the temples), 5465834 (a mark on the lens), 23962110 (barcode
 * tags), 28834289 and 5706223 (lettering on a temple and a book cover).
 *
 * Looks: `karat` only, the niche's template (one template per niche). The
 * accessories switch (2026-11-12) took `jewelry-luxe` off and folded karat's
 * own shop (its former `perLook` entry) into the pack, so karat shows the
 * same store as before. No `reviews`: a pack holds no invented buyer quotes,
 * and without them `karat` leaves its reviews section out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("glasses", slug);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [pexels(20093375, 1200), pexels(13697735, 1200), pexels(35597800, 1200), pexels(5713793, 1200)];

export const GLASSES: Edition = {
  niche: "glasses",
  looks: ["karat"],
  priceBand: { min: 250, max: 1500 },
  // Square packshots on pure white: a square white stage shows them whole, and every frame reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("بُصّة", "Bossa"),
    description: L("نظارات شمس ملوّنة وإطارات طبية وبلو لايت بأسعار تفرّح.", "Colourful sunglasses, optical frames and blue-light glasses at happy prices."),
    categories: [
      ["sunglasses", "نظارات شمس", "Sunglasses", TILES[0]!],
      ["optical", "إطارات طبية", "Optical frames", TILES[1]!],
      ["blue-light", "نظارات بلو لايت", "Blue-light glasses", TILES[2]!],
      ["sport-kids", "رياضية وأطفال", "Sport and kids", TILES[3]!],
    ],
    // Newest first (karat's shelf opens on the newest).
    products: [
      ["gold-round-optical-frame", "optical", "إطار نظارة طبية مدور دهبي", "Gold Round Optical Frame", shot("gold-round-optical-frame"), 600, { isFeatured: true, rating: 4.9, sold90: 187 }],
      ["round-tortoise-sunglasses", "sunglasses", "نظارة شمس مدورة تورتواز", "Round Tortoiseshell Sunglasses", shot("round-tortoise-sunglasses"), 450, { isFeatured: true, rating: 4.8, sold90: 264 }],
      ["rose-gold-cat-eye-blue-light-glasses", "blue-light", "نظارة بلو لايت كات آي روز جولد", "Rose Gold Cat-Eye Blue-Light Glasses", shot("rose-gold-cat-eye-blue-light-glasses"), 420, { rating: 4.7, sold90: 129 }],
      ["gold-aviator-sunglasses", "sunglasses", "نظارة شمس أفياتور دهبي بعدسات خضرا", "Gold Aviator Sunglasses", shot("gold-aviator-sunglasses"), 520, { isFeatured: true, compareAtPrice: 650, rating: 4.6, sold90: 178 }],
      ["kids-sky-blue-flexible-frame", "sport-kids", "نظارة أطفال مرنة أزرق سماوي", "Kids Sky Blue Flexible Frame", shot("kids-sky-blue-flexible-frame"), 320, { rating: 4.8, sold90: 141 }],
      ["black-square-sunglasses", "sunglasses", "نظارة شمس مربعة سودا", "Black Square Sunglasses", shot("black-square-sunglasses"), 420, { rating: 4.7, sold90: 231 }],
      ["clear-crystal-optical-frame", "optical", "إطار نظارة طبية شفاف", "Clear Crystal Optical Frame", shot("clear-crystal-optical-frame"), 580, { rating: 4.5, sold90: 96 }],
      ["black-round-blue-light-glasses", "blue-light", "نظارة بلو لايت مدورة سودا", "Black Round Blue-Light Glasses", shot("black-round-blue-light-glasses"), 380, { rating: 4.6, sold90: 243 }],
      ["black-red-sport-sunglasses", "sport-kids", "نظارة شمس رياضية سودا بعدسات حمرا", "Black Sport Sunglasses with Red Lenses", shot("black-red-sport-sunglasses"), 480, { rating: 4.6, sold90: 117 }],
      ["black-rectangle-optical-frame", "optical", "إطار نظارة طبية مستطيل أسود", "Black Rectangular Optical Frame", shot("black-rectangle-optical-frame"), 550, { rating: 4.7, sold90: 152 }],
      ["tortoise-square-blue-light-glasses", "blue-light", "نظارة بلو لايت مربعة تورتواز", "Tortoiseshell Square Blue-Light Glasses", shot("tortoise-square-blue-light-glasses"), 390, { rating: 4.5, sold90: 158 }],
      ["white-shield-cycling-sunglasses", "sport-kids", "نظارة دراجات بيضا بعدسة زرقا", "White Cycling Sunglasses with Blue Shield Lens", shot("white-shield-cycling-sunglasses"), 520, { compareAtPrice: 620, rating: 4.4, sold90: 83 }],
      ["red-cat-eye-sunglasses", "sunglasses", "نظارة شمس كات آي حمرا", "Red Cat-Eye Sunglasses", shot("red-cat-eye-sunglasses"), 440, { rating: 4.5, sold90: 146 }],
      ["tortoise-browline-optical-frame", "optical", "إطار نظارة طبية نص فريم تورتواز", "Tortoiseshell Browline Optical Frame", shot("tortoise-browline-optical-frame"), 620, { rating: 4.6, sold90: 112 }],
      ["navy-rectangle-blue-light-glasses", "blue-light", "نظارة بلو لايت مستطيلة كحلي", "Navy Rectangular Blue-Light Glasses", shot("navy-rectangle-blue-light-glasses"), 400, { rating: 4.6, sold90: 137 }],
      ["kids-pink-round-sunglasses", "sport-kids", "نظارة شمس أطفال مدورة بمبي", "Kids Pink Round Sunglasses", shot("kids-pink-round-sunglasses"), 260, { rating: 4.7, sold90: 124 }],
    ],
  }),
  photos: {
    hero: { wide: pexels(26682030, 1920), tall: pexels(12693047, 1200) },
    tiles: TILES,
    // Karat shows no banner; the pack still holds one.
    banner: pexels(1313064, 1920),
    // The about page.
    story: pexels(10154994, 1200),
    custom: {
      // `karat` lookbook, square: one large photo, then four small ones (subjects centred: the bento and the rings crop to the middle).
      "lookbook-1": pexels(7602873, 1200), // black round glasses on a beige chair
      "lookbook-2": pexels(25389282, 900), // a black rectangular frame on white
      "lookbook-3": pexels(32398468, 900), // a black double-bridge frame on grey paper
      "lookbook-4": pexels(5752242, 900), // a black cat-eye frame on white
      "lookbook-5": pexels(4696100, 900), // mirrored lenses reflecting clouds
      // `karat` story rings 5 to 8 (rings 1 to 4 show the category tiles).
      "stories-5": pexels(36090899, 900), // round sunglasses with blue mirrored lenses on pink
      "stories-6": pexels(30336929, 900), // a dark round frame on pale linen
      "stories-7": pexels(7602881, 900), // round black glasses on a beige seat, from above
      "stories-8": pexels(7107485, 900), // a thin frame on a desk, the keyboard out of focus
    },
  },
  copy: {
    announcement: [
      L("ألوان جديدة كل أسبوع", "New colours every week"),
      L("التوصيل لكل مصر", "Delivery across Egypt"),
      L("ادفع لما النظارة توصل", "Pay when your pair arrives"),
    ],
    labels: { about: L("عن بُصّة", "About Bossa"), search: L("دوّر على نظارة", "Search for a pair") },
    hero: {
      alt: L("إطارين نظارة تورتواز على خلفية وردي", "Two tortoiseshell frames on a pink backdrop"),
      eyebrow: L("نظارات بمزاج", "Glasses with a mood"),
      title: L("بُص للدنيا بلون", "See the world in colour"),
      line: L("شمس وطبي وبلو لايت، وكلها أقل من ٧٠٠ جنيه.", "Sunglasses, optical and blue-light frames, all under EGP 700."),
      cta: L("شوف الجديد", "See what's new"),
    },
    categories: { title: L("كل نوع وله لون", "Every type, every colour") },
    products: {
      primary: {
        // The shelf's title, over its tabs.
        title: L("النظارات اللي بتخلص بسرعة", "The pairs that sell out fast"),
        line: L("إطار طبي خفيف، ونظارة شمس كلاسيك، وأفياتور دهبي: تلاتة يمشوا مع أي لبس.", "A light optical frame, a classic pair of sunglasses and a gold aviator: three that go with anything."),
      },
    },
    story: {
      alt: L("نظارة بإطار أسود وموف على ورق وردي جنب قبعة قش", "Black and purple frames on pink paper beside a straw hat"),
      eyebrow: L("اختار بمزاجك", "Choose by mood"),
      title: L("نظارة لكل لبس", "A pair for every outfit"),
      text: L(
        "مش لازم نظارة واحدة لكل حاجة: واحدة ملوّنة للبحر، وواحدة هادية للشغل، وبلو لايت قدام الشاشة.",
        "You do not need one pair for everything: a bright one for the beach, a quiet one for work and blue-light glasses for the screen.",
      ),
      cta: L("عننا", "About us"),
    },
    trust: [
      { title: L("أسعار تفرّح", "Friendly prices"), line: L("كل النظارات أقل من ٧٠٠ جنيه", "Every pair under EGP 700") },
      { title: L("علبة وفوطة", "Case and cloth"), line: L("مع كل نظارة", "With every pair") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("لو الإطار مش مريح نبدّله", "If the frame is not comfortable, we swap it") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما النظارة توصل", "Pay when your pair arrives") },
    ],
    newsletter: {
      title: L("الألوان الجديدة أول بأول", "New colours as they land"),
      line: L("رسالة كل أسبوعين فيها الألوان والأشكال الجديدة.", "A letter every two weeks with the new colours and shapes."),
      note: L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("بُصّة: نظارات ملوّنة بأسعار تفرّح.", "Bossa: colourful glasses at happy prices.") },
    about: {
      line: L("نظارات ملوّنة بأسعار تفرّح.", "Colourful glasses at happy prices."),
      alt: L("نظارة بإطار أسود وموف على ورق وردي جنب قبعة قش", "Black and purple frames on pink paper beside a straw hat"),
      eyebrow: L("عننا", "About us"),
      title: L("النظارة إكسسوار، مش عدسة وبس", "Glasses are an accessory, not just lenses"),
      text: L(
        "بُصّة بدأت عشان كنا عايزين نظارة شكلها حلو من غير ما ندفع مرتب شهر. بنختار ألوان وأشكال كتير، وبنجرّب كل إطار قبل ما ينزل.",
        "Bossa started because we wanted good-looking glasses without paying a month's salary. We pick lots of colours and shapes, and try every frame before we list it.",
      ),
      more: L("وكل نظارة بتوصلك في علبتها ومعاها فوطة تنضيف.", "And every pair arrives in its case with a cleaning cloth."),
      cta: L("شوف الجديد", "See what's new"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L("ابعت لنا صورتك ونقولك أي لون وأي شكل هيليق عليك.", "Send us a photo and we tell you which colour and shape suit you."),
      heading: L("اسأل عن لون أو مقاس", "Ask about a colour or a size"),
    },
    faq: {
      line: L("العدسات والمقاسات والتوصيل.", "Lenses, sizes and delivery."),
      question: L("ينفع أركّب عدسات نظري في الإطار؟", "Can I fit my prescription lenses in a frame?"),
      answer: L(
        "أيوه، أي محل بصريات يقدر يركّب عدسات نظرك في الإطارات الطبية والبلو لايت. مقاس العدسة والكوبري مكتوب في صفحة كل إطار.",
        "Yes, any optician can fit your prescription lenses in our optical and blue-light frames. The lens and bridge sizes are on each frame's page.",
      ),
    },
    custom: {
      // `karat`: the store's short name inside a sentence.
      "store-short": L("بُصّة", "Bossa"),
      // `karat`: the hero's small line and its round sticker (a price point, not an offer).
      "hero-note": L("ألوان الموسم", "Colours of the season"),
      "hero-sticker-1": L("أقل من", "Under"),
      "hero-sticker-2": L("٧٠٠", "700"),
      "hero-sticker-3": L("جنيه", "EGP"),
      // `karat`: the eight story rings. 1 to 4 show the category tiles, in the categories' order.
      "stories-1": L("شمس", "Sun"),
      "stories-2": L("طبي", "Optical"),
      "stories-3": L("للشاشة", "Screen"),
      "stories-4": L("للصغيرين", "Little ones"),
      "stories-5": L("مرايا", "Mirror lens"),
      "stories-6": L("إطار أسود", "Black frame"),
      "stories-7": L("مدوّرة", "Round"),
      "stories-8": L("للمكتب", "Desk days"),
      // `karat`: the lookbook's brand tile. No invented handle: the seller's own replaces it.
      "lookbook-handle": L("بُصّة على إنستجرام", "Bossa on Instagram"),
      "lookbook-line": L("ألوان جديدة كل أسبوع", "New colours every week"),
    },
  },
  productPage: { copy: { reviews: L("آراء اللي لبسوها", "From people who wear it"), related: L("نظارات تانية هتعجبك", "More pairs you may like") } },
};
