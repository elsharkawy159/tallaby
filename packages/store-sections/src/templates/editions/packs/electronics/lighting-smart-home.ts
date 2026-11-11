/**
 * The lighting and smart home pack (niche editions, ROADMAP F-90): a lamp
 * shop, "Dayy" (Egyptian for "light"), with pendants and chandeliers, floor
 * lamps, table and desk lamps and smart lighting, sixteen products in four
 * categories of four. Data only; the looks draw it. No React here.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("lighting-smart-home", <slug>)`), square, one angle.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px (2026-11-11):
 * lamps in rooms, lit where it matters, no people, hands or body parts, no
 * logos or lettering, none used by a template or another pack, none twice.
 * Hero 7045363 (wide: a black arc floor lamp beside a blue sofa and a wood
 * slat wall) and 11125319 (tall: a brass floor lamp with a linen shade over
 * cream cushions). Tiles: pendants 20056503 (two lit rattan pendants on a
 * white brick wall), floor lamps 13806238 (a dark drum floor lamp and a
 * linen table lamp, both lit, in a panelled corner), table and desk lamps
 * 34771394 (a yellow mushroom table lamp, warm bokeh behind), smart lighting
 * 29099976 (warm LED strips in a ceiling cove over a kitchen bar). Banner
 * 5400775 (a cool LED desk lamp and a warm caged lamp in a dark room).
 * Story 38014632 (a lit wood and paper floor lamp in a pale corner; a sliver
 * of a frame at the top edge). Dark story, for `nour` 14161060 (lit
 * geometric glass pendants against a dark window).
 * Left out after the check: 32038581, 19370207, 37407354 and 11474538 (book
 * titles readable on the table), 12128458 (a sticker on a fitting, a plug
 * and an emergency light), 30561628 (line-drawn faces on the wall),
 * 14677290 (a person's shadow on the wall), 5859146 (price tags and a street
 * reflected in a shop window), 39078818 (an outdoor café front with loose
 * wiring), 26546549 (a cluttered coffee table), 30528294 (a bulb base cut
 * off at the edge), 20713462 (the bulb falls outside a 3:4 crop),
 * 34578077 (the lamp sits small in a corner), 40103210 (used by an older
 * template's demo, migration 0087).
 *
 * Looks: `nour` (dark page: its about photo comes from `photos.dark.story`),
 * then `zaki`. Neither has category rows. Four featured products: `zaki`'s
 * grid shows four, and `nour`'s hero shows the first featured one (the brass
 * table lamp, so it stays first). No `reviews`: a pack holds no invented
 * buyer quotes, and without them `nour` leaves its reviews section out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "lighting-smart-home";
const shot = (slug: string) => editionPhoto(NICHE, slug);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(20056503, 1200), // two lit rattan pendants on a white brick wall
  pexels(13806238, 1200), // a lit drum floor lamp and a linen table lamp in a panelled corner
  pexels(34771394, 1200), // a yellow mushroom table lamp, warm bokeh behind
  pexels(29099976, 1200), // warm LED strips in a ceiling cove over a kitchen bar
];

export const LIGHTING_SMART_HOME: Edition = {
  niche: NICHE,
  looks: ["nour", "zaki"],
  priceBand: { min: 250, max: 9000 },
  // Square packshots on pure white: a square white stage shows each lamp whole, and the grid reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("ضيّ", "Dayy"),
    description: L(
      "نجف وأباجورات ولمبات ذكية، بنوصّلها ونركّبها لحد البيت.",
      "Chandeliers, lamps and smart lighting, delivered and installed at home.",
    ),
    categories: [
      ["pendants", "نجف ومعلقات", "Pendants & chandeliers", TILES[0]!],
      ["floor", "أباجورات أرضي", "Floor lamps", TILES[1]!],
      ["table", "أباجورات ولمبات مكتب", "Table & desk lamps", TILES[2]!],
      ["smart", "إضاءة ذكية", "Smart lighting", TILES[3]!],
    ],
    // Newest first, mixed so a row of the newest shows every category. The first featured product is `nour`'s hero.
    products: [
      ["brass-table-lamp-linen-shade", "table", "أباجورة نحاس بشادر كتان", "Brass Table Lamp with Linen Shade", shot("brass-table-lamp-linen-shade"), 2400, { isFeatured: true, rating: 4.9, sold90: 142 }],
      ["gold-three-ring-chandelier", "pendants", "نجفة دهبي ٣ حلقات", "Gold Three-Ring Chandelier", shot("gold-three-ring-chandelier"), 6800, { isFeatured: true, rating: 4.8, sold90: 47 }],
      ["black-arc-floor-lamp", "floor", "أباجورة أرضي آرك سودا", "Black Arc Floor Lamp", shot("black-arc-floor-lamp"), 4200, { isFeatured: true, rating: 4.7, sold90: 63 }],
      ["smart-led-strip-5m", "smart", "شريط ليد ذكي ٥ متر", "5 m Smart LED Strip", shot("smart-led-strip-5m"), 750, { isFeatured: true, compareAtPrice: 890, rating: 4.6, sold90: 238 }],
      ["glass-globe-pendant-light", "pendants", "معلقة إزاز كروية", "Glass Globe Pendant Light", shot("glass-globe-pendant-light"), 1250, { rating: 4.7, sold90: 118 }],
      ["white-smart-led-bulb", "smart", "لمبة ليد ذكية بيضا", "White Smart LED Bulb", shot("white-smart-led-bulb"), 350, { rating: 4.6, sold90: 412 }],
      ["wood-tripod-floor-lamp", "floor", "أباجورة أرضي خشب بتلات رجول", "Wooden Tripod Floor Lamp", shot("wood-tripod-floor-lamp"), 3400, { compareAtPrice: 3900, rating: 4.8, sold90: 71 }],
      ["black-metal-desk-lamp", "table", "لمبة مكتب معدن سودا", "Black Metal Desk Lamp", shot("black-metal-desk-lamp"), 950, { rating: 4.6, sold90: 186 }],
      ["rattan-dome-pendant-light", "pendants", "معلقة خوص قبة", "Rattan Dome Pendant Light", shot("rattan-dome-pendant-light"), 1650, { compareAtPrice: 1900, rating: 4.8, sold90: 97 }],
      ["amber-filament-smart-bulb", "smart", "لمبة فتلة ذكية عنبري", "Amber Filament Smart Bulb", shot("amber-filament-smart-bulb"), 450, { rating: 4.7, sold90: 264 }],
      ["gold-slim-floor-lamp", "floor", "أباجورة أرضي دهبي رفيعة", "Slim Gold Floor Lamp", shot("gold-slim-floor-lamp"), 3600, { rating: 4.5, sold90: 52 }],
      ["white-ceramic-table-lamp", "table", "أباجورة سيراميك بيضا", "White Ceramic Table Lamp", shot("white-ceramic-table-lamp"), 1800, { rating: 4.7, sold90: 109 }],
      ["black-gold-dome-pendant-light", "pendants", "معلقة قبة سودا من بره ودهبي من جوه", "Black and Gold Dome Pendant Light", shot("black-gold-dome-pendant-light"), 1450, { rating: 4.6, sold90: 134 }],
      ["white-smart-night-lamp", "smart", "أباجورة نوم ذكية بيضا", "White Smart Night Lamp", shot("white-smart-night-lamp"), 650, { rating: 4.5, sold90: 157 }],
      ["paper-column-floor-lamp", "floor", "أباجورة أرضي عمود ورق", "Paper Column Floor Lamp", shot("paper-column-floor-lamp"), 2900, { rating: 4.6, sold90: 88 }],
      ["terracotta-mushroom-table-lamp", "table", "أباجورة مشروم تيراكوتا", "Terracotta Mushroom Table Lamp", shot("terracotta-mushroom-table-lamp"), 1650, { rating: 4.8, sold90: 126 }],
    ],
  }),
  photos: {
    // `zaki`'s hero half crops the wide photo square from the centre on desktop: the slats and the arc lamp's stem stay in.
    hero: { wide: pexels(7045363, 1920), tall: pexels(11125319, 1200) },
    tiles: TILES,
    // A cool LED desk lamp and a warm caged lamp in a dark room (both lamps sit in the middle band, so a 21:9 crop keeps them).
    banner: pexels(5400775, 1920),
    // `zaki`'s about page (4:5): a lit wood and paper floor lamp in a pale corner.
    story: pexels(38014632, 1200),
    // `nour`'s page is dark: its about page shows lit glass pendants against a dark window instead.
    dark: { story: pexels(14161060, 1200) },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("فني تركيب في القاهرة والجيزة", "Installers in Cairo and Giza"),
    ],
    labels: { search: L("دوّر على نجفة، أباجورة، لمبة ذكية…", "Search chandeliers, lamps, smart bulbs…") },
    // The header's two links (`zaki`): the whole catalog, then the smart lighting.
    nav: [
      { label: L("الإضاءة", "Lighting"), href: "/products" },
      { label: L("البيت الذكي", "Smart home"), href: search("ذكي") },
    ],
    hero: {
      alt: L("أباجورة أرضي آرك سودا جنب كنبة زرقا وحيطة شرايح خشب", "A black arc floor lamp beside a blue sofa and a wood slat wall"),
      eyebrow: L("بنوصّل وبنركّب", "Delivered and installed"),
      title: L("نور دافي لكل ركن في بيتك", "Warm light for every corner"),
      line: L(
        "نجف وأباجورات ولمبات ذكية، وفني من عندنا يركّبها ويظبطها على موبايلك.",
        "Chandeliers, lamps and smart bulbs, and our own electrician fits them and sets them up on your phone.",
      ),
      // `nour`: the button that adds the first featured lamp to the cart; `zaki`: the hero's first button, to the contact page. Short, fits both.
      cta: L("نوّر بيتك", "Light up your home"),
    },
    categories: { title: L("نوّر كل أوضة", "Light every room") },
    products: {
      primary: {
        // `nour`: over the featured lamp and four best sellers; `zaki`: over the four featured products.
        title: L("اختيارات ضيّ", "Dayy's picks"),
        line: L("أباجورة نحاس، ونجفة دهبي، وآرك أرضي، وشريط ليد ذكي: والتركيب علينا.", "A brass table lamp, a gold chandelier, an arc floor lamp and a smart LED strip, installed by us."),
      },
    },
    // `zaki`'s best-sellers rail: the small label, then the title.
    rows: [{ title: L("منوّرة أكتر بيوت", "In the most homes"), line: L("الأكتر طلبًا", "Most ordered") }],
    story: {
      alt: L("أباجورة أرضي خشب وورق منوّرة في ركن فاتح", "A lit wood and paper floor lamp in a pale corner"),
      eyebrow: L("إزاي بنشتغل", "How we work"),
      title: L("كل لمبة بتتجرب قبل ما تخرج", "Every lamp is tested before it ships"),
      text: L(
        "بنشغّل كل أباجورة ونجفة قبل التغليف، ونتأكد من السلك والمفتاح، وبنغلفها بالفلين عشان الإزاز يوصلك سليم.",
        "We switch on every lamp and chandelier before packing, check the cable and the switch, and pack it in foam so the glass arrives whole.",
      ),
      cta: L("اعرف حكايتنا", "Our story"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("بنبعت طلبك لأي محافظة", "We send your order to any governorate") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصلك", "Pay when your order arrives") },
      { title: L("فني تركيب", "An installer"), line: L("في القاهرة والجيزة", "In Cairo and Giza") },
      { title: L("ضمان سنة", "One-year warranty"), line: L("على اللمبات الذكية والليد", "On smart and LED bulbs") },
    ],
    newsletter: {
      title: L("أفكار إضاءة لبيتك", "Lighting ideas for your home"),
      line: L("رسالة كل شهر: موديلات جديدة ونصايح تختار بيها النور المناسب لكل أوضة.", "One letter a month: new pieces and tips for choosing the right light for each room."),
      note: L("بدون رسائل مزعجة. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("نجف وأباجورات ولمبات ذكية، بنوصّلها ونركّبها لحد البيت.", "Chandeliers, lamps and smart lighting, delivered and installed at home.") },
    about: {
      line: L("إضاءة بنختارها بعناية، ونركّبها بإيدينا.", "Lighting we choose with care and install ourselves."),
      // `nour` shows the dark story photo, `zaki` the light one: both are lit lamps.
      alt: L("أباجورة منوّرة في ركن هادي", "A lit lamp in a quiet corner"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("النور بيغيّر شكل الأوضة", "Light changes a room"),
      text: L(
        "بدأنا فنيين كهربا، وكل يوم كنا بنشوف بيوت حلوة بإضاءة غلط. فبقينا نختار النجف والأباجورات بنفسنا، ونركّبها ونظبطها لحد ما الأوضة تنوّر صح.",
        "We started as electricians, and every day we saw lovely homes with the wrong light. So now we pick the chandeliers and lamps ourselves, fit them and set them up until the room is lit right.",
      ),
      more: L("ابعت لنا صور الأوضة ونقولك تحتاج إيه.", "Send us photos of the room and we tell you what it needs."),
      // `nour`: to the whole catalog; `zaki`: to the contact page. Fits both.
      cta: L("اختار نورك", "Find your light"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L("ابعت لنا مقاس الأوضة وارتفاع السقف ونرشّح لك الإضاءة المناسبة.", "Send us the room size and ceiling height and we suggest the right lighting."),
      heading: L("احجز فني أو اسأل عن طلبك", "Book an installer or ask about your order"),
    },
    faq: {
      line: L("اللمبات والتركيب والتوصيل.", "Bulbs, installation and delivery."),
      question: L("اللمبة بتيجي مع الأباجورة؟", "Does the lamp come with a bulb?"),
      answer: L(
        "أيوه، كل أباجورة ونجفة بتيجي معاها لمبات ليد دافية، ومكتوب في صفحة كل منتج عددها ونوع البلف.",
        "Yes, every lamp and chandelier comes with warm LED bulbs; each product page says how many and which socket.",
      ),
    },
    custom: {
      // Both looks: the store's short name ("About Dayy", and `zaki`'s logo mark).
      "store-short": L("ضيّ", "Dayy"),
      // `nour`: the hero's giant word, one short word.
      "hero-word": L("ضيّ", "GLOW"),
      // `nour`: the services block and its four cards, prices as the store charges them.
      "service-title": L("بنركّبهالك", "We fit it for you"),
      "service-line": L("فني كهربا من عندنا بيركّب ويظبط، في القاهرة والجيزة.", "Our own electrician fits and sets it up, in Cairo and Giza."),
      "service-1-title": L("تركيب نجفة", "Chandelier fitting"),
      "service-1-line": L("نجف ومعلقات، ومعاها تثبيت السقف.", "Chandeliers and pendants, ceiling fixing included."),
      "service-1-price": L("من ٣٥٠ جنيه", "From EGP 350"),
      "service-2-title": L("شريط ليد", "LED strip"),
      "service-2-line": L("نركّب الشريط في الجبس أو تحت الدواليب ونوصّله.", "We fit the strip in a ceiling cove or under cabinets and wire it."),
      "service-2-price": L("من ٢٠٠ جنيه", "From EGP 200"),
      "service-3-title": L("ظبط البيت الذكي", "Smart home setup"),
      "service-3-line": L("نربط اللمبات الذكية بموبايلك ونعمل لك مواعيد تشغيل.", "We link smart bulbs to your phone and set on and off times."),
      "service-3-price": L("من ١٥٠ جنيه", "From EGP 150"),
      "service-4-title": L("مفتاح دِمر", "Dimmer switch"),
      "service-4-line": L("نركّب دِمر عشان تتحكم في درجة النور.", "We fit a dimmer so you control how bright it is."),
      "service-4-price": L("من ٢٠٠ جنيه", "From EGP 200"),
      // `zaki`: the hero's second button, to the whole catalog.
      "hero-cta-2": L("تسوّق الإضاءة", "Shop lighting"),
      // `zaki`: the installation price menu, three groups.
      "service-menu-title": L("أسعار التركيب", "Installation prices"),
      "service-menu-line": L("في القاهرة والجيزة، والسعر شامل زيارة الفني.", "In Cairo and Giza; the price includes the electrician's visit."),
      "service-menu-1": L("النجف", "Ceiling"),
      "service-menu-1-1": L("معلقة أو أبليك", "Pendant or wall light"),
      "service-menu-1-1-price": L("٢٠٠ جنيه", "EGP 200"),
      "service-menu-1-2": L("نجفة لحد ٥ لمبات", "Chandelier up to 5 bulbs"),
      "service-menu-1-2-price": L("٣٥٠ جنيه", "EGP 350"),
      "service-menu-1-3": L("نجفة كبيرة", "Large chandelier"),
      "service-menu-1-3-price": L("٦٠٠ جنيه", "EGP 600"),
      "service-menu-2": L("الليد", "LED"),
      "service-menu-2-1": L("شريط ليد لحد ٥ متر", "LED strip up to 5 m"),
      "service-menu-2-1-price": L("٢٠٠ جنيه", "EGP 200"),
      "service-menu-2-2": L("سبوتات في الجبس", "Ceiling spotlights"),
      "service-menu-2-2-price": L("٤٠ جنيه للسبوت", "EGP 40 each"),
      "service-menu-3": L("البيت الذكي", "Smart home"),
      "service-menu-3-1": L("ظبط لمبة أو فيشة ذكية", "Smart bulb or plug setup"),
      "service-menu-3-1-price": L("٥٠ جنيه", "EGP 50"),
      "service-menu-3-2": L("مفتاح دِمر", "Dimmer switch"),
      "service-menu-3-2-price": L("٢٠٠ جنيه", "EGP 200"),
      // `zaki`: what the warranty plans cover (1 and 2 in every plan, 3 in the 2-year plan, 4 in the 3-year plan).
      "service-plans-title": L("مد الضمان", "Extend your warranty"),
      "service-plans-1": L("تصليح أو تغيير", "Repair or replace"),
      "service-plans-2": L("زيارة فني في البيت", "Home visit"),
      "service-plans-3": L("لمبة بديلة وقت التصليح", "A loan lamp during repair"),
      "service-plans-4": L("كسر إزاز مرة واحدة", "One broken glass"),
      // `zaki`: the home page's five questions; the fifth is about paying.
      "faq-1-question": L("بتركّبوا النجفة اللي اشتريتها من عندكم؟", "Do you fit the chandelier I bought from you?"),
      "faq-1-answer": L(
        "أيوه في القاهرة والجيزة. احجز الفني وإنت بتطلب أو كلّمنا بعد ما الطلب يوصل، والأسعار في قايمة التركيب.",
        "Yes, in Cairo and Giza. Book the electrician with your order or message us once it arrives; prices are in the installation list.",
      ),
      "faq-2-question": L("اللمبات الذكية محتاجة جهاز تاني؟", "Do the smart bulbs need a hub?"),
      "faq-2-answer": L("لأ، بتشتغل على الواي فاي بتاع البيت وبتتحكم فيها من تطبيق على موبايلك.", "No, they run on your home Wi-Fi and you control them from an app on your phone."),
      "faq-3-question": L("أعرف مقاس النجفة المناسب إزاي؟", "How do I choose the right chandelier size?"),
      "faq-3-answer": L(
        "اجمع طول وعرض الأوضة بالمتر، والرقم ده تقريبًا هو قطر النجفة بالسنتي. ولو محتار ابعت لنا صورة.",
        "Add the room's length and width in metres: that number is roughly the chandelier's width in centimetres. If unsure, send us a photo.",
      ),
      "faq-4-question": L("الإزاز بيوصل سليم؟", "Does the glass arrive whole?"),
      "faq-4-answer": L("بنغلف كل قطعة بالفلين، ولو حاجة وصلت مكسورة صوّرها وإحنا نبدّلها.", "We pack every piece in foam, and if anything arrives broken, send us a photo and we replace it."),
      "faq-5-question": L("بدفع إمتى؟", "When do I pay?"),
      "faq-5-answer": L(
        "عند الاستلام كاش، أو بالكارت أو إنستاباي، ولو فيه تركيب بتدفعه للفني بعد ما يخلّص.",
        "On delivery in cash, or by card or InstaPay; installation is paid to the electrician once he finishes.",
      ),
    },
  },
  productPage: { copy: { reviews: L("من بيوت منوّرة", "From lit-up homes"), related: L("إضاءة تكمّل المكان", "Lighting to finish the room") } },
};
