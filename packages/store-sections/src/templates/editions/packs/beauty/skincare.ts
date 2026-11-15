/**
 * The skincare pack (niche editions, ROADMAP F-90): "Lamsa", a small
 * skincare shop of gentle cleansers, serums, moisturisers, sunscreen and
 * masks with short ingredient lists, made for Egyptian heat and humidity.
 * Data only; `pure` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: plain unlabelled containers, no people,
 * hands, lettering or logos), in the public `library-media` bucket,
 * `editions/skincare/`: twelve white-background packshots named by slug
 * and eight scenes as `scene-<slot>`. The sheet-mask packshot came back as
 * three sachets with a handful of travel minis, so the product is the
 * sheet-mask and minis set it shows.
 *
 * Look: `pure`, the niche's template (one template per niche). Its home
 * shows four best sellers, so `sold90` decides the four; it has no category
 * rows, so three products per category are enough. No `reviews`: a pack
 * holds no invented buyer quotes, and without them `pure` leaves its rating
 * section out. Its about page falls back to the story photo (no `about`).
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "skincare";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const SKINCARE: Edition = {
  niche: NICHE,
  looks: ["pure"],
  priceBand: { min: 150, max: 900 },
  // Square packshots on pure white: a square white stage shows each bottle whole, and every product reads as one shoot.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("لمسة", "Lamsa"),
    description: L("عناية بالبشرة بمكونات قليلة، معمولة لحر ورطوبة مصر.", "Skincare with short ingredient lists, made for Egyptian heat and humidity."),
    categories: [
      ["cleansers", "غسول وتونر", "Cleansers & toners", TILES[0]!],
      ["serums", "سيرم", "Serums", TILES[1]!],
      ["moisturisers", "مرطبات", "Moisturisers", TILES[2]!],
      ["sun-masks", "واقي شمس وماسكات", "Sunscreen & masks", TILES[3]!],
    ],
    products: [
      ["hyaluronic-serum", "serums", "سيرم هيالورونيك", "Hyaluronic Serum", P("hyaluronic-serum"), 520, { isFeatured: true, rating: 4.9, sold90: 342 }],
      ["foaming-face-cleanser", "cleansers", "غسول وش رغوي", "Foaming Face Cleanser", P("foaming-face-cleanser"), 290, { rating: 4.8, sold90: 298 }],
      ["sunscreen-spf-tube", "sun-masks", "واقي شمس SPF 50", "SPF 50 Sunscreen", P("sunscreen-spf-tube"), 380, { isFeatured: true, rating: 4.8, sold90: 276 }],
      ["day-cream-jar", "moisturisers", "كريم نهاري مرطب", "Daily Moisturising Cream", P("day-cream-jar"), 420, { rating: 4.7, sold90: 251 }],
      ["vitamin-c-serum", "serums", "سيرم فيتامين سي", "Vitamin C Serum", P("vitamin-c-serum"), 560, { rating: 4.7, sold90: 214 }],
      ["gel-cleanser-tube", "cleansers", "جل غسول خفيف", "Gentle Gel Cleanser", P("gel-cleanser-tube"), 260, { rating: 4.6, sold90: 168 }],
      ["open-gel-cream-jar", "moisturisers", "جل كريم خفيف", "Light Gel Cream", P("open-gel-cream-jar"), 450, { isFeatured: true, rating: 4.8, sold90: 157 }],
      ["niacinamide-serum", "serums", "سيرم نياسيناميد", "Niacinamide Serum", P("niacinamide-serum"), 480, { rating: 4.6, sold90: 149 }],
      ["clay-face-mask-jar", "sun-masks", "ماسك طين أخضر", "Green Clay Mask", P("clay-face-mask-jar"), 340, { rating: 4.5, sold90: 121 }],
      ["rose-water-toner", "cleansers", "تونر ماء الورد", "Rose Water Toner", P("rose-water-toner"), 220, { rating: 4.7, sold90: 133 }],
      ["eye-cream-tube", "moisturisers", "كريم تحت العين", "Eye Cream", P("eye-cream-tube"), 390, { rating: 4.5, sold90: 98 }],
      ["sheet-masks-set", "sun-masks", "طقم ماسكات شيت وعبوات سفر", "Sheet Masks and Travel Minis Set", P("sheet-masks-set"), 750, { compareAtPrice: 850, rating: 4.6, sold90: 86 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today (`pure` has no banner).
    banner: scene("banner"),
    // `pure`'s photo-and-list block on the home page, and its about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("ابعتي نوع بشرتك ونرشّحلك روتين", "Send us your skin type and we suggest a routine"),
    ],
    hero: {
      alt: L("زجاجة سيرم عسلي بقطّارة على بلاطة خضرا مبلولة", "An amber dropper bottle on a wet sea-glass green tile"),
      eyebrow: L("جديد · سيرم هيالورونيك", "New · Hyaluronic Serum"),
      title: L("بشرة مرتاحة من غير زيادات", "Calm skin, nothing extra"),
      line: L("غسول وسيرم وكريم وواقي شمس بمكونات قليلة، متجربين في صيف مصر.", "Cleanser, serum, cream and sunscreen with short ingredient lists, tested in Egyptian summers."),
      cta: L("تسوقي الجديد", "Shop new in"),
    },
    categories: { title: L("روتينك خطوة بخطوة", "Your routine, step by step") },
    products: {
      primary: {
        title: L("الأكثر مبيعاً", "Best sellers"),
        line: L("الأربع منتجات اللي معظم عميلاتنا بيبدأوا بيها.", "The four products most of our customers start with."),
      },
    },
    story: {
      alt: L("ورشة صغيرة فيها كاسات زجاج وأوراق صبار وطين في أطباق", "A small workshop with glass beakers, aloe leaves and clay in bowls"),
      eyebrow: L("في كل عبوة", "In every bottle"),
      title: L("مكونات قليلة، وكل واحد ليه سبب", "Few ingredients, each with a reason"),
      text: L("بنختار كل مكون عشان شغلته، ومش بنضيف عطر ولا ألوان.", "We choose every ingredient for its job, and add no fragrance or colour."),
      cta: L("اعرفي أكتر عن لمسة", "More about Lamsa"),
    },
    trust: [
      { title: L("توصيل لكل مصر", "Delivery across Egypt"), line: L("لحد باب البيت", "To your door") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفعي لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("المكونات كاملة", "Full ingredients"), line: L("مكتوبة في صفحة كل منتج", "Listed on every product page") },
      { title: L("نصيحة ببلاش", "Free advice"), line: L("ابعتي نوع بشرتك على واتساب", "Send your skin type on WhatsApp") },
    ],
    newsletter: {
      title: L("روتين الموسم في رسالة", "The season's routine in one letter"),
      line: L("رسالة كل شهر فيها روتين الصيف أو الشتا والمنتجات الجديدة.", "A monthly letter with the summer or winter routine and the new products."),
      note: L("بدون رسائل مزعجة. تقدري تلغي في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("مكونات قليلة، معمولة لجو مصر.", "Short ingredient lists, made for Egyptian weather.") },
    about: {
      line: L("محل عناية بالبشرة صغير، بنختار كل منتج بنفسنا.", "A small skincare shop where we choose every product ourselves."),
      alt: L("ورشة صغيرة فيها كاسات زجاج وأوراق صبار وطين في أطباق", "A small workshop with glass beakers, aloe leaves and clay in bowls"),
      eyebrow: L("من ٢٠٢٢", "Since 2022"),
      title: L("عناية تناسب جونا", "Care that suits our weather"),
      text: L(
        "معظم منتجات العناية معمولة لجو بارد وناشف. إحنا بنختار تركيبات خفيفة تستحمل حر ورطوبة مصر، ومن غير عطر.",
        "Most skincare is made for cool, dry climates. We pick light formulas that cope with Egyptian heat and humidity, and no fragrance.",
      ),
      more: L("ولو مش متأكدة من نوع بشرتك، ابعتيلنا ونرشحلك روتين بسيط.", "And if you are unsure of your skin type, message us and we suggest a simple routine."),
      cta: L("تسوقي الأكثر مبيعاً", "Shop best sellers"),
    },
    contact: {
      title: L("تواصلي معانا", "Contact us"),
      line: L("ابعتيلنا نوع بشرتك وأكتر حاجة مضايقاكي، ونرشحلك الخطوة الجاية.", "Send us your skin type and what bothers you most, and we suggest the next step."),
      heading: L("اسألي عن بشرتك", "Ask about your skin"),
    },
    faq: {
      line: L("المكونات والروتين والتوصيل.", "Ingredients, routine and delivery."),
      question: L("أبدأ بإيه لو أول مرة أعمل روتين؟", "Where do I start if it is my first routine?"),
      answer: L(
        "ابدئي بتلات خطوات: غسول الصبح وبالليل، كريم مرطب، وواقي شمس كل صباح. وبعد أسبوعين زوّدي سيرم واحد لأهم مشكلة.",
        "Start with three steps: cleanser morning and night, a moisturiser and sunscreen every morning. After two weeks, add one serum for your main concern.",
      ),
    },
    custom: {
      // `pure`: the store's short name inside "About …" (header, footer, about page).
      "store-short": L("لمسة", "Lamsa"),
      // `pure`: the four-step routine, one word and one short line each.
      "routine-title": L("مش عارفة تبدئي منين؟", "Not sure where to start?"),
      "routine-1-title": L("نضّفي", "Cleanse"),
      "routine-1-line": L("غسول الصبح وبالليل.", "Cleanser morning and night."),
      "routine-2-title": L("عالجي", "Treat"),
      "routine-2-line": L("سيرم واحد لأهم مشكلة.", "One serum for your main concern."),
      "routine-3-title": L("رطّبي", "Moisturise"),
      "routine-3-line": L("كريم خفيف يناسب الحر.", "A light cream that suits the heat."),
      "routine-4-title": L("احمي", "Protect"),
      "routine-4-line": L("واقي شمس كل صباح.", "Sunscreen every morning."),
      // `pure`: the story block's three points, one line each.
      "story-point-1": L("من غير عطر ولا ألوان", "No fragrance, no colour"),
      "story-point-2": L("تركيبات خفيفة تستحمل الحر", "Light formulas that cope with the heat"),
      "story-point-3": L("قائمة المكونات كاملة في صفحة كل منتج", "Full ingredient list on every page"),
    },
  },
  productPage: { copy: { reviews: L("تجارب بشرة حقيقية", "Real skin, real results"), related: L("تكمّل روتينك", "Complete your routine") } },
};
