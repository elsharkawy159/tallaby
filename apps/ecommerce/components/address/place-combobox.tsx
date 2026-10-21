"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";

import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@workspace/ui/components/popover";
import type { Place } from "@workspace/lib/places";

/**
 * The place data is large, so it loads on the first focus or keystroke and is
 * shared by every combobox on the page.
 */
type PlacesLib = typeof import("@workspace/lib/places");
let libPromise: Promise<PlacesLib> | null = null;
const loadPlaces = () => {
  libPromise ??= import("@workspace/lib/places").catch((error) => {
    libPromise = null;
    throw error;
  });
  return libPromise;
};

const nameOf = (place: Place, locale: string) =>
  locale === "ar" ? place.nameAr : place.nameEn;
const otherNameOf = (place: Place, locale: string) =>
  locale === "ar" ? place.nameEn : place.nameAr;

export interface PlaceComboboxProps {
  value: string;
  /** Receives plain text: a picked place's name in the current locale, or whatever was typed. */
  onChange: (text: string) => void;
  level: "region" | "city";
  /** Place key to search under (e.g. `EG`, `EG/CAIRO`). */
  within?: string;
  /**
   * Free-text country/state of the address form. Once the place data is loaded
   * the search is scoped to the place these resolve to (the governorate for
   * cities, the country for governorates); `within` is the fallback.
   */
  scope?: { country?: string | null; state?: string | null };
  locale?: string;
  placeholder?: string;
  onBlur?: () => void;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  /** Injected by `FormControl` (invalid styling and the link to `FormMessage`). */
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
  "data-slot"?: string;
}

/** Searchable text field: suggestions come from the places list, typing free text keeps working. */
export function PlaceCombobox({
  value,
  onChange,
  level,
  within = "EG",
  scope,
  locale: localeProp,
  placeholder,
  onBlur,
  className,
  id,
  name,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "data-slot": dataSlot,
}: PlaceComboboxProps) {
  const listId = useId();
  const optionId = (key: string) => `${listId}-opt-${results.findIndex((r) => r.key === key)}`;
  const t = useTranslations("addresses");
  const activeLocale = useLocale();
  const locale = localeProp ?? activeLocale;
  const [lib, setLib] = useState<PlacesLib | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const ensureLib = useCallback(() => {
    if (lib) return;
    loadPlaces().then(setLib).catch(() => undefined);
  }, [lib]);

  const scopeCountry = scope?.country;
  const scopeState = scope?.state;
  const hasScope = !!scope;
  const searchWithin = useMemo(() => {
    if (!lib || !hasScope) return within;
    const key = lib.resolveAddressPlace({
      country: scopeCountry,
      state: scopeState,
    });
    if (!key) return within;
    if (level === "city") {
      return lib.getPlace(key)?.level === "region" ? key : within;
    }
    return key.split("/")[0] || within;
  }, [lib, hasScope, scopeCountry, scopeState, level, within]);

  const results = useMemo(() => {
    if (!lib || !typed) return [];
    const q = (value ?? "").trim();
    if (!q) return [];
    return lib.searchPlaces(q, {
      limit: 8,
      within: searchWithin,
      levels: [level],
    });
  }, [lib, typed, value, searchWithin, level]);

  useEffect(() => {
    setActive(results[0]?.key ?? "");
  }, [results]);

  const pick = (place: Place) => {
    onChange(nameOf(place, locale));
    setTyped(false);
    setOpen(false);
  };

  const showList = open && typed && (value ?? "").trim().length > 0 && !!lib;

  return (
    <Popover open={showList} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            name={name}
            value={value ?? ""}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-haspopup="listbox"
            aria-controls={showList ? listId : undefined}
            aria-activedescendant={showList && active ? optionId(active) : undefined}
            aria-autocomplete="list"
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            data-slot={dataSlot}
            className={className ?? "h-11 rounded-lg"}
            onFocus={ensureLib}
            onChange={(e) => {
              ensureLib();
              onChange(e.target.value);
              setTyped(true);
              setOpen(true);
            }}
            onBlur={() => {
              // Free text stays as typed; the list closes on any blur.
              setOpen(false);
              onBlur?.();
            }}
            onKeyDown={(e) => {
              if (!showList) return;
              const i = results.findIndex((r) => r.key === active);
              if (e.key === "ArrowDown" && results.length) {
                e.preventDefault();
                setActive(results[(i + 1) % results.length]!.key);
              } else if (e.key === "ArrowUp" && results.length) {
                e.preventDefault();
                setActive(
                  results[(i - 1 + results.length) % results.length]!.key,
                );
              } else if (e.key === "Enter" && results[i]) {
                e.preventDefault();
                pick(results[i]!);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-48 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        // Keep the input focused (and free text intact) while a suggestion is pressed.
        onMouseDown={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} value={active} onValueChange={setActive}>
          <CommandList id={listId}>
            <CommandEmpty className="px-2 py-3 text-center text-muted-foreground text-xs">
              {t("noPlaceMatch")}
            </CommandEmpty>
            {results.map((place) => (
              <CommandItem
                key={place.key}
                id={optionId(place.key)}
                value={place.key}
                onSelect={() => pick(place)}
              >
                <span>{nameOf(place, locale)}</span>
                <span className="ms-auto text-muted-foreground text-xs">
                  {otherNameOf(place, locale)}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** react-hook-form wrapper: label + `PlaceCombobox` + validation message, like `TextInput`. */
export function PlaceFormField<TFieldValues extends FieldValues>({
  form,
  name,
  label,
  required,
  ...rest
}: {
  form: UseFormReturn<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  required?: boolean;
} & Omit<PlaceComboboxProps, "value" | "onChange" | "name">) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-red-600">*</span>}
          </FormLabel>
          <FormControl>
            <PlaceCombobox
              {...rest}
              name={field.name}
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
