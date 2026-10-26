"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronsUpDown, LayoutGrid, Plus, Search, Sparkles, Store, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { FieldError, FieldHint, FieldLabel } from "@/components/form/form-ui";
import { suggestCategories } from "./add-product.lib";
import {
  highlightMatch,
  indexTallabyCategories,
  sameCategoryName,
  searchCategoryChoices,
  type CategoryChoice,
} from "./category-search.lib";
import { useFieldError } from "./sections/fields";
import { useSellerTaxonomy } from "../categories-brands/seller-taxonomy-fields.client";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto";

interface CategoryFieldProps {
  categories: CategoryOption[];
}

type Selection =
  | { kind: "store"; option: SellerTaxonomyOption; label: string }
  | { kind: "tallaby"; id: string; label: string; path: string }
  | { kind: "new"; label: string }
  | null;

/**
 * One category box, like the brand input it replaces: the seller searches
 * their store's categories first, then Tallaby's, or types a new one (added
 * to their store's list on save). On phones the list opens as a bottom sheet.
 *
 * `products.category_id` (a Tallaby category) is still required, so a store
 * or new category that isn't a Tallaby one is matched, without asking, to the
 * closest Tallaby category, else a catch-all one. There is no marketplace to
 * show it in (owner, 2026-10-26), so the seller never sees that choice.
 */
export function CategoryField({ categories }: CategoryFieldProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.categoryField");
  const locale = useLocale();
  const taxonomy = useSellerTaxonomy();
  const store = useMemo(() => taxonomy?.categories ?? [], [taxonomy?.categories]);
  const isMobile = useIsMobile();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [categoryId, sellerCategoryId, sellerCategoryName, enTitle, arTitle] = useWatch({
    control: form.control,
    name: ["categoryId", "sellerCategoryId", "sellerCategoryName", "localized.en.title", "localized.ar.title"],
  });

  const tallaby = useMemo(() => indexTallabyCategories(categories, locale), [categories, locale]);
  const byId = useMemo(() => new Map(tallaby.map((c) => [c.category.id, c])), [tallaby]);
  const pathOf = (id: string | undefined) => {
    const c = id ? byId.get(id) : undefined;
    return c ? [c.parentLabel, c.label].filter(Boolean).join(" › ") : "";
  };

  const selection: Selection = useMemo(() => {
    if (sellerCategoryName?.trim()) return { kind: "new", label: sellerCategoryName.trim() };
    const option = sellerCategoryId ? store.find((o) => o.id === sellerCategoryId) : undefined;
    if (option) return { kind: "store", option, label: locale === "ar" && option.nameAr?.trim() ? option.nameAr : option.name };
    const tl = categoryId ? byId.get(categoryId) : undefined;
    if (tl) return { kind: "tallaby", id: tl.category.id, label: tl.label, path: pathOf(tl.category.id) };
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerCategoryName, sellerCategoryId, categoryId, store, byId, locale]);
  const selectedLabel = selection?.label ?? "";

  const [text, setText] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // A store/new category's Tallaby category follows the product name.
  const [autoMatch, setAutoMatch] = useState(false);

  // Follow the value when it changes from outside (draft restore, import, reset).
  useEffect(() => {
    if (!open) setText(selectedLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLabel]);

  const debouncedTitles = useDebounce(`${enTitle ?? ""}\u0000${arTitle ?? ""}`, 250);
  const suggested = useMemo(() => {
    const [en, ar] = debouncedTitles.split("\u0000");
    return suggestCategories(categories, { titles: [en, ar] }, 4)
      .map((m) => byId.get(m.category.id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [categories, debouncedTitles, byId]);

  /** Catch-all Tallaby category ("Other", "Misc"…), else the first leaf: the match of last resort. */
  const fallbackId = useMemo(() => {
    const leaves = tallaby.filter((c) => c.isLeaf);
    const catchAll = leaves.find((c) =>
      /\b(other|others|misc|miscellaneous|general)\b|أخرى|اخرى|متنوع/i.test(
        `${c.category.name} ${c.category.nameAr ?? ""} ${c.category.slug}`
      )
    );
    return (catchAll ?? leaves[0] ?? tallaby[0])?.category.id;
  }, [tallaby]);

  /** Closest Tallaby category for a store/new category name plus the product name. */
  const bestMatch = (name: string) => {
    const [en, ar] = debouncedTitles.split("\u0000");
    return (
      suggestCategories(categories, { titles: [name] }, 1)[0] ??
      suggestCategories(categories, { titles: [name, en, ar] }, 1)[0]
    )?.category.id;
  };

  useEffect(() => {
    if (!autoMatch || !selection || selection.kind === "tallaby") return;
    if (selection.kind === "store" && selection.option.sourceId) return;
    const match = bestMatch(selection.label);
    if (match && match !== categoryId) form.setValue("categoryId", match, { shouldValidate: form.formState.submitCount > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMatch, selection, debouncedTitles]);

  const query = text.trim() === selectedLabel ? "" : text;
  const rows = useMemo(
    () => searchCategoryChoices({ query, store, tallaby, suggested, locale, allowNew: Boolean(taxonomy) }),
    [query, store, tallaby, suggested, locale, taxonomy]
  );
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // The phone sheet covers the page: keep the page from scrolling behind it.
  const sheet = open && isMobile;
  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheet]);

  const set = (name: "categoryId" | "sellerCategoryId" | "sellerCategoryName", value: string) =>
    form.setValue(name, value, { shouldDirty: true, shouldValidate: name === "categoryId" });

  const choose = (row: CategoryChoice | null) => {
    if (!row) {
      set("sellerCategoryName", "");
      set("sellerCategoryId", "");
      set("categoryId", "");
      setAutoMatch(false);
    } else if (row.kind === "store") {
      set("sellerCategoryName", "");
      set("sellerCategoryId", row.option.id);
      const mapped = row.option.sourceId && byId.has(row.option.sourceId) ? row.option.sourceId : bestMatch(row.option.name);
      set("categoryId", mapped ?? (categoryId || fallbackId) ?? "");
      setAutoMatch(!row.option.sourceId);
    } else if (row.kind === "tallaby") {
      set("sellerCategoryName", "");
      set("sellerCategoryId", store.find((o) => o.sourceId === row.entry.category.id)?.id ?? "");
      set("categoryId", row.entry.category.id);
      setAutoMatch(false);
    } else {
      set("sellerCategoryName", row.label);
      set("sellerCategoryId", "");
      set("categoryId", bestMatch(row.label) ?? fallbackId ?? "");
      setAutoMatch(true);
    }
    setText(row?.label ?? "");
    setOpen(false);
    if (isMobile) inputRef.current?.blur();
  };

  /** Settle what's typed: empty clears, a known name selects it, a new name becomes a new category. */
  const commit = () => {
    setOpen(false);
    const typed = text.trim();
    if (!typed) return choose(null);
    if (typed === selectedLabel) return setText(selectedLabel);
    const known = rows.find(
      (row) =>
        row.kind !== "new" &&
        (sameCategoryName(row.label, typed) ||
          (row.kind === "store" && sameCategoryName(row.option.name, typed)) ||
          (row.kind === "tallaby" && sameCategoryName(row.entry.category.name, typed)))
    );
    if (known) return choose(known);
    const create = rows.find((row) => row.kind === "new");
    if (create) return choose(create);
    setText(selectedLabel);
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

  const error = useFieldError("categoryId");
  const optionId = (index: number) => `${listId}-${index}`;
  const groupTitle: Record<CategoryChoice["kind"], string> = {
    store: t("storeGroup"),
    tallaby: query.trim() || !suggested.length ? t("tallabyGroup") : t("suggestedGroup"),
    new: "",
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <FieldLabel htmlFor="product-category" required>
        {t("label")}
      </FieldLabel>

      {/* Holds the field's place while the box is lifted into the phone sheet. */}
      <div className="relative min-h-11">
        <div
          className={cn(
            sheet &&
              "fixed inset-x-0 top-[8vh] bottom-0 z-[95] flex flex-col gap-2.5 rounded-t-[18px] bg-card px-3.5 pt-2 pb-3.5 shadow-2xl"
          )}
        >
          {sheet && (
            <div className="relative flex items-center justify-between px-0.5 pt-1">
              <span className="absolute -top-0.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-input" aria-hidden />
              <b className="text-base">{t("sheetTitle")}</b>
              <button
                type="button"
                onClick={commit}
                aria-label={t("close")}
                className="grid size-9 place-items-center rounded-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-[18px]" />
              </button>
            </div>
          )}
          <div
            className={cn(
              "flex h-11 items-center rounded-[10px] border bg-card transition-[border-color,box-shadow]",
              open ? "border-primary ring-[3px] ring-primary/20" : "border-input hover:border-faint",
              error && !open && "border-destructive",
              sheet && "h-12 shrink-0"
            )}
          >
            <Search className="ms-3 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              id="product-category"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-invalid={Boolean(error)}
              aria-activedescendant={open && rows[activeIndex] ? optionId(activeIndex) : undefined}
              autoComplete="off"
              value={text}
              placeholder={taxonomy ? t("placeholder") : t("placeholderTallaby")}
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
              // On phones the sheet stays open while the keyboard hides; it closes on pick, ✕ or the backdrop.
              onBlur={() => {
                if (!isMobile) commit();
              }}
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
              className={cn(
                "overflow-y-auto overscroll-contain",
                sheet
                  ? "min-h-0 flex-1"
                  : "absolute inset-x-0 top-[calc(100%+6px)] z-20 max-h-[340px] rounded-xl border bg-popover p-1.5 shadow-lg"
              )}
            >
              {rows.map((row, index) => {
                const previous = rows[index - 1];
                const heading = previous?.kind !== row.kind;
                const isActive = index === activeIndex;
                const isSelected =
                  selection != null &&
                  ((row.kind === "store" && selection.kind === "store" && selection.option.id === row.option.id) ||
                    (row.kind === "tallaby" && selection.kind === "tallaby" && selection.id === row.entry.category.id));
                return (
                  <div key={row.kind === "store" ? `s-${row.option.id}` : row.kind === "tallaby" ? `t-${row.entry.category.id}` : "new"}>
                    {heading &&
                      (row.kind === "new" ? (
                        index > 0 && <div className="mx-1 my-1.5 h-px bg-border" />
                      ) : (
                        <div className="px-2.5 pt-2.5 pb-1 text-[11px] font-semibold text-faint">{groupTitle[row.kind]}</div>
                      ))}
                    <div
                      id={optionId(index)}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onMouseMove={() => !isActive && setActive(index)}
                      onClick={() => choose(row)}
                      className={cn(
                        "flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-[9px] px-1.5 py-2 text-[13px] md:min-h-11 md:px-2.5 md:py-[7px]",
                        isActive && "bg-primary-soft"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-[30px] shrink-0 place-items-center rounded-lg",
                          row.kind === "new" ? "bg-accent-soft text-accent-ink" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {row.kind === "store" ? (
                          <Store className="size-[15px]" />
                        ) : row.kind === "tallaby" ? (
                          query.trim() || !suggested.length ? <LayoutGrid className="size-[15px]" /> : <Sparkles className="size-[15px] text-accent-ink" />
                        ) : (
                          <Plus className="size-[15px]" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        {row.kind === "new" ? (
                          <>
                            <b className="block truncate font-medium text-accent-ink">{t("addNew", { name: row.label })}</b>
                            <small className="block text-[11px] leading-normal text-faint">{t("addNewHint")}</small>
                          </>
                        ) : (
                          <>
                            <b className="block truncate font-medium text-foreground">
                              <Highlight text={row.label} query={query} />
                            </b>
                            {row.kind === "tallaby" && row.parentLabel && (
                              <small className="block truncate text-[11px] leading-normal text-faint">
                                <Highlight text={row.parentLabel} query={query} />
                              </small>
                            )}
                          </>
                        )}
                      </span>
                      {isSelected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                    </div>
                  </div>
                );
              })}
              {!rows.length && <div className="p-3.5 text-center text-[13px] text-faint">{t("empty")}</div>}
            </div>
          )}
        </div>
      </div>
      {sheet && <div className="fixed inset-0 z-[94] bg-black/50" onClick={commit} aria-hidden />}

      <FieldHint className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-faint">
        {!selection ? (
          taxonomy ? t("hint") : t("hintTallaby")
        ) : selection.kind === "tallaby" ? (
          <>
            <LayoutGrid className="size-[13px] shrink-0" aria-hidden />
            {t("fromTallaby", { path: selection.path })}
          </>
        ) : (
          <>
            {selection.kind === "store" ? <Store className="size-[13px] shrink-0" aria-hidden /> : <Plus className="size-[13px] shrink-0" aria-hidden />}
            {selection.kind === "store" ? t("fromStore") : t("newCategory")}
          </>
        )}
      </FieldHint>
      <FieldError>{error}</FieldError>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const parts = highlightMatch(text, query);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts[0]}
      <mark className="bg-transparent font-bold text-primary-ink">{parts[1]}</mark>
      {parts[2]}
    </>
  );
}
