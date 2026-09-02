import { getPublicUrl } from "@workspace/ui/lib/utils";
import type { ProductLocale } from "@/lib/product-translations";
import { getVariantDisplayFields } from "@/lib/variant-localized";
import { getVariantImageUrls } from "@/lib/variant-images";
import { parseVariantOption } from "@/lib/variant-utils";

export interface ProductColorSwatch {
  value: string;
  label: string;
  hex: string;
  image?: string;
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

export function getProductColorSwatches(
  variants: VariantLike[] | null | undefined,
  locale: ProductLocale
): ProductColorSwatchResult {
  if (!variants?.length) return { swatches: [], overflow: 0 };

  const swatches = new Map<string, ProductColorSwatch>();

  for (const variant of variants) {
    const display = getVariantDisplayFields(variant, locale);
    const optionMeta = getOptionMeta(variant.localized);
    const options = [display.option1, display.option2, display.option3];

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

      const key = parsed.value.trim().toLowerCase();
      if (swatches.has(key)) continue;

      const image = getVariantImageUrls(variant)[0];

      swatches.set(key, {
        value: key,
        label: parsed.value.trim(),
        hex,
        image: image ? getPublicUrl(image, "products") : undefined,
      });
    }
  }

  const all = Array.from(swatches.values());
  return {
    swatches: all.slice(0, MAX_VISIBLE_SWATCHES),
    overflow: Math.max(0, all.length - MAX_VISIBLE_SWATCHES),
  };
}
