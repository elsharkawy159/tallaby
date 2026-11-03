"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Download, LoaderCircle, MessageCircle, Phone, Search, ShieldCheck, StickyNote, Users, X } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import {
  CUSTOMER_EXPORT_COLUMNS,
  CUSTOMER_FILTERS,
  CUSTOMER_PAGE_SIZE_COOKIE,
  CUSTOMER_PAGE_SIZES,
  customerExportRow,
  customersListHref,
  CUSTOMER_NOTE_MAX,
  CUSTOMER_SORTS,
  CUSTOMER_TAG_MAX_LENGTH,
  CUSTOMER_TAGS_MAX,
  normalizeCustomerTags,
  customerWhatsAppUrl,
  type CustomerNote,
  type CustomersListFilters,
  type CustomerOrderOutcome,
  type CustomerSort,
  type StoreCustomer,
} from "@workspace/lib/customers";
import { formatDate, formatDateTime, formatMoney, formatNumber, formatRelativeTime } from "@/lib/i18n/format";
import { downloadXlsx, todayStamp } from "@/lib/product-excel";
import { blockCustomerPhone, unblockCustomerPhone } from "../../stores/[storeId]/settings/protection/protection.server";
import { ListPager } from "../list-pager.client";
import { exportFilteredCustomers, loadCustomerOrders, saveCustomerNote, type CustomerOrderItem } from "./customers.server";
import { AudienceExportButton } from "./audience-export.client";

type Props = {
  /** One page of the filtered customers. */
  customers: StoreCustomer[];
  /** The whole store, whatever the filters (F-43e). */
  stats: { customers: number; repeat: number; refused: number };
  /** Customers matching the filters, across all pages. */
  matched: number;
  pages: number;
  filters: CustomersListFilters;
  blockedPhones: string[];
  /** Notes and tags (F-01c) of the customers on this page, by customer key. */
  notes: Record<string, CustomerNote>;
  /** Every tag this store's customers have, for the filter chips. */
  allTags: string[];
  stores: { id: string; name: string }[];
  storeId: string | null;
};

const SEARCH_DEBOUNCE_MS = 300;

const chip = (active: boolean) =>
  cn(
    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
  );

/** Orders › Customers: store picker, search, filters, the table and the customer drawer. */
export function CustomersView({
  customers,
  stats,
  matched,
  pages,
  filters,
  blockedPhones,
  notes: pageNotes,
  allTags: storeTags,
  stores,
  storeId,
}: Props) {
  const t = useTranslations("customers");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [, startNavigation] = useTransition();
  // The typed search; the URL follows it after a short pause.
  const [query, setQuery] = useState(filters.q);
  // Kept when a refresh moves the customer off this page, so the drawer stays open.
  const [openCustomer, setOpenCustomer] = useState<StoreCustomer | null>(null);
  // Notes saved here: they show at once, whatever page the server sends next.
  const [savedNotes, setSavedNotes] = useState<Record<string, CustomerNote>>({});
  const notes = useMemo(() => ({ ...pageNotes, ...savedNotes }), [pageNotes, savedNotes]);
  const blocked = useMemo(() => new Set(blockedPhones), [blockedPhones]);
  const allTags = useMemo(
    () =>
      normalizeCustomerTags([...storeTags, ...Object.values(savedNotes).flatMap((n) => n.tags)]).sort((a, b) =>
        a.localeCompare(b, locale),
      ),
    [storeTags, savedNotes, locale],
  );

  const navigate = useCallback(
    (over: Partial<CustomersListFilters>, options?: { replace?: boolean }) => {
      const href = customersListHref(pathname, storeId, { ...filters, ...over });
      startNavigation(() => {
        if (options?.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [filters, pathname, router, storeId],
  );

  // Typing searches after a short pause. Back and forward restore the box.
  const lastPushedQuery = useRef(filters.q);
  useEffect(() => {
    if (filters.q !== lastPushedQuery.current) {
      lastPushedQuery.current = filters.q;
      setQuery(filters.q);
    }
  }, [filters.q]);
  useEffect(() => {
    const next = query.trim();
    if (next === lastPushedQuery.current) return;
    const timer = setTimeout(() => {
      lastPushedQuery.current = next;
      navigate({ q: next, page: 1 }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, navigate]);

  // F-01d: every customer matching the filters as .xlsx. The server reads them
  // again for the session's seller, since only one page is in the browser.
  const [exporting, startExporting] = useTransition();
  const exportRows = () =>
    startExporting(async () => {
      if (!storeId) return;
      try {
        const res = await exportFilteredCustomers({ storeId, filters });
        if (!res.success) {
          toast.error(t("export.failed"));
          return;
        }
        const header = CUSTOMER_EXPORT_COLUMNS.map((column) => t(`export.columns.${column}`));
        const sheet = res.customers.map((c) => {
          const values = customerExportRow(c, savedNotes[c.key] ?? res.notes[c.key]);
          return Object.fromEntries(CUSTOMER_EXPORT_COLUMNS.map((column, i) => [header[i], values[column]]));
        });
        await downloadXlsx(sheet, { fileName: `customers-${todayStamp()}.xlsx`, sheetName: t("export.sheet"), header });
      } catch {
        toast.error(t("export.failed"));
      }
    });

  const open = openCustomer ? (customers.find((c) => c.key === openCustomer.key) ?? openCustomer) : null;

  if (!storeId) {
    return <EmptyCard title={t("noStore.title")} body={t("noStore.body")} />;
  }

  const changePageSize = (size: number) => {
    // Remembered for next time, so the sidebar link keeps the seller's choice.
    document.cookie = `${CUSTOMER_PAGE_SIZE_COOKIE}=${size}; path=/; max-age=31536000; samesite=lax`;
    navigate({ size, page: 1 });
  };

  return (
    <div className="space-y-4">
      {stores.length > 1 && (
        <nav aria-label={t("filters.store")} className="flex flex-wrap gap-1.5">
          {stores.map((s) => (
            <Link key={s.id} href={`${pathname}?store=${s.id}`} className={chip(storeId === s.id)} scroll={false}>
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={t("stats.customers")} value={formatNumber(stats.customers, locale)} />
        <Stat label={t("stats.repeat")} value={formatNumber(stats.repeat, locale)} />
        <Stat label={t("stats.refused")} value={formatNumber(stats.refused, locale)} />
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="ps-9"
          />
        </div>
        <nav aria-label={t("filters.label")} className="flex flex-wrap gap-1.5">
          {CUSTOMER_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={chip(filters.filter === f)}
              onClick={() => navigate({ filter: f, page: 1 })}
              aria-pressed={filters.filter === f}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </nav>
        {allTags.length > 0 && (
          <nav aria-label={t("notes.tagFilter")} className="flex flex-wrap gap-1.5">
            {allTags.map((name) => {
              const active = filters.tag.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={name}
                  type="button"
                  className={chip(active)}
                  onClick={() => navigate({ tag: active ? "" : name, page: 1 })}
                  aria-pressed={active}
                >
                  #{name}
                </button>
              );
            })}
          </nav>
        )}
        <label className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
          {t("sort.label")}
          <select
            value={filters.sort}
            onChange={(e) => navigate({ sort: e.target.value as CustomerSort, page: 1 })}
            className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
          >
            {CUSTOMER_SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" size="sm" variant="neutral" disabled={matched === 0 || exporting} onClick={exportRows}>
          {exporting ? <LoaderCircle className="animate-spin" aria-hidden /> : <Download aria-hidden />}
          {t("export.button", { count: matched })}
        </Button>
        <AudienceExportButton storeId={storeId} />
      </div>

      {stats.customers === 0 ? (
        <EmptyCard title={t("empty.title")} body={t("empty.body")} />
      ) : customers.length === 0 ? (
        <EmptyCard title={t("noMatch.title")} body={t("noMatch.body")} />
      ) : (
        <Card className="py-0">
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.customer")}</TableHead>
                    <TableHead>{t("columns.place")}</TableHead>
                    <TableHead className="text-end">{t("columns.orders")}</TableHead>
                    <TableHead className="text-end">{t("columns.spent")}</TableHead>
                    <TableHead className="text-end">{t("columns.success")}</TableHead>
                    <TableHead>{t("columns.lastOrder")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.key} className="cursor-pointer" onClick={() => setOpenCustomer(c)}>
                      <TableCell>
                        <button type="button" className="min-w-0 text-start" onClick={() => setOpenCustomer(c)}>
                          <span className="flex items-center gap-1.5 font-medium">
                            {c.name || t("noName")}
                            {c.phone && blocked.has(c.phone) && (
                              <Badge variant="outline" className="border-destructive/40 text-destructive">
                                {t("blocked")}
                              </Badge>
                            )}
                          </span>
                          {c.phone && (
                            <span dir="ltr" className="block text-xs tabular-nums text-muted-foreground rtl:text-end">
                              {c.phone}
                            </span>
                          )}
                          <RowNotes note={notes[c.key]} />
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[c.city, c.governorate].filter(Boolean).join("، ") || "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{formatNumber(c.orderCount, locale)}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatMoney(c.totalSpent, locale)}</TableCell>
                      <TableCell className="text-end">
                        <SuccessRate customer={c} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <time dateTime={c.lastOrderAt} title={formatDateTime(c.lastOrderAt, locale)}>
                          {formatRelativeTime(c.lastOrderAt, locale)}
                        </time>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {matched > 0 && (
        <ListPager
          page={filters.page}
          pages={pages}
          size={filters.size}
          sizes={CUSTOMER_PAGE_SIZES}
          total={matched}
          onPage={(page) => navigate({ page })}
          onSize={changePageSize}
        />
      )}

      {open && (
        <CustomerSheet
          customer={open}
          storeId={storeId}
          blocked={Boolean(open.phone && blocked.has(open.phone))}
          note={notes[open.key] ?? null}
          tagSuggestions={allTags}
          onNoteSaved={(value) => {
            setSavedNotes((current) => ({ ...current, [open.key]: value }));
            // A tag filter or note search may now match differently.
            router.refresh();
          }}
          onClose={() => setOpenCustomer(null)}
        />
      )}
    </div>
  );
}

/** Tags and a note marker under the customer's name in the table. */
function RowNotes({ note }: { note: CustomerNote | undefined }) {
  const t = useTranslations("customers.notes");
  if (!note || (!note.note && note.tags.length === 0)) return null;
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {note.tags.map((name) => (
        <Badge key={name} variant="secondary" className="px-1.5 py-0 text-[11px] font-medium">
          {name}
        </Badge>
      ))}
      {note.note && (
        <span className="inline-flex items-center text-muted-foreground" title={note.note}>
          <StickyNote className="size-3.5" aria-hidden />
          <span className="sr-only">{t("hasNote")}</span>
        </span>
      )}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Users className="size-6" aria-hidden />
        </span>
        <p className="font-semibold">{title}</p>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

/** Green from 80 %, amber from 50 %, red below; "—" before any order ended. */
function SuccessRate({ customer }: { customer: StoreCustomer }) {
  const t = useTranslations("customers");
  if (customer.successRate == null) return <span className="text-muted-foreground">—</span>;
  const tone =
    customer.successRate >= 80
      ? "text-success"
      : customer.successRate >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";
  return (
    <span
      className={cn("font-medium tabular-nums", tone)}
      title={t("successTitle", { delivered: customer.deliveredCount, refused: customer.refusedCount })}
    >
      {customer.successRate}%
    </span>
  );
}

const OUTCOME_TONE: Record<CustomerOrderOutcome, string> = {
  delivered: "border-green-200 bg-green-100 text-green-800 dark:border-green-900/60 dark:bg-green-900/30 dark:text-green-300",
  refused: "border-red-200 bg-red-100 text-red-800 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "border-border bg-muted text-foreground",
  open: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-300",
};

function CustomerSheet({
  customer,
  storeId,
  blocked,
  note,
  tagSuggestions,
  onNoteSaved,
  onClose,
}: {
  customer: StoreCustomer;
  storeId: string;
  blocked: boolean;
  note: CustomerNote | null;
  tagSuggestions: string[];
  onNoteSaved: (value: CustomerNote) => void;
  onClose: () => void;
}) {
  const t = useTranslations("customers");
  const tErrors = useTranslations("blockedCustomers.errors");
  const locale = useLocale();
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrderItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [isBlocked, setIsBlocked] = useState(blocked);
  const [blocking, startBlocking] = useTransition();

  useEffect(() => {
    let live = true;
    loadCustomerOrders({ storeId, key: customer.key }).then((result) => {
      if (!live) return;
      if (result.success) setOrders(result.orders);
      else setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [storeId, customer.key]);

  const phone = customer.phone;
  const toggleBlock = () =>
    startBlocking(async () => {
      if (!phone) return;
      const result = isBlocked
        ? await unblockCustomerPhone(storeId, { phone })
        : await blockCustomerPhone(storeId, { phone, reason: t("blockReason") });
      if (!result.success) {
        toast.error(tErrors(result.error));
        return;
      }
      setIsBlocked(!isBlocked);
      toast.success(isBlocked ? t("unblockedToast") : t("blockedToast"));
      router.refresh();
    });

  return (
    <Sheet open onOpenChange={(value) => !value && onClose()}>
      <SheetContent side={locale.startsWith("ar") ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-base font-bold">{customer.name || t("noName")}</SheetTitle>
          <SheetDescription className="space-y-0.5 text-xs">
            {phone && (
              <span dir="ltr" className="block tabular-nums rtl:text-end">
                {phone}
              </span>
            )}
            {customer.email && <span className="block">{customer.email}</span>}
            {(customer.city || customer.governorate) && (
              <span className="block">{[customer.city, customer.governorate].filter(Boolean).join("، ")}</span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {isBlocked && <p className="text-xs font-medium text-destructive">{t("blockedNote")}</p>}

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <Stat label={t("columns.orders")} value={formatNumber(customer.orderCount, locale)} />
            <Stat label={t("columns.spent")} value={formatMoney(customer.totalSpent, locale)} />
            <Stat
              label={t("columns.success")}
              value={customer.successRate == null ? "—" : `${customer.successRate}%`}
            />
            <Stat label={t("firstOrder")} value={formatDate(customer.firstOrderAt, locale)} />
          </dl>
          <p className="text-xs text-muted-foreground">
            {t("breakdown", {
              delivered: customer.deliveredCount,
              refused: customer.refusedCount,
              cancelled: customer.cancelledCount,
            })}
          </p>

          {phone && (
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={customerWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden />
                  {t("whatsapp")}
                </a>
              </Button>
              <Button asChild size="sm" variant="neutral">
                <a href={`tel:${phone}`}>
                  <Phone aria-hidden />
                  {t("call")}
                </a>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={blocking}
                onClick={toggleBlock}
                className={isBlocked ? "text-muted-foreground" : "text-destructive hover:bg-destructive/10 hover:text-destructive"}
              >
                {blocking ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : isBlocked ? (
                  <ShieldCheck aria-hidden />
                ) : (
                  <Ban aria-hidden />
                )}
                {isBlocked ? t("unblock") : t("block")}
              </Button>
            </div>
          )}

          <NoteEditor
            storeId={storeId}
            customerKey={customer.key}
            note={note}
            tagSuggestions={tagSuggestions}
            onSaved={onNoteSaved}
          />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t("orderHistory")}</h3>
            {failed ? (
              <p className="text-sm text-destructive">{t("loadFailed")}</p>
            ) : orders == null ? (
              <div className="space-y-2" aria-busy>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders?order=${o.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">#{o.orderNumber}</span>
                        <span className="block text-xs text-muted-foreground">{formatDateTime(o.createdAt, locale)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-medium tabular-nums">{formatMoney(o.totalAmount, locale)}</span>
                        <Badge variant="outline" className={cn("font-medium", OUTCOME_TONE[o.outcome])}>
                          {t(`outcome.${o.outcome}`)}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The seller's note and tags for one customer (F-01c). Saved only on "Save". */
function NoteEditor({
  storeId,
  customerKey,
  note,
  tagSuggestions,
  onSaved,
}: {
  storeId: string;
  customerKey: string;
  note: CustomerNote | null;
  tagSuggestions: string[];
  onSaved: (value: CustomerNote) => void;
}) {
  const t = useTranslations("customers.notes");
  const [text, setText] = useState(note?.note ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [draft, setDraft] = useState("");
  const [saving, startSaving] = useTransition();

  // A tag still being typed is saved too.
  const pending = normalizeCustomerTags([...tags, draft]);
  const dirty = text.trim() !== (note?.note ?? "") || pending.join("\n") !== (note?.tags ?? []).join("\n");
  const full = tags.length >= CUSTOMER_TAGS_MAX;
  const suggestions = tagSuggestions.filter((s) => !tags.some((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 8);

  const addTag = (value: string) => {
    setTags((current) => normalizeCustomerTags([...current, value]));
    setDraft("");
  };

  const save = () =>
    startSaving(async () => {
      const result = await saveCustomerNote({ storeId, key: customerKey, note: text, tags: pending });
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setText(result.value.note ?? "");
      setTags(result.value.tags);
      setDraft("");
      onSaved(result.value);
      toast.success(t("saved"));
    });

  return (
    <section aria-labelledby="customer-notes-title" className="space-y-3 rounded-xl border p-3">
      <h3 id="customer-notes-title" className="text-sm font-semibold">
        {t("title")}
      </h3>

      <div className="space-y-1.5">
        <label htmlFor="customer-tag-input" className="text-xs text-muted-foreground">
          {t("tags")}
        </label>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((name) => (
              <li key={name}>
                <Badge variant="secondary" className="gap-1 pe-1">
                  {name}
                  <button
                    type="button"
                    onClick={() => setTags((current) => current.filter((x) => x !== name))}
                    className="rounded-full p-0.5 hover:bg-background"
                    aria-label={t("removeTag", { tag: name })}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <Input
          id="customer-tag-input"
          value={draft}
          disabled={full}
          maxLength={CUSTOMER_TAG_MAX_LENGTH}
          placeholder={full ? t("tagsFull", { max: CUSTOMER_TAGS_MAX }) : t("tagPlaceholder")}
          onChange={(e) => {
            const value = e.target.value;
            // A comma (Latin or Arabic) ends the tag, like Enter.
            if (/[,،]/.test(value)) addTag(value.replace(/[,،]/g, ""));
            else setDraft(value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              addTag(draft);
            }
          }}
          className="h-8 text-sm"
        />
        {!full && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="customer-note-input" className="text-xs text-muted-foreground">
          {t("note")}
        </label>
        <Textarea
          id="customer-note-input"
          value={text}
          maxLength={CUSTOMER_NOTE_MAX}
          rows={3}
          placeholder={t("notePlaceholder")}
          onChange={(e) => setText(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={!dirty || saving} onClick={save}>
          {saving && <LoaderCircle className="animate-spin" aria-hidden />}
          {t("save")}
        </Button>
      </div>
    </section>
  );
}
