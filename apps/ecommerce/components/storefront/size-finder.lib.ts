import { sizeLabelsMatch } from "@workspace/lib/size-charts";
import type { Product } from "@/components/product-page/product-page.types";
import { buildVariantMatrix, pickVariant, selectedKeys } from "@/components/product-page/variant-options.lib";
import type { ProductLocale } from "@/lib/product-translations";
import { getVariantDisplayFields } from "@/lib/variant-localized";

/**
 * "Find my size" helpers (ROADMAP.md F-92): the variant to select for the
 * recommended size, and the shopper's measurements remembered per store.
 */

type SizeProduct = Pick<Product, "trackStock" | "productVariants">;

/**
 * The variant whose size option is `size` (case aside, XXL = 2XL), keeping
 * the shopper's other picks (their colour). `selected`: it is the one
 * already chosen. Null when no variant value is that size.
 */
export function findSizeVariant(
  product: SizeProduct,
  locale: ProductLocale,
  size: string,
  currentVariantId: string | null,
): { variantId: string; selected: boolean } | null {
  const variants = product.productVariants ?? [];
  if (!variants.length) return null;
  const matrix = buildVariantMatrix(variants, locale);
  const groupIndex = matrix.groups.findIndex((group) => group.values.some((value) => sizeLabelsMatch(value.label, size)));
  let variantId: string | null = null;
  if (groupIndex >= 0) {
    const value = matrix.groups[groupIndex]!.values.find((v) => sizeLabelsMatch(v.label, size))!;
    variantId = pickVariant(product, matrix, selectedKeys(matrix, currentVariantId), groupIndex, value.key);
  } else {
    // Variants listed by title only ("40", "41"): one whose title or option is the size.
    variantId =
      variants.find((variant) => {
        const display = getVariantDisplayFields(variant, locale);
        return [display.title, display.option1, display.option2, display.option3].some((text) => text && sizeLabelsMatch(text.replace(/^.+?:\s*/, ""), size));
      })?.id ?? null;
  }
  return variantId ? { variantId, selected: variantId === currentVariantId } : null;
}

type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

const storageKey = (storeId: string) => `tallaby:size-finder:${storeId}`;

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The measurements this shopper typed on this store before (any product); empty when storage is blocked. */
export function readSavedMeasurements(storeId: string, storage: KeyValueStorage | null = browserStorage()): Record<string, number> {
  try {
    const raw = storage?.getItem(storageKey(storeId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter((entry): entry is [string, number] => /^[a-z][a-z0-9_]{0,23}$/.test(entry[0]) && typeof entry[1] === "number" && Number.isFinite(entry[1]))
        .slice(0, 16),
    );
  } catch {
    return {};
  }
}

/** Remembers the shopper's measurements on this device, per store, merged with what was saved. Never throws. */
export function saveMeasurements(storeId: string, values: Record<string, number | undefined>, storage: KeyValueStorage | null = browserStorage()): void {
  try {
    const finite = Object.entries(values).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]));
    storage?.setItem(storageKey(storeId), JSON.stringify({ ...readSavedMeasurements(storeId, storage), ...Object.fromEntries(finite) }));
  } catch {
    // Private mode or blocked storage: the finder just won't prefill next time.
  }
}
