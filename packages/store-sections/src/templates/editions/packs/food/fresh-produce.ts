/**
 * The fresh produce pack (niche editions, ROADMAP F-90): "Ghait", a fruit
 * and vegetable shop of vegetables, fruits, greens and herbs, and boxes and
 * bundles, bought from farmers every dawn and delivered the same day. Data
 * only; `khodar` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: no people, hands, labels or logos), in the
 * public `library-media` bucket, `editions/fresh-produce/`: twelve
 * white-background packshots named by slug and eight scenes as
 * `scene-<slot>`.
 *
 * Look: `khodar`, the niche's template (one template per niche). Its hero is
 * a search box; the home shows the category tiles, six best sellers in
 * compact rows and the same-day promise (`custom.promise-*`); no category
 * rows, so three products per category are enough. No `reviews`: a pack
 * holds no invented buyer quotes, and without them `khodar` leaves its quote
 * out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "fresh-produce";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const FRESH_PRODUCE: Edition = {
  niche: NICHE,
  looks: ["khodar"],
  priceBand: { min: 10, max: 600 },
  // Square packshots on pure white: a square white stage shows each pile whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("غيط", "Ghait"),
    description: L("خضروات وفاكهة وورقيات وصناديق مشكلة.", "Vegetables, fruit, greens and mixed boxes."),
    categories: [
      ["vegetables", "خضروات", "Vegetables", TILES[0]!],
      ["fruits", "فاكهة", "Fruits", TILES[1]!],
      ["greens", "ورقيات وأعشاب", "Greens & herbs", TILES[2]!],
      ["boxes", "صناديق مشكلة", "Boxes & bundles", TILES[3]!],
    ],
    products: [
      ["ripe-tomatoes", "vegetables", "طماطم (١ كيلو)", "Ripe Tomatoes, 1 kg", P("ripe-tomatoes"), 25, { isFeatured: true, rating: 4.8, sold90: 512 }],
      ["egyptian-mangoes", "fruits", "مانجا مصري (١ كيلو)", "Egyptian Mangoes, 1 kg", P("egyptian-mangoes"), 70, { isFeatured: true, rating: 4.9, sold90: 388 }],
      ["molokhia-leaves-bunch", "greens", "ملوخية خضراء (حزمة)", "Fresh Molokhia, Bunch", P("molokhia-leaves-bunch"), 15, { rating: 4.7, sold90: 341 }],
      ["salad-veg-box", "boxes", "بوكس السلطة", "Salad Box", P("salad-veg-box"), 180, { isFeatured: true, rating: 4.8, sold90: 196 }],
      ["baladi-cucumbers", "vegetables", "خيار بلدي (١ كيلو)", "Baladi Cucumbers, 1 kg", P("baladi-cucumbers"), 20, { rating: 4.7, sold90: 466 }],
      ["fresh-guavas", "fruits", "جوافة (١ كيلو)", "Guavas, 1 kg", P("fresh-guavas"), 35, { rating: 4.6, sold90: 254 }],
      ["parsley-dill-bunch", "greens", "بقدونس وشبت (حزمتان)", "Parsley and Dill, 2 Bunches", P("parsley-dill-bunch"), 12, { rating: 4.7, sold90: 402 }],
      ["fruit-mix-basket", "boxes", "سلة فاكهة مشكلة", "Mixed Fruit Basket", P("fruit-mix-basket"), 350, { rating: 4.8, sold90: 121 }],
      ["green-bell-peppers", "vegetables", "فلفل رومي أخضر (١ كيلو)", "Green Bell Peppers, 1 kg", P("green-bell-peppers"), 30, { rating: 4.6, sold90: 298 }],
      ["navel-oranges", "fruits", "برتقال بسرة (١ كيلو)", "Navel Oranges, 1 kg", P("navel-oranges"), 25, { rating: 4.7, sold90: 333 }],
      ["fresh-mint-bunch", "greens", "نعناع (حزمة)", "Fresh Mint, Bunch", P("fresh-mint-bunch"), 10, { rating: 4.8, sold90: 377 }],
      ["potatoes-onions-pack", "boxes", "كيس بطاطس وبصل أحمر", "Potatoes and Red Onions Pack", P("potatoes-onions-pack"), 60, { rating: 4.6, sold90: 214 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `khodar`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("خضروات وفاكهة وورقيات", "Vegetables, fruit and greens"),
      L("الوزن والسعر واضحان لكل منتج", "Clear weight and price for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    labels: { search: L("ابحث عن طماطم، مانجا، ملوخية…", "Search tomatoes, mango, molokhia…") },
    nav: [
      { label: L("خضروات", "Vegetables"), href: search("كيلو") },
      { label: L("ورقيات", "Greens"), href: search("حزمة") },
      { label: L("صناديق", "Boxes"), href: search("بوكس") },
      { label: L("فاكهة", "Fruits"), href: search("مانجا") },
    ],
    hero: {
      alt: L("صناديق خضروات وفاكهة طازجة تحت مظلة في السوق", "Crates of fresh vegetables and fruit under a market awning"),
      eyebrow: L("خضروات وفاكهة طازجة", "Fresh produce"),
      title: L("ماذا تحتاج اليوم؟", "What do you need today?"),
      line: L("طماطم، مانجا، ملوخية", "Tomatoes, mango, molokhia"),
      cta: L("تسوّق الخضروات", "Shop vegetables"),
    },
    categories: { title: L("تسوّق حسب القسم", "Shop by category") },
    products: { primary: { title: L("الأكثر طلبًا", "Most ordered"), line: L("الخضروات والفاكهة الأكثر طلبًا.", "Our most-ordered fruit and vegetables.") } },
    story: {
      alt: L("عربة خشبية عليها صناديق خضروات في حقل أخضر ونخيل", "A wooden cart of vegetable crates in a green field with palm trees"),
      eyebrow: L("من الحقل", "From the field"),
      title: L("خضروات وفاكهة من الموسم", "Produce in season"),
      text: L("نختار الخضروات والفاكهة بعناية ونفرزها قبل التغليف.", "We choose fruit and vegetables with care and sort them before packing."),
      cta: L("تسوّق الصناديق", "Shop boxes"),
    },
    trust: [
      { title: L("الوزن واضح", "Clear weights"), line: L("لكل منتج وزنه وسعره", "Weight and price for every product") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("خضروات وفاكهة وورقيات", "Vegetables, fruit and greens") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("خضروات الموسم أولًا بأول", "The season's produce as it lands"),
      line: L("رسالة أسبوعية عن خضروات وفاكهة الموسم.", "A weekly letter with what is in season."),
    },
    about: {
      line: L("خضروات وفاكهة طازجة.", "Fresh fruit and vegetables."),
      alt: L("عربة خشبية عليها صناديق خضروات في حقل أخضر ونخيل", "A wooden cart of vegetable crates in a green field with palm trees"),
      eyebrow: L("من الحقل", "From the field"),
      title: L("خضروات وفاكهة من الموسم", "Produce in season"),
      text: L(
        "نقدّم خضروات وفاكهة الموسم والورقيات والصناديق المشكلة، ونذكر وزن كل منتج وسعره في صفحته.",
        "We offer seasonal fruit and vegetables, greens and mixed boxes, with each product's weight and price on its page.",
      ),
      more: L("ولأي سؤال عن طلبك، تواصل معنا.", "For any question about your order, contact us."),
      cta: L("تسوّق الصناديق", "Shop boxes"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسألنا عن أي منتج أو طلب.", "Ask us about any product or order."),
      heading: L("اسأل عن طلب أو صندوق", "Ask about an order or a box"),
    },
    faq: {
      line: L("الطلبات والصناديق والمنتجات.", "Orders, boxes and products."),
      question: L("كيف تُحسب أوزان المنتجات؟", "How are products weighed?"),
      answer: L("يُذكر وزن كل منتج في صفحته، وقد يختلف قليلًا حسب حجم الثمار.", "Each product's weight is on its page, and it may vary slightly with the size of the produce."),
    },
    custom: {
      // `khodar`: the header's link to the best sellers.
      "best-label": L("الأكثر طلبًا", "Most ordered"),
      // `khodar`: the delivery promise, three steps.
      "promise-title": L("كيف تطلب", "How to order"),
      "promise-time-1": L("١", "1"),
      "promise-step-1": L("اختر الخضروات والفاكهة", "Pick your produce"),
      "promise-time-2": L("٢", "2"),
      "promise-step-2": L("راجع السلة", "Review your basket"),
      "promise-time-3": L("٣", "3"),
      "promise-step-3": L("أكمل الطلب", "Check out"),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل الطبق", "Completes the dish") } },
};
