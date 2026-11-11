import { describe, expect, it } from "vitest";
import { MATCH, matchNiche, normalizeText } from "./match";
import { NICHE_INDUSTRY_NAMES, NICHES } from "./niches";

const byCategory = (text: string) => matchNiche({ category: /[ء-ي]/.test(text) ? { ar: text } : { en: text } })?.nicheId ?? null;

describe("normalizeText", () => {
  it("unifies Arabic spellings", () => {
    expect(normalizeText("  أَحْذِيَة  ")).toBe("احذيه");
    expect(normalizeText("إكسسوارات")).toBe("اكسسوارات");
    expect(normalizeText("آلات")).toBe("الات");
    expect(normalizeText("مستشفى")).toBe("مستشفي");
    expect(normalizeText("فســـاتين")).toBe("فساتين");
    expect(normalizeText("مأكولات ومؤن وهيئة")).toBe("ماكولات ومون وهييه");
    expect(normalizeText("عيار ٢١")).toBe("عيار 21");
    expect(normalizeText("ڤيتامين چينز")).toBe("فيتامين جينز");
  });

  it("lowercases English and drops punctuation", () => {
    expect(normalizeText("T-Shirts & Hoodies!")).toBe("t shirts hoodies");
    expect(normalizeText("Men's Wear")).toBe("mens wear");
    expect(normalizeText("Soirée")).toBe("soiree");
    expect(normalizeText(" ... ")).toBe("");
  });
});

describe("matchNiche: what a seller types as the store category", () => {
  const cases: [string, string][] = [
    // fashion
    ["محل فساتين سواريه", "dresses"],
    ["فستاين سهرة", "dresses"],
    ["Evening dresses", "dresses"],
    ["T-shirts & hoodies", "tshirts"],
    ["تيشرتات اوفر سايز", "tshirts"],
    ["بناطيل وجينز", "pants-jeans"],
    ["Jeans and trousers", "pants-jeans"],
    ["عبايات وطرح", "modest-wear"],
    ["Abayas & hijabs", "modest-wear"],
    ["ملابس رجالي", "menswear"],
    ["Men's clothing", "menswear"],
    ["لبس اطفال ومواليد", "kidswear"],
    ["فساتين اطفال", "kidswear"],
    ["بيجامات ولانجيري", "lingerie-sleepwear"],
    ["ملابس جيم", "sportswear"],
    // shoes and bags
    ["كوتشيات", "sneakers"],
    ["Sneakers", "sneakers"],
    ["جزم حريمي وصنادل", "womens-shoes"],
    ["احذية رجالي كلاسيك", "mens-shoes"],
    ["شنط حريمي", "handbags"],
    ["Handbags and clutches", "handbags"],
    ["شنط ظهر", "backpacks-travel"],
    // accessories and jewelry
    ["نضارات شمس", "glasses"],
    ["نظارات طبية وشمسية", "glasses"],
    ["Sunglasses", "glasses"],
    ["ساعات رجالي", "watches"],
    ["Wrist watches", "watches"],
    ["دهب عيار ٢١", "gold-jewelry"],
    ["فضة ايطالي 925", "silver-jewelry"],
    ["خواتم فضة", "silver-jewelry"],
    ["اكسسوارات حريمي وحلقان", "fashion-jewelry"],
    ["توك وبنس شعر", "hair-accessories"],
    ["محافظ واحزمة جلد", "belts-wallets"],
    // electronics and mobile accessories
    ["موبايلات وتابلت", "mobiles"],
    ["Smartphones", "mobiles"],
    ["اكسسوارات كمبيوتر وجيمنج", "pc-gaming"],
    ["كراسي جيمنج", "pc-gaming"],
    ["نجف واضاءة", "lighting-smart-home"],
    ["Lamps & lighting", "lighting-smart-home"],
    ["سبيكرات وصوتيات", "audio"],
    ["مكانس ومراوح", "small-appliances"],
    ["ساعات ذكية", "wearables"],
    ["Smart watches", "wearables"],
    ["اكسسوارات موبايل وجرابات", "phone-cases"],
    ["كفرات واسكرينات", "phone-cases"],
    ["Phone cases", "phone-cases"],
    ["شواحن وكابلات", "chargers-cables"],
    ["Power banks & cables", "chargers-cables"],
    ["Wireless earbuds", "earbuds"],
    // beauty
    ["العناية بالبشرة", "skincare"],
    ["Skin care", "skincare"],
    ["ميكب وروج", "makeup"],
    ["برفانات وعطور", "perfumes"],
    ["شامبو وبلسم", "haircare"],
    ["مكواة شعر", "haircare"],
    ["عناية باللحية", "mens-grooming"],
    // home and kitchen
    ["موبيليا واثاث", "furniture"],
    ["مفروشات وملايات", "bedding-textiles"],
    ["تابلوهات وديكور", "decor"],
    ["ساعات حائط", "decor"],
    ["نباتات زينة", "plants-garden"],
    ["اورجانايزر وتخزين", "home-organisation"],
    ["حلل وطواجن", "cookware"],
    ["اطقم سفرة", "tableware"],
    ["ماكينة اسبريسو", "coffee-gear"],
    ["Kitchen appliances", "kitchen-appliances"],
    ["قلاية هوائية", "kitchen-appliances"],
    // food and sweets
    ["سوبر ماركت", "grocery"],
    ["خضار وفاكهة", "fresh-produce"],
    ["جزارة ولحوم بلدي", "meat-poultry"],
    ["مخبوزات", "bakery"],
    ["عطارة وتوابل", "spices-herbs"],
    ["برجر وبيتزا", "fast-food"],
    ["كنافة وبسبوسة", "oriental-sweets"],
    ["تورت وجاتوه", "chocolate-cakes"],
    ["تورتة عيد ميلاد", "chocolate-cakes"],
    ["بن محوج", "coffee-beans"],
    ["Specialty coffee", "coffee-beans"],
    ["تمور ومكسرات", "dates-nuts"],
    ["فواكه مجففة", "dates-nuts"],
    // kids, sports, health
    ["لعب اطفال", "toys"],
    ["Toys", "toys"],
    ["مستلزمات البيبي", "baby-essentials"],
    ["هدايا سبوع", "kids-gifts"],
    ["ادوات مدرسية", "school-supplies"],
    ["اجهزة جيم ودامبلز", "gym-fitness"],
    ["فانلات كورة", "football"],
    ["كوتشي جري", "running"],
    ["عجل وبسكليتات", "cycling"],
    ["خيم وتخييم", "outdoor-camping"],
    ["Yoga mats", "yoga"],
    ["فيتامينات ومكملات غذائية", "vitamins-supplements"],
    ["صيدلية", "pharmacy-care"],
    ["اجهزة ضغط وسكر", "medical-devices"],
    // pets, auto, handmade, books
    ["اكل قطط", "pet-food"],
    ["مستلزمات قطط وكلاب", "pet-accessories"],
    ["اسماك زينة وعصافير", "fish-birds"],
    ["كماليات عربيات", "car-accessories"],
    ["تلميع سيارات", "car-care"],
    ["نانو سيراميك", "car-care"],
    ["كاوتش وبطاريات", "tyres-batteries"],
    ["دراجات نارية", "motorcycle"],
    ["فرش عربيات", "car-interior"],
    ["شاحن عربية كهربائية", "ev-charging"],
    ["هاند ميد", "handmade-gifts"],
    ["فخار وخزف", "ceramics"],
    ["شموع معطرة", "candles-soap"],
    ["كروشيه وتطريز", "crochet-embroidery"],
    ["مفارش كروشيه", "crochet-embroidery"],
    ["كتب وروايات", "books"],
    ["Stationery", "stationery"],
    ["قصص اطفال", "kids-books"],
  ];

  it.each(cases)("%s → %s", (text, niche) => {
    expect(byCategory(text)).toBe(niche);
  });

  it("covers at least 25 niches, and every niche by its own names", () => {
    expect(new Set(cases.map(([, niche]) => niche)).size).toBeGreaterThanOrEqual(25);
    const industryNames = new Set(Object.values(NICHE_INDUSTRY_NAMES).flat().map((name) => name.toLowerCase()));
    for (const niche of NICHES) {
      // "إكسسوارات سيارات" / "Car accessories" is also the auto industry's name: an industry name never picks a niche.
      if (industryNames.has(niche.name.ar.toLowerCase()) || industryNames.has(niche.name.en.toLowerCase())) {
        expect(niche.id).toBe("car-accessories");
        continue;
      }
      expect(matchNiche({ category: { ar: niche.name.ar } })?.nicheId, niche.name.ar).toBe(niche.id);
      expect(matchNiche({ category: { en: niche.name.en } })?.nicheId, niche.name.en).toBe(niche.id);
      expect(matchNiche({ category: niche.name, industryId: niche.industry })?.nicheId, niche.id).toBe(niche.id);
    }
  });

  it("forgives typos and missing letters in longer words", () => {
    expect(byCategory("فستاين")).toBe("dresses");
    expect(byCategory("نظرات شمس")).toBe("glasses");
    expect(byCategory("snekers")).toBe("sneakers");
    expect(byCategory("perfums")).toBe("perfumes");
    expect(byCategory("skincare prodcts")).toBe("skincare");
    // A real word of another niche is never "corrected": earphones are not watches.
    expect(byCategory("سماعات")).not.toBe("watches");
    expect(byCategory("ساعات")).toBe("watches");
  });
});

describe("matchNiche: when the words do not say", () => {
  it("returns null for nothing, shop words and general words", () => {
    expect(matchNiche({})).toBeNull();
    expect(matchNiche({ category: { en: "", ar: "  " }, name: "", productTitles: [] })).toBeNull();
    expect(byCategory("متجر")).toBeNull();
    expect(byCategory("My online store")).toBeNull();
    expect(byCategory("ملابس")).toBeNull();
    expect(byCategory("اكسسوارات")).toBeNull();
    expect(byCategory("Accessories")).toBeNull();
    expect(byCategory("احذية")).toBeNull();
    expect(byCategory("Shoes")).toBeNull();
  });

  it("returns null for every industry name, old or new", () => {
    for (const names of Object.values(NICHE_INDUSTRY_NAMES)) for (const name of names) expect(byCategory(name), name).toBeNull();
    expect(matchNiche({ category: { en: "Jewelry & Watches", ar: "مجوهرات وساعات" } })).toBeNull();
  });

  it("returns null when two different niches are as likely", () => {
    expect(byCategory("ساعات ونظارات")).toBeNull();
    expect(byCategory("Watches and perfumes")).toBeNull();
  });
});

describe("matchNiche: sources and weights", () => {
  const dressTitles = ["فستان سواريه طويل", "فستان كاجوال قطن", "فستان سهرة ستان", "دريس صيفي مشجر"];

  it("reads the niche from product titles when the name says nothing", () => {
    expect(matchNiche({ name: "دولاب نور", productTitles: dressTitles })?.nicheId).toBe("dresses");
    expect(matchNiche({ category: { en: "Fashion", ar: "أزياء وملابس" }, name: "دولاب نور", productTitles: dressTitles })?.nicheId).toBe("dresses");
  });

  it("does not trust one product title", () => {
    expect(matchNiche({ name: "دولاب نور", productTitles: ["فستان كاجوال قطن"] })).toBeNull();
  });

  it("weighs the category above the hint, the name and the titles", () => {
    const category = matchNiche({ category: { ar: "ساعات" } })!.score;
    const hint = matchNiche({ hint: "ساعات" })!.score;
    const name = matchNiche({ name: "ساعات" })!.score;
    expect(category).toBeGreaterThan(hint);
    expect(hint).toBeGreaterThan(name);
    expect(category).toBe(MATCH.word);
    // A watch category beats any number of dress titles.
    expect(matchNiche({ category: { ar: "ساعات يد" }, productTitles: Array.from({ length: 50 }, () => "فستان") })?.nicheId).toBe("watches");
    // The same words in both languages count once.
    expect(matchNiche({ category: { ar: "ساعات", en: "Watches" } })!.score).toBe(category);
  });

  it("uses the AI builder's short hint", () => {
    expect(matchNiche({ hint: "women's dresses" })?.nicheId).toBe("dresses");
    expect(matchNiche({ category: { en: "Fashion" }, hint: "abayas and hijab" })?.nicheId).toBe("modest-wear");
  });

  it("leans to the store's industry without excluding the others", () => {
    // Plain earphones: audio by default, earbuds in a mobile accessories store.
    expect(matchNiche({ category: { ar: "سماعات" } })?.nicheId).toBe("audio");
    expect(matchNiche({ category: { ar: "سماعات" }, industryId: "mobile-accessories" })?.nicheId).toBe("earbuds");
    // The industry can come from the saved category itself.
    expect(matchNiche({ category: { ar: "إكسسوارات موبايل" }, hint: "سماعات" })?.nicheId).toBe("earbuds");
    // A clear niche of another industry still wins, with a lower score.
    const plain = matchNiche({ category: { ar: "ساعات يد" } })!;
    const elsewhere = matchNiche({ category: { ar: "ساعات يد" }, industryId: "fashion" })!;
    expect(elsewhere.nicheId).toBe("watches");
    expect(elsewhere.score).toBeLessThan(plain.score);
    expect(matchNiche({ category: { ar: "ساعات يد" }, industryId: "jewelry" })!.score).toBe(plain.score);
  });

  it("is deterministic and fast on a large catalog", () => {
    const titles = Array.from({ length: 300 }, (_, i) => `فستان سواريه موديل ${i} قماش ستان ناعم بأكمام طويلة ولون مميز`);
    const started = performance.now();
    const first = matchNiche({ name: "بوتيك", productTitles: titles });
    const elapsed = performance.now() - started;
    expect(first).toEqual(matchNiche({ name: "بوتيك", productTitles: titles }));
    expect(first?.nicheId).toBe("dresses");
    expect(elapsed).toBeLessThan(500);
  });
});
