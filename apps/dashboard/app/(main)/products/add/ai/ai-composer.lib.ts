/**
 * What the AI composer checks while the seller types (Seller Add Product v4). Only a
 * guide for the checklist and the send button: the model still reads the prices itself,
 * and nothing here is saved. So it must never block a seller who gave a price, and when
 * unsure it shows a price with no sale rather than an invented one.
 */

const toAscii = (text: string) =>
  text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));

const NUMBER = /\d{1,3}(?:[,٬]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;
/** Not followed by another letter, so "مل" doesn't match "مليون" and "ج" doesn't match "جميل". */
const END = String.raw`(?![\p{L}\p{M}])`;
/** Between a word and its number: "السعر: 500", "بعد الخصم يبقى 950". */
const GAP = String.raw`[\s:=،,.\-–]*(?:(?:هو|يبقى|ب|بـ|to)\s*)?`;

const PERCENT_AFTER = /^\s*(?:[%٪]|بالمئة|بالمية|في\s*الم[ئي]+ة|percent)/iu;
const CURRENCY_AFTER = new RegExp(String.raw`^\s*(?:جني[هة]|ج\.?\s?م${END}|ج${END}|ل\.?\s?م${END}|ريال|درهم|ر\.?\s?س${END}|EGP|L\.?\s?E\.?${END}|SAR|AED|USD|\$)`, "iu");
/** A count or a size, not money: "3 ايام", "2 قطعة", "5 نجوم", "500 جرام". */
const UNIT_AFTER = new RegExp(
  String.raw`^\s*(?:[اأ]يام|يوم|يومين|ساع[ةه]|ساعات|دقيق[ةه]|دقايق|[اأ]سبوع|اسابيع|شهر|شهور|سن[ةه]|سنين|سنوات|days?|hours?|hrs?|weeks?|months?|years?|قطع[ةه]|قطع|حب[ةه]|pcs?|pieces?|مقاس|مقاسات|sizes?|لون|[اأ]لوان|colou?rs?|سم|cm|متر|مم|mm|كجم|كيلو|kg|جم|جرام|grams?|g|مل|ml|لتر|نجوم|نجم[ةه]|stars?|واط|وات|watts?|فولت|جيجا|gb|ميجا|mah|فرد|شخص|[اأ]شخاص)${END}`,
  "iu",
);
/** The number names something else: "مقاس 42", "مقاسات 40 41", "موديل 2024", "بلوتوث 5.3". */
const SPEC_BEFORE = /(?:مقاس|مقاسات|size|sizes|رقم|موديل|model|[اإ]صدار|version|بلوتوث|bluetooth)[\d\s:=،,.\-/]*$/iu;

const SALE_BEFORE = new RegExp(String.raw`(?:بعد\s+(?:ال)?خصم|بعد\s+التخفيض|سعر\s+العرض|بق[ىا]|بقت|الآن|الان|دلوقتي|after\s+discount|sale(?:\s+price)?|now)${GAP}$`, "iu");
const OLD_BEFORE = new RegExp(String.raw`(?:كان|كانت|بدل|قبل\s+(?:ال)?خصم|before\s+discount|was)${GAP}$`, "iu");
const PRICE_BEFORE = new RegExp(String.raw`(?:(?:سعر|السعر|سعره|سعرها|بسعر|الثمن|price)[^\d\n]{0,16}|(?:بكام|for|cost)${GAP})$`, "iu");
/** "ب500", "بـ 500": the letter alone, on its own or stuck to the number. */
const BI_PREFIX = /(?:^|[\s(،,:.])بـ?\s*$/u;

export type ParsedPrices = { price: number | null; sale: number | null; percentOff: number | null };

const biggest = (values: number[]) => (values.length ? Math.max(...values) : null);

/**
 * Reads each number by what stands around it. A sale needs a real signal ("بعد الخصم",
 * "كان 800 بقى 500"); two amounts alone don't make one. An amount with a price word or
 * a currency beats any bare number.
 */
export function parsePrices(raw: string): ParsedPrices {
  const text = toAscii(raw);
  const sales: number[] = [];
  const olds: number[] = [];
  const named: number[] = [];
  const withCurrency: number[] = [];
  const bare: number[] = [];

  for (const match of text.matchAll(NUMBER)) {
    const index = match.index;
    const line = text.slice(0, index).split("\n").pop() ?? "";
    const after = text.slice(index + match[0].length);
    const value = Number.parseFloat(match[0].replace(/[,٬]/g, ""));
    if (!(value > 0)) continue;

    const previous = line.at(-1) ?? "";
    if (previous === "." || previous === "," || previous === "٬") continue;
    const stuckBefore = /[\p{L}\p{M}]/u.test(previous);
    const biPrefix = BI_PREFIX.test(line);
    if (stuckBefore && !biPrefix) continue; // IPX5, H2O
    if (PERCENT_AFTER.test(after)) continue;
    const hasCurrency = CURRENCY_AFTER.test(after);
    if (!hasCurrency && UNIT_AFTER.test(after)) continue;
    if (!hasCurrency && /^[\p{L}\p{M}]/u.test(after)) continue; // 5G, 3D
    if (!hasCurrency && SPEC_BEFORE.test(line)) continue;

    if (SALE_BEFORE.test(line)) sales.push(value);
    else if (OLD_BEFORE.test(line)) olds.push(value);
    else if (biPrefix || PRICE_BEFORE.test(line)) named.push(value);
    else if (hasCurrency) withCurrency.push(value);
    // A long number or a leading zero is a phone or a code, not a price.
    else if (match[0].length <= 7 && !match[0].startsWith("0")) bare.push(value);
  }

  const percent = text.match(/(\d{1,2})\s*[%٪]/);
  const percentOff = percent ? Number(percent[1]) : null;

  const old = biggest(olds);
  const stated = biggest(named) ?? biggest(withCurrency);
  const listed = old ?? stated ?? biggest(bare);
  const sale = biggest(sales);

  if (listed === null) return { price: sale, sale: null, percentOff };
  if (sale !== null) return { price: Math.max(listed, sale), sale: sale < listed ? sale : null, percentOff };
  // "كان 800 ... 500 جنيه": the other amount is what it costs now.
  if (old !== null && stated !== null && stated < old) return { price: old, sale: stated, percentOff };
  return { price: listed, sale: null, percentOff };
}

/** Words that only talk about the price, so they don't describe the product. */
const PRICE_ONLY_WORDS = new Set(
  "سعر السعر سعره سعرها بسعر الثمن بعد الخصم خصم بخصم بكام كان كانت بقى بقا بقت بدل قبل جنيه جنية جنيها جنيهات جم لم ريال درهم egp le sar aed usd price sale discount after for now was".split(" "),
);

/** At least two real words once the numbers and the price talk are taken out: a short name and a photo are enough. */
export function describesProduct(raw: string): boolean {
  const words = toAscii(raw)
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{M}]/gu, "").replace(/^و(?=بعد|سعر|السعر|خصم|الخصم|بخصم)/u, "").toLowerCase())
    .filter((word) => word.length > 1 && !PRICE_ONLY_WORDS.has(word));
  return words.length >= 2;
}

export const mentionsReviews = (text: string) => /تقييم|تقييمات|★|نجوم|نجمة|review/i.test(text);

export type ComposerRequirements = {
  desc: boolean;
  img: boolean;
  price: boolean;
  rev: boolean;
  prices: ParsedPrices;
  /** The first thing still needed before sending; null when it can be sent. */
  missing: "desc" | "img" | "price" | null;
};

/** A PDF stands in for the description, the photo and the price: it usually holds all three. */
export function checkComposer(text: string, imageCount: number, hasPdf: boolean): ComposerRequirements {
  const prices = parsePrices(text);
  const desc = hasPdf || describesProduct(text);
  const img = hasPdf || imageCount > 0;
  const price = hasPdf || prices.price !== null;
  return {
    desc,
    img,
    price,
    rev: mentionsReviews(text),
    prices,
    missing: !desc ? "desc" : !img ? "img" : !price ? "price" : null,
  };
}
