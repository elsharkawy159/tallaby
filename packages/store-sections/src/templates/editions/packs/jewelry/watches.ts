/**
 * The watches pack (niche editions, ROADMAP F-90): an everyday watch shop,
 * "Daqiqa" (Arabic for "minute"), selling unbranded fashion watches and
 * generic smartwatches: men's, women's, smart and sport, classic and dress,
 * sixteen products in four categories of four. Honest materials: stainless
 * steel cases, Japanese-style quartz movements, mineral glass, leather,
 * mesh and silicone straps; the smartwatches are generic, with no brand.
 * Data only; the looks draw it.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("watches", <slug>)`), square, front view.
 *
 * Art-directed photos: Pexels, each checked by eye at 1500px, dials cropped
 * and read (2026-11-11): watches on wood, paper, satin and a watchmaker's
 * bench; no people, hands, wrists or other body parts, no brand names or
 * logos on dials, none used by a template or another pack, none twice.
 * Hero 190819 (wide: a steel chronograph on dark wood, no maker's name) and
 * 8327595 (tall, shown by no look: tweezers and a case knife on a white
 * bench, an open pocket watch out of focus).
 * Tiles: men's 34069486 (a steel watch with a speckled navy dial on a block
 * stand, window shadows on wood), women's 34833638 (a small rose-gold square
 * watch on a pearl bracelet among white petals), smart and sport 13610157 (a
 * rose-gold smartwatch with a sand strap, screen off, on a quilted cream
 * bag), classic and dress 5058216 (a white-dial watch on a brown leather
 * strap on an oak bench). Banner 437037 (a black smartwatch with a plain
 * analogue face on pale grey). Story 8327593 (an open pocket watch movement,
 * a case knife, a crystal and a spring-bar tool on a white bench; a stamp on
 * the knife is too small to read). About 8327579 (a
 * staking set and its punches on a worn wooden bench). `jewelry-luxe`
 * spotlight 31839434 (an open pocket watch beside dried flowers on white,
 * window light). Known and accepted: 31839434's dial reads "QUARTZ", a
 * generic word, no maker.
 *
 * Left out after the check (brand or maker's name on the dial unless
 * noted): 11732775 (Rhythm), 9640592 (Visetti), 31050003 (DW), 5659200,
 * 33168866 (Seiko), 8364554 and 8364549 (Lancer), 35989300 and 3829448 and
 * 13695978 (Fossil), 1697218, 20527951 (a flag logo), 33524465 (Casio),
 * 33806278, 128619 (Rodolphe), 5895627 (Rotate), 10345984, 16189380
 * (Titan), 5788857 (Leatherman), 1338587 (Michael Kors box), 33123551
 * (a crown logo on the box), 32339442 (lettering on the box), 8968349
 * (Paidu), 34150926, 34150929 and 34150930 (a polo logo on the sweater),
 * 29864943 (a lip tint label), 9969234 (a notebook cover), 1162519 (a
 * "Notes" cover), 3599101 (a book page), 5405624 (book text), 8327720
 * (handwriting), 4452383 (a tin label), 9713527, 13056976 and 8160609 (a
 * wrist or a hand), 5349810 and 11717815 (earbuds, a phone or a keyboard
 * with a maker's name). Already used by a template: 31406895, 39559134,
 * 18662969, 30707908, 13007642, 31406900, 37735294, 37735302, 29730990,
 * 3646165, 26626530, 30094119. Close to `saat`'s own box shoot (15019856),
 * so not used: 15019857, 15019859.
 *
 * Looks: `saat`, the niche's template (one template per niche, ROADMAP
 * F-90): its default content and demo are this pack, so the template and the
 * edition are one shop. `jewelry-luxe` still draws the pack until the
 * accessories switch takes it off (`distinct.test.ts` lists the niche as
 * pending). Four products per category, so every category row (`saat`'s
 * two, `jewelry-luxe`'s four) is one full row of four; the six-category
 * plan for `saat` v3 was dropped with its v4 redesign. No `reviews`: a pack
 * holds no invented buyer quotes.
 *
 * Saat v4 photos (2026-11-12, checked by eye): classic and dress tile
 * 5058216 (a white-dial watch on a brown strap on an oak bench, in place of
 * 1228514, a pink flat lay that fought the midnight and steel palette);
 * story 8327593 (an open pocket watch movement, a case knife, a crystal and
 * a spring-bar tool on the white bench, in place of 8327595, which moves to
 * the unused phone hero slot); campaign 437037 (the black smartwatch with an
 * analogue face, moved from the phone hero slot to `banner`). 5058216 and
 * 8327593 were saat v3's own photos and are used nowhere else now. Left
 * out: 1228517 (the blush banner, same reason as 1228514).
 */
import { L } from "../../../../designs/_kit";
import { demoStore, pexels } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const shot = (slug: string) => editionPhoto("watches", slug);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [
  pexels(34069486, 1200), // a steel watch with a speckled navy dial on a block stand, window shadows on wood
  pexels(34833638, 1200), // a small rose-gold square watch on a pearl bracelet among white petals
  pexels(13610157, 1200), // a rose-gold smartwatch with a sand strap on a quilted cream bag
  pexels(5058216, 1200), // a white-dial watch with rose-gold hands on a brown leather strap, on an oak bench
];

export const WATCHES: Edition = {
  niche: "watches",
  // `saat` first: the niche's template, built with this pack as its own content.
  looks: ["saat", "jewelry-luxe"],
  priceBand: { min: 600, max: 4500 },
  // Square packshots on pure white: a square white stage shows each watch whole, and every one reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("دقيقة", "Daqiqa"),
    description: L(
      "ساعات رجالي وحريمي وسمارت، ستانلس ستيل وماكينة كوارتز، بتوصلك لحد البيت.",
      "Men's, women's and smart watches in stainless steel with quartz movements, delivered to your door.",
    ),
    categories: [
      ["mens", "ساعات رجالي", "Men's watches", TILES[0]!],
      ["womens", "ساعات حريمي", "Women's watches", TILES[1]!],
      ["smart-sport", "سمارت ورياضية", "Smart and sport", TILES[2]!],
      ["classic-dress", "كلاسيك وسهرة", "Classic and dress", TILES[3]!],
    ],
    // The navy steel watch sells most (it leads `saat`'s best sellers). The three featured watches fill `jewelry-luxe`'s spotlight.
    products: [
      ["black-smartwatch-silicone-strap", "smart-sport", "ساعة سمارت سودا بأستيك سيليكون", "Black Smartwatch with Silicone Strap", shot("black-smartwatch-silicone-strap"), 1900, { rating: 4.6, sold90: 233 }],
      ["navy-dial-steel-watch", "mens", "ساعة ستيل بوش كحلي", "Navy Dial Steel Watch", shot("navy-dial-steel-watch"), 1850, { isFeatured: true, rating: 4.8, sold90: 286 }],
      ["rose-gold-mesh-womens-watch", "womens", "ساعة حريمي روز جولد بأستيك شبك", "Rose Gold Mesh Women's Watch", shot("rose-gold-mesh-womens-watch"), 1350, { isFeatured: true, rating: 4.8, sold90: 241 }],
      ["brown-leather-chronograph", "classic-dress", "ساعة كرونوغراف بأستيك جلد بني", "Brown Leather Chronograph", shot("brown-leather-chronograph"), 2450, { isFeatured: true, rating: 4.7, sold90: 147 }],
      ["black-mesh-minimal-watch", "mens", "ساعة سودا سادة بأستيك شبك", "Black Mesh Minimal Watch", shot("black-mesh-minimal-watch"), 1450, { rating: 4.7, sold90: 198 }],
      ["silver-pearl-dial-womens-watch", "womens", "ساعة حريمي فضي بوش صدف", "Silver Mother-of-Pearl Dial Women's Watch", shot("silver-pearl-dial-womens-watch"), 1750, { rating: 4.8, sold90: 163 }],
      ["pink-smartwatch", "smart-sport", "ساعة سمارت بمبي", "Pink Smartwatch", shot("pink-smartwatch"), 1900, { rating: 4.6, sold90: 187 }],
      ["gold-black-dial-leather-watch", "classic-dress", "ساعة دهبي بوش أسود وأستيك جلد", "Gold Watch with Black Dial and Leather Strap", shot("gold-black-dial-leather-watch"), 1700, { rating: 4.7, sold90: 176 }],
      ["silver-steel-white-dial-watch", "mens", "ساعة ستيل فضي بوش أبيض", "Silver Steel Watch with White Dial", shot("silver-steel-white-dial-watch"), 1650, { compareAtPrice: 1950, rating: 4.6, sold90: 174 }],
      ["gold-oval-womens-watch", "womens", "ساعة حريمي دهبي بوش بيضاوي", "Gold Oval Women's Watch", shot("gold-oval-womens-watch"), 1550, { compareAtPrice: 1800, rating: 4.7, sold90: 139 }],
      ["black-silicone-sport-watch", "smart-sport", "ساعة رياضية سودا بأستيك كاوتش", "Black Sport Watch with Rubber Strap", shot("black-silicone-sport-watch"), 1250, { rating: 4.5, sold90: 168 }],
      ["rose-gold-brown-leather-watch", "classic-dress", "ساعة روز جولد بأستيك جلد بني", "Rose Gold Watch with Brown Leather Strap", shot("rose-gold-brown-leather-watch"), 1500, { rating: 4.6, sold90: 131 }],
      ["two-tone-steel-watch", "mens", "ساعة ستيل فضي ودهبي", "Two-Tone Steel Watch", shot("two-tone-steel-watch"), 2100, { rating: 4.6, sold90: 121 }],
      ["burgundy-leather-womens-watch", "womens", "ساعة حريمي بأستيك جلد نبيتي", "Burgundy Leather Women's Watch", shot("burgundy-leather-womens-watch"), 1150, { rating: 4.5, sold90: 152 }],
      ["silver-smartwatch-mesh-strap", "smart-sport", "ساعة سمارت مدورة فضي بأستيك شبك", "Round Silver Smartwatch with Mesh Strap", shot("silver-smartwatch-mesh-strap"), 2600, { compareAtPrice: 2950, rating: 4.5, sold90: 112 }],
      ["white-ceramic-womens-watch", "classic-dress", "ساعة سيراميك أبيض", "White Ceramic Watch", shot("white-ceramic-womens-watch"), 2900, { rating: 4.8, sold90: 74 }],
    ],
  }),
  photos: {
    // `saat` and `jewelry-luxe` show the wide one: the chronograph sits near the middle, so square and 4:5 crops keep it.
    // Neither look shows `tall` (tweezers and a case knife on a white bench, an open pocket watch out of focus).
    hero: { wide: pexels(190819, 1920), tall: pexels(8327595, 1200) },
    tiles: TILES,
    // `saat`'s smartwatch campaign: a black smartwatch with an analogue face on pale grey (wide on desktop, tall on phones; centred).
    banner: pexels(437037, 1920),
    // An open pocket watch movement and the bench tools on white (`saat`'s wide story photo, `jewelry-luxe`'s story block).
    story: pexels(8327593, 1600),
    // A staking set on a worn wooden bench (`jewelry-luxe`'s about page).
    about: pexels(8327579, 1200),
    custom: {
      // `jewelry-luxe` spotlight, 4:5: an open pocket watch beside dried flowers on white.
      "spot-photo": pexels(31839434, 1200),
    },
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("ضبط مقاس الأستيك ببلاش قبل الشحن", "Free strap sizing before we ship"),
    ],
    labels: { about: L("عن دقيقة", "About Daqiqa"), search: L("دوّر على ساعة", "Search for a watch") },
    // `saat`'s two header links: the whole catalog (also where the hero's and the about page's buttons go), then the smartwatches.
    nav: [
      { label: L("الساعات", "Watches"), href: "/products" },
      { label: L("سمارت", "Smart"), href: search("سمارت") },
    ],
    hero: {
      alt: L("ساعة كرونوغراف ستيل على خشب غامق", "A steel chronograph on dark wood"),
      eyebrow: L("ضمان سنة على الماكينة", "One-year movement warranty"),
      title: L("ساعتك لكل يوم", "A watch for every day"),
      line: L(
        "ساعات رجالي وحريمي وسمارت، ستانلس ستيل وماكينة كوارتز، ونظبط لك مقاس الأستيك قبل ما نشحن.",
        "Men's, women's and smart watches in stainless steel with quartz movements, and we size the strap before we ship.",
      ),
      cta: L("تسوّق الساعات", "Shop watches"),
    },
    categories: { title: L("اختار ساعتك", "Choose your watch") },
    products: {
      primary: {
        alt: L("ساعة جيب مفتوحة جنب ورد مجفف على قماش أبيض", "An open pocket watch beside dried flowers on white cloth"),
        eyebrow: L("اختياراتنا", "Our picks"),
        // Read by both looks: over the four best sellers (`saat`) and over the three featured watches (`jewelry-luxe`), so it names no number.
        title: L("الساعات اللي بتخلص بسرعة", "The watches that sell fastest"),
        line: L(
          "ساعة ستيل بوش كحلي، وروز جولد بأستيك شبك، وكرونوغراف بجلد بني: تلبسهم في الشغل وفي الخروجة.",
          "A steel watch with a navy dial, a rose gold mesh watch and a chronograph on brown leather: for work and for going out.",
        ),
        cta: L("كل الأكثر طلبًا", "All best sellers"),
      },
    },
    story: {
      alt: L("ماكينة ساعة جيب مفتوحة وأدوات الصيانة على ترابيزة بيضا", "An open pocket watch movement and repair tools on a white bench"),
      eyebrow: L("قبل ما تتشحن", "Before it ships"),
      title: L("كل ساعة بتتراجع وتتظبط", "Every watch is checked and set"),
      text: L(
        "بنشغّل الماكينة ونظبط الوقت والتاريخ، ونشيل حلقات من الأستيك الستيل على المقاس اللي تقولنا عليه. وبعدين الساعة بتتغلف في علبتها.",
        "We start the movement, set the time and date, and take links out of a steel bracelet to the size you tell us. Then the watch goes into its box.",
      ),
      cta: L("اعرف حكايتنا", "Read our story"),
    },
    trust: [
      { title: L("توصيل لحد الباب", "Delivered to your door"), line: L("لأي محافظة في مصر", "To any governorate in Egypt") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الساعة توصلك", "Pay when your watch arrives") },
      { title: L("ضمان سنة", "One-year warranty"), line: L("على الماكينة من يوم الشراء", "On the movement from the day you buy") },
      { title: L("استبدال سهل", "Easy exchange"), line: L("خلال ١٤ يوم لو الساعة متلبستش", "Within 14 days if the watch is unworn") },
    ],
    newsletter: {
      title: L("اعرف الموديلات الجديدة أول واحد", "See new watches first"),
      line: L("رسالة واحدة في الشهر: الساعات الجديدة ونصايح تختار بيها المقاس واللون.", "One letter a month: new watches and tips on choosing the size and colour."),
      note: L("من غير رسايل كتير. تقدر تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: {
      line: L(
        "ساعات رجالي وحريمي وسمارت بضمان سنة على الماكينة، وضبط الأستيك ببلاش، وبتوصلك لحد البيت.",
        "Men's, women's and smart watches with a one-year movement warranty and free strap sizing, delivered to your door.",
      ),
    },
    about: {
      line: L("ساعات حلوة بأسعار معقولة، من غير ما تدفع تمن اسم.", "Good-looking watches at fair prices, without paying for a name."),
      alt: L("طقم أدوات لتركيب المسامير على ترابيزة صيانة خشب", "A staking set on a worn wooden workbench"),
      eyebrow: L("مين إحنا", "Who we are"),
      title: L("ساعات بنختارها ونظبطها بنفسنا", "Watches we choose and set ourselves"),
      text: L(
        "بدأنا دقيقة عشان نلاقي ساعة شكلها شيك وسعرها في المتناول. بنختار علب ستانلس ستيل وماكينات كوارتز وزجاج مينرال، ونجرب كل موديل كام أسبوع قبل ما ننزله.",
        "We started Daqiqa to find watches that look sharp at a sensible price. We choose stainless steel cases, quartz movements and mineral glass, and wear each model for a few weeks before we list it.",
      ),
      more: L(
        "ومش بنقول على حاجة إنها ماركة وهي مش كده: ساعاتنا من غير اسم، والسمارت واتش بتاعتنا عامة، ومواصفات كل ساعة مكتوبة في صفحتها.",
        "And we never pass anything off as a brand: our watches carry no name, our smartwatches are generic, and each product page lists the specs.",
      ),
      cta: L("تسوّق الساعات", "Shop watches"),
    },
    contact: {
      title: L("كلّمنا", "Talk to us"),
      line: L(
        "ابعت لنا مقاس إيدك بالسنتي أو صورة ساعتك القديمة، ونرشح لك المقاس واللون المناسب.",
        "Send us your wrist size in centimetres or a photo of your old watch, and we suggest the right size and colour.",
      ),
      heading: L("اسأل عن ساعة أو عن طلبك", "Ask about a watch or your order"),
    },
    faq: {
      line: L("الضمان والمقاسات والتوصيل.", "Warranty, sizing and delivery."),
      question: L("الأستيك هيبقى على مقاس إيدي؟", "Will the strap fit my wrist?"),
      answer: L(
        "الجلد والسيليكون فيهم خُرم كتير ويتظبطوا لوحدك. الأستيك الستيل اكتب لنا مقاس إيدك بالسنتي في ملاحظات الطلب، ونشيل الحلقات الزيادة قبل الشحن ونبعتها معاك.",
        "Leather and silicone straps have plenty of holes and adjust on their own. For a steel bracelet, write your wrist size in centimetres in the order notes, and we remove the extra links before shipping and send them with the watch.",
      ),
    },
    custom: {
      // `jewelry-luxe`: the link to the whole catalog (header, footer, the spotlight's "view all").
      "shop-all": L("كل الساعات", "All watches"),
      // `saat`: the hero's second button, to the contact page.
      "hero-cta-2": L("اسأل عن المقاس", "Ask about sizing"),
      // `saat` price menu: a title and one line, then three groups (a title, then rows of a service and its price: 3, 2 and 2 rows).
      "service-title": L("أسعار الصيانة", "Service prices"),
      "service-line": L("لأي ساعة، مش بس اللي اشتريتها مننا. اسألنا على واتساب قبل ما تبعتها.", "For any watch, not only ours. Ask us on WhatsApp before you send it in."),
      "service-1-title": L("البطارية والضبط", "Battery and setting"),
      "service-1-1-name": L("تغيير بطارية", "Battery change"),
      "service-1-1-price": L("١٠٠ جنيه", "EGP 100"),
      "service-1-2-name": L("ضبط الوقت والتاريخ", "Time and date setting"),
      "service-1-2-price": L("ببلاش", "Free"),
      "service-1-3-name": L("اختبار ضد المية", "Water resistance test"),
      "service-1-3-price": L("١٥٠ جنيه", "EGP 150"),
      "service-2-title": L("الأستيك", "Straps"),
      "service-2-1-name": L("شيل حلقات الأستيك الستيل", "Steel bracelet link removal"),
      "service-2-1-price": L("ببلاش", "Free"),
      "service-2-2-name": L("تركيب أستيك جلد أو سيليكون", "Leather or silicone strap fitting"),
      "service-2-2-price": L("٥٠ جنيه", "EGP 50"),
      "service-3-title": L("الصيانة", "Servicing"),
      "service-3-1-name": L("تغيير زجاج مينرال", "Mineral glass replacement"),
      "service-3-1-price": L("٢٥٠ جنيه", "EGP 250"),
      "service-3-2-name": L("صيانة ماكينة كوارتز", "Quartz movement service"),
      "service-3-2-price": L("٣٥٠ جنيه", "EGP 350"),
      // `saat`: the campaign beside the smart and sport row, on `photos.banner`; its button goes to `nav.1` (the smartwatches).
      "banner-alt": L("ساعة سمارت سودا شاشتها عليها وش بعقارب، على سطح رمادي فاتح", "A black smartwatch showing a face with hands, on pale grey"),
      "banner-eyebrow": L("عقارب ولا سمارت؟", "Hands or smart?"),
      "banner-title": L("سمارت وشكلها ساعة", "Smart, and still a watch"),
      "banner-line": L("وشها بعقارب لو حبيت، بتعد خطواتك، وبطاريتها بتكفي ٥ أيام.", "A face with hands if you like, a step counter, and a battery that lasts five days."),
      "banner-cta": L("تسوّق السمارت", "Shop smartwatches"),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي لبسوها", "From people who wear it"), related: L("ساعات تانية هتعجبك", "More watches you may like") } },
};
