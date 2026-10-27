"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPricePlain } from "@workspace/lib";
import { cn } from "@workspace/ui/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { searchStorefrontProducts, type StorefrontSearchResult } from "@/actions/storefront-search";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Link, useRouter } from "@/i18n/navigation";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import s from "../storefront.module.css";

type SearchState = { status: "idle" | "loading" | "done"; query: string; results: StorefrontSearchResult[]; total: number };

const MIN_QUERY = 2;
const IDLE: SearchState = { status: "idle", query: "", results: [], total: 0 };

const resultsHref = (query: string) => `/products?search=${encodeURIComponent(query.trim())}`;

/** This store's products matching what the shopper types, fetched as they type (debounced). */
function useStoreSearch(query: string): SearchState {
  const locale = useLocale();
  const [state, setState] = useState<SearchState>(IDLE);
  const latest = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const request = ++latest.current;
    if (trimmed.length < MIN_QUERY) {
      setState(IDLE);
      return;
    }
    setState((prev) => ({ ...prev, status: "loading", query: trimmed }));
    const timer = setTimeout(() => {
      searchStorefrontProducts(trimmed, locale)
        .then(({ results, total }) => {
          if (request === latest.current) setState({ status: "done", query: trimmed, results, total });
        })
        .catch(() => {
          if (request === latest.current) setState({ status: "done", query: trimmed, results: [], total: 0 });
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, locale]);

  return state;
}

function SearchResults({ state, onNavigate, id }: { state: SearchState; onNavigate: () => void; id: string }) {
  const t = useTranslations("storefront");
  const locale = useLocale();
  const currencyLabel = useCurrencyLabel();

  if (state.status === "idle") return null;
  if (state.status === "loading" && !state.results.length) {
    return (
      <p id={id} className="flex items-center gap-2 px-4 py-5 text-sm text-(--sf-muted)" aria-live="polite">
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        {t("searchLoading")}
      </p>
    );
  }
  if (!state.results.length) {
    return (
      <p id={id} className="flex items-center gap-2 px-4 py-5 text-sm text-(--sf-muted)" aria-live="polite">
        <PackageSearch className="size-4 shrink-0" aria-hidden />
        {t("searchNoResults", { query: state.query })}
      </p>
    );
  }

  return (
    <div id={id} aria-live="polite" aria-busy={state.status === "loading"}>
      <ul className="max-h-[min(60vh,420px)] overflow-y-auto py-1">
        {state.results.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.slug}`}
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-(--sf-shelf) focus-visible:bg-(--sf-shelf) focus-visible:outline-none"
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-(--sf-shelf)">
                <ImageWithFallback src={product.image} alt="" fill sizes="44px" className="object-contain p-1 mix-blend-multiply" />
              </span>
              <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-snug">{product.title}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPricePlain(product.price, locale, currencyLabel)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={resultsHref(state.query)}
        onClick={onNavigate}
        className="block border-t border-(--sf-line) px-4 py-3 text-sm font-semibold text-(--sf-brand) hover:bg-(--sf-shelf)"
      >
        {t("searchSeeAll", { count: state.total, query: state.query })}
      </Link>
    </div>
  );
}

const inputClass =
  "min-w-0 flex-1 appearance-none bg-transparent text-inherit [text-align:inherit] outline-none placeholder:text-(--sf-muted) [&::-webkit-search-cancel-button]:hidden";

/**
 * A header search box (a builder search link with placeholder text): typing
 * lists matching products under it, Enter opens the full results page.
 */
export function StoreSearchBox({ placeholder, icon, iconFirst }: { placeholder: string; icon: ReactNode; iconFirst: boolean }) {
  const t = useTranslations("storefront");
  const router = useRouter();
  const listId = useId();
  const root = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const state = useStoreSearch(query);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(resultsHref(query));
  }

  const button = (
    <button type="submit" className="inline-flex shrink-0 cursor-pointer" aria-label={t("searchSubmit")}>
      {icon}
    </button>
  );

  return (
    <form ref={root} role="search" onSubmit={submit} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <div className="flex items-center gap-3">
        {iconFirst && button}
        <input
          type="search"
          name="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-controls={listId}
          aria-expanded={open && state.status !== "idle"}
          autoComplete="off"
          enterKeyHint="search"
          maxLength={100}
          className={inputClass}
        />
        {!iconFirst && button}
      </div>
      {open && state.status !== "idle" && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-(--sf-line) bg-(--sf-paper,#fff) text-start text-(--sf-ink) shadow-xl">
          <SearchResults id={listId} state={state} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </form>
  );
}

/**
 * A header search button (a builder search icon link): opens a search panel
 * from the top of the page, with the same live results.
 */
export function StoreSearchButton({ icon, fontClassName }: { icon: ReactNode; fontClassName: string }) {
  const t = useTranslations("storefront");
  const router = useRouter();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const state = useStoreSearch(query);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(resultsHref(query));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex w-full cursor-pointer items-center justify-center before:absolute before:inset-0" aria-label={t("searchPlaceholder")}>
        {icon}
      </SheetTrigger>
      <SheetContent side="top" className={cn(fontClassName, s.tokens, "gap-0 p-0")}>
        <SheetHeader className="sr-only">
          <SheetTitle>{t("searchPlaceholder")}</SheetTitle>
          <SheetDescription>{t("searchHint")}</SheetDescription>
        </SheetHeader>
        <div className="mx-auto w-full max-w-2xl px-12 pb-4 pt-5">
          <form role="search" onSubmit={submit} className="flex items-center gap-3 rounded-full border-2 border-(--sf-line) px-4 py-2.5 focus-within:border-(--sf-brand)">
            <input
              type="search"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              aria-controls={listId}
              autoComplete="off"
              enterKeyHint="search"
              maxLength={100}
              autoFocus
              className={cn(inputClass, "text-base")}
            />
            <button type="submit" className="inline-flex shrink-0 cursor-pointer text-(--sf-brand)" aria-label={t("searchSubmit")}>
              {icon}
            </button>
          </form>
        </div>
        <div className="mx-auto w-full max-w-2xl pb-3">
          <SearchResults id={listId} state={state} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
