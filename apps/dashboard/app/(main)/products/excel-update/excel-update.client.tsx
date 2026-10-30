"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import { downloadXlsx, todayStamp } from "@/lib/product-excel";
import {
  EXCEL_UPDATE_MAX_BYTES,
  EXCEL_UPDATE_MAX_ROWS,
  type ExcelActionError,
  type ExcelPreviewLine,
  type ExcelPreviewResult,
} from "./excel-update.dto";
import { applyExcelUpdateAction, exportExcelUpdateSheetAction, previewExcelUpdateAction } from "./excel-update.server";

type Preview = Extract<ExcelPreviewResult, { success: true }>;

/**
 * Products › Import/Export › "Update from Excel" (ROADMAP.md F-24c): download
 * the update sheet, edit it, upload it, check the preview, apply.
 */
export function ExcelUpdateDialog({
  open,
  onOpenChange,
  productIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The products the list shows (filters applied): the sheet holds these. */
  productIds: string[];
}) {
  const t = useTranslations("excelUpdate");
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = (next: boolean) => {
    if (isPending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const showError = (error: ExcelActionError) => {
    toast.error(t(`errors.${error}`, { max: EXCEL_UPDATE_MAX_ROWS }));
  };

  const download = () => {
    startTransition(async () => {
      const result = await exportExcelUpdateSheetAction(productIds.slice(0, EXCEL_UPDATE_MAX_ROWS));
      if (!result.success) return showError(result.error);
      if (!result.rows.length) return void toast.error(t("nothingToExport"));
      try {
        await downloadXlsx(result.rows, {
          fileName: `tallaby-update-products-${todayStamp()}.xlsx`,
          header: result.header,
        });
        if (result.truncated) toast.warning(t("exportTruncated", { count: result.productCount, max: EXCEL_UPDATE_MAX_ROWS }));
        else toast.success(t("exported", { count: result.productCount }));
      } catch (error) {
        console.error(error);
        showError("generic");
      }
    });
  };

  const onFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > EXCEL_UPDATE_MAX_BYTES) {
      if (inputRef.current) inputRef.current.value = "";
      return showError("tooBig");
    }
    const form = new FormData();
    form.append("file", picked);
    startTransition(async () => {
      const result = await previewExcelUpdateAction(form);
      if (inputRef.current) inputRef.current.value = "";
      if (!result.success) return showError(result.error);
      setFile(picked);
      setPreview(result);
    });
  };

  const apply = () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    startTransition(async () => {
      const result = await applyExcelUpdateAction(form);
      if (!result.success) return showError(result.error);
      if (result.changedProducts === 0) toast.info(t("nothingChanged"));
      else toast.success(t("applied", { count: result.changedProducts }));
      if (result.skipped > 0) toast.warning(t("appliedSkipped", { count: result.skipped }));
      reset();
      onOpenChange(false);
      router.refresh();
    });
  };

  const value = (line: ExcelPreviewLine, side: "before" | "after") => {
    const v = line[side];
    if (v == null || v === "") return "—";
    if (line.field === "price" || line.field === "salePrice") return formatMoney(v, locale);
    if (line.field === "stock") return formatNumber(Number(v), locale);
    if (line.field === "status") return t(`statusValue.${v as "active" | "draft" | "rejected"}`);
    return String(v);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{preview ? t("previewDescription") : t("description")}</DialogDescription>
        </DialogHeader>

        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />

        {!preview ? (
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3 rounded-xl border p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">1</span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium">{t("step1")}</p>
                <p className="text-xs text-muted-foreground text-pretty">{t("step1Hint", { count: productIds.length })}</p>
                <Button type="button" variant="outline" size="sm" disabled={isPending || productIds.length === 0} onClick={download}>
                  <Download className="size-4" aria-hidden="true" />
                  {t("download")}
                </Button>
              </div>
            </li>
            <li className="flex gap-3 rounded-xl border p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">2</span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{t("step2")}</p>
                <ul className="list-disc space-y-1 ps-4 text-xs text-muted-foreground">
                  <li>{t("rulePrices")}</li>
                  <li>{t("ruleBlank")}</li>
                  <li>{t("ruleStatus")}</li>
                  <li>{t("ruleKeys")}</li>
                </ul>
              </div>
            </li>
            <li className="flex gap-3 rounded-xl border p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">3</span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium">{t("step3")}</p>
                <p className="text-xs text-muted-foreground">{t("step3Hint", { max: EXCEL_UPDATE_MAX_ROWS })}</p>
                <Button type="button" size="sm" disabled={isPending} onClick={() => inputRef.current?.click()}>
                  {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                  {t("upload")}
                </Button>
              </div>
            </li>
          </ol>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <FileSpreadsheet className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="max-w-60 truncate" dir="ltr">{file?.name}</span>
              </span>
              <span>{t("summaryChange", { count: preview.changeCount, products: preview.productCount })}</span>
              {preview.sameCount > 0 && <span className="text-muted-foreground">{t("summarySame", { count: preview.sameCount })}</span>}
              {preview.skipCount > 0 && <span className="text-destructive">{t("summarySkip", { count: preview.skipCount })}</span>}
            </div>

            {preview.rows.length === 0 ? (
              <p className="rounded-xl border px-3 py-8 text-center text-sm text-muted-foreground">{t("noChanges")}</p>
            ) : (
              <div className="max-h-[55vh] overflow-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted text-xs">
                    <tr>
                      <th className="p-2 text-start font-medium">{t("colRow")}</th>
                      <th className="p-2 text-start font-medium">{t("colProduct")}</th>
                      <th className="p-2 text-start font-medium">{t("colChange")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.row} className={cn("border-t align-top", row.outcome === "skip" && "bg-destructive/5")}>
                        <td className="p-2 tabular-nums text-muted-foreground">{formatNumber(row.row, locale)}</td>
                        <td className="p-2">
                          <p className="line-clamp-2 font-medium">{row.title || t("untitled")}</p>
                          {row.variant && <p className="text-xs text-muted-foreground">{row.variant}</p>}
                        </td>
                        <td className="p-2">
                          {row.outcome === "skip" ? (
                            <span className="text-destructive">{t(`skip.${row.reason ?? "notFound"}`)}</span>
                          ) : (
                            <ul className="space-y-0.5">
                              {row.lines.map((line) => (
                                <li key={line.field} className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-muted-foreground">{t(`field.${line.field}`)}:</span>
                                  <span className="text-muted-foreground line-through">{value(line, "before")}</span>
                                  <span aria-hidden="true" className="inline-block rtl:rotate-180">→</span>
                                  <span className="font-medium">{value(line, "after")}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {preview ? (
            <>
              <Button variant="outline" disabled={isPending} onClick={reset}>
                <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                {t("back")}
              </Button>
              <Button disabled={isPending || preview.changeCount === 0} onClick={apply}>
                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("apply", { count: preview.productCount })}
              </Button>
            </>
          ) : (
            <Button variant="outline" disabled={isPending} onClick={() => close(false)}>
              {t("cancel")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
