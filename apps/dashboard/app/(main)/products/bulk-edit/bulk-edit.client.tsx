"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Undo2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import {
  BULK_EDIT_MAX_PRODUCTS,
  bulkChangeSchema,
  type BulkChangeInput,
  type BulkPreviewLine,
  type BulkPreviewRow,
} from "./bulk-edit.dto";
import { applyBulkEditAction, previewBulkEditAction, undoBulkEditAction } from "./bulk-edit.server";

type Kind = BulkChangeInput["kind"];

export type BulkEditUndo = { token: string; expiresAt: number; count: number };

type FormState = {
  kind: Kind;
  priceMode: "percent" | "amount";
  direction: "increase" | "decrease";
  discountMode: "percent" | "amount" | "none";
  stockMode: "set" | "add" | "subtract";
  publish: "publish" | "unpublish";
  value: string;
  endsAt: string;
  roundWhole: boolean;
};

const initialForm: FormState = {
  kind: "price",
  priceMode: "percent",
  direction: "increase",
  discountMode: "percent",
  stockMode: "set",
  publish: "publish",
  value: "",
  endsAt: "",
  roundWhole: true,
};

/** The change the form describes, or null while it is incomplete. */
function toChange(form: FormState): BulkChangeInput | null {
  const value = Number(form.value);
  const hasValue = form.value.trim() !== "" && Number.isFinite(value);
  let change: BulkChangeInput;
  switch (form.kind) {
    case "price":
      if (!hasValue) return null;
      change = { kind: "price", mode: form.priceMode, direction: form.direction, value, roundWhole: form.roundWhole };
      break;
    case "discount":
      if (form.discountMode !== "none" && !hasValue) return null;
      change = {
        kind: "discount",
        mode: form.discountMode,
        value: form.discountMode === "none" ? 0 : value,
        // End of the chosen day, in the seller's time zone.
        endsAt: form.discountMode !== "none" && form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null,
        roundWhole: form.roundWhole,
      };
      break;
    case "stock":
      if (!hasValue) return null;
      change = { kind: "stock", mode: form.stockMode, value };
      break;
    default:
      change = { kind: "status", publish: form.publish === "publish" };
  }
  return bulkChangeSchema.safeParse(change).success ? change : null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly (readonly [T, string])[];
  label: string;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="w-full bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([key, text]) => (
            <SelectItem key={key} value={key}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function LineValue({ line, side }: { line: BulkPreviewLine; side: "before" | "after" }) {
  const t = useTranslations("products.bulkEdit");
  const locale = useLocale();
  const value = line[side];
  if (line.field === "price") {
    const list = side === "before" ? line.beforeList : line.afterList;
    return (
      <span className="inline-flex flex-wrap items-baseline gap-1 tabular-nums">
        <span>{formatMoney(value, locale)}</span>
        {list != null && <s className="text-xs text-faint">{formatMoney(list, locale)}</s>}
      </span>
    );
  }
  if (line.field === "status") return <span>{t(`statusValue.${String(value)}` as "statusValue.active")}</span>;
  return <span className="tabular-nums">{formatNumber(Number(value), locale)}</span>;
}

function PreviewTable({ rows }: { rows: BulkPreviewRow[] }) {
  const t = useTranslations("products.bulkEdit");
  const ordered = [...rows].sort((a, b) => order(a.outcome) - order(b.outcome));
  return (
    <div className="max-h-[50vh] overflow-auto rounded-lg border">
      <table className="w-full text-[13px]">
        <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-start font-medium">{t("previewProduct")}</th>
            <th className="px-3 py-2 text-start font-medium">{t("previewBefore")}</th>
            <th className="w-6 px-1 py-2" aria-hidden="true" />
            <th className="px-3 py-2 text-start font-medium">{t("previewAfter")}</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => {
            const title = row.title || t("untitled");
            if (row.outcome !== "change") {
              return (
                <tr key={row.id} className="border-t text-muted-foreground">
                  <td className="max-w-[220px] truncate px-3 py-2">{title}</td>
                  <td colSpan={3} className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        row.outcome === "skip" ? "bg-destructive-soft text-destructive" : "bg-muted"
                      )}
                    >
                      {row.outcome === "skip" ? t(`skip.${row.reason ?? "notFound"}`) : t("noChange")}
                    </span>
                  </td>
                </tr>
              );
            }
            return row.lines.map((line, i) => (
              <tr key={`${row.id}-${i}`} className={cn(i === 0 && "border-t")}>
                <td className="max-w-[220px] px-3 py-1.5 align-top">
                  {i === 0 && <div className="truncate font-medium">{title}</div>}
                  {line.label && <div className="truncate text-xs text-muted-foreground">{line.label}</div>}
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  <LineValue line={line} side="before" />
                </td>
                <td className="px-1 py-1.5 text-faint">
                  <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                </td>
                <td className="px-3 py-1.5 font-semibold">
                  <LineValue line={line} side="after" />
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

const order = (outcome: BulkPreviewRow["outcome"]) => (outcome === "change" ? 0 : outcome === "skip" ? 1 : 2);

/**
 * "Edit selected" on the products list (ROADMAP.md F-24b): choose a change,
 * see every product's before → after, apply, then Undo for 10 minutes.
 */
export function BulkEditDialog({
  open,
  onOpenChange,
  ids,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
  onApplied: (undo: BulkEditUndo | null) => void;
}) {
  const t = useTranslations("products.bulkEdit");
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(initialForm);
  const [preview, setPreview] = useState<{ rows: BulkPreviewRow[]; changeCount: number; skipCount: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) setPreview(null);
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
  };

  const change = toChange(form);
  const tooMany = ids.length > BULK_EDIT_MAX_PRODUCTS;

  const showError = (error: string): void => {
    toast.error(t(error === "readOnly" ? "errorReadOnly" : error === "invalidInput" ? "errorInvalid" : "errorGeneric"));
  };

  const runPreview = () => {
    if (!change || tooMany) return;
    startTransition(async () => {
      const res = await previewBulkEditAction({ ids, change });
      if (!res.success) {
        showError(res.error);
        return;
      }
      setPreview({ rows: res.rows, changeCount: res.changeCount, skipCount: res.skipCount });
    });
  };

  const apply = () => {
    if (!change || !preview) return;
    startTransition(async () => {
      const res = await applyBulkEditAction({ ids, change });
      if (!res.success) {
        showError(res.error);
        return;
      }
      if (res.changed === 0) toast.info(t("nothingChanged"));
      else toast.success(t("applied", { count: res.changed }));
      if (res.skipped > 0) toast.warning(t("appliedSkipped", { count: res.skipped }));
      onApplied(res.undoToken && res.undoExpiresAt ? { token: res.undoToken, expiresAt: res.undoExpiresAt, count: res.changed } : null);
      onOpenChange(false);
    });
  };

  const valueSuffix =
    form.kind === "stock"
      ? t("unitPieces")
      : (form.kind === "price" ? form.priceMode : form.discountMode) === "percent"
        ? "%"
        : t("unitPounds");

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title", { count: ids.length })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {tooMany ? (
          <p className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {t("tooMany", { max: formatNumber(BULK_EDIT_MAX_PRODUCTS, locale) })}
          </p>
        ) : preview ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              {t("previewSummary", { count: preview.changeCount })}
              {preview.skipCount > 0 && (
                <span className="text-destructive"> · {t("previewSkipped", { count: preview.skipCount })}</span>
              )}
            </p>
            <PreviewTable rows={preview.rows} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice
              label={t("whatToChange")}
              value={form.kind}
              onChange={(v) => set("kind", v)}
              options={[
                ["price", t("kind.price")],
                ["discount", t("kind.discount")],
                ["stock", t("kind.stock")],
                ["status", t("kind.status")],
              ]}
            />
            {form.kind === "price" && (
              <>
                <Choice
                  label={t("direction")}
                  value={form.direction}
                  onChange={(v) => set("direction", v)}
                  options={[
                    ["increase", t("increase")],
                    ["decrease", t("decrease")],
                  ]}
                />
                <Choice
                  label={t("by")}
                  value={form.priceMode}
                  onChange={(v) => set("priceMode", v)}
                  options={[
                    ["percent", t("byPercent")],
                    ["amount", t("byAmount")],
                  ]}
                />
              </>
            )}
            {form.kind === "discount" && (
              <Choice
                label={t("discountType")}
                value={form.discountMode}
                onChange={(v) => set("discountMode", v)}
                options={[
                  ["percent", t("discountPercent")],
                  ["amount", t("discountAmount")],
                  ["none", t("discountNone")],
                ]}
              />
            )}
            {form.kind === "stock" && (
              <Choice
                label={t("stockMode")}
                value={form.stockMode}
                onChange={(v) => set("stockMode", v)}
                options={[
                  ["set", t("stockSet")],
                  ["add", t("stockAdd")],
                  ["subtract", t("stockSubtract")],
                ]}
              />
            )}
            {form.kind === "status" && (
              <Choice
                label={t("kind.status")}
                value={form.publish}
                onChange={(v) => set("publish", v)}
                options={[
                  ["publish", t("publish")],
                  ["unpublish", t("unpublish")],
                ]}
              />
            )}
            {form.kind !== "status" && !(form.kind === "discount" && form.discountMode === "none") && (
              <Field label={t("value")}>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={form.kind === "stock" ? 1 : "any"}
                    dir="ltr"
                    value={form.value}
                    onChange={(e) => set("value", e.target.value)}
                    className="bg-card pe-14"
                  />
                  <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">
                    {valueSuffix}
                  </span>
                </div>
              </Field>
            )}
            {form.kind === "discount" && form.discountMode !== "none" && (
              <Field label={t("endsAt")}>
                <Input type="date" dir="ltr" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} className="bg-card" />
              </Field>
            )}
            {(form.kind === "price" || (form.kind === "discount" && form.discountMode !== "none")) && (
              <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
                <Checkbox checked={form.roundWhole} onCheckedChange={(v) => set("roundWhole", v === true)} />
                {t("roundWhole")}
              </label>
            )}
            <p className="text-xs text-muted-foreground sm:col-span-2">{t(`hint.${form.kind}`)}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {preview ? (
            <>
              <Button variant="outline" disabled={isPending} onClick={() => setPreview(null)}>
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                {t("back")}
              </Button>
              <Button disabled={isPending || preview.changeCount === 0} onClick={apply}>
                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("apply", { count: preview.changeCount })}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button disabled={isPending || !change || tooMany} onClick={runPreview}>
                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("preview")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Undo" bar shown for 10 minutes after a bulk edit. */
export function BulkEditUndoBar({ undo, onClear }: { undo: BulkEditUndo; onClear: () => void }) {
  const t = useTranslations("products.bulkEdit");
  const locale = useLocale();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(0, undo.expiresAt - now);
  useEffect(() => {
    if (left === 0) onClear();
  }, [left, onClear]);
  if (left === 0) return null;

  const minutes = Math.floor(left / 60000);
  const seconds = Math.floor((left % 60000) / 1000);

  const runUndo = () =>
    startTransition(async () => {
      const res = await undoBulkEditAction(undo.token);
      if (!res.success) {
        toast.error(t(res.error === "expired" ? "undoExpired" : "errorGeneric"));
      } else {
        if (res.restored > 0) toast.success(t("undone", { count: res.restored }));
        if (res.conflicts > 0) toast.warning(t("undoConflicts", { count: res.conflicts }));
      }
      onClear();
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border bg-card py-2 ps-3.5 pe-2 text-[13px]">
      <span>{t("undoBar", { count: undo.count })}</span>
      <span className="text-muted-foreground tabular-nums" dir="ltr">
        {formatNumber(minutes, locale)}:{formatNumber(seconds, locale, { minimumIntegerDigits: 2 })}
      </span>
      <span className="flex-1" />
      <Button size="sm" variant="outline" disabled={isPending} onClick={runUndo} className="h-8">
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Undo2 className="size-4" aria-hidden="true" />}
        {t("undo")}
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={onClear} className="h-8">
        {t("dismiss")}
      </Button>
    </div>
  );
}
