/**
 * Pure builders for the MCP product tools (ROADMAP.md F-29f). They turn the
 * tool input (agent-products.dto.ts) into exactly the shapes the dashboard
 * product form saves, so a product made by an assistant looks the same
 * everywhere: the `price` jsonb, variant rows with "Name: value" options per
 * language and `localized.optionMeta`, and the two translation rows.
 */
import { normalizePrice } from "../utils/round-price";
import type { AgentVariantInput } from "./agent-products.dto";

export type ProductStatusValue = "draft" | "pending" | "active" | "rejected";

/** The products.price jsonb, same shape as the dashboard's buildPriceObject. */
export type ProductPriceJson = {
  base: number;
  list: number;
  final: number;
  discountType: "amount" | null;
  discountValue: number | null;
  discountEndsAt?: string | null;
};

/**
 * `price` is what the customer pays; `compareAtPrice`, when higher, is the
 * struck-through "before" price. A compare-at price that is not higher is
 * ignored (no fake discounts).
 */
export function buildAgentPrice(price: number, compareAtPrice?: number | null, discountEndsAt?: string | null): ProductPriceJson {
  const final = normalizePrice(price);
  const compare = compareAtPrice != null ? normalizePrice(compareAtPrice) : null;
  const list = compare != null && compare > final ? compare : final;
  const discount = Number((list - final).toFixed(2));
  return {
    base: list,
    list,
    final,
    discountType: discount > 0 ? "amount" : null,
    discountValue: discount > 0 ? discount : null,
    discountEndsAt: discount > 0 ? (discountEndsAt ?? null) : null,
  };
}

/** Reads the stored price jsonb back as tool output numbers. */
export function readAgentPrice(value: unknown): { price: number; compareAtPrice: number | null; discountEndsAt: string | null } {
  const obj = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
  const final = num(obj.final) ?? num(obj.list) ?? num(obj.base) ?? 0;
  const list = num(obj.list) ?? num(obj.base);
  return {
    price: final,
    compareAtPrice: list != null && list > final ? list : null,
    discountEndsAt: typeof obj.discountEndsAt === "string" ? obj.discountEndsAt : null,
  };
}

/**
 * Status a write leaves a product in (same rule as the dashboard's
 * nextProductStatus): products go live without review when they have a photo
 * and the seller may publish; an admin takedown ("rejected") sticks; a draft
 * stays a draft until the seller (or the assistant, on request) publishes it.
 */
export function nextAgentProductStatus(input: {
  previous: ProductStatusValue | null;
  hasImage: boolean;
  canPublish: boolean;
  wantDraft?: boolean;
}): ProductStatusValue {
  if (input.previous === "rejected") return "rejected";
  if (input.previous === "draft" || input.wantDraft) return "draft";
  return input.hasImage && input.canPublish ? "active" : "draft";
}

/** URL slug from the English title; never empty. */
export function slugifyTitle(title: string, fallbackSuffix: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || `product-${fallbackSuffix}`;
}

/** Trimmed, single-spaced, unique (case-insensitive), capped: same as the dashboard's cleanKeywords. */
export function cleanAgentKeywords(keywords: readonly string[] | null | undefined, max = 15, maxLength = 40): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of keywords ?? []) {
    if (typeof raw !== "string") continue;
    const keyword = raw.trim().replace(/\s+/g, " ").slice(0, maxLength).trim();
    const key = keyword.toLowerCase();
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    out.push(keyword);
    if (out.length === max) break;
  }
  return out;
}

/** Shortens text to `max` characters at a word break, ending with "…". */
export function clipText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Plain text of simple HTML (for automatic meta descriptions). */
export function htmlToText(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain text becomes paragraphs; HTML is left for the sanitizer. */
export function textToHtml(value: string): string {
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escape(part).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const COLOR_NAMES = new Set(["color", "colour", "اللون", "لون"]);
const SIZE_NAMES = new Set(["size", "المقاس", "مقاس", "الحجم", "حجم"]);

type OptionKind = "color" | "size" | "custom";

function optionKind(name: { ar: string; en: string }): OptionKind {
  const en = name.en.trim().toLowerCase();
  const ar = name.ar.trim();
  if (COLOR_NAMES.has(en) || COLOR_NAMES.has(ar)) return "color";
  if (SIZE_NAMES.has(en) || SIZE_NAMES.has(ar)) return "size";
  return "custom";
}

export type VariantProblem = "options_mismatch" | "duplicate_variant" | "duplicate_sku";

/** Every variant names the same options in the same order, no two are the same, SKUs are unique. */
export function checkAgentVariants(variants: readonly AgentVariantInput[]): VariantProblem | null {
  if (variants.length === 0) return null;
  const names = (v: AgentVariantInput) => v.options.map((o) => o.name.en.trim().toLowerCase()).join("|");
  const first = names(variants[0]!);
  if (variants.some((v) => names(v) !== first)) return "options_mismatch";
  const combos = new Set(variants.map((v) => v.options.map((o) => o.value.en.trim().toLowerCase()).join("|")));
  if (combos.size !== variants.length) return "duplicate_variant";
  const skus = variants.map((v) => v.sku?.trim().toLowerCase()).filter((s): s is string => Boolean(s));
  if (new Set(skus).size !== skus.length) return "duplicate_sku";
  return null;
}

export type VariantRow = {
  id?: string;
  title: string;
  price: ProductPriceJson;
  discountEndsAt: string | null;
  stock: number;
  sku: string;
  imageUrl: string | null;
  images: string[] | null;
  isDefault: boolean;
  localized: {
    en: { title: string; option1?: string; option2?: string; option3?: string };
    ar: { title: string; option1?: string; option2?: string; option3?: string };
    optionMeta: { kind: OptionKind; swatch?: string }[];
  };
  option1: string | null;
  option2: string | null;
  option3: string | null;
  position: number;
};

/**
 * Variant rows in the dashboard form's format. `images` are already stored
 * paths (one per variant, or none); the default variant (the flagged one,
 * else the first) shows the product's photos like the form does.
 */
export function buildVariantRows(
  variants: readonly AgentVariantInput[],
  opts: { productSku: string; productImages: readonly string[]; variantImages: readonly (string | null)[]; discountEndsAt: string | null },
): VariantRow[] {
  const flagged = variants.findIndex((v) => v.isDefault === true);
  const defaultIndex = flagged >= 0 ? flagged : 0;
  return variants.map((v, index) => {
    const pick = (locale: "ar" | "en") => v.options.map((o) => `${o.name[locale].trim()}: ${o.value[locale].trim()}`);
    const en = pick("en");
    const ar = pick("ar");
    const title = (locale: "ar" | "en") => v.options.map((o) => o.value[locale].trim()).join(" / ");
    const localizedFor = (locale: "ar" | "en", opts: string[]) => ({
      title: title(locale),
      ...(opts[0] ? { option1: opts[0] } : {}),
      ...(opts[1] ? { option2: opts[1] } : {}),
      ...(opts[2] ? { option3: opts[2] } : {}),
    });
    const own = opts.variantImages[index] ?? null;
    const isDefault = index === defaultIndex;
    const images = isDefault && opts.productImages.length ? [...opts.productImages] : own ? [own] : null;
    const price = buildAgentPrice(v.price, v.compareAtPrice, opts.discountEndsAt);
    return {
      ...(v.id ? { id: v.id } : {}),
      title: title("en"),
      price: { base: price.base, list: price.list, final: price.final, discountType: price.discountType, discountValue: price.discountValue },
      discountEndsAt: price.discountType ? opts.discountEndsAt : null,
      stock: v.stock,
      sku: v.sku?.trim() || `${opts.productSku}-${index + 1}`,
      imageUrl: images?.[0] ?? null,
      images,
      isDefault,
      localized: {
        en: localizedFor("en", en),
        ar: localizedFor("ar", ar),
        optionMeta: v.options.map((o) => ({ kind: optionKind(o.name), ...(o.value.swatch ? { swatch: o.value.swatch } : {}) })),
      },
      option1: en[0] ?? null,
      option2: en[1] ?? null,
      option3: en[2] ?? null,
      position: index + 1,
    };
  });
}

/** Total stock of the variants (the product's quantity when it has variants and none was given). */
export function variantStockTotal(variants: readonly { stock: number }[]): number {
  return variants.reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0);
}

/**
 * A product image the tool may keep: a stored path, or the public URL of one
 * (as get_product shows it), mapped back to its path. Only images the product
 * already has qualify; anything else must be an https URL to download.
 */
export function existingImagePath(ref: string, current: readonly string[], publicPrefix: string | null): string | null {
  if (current.includes(ref)) return ref;
  if (publicPrefix && ref.startsWith(publicPrefix)) {
    const path = decodeURIComponent(ref.slice(publicPrefix.length).split("?")[0] ?? "");
    if (current.includes(path)) return path;
  }
  return null;
}

/** Public URL of a stored product image (paths live in the "products" bucket; full URLs pass through). */
export function productImageUrl(path: string, supabaseUrl: string | null | undefined): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!supabaseUrl) return path;
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/products/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function productImagePrefix(supabaseUrl: string | null | undefined): string | null {
  return supabaseUrl ? `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/products/` : null;
}

/** The image paths in a products.images or variants.images jsonb. */
export function imageList(images: unknown): string[] {
  const list = Array.isArray(images) ? images : typeof images === "string" ? [images] : [];
  return list.filter((i): i is string => typeof i === "string" && i.trim() !== "");
}
