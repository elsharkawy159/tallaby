export function getVariantImageUrls(
  variant:
    | {
        images?: unknown;
        imageUrl?: string | null;
      }
    | null
    | undefined
): string[] {
  if (!variant) {
    return [];
  }

  const rawImages = variant.images;

  if (Array.isArray(rawImages)) {
    const filtered = rawImages.filter(
      (img): img is string => typeof img === "string" && img.length > 0
    );

    if (filtered.length > 0) {
      return filtered;
    }
  }

  if (variant.imageUrl) {
    return [variant.imageUrl];
  }

  return [];
}
