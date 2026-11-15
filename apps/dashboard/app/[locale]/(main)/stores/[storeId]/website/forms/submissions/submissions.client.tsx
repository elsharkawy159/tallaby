"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Archive, ChevronDown, Download, Inbox, LoaderCircle, MailOpen, Mail, Trash2 } from "lucide-react";

import type { StoreFormSubmission } from "@workspace/lib/store-forms/server";
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
import { EmptyState, NativeSelect, SectionCard, SellerButton, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { deleteSubmissions, exportSubmissions, updateSubmissionsStatus } from "../forms.server";
import { INBOX_STATUSES, type InboxFilter, type InboxStatus } from "../forms.dto";

type InboxForm = { id: string; name: string; fields: { key: string; label: string }[] };

const formatDateTime = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-EG" : "ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export function SubmissionsInbox({
  storeId,
  forms,
  filter,
  rows,
  total,
  page,
  pageSize,
}: {
  storeId: string;
  forms: InboxForm[];
  filter: InboxFilter;
  rows: StoreFormSubmission[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const t = useTranslations("storeForms");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const formsById = new Map(forms.map((f) => [f.id, f]));

  const navigate = (next: Partial<InboxFilter> & { page?: number }) => {
    const params = new URLSearchParams();
    const formId = next.formId !== undefined ? next.formId : filter.formId;
    const status = next.status ?? filter.status;
    if (formId) params.set("form", formId);
    if (status !== "all") params.set("status", status);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    setSelected([]);
    router.push(`${params.size ? `${pathname}?${params}` : pathname}#submissions`, { scroll: false });
  };

  const setStatus = (ids: string[], status: InboxStatus, quiet = false) =>
    startTransition(async () => {
      const result = await updateSubmissionsStatus(storeId, ids, status);
      if (result.success) {
        if (!quiet) toast.success(t("inbox.updated", { count: result.data.updated }));
        setSelected([]);
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  const onDelete = () =>
    startTransition(async () => {
      const result = await deleteSubmissions(storeId, selected);
      if (result.success) {
        toast.success(t("inbox.deleted", { count: result.data.deleted }));
        setSelected([]);
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
      setConfirmDelete(false);
    });

  const onExport = () =>
    startTransition(async () => {
      const result = await exportSubmissions(storeId, filter);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      const url = URL.createObjectURL(new Blob([result.data.csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `form-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });

  const toggleOpen = (row: StoreFormSubmission) => {
    setOpen((current) => (current === row.id ? null : row.id));
    if (row.status === "new") setStatus([row.id], "read", true);
  };

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  return (
    <>
      <SectionCard
        id="form-inbox"
        icon={Inbox}
        title={t("inbox.title")}
        description={t("inbox.description")}
        action={
          <SellerButton variant="mini" size="sm" disabled={isPending || total === 0} onClick={onExport}>
            {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {t("inbox.export")}
          </SellerButton>
        }
      >
        <div className="grid grid-cols-2 gap-2 max-[600px]:grid-cols-1">
          <NativeSelect
            aria-label={t("inbox.filterForm")}
            value={filter.formId ?? ""}
            onChange={(e) => navigate({ formId: e.target.value || null, page: 1 })}
          >
            <option value="">{t("inbox.allForms")}</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label={t("inbox.filterStatus")}
            value={filter.status}
            onChange={(e) => navigate({ status: e.target.value as InboxFilter["status"], page: 1 })}
          >
            <option value="all">{t("inbox.allStatuses")}</option>
            {INBOX_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`submissionStatus.${status}`)}
              </option>
            ))}
          </NativeSelect>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-(--s-tint) px-3 py-2">
            <span className="text-[13px] font-semibold text-(--s-text)">{t("inbox.selected", { count: selected.length })}</span>
            <div className="ms-auto flex flex-wrap gap-1.5">
              <SellerButton variant="mini" size="xs" disabled={isPending} onClick={() => setStatus(selected, "read")}>
                <MailOpen aria-hidden />
                {t("inbox.markRead")}
              </SellerButton>
              <SellerButton variant="mini" size="xs" disabled={isPending} onClick={() => setStatus(selected, "new")}>
                <Mail aria-hidden />
                {t("inbox.markNew")}
              </SellerButton>
              <SellerButton variant="mini" size="xs" disabled={isPending} onClick={() => setStatus(selected, "archived")}>
                <Archive aria-hidden />
                {t("inbox.archive")}
              </SellerButton>
              <SellerButton variant="mini" size="xs" className="text-destructive [&_svg]:text-destructive" disabled={isPending} onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden />
                {t("inbox.delete")}
              </SellerButton>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-[20px] border border-(--s-line) bg-(--s-surface)">
            <EmptyState icon={Inbox} title={forms.length === 0 ? t("inbox.noForms") : t("inbox.empty")} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
            <div className="flex items-center gap-3 border-b border-(--s-line-soft) bg-(--s-surface-2) px-3.5 py-2.5 text-xs text-(--s-subtle)">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(v) => setSelected(v === true ? rows.map((r) => r.id) : [])}
                aria-label={t("inbox.selectAll")}
              />
              <span>{t("inbox.count", { count: total })}</span>
            </div>
            <ul className="flex flex-col">
              {rows.map((row) => {
                const form = formsById.get(row.formId);
                const isOpen = open === row.id;
                return (
                  <li key={row.id} className={cn("[&+&]:border-t [&+&]:border-(--s-line-soft)", row.status === "new" && "bg-(--s-tint)")}>
                    <div className="flex items-start gap-3 px-3.5 py-3 max-[600px]:flex-wrap">
                      <Checkbox
                        className="mt-1"
                        checked={selected.includes(row.id)}
                        onCheckedChange={(v) => setSelected((s) => (v === true ? [...s, row.id] : s.filter((x) => x !== row.id)))}
                        aria-label={t("inbox.select")}
                      />
                      <button type="button" className="min-w-0 flex-1 cursor-pointer text-start max-[600px]:min-h-10" onClick={() => toggleOpen(row)} aria-expanded={isOpen}>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={cn("truncate text-sm text-(--s-text)", row.status === "new" ? "font-bold" : "font-semibold")}>
                            {row.name || row.email || row.phone || t("inbox.anonymous")}
                          </span>
                          {row.status !== "read" && <Tag tone={row.status === "new" ? "warning" : "muted"}>{t(`submissionStatus.${row.status}`)}</Tag>}
                          <span className="text-xs text-(--s-subtle)">{row.formName}</span>
                        </span>
                        {row.message && <span className="mt-0.5 line-clamp-1 block text-xs text-(--s-subtle)">{row.message}</span>}
                      </button>
                      <span className="shrink-0 text-xs text-(--s-subtle) tabular-nums max-[600px]:order-last max-[600px]:basis-full max-[600px]:ps-8">{formatDateTime(row.createdAt, locale)}</span>
                      <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-(--s-subtle) transition-transform", isOpen && "rotate-180")} aria-hidden />
                    </div>
                    {isOpen && (
                      <dl className="grid gap-x-4 gap-y-2 border-t border-(--s-line-soft) bg-(--s-surface-2) px-3.5 py-3 text-[13px] text-(--s-text) min-[601px]:grid-cols-[minmax(0,10rem)_1fr] min-[601px]:ps-10">
                        {Object.entries(row.data).map(([key, value]) => (
                          <div key={key} className="contents">
                            <dt className="text-xs text-(--s-subtle)">{form?.fields.find((f) => f.key === key)?.label ?? key}</dt>
                            <dd className="whitespace-pre-wrap [overflow-wrap:anywhere]">{value === "yes" ? t("inbox.yes") : value}</dd>
                          </div>
                        ))}
                        {row.sourceUrl && (
                          <div className="contents">
                            <dt className="text-xs text-(--s-subtle)">{t("inbox.source")}</dt>
                            <dd dir="ltr" className="text-start text-xs text-(--s-subtle) [overflow-wrap:anywhere] rtl:text-end">
                              {row.sourceUrl}
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-2">
            <SellerButton variant="mini" size="xs" disabled={page <= 1} onClick={() => navigate({ page: page - 1 })}>
              {t("inbox.previous")}
            </SellerButton>
            <span className="text-xs text-(--s-subtle)">{t("inbox.page", { page, pages })}</span>
            <SellerButton variant="mini" size="xs" disabled={page >= pages} onClick={() => navigate({ page: page + 1 })}>
              {t("inbox.next")}
            </SellerButton>
          </div>
        )}
        <p className="text-pretty text-xs text-(--s-faint)">{t("inbox.retention")}</p>
      </SectionCard>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("inbox.deleteTitle", { count: selected.length })}</AlertDialogTitle>
            <AlertDialogDescription>{t("inbox.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
            >
              {t("inbox.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
