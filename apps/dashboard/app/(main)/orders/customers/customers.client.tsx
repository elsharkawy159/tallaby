"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Ban, Download, LoaderCircle, MessageCircle, Phone, ShieldCheck, StickyNote, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@workspace/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { buildWhatsAppUrl } from "@workspace/ui/lib/contact";
import {
  Chip,
  Chips,
  EmptyState,
  Field,
  ResponsiveTable,
  SellerButton,
  SellerCard,
  StatusBadge,
  Tag,
  TextArea,
  TextInput,
  type BadgeTone,
} from "@/components/seller-ui";
import { cn } from "@/lib/utils";
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
import { formatDate, formatDateTime, formatNumber, formatRelativeTime, moneyParams, type MoneyUnit } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { downloadXlsx, todayStamp } from "@/lib/product-excel";
import { blockCustomerPhone, unblockCustomerPhone } from "../../stores/[storeId]/settings/protection/protection.server";
import { ListPager } from "../list-pager.client";
import { ChipLink, DIALOG_CLOSE_40, MiniStats, PanelSection, PhoneText, PILL_SELECT, SearchPill } from "../orders-ui";
import { exportFilteredCustomers, loadCustomerOrders, saveCustomerNote, type CustomerOrderItem } from "./customers.server";
import { AudienceExportButton } from "./audience-export.client";

type Props = {
  /** The store's currency: every amount on this page is in it. */
  money?: MoneyUnit;
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

/** Orders › Customers: store picker, search, filters, the table and the customer drawer. */
export function CustomersView({
  money,
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
  const [lastPushedQuery, setLastPushedQuery] = useState(filters.q);
  const [seenQuery, setSeenQuery] = useState(filters.q);
  if (filters.q !== seenQuery) {
    setSeenQuery(filters.q);
    if (filters.q !== lastPushedQuery) {
      setLastPushedQuery(filters.q);
      setQuery(filters.q);
    }
  }
  useEffect(() => {
    const next = query.trim();
    if (next === lastPushedQuery) return;
    const timer = setTimeout(() => {
      setLastPushedQuery(next);
      navigate({ q: next, page: 1 }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, lastPushedQuery, navigate]);

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
        const header = CUSTOMER_EXPORT_COLUMNS.map((column) => t(`export.columns.${column}`, moneyParams(locale, money)));
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
    <>
      {stores.length > 1 && (
        <nav aria-label={t("filters.store")} className="flex flex-wrap gap-1.5">
          {stores.map((s) => (
            <ChipLink key={s.id} href={`${pathname}?store=${s.id}`} active={storeId === s.id}>
              {s.name}
            </ChipLink>
          ))}
        </nav>
      )}

      <MiniStats
        items={[
          { label: t("stats.customers"), value: formatNumber(stats.customers, locale) },
          { label: t("stats.repeat"), value: formatNumber(stats.repeat, locale) },
          { label: t("stats.refused"), value: formatNumber(stats.refused, locale) },
        ]}
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SearchPill value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")} />
          <Select value={filters.sort} onValueChange={(value) => navigate({ sort: value as CustomerSort, page: 1 })}>
            <SelectTrigger className={PILL_SELECT} aria-label={t("sort.label")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMER_SORTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`sort.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ms-auto flex flex-wrap items-center gap-2 max-[720px]:ms-0 max-[720px]:w-full max-[720px]:[&>*]:flex-1">
            <SellerButton variant="outline" size="sm" disabled={matched === 0 || exporting} onClick={exportRows}>
              {exporting ? <LoaderCircle className="animate-spin" aria-hidden /> : <Download aria-hidden />}
              {t("export.button", { count: matched })}
            </SellerButton>
            <AudienceExportButton storeId={storeId} />
          </div>
        </div>
        <Chips role="group" aria-label={t("filters.label")}>
          {CUSTOMER_FILTERS.map((f) => (
            <Chip key={f} pressed={filters.filter === f} onClick={() => navigate({ filter: f, page: 1 })}>
              {t(`filters.${f}`)}
            </Chip>
          ))}
        </Chips>
        {allTags.length > 0 && (
          <Chips role="group" aria-label={t("notes.tagFilter")}>
            {allTags.map((name) => {
              const active = filters.tag.toLowerCase() === name.toLowerCase();
              return (
                <Chip key={name} pressed={active} onClick={() => navigate({ tag: active ? "" : name, page: 1 })}>
                  #{name}
                </Chip>
              );
            })}
          </Chips>
        )}
      </div>

      {stats.customers === 0 ? (
        <EmptyCard title={t("empty.title")} body={t("empty.body")} />
      ) : customers.length === 0 ? (
        <EmptyCard title={t("noMatch.title")} body={t("noMatch.body")} />
      ) : (
        <SellerCard className="overflow-hidden">
          <ResponsiveTable
            label={t("title")}
            rows={customers}
            rowKey={(c) => c.key}
            columns={[
              {
                key: "customer",
                header: t("columns.customer"),
                phone: "title",
                cell: (c) => (
                  <div className="min-w-0">
                    {/* The stretched button makes the whole row open the customer. */}
                    <button
                      type="button"
                      className="flex cursor-pointer flex-wrap items-center gap-1.5 text-start text-[13.5px] font-bold text-(--s-text) after:absolute after:inset-0"
                      onClick={() => setOpenCustomer(c)}
                    >
                      <span className="min-w-0 break-words">{c.name || t("noName")}</span>
                      {c.phone && blocked.has(c.phone) && <Tag tone="danger">{t("blocked")}</Tag>}
                    </button>
                    {c.phone && (
                      <p className="text-xs font-normal text-(--s-subtle)">
                        <PhoneText phone={c.phone} />
                      </p>
                    )}
                    <RowNotes note={notes[c.key]} />
                  </div>
                ),
              },
              {
                key: "spent",
                header: t("columns.spent"),
                phone: "end",
                cell: (c) => (
                  <span className="font-montserrat font-bold text-(--s-ink) tabular-nums">
                    <Money value={c.totalSpent} locale={locale} unit={money} />
                  </span>
                ),
              },
              {
                key: "place",
                header: t("columns.place"),
                phone: "sub",
                cell: (c) => <span className="break-words text-xs text-(--s-subtle)">{[c.city, c.governorate].filter(Boolean).join("، ") || "—"}</span>,
              },
              { key: "success", header: t("columns.success"), phone: "endSub", cell: (c) => <SuccessRate customer={c} /> },
              {
                key: "orders",
                header: t("columns.orders"),
                cell: (c) => <span className="font-montserrat font-semibold tabular-nums">{formatNumber(c.orderCount, locale)}</span>,
              },
              {
                key: "lastOrder",
                header: t("columns.lastOrder"),
                cell: (c) => (
                  <time dateTime={c.lastOrderAt} title={formatDateTime(c.lastOrderAt, locale)} className="text-xs text-(--s-subtle)" suppressHydrationWarning>
                    {formatRelativeTime(c.lastOrderAt, locale)}
                  </time>
                ),
              },
            ]}
          />
        </SellerCard>
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
          money={money}
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
    </>
  );
}

/** Tags and a note marker under the customer's name in the table. */
function RowNotes({ note }: { note: CustomerNote | undefined }) {
  const t = useTranslations("customers.notes");
  if (!note || (!note.note && note.tags.length === 0)) return null;
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1 font-normal">
      {note.tags.map((name) => (
        <Tag key={name} tone="info">
          {name}
        </Tag>
      ))}
      {note.note && (
        <span className="inline-flex items-center text-(--s-subtle)" title={note.note}>
          <StickyNote className="size-3.5" aria-hidden />
          <span className="sr-only">{t("hasNote")}</span>
        </span>
      )}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-(--s-line) p-3">
      <dt className="text-xs text-(--s-subtle)">{label}</dt>
      <dd className="mt-0.5 break-words font-montserrat text-[15px] font-bold text-(--s-ink) tabular-nums">{value}</dd>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <SellerCard>
      <EmptyState icon={Users} title={title} description={body} />
    </SellerCard>
  );
}

/** Green from 80 %, amber from 50 %, red below; "—" before any order ended. */
function SuccessRate({ customer }: { customer: StoreCustomer }) {
  const t = useTranslations("customers");
  if (customer.successRate == null) return <span className="text-(--s-subtle)">—</span>;
  const tone: BadgeTone = customer.successRate >= 80 ? "success" : customer.successRate >= 50 ? "warning" : "danger";
  return (
    <span title={t("successTitle", { delivered: customer.deliveredCount, refused: customer.refusedCount })}>
      <Tag tone={tone} className="font-montserrat tabular-nums">
        {customer.successRate}%
      </Tag>
    </span>
  );
}

const OUTCOME_TONE: Record<CustomerOrderOutcome, BadgeTone> = {
  delivered: "success",
  refused: "danger",
  cancelled: "muted",
  open: "info",
};

function CustomerSheet({
  money,
  customer,
  storeId,
  blocked,
  note,
  tagSuggestions,
  onNoteSaved,
  onClose,
}: {
  money?: MoneyUnit;
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
  const tCommon = useTranslations("common");
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
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        closeLabel={tCommon("close")}
        style={{ maxWidth: 520, padding: 0 }}
        className={cn("flex max-h-[90dvh] flex-col gap-0 overflow-hidden", DIALOG_CLOSE_40)}
      >
        <header className="shrink-0 border-b border-(--s-line-soft) px-6 py-4 pe-14 max-[720px]:px-[18px] max-[720px]:pe-12">
          <DialogTitle className="break-words text-lg font-bold leading-normal text-(--s-ink)">{customer.name || t("noName")}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-col gap-0.5 text-[13px] text-(--s-muted)">
              {phone && (
                <span>
                  <PhoneText phone={phone} />
                </span>
              )}
              {customer.email && <span className="break-all">{customer.email}</span>}
              {(customer.city || customer.governorate) && <span className="break-words">{[customer.city, customer.governorate].filter(Boolean).join("، ")}</span>}
            </div>
          </DialogDescription>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 pb-[calc(20px+env(safe-area-inset-bottom))] max-[720px]:px-[18px]">
          {isBlocked && <p className="text-xs font-semibold text-destructive">{t("blockedNote")}</p>}

          <dl className="grid grid-cols-2 gap-2">
            <Stat label={t("columns.orders")} value={formatNumber(customer.orderCount, locale)} />
            <Stat label={t("columns.spent")} value={<Money value={customer.totalSpent} locale={locale} unit={money} />} />
            <Stat label={t("columns.success")} value={customer.successRate == null ? "—" : `${customer.successRate}%`} />
            <Stat label={t("firstOrder")} value={formatDate(customer.firstOrderAt, locale)} />
          </dl>
          <p className="text-xs text-(--s-subtle)">
            {t("breakdown", {
              delivered: customer.deliveredCount,
              refused: customer.refusedCount,
              cancelled: customer.cancelledCount,
            })}
          </p>

          {phone && (
            <div className="flex flex-wrap gap-2">
              <SellerButton asChild variant="whatsapp" size="sm" className="flex-1">
                <a href={buildWhatsAppUrl(phone) ?? customerWhatsAppUrl(phone)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden />
                  {t("whatsapp")}
                </a>
              </SellerButton>
              <SellerButton asChild variant="outline" size="sm" className="flex-1">
                <a href={`tel:${phone}`}>
                  <Phone aria-hidden />
                  {t("call")}
                </a>
              </SellerButton>
              <SellerButton
                variant="mini"
                size="sm"
                className={cn("flex-1", !isBlocked && "border-destructive/40 text-destructive [&_svg]:text-destructive")}
                disabled={blocking}
                onClick={toggleBlock}
              >
                {blocking ? <LoaderCircle className="animate-spin" aria-hidden /> : isBlocked ? <ShieldCheck aria-hidden /> : <Ban aria-hidden />}
                {isBlocked ? t("unblock") : t("block")}
              </SellerButton>
            </div>
          )}

          <NoteEditor
            storeId={storeId}
            customerKey={customer.key}
            note={note}
            tagSuggestions={tagSuggestions}
            onSaved={onNoteSaved}
          />

          <PanelSection title={t("orderHistory")}>
            {failed ? (
              <p className="text-[13px] text-destructive">{t("loadFailed")}</p>
            ) : orders == null ? (
              <div className="flex flex-col gap-2" aria-busy>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-(--s-fill)" />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders?order=${o.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-(--s-line) p-3 no-underline transition-colors duration-150 hover:bg-(--s-tint)"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-montserrat text-[13px] font-bold text-(--s-ink)"><bdi dir="ltr">#{o.orderNumber}</bdi></span>
                        <span className="block text-xs text-(--s-subtle)">{formatDateTime(o.createdAt, locale)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="font-montserrat text-[13px] font-bold text-(--s-ink) tabular-nums">
                          <Money value={o.totalAmount} locale={locale} unit={money} />
                        </span>
                        <StatusBadge tone={OUTCOME_TONE[o.outcome]}>{t(`outcome.${o.outcome}`)}</StatusBadge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelSection>
        </div>
      </DialogContent>
    </Dialog>
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
    <section aria-labelledby="customer-notes-title" className="flex flex-col gap-3 rounded-[20px] border border-(--s-line) p-3.5">
      <h3 id="customer-notes-title" className="text-[13.5px] font-bold text-(--s-ink)">
        {t("title")}
      </h3>

      <Field label={t("tags")} htmlFor="customer-tag-input">
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {tags.map((name) => (
              <li key={name} className="inline-flex h-8 items-center gap-0.5 rounded-full bg-primary-soft ps-3 text-xs font-bold text-primary-ink max-[600px]:h-10">
                {name}
                <button
                  type="button"
                  onClick={() => setTags((current) => current.filter((x) => x !== name))}
                  className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-(--s-hover) max-[600px]:size-10"
                  aria-label={t("removeTag", { tag: name })}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <TextInput
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
        />
        {!full && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="inline-flex h-8 cursor-pointer items-center rounded-full border border-(--s-field) px-3 text-xs font-semibold text-(--s-muted) hover:bg-(--s-hover) max-[600px]:h-10"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </Field>

      <Field label={t("note")} htmlFor="customer-note-input">
        <TextArea
          id="customer-note-input"
          value={text}
          maxLength={CUSTOMER_NOTE_MAX}
          rows={3}
          placeholder={t("notePlaceholder")}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>

      <div className="flex justify-end">
        <SellerButton variant="solid" size="sm" disabled={!dirty || saving} onClick={save}>
          {saving && <LoaderCircle className="animate-spin" aria-hidden />}
          {t("save")}
        </SellerButton>
      </div>
    </section>
  );
}
