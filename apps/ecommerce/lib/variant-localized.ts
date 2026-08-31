import type { ProductLocale } from "@/lib/product-translations";

export interface VariantLocalizedFields {
  title: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export function getVariantDisplayFields(
  variant: {
    title?: string | null;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    localized?: unknown;
  },
  locale: ProductLocale
): VariantLocalizedFields {
  const localizedRecord =
    variant.localized &&
    typeof variant.localized === "object" &&
    !Array.isArray(variant.localized)
      ? (variant.localized as Record<string, VariantLocalizedFields>)
      : null;

  const localized =
    localizedRecord?.[locale] ??
    localizedRecord?.en ??
    (locale === "en"
      ? {
          title: variant.title ?? "",
          option1: variant.option1 ?? undefined,
          option2: variant.option2 ?? undefined,
          option3: variant.option3 ?? undefined,
        }
      : undefined);

  if (localized) {
    return localized;
  }

  return {
    title: variant.title ?? "",
    option1: variant.option1 ?? undefined,
    option2: variant.option2 ?? undefined,
    option3: variant.option3 ?? undefined,
  };
}
