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
    description: L("توابل وخلطات وأعشاب وعسل وزيوت.", "Spices, blends, herbs, honey and oils."),
    categories: [
      ["ground", "توابل مطحونة", "Ground spices", TILES[0]!],
      ["blends", "خلطات وتوابل صحيحة", "Blends & whole spices", TILES[1]!],
      ["herbs", "أعشاب ومشروبات", "Herbs & herbal teas", TILES[2]!],
      ["honey-oils", "عسل وزيوت", "Honey & natural oils", TILES[3]!],
    ],
    products: [
      ["ground-cumin-jar", "ground", "كمون مطحون (٢٥٠ جم)", "Ground Cumin, 250 g", P("ground-cumin-jar"), 85, { isFeatured: true, rating: 4.9, sold90: 342 }],
      ["dukkah-mix-jar", "blends", "دُقة مصرية (٢٥٠ جم)", "Egyptian Dukkah, 250 g", P("dukkah-mix-jar"), 95, { isFeatured: true, rating: 4.8, sold90: 276 }],
      ["dried-hibiscus-karkade", "herbs", "كركديه أسواني (٢٥٠ جم)", "Dried Hibiscus, 250 g", P("dried-hibiscus-karkade"), 70, { rating: 4.8, sold90: 298 }],
      ["clover-honey-jar", "honey-oils", "عسل برسيم (١ كيلو)", "Clover Honey, 1 kg", P("clover-honey-jar"), 320, { isFeatured: true, rating: 4.9, sold90: 214 }],
      ["black-pepper-jar", "ground", "فلفل أسود حبوب (٢٠٠ جم)", "Black Peppercorns, 200 g", P("black-pepper-jar"), 120, { rating: 4.7, sold90: 231 }],
      ["kofta-spice-blend", "blends", "خلطة كفتة (٢٥٠ جم)", "Kofta Spice Blend, 250 g", P("kofta-spice-blend"), 90, { rating: 4.7, sold90: 187 }],
      ["dried-mint-jar", "herbs", "نعناع مجفف (١٠٠ جم)", "Dried Mint, 100 g", P("dried-mint-jar"), 55, { rating: 4.6, sold90: 165 }],
      ["black-seed-oil-bottle", "honey-oils", "طقم زيت حبة البركة بالحبة والعسل", "Black Seed Oil Set with Seeds and Honey", P("black-seed-oil-bottle"), 380, { rating: 4.7, sold90: 96 }],
      ["ground-coriander", "ground", "كزبرة مجففة مطحونة (٢٥٠ جم)", "Ground Coriander, 250 g", P("ground-coriander"), 60, { rating: 4.6, sold90: 178 }],
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
      L("توابل وخلطات وأعشاب", "Spices, blends and herbs"),
      L("الوزن والسعر واضحان لكل منتج", "Clear weight and price for every product"),
      L("تسوّق سهل من هاتفك", "Easy shopping from your phone"),
    ],
    nav: [
      { label: L("التوابل", "Spices"), href: "/products" },
      { label: L("العسل", "Honey"), href: search("عسل") },
    ],
    hero: {
      alt: L("جوال كركديه وأوانٍ للتوابل وزعفران على طاولة خشبية", "A sack of hibiscus and bowls of spices and saffron on a wooden table"),
      eyebrow: L("توابل وأعشاب", "Spices and herbs"),
      title: L("توابل وخلطات وأعشاب", "Spices, blends and herbs"),
      line: L("كمون وكزبرة ودُقة وكركديه في عبوات محكمة.", "Cumin, coriander, dukkah and hibiscus in sealed packs."),
      cta: L("تسوّق التوابل", "Shop spices"),
    },
    categories: { title: L("تسوّق حسب الرف", "Shop by shelf") },
    products: {
      primary: {
        eyebrow: L("مختارات", "Picks"),
        title: L("الأكثر طلبًا", "Most ordered"),
        line: L("التوابل والأعشاب الأكثر طلبًا.", "Our most-ordered spices and herbs."),
      },
    },
    story: {
      alt: L("متجر عطارة فيه برطمانات وأدراج خشبية وهاون نحاسي", "An attar's shop with jars, wooden drawers and a brass mortar"),
      eyebrow: L("من العطارة", "From the shop"),
      title: L("توابل مطحونة وصحيحة", "Ground and whole spices"),
      text: L("نقدّم التوابل مطحونة وصحيحة، ونذكر وزن كل عبوة في صفحتها.", "We offer ground and whole spices, with each pack's weight on its page."),
      cta: L("تسوّق التوابل", "Shop spices"),
    },
    trust: [
      { title: L("الوزن واضح", "Clear weights"), line: L("لكل عبوة وزنها وسعرها", "Weight and price for every pack") },
      { title: L("تشكيلة متنوعة", "A full range"), line: L("توابل وأعشاب وعسل وزيوت", "Spices, herbs, honey and oils") },
      { title: L("تسوّق سهل", "Easy shopping"), line: L("اطلب بسهولة من هاتفك", "Order easily from your phone") },
      { title: L("نجيب عن أسئلتك", "Here to help"), line: L("تواصل معنا لأي سؤال", "Contact us with any question") },
    ],
    newsletter: {
      title: L("خلطة الشهر", "The blend of the month"),
      line: L("رسالة شهرية فيها خلطة ووصفة بها.", "A monthly letter with a blend and a recipe for it."),
    },
    footer: { line: L("توابل وخلطات وأعشاب وعسل.", "Spices, blends, herbs and honey.") },
    about: {
      line: L("عطارة للتوابل والأعشاب.", "An attar's for spices and herbs."),
      alt: L("متجر عطارة فيه برطمانات وأدراج خشبية وهاون نحاسي", "An attar's shop with jars, wooden drawers and a brass mortar"),
      eyebrow: L("حكايتنا", "Our story"),
      title: L("توابل وأعشاب مختارة", "Chosen spices and herbs"),
      text: L(
        "نقدّم التوابل المطحونة والصحيحة والخلطات والأعشاب والعسل والزيوت، ونذكر وزن كل عبوة ومكوناتها في صفحتها.",
        "We offer ground and whole spices, blends, herbs, honey and oils, with each pack's weight and contents on its page.",
      ),
      more: L("ولأي سؤال عن المنتجات، تواصل معنا.", "For any question about our products, contact us."),
      cta: L("تسوّق التوابل", "Shop spices"),
    },
    contact: {
      title: L("تواصل معنا", "Contact us"),
      line: L("اسأل عن خلطة أو كمية كبيرة.", "Ask about a blend or a large quantity."),
      heading: L("اسأل عن خلطة أو كمية", "Ask about a blend or a quantity"),
    },
    faq: {
      line: L("التوابل والتخزين وطريقة الطلب.", "Spices, storage and ordering."),
      question: L("كيف أخزّن التوابل؟", "How should I store spices?"),
      answer: L("في برطمان محكم بعيدًا عن الضوء والحرارة.", "In a closed jar away from light and heat."),
    },
    custom: {
      // `atara`: the hero's second button (to `nav.1`).
      "hero-cta-2": L("تسوّق العسل", "Shop honey"),
      // `atara`: the small label over the categories' title.
      "categories-eyebrow": L("الرفوف", "The shelves"),
      // `atara`: the lead text, three short paragraphs.
      "lead-1": L(
        "توابل مطحونة وصحيحة وخلطات جاهزة لكل طبخة.",
        "Ground and whole spices and ready blends for every dish.",
      ),
      "lead-2": L("كل عبوة موزونة ومغلقة بإحكام.", "Every pack is weighed and sealed."),
      "lead-3": L("ووزن كل عبوة مذكور في صفحتها.", "And each pack's weight is on its page."),
    },
  },
  productPage: { copy: { reviews: L("آراء العملاء", "Customer reviews"), related: L("يكمل الطبق", "Completes the dish") } },
};
