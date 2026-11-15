"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, LoaderCircle, Plus, Search, X } from "lucide-react";

import type { Place } from "@workspace/lib/places";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { TextInput } from "@/components/seller-ui";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/**
 * The place data and the zone helpers that depend on it are large, so the browser
 * loads them only when a zone sheet needs them.
 */
const loadLib = () =>
  Promise.all([import("@workspace/lib/places"), import("@workspace/lib/shipping/store-zones")]).then(
    ([places, zones]) => ({ ...places, ...zones }),
  );
export type ShippingLib = Awaited<ReturnType<typeof loadLib>>;

let libPromise: Promise<ShippingLib> | null = null;

/** The lazily loaded place + zone helpers. */
export function useShippingLib(): ShippingLib | null {
  const [lib, setLib] = useState<ShippingLib | null>(null);
  useEffect(() => {
    if (lib) return;
    let alive = true;
    libPromise ??= loadLib().catch((error) => {
      libPromise = null;
      throw error;
    });
    libPromise.then((l) => alive && setLib(l)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [lib]);
  return lib;
}

const isEgypt = (key: string) => key === "EG" || key.startsWith("EG/");
const isIn = (country: string | null, key: string) => !!country && (key === country || key.startsWith(`${country}/`));

/**
 * Search-and-pick for place keys: one search box (the store's country first, then
 * other countries), selected chips, and a checkable list of that country's regions.
 * `country` is the store's likely country: Egypt unless its currency says otherwise,
 * null when the currency has no one country (no list; search still finds every place).
 * `takenBy` labels places already in another enabled zone; `blockTaken` makes them unpickable.
 * The parent owns the lazily loaded `lib`.
 */
export function PlacePicker({
  lib,
  country = "EG",
  value,
  onChange,
  takenBy,
  blockTaken = false,
  labels,
  invalid = false,
  id,
}: {
  lib: ShippingLib | null;
  country?: string | null;
  value: string[];
  onChange: (keys: string[]) => void;
  takenBy?: Map<string, string>;
  blockTaken?: boolean;
  /** Labels known before the place data loads (the server-rendered chips). */
  labels?: Record<string, string>;
  invalid?: boolean;
  id?: string;
}) {
  const t = useTranslations("storeShipping.picker");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 150);
  const [browse, setBrowse] = useState(false);

  const label = (key: string) => (lib ? lib.placeLabel(key, locale) : (labels?.[key] ?? key));
  const levelWord = (p: Place) =>
    p.level === "country" ? t("levels.country") : p.level === "city" ? t("levels.city") : isEgypt(p.key) ? t("levels.governorate") : t("levels.region");

  const results = useMemo(() => {
    if (!lib || !debounced.trim()) return null;
    const found = lib.searchPlaces(debounced, { limit: 20 });
    return { home: found.filter((p) => isIn(country, p.key)), other: found.filter((p) => !isIn(country, p.key)) };
  }, [lib, debounced, country]);

  const egyptian = country === "EG";
  const countryPlace = lib && country && !egyptian ? lib.getPlace(country) : undefined;
  const countryName = lib && country ? lib.placeLabel(country, locale) : "";

  // Egypt lists its governorates; another country also offers itself, so one zone can cover all of it.
  const governorates = useMemo(() => {
    if (!lib || !browse || !country) return [];
    const regions = lib.childrenOf(country);
    return countryPlace ? [countryPlace, ...regions] : regions;
  }, [lib, browse, country, countryPlace]);

  const toggle = (key: string) => {
    if (value.includes(key)) onChange(value.filter((k) => k !== key));
    else onChange([...value, key]);
  };
  const pick = (key: string) => {
    toggle(key);
    if (!value.includes(key)) setQuery("");
  };

  const row = (p: Place) => {
    const selected = value.includes(p.key);
    const other = takenBy?.get(p.key);
    const blocked = !!other && blockTaken && !selected;
    return (
      <li key={p.key}>
        <button
          type="button"
          disabled={blocked}
          onClick={() => pick(p.key)}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2 text-start text-sm transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
            blocked && "cursor-not-allowed opacity-60 hover:bg-transparent",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="font-medium">{lib!.placeLabel(p.key, locale)}</span>
            <span className="text-muted-foreground"> · {levelWord(p)}</span>
            {other && <span className="block text-xs text-muted-foreground">{t("inZone", { zone: other })}</span>}
          </span>
          {selected ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
              <Check className="size-3.5" aria-hidden />
              {t("added")}
            </span>
          ) : (
            !blocked && (
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Plus className="size-3.5" aria-hidden />
                {t("add")}
              </span>
            )
          )}
        </button>
      </li>
    );
  };

  const group = (title: string, places: Place[]) =>
    places.length > 0 && (
      <>
        <li className="bg-muted/50 px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground">{title}</li>
        {places.map(row)}
      </>
    );

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <TextInput
          id={id}
          type="search"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          className="ps-10"
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const first = results && [...results.home, ...results.other].find((p) => !(blockTaken && takenBy?.has(p.key)));
              if (first) pick(first.key);
            }
            if (e.key === "Escape" && query) {
              e.stopPropagation();
              setQuery("");
            }
          }}
        />
        {!lib && query && (
          <LoaderCircle className="absolute end-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
        )}
      </div>

      {results && (
        <ul className="max-h-64 divide-y overflow-y-auto rounded-xl border">
          {results.home.length + results.other.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">{t("noResults")}</li>
          ) : (
            <>
              {group(egyptian ? t("egypt") : countryName, results.home)}
              {group(t("otherCountries"), results.other)}
            </>
          )}
        </ul>
      )}

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("selected")}>
          {value.map((key) => (
            <li
              key={key}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary-soft py-1 ps-3 pe-1 text-[13px] font-semibold text-primary-ink"
            >
              <span className="min-w-0 truncate">{label(key)}</span>
              <button
                type="button"
                className="relative grid size-5 shrink-0 cursor-pointer place-items-center rounded-full before:absolute before:-inset-2.5 hover:bg-primary/15"
                aria-label={t("remove", { place: label(key) })}
                onClick={() => onChange(value.filter((k) => k !== key))}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {country && <div>
        <button
          type="button"
          className="inline-flex min-h-10 cursor-pointer items-center gap-1 text-[13px] font-semibold text-(--s-link) hover:underline"
          aria-expanded={browse}
          onClick={() => setBrowse((b) => !b)}
        >
          {egyptian ? t("browse") : lib ? t("browseCountry", { country: countryName }) : t("browseRegions")}
          <ChevronDown className={cn("size-4 transition-transform", browse && "rotate-180")} aria-hidden />
        </button>
        {browse && (
          <div className="mt-2 rounded-xl border">
            {!lib ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                {t("loading")}
              </p>
            ) : (
              <ul className="grid max-h-64 grid-cols-1 gap-x-3 overflow-y-auto p-2 sm:grid-cols-2">
                {governorates.map((g) => {
                  const checked = value.includes(g.key);
                  const other = takenBy?.get(g.key);
                  const blocked = !!other && blockTaken && !checked;
                  return (
                    <li key={g.key}>
                      <label
                        className={cn(
                          "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-(--s-tint)",
                          blocked && "cursor-not-allowed opacity-60 hover:bg-transparent",
                        )}
                      >
                        <Checkbox checked={checked} disabled={blocked} onCheckedChange={() => toggle(g.key)} />
                        <span className="min-w-0">
                          {locale.startsWith("ar") ? g.nameAr : g.nameEn}
                          {other && <span className="text-xs text-muted-foreground"> · {other}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>}
    </div>
  );
}
