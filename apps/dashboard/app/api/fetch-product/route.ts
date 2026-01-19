import { NextResponse, type NextRequest } from "next/server";
import { load } from "cheerio";
import { z } from "zod";

const bodySchema = z.object({
  url: z.string().url(),
});

const uniq = (items: string[]) => Array.from(new Set(items));

const toAbsoluteUrl = (baseUrl: string, maybeRelativeUrl: string) => {
  try {
    return new URL(maybeRelativeUrl, baseUrl).toString();
  } catch {
    return undefined;
  }
};

const normalizeText = (value: string) =>
  value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toNumberFromUnknown = (value: unknown) => {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return undefined;
    return value;
  }

  if (typeof value !== "string") return undefined;

  const match = value.replace(/\s+/g, " ").trim().match(/[\d.,]+/);
  if (!match?.[0]) return undefined;

  const normalized = match[0].replace(/,/g, "");
  const num = Number.parseFloat(normalized);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return num;
};

const getFirstMetaContent = (
  $: ReturnType<typeof load>,
  selectors: string[]
) => {
  for (const selector of selectors) {
    const value = $(selector).attr("content");
    const normalized = typeof value === "string" ? normalizeText(value) : "";
    if (normalized) return normalized;
  }
  return undefined;
};

const getFirstText = ($: ReturnType<typeof load>, selectors: string[]) => {
  for (const selector of selectors) {
    const value = $(selector).first().text();
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return undefined;
};

interface JsonLdProductData {
  name?: string
  description?: string
  images: string[]
  additionalProperties: Array<{ name: string; value: string }>
  priceAmount?: number
  priceCurrency?: string
}

const coerceToStringArray = (value: unknown) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string") as string[];
  return [];
};

const extractProductFromJsonLd = (
  $: ReturnType<typeof load>,
  finalUrl: string
): JsonLdProductData | undefined => {
  const scripts = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get()
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);

  const result: JsonLdProductData = {
    images: [],
    additionalProperties: [],
  };

  const pushImages = (imgs: string[]) => {
    for (const img of imgs) {
      const abs = toAbsoluteUrl(finalUrl, img);
      if (abs) result.images.push(abs);
    }
  };

  const isProductType = (type: unknown) => {
    if (typeof type === "string") return type.toLowerCase().includes("product");
    if (Array.isArray(type)) return type.some((t) => typeof t === "string" && t.toLowerCase().includes("product"));
    return false;
  };

  for (const text of scripts) {
    try {
      const json = JSON.parse(text);
      const nodes = Array.isArray(json) ? json : [json];

      for (const node of nodes) {
        const candidates = Array.isArray(node?.["@graph"]) ? node["@graph"] : [node];

        for (const candidate of candidates) {
          if (!candidate) continue;
          if (!isProductType(candidate?.["@type"])) continue;

          const name = typeof candidate?.name === "string" ? normalizeText(candidate.name) : undefined;
          const description = typeof candidate?.description === "string" ? normalizeText(candidate.description) : undefined;
          if (name && !result.name) result.name = name;
          if (description && !result.description) result.description = description;

          pushImages(coerceToStringArray(candidate?.image));

          const additional = candidate?.additionalProperty;
          const additionalList = Array.isArray(additional) ? additional : additional ? [additional] : [];
          for (const prop of additionalList) {
            const propName = typeof prop?.name === "string" ? normalizeText(prop.name) : "";
            const propValueRaw = typeof prop?.value === "string" ? prop.value : prop?.value?.name || prop?.value?.value;
            const propValue = typeof propValueRaw === "string" ? normalizeText(propValueRaw) : "";
            if (propName && propValue) {
              result.additionalProperties.push({ name: propName, value: propValue });
            }
          }

          const offers = candidate?.offers;
          const offerList = Array.isArray(offers) ? offers : offers ? [offers] : [];
          for (const offer of offerList) {
            const amount =
              toNumberFromUnknown(offer?.price) ||
              toNumberFromUnknown(offer?.priceSpecification?.price);
            if (amount && !result.priceAmount) result.priceAmount = amount;
            const currency =
              typeof offer?.priceCurrency === "string"
                ? normalizeText(offer.priceCurrency)
                : undefined;
            if (currency && !result.priceCurrency) result.priceCurrency = currency;
          }
        }
      }
    } catch {
      // ignore JSON parse failures
    }
  }

  result.images = uniq(result.images);
  result.additionalProperties = uniq(
    result.additionalProperties.map((p) => `${p.name}: ${p.value}`)
  ).map((line) => {
    const [name, ...rest] = line.split(":");
    return { name: normalizeText(name || ""), value: normalizeText(rest.join(":") || "") };
  }).filter((p) => p.name && p.value);

  const hasAny =
    Boolean(result.name) ||
    Boolean(result.description) ||
    result.images.length > 0 ||
    result.additionalProperties.length > 0 ||
    Boolean(result.priceAmount);

  return hasAny ? result : undefined;
};

const extractPriceFromJsonLd = ($: ReturnType<typeof load>) => {
  const scripts = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get()
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean);

  for (const text of scripts) {
    try {
      const json = JSON.parse(text);
      const nodes = Array.isArray(json) ? json : [json];

      for (const node of nodes) {
        const candidates = Array.isArray(node?.["@graph"])
          ? node["@graph"]
          : [node];

        for (const candidate of candidates) {
          const offers = candidate?.offers;
          if (!offers) continue;

          const offerList = Array.isArray(offers) ? offers : [offers];
          for (const offer of offerList) {
            const amount =
              toNumberFromUnknown(offer?.price) ||
              toNumberFromUnknown(offer?.priceSpecification?.price);
            if (!amount) continue;

            const currency =
              typeof offer?.priceCurrency === "string"
                ? offer.priceCurrency.trim()
                : undefined;

            return { amount, currency };
          }
        }
      }
    } catch {
      // ignore JSON parse failures
    }
  }

  return undefined;
};

const isAmazonUrl = (url: string) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "amzn.eu" || host.endsWith(".amazon.com") || host.includes("amazon.");
  } catch {
    return false;
  }
};

const extractAmazonImages = ($: ReturnType<typeof load>, finalUrl: string) => {
  const img = $("#landingImage").attr("data-a-dynamic-image");
  if (typeof img === "string" && img.trim()) {
    try {
      const json = JSON.parse(img);
      const urls = Object.keys(json)
        .map((u) => toAbsoluteUrl(finalUrl, u))
        .filter((u): u is string => Boolean(u));
      if (urls.length > 0) return urls;
    } catch {
      // ignore
    }
  }

  const hiRes = $("#landingImage").attr("data-old-hires");
  if (typeof hiRes === "string" && hiRes.trim()) {
    const abs = toAbsoluteUrl(finalUrl, hiRes.trim());
    if (abs) return [abs];
  }

  return [];
};

const extractAmazonPriceText = ($: ReturnType<typeof load>) => {
  const candidates = [
    getFirstText($, ["#corePriceDisplay_desktop_feature_div .a-offscreen"]),
    getFirstText($, ["#corePrice_feature_div .a-offscreen"]),
    getFirstText($, ["#priceblock_ourprice"]),
    getFirstText($, ["#priceblock_dealprice"]),
    getFirstText($, ["#priceblock_saleprice"]),
    getFirstText($, ["#tp_price_block_total_price_ww .a-offscreen"]),
    getFirstText($, [".a-price .a-offscreen"]),
  ].filter(Boolean) as string[];

  // Prefer candidates that include digits
  return candidates.find((t) => /\d/.test(t)) || candidates[0];
};

const extractAmazonDescription = ($: ReturnType<typeof load>) => {
  const bullets = $("#feature-bullets li")
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter(Boolean)
    .filter((t) => !/^.+:\s*$/.test(t))
    .slice(0, 8);

  if (bullets.length > 0) return bullets.join("\n");

  const desc = getFirstText($, ["#productDescription", "#aplus"]);
  return desc;
};

const extractSpecTableBullets = ($: ReturnType<typeof load>, roots: string[]) => {
  const lines: string[] = [];

  for (const root of roots) {
    $(`${root} tr`).each((_, tr) => {
      const th = normalizeText($(tr).find("th").first().text());
      const td = normalizeText($(tr).find("td").first().text());
      if (th && td && td.length <= 200) {
        lines.push(`${th}: ${td}`);
      }
    });
  }

  return lines;
};

const extractGenericFeatureBullets = ($: ReturnType<typeof load>) => {
  // Prefer lists inside likely description/spec sections
  const likelyContainers = [
    "#description",
    "#product-description",
    ".product-description",
    ".description",
    ".specs",
    ".specifications",
    ".product-specs",
    '[class*="spec"]',
    '[id*="spec"]',
    '[class*="feature"]',
    '[id*="feature"]',
    '[class*="attribute"]',
    '[id*="attribute"]',
  ];

  const items: string[] = [];
  for (const container of likelyContainers) {
    $(`${container} li`).each((_, li) => {
      const text = normalizeText($(li).text());
      if (text && text.length >= 3 && text.length <= 180) {
        items.push(text);
      }
    });
  }

  // Arabic headings (مواصفات/مميزات/خصائص) - look for nearby lists
  const headingMatchers = [/مواصفات/i, /المواصفات/i, /مميزات/i, /الميزات/i, /خصائص/i, /ميزات/i, /features/i, /highlights/i, /specifications/i, /attributes/i];
  $("h1,h2,h3,h4,strong,b").each((_, el) => {
    const text = normalizeText($(el).text());
    if (!text) return;
    if (!headingMatchers.some((re) => re.test(text))) return;

    const section = $(el).parent();
    section.find("li").each((_, li) => {
      const liText = normalizeText($(li).text());
      if (liText && liText.length >= 3 && liText.length <= 180) {
        items.push(liText);
      }
    });
  });

  return uniq(items).slice(0, 20);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7",
        "upgrade-insecure-requests": "1",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page (status ${res.status})` },
        { status: 400 }
      );
    }

    const finalUrl = res.url || url;
    const html = await res.text();
    const $ = load(html);

    const jsonLdProduct = extractProductFromJsonLd($, finalUrl);

    const titleFromMeta =
      getFirstMetaContent($, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
      ]) ||
      $("title").first().text().trim() ||
      undefined;

    const titleFromAmazon = isAmazonUrl(finalUrl)
      ? getFirstText($, ["#productTitle", "#title #productTitle", "h1#title"])
      : undefined;

    const title =
      titleFromAmazon ||
      jsonLdProduct?.name ||
      titleFromMeta;

    const descriptionFromMeta = getFirstMetaContent($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]);

    const descriptionFromAmazon = isAmazonUrl(finalUrl)
      ? extractAmazonDescription($)
      : undefined;

    const description =
      descriptionFromAmazon ||
      jsonLdProduct?.description ||
      getFirstText($, ['meta[itemprop="description"]']) ||
      getFirstText($, ["#description", "#product-description", ".product-description"]) ||
      descriptionFromMeta;

    const priceTextFromMeta =
      getFirstMetaContent($, ['meta[property="product:price:amount"]']) ||
      getFirstMetaContent($, ['meta[property="product:price"]']) ||
      getFirstMetaContent($, ['meta[property="og:price:amount"]']) ||
      getFirstMetaContent($, ['meta[property="og:price"]']) ||
      getFirstMetaContent($, ['meta[itemprop="price"]']) ||
      getFirstMetaContent($, ['meta[name="price"]']) ||
      undefined;

    const priceTextFromAmazon = isAmazonUrl(finalUrl)
      ? extractAmazonPriceText($)
      : undefined;

    const priceFromJsonLd = extractPriceFromJsonLd($);
    const priceAmount =
      jsonLdProduct?.priceAmount ||
      priceFromJsonLd?.amount ||
      toNumberFromUnknown(priceTextFromAmazon) ||
      toNumberFromUnknown(priceTextFromMeta) ||
      undefined;

    const priceCurrency =
      jsonLdProduct?.priceCurrency ||
      priceFromJsonLd?.currency ||
      getFirstMetaContent($, ['meta[property="product:price:currency"]']) ||
      getFirstMetaContent($, ['meta[property="og:price:currency"]']) ||
      undefined;

    const imageCandidatesMeta = [
      ...$('meta[property="og:image"]')
        .map((_, el) => $(el).attr("content") || "")
        .get(),
      ...$('meta[property="og:image:url"]')
        .map((_, el) => $(el).attr("content") || "")
        .get(),
      ...$('meta[name="twitter:image"]')
        .map((_, el) => $(el).attr("content") || "")
        .get(),
    ]
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => toAbsoluteUrl(finalUrl, v))
      .filter((v): v is string => Boolean(v));

    const imageCandidatesAmazon = isAmazonUrl(finalUrl)
      ? extractAmazonImages($, finalUrl)
      : [];

    const images = uniq([
      ...imageCandidatesAmazon,
      ...(jsonLdProduct?.images || []),
      ...imageCandidatesMeta,
    ]).slice(0, 10);

    const bulletPointsFromJsonLd = (jsonLdProduct?.additionalProperties || []).map(
      (p) => `${p.name}: ${p.value}`
    );

    const bulletPointsFromAmazon = isAmazonUrl(finalUrl)
      ? uniq([
          ...$("#feature-bullets li")
            .map((_, el) => normalizeText($(el).text()))
            .get()
            .filter(Boolean)
            .filter((t) => t.length >= 3 && t.length <= 180),
          ...extractSpecTableBullets($, [
            "#productDetails_techSpec_section_1",
            "#productDetails_techSpec_section_2",
            "#productDetails_detailBullets_sections1",
            "#productDetails_detailBullets_sections2",
          ]),
          ...$("#detailBullets_feature_div li")
            .map((_, el) => normalizeText($(el).text()))
            .get()
            .filter(Boolean)
            .map((t) => t.replace(/\s*:\s*/g, ": "))
            .filter((t) => t.includes(": ") && t.length <= 200),
        ])
      : [];

    const bulletPointsGeneric = extractGenericFeatureBullets($);

    const bulletPoints = uniq([
      ...bulletPointsFromAmazon,
      ...bulletPointsFromJsonLd,
      ...bulletPointsGeneric,
    ])
      .map((t) => normalizeText(t))
      .filter(Boolean)
      .filter((t) => t.toLowerCase() !== "amazon" && t.toLowerCase() !== "amazon.eg")
      .slice(0, 10);

    // If Amazon returns generic/short title, try hard fallback to product title
    const normalizedTitle = (title || "").toLowerCase().trim();
    const shouldForceAmazonTitle =
      isAmazonUrl(finalUrl) &&
      (!title || normalizedTitle === "amazon" || normalizedTitle === "amazon.eg" || normalizedTitle.length < 8);

    const finalTitle = shouldForceAmazonTitle
      ? titleFromAmazon || titleFromMeta
      : title;

    return NextResponse.json(
      {
        url: finalUrl,
        title: finalTitle,
        description,
        price: priceTextFromAmazon || priceTextFromMeta,
        priceAmount,
        priceCurrency,
        images,
        bulletPoints,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("fetch-product route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

