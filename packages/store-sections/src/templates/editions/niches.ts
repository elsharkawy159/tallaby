/**
 * The niche list of the niche editions (ROADMAP F-90, docs/systems/niche-editions-plan.md
 * §2.2): 82 sub-trades, each inside one store industry, with the words a
 * seller would type as a store category or name (Egyptian words and spellings
 * included) and the template looks picked for it, best first.
 *
 * A niche id is permanent once shipped. Keywords are matched in code by
 * `matchNiche` (match.ts); the AI model never receives this list (docs/ai.md).
 * No brand names. A word listed in two niches is there on purpose and is
 * recorded in `SHARED_KEYWORDS` of niches.test.ts. No React here.
 */

export type Niche = {
  /** Stable, never reused. */
  id: string;
  /** A `STORE_INDUSTRIES` id (packages/store-editor/src/lib/industries.lib.ts). */
  industry: string;
  name: { ar: string; en: string };
  keywords: { ar: readonly string[]; en: readonly string[] };
};

/** "a, b, c" → ["a", "b", "c"]. */
const k = (list: string): readonly string[] =>
  list
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

type Row = readonly [id: string, industry: string, ar: string, en: string, keywordsAr: string, keywordsEn: string, looks: string];

const ROWS: readonly Row[] = [
  // ── fashion ──
  [
    "dresses", "fashion", "فساتين", "Dresses",
    "فستان, فساتين, فساتين سواريه, فساتين سهرة, فستان سهرة, فساتين خطوبة, فساتين كاجوال, فساتين صيفي, دريس, دريسات, سواريه, جيبات, جيبة, فساتين زفاف, فستان فرح",
    "dress, dresses, gown, gowns, evening dress, evening dresses, maxi dress, midi dress, soiree, party dress, party dresses, summer dresses, skirt, skirts, wedding dresses",
    "fashion-luxe, vella, kasr",
  ],
  [
    "tshirts", "fashion", "تيشيرتات", "T-shirts",
    "تيشيرت, تيشيرتات, تي شيرت, تيشرت, تيشرتات, تشيرت, تشيرتات, هودي, هوديز, هوديهات, سويت شيرت, سويتشيرت, بولو, اوفر سايز, تيشيرتات مطبوعة, ستريت وير",
    "t-shirt, t-shirts, tshirt, tshirts, tee, tees, hoodie, hoodies, sweatshirt, sweatshirts, polo, polo shirts, oversized, graphic tees, printed t-shirts, streetwear",
    "streetwear, fashion-bold, nasig",
  ],
  [
    "pants-jeans", "fashion", "بناطيل وجينز", "Pants & jeans",
    "بنطلون, بناطيل, بنطلونات, بنطال, جينز, جينزات, بنطلون جينز, بناطيل جينز, شورت, شورتات, ليجن, ليجنز, بنطلون قماش, سروال, سراويل",
    "pants, jeans, trousers, denim, shorts, leggings, chinos, joggers, cargo pants, wide leg pants, slacks, denim jeans",
    "fashion-bold, zay, mawsem",
  ],
  [
    "modest-wear", "fashion", "عبايات وملابس محتشمة", "Abayas & modest wear",
    "عباية, عبايات, عبايا, حجاب, طرح, طرحة, ايشارب, ايشاربات, خمار, اسدال, اسدالات, نقاب, ملابس محجبات, محجبات, ملابس محتشمة, جلابية, جلابيات, قفطان",
    "abaya, abayas, hijab, hijabs, modest wear, modest fashion, modest clothing, scarf, scarves, khimar, isdal, niqab, jilbab, kaftan, kaftans, galabeya, prayer dress",
    "sitara, fashion-warm, kasr",
  ],
  [
    "menswear", "fashion", "ملابس رجالي", "Men's wear",
    "ملابس رجالي, لبس رجالي, ملابس رجال, ازياء رجالي, قميص, قمصان, قمصان رجالي, بدلة, بدل, بدل رجالي, بليزر, جاكيت رجالي, كرافتة, كرافتات, ملابس شباب, لبس شبابي",
    "menswear, men's wear, men's clothing, men's fashion, men's clothes, shirt, shirts, suit, suits, blazer, blazers, ties, formal wear, men's apparel",
    "zay, ghorza, fashion-luxe",
  ],
  [
    "kidswear", "fashion", "ملابس أطفال", "Kids' wear",
    "ملابس اطفال, لبس اطفال, هدوم اطفال, ملابس اولادي, ملابس ولادي, ملابس بناتي, ملابس بيبي, ملابس مواليد, لبس مواليد, سالوبيت, سالوبيتات, بيجامات اطفال, فساتين اطفال, اطقم اطفال",
    "kidswear, kids wear, kids clothing, kids clothes, children's clothing, children's wear, baby clothes, baby clothing, boys clothing, girls clothing, onesie, onesies, romper, rompers, toddler clothes",
    "kids-warm, kids-luxe",
  ],
  [
    "lingerie-sleepwear", "fashion", "لانجيري وبيجامات", "Lingerie & sleepwear",
    "لانجيري, لانجري, بيجامة, بيجامات, بيجامات حريمي, قمصان نوم, قميص نوم, ملابس نوم, ملابس داخلية, اندر وير, روب, ارواب, برا, ملابس بيتي, هوم وير, لبس بيت",
    "lingerie, sleepwear, pajamas, pyjamas, pajama, nightwear, nightgown, nightgowns, underwear, loungewear, homewear, robe, robes, bra, bras, nightdress",
    "fashion-warm, vella",
  ],
  [
    "sportswear", "fashion", "ملابس رياضية", "Sportswear",
    "ملابس رياضية, لبس رياضي, ملابس رياضة, ملابس سبور, تريننج, تريننجات, ترينجات, ترنج, لبس جيم, ملابس جيم, سبورت وير, اطقم رياضية, طقم رياضي",
    "sportswear, activewear, athletic wear, gym wear, gym clothes, tracksuit, tracksuits, sports clothing, athleisure, sports bra, training wear, workout clothes",
    "sports-luxe, stride, streetwear",
  ],

  // ── shoes-bags ──
  [
    "sneakers", "shoes-bags", "كوتشيات", "Sneakers",
    "كوتشي, كوتشيات, كوتش, سنيكرز, سنيكر, سنيكرس, احذية رياضية, حذاء رياضي, جزم رياضية, كوتشي رجالي, كوتشي حريمي",
    "sneakers, sneaker, trainers, kicks, athletic shoes, sports shoes, high tops, low tops, canvas shoes, tennis shoes, casual sneakers",
    "streetwear, sports-bold, stride",
  ],
  [
    "womens-shoes", "shoes-bags", "أحذية حريمي", "Women's shoes",
    "احذية حريمي, جزم حريمي, جزمة حريمي, احذية نسائية, شوزات, شوز حريمي, كعب, كعب عالي, صندل, صنادل, صندل حريمي, بالرينا, باليرينا, هاف بوت, بوت حريمي, شبشب حريمي, سابوه",
    "women's shoes, women shoes, shoes for women, ladies shoes, heels, high heels, sandals, sandal, flats, ballerinas, pumps, wedges, women's boots, ankle boots, mules, stilettos",
    "fashion-luxe, vella",
  ],
  [
    "mens-shoes", "shoes-bags", "أحذية رجالي", "Men's shoes",
    "احذية رجالي, جزم رجالي, جزمة رجالي, حذاء رجالي, شوز رجالي, احذية كلاسيك, جزم كلاسيك, لوفر, لوفرز, بوت رجالي, صندل رجالي, شبشب رجالي, احذية جلد, جزم جلد",
    "men's shoes, men shoes, shoes for men, loafers, loafer, oxford shoes, oxfords, derby shoes, formal shoes, leather shoes, men's boots, dress shoes, moccasins, brogues",
    "zay, ghorza",
  ],
  [
    "handbags", "shoes-bags", "شنط يد", "Handbags",
    "شنط يد, شنطة يد, شنط حريمي, شنطة حريمي, شنط, شنطة, حقائب يد, حقيبة يد, حقائب نسائية, كلاتش, كلتش, شنط سهرة, كروس, شنط كروس, توت باج, شنط جلد",
    "handbag, handbags, purse, purses, clutch, clutches, tote, tote bag, tote bags, crossbody, crossbody bag, shoulder bag, shoulder bags, women's bags, ladies bags, satchel, leather bags",
    "shanta, fashion-luxe, kasr",
  ],
  [
    "backpacks-travel", "shoes-bags", "شنط ظهر وسفر", "Backpacks & travel",
    "شنط ظهر, شنطة ظهر, شنط سفر, شنطة سفر, شنط مدرسة, شنطة مدرسة, باك باك, حقائب سفر, حقيبة سفر, حقيبة ظهر, ترولي, شنط ترولي, شنط لاب توب, شنطة لابتوب",
    "backpack, backpacks, travel bag, travel bags, luggage, suitcase, suitcases, trolley bag, duffel bag, duffle, school bag, school bags, laptop bag, carry-on, rucksack",
    "shanta, safar, basecamp",
  ],

  // ── jewelry (shown as "Accessories & Jewelry") ──
  [
    "glasses", "jewelry", "نظارات", "Glasses & sunglasses",
    "نظارة, نظارات, نضارة, نضارات, نظارات شمس, نضارات شمس, نظارة شمس, نظارات شمسية, نظارات طبية, نضارات طبي, نظارات نظر, نضارة نظر, عدسات, عدسات لاصقة, شنابر, فريمات",
    "glasses, eyeglasses, sunglasses, sun glasses, eyewear, spectacles, shades, optical, optics, frames, eyeglass frames, contact lenses, lenses, blue light glasses, reading glasses",
    "jewelry-luxe, karat, fashion-bold",
  ],
  [
    "watches", "jewelry", "ساعات يد", "Hand watches",
    "ساعة, ساعات, ساعة يد, ساعات يد, ساعات رجالي, ساعات حريمي, ساعة رجالي, ساعة حريمي, ساعات اصلية, ساعات كلاسيك, ساعات ماركات, ساعات كاجوال",
    "watch, watches, wristwatch, wristwatches, hand watch, hand watches, men's watches, women's watches, analog watch, classic watches, luxury watches, chronograph, timepiece, timepieces",
    "saat, jewelry-luxe, saa",
  ],
  [
    "gold-jewelry", "jewelry", "ذهب", "Gold jewelry",
    "ذهب, دهب, مجوهرات ذهب, مشغولات ذهبية, عيار 21, عيار 18, سبائك, سبائك ذهب, جنيهات ذهب, دبل, دبلة, شبكة, محابس, خواتم ذهب, سلاسل ذهب, غوايش",
    "gold, gold jewelry, gold jewellery, gold rings, gold necklace, gold chains, gold bars, gold bracelets, 21k, 18k, 24k, karat gold, bullion, wedding rings, wedding bands, fine jewelry",
    "mahr, jewelry-luxe, kholkhal",
  ],
  [
    "silver-jewelry", "jewelry", "فضة", "Silver jewelry",
    "فضة, فضيات, مجوهرات فضة, مشغولات فضية, فضة 925, فضة ايطالي, خواتم فضة, خاتم فضة, سلاسل فضة, اساور فضة, حلق فضة, دبل فضة, فضة رجالي",
    "silver, silver jewelry, silver jewellery, sterling silver, 925 silver, s925, silver rings, silver necklace, silver chains, silver bracelets, silver earrings, italian silver",
    "fadda, jewelry-warm",
  ],
  [
    "fashion-jewelry", "jewelry", "إكسسوارات حريمي", "Fashion jewelry",
    "اكسسوارات حريمي, اكسسوارات بناتي, اكسسوار, اكسسوارات ستانلس, ستانلس, ستانلس ستيل, حلق, حلقان, سلسلة, سلاسل, خاتم, خواتم, اسورة, اساور, انسيال, انسيالات, كوليه, خلخال, مطلي ذهب, اكسسوارات مطلية",
    "fashion jewelry, fashion jewellery, costume jewelry, jewelry, jewellery, earrings, earring, necklace, necklaces, bracelet, bracelets, rings, ring, anklet, anklets, pendant, pendants, gold plated, charms",
    "karat, zahra, jewelry-bold",
  ],
  [
    "hair-accessories", "jewelry", "إكسسوارات شعر", "Hair accessories",
    "اكسسوارات شعر, توك, توكة, توك شعر, بنس, بنس شعر, ربطات شعر, ربطة شعر, سكرانشي, سكرنشي, طوق, اطواق, تيجان, تاج, مشابك شعر, بندانة, فيونكات, فيونكة",
    "hair accessories, hair clips, hair clip, scrunchie, scrunchies, hair ties, hair bands, headband, headbands, hair pins, hairpins, barrettes, hair bows, claw clips, tiara, tiaras",
    "karat, zahra",
  ],
  [
    "belts-wallets", "jewelry", "أحزمة ومحافظ", "Belts & wallets",
    "حزام, احزمة, حزام جلد, احزمة جلد, حزام رجالي, محفظة, محافظ, محفظة رجالي, محفظة جلد, محافظ جلد, جلود, منتجات جلدية, مصنوعات جلدية, كارد هولدر, حافظة كروت, بوك",
    "belt, belts, wallet, wallets, leather belt, leather belts, leather wallet, leather wallets, card holder, cardholder, leather goods, men's wallets, money clip, billfold, key holder",
    "shanta, zay",
  ],

  // ── electronics ──
  [
    "mobiles", "electronics", "موبايلات", "Mobiles",
    "موبايلات, موبيلات, هواتف, هاتف, هواتف ذكية, تليفونات, تليفون, تلفونات, جوالات, محمول, موبايلات مستعملة, موبايل مستعمل, موبايلات جديدة, تابلت, تابلتات",
    "mobiles, mobile phones, mobile phone, phones, smartphones, smartphone, cell phones, tablets, tablet, used phones, handsets, android phones, refurbished phones",
    "shasha, techhub, tany",
  ],
  [
    "pc-gaming", "electronics", "كمبيوتر وجيمنج", "PC & gaming accessories",
    "كمبيوتر, كمبيوترات, لاب توب, لابتوب, لابتوبات, جيمنج, جيمينج, كيبورد, كيبوردات, ماوس, ماوسات, اكسسوارات كمبيوتر, اكسسوارات جيمنج, دراعات, دراعات تحكم, كراسي جيمنج, قطع كمبيوتر, هارد, العاب فيديو, شاشات كمبيوتر",
    "pc, computer, computers, laptop, laptops, gaming, gamer, gaming accessories, keyboard, keyboards, mouse, gaming mouse, video games, pc parts, pc components, graphics card, monitors, monitor, gaming chair, controllers",
    "arena, arcade, electronics-bold",
  ],
  [
    "lighting-smart-home", "electronics", "إضاءة وبيت ذكي", "Lighting & smart home",
    "اضاءة, انارة, لمبات, لمبة, لمبات ليد, اضاءة ليد, ليد, نجف, نجفة, ثريات, اباجورة, اباجورات, ابليك, ابليكات, سبوتات, كشافات, بيت ذكي, منزل ذكي, سمارت هوم, مفاتيح ذكية",
    "lighting, lights, lamps, lamp, chandelier, chandeliers, led lights, led, bulbs, bulb, smart home, smart bulbs, smart plugs, light fixtures, floor lamp, table lamps, spotlights, home automation",
    "nour, zaki, electronics-warm",
  ],
  [
    "audio", "electronics", "سماعات وصوتيات", "Audio",
    "سماعات, سماعة, صوتيات, سبيكر, سبيكرات, سماعات بلوتوث, مكبر صوت, مكبرات صوت, ساوند بار, هيدفون, هيدفونات, سماعات راس, ساب ووفر, ميكروفون, ميكروفونات, مايك, مايكات, انظمة صوت",
    "audio, speakers, speaker, bluetooth speaker, bluetooth speakers, headphones, headphone, soundbar, soundbars, subwoofer, microphone, microphones, sound system, hi-fi, hifi, amplifier, home theater",
    "arcade, electronics-luxe, techhub",
  ],
  [
    "small-appliances", "electronics", "أجهزة صغيرة", "Small appliances",
    "اجهزة صغيرة, اجهزة كهربائية, اجهزة منزلية صغيرة, ادوات كهربائية, مكواة, مكاوي, مكنسة, مكانس, مكنسة كهربائية, مروحة, مراوح, دفاية, دفايات, سخان, سخانات, شفاط",
    "small appliances, small home appliances, electric appliances, household appliances, vacuum cleaner, vacuum cleaners, vacuum, iron, steam iron, fan, fans, heater, heaters, water heater, humidifier, air purifier",
    "shasha, electronics-warm, beity",
  ],
  [
    "wearables", "electronics", "ساعات ذكية", "Smart watches",
    "ساعات ذكية, ساعة ذكية, سمارت واتش, سمارت ووتش, ساعة سمارت, ساعات سمارت, اسورة ذكية, سوار ذكي, سمارت باند, ساعة رياضية ذكية, خاتم ذكي",
    "smartwatch, smartwatches, smart watch, smart watches, wearable, wearables, fitness tracker, fitness trackers, fitness band, smart band, activity tracker, smart ring",
    "saa, electronics-luxe",
  ],

  // ── mobile-accessories ──
  [
    "phone-cases", "mobile-accessories", "جرابات وحماية", "Cases & protection",
    "جراب, جرابات, جراب موبايل, جرابات موبايل, كفر, كفرات, كفر موبايل, اسكرينة, اسكرينات, سكرينة, سكرينات, اسكرينة حماية, حماية شاشة, واقي شاشة, لزقة حماية, غطاء موبايل, حافظة موبايل",
    "phone case, phone cases, case, cases, cover, covers, phone cover, phone covers, screen protector, screen protectors, tempered glass, mobile cover, mobile covers, mobile case, protective case, bumper case",
    "volt, wasla",
  ],
  [
    "chargers-cables", "mobile-accessories", "شواحن وكابلات", "Chargers & cables",
    "شاحن, شواحن, شاحن موبايل, شاحن سريع, شاحن لاسلكي, شاحن عربية, راس شاحن, كابل, كابلات, كابل شحن, وصلة, وصلات, وصلة شحن, باور بانك, باوربانك, باور بنك",
    "charger, chargers, cable, cables, charging cable, charging cables, usb cable, usb-c cable, power bank, power banks, powerbank, fast charger, wireless charger, car charger, adapter, adapters, charging dock",
    "kabl, volt",
  ],
  [
    "earbuds", "mobile-accessories", "سماعات موبايل", "Earbuds & headsets",
    "سماعات موبايل, سماعة موبايل, سماعات, سماعة, سماعات لاسلكية, سماعات وايرلس, سماعة بلوتوث, سماعات اذن, سماعة اذن, هاند فري, هاندفري, سماعات سلك, ايرفون, نيك باند, سماعات رقبة, بودز",
    "earbuds, earbud, earphones, earphone, wireless earbuds, headset, headsets, handsfree, hands-free, in-ear, tws, neckband, wired earphones, true wireless",
    "wasla, electronics-luxe",
  ],

  // ── beauty ──
  [
    "skincare", "beauty", "عناية بالبشرة", "Skincare",
    "عناية بالبشرة, بشرة, عناية بالوجه, سكين كير, سكن كير, كريمات, كريم, سيروم, سيرومات, غسول, غسول وجه, واقي شمس, صن بلوك, ماسكات, ماسك وجه, مرطب, مرطبات, تونر",
    "skincare, skin care, serum, serums, moisturizer, moisturizers, cleanser, cleansers, sunscreen, sunblock, face mask, face masks, toner, face cream, creams, facial care, korean skincare",
    "pure, nada, bashra",
  ],
  [
    "makeup", "beauty", "مكياج", "Makeup",
    "مكياج, ميكب, ميك اب, ميكاب, مستحضرات تجميل, روج, ارواج, احمر شفاه, فاونديشن, كونسيلر, ماسكرا, ايشادو, ايلاينر, بلاشر, كحل, بودرة, فرش مكياج, ادوات مكياج, باليت",
    "makeup, make up, cosmetics, lip liner, lipstick, lipsticks, foundation, concealer, mascara, eyeshadow, eyeliner, blush, makeup brushes, lip gloss, palette, palettes",
    "kohl, beauty-bold, ward",
  ],
  [
    "perfumes", "beauty", "عطور", "Perfumes",
    "عطر, عطور, برفان, برفانات, بارفان, بيرفيوم, عود, بخور, مسك, عطور رجالي, عطور حريمي, عطور شرقية, عطور فرنسية, تركيبات عطور, زيوت عطرية, معطر جسم, بودي سبلاش, مخمرية",
    "perfume, perfumes, fragrance, fragrances, cologne, oud, incense, bakhoor, musk, eau de parfum, body mist, body splash, attar, scent, scents, perfume oils",
    "perfumes-luxe, perfumes-bold, perfumes-warm",
  ],
  [
    "haircare", "beauty", "عناية بالشعر", "Hair care",
    "عناية بالشعر, شامبو, بلسم, زيت شعر, زيوت شعر, حمام كريم, ماسك شعر, كيراتين, بروتين شعر, صبغة, صبغات, صبغة شعر, سيروم شعر, سشوار, مكواة شعر, باروكة, باروكات, اكستنشن, منتجات شعر, كيرلي",
    "hair care, haircare, shampoo, conditioner, hair oil, hair mask, keratin, hair dye, hair color, hair serum, hair dryer, straightener, wig, wigs, hair extensions, curly hair, hair products",
    "botanica, beauty-luxe",
  ],
  [
    "mens-grooming", "beauty", "عناية رجالي", "Men's grooming",
    "عناية رجالي, حلاقة, ادوات حلاقة, ماكينة حلاقة, ماكينات حلاقة, شفرات حلاقة, معجون حلاقة, عناية باللحية, زيت لحية, لحية, دقن, عناية بالدقن, موس, امواس, واكس شعر, افتر شيف",
    "men's grooming, grooming, beard, beard oil, beard care, shaving, shaver, shavers, razor, razors, trimmer, trimmers, aftershave, hair wax, barber, barber supplies, pomade",
    "barber, beauty-luxe",
  ],

  // ── home ──
  [
    "furniture", "home", "أثاث", "Furniture",
    "اثاث, موبيليا, عفش, اثاث منزلي, اثاث مودرن, اثاث مكتبي, غرف نوم, غرفة نوم, غرف سفرة, انتريه, انتريهات, ركنة, كنب, كنبة, كراسي, ترابيزات, ترابيزة, مكاتب, دواليب, سراير",
    "furniture, home furniture, office furniture, sofa, sofas, couch, couches, bed, beds, bedroom, bedrooms, dining table, tables, chairs, chair, wardrobe, wardrobes, desk, desks, living room",
    "furniture-luxe, mobilia, dar",
  ],
  [
    "bedding-textiles", "home", "مفروشات", "Bedding & textiles",
    "مفروشات, مفارش, مفرش, ملايات, ملاية, اطقم سرير, طقم ملايات, لحاف, الحفة, بطاطين, بطانية, مخدات, مخدة, كوفرتة, كوفرتات, فوط, بشاكير, ستائر, سجاجيد, سجاد",
    "bedding, bed sheets, sheets, bedsheets, duvet, duvets, comforter, comforters, blanket, blankets, pillows, pillow, towels, towel, curtains, rugs, carpets, home textiles, linens, quilt",
    "mafrash, tawla, furniture-warm",
  ],
  [
    "decor", "home", "ديكور", "Decor",
    "ديكور, ديكورات, ديكور منزلي, تابلوهات, تابلوه, لوحات, براويز, برواز, فازات, فازة, مرايات, مراية, مرايا, تحف, انتيكات, اكسسوارات منزلية, ساعات حائط, ساعة حائط, ورق حائط, مجسمات",
    "decor, home decor, decoration, decorations, wall art, paintings, picture frames, vases, vase, mirrors, mirror, wall clock, wall clocks, wallpaper, ornaments, figurines, canvas art, home accents",
    "rokn, furniture-warm, sakan",
  ],
  [
    "plants-garden", "home", "نباتات وحدائق", "Plants & garden",
    "نباتات, نبات, نباتات زينة, نباتات داخلية, زرع, مشتل, مشاتل, حدائق, حديقة, جنينة, بذور, تقاوي, اصص, قصاري, سماد, اسمدة, ادوات زراعة, صبار, ورد طبيعي, شتلات",
    "plants, plant, garden, gardening, indoor plants, houseplants, seeds, pots, planters, planter, flower pots, fertilizer, succulents, cactus, plant nursery, garden tools",
    "zarea, furniture-warm",
  ],
  [
    "home-organisation", "home", "تنظيم البيت", "Home organisation",
    "تنظيم البيت, تنظيم, منظمات, منظم, اورجانايزر, اورجنايزر, ادوات تنظيم, تخزين, صناديق تخزين, علب تخزين, سلال, سلة, ارفف, رفوف, شماعات, شماعة, حوامل, منظم ادراج, منظمات مطبخ, استاندات",
    "organizer, organizers, organiser, organisers, home organization, home organisation, storage, storage boxes, storage bins, baskets, shelves, shelf, hangers, racks, drawer organizer, closet organizer, containers",
    "tanzim, daily",
  ],

  // ── kitchen ──
  [
    "cookware", "kitchen", "أواني طهي", "Cookware",
    "اواني طهي, اواني, اواني جرانيت, حلل, حلة, اطقم حلل, طقم حلل, طاسة, طاسات, طواجن, طاجن, صواني, صينية فرن, ادوات مطبخ, ادوات طبخ, سكاكين, سكينة, برام, كسرولة",
    "cookware, pots and pans, pans, pan, frying pan, saucepan, casserole, kitchenware, kitchen tools, kitchen utensils, utensils, knives, knife, baking trays, bakeware, non-stick, granite cookware, pressure cooker",
    "matbakh, daily, beity",
  ],
  [
    "tableware", "kitchen", "أطقم سفرة", "Tableware",
    "اطقم سفرة, طقم سفرة, اطباق, طبق, صحون, كاسات, طقم كاسات, كوبايات, كوباية, مجات, مج, فناجين, اطقم صيني, صيني, اركوبال, اطقم شاي, معالق, ملاعق, ادوات مائدة, اطقم تقديم",
    "tableware, dinnerware, dinner set, dinner sets, plates, plate, bowls, bowl, cups, mugs, mug, glassware, cutlery, spoons, forks, serving dishes, tea set, tea sets, porcelain, drinkware",
    "sufra, tawla",
  ],
  [
    "coffee-gear", "kitchen", "أدوات القهوة", "Coffee gear",
    "ادوات القهوة, ادوات قهوة, ادوات تحضير القهوة, مكن قهوة, مكنة قهوة, ماكينة قهوة, ماكينات قهوة, مكن اسبريسو, ماكينة اسبريسو, مطحنة قهوة, مطاحن, كنكة, كنك, موكا بوت, فرنش بريس, ادوات باريستا, باريستا, دريبر, فلاتر قهوة",
    "coffee gear, coffee equipment, coffee maker, coffee makers, coffee machine, coffee machines, espresso machine, espresso machines, grinder, coffee grinder, moka pot, french press, v60, dripper, barista tools, barista, coffee tools, pour over, coffee accessories",
    "qahwa, roast",
  ],
  [
    "kitchen-appliances", "kitchen", "أجهزة مطبخ", "Kitchen appliances",
    "اجهزة مطبخ, خلاط, خلاطات, كبة, محضر طعام, محضرة طعام, قلاية هوائية, اير فراير, ميكروويف, مايكرويف, غلاية, كاتل, توستر, عجانة, عجان, مضرب كهربائي, عصارة, فرن كهربائي, بوتاجاز, شواية كهربائية",
    "kitchen appliances, blender, blenders, mixer, mixers, air fryer, air fryers, microwave, kettle, electric kettle, toaster, food processor, juicer, stand mixer, electric oven, hand blender, rice cooker, cooker",
    "beity, shasha",
  ],

  // ── food ──
  [
    "grocery", "food", "بقالة", "Grocery",
    "بقالة, سوبر ماركت, سوبرماركت, ماركت, هايبر, ميني ماركت, مواد غذائية, منتجات غذائية, تموين, خزين, بقوليات, ارز, مكرونة, معلبات, منظفات, مشروبات, عصائر, البان, جبن, اجبان",
    "grocery, groceries, supermarket, market, minimarket, mini market, food products, pantry, canned food, beverages, drinks, dairy, cheese, rice, pasta, snacks, household supplies",
    "souq, harvest, grocery-bold",
  ],
  [
    "fresh-produce", "food", "خضار وفاكهة", "Fresh produce",
    "خضار, خضروات, خضراوات, فاكهة, فواكه, خضري, فكهاني, خضار طازة, فاكهة طازة, ورقيات, اورجانيك, منتجات عضوية, عضوي, مزرعة, محاصيل",
    "fresh produce, produce, vegetables, vegetable, veggies, fruits, fruit, greens, organic, organic food, farm fresh, farm, fresh fruits, fresh vegetables, greengrocer",
    "khodar, grocery-warm",
  ],
  [
    "meat-poultry", "food", "لحوم ودواجن", "Meat & poultry",
    "لحوم, لحمة, لحم, لحوم بلدي, لحمة بلدي, لحوم مجمدة, دواجن, فراخ, جزارة, جزار, كفتة, سجق, مجمدات, سمك طازج, مأكولات بحرية, جمبري, ضاني, كندوز, بتلو, كبدة",
    "meat, meats, poultry, chicken, beef, lamb, butcher, butchery, fresh meat, frozen meat, sausages, minced meat, steak, steaks, seafood, turkey, halal meat",
    "lahma, grocery-bold",
  ],
  [
    "bakery", "food", "مخبوزات", "Bakery",
    "مخبوزات, مخبوزات طازة, مخبز, فرن, عيش, خبز, فينو, كرواسون, باتيه, بسكويت, قرص, فطير, فطائر, معجنات, توست, بقسماط, دونتس",
    "bakery, bakeries, baked goods, bread, breads, croissant, croissants, pastry, pastries, buns, toast, bagels, donuts, doughnuts, sourdough, biscuits, pies, muffins",
    "loaf, sabaho",
  ],
  [
    "spices-herbs", "food", "عطارة", "Spices & herbs",
    "عطارة, عطار, توابل, بهارات, بهار, خلطات توابل, تتبيلات, اعشاب, عشب, اعشاب طبيعية, شاي اعشاب, عسل, عسل نحل, زيوت طبيعية, كمون, فلفل اسود, قرفة, حبة البركة",
    "spices, spice, spice blends, herbs, herb, dried herbs, seasoning, seasonings, herbal, herbal tea, honey, natural oils, cumin, cinnamon, black pepper, apothecary, saffron",
    "atara, grocery-luxe",
  ],
  [
    "fast-food", "food", "وجبات سريعة", "Fast food",
    "وجبات سريعة, وجبات, مطعم, مطاعم, برجر, بيتزا, شاورما, كريب, سندوتشات, ساندوتشات, سندوتش, فرايد تشيكن, بروست, كشري, فطار, اكل بيتي, اكل جاهز, دليفري, حواوشي, مشويات",
    "fast food, restaurant, restaurants, burger, burgers, pizza, shawarma, sandwiches, sandwich, fried chicken, crepe, crepes, takeaway, delivery, meals, home food, food truck, wraps",
    "sizzle, grocery-bold",
  ],

  // ── sweets ──
  [
    "oriental-sweets", "sweets", "حلويات شرقية", "Oriental sweets",
    "حلويات شرقية, حلويات, حلواني, حلو, حلويات شامية, حلويات مولد, بسبوسة, كنافة, قطايف, بقلاوة, جلاش, كحك, كحك العيد, بيتي فور, غريبة, مشبك, زلابية, لقمة القاضي, ام علي, هريسة",
    "oriental sweets, sweets, arabic sweets, middle eastern sweets, baklava, kunafa, konafa, basbousa, kahk, eid cookies, qatayef, halawa, turkish delight, petit four",
    "halawa, gifts-warm",
  ],
  [
    "chocolate-cakes", "sweets", "شوكولاتة وتورت", "Chocolate & cakes",
    "شوكولاتة, شيكولاتة, شوكولا, شكولاتة, تورت, تورتة, تورتات, تورت مناسبات, تورتة عيد ميلاد, كيك, كيكات, جاتوه, كب كيك, حلويات غربية, براونيز, تشيز كيك, كوكيز, ماكرون, ترافل",
    "chocolate, chocolates, cake, cakes, cupcakes, cupcake, birthday cake, birthday cakes, custom cakes, brownies, cheesecake, cookies, macarons, truffles, desserts, dessert, patisserie, gateaux",
    "halawa, gifts-luxe",
  ],
  [
    "coffee-beans", "sweets", "بن وقهوة", "Coffee",
    "بن, قهوة, قهوة مختصة, بن محوج, بن سادة, بن مطحون, بن برازيلي, بن يمني, قهوة تركي, قهوة عربية, قهوة فرنساوي, قهوة مطحونة, حبوب قهوة, محمصة, محامص, تحميص, اسبريسو, كبسولات قهوة",
    "coffee, coffee beans, beans, specialty coffee, roastery, roasters, roasted coffee, ground coffee, turkish coffee, arabic coffee, espresso, coffee capsules, coffee pods, single origin, instant coffee, coffee blends",
    "bunn, roast",
  ],
  [
    "dates-nuts", "sweets", "تمور ومكسرات", "Dates & nuts",
    "تمور, تمر, بلح, عجوة, مكسرات, لب, سوداني, فول سوداني, كاجو, لوز, فستق, بندق, عين جمل, ياميش, ياميش رمضان, فواكه مجففة, قمر الدين, تسالي, زبيب",
    "dates, nuts, mixed nuts, roasted nuts, almonds, cashews, cashew, pistachio, pistachios, walnuts, hazelnuts, peanuts, dried fruits, dried fruit, trail mix, raisins, medjool",
    "atara, grocery-luxe",
  ],

  // ── kids ──
  [
    "toys", "kids", "ألعاب", "Toys",
    "العاب, لعب, لعبة, لعب اطفال, العاب اطفال, العاب تعليمية, العاب ذكاء, العاب بنات, العاب اولاد, العاب خشب, عرايس, عروسة, عربيات لعب, مكعبات, بازل, دباديب, دبدوب, سكوتر اطفال, صلصال",
    "toys, toy, kids toys, dolls, doll, puzzles, puzzle, building blocks, educational toys, board games, plush toys, stuffed animals, teddy bear, action figures, toy cars, games, wooden toys, playsets",
    "farha, doodle, kids-bold",
  ],
  [
    "baby-essentials", "kids", "مستلزمات البيبي", "Baby essentials",
    "مستلزمات البيبي, مستلزمات بيبي, مستلزمات اطفال, مستلزمات مواليد, بيبي, مواليد, حفاضات, ببرونة, ببرونات, رضاعات, رضاعة, سكاتة, تيتينة, عربية اطفال, عربيات اطفال, كرسي سيارة اطفال, مشاية, سرير اطفال, شنطة مواليد, مناديل مبللة",
    "baby essentials, baby products, baby, babies, newborn, diapers, diaper, nappies, baby bottles, feeding bottles, pacifier, pacifiers, stroller, strollers, baby car seat, baby care, wipes, baby gear",
    "bambino, mama, kids-luxe",
  ],
  [
    "kids-gifts", "kids", "هدايا أطفال", "Kids' gifts",
    "هدايا اطفال, هدايا مواليد, هدايا سبوع, سبوع, توزيعات سبوع, توزيعات, هدايا عيد ميلاد, عيد ميلاد, اعياد ميلاد, مستلزمات اعياد ميلاد, زينة عيد ميلاد, بالونات, بالون, هدايا اولاد, هدايا بنات, بوكس هدايا اطفال, حفلات اطفال, هدايا نجاح",
    "kids gifts, gifts for kids, children's gifts, baby gifts, newborn gifts, baby shower, baby shower gifts, birthday gifts, birthday party, party supplies, balloons, balloon, party favors, kids party, giveaways",
    "hadaya, kids-bold",
  ],
  [
    "school-supplies", "kids", "أدوات مدرسية", "School supplies",
    "ادوات مدرسية, ادوات مدرسة, مستلزمات مدرسية, مستلزمات مدارس, كشاكيل, كشكول, كراسات, كراسة, مقلمة, مقالم, اقلام رصاص, الوان, الوان خشب, لانش بوكس, زمزمية, زمزميات, برايات, استيكة, مسطرة, جلاد",
    "school supplies, back to school, school stationery, school notebooks, school essentials, pencil case, pencil cases, pencils, crayons, colored pencils, lunch box, lunch boxes, water bottle, water bottles, erasers, sharpeners",
    "hekaya, kids-warm",
  ],

  // ── sports ──
  [
    "gym-fitness", "sports", "جيم ولياقة", "Gym & fitness",
    "جيم, لياقة, لياقة بدنية, فتنس, فيتنس, اجهزة رياضية, ادوات رياضية, معدات رياضية, اجهزة جيم, دامبلز, دمبل, اوزان, بار حديد, مشاية كهربائية, كمال اجسام, تمارين, حبل مقاومة, جوانتي جيم",
    "gym, fitness, gym equipment, fitness equipment, exercise equipment, workout equipment, dumbbells, dumbbell, weights, kettlebell, kettlebells, treadmill, resistance bands, home gym, bodybuilding, workout, barbell, crossfit",
    "pace, core, rep",
  ],
  [
    "football", "sports", "كرة قدم", "Football",
    "كرة قدم, ادوات كرة قدم, كورة, كور, كرة, تيشيرتات كورة, تيشيرتات اندية, فانلات, فانلة, فانلات كورة, ملابس كورة, اطقم كورة, جزم كورة, ستارز, جوانتي حارس, شنكار, شراب كورة",
    "football, soccer, footballs, football jerseys, jerseys, jersey, football kits, football boots, football shirts, cleats, soccer cleats, goalkeeper gloves, shin guards, soccer ball, futsal",
    "koora, sports-bold",
  ],
  [
    "running", "sports", "جري", "Running",
    "جري, رياضة الجري, ركض, هرولة, احذية جري, كوتشي جري, جزم جري, ملابس جري, ادوات جري, مستلزمات جري, ماراثون, عدائين",
    "running, runner, runners, running shoes, running gear, running apparel, running shorts, running accessories, marathon, jogging, trail running, track and field, sprint",
    "stride, sports-luxe",
  ],
  [
    "cycling", "sports", "عجل", "Cycling",
    "عجل, عجلة, عجلات, عجل جبلي, عجل سباق, عجل اطفال, عجلة رياضية, دراجات, دراجة, دراجات هوائية, بسكليتة, بسكلتة, بسكليتات, خوذة عجل, قطع غيار عجل, اكسسوارات عجل, سكوتر, سكوترات",
    "cycling, cyclist, bicycle, bicycles, bike, bikes, mountain bike, road bike, kids bikes, bmx, cycling gear, bike accessories, bike parts, bike helmet, scooter, scooters, e-bike",
    "darraga, sports-bold",
  ],
  [
    "outdoor-camping", "sports", "رحلات وتخييم", "Outdoor & camping",
    "رحلات, تخييم, كامبينج, خيم, خيمة, خيام, ادوات رحلات, مستلزمات رحلات, مستلزمات تخييم, كراسي رحلات, سليبنج باج, شوايات, شواية, هايكنج, سفاري, صيد, ادوات صيد, سنارة, ترمس",
    "outdoor, outdoors, camping, camping gear, tent, tents, hiking, sleeping bag, sleeping bags, trekking, fishing, fishing gear, grill, bbq, campfire, adventure gear, picnic, survival gear",
    "basecamp, sports-warm, safar",
  ],
  [
    "yoga", "sports", "يوجا", "Yoga",
    "يوجا, يوغا, مات يوجا, مرتبة يوجا, سجادة يوجا, ملابس يوجا, ادوات يوجا, بلوك يوجا, بيلاتس, بيلاتيس, تأمل, ميديتيشن, استرتش, تمارين استطالة",
    "yoga, yoga mat, yoga mats, yoga wear, yoga pants, yoga blocks, yoga accessories, yoga strap, yoga studio, pilates, meditation, mindfulness, stretching",
    "yoga, sports-luxe",
  ],

  // ── health ──
  [
    "vitamins-supplements", "health", "فيتامينات ومكملات", "Vitamins & supplements",
    "فيتامينات, فيتامين, فيتامين سي, فيتامين د, مكملات, مكملات غذائية, مكمل غذائي, مكملات رياضية, بروتين, واي بروتين, كرياتين, اوميجا 3, كولاجين, زنك, ماغنسيوم, بناء عضلات, حرق دهون, تخسيس",
    "vitamins, vitamin, supplements, supplement, dietary supplements, protein, whey protein, creatine, omega 3, collagen, multivitamin, multivitamins, sports nutrition, nutrition, weight loss, pre-workout, minerals, probiotics",
    "pure, nada, core",
  ],
  [
    "pharmacy-care", "health", "صيدلية وعناية", "Pharmacy & personal care",
    "صيدلية, صيدليات, ادوية, دواء, عناية شخصية, عناية صحية, عناية بالفم, منتجات صيدلية, مستلزمات صيدلية, مستحضرات طبية, معقمات, كمامات, مطهرات, معجون اسنان, فرش اسنان, مسكنات, اسعافات اولية, بلاستر, مرهم",
    "pharmacy, drugstore, medicines, medicine, personal care, oral care, toothpaste, toothbrush, first aid, sanitizer, sanitizers, medical masks, health care, healthcare, hygiene, over the counter, pharmaceutical",
    "ward, nada",
  ],
  [
    "medical-devices", "health", "أجهزة طبية", "Medical devices",
    "اجهزة طبية, مستلزمات طبية, جهاز ضغط, اجهزة ضغط, جهاز سكر, اجهزة سكر, شرائط سكر, ترمومتر, سماعة طبيب, نبولايزر, جهاز استنشاق, جهاز اكسجين, اوكسيميتر, كرسي متحرك, كراسي متحركة, عكاز, مشدات طبية, احزمة طبية, ميزان, موازين",
    "medical devices, medical equipment, medical supplies, blood pressure monitor, glucometer, glucose meter, thermometer, thermometers, nebulizer, wheelchair, wheelchairs, oximeter, pulse oximeter, stethoscope, crutches, orthopedic, braces, mobility aids",
    "techhub, pure",
  ],

  // ── pets ──
  [
    "pet-food", "pets", "أكل حيوانات", "Pet food",
    "اكل حيوانات, اكل حيوانات اليفة, اكل قطط, اكل كلاب, طعام قطط, طعام كلاب, طعام حيوانات, دراي فود, دراي فوود, ويت فود, سناكس قطط, تريتس, علف, اعلاف",
    "pet food, cat food, dog food, dry food, wet food, kibble, pet treats, dog treats, cat treats, pet nutrition, puppy food, kitten food, animal feed",
    "grocery-warm, harvest",
  ],
  [
    "pet-accessories", "pets", "مستلزمات حيوانات", "Pet accessories",
    "مستلزمات حيوانات, مستلزمات قطط, مستلزمات كلاب, اكسسوارات حيوانات, اكسسوارات قطط, بيت قطط, سرير قطط, بوكس قطط, ليتر بوكس, رمل قطط, طوق كلاب, العاب قطط, العاب كلاب, قطط, كلاب, حيوانات اليفة, بيت شوب",
    "pet accessories, pet supplies, pet shop, pet store, pets, pet, cat litter, litter box, dog collar, collars, leash, leashes, pet toys, pet bed, pet beds, cat tree, pet carrier, cats, dogs, pet grooming",
    "kids-warm, gifts-warm",
  ],
  [
    "fish-birds", "pets", "أسماك وطيور", "Fish & birds",
    "اسماك زينة, سمك زينة, احواض سمك, حوض سمك, احواض, فلاتر احواض, اكواريوم, اكل سمك, طيور, طيور زينة, عصافير, عصفور, اكل عصافير, اقفاص, قفص, ببغاء, ببغاوات, كناري, بادجي",
    "pet fish, aquarium, aquariums, fish tank, fish tanks, ornamental fish, fish food, birds, bird, bird cage, bird cages, bird food, parrots, parrot, canary, budgies, aquatic, pond",
    "zarea, grocery-warm",
  ],

  // ── auto ──
  [
    "car-accessories", "auto", "إكسسوارات سيارات", "Car accessories",
    "اكسسوارات سيارات, اكسسوارات عربيات, كماليات سيارات, كماليات عربيات, كماليات, شاشات عربيات, كاسيت, كاسيت عربية, حامل موبايل عربية, كاميرا عربية, داش كام, حساسات, حساسات ركن, اضاءة عربيات, كشافات عربيات, ليدات عربيات, سماعات عربيات, قطع غيار سيارات, قطع غيار",
    "car accessories, auto accessories, car gadgets, car electronics, dash cam, dashcam, car screen, car stereo, car audio, parking sensors, car phone holder, car lights, car parts, auto parts, spare parts, automotive",
    "garage, tarik, drive",
  ],
  [
    "car-care", "auto", "عناية بالسيارة", "Car care",
    "عناية بالسيارة, عناية بالعربية, عناية سيارات, تلميع, تلميع سيارات, غسيل سيارات, غسيل عربيات, شامبو سيارات, واكس سيارات, نانو سيراميك, بوليش, منظفات سيارات, ملمع تابلوه, فوط مايكروفايبر, معطر سيارات, معطرات سيارات, ديتيلنج, زيوت سيارات, زيت موتور",
    "car care, car wash, car detailing, detailing, car polish, car wax, car shampoo, ceramic coating, car cleaning, car cleaner, microfiber towels, car air freshener, air fresheners, engine oil, motor oil",
    "garagy, pitstop",
  ],
  [
    "tyres-batteries", "auto", "كاوتش وبطاريات", "Tyres & batteries",
    "كاوتش, كاوتشات, كاوتش عربيات, فرد كاوتش, اطارات, اطار, اطارات سيارات, بطاريات, بطارية, بطاريات سيارات, بطارية عربية, بطاريات جافة, جنوط, جنط, ترصيص, ظبط زوايا",
    "tyres, tyre, tires, tire, car tyres, car batteries, car battery, batteries, battery, rims, wheels, alloy wheels, wheel alignment, tire shop, tyre shop",
    "tyre, pitstop",
  ],
  [
    "motorcycle", "auto", "موتوسيكلات", "Motorcycle gear",
    "موتوسيكل, موتوسيكلات, موتسيكل, موتسيكلات, دراجات نارية, دراجة نارية, خوذة, خوذ, خوذة موتوسيكل, اكسسوارات موتوسيكلات, قطع غيار موتوسيكلات, جوانتي موتوسيكل, جاكيت موتوسيكل, زيت موتوسيكل, اسكوتر",
    "motorcycle, motorcycles, motorbike, motorbikes, moto, motorcycle gear, motorcycle helmet, motorcycle parts, motorcycle accessories, helmet, helmets, riding gear, riding gloves, riding jacket, biker, bikers",
    "moto, garage",
  ],
  [
    "car-interior", "auto", "فرش وزينة", "Interior styling",
    "فرش وزينة, فرش عربيات, فرش سيارات, فرش جلد, زينة عربيات, زينة سيارات, دواسات, دواسة, دواسات عربيات, ارضيات عربيات, اغطية مقاعد, كسوة عربيات, كسوة, تلبيسة, تلبيسات, غطاء طارة, طارة, تنجيد, تنجيد عربيات, مساند",
    "car interior, interior styling, interior accessories, seat covers, car seat covers, floor mats, car mats, steering wheel cover, car upholstery, upholstery, car cushions, sunshade, sunshades, car organizer, dashboard cover",
    "zeina, garage",
  ],
  [
    "ev-charging", "auto", "شحن كهربائي", "EV charging",
    "شحن كهربائي, شحن عربيات كهربائية, شحن سيارات كهربائية, شاحن عربية كهربائية, شواحن سيارات كهربائية, شاحن منزلي للسيارات, كابل شحن سيارات, سيارات كهربائية, عربيات كهربائية, عربية كهربائية, محطات شحن, محطة شحن, وول بوكس",
    "ev charging, ev charger, ev chargers, ev cable, ev accessories, ev, electric vehicle, electric vehicles, electric car, electric cars, charging station, charging stations, wallbox, home charger",
    "kahraba, drive",
  ],

  // ── handmade ──
  [
    "handmade-gifts", "handmade", "هدايا هاند ميد", "Handmade gifts",
    "هدايا هاند ميد, هاند ميد, هاندميد, هدايا, هدية, هدايا مخصصة, هدايا بالاسم, هدايا مناسبات, بوكسات هدايا, بوكس هدايا, شغل يدوي, اشغال يدوية, مشغولات يدوية, صناعة يدوية, ريزن, ريزين, ماكراميه, مكرمية",
    "handmade gifts, handmade, hand made, gifts, gift, gift shop, gift boxes, gift box, gift sets, personalized gifts, custom gifts, crafts, handcrafted, handicrafts, resin, resin art, macrame, artisan",
    "gifts-warm, gifts-luxe, gifts-bold",
  ],
  [
    "ceramics", "handmade", "فخار وخزف", "Ceramics",
    "فخار, خزف, فخاريات, خزفيات, سيراميك, فخار يدوي, خزف يدوي, اواني فخار, طواجن فخار, فازات فخار, مبخرة فخار, مجات خزف, اطباق خزف, قلل, زير, بوتري",
    "ceramics, ceramic, pottery, handmade pottery, glazed pottery, stoneware, clay, clay pots, ceramic mugs, ceramic plates, ceramic art, earthenware, terracotta",
    "fokhar, rokn",
  ],
  [
    "candles-soap", "handmade", "شموع وصابون", "Candles & soap",
    "شموع, شمع, شمعة, شموع معطرة, شموع عطرية, شموع ديكور, شموع صويا, صابون, صابونة, صابون طبيعي, صابون يدوي, صابون مغربي, فواحات, فواحة, مباخر, معطرات جو, بومب استحمام",
    "candles, candle, scented candles, soy candles, candle making, soap, soaps, handmade soap, natural soap, wax melts, diffusers, diffuser, bath bombs, aromatherapy, home fragrance",
    "gifts-warm, botanica",
  ],
  [
    "crochet-embroidery", "handmade", "كروشيه وتطريز", "Crochet & embroidery",
    "كروشيه, تطريز, تطريز يدوي, مطرزات, تريكو, صوف, خيوط, خيوط صوف, خيط, ابر كروشيه, عرايس كروشيه, شنط كروشيه, مفارش كروشيه, اميجرومي, كنفاه, ايتامين, باتش ورك, شغل ابرة",
    "crochet, handmade crochet, crochet bags, embroidery, embroidered, knitting, knitted, yarn, yarns, wool, amigurumi, cross stitch, needlework, patchwork, thread, threads",
    "gifts-warm, tawla",
  ],

  // ── books ──
  [
    "books", "books", "كتب", "Books",
    "كتب, كتاب, روايات, رواية, كتب دينية, كتب تعليمية, كتب خارجية, كتب مستعملة, كتب عربية, كتب انجليزي, كتب جامعية, كتب تنمية بشرية, مصاحف, مصحف, دار نشر, قصص, مجلات, مراجع",
    "books, book, bookstore, bookshop, book store, novels, novel, used books, textbooks, textbook, publishing, publisher, quran, comics, manga, magazines, fiction, non-fiction",
    "hekaya, gifts-luxe",
  ],
  [
    "stationery", "books", "أدوات مكتبية", "Stationery",
    "ادوات مكتبية, مكتبة, مكتبات, قرطاسية, مستلزمات مكتب, اقلام, قلم, اقلام حبر, نوت بوك, نوتبوك, نوتات, اجندة, اجندات, بلانر, ورق, ورق طباعة, ملفات, دباسة, استيكرز, هايلايتر",
    "stationery, stationary, office supplies, pens, pen, notebooks, notebook, planner, planners, journals, journal, sticky notes, paper, files, folders, markers, highlighters, stickers, desk accessories",
    "hekaya, tanzim",
  ],
  [
    "kids-books", "books", "كتب أطفال", "Children's books",
    "كتب اطفال, قصص اطفال, قصص مصورة, قصص تربوية, قصص قبل النوم, حواديت, حدوتة, حكايات, حكايات اطفال, كتب تلوين, كتاب تلوين, كتب تفاعلية, مجلات اطفال",
    "children's books, kids books, picture books, storybooks, story books, coloring books, colouring books, bedtime stories, activity books, board books, fairy tales, early readers",
    "hekaya, kids-warm",
  ],
];

export const NICHES: readonly Niche[] = ROWS.map(([id, industry, ar, en, keywordsAr, keywordsEn]) => ({
  id,
  industry,
  name: { ar, en },
  keywords: { ar: k(keywordsAr), en: k(keywordsEn) },
}));

/** Niche id → the template keys picked for it (plan §2.2), best first. */
export const NICHE_LOOKS: Readonly<Record<string, readonly string[]>> = Object.fromEntries(ROWS.map((row) => [row[0], k(row[6])]));

const BY_ID = new Map(NICHES.map((niche) => [niche.id, niche]));

export const getNiche = (id: string | null | undefined): Niche | null => (id ? (BY_ID.get(id) ?? null) : null);

export const nichesOfIndustry = (industryId: string): Niche[] => NICHES.filter((niche) => niche.industry === industryId);

/**
 * Every name a store industry has or had, per industry id. A store category
 * that is exactly one of these names says which industry the store is in and
 * nothing about its niche, so `matchNiche` reads the industry from it and does
 * not score its words. Kept equal to `STORE_INDUSTRIES` (names and aliases) by
 * a test in packages/store-editor (store-editor imports this package, not the
 * reverse).
 */
export const NICHE_INDUSTRY_NAMES: Readonly<Record<string, readonly string[]>> = {
  fashion: ["Fashion", "أزياء وملابس"],
  "shoes-bags": ["Shoes & Bags", "أحذية وشنط"],
  electronics: ["Electronics", "إلكترونيات"],
  "mobile-accessories": ["Mobile Accessories", "إكسسوارات موبايل"],
  beauty: ["Beauty & Cosmetics", "تجميل ومستحضرات"],
  home: ["Home & Furniture", "منزل وأثاث"],
  kitchen: ["Kitchen & Appliances", "مطبخ وأجهزة منزلية"],
  food: ["Food & Groceries", "أغذية وبقالة"],
  sweets: ["Sweets & Coffee", "حلويات وقهوة"],
  kids: ["Kids & Toys", "أطفال وألعاب"],
  sports: ["Sports & Fitness", "رياضة ولياقة"],
  jewelry: ["Accessories & Jewelry", "إكسسوارات ومجوهرات", "Jewelry & Watches", "مجوهرات وساعات"],
  books: ["Books & Stationery", "كتب وأدوات مكتبية"],
  health: ["Health & Pharmacy", "صحة وصيدلية"],
  pets: ["Pets", "حيوانات أليفة"],
  auto: ["Car Accessories", "إكسسوارات سيارات"],
  handmade: ["Handmade & Gifts", "هاند ميد وهدايا"],
};
