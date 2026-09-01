import {
  parsedProductImportSchema,
  type ImportFormat,
  type LocalizedImportFields,
  type ParseProductImportOutput,
  type ParsedProductImport,
} from "./parse-product-import.types";

const TEXT_SECTION_MARKERS =
  /\[?\s*(product\s*name|product\s*description|description|bullet\s*points|key\s*features|pricing|price|inventory|stock|variants|product\s*variants|images|media|shipping|seo|search\s*engine|brand|category)\s*\]?/i;

const TEXT_DATA_MARKERS =
  /(?:list\s*price|product\s*price|final\s*price|sku\s*:|quantity\s*:|color\s+\w+\s*:|🇬🇧|🇪🇬|\ben\s*:|ar\s*:)/i;

export function detectImportFormat(input: string): ImportFormat {
  const trimmed = input.trim();
  if (!trimmed) return "unknown";

  if (/^https?:\/\//i.test(trimmed)) {
    return "url";
  }

  if (trimmed.startsWith("{")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      return "unknown";
    }
  }

  if (TEXT_SECTION_MARKERS.test(trimmed) || TEXT_DATA_MARKERS.test(trimmed)) {
    return "text";
  }

  return "unknown";
}

export function parseProductImport(input: string): ParseProductImportOutput {
  const format = detectImportFormat(input);

  if (format === "unknown") {
    return {
      success: false,
      format,
      error:
        "Unrecognized import format. Paste a product URL, JSON, or formatted text. See PRODUCT_DATA_FORMAT.md.",
    };
  }

  if (format === "url") {
    return {
      success: false,
      format,
      error: "URL imports are handled by the scrape API, not the text parser.",
    };
  }

  if (format === "json") {
    return parseProductImportJson(input);
  }

  return parseProductImportText(input);
}

export function parseProductImportJson(input: string): ParseProductImportOutput {
  let raw: unknown;

  try {
    raw = JSON.parse(input.trim());
  } catch {
    return {
      success: false,
      format: "json",
      error: "Invalid JSON syntax.",
    };
  }

  const normalized = normalizeJsonImport(raw);
  return validateParsedImport(normalized, "json");
}

export function parseProductImportText(input: string): ParseProductImportOutput {
  const normalized = parseTextToRaw(input);
  return validateParsedImport(normalized, "text");
}

function validateParsedImport(
  data: ParsedProductImport,
  format: ImportFormat
): ParseProductImportOutput {
  const result = parsedProductImportSchema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return {
      success: false,
      format,
      error: details[0] ?? "Validation failed.",
      details,
    };
  }

  return {
    success: true,
    format,
    data: result.data,
  };
}

function normalizeJsonImport(raw: unknown): ParsedProductImport {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const obj = raw as Record<string, unknown>;
  const localized = normalizeLocalizedFromJson(obj);

  return {
    version: typeof obj.version === "string" ? obj.version : "1",
    localized,
    price: normalizePriceFromJson(obj.price ?? obj.pricing),
    sku: pickString(obj, ["sku", "SKU"]),
    quantity: pickNumber(obj, ["quantity", "stock", "qty"]),
    images: normalizeImages(obj.images ?? obj.imageUrls ?? obj.image),
    variantTypes: normalizeVariantTypesFromJson(obj.variantTypes ?? obj.variants),
    dimensions: normalizeDimensionsFromJson(obj.dimensions),
    fulfillmentType: pickEnum(obj, ["fulfillmentType", "fulfillment"], [
      "seller_fulfilled",
      "platform_fulfilled",
      "fba",
      "digital",
    ]) as ParsedProductImport["fulfillmentType"],
    freeDelivery: pickBoolean(obj, ["freeDelivery", "free_delivery"]),
    handlingTime: pickNumber(obj, ["handlingTime", "handling_time"]),
    condition: pickEnum(obj, ["condition"], [
      "new",
      "renewed",
      "refurbished",
      "used_like_new",
      "used_very_good",
      "used_good",
      "used_acceptable",
    ]) as ParsedProductImport["condition"],
    isTrending: pickBoolean(obj, ["isTrending", "trending"]),
    isSeasonal: pickBoolean(obj, ["isSeasonal", "seasonal"]),
    isFeatured: pickBoolean(obj, ["isFeatured", "featured"]),
    brand: pickString(obj, ["brand", "brandName"]),
    category: pickString(obj, ["category", "categoryName"]),
    notes: pickString(obj, ["notes"]),
  };
}

function normalizeLocalizedFromJson(
  obj: Record<string, unknown>
): ParsedProductImport["localized"] {
  const localized = obj.localized as Record<string, unknown> | undefined;

  if (localized && typeof localized === "object") {
    return {
      en: normalizeLocaleFields(localized.en),
      ar: normalizeLocaleFields(localized.ar),
    };
  }

  return {
    en: {
      title: pickString(obj, ["title", "productName", "name", "product_name"]),
      description: pickString(obj, ["description"]),
      content: pickString(obj, ["content"]),
      bulletPoints: normalizeBulletPoints(
        obj.bulletPoints ?? obj.bullet_points ?? obj.features
      ),
      metaTitle: pickString(obj, ["metaTitle", "seo_title", "meta_title"]),
      metaDescription: pickString(obj, [
        "metaDescription",
        "seo_description",
        "meta_description",
      ]),
    },
    ar: {
      title: pickString(obj, ["titleAr", "title_ar", "arabicTitle"]),
      description: pickString(obj, ["descriptionAr", "description_ar"]),
      content: pickString(obj, ["contentAr", "content_ar"]),
      bulletPoints: normalizeBulletPoints(
        obj.bulletPointsAr ?? obj.bullet_points_ar
      ),
      metaTitle: pickString(obj, ["metaTitleAr", "meta_title_ar"]),
      metaDescription: pickString(obj, [
        "metaDescriptionAr",
        "meta_description_ar",
      ]),
    },
  };
}

function normalizeLocaleFields(raw: unknown): LocalizedImportFields {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const obj = raw as Record<string, unknown>;

  return {
    title: pickString(obj, ["title", "name"]),
    description: pickString(obj, ["description"]),
    content: pickString(obj, ["content"]),
    bulletPoints: normalizeBulletPoints(
      obj.bulletPoints ?? obj.bullet_points ?? obj.features
    ),
    metaTitle: pickString(obj, ["metaTitle", "meta_title"]),
    metaDescription: pickString(obj, ["metaDescription", "meta_description"]),
  };
}

function normalizePriceFromJson(raw: unknown): ParsedProductImport["price"] {
  if (!raw) return undefined;

  if (typeof raw === "number") {
    return { list: raw };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const obj = raw as Record<string, unknown>;

  return {
    list: pickNumber(obj, ["list", "listPrice", "productPrice", "base"]),
    final: pickNumber(obj, ["final", "finalPrice", "salePrice"]),
    discountType: pickEnum(obj, ["discountType", "discount_type"], [
      "amount",
      "percent",
    ]) as "amount" | "percent",
    discountValue: pickNumber(obj, ["discountValue", "discount_value"]),
  };
}

function normalizeVariantTypesFromJson(
  raw: unknown
): ParsedProductImport["variantTypes"] {
  if (!Array.isArray(raw)) return undefined;

  const types = raw
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const obj = item as Record<string, unknown>;
      const localized = obj.localized as Record<string, unknown> | undefined;

      if (localized && typeof localized === "object") {
        const en = localized.en as Record<string, unknown> | undefined;
        const ar = localized.ar as Record<string, unknown> | undefined;
        return {
          localized: {
            en: {
              name: pickString(en ?? {}, ["name"]) ?? "",
              values: normalizeStringArray(en?.values ?? en?.options),
            },
            ar: {
              name: pickString(ar ?? {}, ["name"]) ?? "",
              values: normalizeStringArray(ar?.values ?? ar?.options),
            },
          },
        };
      }

      const name = pickString(obj, ["name", "type", "option"]) ?? "";
      const values = normalizeStringArray(
        obj.values ?? obj.options ?? obj.value
      );

      if (!name && values.length === 0) return null;

      return {
        localized: {
          en: { name, values },
          ar: { name: "", values: values.map(() => "") },
        },
      };
    })
    .filter(Boolean);

  return types.length > 0 ? (types as NonNullable<ParsedProductImport["variantTypes"]>) : undefined;
}

function normalizeDimensionsFromJson(
  raw: unknown
): ParsedProductImport["dimensions"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const obj = raw as Record<string, unknown>;

  return {
    length: pickNumber(obj, ["length"]),
    width: pickNumber(obj, ["width"]),
    height: pickNumber(obj, ["height"]),
    weight: pickNumber(obj, ["weight"]),
    unit: pickEnum(obj, ["unit"], ["cm", "in"]) as "cm" | "in",
    weightUnit: pickEnum(obj, ["weightUnit", "weight_unit"], [
      "kg",
      "g",
      "lb",
    ]) as "kg" | "g" | "lb",
  };
}

function parseTextToRaw(input: string): ParsedProductImport {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const sections = splitIntoSections(lines);

  const localized: BilingualLocalized = {
    en: {},
    ar: {},
  };

  let price: ParsedProductImport["price"] = {};
  let sku: string | undefined;
  let quantity: number | undefined;
  const images: string[] = [];
  const variantTypes: NonNullable<ParsedProductImport["variantTypes"]> = [];
  let dimensions: ParsedProductImport["dimensions"] = {};
  let fulfillmentType: ParsedProductImport["fulfillmentType"];
  let freeDelivery: boolean | undefined;
  let handlingTime: number | undefined;
  let brand: string | undefined;
  let category: string | undefined;
  let seoEn: LocalizedImportFields = {};
  let seoAr: LocalizedImportFields = {};

  for (const section of sections) {
    const key = normalizeSectionKey(section.title);

    if (key === "product_name") {
      applyBilingualBlock(section.lines, localized);
    } else if (key === "product_description") {
      applyBilingualBlock(section.lines, localized, "description");
    } else if (key === "bullet_points") {
      applyBilingualBullets(section.lines, localized);
    } else if (key === "pricing") {
      applyPricingLines(section.lines, price);
    } else if (key === "inventory") {
      const inv = parseKeyValueLines(section.lines);
      sku = inv.sku ?? sku;
      quantity = inv.quantity ?? quantity;
    } else if (key === "variants") {
      variantTypes.push(...parseVariantLines(section.lines));
    } else if (key === "images") {
      images.push(...extractUrls(section.lines));
    } else if (key === "shipping") {
      const ship = parseShippingLines(section.lines);
      fulfillmentType = ship.fulfillmentType ?? fulfillmentType;
      freeDelivery = ship.freeDelivery ?? freeDelivery;
      handlingTime = ship.handlingTime ?? handlingTime;
      dimensions = { ...dimensions, ...ship.dimensions };
    } else if (key === "seo") {
      const seo = parseSeoLines(section.lines);
      seoEn = { ...seoEn, ...seo.en };
      seoAr = { ...seoAr, ...seo.ar };
    } else if (key === "brand") {
      brand = section.lines.map((l) => l.trim()).filter(Boolean).join(" ").trim() || brand;
    } else if (key === "category") {
      category = section.lines.map((l) => l.trim()).filter(Boolean).join(" ").trim() || category;
    }
  }

  applyOrphanKeyValues(lines, {
    price,
    sku: (v) => {
      sku = v;
    },
    quantity: (v) => {
      quantity = v;
    },
  });

  if (seoEn.metaTitle) localized.en.metaTitle = seoEn.metaTitle;
  if (seoEn.metaDescription) localized.en.metaDescription = seoEn.metaDescription;
  if (seoAr.metaTitle) localized.ar.metaTitle = seoAr.metaTitle;
  if (seoAr.metaDescription) localized.ar.metaDescription = seoAr.metaDescription;

  const result: ParsedProductImport = {
    version: "1",
    localized,
    price: Object.keys(price).length > 0 ? price : undefined,
    sku,
    quantity,
    images: images.length > 0 ? images : undefined,
    variantTypes: variantTypes.length > 0 ? variantTypes.slice(0, 3) : undefined,
    dimensions: hasDimensionValues(dimensions) ? dimensions : undefined,
    fulfillmentType,
    freeDelivery,
    handlingTime,
    brand,
    category,
  };

  return result;
}

interface TextSection {
  title: string;
  lines: string[];
}

function splitIntoSections(lines: string[]): TextSection[] {
  const sections: TextSection[] = [];
  let current: TextSection | null = null;

  const isHeader = (line: string): string | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const withoutColon = trimmed.replace(/:\s*$/, "");

    const bracket = withoutColon.match(/^\[(.+)\]$/);
    if (bracket) return bracket[1]!.trim();

    if (
      /^(product\s*name|product\s*description|bullet\s*points(\s*&\s*attributes)?|key\s*features|pricing|inventory|stock|variants|product\s*variants|images|media|shipping(\s*options)?|seo|search\s*engine|brand|category)$/i.test(
        withoutColon
      )
    ) {
      return withoutColon;
    }

    if (/^🛒\s*ecommerce/i.test(withoutColon)) {
      return "header";
    }

    return null;
  };

  for (const line of lines) {
    const header = isHeader(line);

    if (header && header !== "header") {
      if (current) sections.push(current);
      current = { title: header, lines: [] };
      continue;
    }

    if (!current) {
      current = { title: "body", lines: [] };
    }

    current.lines.push(line);
  }

  if (current) sections.push(current);

  return sections;
}

function normalizeSectionKey(title: string): string {
  const t = title.toLowerCase().trim();

  if (/product\s*name/.test(t)) return "product_name";
  if (/product\s*description|^description$/.test(t)) return "product_description";
  if (/bullet|key\s*features/.test(t)) return "bullet_points";
  if (/pricing|^price$/.test(t)) return "pricing";
  if (/inventory|stock/.test(t)) return "inventory";
  if (/variant/.test(t)) return "variants";
  if (/image|media/.test(t)) return "images";
  if (/shipping/.test(t)) return "shipping";
  if (/seo|search/.test(t)) return "seo";
  if (/^brand$/.test(t)) return "brand";
  if (/^category$/.test(t)) return "category";
  if (t === "body") return "body";

  return t;
}

type LocaleKey = "en" | "ar";

function detectLocaleLine(line: string): LocaleKey | null {
  const trimmed = line.trim();
  if (/^(🇬🇧\s*)?english\s*:?\s*$/i.test(trimmed) || /^en\s*:\s*$/i.test(trimmed)) {
    return "en";
  }
  if (/^(🇪🇬\s*)?arabic\s*:?\s*$/i.test(trimmed) || /^ar\s*:\s*$/i.test(trimmed)) {
    return "ar";
  }
  return null;
}

type BilingualLocalized = {
  en: LocalizedImportFields;
  ar: LocalizedImportFields;
};

function applyBilingualBlock(
  lines: string[],
  localized: BilingualLocalized,
  field: "title" | "description" = "title"
) {
  let currentLocale: LocaleKey | null = null;
  const buffers: Record<LocaleKey, string[]> = { en: [], ar: [] };

  for (const line of lines) {
    const locale = detectLocaleLine(line);
    if (locale) {
      currentLocale = locale;
      continue;
    }

    const inlineEn = line.match(/^en\s*:\s*(.+)$/i);
    const inlineAr = line.match(/^ar\s*:\s*(.+)$/i);

    if (inlineEn) {
      buffers.en.push(inlineEn[1]!.trim());
      continue;
    }
    if (inlineAr) {
      buffers.ar.push(inlineAr[1]!.trim());
      continue;
    }

    if (currentLocale) {
      const trimmed = line.trim();
      if (trimmed) buffers[currentLocale].push(trimmed);
    }
  }

  if (buffers.en.length > 0) {
    localized.en[field] = buffers.en.join("\n").trim();
  }
  if (buffers.ar.length > 0) {
    localized.ar[field] = buffers.ar.join("\n").trim();
  }
}

function applyBilingualBullets(
  lines: string[],
  localized: BilingualLocalized
) {
  let currentLocale: LocaleKey | null = null;
  const bullets: Record<LocaleKey, string[]> = { en: [], ar: [] };

  for (const line of lines) {
    const locale = detectLocaleLine(line);
    if (locale) {
      currentLocale = locale;
      continue;
    }

    const bulletMatch = line.match(/^\s*[-•*]\s+(.+)$/);
    if (bulletMatch && currentLocale) {
      bullets[currentLocale].push(bulletMatch[1]!.trim());
      continue;
    }

    const inlineEn = line.match(/^en\s*:\s*$/i);
    const inlineAr = line.match(/^ar\s*:\s*$/i);
    if (inlineEn) {
      currentLocale = "en";
      continue;
    }
    if (inlineAr) {
      currentLocale = "ar";
      continue;
    }
  }

  if (bullets.en.length > 0) {
    localized.en.bulletPoints = bullets.en.slice(0, 10);
  }
  if (bullets.ar.length > 0) {
    localized.ar.bulletPoints = bullets.ar.slice(0, 10);
  }
}

function applyPricingLines(
  lines: string[],
  price: NonNullable<ParsedProductImport["price"]>
) {
  for (const line of lines) {
    const kv = parseKeyValue(line);
    if (!kv) continue;

    const key = kv.key.toLowerCase();
    const num = parsePriceNumber(kv.value);

    if (/list|product\s*price|^price$/.test(key) && num !== undefined) {
      price.list = num;
    } else if (/final/.test(key) && num !== undefined) {
      price.final = num;
    } else if (/discount\s*type/.test(key)) {
      const v = kv.value.toLowerCase();
      if (v.includes("percent") || v === "%") price.discountType = "percent";
      else if (v.includes("amount")) price.discountType = "amount";
    } else if (/discount/.test(key) && num !== undefined) {
      price.discountValue = num;
    }
  }
}

function parseKeyValue(line: string): { key: string; value: string } | null {
  const match = line.match(/^\s*([^:]+):\s*(.+)\s*$/);
  if (!match) return null;
  return { key: match[1]!.trim(), value: match[2]!.trim() };
}

function parseKeyValueLines(lines: string[]) {
  let sku: string | undefined;
  let quantity: number | undefined;

  for (const line of lines) {
    const kv = parseKeyValue(line);
    if (!kv) continue;

    const key = kv.key.toLowerCase();
    if (/^sku$/.test(key)) sku = kv.value;
    if (/quantity|stock|qty/.test(key)) {
      const num = parseInt(kv.value.replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(num)) quantity = num;
    }
  }

  return { sku, quantity };
}

function parseVariantLines(
  lines: string[]
): NonNullable<ParsedProductImport["variantTypes"]> {
  const typeMap = new Map<
    string,
    { en: { name: string; values: string[] }; ar: { name: string; values: string[] } }
  >();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const bilingual = trimmed.match(
      /^(.+?)\s+(EN|AR)\s*:\s*(.+)$/i
    );
    if (bilingual) {
      const typeName = bilingual[1]!.trim();
      const locale = bilingual[2]!.toLowerCase() as LocaleKey;
      const values = splitCommaList(bilingual[3]!);

      if (!typeMap.has(typeName)) {
        typeMap.set(typeName, {
          en: { name: typeName, values: [] },
          ar: { name: "", values: [] },
        });
      }

      const entry = typeMap.get(typeName)!;
      entry[locale].name = locale === "en" ? typeName : entry[locale].name || typeName;
      entry[locale].values = values;
      if (locale === "en" && !entry.en.name) entry.en.name = typeName;
      continue;
    }

    const simple = trimmed.match(/^(.+?)\s*:\s*(.+)$/);
    if (simple) {
      const typeName = simple[1]!.trim();
      const values = splitCommaList(simple[2]!);

      if (!typeMap.has(typeName)) {
        typeMap.set(typeName, {
          en: { name: typeName, values },
          ar: { name: "", values: values.map(() => "") },
        });
      } else {
        typeMap.get(typeName)!.en.values = values;
      }
    }
  }

  return Array.from(typeMap.values()).map((v) => ({
    localized: {
      en: v.en,
      ar: v.ar.name || v.ar.values.some(Boolean)
        ? { name: v.ar.name || v.en.name, values: v.ar.values }
        : { name: "", values: v.en.values.map(() => "") },
    },
  }));
}

function parseShippingLines(lines: string[]) {
  let fulfillmentType: ParsedProductImport["fulfillmentType"];
  let freeDelivery: boolean | undefined;
  let handlingTime: number | undefined;
  const dimensions: ParsedProductImport["dimensions"] = {};

  for (const line of lines) {
    const kv = parseKeyValue(line);
    if (!kv) continue;

    const key = kv.key.toLowerCase();
    const val = kv.value.toLowerCase();

    if (/fulfillment/.test(key)) {
      if (val.includes("platform")) fulfillmentType = "platform_fulfilled";
      else if (val.includes("seller")) fulfillmentType = "seller_fulfilled";
      else if (val.includes("fba")) fulfillmentType = "fba";
      else if (val.includes("digital")) fulfillmentType = "digital";
    } else if (/free\s*delivery/.test(key)) {
      freeDelivery = val === "true" || val === "yes";
    } else if (/handling/.test(key)) {
      const num = parseInt(kv.value, 10);
      if (Number.isFinite(num)) handlingTime = num;
    } else if (/^weight$/.test(key)) {
      const weightMatch = kv.value.match(/([\d.]+)\s*(kg|g|lb)?/i);
      if (weightMatch) {
        dimensions.weight = parseFloat(weightMatch[1]!);
        if (weightMatch[2]) {
          dimensions.weightUnit = weightMatch[2]!.toLowerCase() as "kg" | "g" | "lb";
        }
      }
    } else if (/^length$/.test(key)) {
      dimensions.length = parseDimensionValue(kv.value);
      dimensions.unit = parseDimensionUnit(kv.value) ?? dimensions.unit;
    } else if (/^width$/.test(key)) {
      dimensions.width = parseDimensionValue(kv.value);
      dimensions.unit = parseDimensionUnit(kv.value) ?? dimensions.unit;
    } else if (/^height$/.test(key)) {
      dimensions.height = parseDimensionValue(kv.value);
      dimensions.unit = parseDimensionUnit(kv.value) ?? dimensions.unit;
    }
  }

  return { fulfillmentType, freeDelivery, handlingTime, dimensions };
}

function parseSeoLines(lines: string[]) {
  const en: LocalizedImportFields = {};
  const ar: LocalizedImportFields = {};

  for (const line of lines) {
    const kv = parseKeyValue(line);
    if (!kv) continue;

    const key = kv.key.toLowerCase();
    if (/en\s*meta\s*title|meta\s*title\s*\(en\)/.test(key)) {
      en.metaTitle = kv.value.slice(0, 60);
    } else if (/en\s*meta\s*description|meta\s*description\s*\(en\)/.test(key)) {
      en.metaDescription = kv.value.slice(0, 160);
    } else if (/ar\s*meta\s*title|meta\s*title\s*\(ar\)/.test(key)) {
      ar.metaTitle = kv.value.slice(0, 60);
    } else if (/ar\s*meta\s*description|meta\s*description\s*\(ar\)/.test(key)) {
      ar.metaDescription = kv.value.slice(0, 160);
    }
  }

  return { en, ar };
}

function applyOrphanKeyValues(
  lines: string[],
  handlers: {
    price: NonNullable<ParsedProductImport["price"]>;
    sku: (v: string) => void;
    quantity: (v: number) => void;
  }
) {
  for (const line of lines) {
    const kv = parseKeyValue(line);
    if (!kv) continue;

    const key = kv.key.toLowerCase();

    if (/list\s*price|product\s*price/.test(key)) {
      const num = parsePriceNumber(kv.value);
      if (num !== undefined) handlers.price.list = num;
    } else if (/final\s*price/.test(key)) {
      const num = parsePriceNumber(kv.value);
      if (num !== undefined) handlers.price.final = num;
    } else if (/^sku$/.test(key)) {
      handlers.sku(kv.value);
    } else if (/quantity|stock/.test(key)) {
      const num = parseInt(kv.value.replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(num)) handlers.quantity(num);
    }
  }
}

function extractUrls(lines: string[]): string[] {
  const urls: string[] = [];
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

  for (const line of lines) {
    const matches = line.match(urlRegex);
    if (matches) urls.push(...matches);
  }

  return urls.slice(0, 8);
}

function splitCommaList(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parsePriceNumber(value: string): number | undefined {
  const match = value.replace(/,/g, "").match(/[\d.]+/);
  if (!match) return undefined;
  const num = parseFloat(match[0]!);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function parseDimensionValue(value: string): number | undefined {
  const match = value.match(/([\d.]+)/);
  if (!match) return undefined;
  const num = parseFloat(match[1]!);
  return Number.isFinite(num) ? num : undefined;
}

function parseDimensionUnit(value: string): "cm" | "in" | undefined {
  if (/\bin\b|inch/i.test(value)) return "in";
  if (/\bcm\b/i.test(value)) return "cm";
  return undefined;
}

function hasDimensionValues(
  dims: ParsedProductImport["dimensions"]
): boolean {
  if (!dims) return false;
  return (
    dims.length !== undefined ||
    dims.width !== undefined ||
    dims.height !== undefined ||
    dims.weight !== undefined
  );
}

function normalizeBulletPoints(raw: unknown): string[] | undefined {
  const arr = normalizeStringArray(raw);
  return arr.length > 0 ? arr.slice(0, 10) : undefined;
}

function normalizeStringArray(raw: unknown): string[] {
  if (typeof raw === "string") {
    return raw
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeImages(raw: unknown): string[] | undefined {
  if (typeof raw === "string") {
    const urls = raw.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi);
    return urls ? urls.slice(0, 8) : undefined;
  }
  if (!Array.isArray(raw)) return undefined;
  const urls = raw.filter(
    (item): item is string => typeof item === "string" && /^https?:\/\//i.test(item)
  );
  return urls.length > 0 ? urls.slice(0, 8) : undefined;
}

function pickString(
  obj: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return undefined;
}

function pickNumber(
  obj: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string") {
      const num = parsePriceNumber(val);
      if (num !== undefined) return num;
    }
  }
  return undefined;
}

function pickBoolean(
  obj: Record<string, unknown>,
  keys: string[]
): boolean | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "boolean") return val;
    if (val === "true" || val === "yes") return true;
    if (val === "false" || val === "no") return false;
  }
  return undefined;
}

function pickEnum(
  obj: Record<string, unknown>,
  keys: string[],
  allowed: string[]
): string | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && allowed.includes(val)) return val;
  }
  return undefined;
}

/** Build ParsedProductImport from URL scrape API responses (EN + AR). */
export function buildParsedImportFromScrape(
  dataEn: Record<string, unknown>,
  dataAr: Record<string, unknown>
): ParsedProductImport {
  const parseScraped = (data: Record<string, unknown>) => ({
    title: typeof data.title === "string" ? data.title.trim() : "",
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    bulletPoints: Array.isArray(data.bulletPoints)
      ? data.bulletPoints
          .filter((b): b is string => typeof b === "string")
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 10)
      : [],
    images: Array.isArray(data.images)
      ? data.images.filter((img): img is string => typeof img === "string")
      : [],
    price:
      parsePriceNumber(String(data.priceAmount ?? data.price ?? "")) ??
      undefined,
  });

  const en = parseScraped(dataEn);
  const ar = parseScraped(dataAr);
  const scrapedPrice = en.price ?? ar.price;
  const scrapedImages =
    en.images.length > 0 ? en.images : ar.images;

  return {
    version: "1",
    localized: {
      en: {
        title: en.title,
        description: en.description,
        bulletPoints: en.bulletPoints,
      },
      ar: {
        title: ar.title,
        description: ar.description,
        bulletPoints: ar.bulletPoints,
      },
    },
    price: scrapedPrice ? { list: scrapedPrice } : undefined,
    images: scrapedImages.length > 0 ? scrapedImages : undefined,
    quantity: 25,
  };
}

export { parsePriceNumber };
