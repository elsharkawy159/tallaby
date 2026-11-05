"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, LoaderCircle, MailCheck, MailX, Trash2, Undo2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { EmptyState, IconButton, SellerButton, SellerCard, StatusBadge } from "@/components/seller-ui";
import { ChipLink, MiniStats, SearchPill } from "../../orders/orders-ui";
import {
  SUBSCRIBER_EXPORT_COLUMNS,
  SUBSCRIBER_FILTERS,
  SUBSCRIBERS_ACTION_MAX,
  subscriberExportRow,
  type SubscriberFilter,
} from "@workspace/lib/store-forms/subscribers";
import type { SubscriberPage } from "@workspace/lib/store-forms/subscribers/server";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/i18n/format";
import { downloadXlsx, todayStamp } from "@/lib/product-excel";
import { deleteSubscribers, exportSubscribers, setSubscribersStatus, type SubscribersActionResult } from "./subscribers.server";

type Props = {
  stores: { id: string; name: string }[];
  storeId: string | null;
  status: SubscriberFilter;
  query: string;
  page: number;
  pageSize: number;
  result: SubscriberPage | null;
};

/** Marketing › Subscribers: store picker, status tabs, search, the table with bulk actions, paging and export. */
export function SubscribersView({ stores, storeId, status, query, page, pageSize, result }: Props) {
  const t = useTranslations("subscribers");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [exporting, startExporting] = useTransition();

  const href = (over: { store?: string; status?: SubscriberFilter; q?: string; page?: number }) => {
    const params = new URLSearchParams();
    const store = over.store ?? storeId;
    if (store) params.set("store", store);
    const s = over.status ?? status;
    if (s !== "subscribed") params.set("status", s);
    const q = over.q ?? query;
    if (q) params.set("q", q);
    const p = over.page ?? 1;
    if (p > 1) params.set("page", String(p));
    const text = params.toString();
    return text ? `${pathname}?${text}` : pathname;
  };

  if (!storeId || !result) {
    return <EmptyCard title={t("noStore.title")} body={t("noStore.body")} />;
  }

  const rows = result.rows;
  const pages = Math.max(1, Math.ceil(result.total / pageSize));
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < SUBSCRIBERS_ACTION_MAX) next.add(id);
      return next;
    });

  const done = (res: SubscribersActionResult, okMessage: string) => {
    if (res.success) {
      toast.success(okMessage);
      setSelected(new Set());
      router.refresh();
    } else {
      toast.error(t(`errors.${res.error}`));
    }
  };

  const run = (action: "unsubscribe" | "resubscribe" | "delete", ids: string[]) =>
    startTransition(async () => {
      if (!ids.length) return;
      if (action === "delete") {
        const res = await deleteSubscribers({ storeId, ids });
        done(res, t("toasts.deleted", { count: res.success ? res.count : 0 }));
      } else {
        const res = await setSubscribersStatus({
          storeId,
          ids,
          status: action === "unsubscribe" ? "unsubscribed" : "subscribed",
        });
        done(res, t(action === "unsubscribe" ? "toasts.unsubscribed" : "toasts.resubscribed", { count: res.success ? res.count : 0 }));
      }
    });

  const exportAll = () =>
    startExporting(async () => {
      const res = await exportSubscribers({ storeId, status, query });
      if (!res.success) {
        toast.error(t(`errors.${res.error}`));
        return;
      }
      const header = SUBSCRIBER_EXPORT_COLUMNS.map((column) => t(`export.columns.${column}`));
      const sheet = res.rows.map((s) => {
        const values = subscriberExportRow(s, t(`status.${s.status}`));
        return Object.fromEntries(SUBSCRIBER_EXPORT_COLUMNS.map((column, i) => [header[i], values[column]]));
      });
      try {
        await downloadXlsx(sheet, { fileName: `subscribers-${todayStamp()}.xlsx`, sheetName: t("export.sheet"), header });
      } catch {
        toast.error(t("export.failed"));
      }
    });

  const ids = [...selected];
  const selectedRows = rows.filter((r) => selected.has(r.id));

  return (
    <>
      {stores.length > 1 && (
        <nav aria-label={t("store")} className="flex flex-wrap gap-1.5">
          {stores.map((s) => (
            <ChipLink key={s.id} href={href({ store: s.id, q: "", status: "subscribed" })} active={storeId === s.id}>
              {s.name}
            </ChipLink>
          ))}
        </nav>
      )}

      <MiniStats
        className="min-[721px]:max-w-md"
        items={[
          { label: t("stats.subscribed"), value: formatNumber(result.counts.subscribed, locale) },
          { label: t("stats.unsubscribed"), value: formatNumber(result.counts.unsubscribed, locale) },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <form action={pathname} method="get" role="search" className="contents">
          <input type="hidden" name="store" value={storeId} />
          {status !== "subscribed" && <input type="hidden" name="status" value={status} />}
          <SearchPill name="q" defaultValue={query} maxLength={100} placeholder={t("search")} aria-label={t("search")} />
        </form>
        <nav aria-label={t("filters.label")} className="flex flex-wrap gap-1.5">
          {SUBSCRIBER_FILTERS.map((f) => (
            <ChipLink key={f} href={href({ status: f })} active={status === f}>
              {t(`filters.${f}`)}
            </ChipLink>
          ))}
        </nav>
        <SellerButton
          type="button"
          size="sm"
          variant="mini"
          className="ms-auto"
          disabled={result.total === 0 || exporting}
          onClick={exportAll}
        >
          {exporting ? <LoaderCircle className="animate-spin" aria-hidden /> : <Download aria-hidden />}
          {t("export.button", { count: result.total })}
        </SellerButton>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-(--s-line) bg-(--s-tint) p-2.5 text-[13px]">
          <span className="px-1 font-bold text-(--s-text)">{t("bulk.selected", { count: selected.size })}</span>
          {selectedRows.some((r) => r.status === "subscribed") && (
            <SellerButton type="button" size="xs" variant="mini" disabled={pending} onClick={() => run("unsubscribe", ids)}>
              <MailX aria-hidden />
              {t("actions.unsubscribe")}
            </SellerButton>
          )}
          {selectedRows.some((r) => r.status === "unsubscribed") && (
            <SellerButton type="button" size="xs" variant="mini" disabled={pending} onClick={() => run("resubscribe", ids)}>
              <Undo2 aria-hidden />
              {t("actions.resubscribe")}
            </SellerButton>
          )}
          <SellerButton type="button" size="xs" variant="danger" disabled={pending} onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden />
            {t("actions.delete")}
          </SellerButton>
          <SellerButton type="button" size="xs" variant="mini" disabled={pending} onClick={() => setSelected(new Set())}>
            {t("bulk.clear")}
          </SellerButton>
          {pending && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />}
        </div>
      )}

      {!result.hasSignUpForm ? (
        <EmptyCard title={t("noForm.title")} body={t("noForm.body")} />
      ) : rows.length === 0 ? (
        query || status !== "subscribed" ? (
          <EmptyCard title={t("noMatch.title")} body={t("noMatch.body")} />
        ) : (
          <EmptyCard title={t("empty.title")} body={t("empty.body")} />
        )
      ) : (
        <ul className="overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
          <li className="flex items-center gap-1 border-b border-(--s-line-soft) bg-(--s-surface-2) px-1.5 py-0.5 text-xs font-semibold text-(--s-subtle)">
            <label className="grid size-10 shrink-0 cursor-pointer place-items-center">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(value) =>
                  setSelected(value ? new Set(rows.slice(0, SUBSCRIBERS_ACTION_MAX).map((r) => r.id)) : new Set())
                }
                aria-label={t("bulk.selectAll")}
              />
            </label>
            {t("columns.subscriber")}
          </li>
          {rows.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 pe-3.5 ps-1.5 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)"
            >
              <label className="grid size-10 shrink-0 cursor-pointer place-items-center">
                <Checkbox
                  checked={selected.has(s.id)}
                  onCheckedChange={() => toggle(s.id)}
                  aria-label={t("bulk.select", { email: s.email ?? s.phone ?? "" })}
                />
              </label>
              <div className="min-w-0 flex-[1_1_180px]">
                <bdi dir="ltr" className="block truncate text-[13.5px] font-bold text-(--s-text) rtl:text-end">
                  {s.email ?? s.phone}
                </bdi>
                {(s.name || (s.email && s.phone)) && (
                  <span className="block truncate text-xs text-(--s-subtle)">
                    {[s.name, s.email ? s.phone : null].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-[1_1_140px] text-xs text-(--s-muted) max-[720px]:ps-[52px]">
                {s.formName}
                {s.signups > 1 && <span className="ms-1">({t("signups", { count: s.signups })})</span>}
                <time dateTime={s.lastAt} title={formatDateTime(s.lastAt, locale)} className="block text-(--s-subtle)">
                  {formatRelativeTime(s.lastAt, locale)}
                </time>
              </div>
              <div className="flex items-center gap-2 max-[720px]:w-full max-[720px]:justify-between max-[720px]:ps-[52px]">
                <StatusBadge tone={s.status === "subscribed" ? "success" : "muted"}>
                  {s.status === "subscribed" ? t("status.subscribed") : t("status.unsubscribed")}
                </StatusBadge>
                <SellerButton
                  type="button"
                  size="xs"
                  variant="mini"
                  disabled={pending}
                  onClick={() => run(s.status === "subscribed" ? "unsubscribe" : "resubscribe", [s.id])}
                >
                  {s.status === "subscribed" ? t("actions.unsubscribe") : t("actions.resubscribe")}
                </SellerButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label={t("paging.label")} className="flex items-center justify-center gap-2 text-[13px]">
          <PageLink href={page > 1 ? href({ page: page - 1 }) : null} label={t("paging.previous")}>
            <ChevronLeft className="rtl:rotate-180" aria-hidden />
          </PageLink>
          <span className="tabular-nums text-(--s-muted)">
            {t("paging.status", { page: formatNumber(page, locale), pages: formatNumber(pages, locale) })}
          </span>
          <PageLink href={page < pages ? href({ page: page + 1 }) : null} label={t("paging.next")}>
            <ChevronRight className="rtl:rotate-180" aria-hidden />
          </PageLink>
        </nav>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title", { count: selected.size })}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialog.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDelete(false);
                run("delete", ids);
              }}
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <IconButton disabled aria-label={label}>
        {children}
      </IconButton>
    );
  }
  return (
    <IconButton asChild aria-label={label}>
      <Link href={href} scroll={false}>
        {children}
      </Link>
    </IconButton>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <SellerCard>
      <EmptyState icon={MailCheck} title={title} description={body} />
    </SellerCard>
  );
}
