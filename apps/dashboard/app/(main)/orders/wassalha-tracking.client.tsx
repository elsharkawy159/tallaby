"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, LoaderCircle, Mailbox, Pencil, Upload } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { extractTrackingRows, type TrackingFileError } from "@workspace/lib/shipping/wassalha-tracking";
import { cn } from "@/lib/utils";
import type { SellerOrderRow } from "./orders.types";
import { readSpreadsheetRows, WASSALHA_TRACKING_MAX_BYTES } from "./wassalha-tracking-file.lib";
import { saveWassalhaTrackingNumber, uploadWassalhaTracking, type WassalhaTrackingProblem } from "./wassalha-tracking.server";

type UploadResult = { saved: number; unchanged: number; problems: WassalhaTrackingProblem[] };

/**
 * Orders toolbar: upload Wassalha's result file (F-12e). The file is read here,
 * and what came back is shown in full, so the seller can see every row that
 * wasn't saved and why.
 */
export function WassalhaTrackingUpload({ storeId, className }: { storeId: string; className?: string }) {
  const t = useTranslations("orders.wassalha.tracking");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [fileError, setFileError] = useState<TrackingFileError | "too_big" | "unreadable" | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setFileError(null);
    setResult(null);
    if (file.size > WASSALHA_TRACKING_MAX_BYTES) {
      setFileError("too_big");
      return;
    }
    startTransition(async () => {
      let rows: unknown[][];
      try {
        rows = await readSpreadsheetRows(file);
      } catch {
        setFileError("unreadable");
        return;
      }
      const extracted = extractTrackingRows(rows);
      if (!extracted.ok) {
        setFileError(extracted.error);
        return;
      }
      const response = await uploadWassalhaTracking(storeId, extracted.entries);
      if (!response.success) {
        toast.error(t(`errors.${response.error}`));
        return;
      }
      setResult(response.data);
      if (response.data.saved > 0) router.refresh();
    });
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setFileError(null);
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn("gap-1.5", className)}>
          <Upload className="size-4" aria-hidden />
          {t("uploadButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("uploadTitle")}</DialogTitle>
          <DialogDescription>{t("uploadDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <input
            ref={input}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            aria-label={t("chooseFile")}
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outline" className="w-full gap-2" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
            {pending ? t("reading") : t("chooseFile")}
          </Button>

          {fileError && (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-destructive">
              {t(`fileErrors.${fileError}`)}
            </p>
          )}

          {result && (
            <div className="space-y-3" role="status">
              <p className="font-medium">
                {t("savedCount", { count: result.saved })}
                {result.unchanged > 0 && <span className="font-normal text-muted-foreground"> · {t("unchangedCount", { count: result.unchanged })}</span>}
              </p>
              {result.problems.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-destructive">{t("problemsCount", { count: result.problems.length })}</p>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.row")}</th>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.order")}</th>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.tracking")}</th>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.reason")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.problems.map((problem) => (
                          <tr key={`${problem.row}-${problem.orderNumber}-${problem.trackingNumber}`}>
                            <td className="p-2 tabular-nums">{problem.row}</td>
                            <td className="p-2 font-mono" dir="ltr">{problem.orderNumber || "-"}</td>
                            <td className="p-2 font-mono" dir="ltr">{problem.trackingNumber || "-"}</td>
                            <td className="p-2">{t(`reasons.${problem.reason}`)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The order panel's Wassalha card (F-12e): the number with copy, and a field to
 * paste or correct it. No tracking link: the code has no verified Egypt Post
 * tracking address, so none is made up.
 */
export function WassalhaTrackingCard({ order }: { order: SellerOrderRow }) {
  const t = useTranslations("orders.wassalha.tracking");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!order.wassalhaExported || !order.storeId) return null;
  const storeId = order.storeId;
  const number = order.wassalhaTracking;

  const copy = async () => {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the number is on screen to copy by hand.
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const response = await saveWassalhaTrackingNumber(storeId, order.orderNumber, value);
      if (!response.success) {
        toast.error(t(`errors.${response.error}`));
        return;
      }
      const problem = response.data.problems[0];
      if (problem) {
        toast.error(t(`reasons.${problem.reason}`));
        return;
      }
      toast.success(t("saved"));
      setEditing(false);
      setValue("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-muted">
          <Mailbox className="size-4" aria-hidden />
        </span>
        <p className="font-semibold">{t("cardTitle")}</p>
      </div>
      {number && !editing && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">{t("number")}</span>
          <span className="font-mono font-medium" dir="ltr">
            {number}
          </span>
          <Button type="button" size="icon" variant="ghost" className="size-7" onClick={copy} aria-label={t("copy")}>
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label={t("edit")}
            onClick={() => {
              setValue(number);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" aria-hidden />
          </Button>
        </div>
      )}
      {(!number || editing) && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("number")}
            dir="ltr"
            maxLength={60}
            className="h-9 min-w-40 flex-1 font-mono"
          />
          <Button type="submit" size="sm" className="h-9" disabled={pending || !value.trim()}>
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {t("save")}
          </Button>
          {editing && (
            <Button type="button" size="sm" variant="ghost" className="h-9" disabled={pending} onClick={() => setEditing(false)}>
              {t("cancel")}
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
