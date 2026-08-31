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
