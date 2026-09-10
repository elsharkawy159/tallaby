import { getPublicUrl } from "@workspace/ui/lib/utils";
import type { ProductLocale } from "@/lib/product-translations";
import { getVariantDisplayFields } from "@/lib/variant-localized";
import { getVariantImageUrls } from "@/lib/variant-images";
import { parseVariantOption } from "@/lib/variant-utils";

export interface ProductColorSwatch {
  /** Normalized (lowercased) color value — also the dedupe key. */
  value: string;
  /** URL-safe form of `value`, used as the `?variant=` deep-link token. */
  slug: string;
  label: string;
  hex: string;
  image?: string;
  /** First variant carrying this color — the one a deep link preselects. */
  variantId?: string;
}

interface VariantOptionMetaEntry {
  kind?: string;
  swatch?: string;
  unit?: string;
}

interface VariantLike {
  id?: string;
  localized?: unknown;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  images?: unknown;
  imageUrl?: string | null;
}

const COLOR_TYPE_NAMES = ["color", "colour", "اللون", "لون"];

// Best-effort hex fallback for variants authored before the color-picker
// existed (no optionMeta.swatch persisted yet).
const NAMED_COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  أحمر: "#ef4444",
  blue: "#3b82f6",
  أزرق: "#3b82f6",
  black: "#171717",
  أسود: "#171717",
  white: "#ffffff",
  أبيض: "#ffffff",
  green: "#22c55e",
  أخضر: "#22c55e",
  yellow: "#eab308",
  أصفر: "#eab308",
  grey: "#9ca3af",
  gray: "#9ca3af",
  رمادي: "#9ca3af",
  pink: "#ec4899",
  وردي: "#ec4899",
  purple: "#a855f7",
  بنفسجي: "#a855f7",
  orange: "#f97316",
  برتقالي: "#f97316",
  brown: "#92400e",
  بني: "#92400e",
  beige: "#e7d7c1",
  بيج: "#e7d7c1",
  gold: "#d4af37",
  ذهبي: "#d4af37",
  silver: "#c0c0c0",
  فضي: "#c0c0c0",
  navy: "#1e3a8a",
  كحلي: "#1e3a8a",
};

function resolveHexFromName(name: string): string | null {
  const trimmed = name.trim();
  return NAMED_COLOR_HEX[trimmed] ?? NAMED_COLOR_HEX[trimmed.toLowerCase()] ?? null;
}

const MAX_VISIBLE_SWATCHES = 5;

export interface ProductColorSwatchResult {
  swatches: ProductColorSwatch[];
  overflow: number;
}

export interface VariantColor {
  /** Normalized (lowercased) color value. */
  value: string;
  /** URL-safe form of `value`. */
  slug: string;
  label: string;
  hex: string;
}

/**
 * Fades a swatch hex for use as a soft outline/glow. Non-hex values (a raw
 * `rgb()`/named color stored in `optionMeta.swatch`) are returned untouched.
 */
export function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return color;

  const hex = match[1]!;
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Turns a color value into a URL-safe token for `?variant=`. Arabic values keep
 * their letters (they survive `encodeURIComponent` fine) — only whitespace and
 * separators are collapsed so links stay readable.
 */
export function slugifyColorValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getOptionMeta(localized: unknown): VariantOptionMetaEntry[] | null {
  if (
    localized &&
    typeof localized === "object" &&
    !Array.isArray(localized) &&
    Array.isArray((localized as { optionMeta?: unknown }).optionMeta)
  ) {
    return (localized as { optionMeta: VariantOptionMetaEntry[] }).optionMeta;
  }
  return null;
}

/** Every color-kind option a single variant carries, in option order. */
export function getVariantColors(
  variant: VariantLike | null | undefined,
  locale: ProductLocale
): VariantColor[] {
  if (!variant) return [];

  const display = getVariantDisplayFields(variant, locale);
  const optionMeta = getOptionMeta(variant.localized);
  const options = [display.option1, display.option2, display.option3];
  const colors: VariantColor[] = [];

  for (let i = 0; i < options.length; i += 1) {
    const option = options[i];
    if (!option) continue;

    const parsed = parseVariantOption(option);
    if (!parsed?.value) continue;

    const meta = optionMeta?.[i];
    const isColorSlot =
      meta?.kind === "color" ||
      COLOR_TYPE_NAMES.includes(parsed.typeName.trim().toLowerCase());

    if (!isColorSlot) continue;

    const hex = meta?.swatch || resolveHexFromName(parsed.value);
    if (!hex) continue;

    const label = parsed.value.trim();
    colors.push({
      value: label.toLowerCase(),
      slug: slugifyColorValue(label),
      label,
      hex,
    });
  }

  return colors;
}

/** The color a variant should be outlined with on the product page, if any. */
export function getVariantColor(
  variant: VariantLike | null | undefined,
  locale: ProductLocale
): VariantColor | null {
  return getVariantColors(variant, locale)[0] ?? null;
}

/**
 * Resolves a `?variant=` token to a variant id. Matches a color slug first
 * (that's what product-card swatches link with), then falls back to a raw
 * variant id so older/manual links keep working.
 */
export function findVariantIdByToken(
  variants: VariantLike[] | null | undefined,
  locale: ProductLocale,
  token: string | null | undefined
): string | null {
  if (!variants?.length || !token) return null;

  // `token` arrives already percent-decoded from useSearchParams().
  const wanted = slugifyColorValue(token);
  if (!wanted) return null;

  for (const variant of variants) {
    if (!variant.id) continue;
    if (getVariantColors(variant, locale).some((c) => c.slug === wanted)) {
      return variant.id;
    }
  }

  return variants.find((variant) => variant.id === token)?.id ?? null;
}

export function getProductColorSwatches(
  variants: VariantLike[] | null | undefined,
  locale: ProductLocale
): ProductColorSwatchResult {
  if (!variants?.length) return { swatches: [], overflow: 0 };

  const swatches = new Map<string, ProductColorSwatch>();

  for (const variant of variants) {
    for (const color of getVariantColors(variant, locale)) {
      if (swatches.has(color.value)) continue;

      const image = getVariantImageUrls(variant)[0];

      swatches.set(color.value, {
        ...color,
        image: image ? getPublicUrl(image, "products") : undefined,
        variantId: variant.id,
      });
    }
  }

  const all = Array.from(swatches.values());
  return {
    swatches: all.slice(0, MAX_VISIBLE_SWATCHES),
    overflow: Math.max(0, all.length - MAX_VISIBLE_SWATCHES),
  };
}
