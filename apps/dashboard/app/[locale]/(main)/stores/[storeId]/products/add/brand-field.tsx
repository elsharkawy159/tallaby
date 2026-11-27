"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Plus, Search, Tag, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { FieldHint, FieldLabel } from "@/app/[locale]/(main)/stores/[storeId]/products/add/form-kit";
import { useSellerTaxonomy } from "../categories-brands/seller-taxonomy-fields.client";
import { cleanTaxonomyName, matchTaxonomyOptionByName, taxonomyLabel, taxonomyMatchKey } from "../categories-brands/categories-brands.lib";
import { useProductsHref } from "../_components/product-store.client";
import type { AddProductFormData } from "./add-product.schema";
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto";

type Row = { kind: "store"; option: SellerTaxonomyOption; label: string } | { kind: "new"; label: string };

const NAME_MAX = 80;

/**
 * The product's brand: optional, from the store's own list (Products ›
 * Brands). The seller picks one, or types a new name, kept in
 * `sellerBrandName` and added to the list only when the product is saved
 * (add-product.tsx resolveStoreBrand), as a new category is. The server checks
 * the brand belongs to the store (setProductSellerTaxonomy). Renders nothing
 * outside a SellerTaxonomyProvider.
 */
export function BrandField() {
  const taxonomy = useSellerTaxonomy();
  if (!taxonomy) return null;
  return <BrandBox brands={taxonomy.brands} />;
}

function BrandBox({ brands }: { brands: SellerTaxonomyOption[] }) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.brandField");
  const locale = useLocale();
  const productsHref = useProductsHref();
  const listId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [sellerBrandId, sellerBrandName] = useWatch({ control: form.control, name: ["sellerBrandId", "sellerBrandName"] });

  const selection = useMemo((): Row | null => {
    const typed = sellerBrandName?.trim();
    if (typed) return { kind: "new", label: typed };
    const option = sellerBrandId ? brands.find((b) => b.id === sellerBrandId) : undefined;
    return option ? { kind: "store", option, label: taxonomyLabel(option, locale) } : null;
  }, [sellerBrandName, sellerBrandId, brands, locale]);
  const selectedLabel = selection?.label ?? "";

  const [text, setText] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Follow the value when it changes from outside (AI fill, draft restore, reset).
  useEffect(() => {
    if (!open) setText(selectedLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabel]);

  const query = text.trim() === selectedLabel ? "" : cleanTaxonomyName(text).slice(0, NAME_MAX);
  const rows = useMemo((): Row[] => {
    const key = taxonomyMatchKey(query);
    const matches = key
      ? brands.filter((b) => taxonomyMatchKey(b.name).includes(key) || (b.nameAr != null && taxonomyMatchKey(b.nameAr).includes(key)))
      : brands;
    const list: Row[] = matches.map((option) => ({ kind: "store", option, label: taxonomyLabel(option, locale) }));
    if (query && !matchTaxonomyOptionByName(brands, query)) list.push({ kind: "new", label: query });
    return list;
  }, [query, brands, locale]);
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const set = (name: "sellerBrandId" | "sellerBrandName", value: string) => form.setValue(name, value, { shouldDirty: true });

  const choose = (row: Row | null) => {
    if (!row) {
      set("sellerBrandName", "");
      set("sellerBrandId", "");
    } else if (row.kind === "store") {
      set("sellerBrandName", "");
      set("sellerBrandId", row.option.id);
    } else {
      set("sellerBrandName", row.label);
      set("sellerBrandId", "");
    }
    setText(row?.label ?? "");
    setOpen(false);
  };

  /** Settle what's typed: empty clears, a known name selects it, a new name becomes a new brand. */
  const commit = () => {
    setOpen(false);
    const typed = text.trim();
    if (!typed) return choose(null);
    if (typed === selectedLabel) return setText(selectedLabel);
    const known = matchTaxonomyOptionByName(brands, typed);
    if (known) return choose({ kind: "store", option: known, label: taxonomyLabel(known, locale) });
    choose({ kind: "new", label: cleanTaxonomyName(typed).slice(0, NAME_MAX) });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (!rows.length) return;
      setActive((activeIndex + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      // Never submit the product form from here.
      e.preventDefault();
      if (open && rows[activeIndex]) choose(rows[activeIndex]!);
      else commit();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setText(selectedLabel);
      setOpen(false);
    }
  };

  const optionId = (index: number) => `${listId}-${index}`;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <FieldLabel htmlFor={inputId} note={t("optional")}>
        {t("label")}
      </FieldLabel>

      <div className="relative">
        <div
          className={cn(
            "flex h-11 items-center rounded-[10px] border bg-card transition-[border-color,box-shadow]",
            open ? "border-primary ring-[3px] ring-primary/20" : "border-input hover:border-faint"
          )}
        >
          <Search className="ms-3 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            id={inputId}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && rows[activeIndex] ? optionId(activeIndex) : undefined}
            autoComplete="off"
            maxLength={NAME_MAX}
            value={text}
            placeholder={brands.length ? t("placeholder") : t("placeholderEmpty")}
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
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-base outline-none placeholder:text-faint md:text-sm"
          />
          {text && (
            <button
              type="button"
              aria-label={t("clear")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setText("");
                setActive(0);
                setOpen(true);
                inputRef.current?.focus();
              }}
              className="grid h-full w-9 place-items-center text-faint hover:text-foreground"
            >
              <X className="size-[15px]" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("label")}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              inputRef.current?.focus();
              setOpen(true);
            }}
            className="grid h-full place-items-center pe-3 text-faint"
          >
            <ChevronsUpDown className="size-[15px]" />
          </button>
        </div>

        {open && (
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={t("label")}
            // Keep focus in the input, so a click in the list never commits a half-typed name first.
            onMouseDown={(e) => e.preventDefault()}
            className="absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-[300px] overflow-y-auto overscroll-contain rounded-xl border bg-popover p-1.5 shadow-lg"
          >
            {rows.map((row, index) => {
              const isActive = index === activeIndex;
              const isSelected = row.kind === "store" && selection?.kind === "store" && selection.option.id === row.option.id;
              return (
                <div
                  key={row.kind === "store" ? row.option.id : "new"}
                  id={optionId(index)}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onMouseMove={() => !isActive && setActive(index)}
                  onClick={() => choose(row)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13px]",
                    isActive && "bg-primary-soft"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-[30px] shrink-0 place-items-center rounded-lg",
                      row.kind === "new" ? "bg-accent-soft text-accent-ink" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {row.kind === "new" ? <Plus className="size-[15px]" /> : <Tag className="size-[15px]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {row.kind === "new" ? (
                      <>
                        <b className="block truncate font-medium text-accent-ink">{t("addNew", { name: row.label })}</b>
                        <small className="block text-[11px] leading-normal text-faint">{t("addNewHint")}</small>
                      </>
                    ) : (
                      <b className="block truncate font-medium text-foreground">{row.label}</b>
                    )}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                </div>
              );
            })}
            {!rows.length && <div className="p-3.5 text-center text-[13px] text-faint">{t("empty")}</div>}
          </div>
        )}
      </div>

      <FieldHint className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-faint">
        {selection?.kind === "new" ? (
          <>
            <Plus className="size-[13px] shrink-0" aria-hidden />
            {t("newBrand")}
          </>
        ) : (
          <>
            {t("hint")}{" "}
            <Link href={productsHref("/brands")} target="_blank" className="font-semibold text-primary-ink hover:underline">
              {t("manage")}
            </Link>
          </>
        )}
      </FieldHint>
    </div>
  );
}
