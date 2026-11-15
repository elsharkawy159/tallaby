export function getDefaultProductVariant<
  T extends {
    id: string;
    isDefault?: boolean | null;
    position?: number | null;
  },
>(variants: T[] | null | undefined): T | null {
  if (!variants?.length) {
    return null;
  }

  const flaggedDefault = variants.find((variant) => variant.isDefault === true);

  if (flaggedDefault) {
    return flaggedDefault;
  }

  const byPosition = variants.find((variant) => variant.position === 1);

  return byPosition ?? variants[0] ?? null;
}

export function getDefaultProductVariantId(
  variants: Array<{
    id: string;
    isDefault?: boolean | null;
    position?: number | null;
  }> | null | undefined
): string | null {
  const defaultVariant = getDefaultProductVariant(variants);

  return defaultVariant?.id ?? null;
}

/**
 * Variants in the seller's order: by `position`, ties (and rows without one)
 * kept in the order given. Variants saved together share `created_at`, so a
 * read without ORDER BY position can return them in any order (2026-11-15:
 * sizes showed 20, 5, 10).
 */
export function inSellerOrder<T extends { position?: number | null }>(variants: readonly T[]): T[] {
  const rank = (variant: T) => variant.position ?? Number.MAX_SAFE_INTEGER;
  return variants
    .map((variant, index) => ({ variant, index }))
    .sort((a, b) => rank(a.variant) - rank(b.variant) || a.index - b.index)
    .map((entry) => entry.variant);
}
