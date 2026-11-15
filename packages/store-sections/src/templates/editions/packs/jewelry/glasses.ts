/**
 * The glasses pack (niche editions, ROADMAP F-90): "Bossa", an eyewear shop
 * with colourful sunglasses, optical frames, blue-light glasses and sport
 * and kids pairs at friendly prices. Data only; `karat` draws it.
 *
 * Packshots: the generated white-background set in the `library-media`
 * bucket (`editionPhoto("glasses", <slug>)`), square, one angle.
 *
 * Art-directed photos: generated from `docs/systems/editions-photos.md`
 * (received 2026-11-15, checked by eye: no people, hands, lettering or
 * logos), in the same bucket as `scene-<slot>`: hero, tiles, story, the
 * lookbook and story rings 5 to 8. Still Pexels, drawn by no look: hero tall
 * 12693047 and banner 1313064 (karat shows neither).
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
const scene = (slot: string) => editionPhoto("glasses", `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const GLASSES: Edition = {
  niche: "glasses",
  looks: ["karat"],
  priceBand: { min: 250, max: 1500 },
  // Square packshots on pure white: a square white stage shows them whole, and every frame reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("بُصّة", "Bossa"),
    description: L("نظارات شمس وإطارات طبية ونظارات للحماية من الضوء الأزرق.", "Sunglasses, optical frames and blue-light glasses."),
    categories: [
      ["sunglasses", "نظارات شمس", "Sunglasses", TILES[0]!],
      ["optical", "إطارات طبية", "Optical frames", TILES[1]!],
      ["blue-light", "نظارات الضوء الأزرق", "Blue-light glasses", TILES[2]!],
      ["sport-kids", "رياضية وأطفال", "Sport and kids", TILES[3]!],
    ],
    // Newest first (karat's shelf opens on the newest).
    products: [
      ["gold-round-optical-frame", "optical", "إطار نظارة طبية دائري ذهبي", "Gold Round Optical Frame", shot("gold-round-optical-frame"), 600, { isFeatured: true, rating: 4.9, sold90: 187 }],
      ["round-tortoise-sunglasses", "sunglasses", "نظارة شمس دائرية بنقشة الصدف", "Round Tortoiseshell Sunglasses", shot("round-tortoise-sunglasses"), 450, { isFeatured: true, rating: 4.8, sold90: 264 }],
      ["rose-gold-cat-eye-blue-light-glasses", "blue-light", "نظارة للضوء الأزرق بشكل عين القطة ذهبي وردي", "Rose Gold Cat-Eye Blue-Light Glasses", shot("rose-gold-cat-eye-blue-light-glasses"), 420, { rating: 4.7, sold90: 129 }],
      ["gold-aviator-sunglasses", "sunglasses", "نظارة شمس بتصميم الطيّار ذهبية بعدسات خضراء", "Gold Aviator Sunglasses", shot("gold-aviator-sunglasses"), 520, { isFeatured: true, compareAtPrice: 650, rating: 4.6, sold90: 178 }],
      ["kids-sky-blue-flexible-frame", "sport-kids", "نظارة أطفال مرنة أزرق سماوي", "Kids Sky Blue Flexible Frame", shot("kids-sky-blue-flexible-frame"), 320, { rating: 4.8, sold90: 141 }],
      ["black-square-sunglasses", "sunglasses", "نظارة شمس مربعة سوداء", "Black Square Sunglasses", shot("black-square-sunglasses"), 420, { rating: 4.7, sold90: 231 }],
      ["clear-crystal-optical-frame", "optical", "إطار نظارة طبية شفاف", "Clear Crystal Optical Frame", shot("clear-crystal-optical-frame"), 580, { rating: 4.5, sold90: 96 }],
      ["black-round-blue-light-glasses", "blue-light", "نظارة للضوء الأزرق دائرية سوداء", "Black Round Blue-Light Glasses", shot("black-round-blue-light-glasses"), 380, { rating: 4.6, sold90: 243 }],
      ["black-red-sport-sunglasses", "sport-kids", "نظارة شمس رياضية سوداء بعدسات حمراء", "Black Sport Sunglasses with Red Lenses", shot("black-red-sport-sunglasses"), 480, { rating: 4.6, sold90: 117 }],
      ["black-rectangle-optical-frame", "optical", "إطار نظارة طبية مستطيل أسود", "Black Rectangular Optical Frame", shot("black-rectangle-optical-frame"), 550, { rating: 4.7, sold90: 152 }],
      ["tortoise-square-blue-light-glasses", "blue-light", "نظارة للضوء الأزرق مربعة بنقشة الصدف", "Tortoiseshell Square Blue-Light Glasses", shot("tortoise-square-blue-light-glasses"), 390, { rating: 4.5, sold90: 158 }],
      ["white-shield-cycling-sunglasses", "sport-kids", "نظارة دراجات بيضاء بعدسة زرقاء", "White Cycling Sunglasses with Blue Shield Lens", shot("white-shield-cycling-sunglasses"), 520, { compareAtPrice: 620, rating: 4.4, sold90: 83 }],
      ["red-cat-eye-sunglasses", "sunglasses", "نظارة شمس بشكل عين القطة حمراء", "Red Cat-Eye Sunglasses", shot("red-cat-eye-sunglasses"), 440, { rating: 4.5, sold90: 146 }],
      ["tortoise-browline-optical-frame", "optical", "إطار نظارة طبية بنصف إطار بنقشة الصدف", "Tortoiseshell Browline Optical Frame", shot("tortoise-browline-optical-frame"), 620, { rating: 4.6, sold90: 112 }],
      ["navy-rectangle-blue-light-glasses", "blue-light", "نظارة للضوء الأزرق مستطيلة كحلية", "Navy Rectangular Blue-Light Glasses", shot("navy-rectangle-blue-light-glasses"), 400, { rating: 4.6, sold90: 137 }],
      ["kids-pink-round-sunglasses", "sport-kids", "نظارة شمس أطفال دائرية وردية", "Kids Pink Round Sunglasses", shot("kids-pink-round-sunglasses"), 260, { rating: 4.7, sold90: 124 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: pexels(12693047, 1200) },
    tiles: TILES,
    // Karat shows no banner; the pack still holds one.
    banner: pexels(1313064, 1920),
    // The about page.
    story: scene("story"),
    custom: {
      // `karat` lookbook, square: one large photo, then four small ones (subjects centred: the bento and the rings crop to the middle).
      "lookbook-1": scene("lookbook-1"), // black round glasses on a beige upholstered chair, a plum cushion edge
      "lookbook-2": scene("lookbook-2"), // a black rectangular frame on a mustard plinth against blush
      "lookbook-3": scene("lookbook-3"), // a black double-bridge frame on pale pink paper, a window shadow
      "lookbook-4": scene("lookbook-4"), // a black cat-eye frame on deep plum paper
      "lookbook-5": scene("lookbook-5"), // mirrored lenses reflecting a blue sky, on sand
      // `karat` story rings 5 to 8 (rings 1 to 4 show the category tiles).
      "stories-5": scene("stories-5"), // round sunglasses with blue mirrored lenses on blush
      "stories-6": scene("stories-6"), // a dark round frame on pale linen
      "stories-7": scene("stories-7"), // round black glasses on a beige seat
      "stories-8": scene("stories-8"), // a thin gold frame on a wood desk beside a notebook and a pencil
    },
  },
  copy: {
    announcement: [
      L("نظارات شمس وإطارات طبية", "Sunglasses and optical frames"),
      L("مقاسات العدسة والجسر لكل إطار", "Lens and bridge sizes for every frame"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { about: L("عن بُصّة", "About Bossa"), search: L("ابحث عن نظارة", "Search for a pair") },
    hero: {
      alt: L("ثلاث نظارات بالصدفي والذهبي والبنفسجي على ورق وردي", "Three frames, tortoiseshell, gold and plum, on blush paper"),
      eyebrow: L("نظارات ملوّنة", "Colourful glasses"),
      title: L("نظارات بألوان متعددة", "Glasses in many colours"),
      line: L("نظارات شمس وإطارات طبية ونظارات للضوء الأزرق.", "Sunglasses, optical frames and blue-light glasses."),
      cta: L("تصفّح الجديد", "See what's new"),
    },
    categories: { title: L("تسوّق حسب النوع", "Shop by type") },
    products: {
      primary: {
        // The shelf's title, over its tabs.
        title: L("النظارات الأكثر طلبًا", "Our most-ordered pairs"),
        line: L("إطار طبي خفيف ونظارة شمس كلاسيكية وأخرى بتصميم الطيّار.", "A light optical frame, a classic pair of sunglasses and a gold aviator."),
      },
    },
    story: {
      alt: L("نظارة بإطار أسود وبنفسجي على ورق وردي بجوار قبعة قش", "Black and purple frames on pink paper beside a straw hat"),
      eyebrow: L("لكل استخدام", "For every use"),
      title: L("نظارة لكل استخدام", "A pair for every use"),
      text: L(
        "نظارات ملوّنة للشاطئ، وهادئة للعمل، ونظارات للضوء الأزرق أمام الشاشة.",
        "Bright pairs for the beach, quiet ones for work and blue-light glasses for the screen.",
      ),
      cta: L("من نحن", "About us"),
    },
    trust: [
      { title: L("مقاسات واضحة", "Clear sizes"), line: L("مقاس العدسة والجسر لكل إطار", "Lens and bridge sizes for every frame") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("شمس وطبي وللضوء الأزرق", "Sun, optical and blue-light") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("الألوان الجديدة أولًا بأول", "New colours as they land"),
      line: L("رسالة كل أسبوعين فيها الألوان والأشكال الجديدة.", "A letter every two weeks with the new colours and shapes."),
      note: L("بدون رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("بُصّة: نظارات شمس وإطارات طبية ملوّنة.", "Bossa: colourful sunglasses and optical frames.") },
    about: {
      line: L("نظارات ملوّنة بأسعار مناسبة.", "Colourful glasses at friendly prices."),
      alt: L("نظارة بإطار أسود وبنفسجي على ورق وردي بجوار قبعة قش", "Black and purple frames on pink paper beside a straw hat"),
      eyebrow: L("من نحن", "About us"),
      title: L("النظارة إكسسوار وليست عدسة فقط", "Glasses are an accessory, not just lenses"),
      text: L(
        "بُصّة متجر لنظارات الشمس والإطارات الطبية ونظارات الضوء الأزرق. نختار ألوانًا وأشكالًا متعددة، ونذكر مقاسات كل إطار في صفحته.",
        "Bossa sells sunglasses, optical frames and blue-light glasses. We pick many colours and shapes, and list each frame's sizes on its page.",
      ),
      more: L("ولأي سؤال عن المقاس أو اللون، تواصل معنا.", "For any question about size or colour, contact us."),
      cta: L("تصفّح الجديد", "See what's new"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي إطار أو لون أو مقاس.", "Ask us about any frame, colour or size."),
      heading: L("اسأل عن لون أو مقاس", "Ask about a colour or a size"),
    },
    faq: {
      line: L("العدسات والمقاسات وطريقة الطلب.", "Lenses, sizes and ordering."),
      question: L("هل يمكن تركيب عدسات طبية في الإطار؟", "Can prescription lenses be fitted in a frame?"),
      answer: L(
        "نعم، يمكن لأي محل بصريات تركيب العدسات الطبية في الإطارات الطبية ونظارات الضوء الأزرق، ومقاس العدسة والجسر مذكور في صفحة كل إطار.",
        "Yes, any optician can fit your prescription lenses in our optical and blue-light frames. The lens and bridge sizes are on each frame's page.",
      ),
    },
    custom: {
      // `karat`: the store's short name inside a sentence.
      "store-short": L("بُصّة", "Bossa"),
      // `karat`: the hero's small line and its round sticker (a price point, not an offer).
      "hero-note": L("ألوان الموسم", "Colours of the season"),
      "hero-sticker-1": L("من", "From"),
      "hero-sticker-2": L("٢٦٠", "260"),
      "hero-sticker-3": L("جنيه", "EGP"),
      // `karat`: the eight story rings. 1 to 4 show the category tiles, in the categories' order.
      "stories-1": L("شمس", "Sun"),
      "stories-2": L("طبي", "Optical"),
      "stories-3": L("للشاشة", "Screen"),
      "stories-4": L("للأطفال", "Little ones"),
      "stories-5": L("مرايا", "Mirror lens"),
      "stories-6": L("إطار أسود", "Black frame"),
      "stories-7": L("مدوّرة", "Round"),
      "stories-8": L("للمكتب", "Desk days"),
      // `karat`: the lookbook's brand tile. No invented handle: the seller's own replaces it.
      "lookbook-handle": L("بُصّة على Instagram", "Bossa on Instagram"),
      "lookbook-line": L("صور من تشكيلتنا", "Photos from our range"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("نظارات قد تعجبك", "More pairs you may like") } },
};
