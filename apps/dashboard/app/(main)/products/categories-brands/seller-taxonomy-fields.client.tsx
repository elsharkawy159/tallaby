"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@workspace/ui/components/popover";
import { FieldLabel, GroupInput, InputGroup } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import type { AddProductFormData } from "../add/add-product.schema";
import { SELLER_TAXONOMY_MAX_ITEMS, type SellerTaxonomyOption, type TaxonomyKind } from "./categories-brands.dto";
import { ensureTaxonomyItem } from "./categories-brands.server";
import { TAXONOMY_PAGE_HREF, taxonomyLabel, taxonomyNameKey } from "./categories-brands.lib";

type SellerTaxonomyOptions = { categories: SellerTaxonomyOption[]; brands: SellerTaxonomyOption[] };

type SellerTaxonomyContextValue = SellerTaxonomyOptions & {
  /** Put an item the seller just created into the list, so the pickers show it. */
  addOption: (kind: TaxonomyKind, option: SellerTaxonomyOption) => void;
};

const SellerTaxonomyContext = createContext<SellerTaxonomyContextValue | null>(null);

/** Gives the product form the seller's own category and brand lists. */
export function SellerTaxonomyProvider({ value, children }: { value: SellerTaxonomyOptions; children: React.ReactNode }) {
  const [lists, setLists] = useState(value);
  useEffect(() => setLists(value), [value]);

  const addOption = useCallback((kind: TaxonomyKind, option: SellerTaxonomyOption) => {
    const key = kind === "category" ? "categories" : "brands";
    setLists((prev) =>
      prev[key].some((o) => o.id === option.id) ? prev : { ...prev, [key]: [...prev[key], option] },
    );
  }, []);

  const context = useMemo(() => ({ ...lists, addOption }), [lists, addOption]);
  return <SellerTaxonomyContext.Provider value={context}>{children}</SellerTaxonomyContext.Provider>;
}

/**
 * "My category" / "My brand": optional, from the seller's own lists (Products ›
 * Categories and Products › Brands). The seller picks one from the list or types
 * a new name, which is added to their list. Renders nothing outside a
 * SellerTaxonomyProvider.
 */
export function SellerTaxonomyFields() {
  const options = useContext(SellerTaxonomyContext);
  const t = useTranslations("categoriesBrands.productForm");
  if (!options) return null;

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <TaxonomyCombobox kind="category" name="sellerCategoryId" label={t("category")} options={options.categories} />
        <TaxonomyCombobox kind="brand" name="sellerBrandId" label={t("brand")} options={options.brands} />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("hint")}{" "}
        <Link href={TAXONOMY_PAGE_HREF.category} target="_blank" className="font-semibold text-primary-ink hover:underline">
          {t("manageCategories")}
        </Link>
        {" · "}
        <Link href={TAXONOMY_PAGE_HREF.brand} target="_blank" className="font-semibold text-primary-ink hover:underline">
          {t("manageBrands")}
        </Link>
      </p>
    </div>
  );
}

const matchesKey = (option: SellerTaxonomyOption, key: string) =>
  taxonomyNameKey(option.name) === key || (option.nameAr != null && taxonomyNameKey(option.nameAr) === key);

function TaxonomyCombobox({
  kind,
  name,
  label,
  options,
}: {
  kind: TaxonomyKind;
  name: "sellerCategoryId" | "sellerBrandId";
  label: string;
  options: SellerTaxonomyOption[];
}) {
  const t = useTranslations("categoriesBrands.productForm");
  const tErrors = useTranslations("categoriesBrands.errors");
  const locale = useLocale();
  const context = useContext(SellerTaxonomyContext);
  const form = useFormContext<AddProductFormData>();
  const value = useWatch({ control: form.control, name }) ?? "";
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);
  const selectedLabel = selected ? taxonomyLabel(selected, locale) : "";

  const [text, setText] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pending, setPending] = useState(false);
  // The input blurs when it is disabled mid-create; the ref sees that at once.
  const pendingRef = useRef(false);

  // Follow the value when it changes from outside (draft restore, import, reset).
  useEffect(() => {
    if (!open && !pending) setText(selectedLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabel]);

  const query = text.trim();
  const queryKey = taxonomyNameKey(query);
  // While the selected label is still shown untouched, list everything.
  const filtering = query !== "" && query !== selectedLabel;
  const filtered = filtering
    ? options.filter((o) => {
        const k = queryKey;
        return taxonomyNameKey(o.name).includes(k) || (o.nameAr != null && taxonomyNameKey(o.nameAr).includes(k));
      })
    : options;
  const exact = query ? options.find((o) => matchesKey(o, queryKey)) : undefined;
  const canCreate = filtering && !exact;

  type Row = { type: "option"; option: SellerTaxonomyOption } | { type: "create" };
  const rows: Row[] = [
    ...(canCreate ? [{ type: "create" as const }] : []),
    ...filtered.map((option) => ({ type: "option" as const, option })),
  ];

  const setValue = (id: string) => form.setValue(name, id, { shouldDirty: true });

  const choose = (option: SellerTaxonomyOption | null) => {
    setValue(option?.id ?? "");
    setText(option ? taxonomyLabel(option, locale) : "");
    setOpen(false);
  };

  const create = async (raw: string) => {
    setOpen(false);
    pendingRef.current = true;
    setPending(true);
    try {
      const result = await ensureTaxonomyItem(kind, { name: raw });
      if (!result.success) {
        toast.error(tErrors(result.error, { max: SELLER_TAXONOMY_MAX_ITEMS }));
        setText(selectedLabel);
        return;
      }
      context?.addOption(kind, result.data);
      setValue(result.data.id);
      setText(taxonomyLabel(result.data, locale));
      toast.success(t(kind === "category" ? "categoryAdded" : "brandAdded", { name: result.data.name }));
    } catch {
      toast.error(tErrors("generic"));
      setText(selectedLabel);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  /** Settle what's typed: empty clears, a known name selects it, a new name is added. */
  const commit = () => {
    if (pendingRef.current) return;
    if (!query) return choose(null);
    if (!filtering) return setOpen(false);
    if (exact) return choose(exact);
    void create(query);
  };

  const pickRow = (row: Row | undefined) => {
    if (!row) return commit();
    if (row.type === "create") return void create(query);
    choose(row.option);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (!rows.length) return;
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      // Never submit the product form from here.
      e.preventDefault();
      if (open && filtering) pickRow(rows[active]);
      else commit();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setText(selectedLabel);
      setOpen(false);
    }
  };

  const optionId = (index: number) => `${listId}-${index}`;

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={name} note={t("optional")}>
        {label}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <InputGroup>
            <GroupInput
              ref={inputRef}
              id={name}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && rows[active] ? optionId(active) : undefined}
              autoComplete="off"
              value={text}
              disabled={pending}
              placeholder={options.length ? t("pickOrType") : t("typeToAdd")}
              onFocus={(e) => {
                e.currentTarget.select();
                setActive(0);
                setOpen(true);
              }}
              onClick={() => setOpen(true)}
              onChange={(e) => {
                setText(e.target.value);
                setActive(0);
                setOpen(true);
              }}
              onBlur={commit}
              onKeyDown={onKeyDown}
            />
            <span className="flex items-center gap-0.5 pe-2 text-muted-foreground">
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : value ? (
                <button
                  type="button"
                  aria-label={t("clear")}
                  className="grid size-7 place-items-center rounded-md hover:bg-muted hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(null)}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                tabIndex={-1}
                aria-label={label}
                className="grid size-7 place-items-center rounded-md hover:bg-muted hover:text-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  inputRef.current?.focus();
                  setOpen((o) => !o);
                }}
              >
                <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
              </button>
            </span>
          </InputGroup>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Clicks on the input itself must not close the list.
          onInteractOutside={(e) => {
            if (inputRef.current?.parentElement?.contains(e.target as Node)) e.preventDefault();
          }}
        >
          {/* Keep focus in the input, so a click in the list never commits a half-typed name. */}
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-64 overflow-y-auto"
            onMouseDown={(e) => e.preventDefault()}
          >
            {rows.map((row, index) => {
              const isActive = index === active;
              const common = {
                id: optionId(index),
                role: "option" as const,
                onMouseEnter: () => setActive(index),
                onClick: () => pickRow(row),
                className: cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                  isActive && "bg-muted",
                ),
              };
              if (row.type === "create") {
                return (
                  <li key="create" aria-selected={isActive} {...common} className={cn(common.className, "font-medium text-primary-ink")}>
                    <Plus className="size-4 shrink-0" />
                    <span className="truncate">{t("addNew", { name: query })}</span>
                  </li>
                );
              }
              const isSelected = row.option.id === value;
              return (
                <li key={row.option.id} aria-selected={isSelected} {...common}>
                  <span className="min-w-0 flex-1 truncate">{taxonomyLabel(row.option, locale)}</span>
                  {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                </li>
              );
            })}
            {!rows.length && (
              <li className="px-2.5 py-3 text-center text-xs text-muted-foreground">
                {options.length ? t("noMatches") : t("emptyListHint")}
              </li>
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
