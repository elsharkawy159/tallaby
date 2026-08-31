import type { SupportedLocale } from "../app/(main)/products/add/add-product.schema";

export const VARIANT_LOCALES: SupportedLocale[] = ["en", "ar"];

export interface VariantTypeLocalizedFields {
  name: string;
  values: string[];
}

export interface VariantTypeFormValue {
  id: string;
  localized: Record<SupportedLocale, VariantTypeLocalizedFields>;
}

export interface VariantLocalizedFields {
  title: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export type VariantLocalizedMap = Record<SupportedLocale, VariantLocalizedFields>;

export function createEmptyVariantTypeLocalized(): VariantTypeLocalizedFields {
  return { name: "", values: [] };
}

export function createEmptyVariantType(id?: string): VariantTypeFormValue {
  return {
    id: id ?? `type-${Date.now()}`,
    localized: {
      en: createEmptyVariantTypeLocalized(),
      ar: createEmptyVariantTypeLocalized(),
    },
  };
}

export function formatVariantOption(typeName: string, value: string): string {
  const trimmedName = typeName.trim();
  const trimmedValue = value.trim();

  if (!trimmedName || !trimmedValue) {
    return trimmedValue || trimmedName;
  }

  return `${trimmedName}: ${trimmedValue}`;
}

export function buildVariantLocalizedFromCombo(
  variantTypes: VariantTypeFormValue[],
  valueIndexes: number[]
): VariantLocalizedMap {
  const localized = {
    en: { title: "" },
    ar: { title: "" },
  } as VariantLocalizedMap;

  for (const locale of VARIANT_LOCALES) {
    const titleParts: string[] = [];
    const options: string[] = [];

    variantTypes.forEach((type, typeIndex) => {
      const valueIndex = valueIndexes[typeIndex];
      const typeName = type.localized[locale].name.trim();
      const value = type.localized[locale].values[valueIndex]?.trim() ?? "";

      if (value) {
        titleParts.push(value);
      }

      if (typeName && value) {
        options.push(formatVariantOption(typeName, value));
      }
    });

    localized[locale] = {
      title: titleParts.join(" / "),
      option1: options[0],
      option2: options[1],
      option3: options[2],
    };
  }

  return localized;
}

export function parseVariantOption(option?: string | null): {
  typeName: string;
  value: string;
} | null {
  if (!option) {
    return null;
  }

  const match = option.match(/^(.+?):\s*(.+)$/);

  if (!match) {
    return { typeName: option.trim(), value: option.trim() };
  }

  return {
    typeName: match[1]!.trim(),
    value: match[2]!.trim(),
  };
}

export function reconstructVariantTypesFromVariants(
  variants: Array<{
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    localized?: unknown;
  }>
): VariantTypeFormValue[] {
  if (!variants.length) {
    return [];
  }

  const localizedFromDb = variants[0]?.localized;

  if (
    localizedFromDb &&
    typeof localizedFromDb === "object" &&
    !Array.isArray(localizedFromDb)
  ) {
    const enVariants = variants.map((variant) => {
      const loc =
        typeof variant.localized === "object" && variant.localized
          ? (variant.localized as Record<string, VariantLocalizedFields>)
          : null;

      return loc?.en ?? {
        title: "",
        option1: variant.option1 ?? undefined,
        option2: variant.option2 ?? undefined,
        option3: variant.option3 ?? undefined,
      };
    });

    const typeCount = Math.max(
      ...enVariants.map(
        (variant) =>
          [variant.option1, variant.option2, variant.option3].filter(Boolean).length
      ),
      0
    );

    if (typeCount === 0) {
      return [];
    }

    const types: VariantTypeFormValue[] = [];

    for (let typeIndex = 0; typeIndex < typeCount; typeIndex += 1) {
      const optionKey = `option${typeIndex + 1}` as keyof VariantLocalizedFields;
      const localized: Record<SupportedLocale, VariantTypeLocalizedFields> = {
        en: { name: "", values: [] },
        ar: { name: "", values: [] },
      };

      for (const locale of VARIANT_LOCALES) {
        const sampleVariant = variants.find((variant) => {
          if (!variant.localized || typeof variant.localized !== "object") {
            return locale === "en";
          }

          return Boolean(
            (variant.localized as Record<string, VariantLocalizedFields>)[locale]
          );
        });

        const sampleOption =
          sampleVariant &&
          typeof sampleVariant.localized === "object" &&
          sampleVariant.localized
            ? (sampleVariant.localized as Record<
                string,
                VariantLocalizedFields
              >)[locale]?.[optionKey]
            : locale === "en"
              ? sampleVariant?.[optionKey]
              : undefined;

        const parsedSample = parseVariantOption(
          typeof sampleOption === "string" ? sampleOption : undefined
        );

        localized[locale].name = parsedSample?.typeName ?? "";

        localized[locale].values = variants.map((variant) => {
          const loc =
            typeof variant.localized === "object" && variant.localized
              ? (variant.localized as Record<string, VariantLocalizedFields>)[
                  locale
                ]
              : locale === "en"
                ? {
                    option1: variant.option1 ?? undefined,
                    option2: variant.option2 ?? undefined,
                    option3: variant.option3 ?? undefined,
                  }
                : undefined;

          const optionValue = loc?.[optionKey];
          const parsedValue = parseVariantOption(
            typeof optionValue === "string" ? optionValue : undefined
          );

          return parsedValue?.value ?? "";
        });
      }

      types.push({
        id: `type-${typeIndex}`,
        localized,
      });
    }

    return types;
  }

  const typeMap = new Map<string, Set<string>>();

  variants.forEach((variant) => {
    [variant.option1, variant.option2, variant.option3]
      .filter(Boolean)
      .forEach((option) => {
        const parsed = parseVariantOption(option);

        if (!parsed?.typeName) {
          return;
        }

        if (!typeMap.has(parsed.typeName)) {
          typeMap.set(parsed.typeName, new Set());
        }

        if (parsed.value) {
          typeMap.get(parsed.typeName)!.add(parsed.value);
        }
      });
  });

  return Array.from(typeMap.entries()).map(([name, valuesSet], index) => ({
    id: `type-${index}`,
    localized: {
      en: { name, values: Array.from(valuesSet) },
      ar: { name: "", values: Array.from(valuesSet).map(() => "") },
    },
  }));
}

export function getVariantValueIndexes(
  variantTypes: VariantTypeFormValue[],
  variant: {
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    localized?: unknown;
    optionValueIndexes?: number[] | null;
  },
  locale: SupportedLocale = "en"
): number[] {
  if (Array.isArray(variant.optionValueIndexes)) {
    return variant.optionValueIndexes;
  }

  const localized =
    variant.localized &&
    typeof variant.localized === "object" &&
    !Array.isArray(variant.localized)
      ? (variant.localized as Record<string, VariantLocalizedFields>)[locale]
      : undefined;

  return variantTypes.map((type, typeIndex) => {
    const optionKey = `option${typeIndex + 1}` as keyof VariantLocalizedFields;
    const optionText =
      localized?.[optionKey] ??
      (locale === "en" ? variant[optionKey] : undefined);

    const parsed = parseVariantOption(
      typeof optionText === "string" ? optionText : undefined
    );
    const targetValue = parsed?.value ?? "";

    const values = type.localized[locale].values;
    const matchedIndex = values.findIndex(
      (value) => value.trim() === targetValue.trim()
    );

    return matchedIndex >= 0 ? matchedIndex : 0;
  });
}

export function getVariantDisplayFields(
  variant: {
    title?: string | null;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    localized?: unknown;
  },
  locale: SupportedLocale
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
