import type {
  SupportedLocale,
  VariantOptionKind,
} from "@/app/(main)/stores/[storeId]/products/add/add-product.schema";

export const VARIANT_LOCALES: SupportedLocale[] = ["en", "ar"];

export type { VariantOptionKind };

export const VARIANT_TYPE_PRESETS: Array<{
  kind: VariantOptionKind;
  en: string;
  ar: string;
}> = [
  { kind: "color", en: "Color", ar: "اللون" },
  { kind: "size", en: "Size", ar: "المقاس" },
  { kind: "weight", en: "Weight", ar: "الوزن" },
  { kind: "material", en: "Material", ar: "الخامة" },
  { kind: "style", en: "Style", ar: "التصميم" },
];

export const WEIGHT_UNITS = ["g", "kg", "mg", "ml", "l", "oz", "lb"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export interface VariantTypeLocalizedFields {
  name: string;
  values: string[];
}

export interface VariantTypeFormValue {
  id: string;
  kind: VariantOptionKind;
  unit?: string;
  /** Hex swatches, index-aligned with localized[locale].values (locale-independent). */
  swatches?: string[];
  localized: { en: VariantTypeLocalizedFields; ar: VariantTypeLocalizedFields };
}

export interface VariantLocalizedFields {
  title: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface VariantOptionMetaEntry {
  kind?: VariantOptionKind;
  swatch?: string;
  unit?: string;
}

export type VariantLocalizedMap = { en: VariantLocalizedFields; ar: VariantLocalizedFields } & {
  optionMeta?: VariantOptionMetaEntry[];
};

export function createEmptyVariantTypeLocalized(): VariantTypeLocalizedFields {
  return { name: "", values: [] };
}

export function createEmptyVariantType(id?: string): VariantTypeFormValue {
  return {
    id: id ?? `type-${Date.now()}`,
    kind: "custom",
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

  const optionMeta: VariantOptionMetaEntry[] = [];

  for (const locale of VARIANT_LOCALES) {
    const titleParts: string[] = [];
    // By position: a value not written in this language leaves its slot empty, so options keep their place.
    const options: Array<string | undefined> = [];

    variantTypes.forEach((type, typeIndex) => {
      const valueIndex = valueIndexes[typeIndex];
      const typeName = type.localized[locale].name.trim();
      const withUnit = (text: string) => (type.kind === "weight" && text && type.unit ? `${text} ${type.unit}` : text);
      const value = withUnit(type.localized[locale].values[valueIndex]?.trim() ?? "");
      // The title names the variant on orders and buttons, so an untranslated value shows in the language it has.
      const titlePart = value || withUnit(type.localized[locale === "en" ? "ar" : "en"].values[valueIndex]?.trim() ?? "");

      if (titlePart) {
        titleParts.push(titlePart);
      }

      options.push(typeName && value ? formatVariantOption(typeName, value) : undefined);
    });

    localized[locale] = {
      title: titleParts.join(" / "),
      option1: options[0],
      option2: options[1],
      option3: options[2],
    };
  }

  variantTypes.forEach((type, typeIndex) => {
    const valueIndex = valueIndexes[typeIndex];
    const meta: VariantOptionMetaEntry = { kind: type.kind };
    if (type.kind === "color") {
      meta.swatch = type.swatches?.[valueIndex];
    }
    if (type.kind === "weight") {
      meta.unit = type.unit;
    }
    optionMeta.push(meta);
  });

  localized.optionMeta = optionMeta;

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

function inferKindFromTypeName(name: string): VariantOptionKind {
  const normalized = name.trim().toLowerCase();
  const preset = VARIANT_TYPE_PRESETS.find(
    (p) => p.en.toLowerCase() === normalized || p.ar === name.trim()
  );
  return preset?.kind ?? "custom";
}

/**
 * One language's options of a stored variant, by option position. Older rows
 * skipped an untranslated value, so a later option sat in the wrong slot; the
 * saved option kinds put it back.
 */
function alignedOptions(
  variant: { option1?: string | null; option2?: string | null; option3?: string | null; localized?: unknown },
  locale: SupportedLocale
): Array<{ typeName: string; value: string } | null> {
  const record = variant.localized as (Record<string, VariantLocalizedFields | undefined> & { optionMeta?: VariantOptionMetaEntry[] }) | null;
  const fields = record?.[locale] ?? (locale === "en" ? variant : undefined);
  const raw = [fields?.option1, fields?.option2, fields?.option3].map((option) =>
    typeof option === "string" ? parseVariantOption(option) : null
  );
  const meta = record?.optionMeta;
  if (!meta?.length) return raw;
  const aligned: Array<{ typeName: string; value: string } | null> = [null, null, null];
  raw.forEach((option, position) => {
    if (!option) return;
    const kind = inferKindFromTypeName(option.typeName);
    const home = kind === "custom" || meta[position]?.kind === kind ? position : meta.findIndex((entry) => entry.kind === kind);
    aligned[home >= 0 && !aligned[home] ? home : position] = option;
  });
  return aligned;
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
    const rows = variants.map((variant) => ({
      meta: (variant.localized as { optionMeta?: VariantOptionMetaEntry[] } | null)?.optionMeta,
      en: alignedOptions(variant, "en"),
      ar: alignedOptions(variant, "ar"),
    }));

    const typeCount = Math.max(
      ...rows.flatMap((row) => [row.en, row.ar].map((options) => options.findLastIndex(Boolean) + 1)),
      0
    );

    if (typeCount === 0) {
      return [];
    }

    const types: VariantTypeFormValue[] = [];

    for (let typeIndex = 0; typeIndex < typeCount; typeIndex += 1) {
      const localized: Record<SupportedLocale, VariantTypeLocalizedFields> = {
        en: { name: "", values: [] },
        ar: { name: "", values: [] },
      };
      let kind: VariantOptionKind = "custom";
      let unit: string | undefined;
      const swatches: string[] = [];
      // One entry per value (variant rows repeat it), its text in both languages kept together.
      const seen = new Map<string, number>();

      for (const row of rows) {
        const en = row.en[typeIndex];
        const ar = row.ar[typeIndex];
        localized.en.name ||= en?.typeName ?? "";
        localized.ar.name ||= ar?.typeName ?? "";
        const meta = row.meta?.[typeIndex];
        if (meta?.kind && kind === "custom") kind = meta.kind;
        if (meta?.unit) unit ??= meta.unit;

        // Stored weights carry their unit, which the option adds back on save.
        const strip = (value: string | undefined) => {
          const suffix = meta?.unit ? ` ${meta.unit}` : "";
          return value && suffix && value.endsWith(suffix) ? value.slice(0, -suffix.length) : (value ?? "");
        };
        const enValue = strip(en?.value);
        const arValue = strip(ar?.value);
        const key = (enValue || arValue).trim().toLowerCase();
        if (!key) continue;

        const known = seen.get(key);
        if (known === undefined) {
          seen.set(key, localized.en.values.length);
          localized.en.values.push(enValue);
          localized.ar.values.push(arValue);
          swatches.push(meta?.swatch ?? "");
        } else {
          localized.en.values[known] ||= enValue;
          localized.ar.values[known] ||= arValue;
          swatches[known] ||= meta?.swatch ?? "";
        }
      }

      if (kind === "custom") {
        kind = inferKindFromTypeName(localized.en.name || localized.ar.name);
      }

      types.push({
        id: `type-${typeIndex}`,
        kind,
        unit,
        swatches: kind === "color" ? swatches : undefined,
        localized,
      });
    }

    return types;
  }

  // Keyed by option position. Shopify imports store bare values ("Red", "S") with no option name,
  // so grouping by name made every value its own option and the rows collapsed into one.
  const slots: Array<{ name: string; bare: boolean; values: Set<string> } | undefined> = [];

  variants.forEach((variant) => {
    [variant.option1, variant.option2, variant.option3].forEach((option, position) => {
      const parsed = parseVariantOption(option);

      if (!parsed?.value) {
        return;
      }

      const slot = (slots[position] ??= { name: option!.includes(":") ? parsed.typeName : "", bare: !option!.includes(":"), values: new Set() });
      slot.values.add(parsed.value);
    });
  });

  return slots.flatMap((slot, position) => {
    if (!slot) return [];
    const values = Array.from(slot.values);
    return [
      {
        id: `type-${position}`,
        kind: slot.bare ? ("custom" as const) : inferKindFromTypeName(slot.name),
        localized: {
          en: { name: slot.bare ? `Option ${position + 1}` : slot.name, values },
          ar: { name: slot.bare ? `الخيار ${position + 1}` : "", values: values.map(() => "") },
        },
      },
    ];
  });
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
    const optionKey = `option${typeIndex + 1}` as 'option1' | 'option2' | 'option3';
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
