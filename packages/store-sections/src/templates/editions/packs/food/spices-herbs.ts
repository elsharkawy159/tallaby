/**
 * The spices and herbs pack (niche editions, ROADMAP F-90): "Hawag", an
 * attar's shop of ground spices, blends and whole spices, herbs and herbal
 * teas, and honey and natural oils, ground on the day of the order. Data
 * only; `atara` draws it.
 *
 * Photos: generated from `docs/systems/editions-photos.md` (received
 * 2026-11-15, checked by eye: plain unlabelled jars and bags, no people,
 * hands, lettering or logos), in the public `library-media` bucket,
 * `editions/spices-herbs/`: twelve white-background packshots named by slug
 * and eight scenes as `scene-<slot>`. The black seed oil packshot came back
 * with a small jar of seeds and a jar of honey beside the bottle, so the
 * product is the set it shows.
 *
 * Look: `atara`, the niche's template (one template per niche). Its home
 * shows the category list, four best sellers and a lead text
 * (`custom.lead-*`); no category rows, so three products per category are
 * enough. No `reviews`: a pack holds no invented buyer quotes, and without
 * them `atara` leaves its reviews out.
 */
import { L } from "../../../../designs/_kit";
import { demoStore } from "../../../library-template";
import { editionPhoto } from "../../media";
import type { Edition } from "../../types";

const NICHE = "spices-herbs";
const P = (slug: string) => editionPhoto(NICHE, slug);
const scene = (slot: string) => editionPhoto(NICHE, `scene-${slot}`);
const search = (q: string) => `/products?search=${encodeURIComponent(q)}`;

/** Category tiles, 3:4, in the categories' order. */
const TILES = [scene("tile-1"), scene("tile-2"), scene("tile-3"), scene("tile-4")];

export const SPICES_HERBS: Edition = {
  niche: NICHE,
  looks: ["atara"],
  priceBand: { min: 30, max: 600 },
  // Square packshots on pure white: a square white stage shows each jar whole.
  productStage: { ratio: "1:1", fit: "contain", background: "#ffffff" },
  demo: demoStore({
    name: L("حوّاج", "Hawag"),
    description: L("توابل وأعشاب بتتطحن يوم ما تطلب.", "Spices and herbs ground on the day you order."),
    categories: [
      ["ground", "توابل مطحونة", "Ground spices", TILES[0]!],
      ["blends", "خلطات وتوابل صحيحة", "Blends & whole spices", TILES[1]!],
      ["herbs", "أعشاب ومشروبات", "Herbs & herbal teas", TILES[2]!],
      ["honey-oils", "عسل وزيوت", "Honey & natural oils", TILES[3]!],
    ],
    products: [
      ["ground-cumin-jar", "ground", "كمون مطحون (٢٥٠ جم)", "Ground Cumin, 250 g", P("ground-cumin-jar"), 85, { isFeatured: true, rating: 4.9, sold90: 342 }],
      ["dukkah-mix-jar", "blends", "دُقة مصري (٢٥٠ جم)", "Egyptian Dukkah, 250 g", P("dukkah-mix-jar"), 95, { isFeatured: true, rating: 4.8, sold90: 276 }],
      ["dried-hibiscus-karkade", "herbs", "كركديه أسواني (٢٥٠ جم)", "Dried Hibiscus, 250 g", P("dried-hibiscus-karkade"), 70, { rating: 4.8, sold90: 298 }],
      ["clover-honey-jar", "honey-oils", "عسل برسيم (١ كيلو)", "Clover Honey, 1 kg", P("clover-honey-jar"), 320, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["black-pepper-jar", "ground", "فلفل أسود حب (٢٠٠ جم)", "Black Peppercorns, 200 g", P("black-pepper-jar"), 120, { rating: 4.7, sold90: 231 }],
      ["kofta-spice-blend", "blends", "خلطة كفتة (٢٥٠ جم)", "Kofta Spice Blend, 250 g", P("kofta-spice-blend"), 90, { rating: 4.7, sold90: 187 }],
      ["dried-mint-jar", "herbs", "نعناع ناشف (١٠٠ جم)", "Dried Mint, 100 g", P("dried-mint-jar"), 55, { rating: 4.6, sold90: 165 }],
      ["black-seed-oil-bottle", "honey-oils", "طقم زيت حبة البركة بالحبة والعسل", "Black Seed Oil Set with Seeds and Honey", P("black-seed-oil-bottle"), 380, { rating: 4.7, sold90: 96 }],
      ["ground-coriander", "ground", "كزبرة ناشفة مطحونة (٢٥٠ جم)", "Ground Coriander, 250 g", P("ground-coriander"), 60, { rating: 4.6, sold90: 178 }],
      ["cinnamon-sticks-bundle", "blends", "قرفة عيدان (٢٠٠ جم)", "Cinnamon Sticks, 200 g", P("cinnamon-sticks-bundle"), 110, { rating: 4.7, sold90: 154 }],
      ["chamomile-flowers", "herbs", "بابونج (١٠٠ جم)", "Chamomile Flowers, 100 g", P("chamomile-flowers"), 65, { rating: 4.6, sold90: 132 }],
      ["black-seeds-jar", "honey-oils", "حبة البركة (٢٥٠ جم)", "Black Seeds, 250 g", P("black-seeds-jar"), 75, { compareAtPrice: 85, rating: 4.7, sold90: 143 }],
    ],
  }),
  photos: {
    hero: { wide: scene("hero-wide"), tall: scene("hero-tall") },
    tiles: TILES,
    // Drawn by no look today.
    banner: scene("banner"),
    // `atara`'s about page.
    story: scene("story"),
  },
  copy: {
    announcement: [
      L("بيتطحن طازة بالطلب", "Ground fresh on order"),
      L("الدفع عند الاستلام", "Cash on delivery"),
      L("توصيل لكل محافظات مصر", "Delivery across Egypt"),
    ],
    nav: [
      { label: L("التوابل", "Spices"), href: "/products" },
      { label: L("العسل", "Honey"), href: search("عسل") },
    ],
    hero: {
      alt: L("شوال كركديه وطواجن توابل وزعفران على ترابيزة خشب", "A sack of hibiscus and bowls of spices and saffron on a wooden table"),
      eyebrow: L("بيتطحن طازة", "Ground fresh"),
      title: L("توابل ريحتها توابل", "Spices that smell like spices"),
      line: L("كمون وكزبرة ودُقة وكركديه بتتطحن وتتقفل يوم ما تطلب.", "Cumin, coriander, dukkah and hibiscus ground and sealed the day you order."),
      cta: L("تسوق التوابل", "Shop spices"),
    },
    categories: { title: L("تسوّق بالرف", "Shop by shelf") },
    products: {
      primary: {
        eyebrow: L("أحسن ٤", "Top 4"),
        title: L("الأكتر إعادة طلب", "Most reordered"),
        line: L("اللي الناس بترجع تطلبه كل شهر.", "What people reorder every month."),
      },
    },
    story: {
      alt: L("دكان عطارة فيه برطمانات وأدراج خشب وهون نحاس", "An attar's shop with jars, wooden drawers and a brass mortar"),
      eyebrow: L("من الدكان", "From the shop"),
      title: L("بنطحن بالطلب", "We grind to order"),
      text: L("مفيش حاجة عندنا بتتطحن قبل ما تطلبها.", "Nothing on our shelf is ground before you order it."),
      cta: L("تسوق التوابل", "Shop spices"),
    },
    trust: [
      { title: L("بيتطحن بالطلب", "Ground to order"), line: L("يوم ما تطلب", "On the day you order") },
      { title: L("الدفع عند الاستلام", "Cash on delivery"), line: L("ادفع لما الطلب يوصل", "Pay when your order arrives") },
      { title: L("تاريخ الطحن", "Grinding date"), line: L("مكتوب على كل كيس", "On every bag") },
      { title: L("توصيل لكل مصر", "Delivery across Egypt"), line: L("لحد باب البيت", "To your door") },
    ],
    newsletter: {
      title: L("خلطة الشهر", "The blend of the month"),
      line: L("رسالة كل شهر فيها خلطة ووصفة بيها.", "A monthly letter with a blend and a recipe for it."),
    },
    footer: { line: L("توابل وأعشاب بتتطحن يوم ما تطلب.", "Spices and herbs ground on the day you order.") },
    about: {
      line: L("عطارة بتطحن بالطلب.", "An attar's that grinds to order."),
      alt: L("دكان عطارة فيه برطمانات وأدراج خشب وهون نحاس", "An attar's shop with jars, wooden drawers and a brass mortar"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("ريحة الدكان في مطبخك", "The shop's scent in your kitchen"),
      text: L(
        "بنشتري البذور صحيحة، وبنطحنها ونقفلها يوم ما تطلب، عشان التوابل توصلك بريحتها كاملة.",
        "We buy whole seeds and grind and seal them on the day you order, so the spices reach you with their full scent.",
      ),
      more: L("وبنكتب تاريخ الطحن على كل كيس.", "And we write the grinding date on every bag."),
      cta: L("تسوق التوابل", "Shop spices"),
    },
    contact: {
      title: L("تواصل", "Contact"),
      line: L("اسأل عن خلطة أو كمية كبيرة.", "Ask about a blend or a large quantity."),
      heading: L("اسأل عن خلطة أو كمية", "Ask about a blend or a quantity"),
    },
    faq: {
      line: L("الطحن والتخزين والتوصيل.", "Grinding, storage and delivery."),
      question: L("أخزن التوابل إزاي؟", "How should I store spices?"),
      answer: L("في برطمان مقفول بعيد عن النور والحرارة، وجددها كل ٣ شهور.", "In a closed jar away from light and heat, and restock every three months."),
    },
    custom: {
      // `atara`: the hero's second button (to `nav.1`).
      "hero-cta-2": L("تسوق العسل", "Shop honey"),
      // `atara`: the small label over the categories' title.
      "categories-eyebrow": L("الرفوف", "The shelves"),
      // `atara`: the lead text, three short paragraphs.
      "lead-1": L(
        "التوابل المطحونة بتفقد نص ريحتها في ٣ شهور. عشان كده بنطحن يوم ما تطلب بس.",
        "Ground spice loses half its smell in three months. That is why we only grind on the day you order.",
      ),
      "lead-2": L("كل طلب بيتوزن ويتطحن ويتقفل في كيس محكم.", "Every order is weighed, ground and sealed in an airtight bag."),
      "lead-3": L("وبنكتب على كل كيس يوم الطحن، عشان تعرف إمتى تجدد.", "And every bag carries its grinding date, so you know when to restock."),
    },
  },
  productPage: { copy: { reviews: L("رأي اللي جربوها", "From people who tried it"), related: L("يكمّل الطبخة", "Completes the dish") } },
};
