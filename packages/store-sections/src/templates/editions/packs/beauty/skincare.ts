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
    description: L("منتجات العناية بالبشرة: غسول وسيرم ومرطبات وواقي شمس.", "Skincare: cleansers, serums, moisturisers and sunscreen."),
    categories: [
      ["cleansers", "غسول وتونر", "Cleansers & toners", TILES[0]!],
      ["serums", "سيرم", "Serums", TILES[1]!],
      ["moisturisers", "مرطبات", "Moisturisers", TILES[2]!],
      ["sun-masks", "واقي شمس وأقنعة", "Sunscreen & masks", TILES[3]!],
    ],
    products: [
      ["hyaluronic-serum", "serums", "سيرم هيالورونيك", "Hyaluronic Serum", P("hyaluronic-serum"), 520, { isFeatured: true, rating: 4.9, sold90: 342 }],
      ["foaming-face-cleanser", "cleansers", "غسول وجه رغوي", "Foaming Face Cleanser", P("foaming-face-cleanser"), 290, { rating: 4.8, sold90: 298 }],
      ["sunscreen-spf-tube", "sun-masks", "واقي شمس SPF 50", "SPF 50 Sunscreen", P("sunscreen-spf-tube"), 380, { isFeatured: true, rating: 4.8, sold90: 276 }],
      ["day-cream-jar", "moisturisers", "كريم نهاري مرطب", "Daily Moisturising Cream", P("day-cream-jar"), 420, { rating: 4.7, sold90: 251 }],
      ["vitamin-c-serum", "serums", "سيرم فيتامين C", "Vitamin C Serum", P("vitamin-c-serum"), 560, { rating: 4.7, sold90: 214 }],
      ["gel-cleanser-tube", "cleansers", "جل غسول خفيف", "Gentle Gel Cleanser", P("gel-cleanser-tube"), 260, { rating: 4.6, sold90: 168 }],
      ["open-gel-cream-jar", "moisturisers", "جل كريم خفيف", "Light Gel Cream", P("open-gel-cream-jar"), 450, { isFeatured: true, rating: 4.8, sold90: 157 }],
      ["niacinamide-serum", "serums", "سيرم نياسيناميد", "Niacinamide Serum", P("niacinamide-serum"), 480, { rating: 4.6, sold90: 149 }],
      ["clay-face-mask-jar", "sun-masks", "قناع طين أخضر", "Green Clay Mask", P("clay-face-mask-jar"), 340, { rating: 4.5, sold90: 121 }],
      ["rose-water-toner", "cleansers", "تونر ماء الورد", "Rose Water Toner", P("rose-water-toner"), 220, { rating: 4.7, sold90: 133 }],
      ["eye-cream-tube", "moisturisers", "كريم تحت العين", "Eye Cream", P("eye-cream-tube"), 390, { rating: 4.5, sold90: 98 }],
      ["sheet-masks-set", "sun-masks", "طقم أقنعة ورقية وعبوات سفر", "Sheet Masks and Travel Minis Set", P("sheet-masks-set"), 750, { compareAtPrice: 850, rating: 4.6, sold90: 86 }],
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
      L("منتجات العناية بالبشرة بمكونات واضحة", "Skincare with clear ingredient lists"),
      L("المكونات كاملة في صفحة كل منتج", "Full ingredients on every product page"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    hero: {
      alt: L("زجاجة سيرم عسلية بقطّارة على بلاطة خضراء مبللة", "An amber dropper bottle on a wet sea-glass green tile"),
      eyebrow: L("جديد · سيرم هيالورونيك", "New · Hyaluronic Serum"),
      title: L("عناية بالبشرة بمكونات قليلة", "Skincare with few ingredients"),
      line: L("غسول وسيرم وكريم وواقي شمس بقائمة مكونات قصيرة.", "Cleanser, serum, cream and sunscreen with short ingredient lists."),
      cta: L("تسوّق الجديد", "Shop new in"),
    },
    categories: { title: L("روتين العناية خطوة بخطوة", "Your routine, step by step") },
    products: {
      primary: {
        title: L("الأكثر مبيعاً", "Best sellers"),
        line: L("منتجات أساسية لبداية روتين العناية.", "Essentials to start a skincare routine."),
      },
    },
    story: {
      alt: L("أوانٍ زجاجية وأوراق صبار وطين في أطباق", "Glass beakers, aloe leaves and clay in bowls"),
      eyebrow: L("في كل عبوة", "In every bottle"),
      title: L("مكونات قليلة لكل منها دور", "Few ingredients, each with a role"),
      text: L("نختار كل مكوّن لوظيفته، ونذكر المكونات كاملة لكل منتج.", "We choose every ingredient for its role, and list the full ingredients of every product."),
      cta: L("اعرف المزيد عن لمسة", "More about Lamsa"),
    },
    trust: [
      { title: L("صور ومواصفات", "Photos and details"), line: L("لكل منتج صوره ومواصفاته", "Photos and details for every product") },
      { title: L("تشكيلة للروتين كله", "A full routine"), line: L("غسول وسيرم ومرطب وواقي شمس", "Cleanser, serum, moisturiser and sunscreen") },
      { title: L("المكونات كاملة", "Full ingredients"), line: L("مكتوبة في صفحة كل منتج", "Listed on every product page") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("روتين الموسم في رسالة", "The season's routine in one letter"),
      line: L("رسالة شهرية عن روتين كل موسم والمنتجات الجديدة.", "A monthly letter on each season's routine and new products."),
      note: L("بدون رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.", "No spam. Unsubscribe any time."),
    },
    footer: { line: L("منتجات عناية بالبشرة بمكونات قليلة.", "Skincare with short ingredient lists.") },
    about: {
      line: L("متجر لمنتجات العناية بالبشرة، نختار كل منتج بعناية.", "A skincare shop where we choose every product with care."),
      alt: L("أوانٍ زجاجية وأوراق صبار وطين في أطباق", "Glass beakers, aloe leaves and clay in bowls"),
      eyebrow: L("عن لمسة", "About Lamsa"),
      title: L("تركيبات خفيفة بمكونات واضحة", "Light formulas, clear ingredients"),
      text: L(
        "نختار غسولات وسيرمات ومرطبات وواقيات شمس بتركيبات خفيفة، ونذكر قائمة المكونات كاملة في صفحة كل منتج.",
        "We choose cleansers, serums, moisturisers and sunscreens with light formulas, and list the full ingredients on every product page.",
      ),
      more: L("ولأي سؤال عن المنتجات، تواصل معنا.", "For any question about our products, contact us."),
      cta: L("تسوّق الأكثر مبيعًا", "Shop best sellers"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي منتج أو طريقة استخدامه.", "Ask us about any product or how to use it."),
      heading: L("اسأل عن منتجاتنا", "Ask about our products"),
    },
    faq: {
      line: L("المكونات والروتين وطريقة الطلب.", "Ingredients, routine and ordering."),
      question: L("بماذا أبدأ في أول روتين للعناية؟", "Where do I start if it is my first routine?"),
      answer: L(
        "ابدأ بثلاث خطوات: غسول صباحًا ومساءً، وكريم مرطب، وواقي شمس كل صباح. ويمكنك بعد ذلك إضافة سيرم واحد.",
        "Start with three steps: cleanser morning and night, a moisturiser, and sunscreen every morning. You can then add one serum.",
      ),
    },
    custom: {
      // `pure`: the store's short name inside "About …" (header, footer, about page).
      "store-short": L("لمسة", "Lamsa"),
      // `pure`: the four-step routine, one word and one short line each.
      "routine-title": L("من أين تبدأ؟", "Where to start?"),
      "routine-1-title": L("التنظيف", "Cleanse"),
      "routine-1-line": L("غسول صباحًا ومساءً.", "Cleanser morning and night."),
      "routine-2-title": L("السيرم", "Serum"),
      "routine-2-line": L("سيرم واحد حسب احتياجك.", "One serum for your needs."),
      "routine-3-title": L("الترطيب", "Moisturise"),
      "routine-3-line": L("كريم مرطب خفيف.", "A light moisturising cream."),
      "routine-4-title": L("الحماية", "Protect"),
      "routine-4-line": L("واقي شمس كل صباح.", "Sunscreen every morning."),
      // `pure`: the story block's three points, one line each.
      "story-point-1": L("مكونات قليلة وواضحة", "Few, clear ingredients"),
      "story-point-2": L("تركيبات خفيفة", "Light formulas"),
      "story-point-3": L("قائمة المكونات كاملة في صفحة كل منتج", "Full ingredient list on every page"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("أكمل روتينك", "Complete your routine") } },
};
