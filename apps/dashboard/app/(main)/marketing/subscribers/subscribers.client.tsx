"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, LoaderCircle, MailCheck, MailX, Search, Trash2, Undo2 } from "lucide-react";
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
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

const chip = (active: boolean) =>
  cn(
    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
  );

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
    <div className="space-y-4">
      {stores.length > 1 && (
        <nav aria-label={t("store")} className="flex flex-wrap gap-1.5">
          {stores.map((s) => (
            <Link key={s.id} href={href({ store: s.id, q: "", status: "subscribed" })} className={chip(storeId === s.id)} scroll={false}>
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Stat label={t("stats.subscribed")} value={formatNumber(result.counts.subscribed, locale)} />
        <Stat label={t("stats.unsubscribed")} value={formatNumber(result.counts.unsubscribed, locale)} />
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <form action={pathname} method="get" role="search" className="relative w-full sm:w-72">
          <input type="hidden" name="store" value={storeId} />
          {status !== "subscribed" && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            name="q"
            defaultValue={query}
            maxLength={100}
            placeholder={t("search")}
            aria-label={t("search")}
            className="ps-9"
          />
        </form>
        <nav aria-label={t("filters.label")} className="flex flex-wrap gap-1.5">
          {SUBSCRIBER_FILTERS.map((f) => (
            <Link key={f} href={href({ status: f })} className={chip(status === f)} aria-current={status === f ? "page" : undefined} scroll={false}>
              {t(`filters.${f}`)}
            </Link>
          ))}
        </nav>
        <Button
          type="button"
          size="sm"
          variant="neutral"
          className="ms-auto"
          disabled={result.total === 0 || exporting}
          onClick={exportAll}
        >
          {exporting ? <LoaderCircle className="animate-spin" aria-hidden /> : <Download aria-hidden />}
          {t("export.button", { count: result.total })}
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 p-2 text-sm">
          <span className="px-1 font-medium">{t("bulk.selected", { count: selected.size })}</span>
          {selectedRows.some((r) => r.status === "subscribed") && (
            <Button type="button" size="sm" variant="neutral" disabled={pending} onClick={() => run("unsubscribe", ids)}>
              <MailX aria-hidden />
              {t("actions.unsubscribe")}
            </Button>
          )}
          {selectedRows.some((r) => r.status === "unsubscribed") && (
            <Button type="button" size="sm" variant="neutral" disabled={pending} onClick={() => run("resubscribe", ids)}>
              <Undo2 aria-hidden />
              {t("actions.resubscribe")}
            </Button>
          )}
          <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden />
            {t("actions.delete")}
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setSelected(new Set())}>
            {t("bulk.clear")}
          </Button>
          {pending && <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />}
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
        <Card className="py-0">
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(value) =>
                          setSelected(value ? new Set(rows.slice(0, SUBSCRIBERS_ACTION_MAX).map((r) => r.id)) : new Set())
                        }
                        aria-label={t("bulk.selectAll")}
                      />
                    </TableHead>
                    <TableHead>{t("columns.subscriber")}</TableHead>
                    <TableHead>{t("columns.form")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.signedUp")}</TableHead>
                    <TableHead className="text-end">
                      <span className="sr-only">{t("columns.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id} data-state={selected.has(s.id) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(s.id)}
                          onCheckedChange={() => toggle(s.id)}
                          aria-label={t("bulk.select", { email: s.email ?? s.phone ?? "" })}
                        />
                      </TableCell>
                      <TableCell>
                        <span dir="ltr" className="block font-medium rtl:text-end">
                          {s.email ?? s.phone}
                        </span>
                        {(s.name || (s.email && s.phone)) && (
                          <span className="block text-xs text-muted-foreground">
                            {[s.name, s.email ? s.phone : null].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.formName}
                        {s.signups > 1 && <span className="ms-1 text-xs">({t("signups", { count: s.signups })})</span>}
                      </TableCell>
                      <TableCell>
                        {s.status === "subscribed" ? (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                            <MailCheck className="size-3" aria-hidden />
                            {t("status.subscribed")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <MailX className="size-3" aria-hidden />
                            {t("status.unsubscribed")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <time dateTime={s.lastAt} title={formatDateTime(s.lastAt, locale)}>
                          {formatRelativeTime(s.lastAt, locale)}
                        </time>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => run(s.status === "subscribed" ? "unsubscribe" : "resubscribe", [s.id])}
                        >
                          {s.status === "subscribed" ? t("actions.unsubscribe") : t("actions.resubscribe")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {pages > 1 && (
        <nav aria-label={t("paging.label")} className="flex items-center justify-center gap-2 text-sm">
          <PageLink href={page > 1 ? href({ page: page - 1 }) : null} label={t("paging.previous")}>
            <ChevronLeft className="rtl:rotate-180" aria-hidden />
          </PageLink>
          <span className="tabular-nums text-muted-foreground">
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
    </div>
  );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <Button type="button" size="sm" variant="neutral" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild size="sm" variant="neutral">
      <Link href={href} aria-label={label} scroll={false}>
        {children}
      </Link>
    </Button>
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
          <MailCheck className="size-6" aria-hidden />
        </span>
        <p className="font-semibold">{title}</p>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
