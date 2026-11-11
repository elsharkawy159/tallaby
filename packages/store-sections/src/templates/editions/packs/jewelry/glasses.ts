/**
 * The glasses pack (niche editions, ROADMAP F-90): an eyewear shop with
 * sunglasses, optical frames, blue-light glasses and sport and kids pairs.
 * Data only; the looks draw it.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("glasses", <slug>)`), square, one angle.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * glasses on pale paper, white and beige only, no people or hands, none used
 * by a template or another pack, none twice. Left out after the check:
 * 9328548 and 26050118 (brand and model lettering on the temples), 5465834
 * (a mark on the lens), 23962110 (barcode tags), 28834289 and 5706223
 * (lettering on a temple and a book cover). Known and accepted: 14348164
 * shows a keyboard's own key legends (delete, return, shift), no brand.
 *
 * Looks: `jewelry-luxe`, then `karat`. Four products per category, so each
 * category row is one full row of four. No `reviews`: a pack holds no
 * invented buyer quotes, and without them `karat` leaves its reviews
 * section out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("glasses", slug);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(27353347, 1200), // three black sunglasses on white, blind shadows
  pexels(5766564, 1200), // a wall of optical frames on glass shelves
  pexels(14348164, 1200), // round glasses beside a pale keyboard
  pexels(28938431, 1200), // three small colourful sunglasses on yellow
];

export const GLASSES: Edition = {
  niche: "glasses",
  looks: ["jewelry-luxe", "karat"],
  priceBand: { min: 250, max: 1500 },
  // Square packshots on pure white: a square white stage shows them whole, and every frame reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("لمحة", "Lamha"),
    description: L("نظارات شمس وإطارات طبية ونظارات بلو لايت، بتوصلك لحد البيت.", "Sunglasses, optical frames and blue-light glasses, delivered to your door."),
    categories: [
      ["sunglasses", "نظارات شمس", "Sunglasses", TILES[0]!],
      ["optical", "إطارات طبية", "Optical frames", TILES[1]!],
      ["blue-light", "نظارات بلو لايت", "Blue-light glasses", TILES[2]!],
      ["sport-kids", "رياضية وأطفال", "Sport and kids", TILES[3]!],
    ],
    // Newest first. The three featured pairs fill `jewelry-luxe`'s spotlight.
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
    // One shoot: metal and tortoiseshell frames scattered on pale beige paper.
    hero: { wide: pexels(4226868, 1920), tall: pexels(4226875, 1200) },
    tiles: TILES,
    // Eight frames laid out on peach paper.
    banner: pexels(26050120, 1920),
    // Round black frames on a notepad with a dried flower (the subject sits in the middle, so the 4:5 and the landscape crop both keep it).
    story: pexels(4439427, 1200),
    // Silver aviator frames beside a blank card with a brass clip (landscape, the about page).
    about: pexels(4226787, 1200),
    custom: {
      // `jewelry-luxe` spotlight, 4:5: a gold and a silver frame on peach, long shadows.
      "spot-photo": pexels(29395557, 1200),
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
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("كل نظارة بتوصل في علبتها ومعاها فوطة تنضيف", "Every pair arrives in its case with a cleaning cloth"),
    ],
    labels: { about: L("حكايتنا", "Our story"), search: L("دوّر على نظارة", "Search for a pair") },
    hero: {
      alt: L("إطارات نظارات معدن وتورتواز على ورق بيج", "Metal and tortoiseshell frames on beige paper"),
      eyebrow: L("تشكيلة الموسم", "This season's edit"),
      title: L("نظارة تليق عليك وتريّح عينك", "Frames that suit your face"),
      line: L(
        "نظارات شمس وإطارات طبية ونظارات بلو لايت، مختارة بشكل يناسب كل وش وكل يوم.",
        "Sunglasses, optical frames and blue-light glasses, chosen to suit every face and every day.",
      ),
      cta: L("تسوّق النظارات", "Shop the glasses"),
    },
    categories: { title: L("تسوّق حسب النوع", "Shop by type") },
    products: {
      primary: {
        alt: L("إطار دهبي وإطار فضي على ورق مشمشي", "A gold frame and a silver frame on peach paper"),
        eyebrow: L("اختياراتنا", "Our picks"),
        // Read by both looks: over the three featured pairs (`jewelry-luxe`) and over the shelf tabs (`karat`), so it names no number.
        title: L("نظارات بنرشحها لك", "Pairs we recommend"),
        line: L("إطار طبي خفيف، ونظارة شمس كلاسيك، وأفياتور دهبي: تلاتة يمشوا مع أي لبس.", "A light optical frame, a classic pair of sunglasses and a gold aviator: three that go with anything."),
        cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
      },
    },
    story: {
      alt: L("نظارة مدورة سودا على نوتة بيضا وجنبها زهرة مجففة", "Round black glasses on a white notepad beside a dried flower"),
      eyebrow: L("إزاي بنشتغل", "How we work"),
      title: L("كل نظارة بتتراجع قبل ما تتغلف", "Every pair is checked before it is packed"),
      text: L(
        "بنراجع المفصلات والعدسات ونظبط الدراعات، وبعدين بنحط النظارة في علبتها مع فوطة تنضيف. اللي في الصورة هو اللي بيوصلك.",
        "We check the hinges and lenses and straighten the arms, then put each pair in its case with a cleaning cloth. What you see in the photo is what arrives.",
      ),
      cta: L("اعرف حكايتنا", "Our story"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنبعت طلبك لأي محافظة", "We send your order to any governorate") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما النظارة توصلك", "Pay when your pair arrives") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("لو المقاس مش مريح كلّمنا ونبدّلها", "If the fit is not right, message us and we swap it") },
      { title: L("علبة وفوطة", "Case and cloth"), line: L("مع كل نظارة", "With every pair") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "See new styles first"),
      line: L("رسالة واحدة في الشهر: موديلات جديدة ونصايح تختار بيها الإطار المناسب لوشك.", "One letter a month: new styles and tips for choosing the frame that suits your face."),
      note: L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("نظارات شمس وإطارات طبية ونظارات بلو لايت، مختارة بعناية وبتوصلك لحد البيت.", "Sunglasses, optical frames and blue-light glasses, carefully chosen and delivered to your door.") },
    about: {
      line: L("نظارات مختارة بعناية، لكل وش ولكل يوم.", "Carefully chosen glasses, for every face and every day."),
      alt: L("إطار أفياتور فضي جنب كارت أبيض بمشبك نحاس", "A silver aviator frame beside a blank card with a brass clip"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("موديلات قليلة، مختارة صح", "Few styles, chosen well"),
      text: L(
        "بنختار كل موديل بنفسنا ونجربه قبل ما ننزله: المفصلة، الوزن، وراحة الأنف. عشان كده التشكيلة صغيرة وكل نظارة فيها ليها سبب.",
        "We pick every style ourselves and try it before we list it: the hinge, the weight, the nose pads. That is why the range is small and every pair in it has a reason to be there.",
      ),
      more: L("ولو محتار بين موديلين، ابعت لنا صورتك ونقولك رأينا.", "And if you cannot decide between two styles, send us a photo and we tell you what we think."),
      cta: L("تسوّق الأكثر طلبًا", "Shop best sellers"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L("ابعت لنا شكل وشك أو مقاس نظارتك القديمة ونرشح لك الإطار المناسب.", "Tell us your face shape or the size of your old pair and we suggest the right frame."),
      heading: L("اسأل عن المقاس أو عن طلبك", "Ask about sizing or your order"),
    },
    faq: {
      line: L("المقاسات والعدسات والتوصيل.", "Sizing, lenses and delivery."),
      question: L("أعرف مقاس النظارة المناسب إزاي؟", "How do I know which size fits me?"),
      answer: L(
        "بص على دراع نظارتك القديمة من جوه: هتلاقي تلات أرقام (عرض العدسة، الكوبري، طول الدراع). قارنهم بالمقاسات المكتوبة في صفحة كل نظارة.",
        "Look inside the arm of your old pair: you will find three numbers (lens width, bridge, arm length). Compare them with the sizes on each product page.",
      ),
    },
    custom: {
      // `jewelry-luxe`: the link to the whole catalog (header, footer, the spotlight's "view all").
      "shop-all": L("كل النظارات", "All glasses"),
      // `karat`: the store's short name inside a sentence.
      "store-short": L("لمحة", "Lamha"),
      // `karat`: the hero's small line and its round sticker (not an offer).
      "hero-note": L("وصلت دلوقتي", "Just in"),
      "hero-sticker-1": L("موديلات", "New"),
      "hero-sticker-2": L("٢٠٢٦", "2026"),
      "hero-sticker-3": L("جديدة", "styles"),
      // `karat`: the eight story rings. 1 to 4 show the category tiles, in the categories' order.
      "stories-1": L("شمس", "Sunglasses"),
      "stories-2": L("طبية", "Optical"),
      "stories-3": L("بلو لايت", "Blue-light"),
      "stories-4": L("أطفال", "Kids"),
      "stories-5": L("عدسات مرايا", "Mirrored"),
      "stories-6": L("إطارات سودا", "Black frames"),
      "stories-7": L("مدورة", "Round"),
      "stories-8": L("للمكتب", "For the desk"),
      // `karat`: the lookbook's brand tile. No invented handle: the seller's own replaces it.
      "lookbook-handle": L("لمحة على إنستجرام", "Lamha on Instagram"),
      "lookbook-line": L("صور جديدة كل أسبوع", "New photos every week"),
    },
  },
  productPage: { copy: { reviews: L("آراء اللي لبسوها", "From people who wear it"), related: L("نظارات تانية هتعجبك", "More pairs you may like") } },
};
