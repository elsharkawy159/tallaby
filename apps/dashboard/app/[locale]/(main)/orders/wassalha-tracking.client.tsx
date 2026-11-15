"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, LoaderCircle, Mailbox, Pencil, Upload } from "lucide-react";

import { extractTrackingRows, type TrackingFileError } from "@workspace/lib/shipping/wassalha-tracking";
import { IconButton, Modal, Note, SellerButton, TextInput } from "@/components/seller-ui";
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
    <Modal
      width={576}
      className="max-h-[85dvh] overflow-y-auto"
      title={t("uploadTitle")}
      description={t("uploadDescription")}
      onOpenChange={(open) => {
        if (!open) {
          setFileError(null);
          setResult(null);
        }
      }}
      trigger={
        <SellerButton variant="outline" className={className}>
          <Upload aria-hidden />
          {t("uploadButton")}
        </SellerButton>
      }
    >
        <div className="flex flex-col gap-4 text-[13px] text-(--s-body)">
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
          <SellerButton variant="outline" className="w-full" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
            {pending ? t("reading") : t("chooseFile")}
          </SellerButton>

          {fileError && (
            <div role="alert">
              <Note tone="danger">{t(`fileErrors.${fileError}`)}</Note>
            </div>
          )}

          {result && (
            <div className="space-y-3" role="status">
              <p className="font-semibold text-(--s-text)">
                {t("savedCount", { count: result.saved })}
                {result.unchanged > 0 && <span className="ms-1.5 font-normal text-(--s-subtle)">{t("unchangedCount", { count: result.unchanged })}</span>}
              </p>
              {result.problems.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-destructive">{t("problemsCount", { count: result.problems.length })}</p>
                  <div className="overflow-x-auto rounded-2xl border border-(--s-line)">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-(--s-surface-2) text-(--s-subtle)">
                        <tr>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.row")}</th>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.order")}</th>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.tracking")}</th>
                          <th scope="col" className="p-2 text-start font-medium">{t("columns.reason")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--s-line-soft)">
                        {result.problems.map((problem) => (
                          <tr key={`${problem.row}-${problem.orderNumber}-${problem.trackingNumber}`}>
                            <td className="p-2 tabular-nums">{problem.row}</td>
                            <td className="p-2 font-montserrat" dir="ltr">{problem.orderNumber || "-"}</td>
                            <td className="p-2 font-montserrat" dir="ltr">{problem.trackingNumber || "-"}</td>
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
    </Modal>
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
    <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) p-3.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-(--s-fill) text-(--s-subtle)">
          <Mailbox className="size-4" aria-hidden />
        </span>
        <p className="font-bold text-(--s-ink)">{t("cardTitle")}</p>
      </div>
      {number && !editing && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-(--s-subtle)">{t("number")}</span>
          <bdi className="break-all font-montserrat font-semibold text-(--s-text)" dir="ltr">
            {number}
          </bdi>
          <IconButton onClick={copy} aria-label={t("copy")}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </IconButton>
          <IconButton
            aria-label={t("edit")}
            onClick={() => {
              setValue(number);
              setEditing(true);
            }}
          >
            <Pencil aria-hidden />
          </IconButton>
        </div>
      )}
      {(!number || editing) && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
          <TextInput
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("number")}
            dir="ltr"
            maxLength={60}
            className="h-10 min-w-40 flex-1 font-montserrat"
          />
          <SellerButton type="submit" variant="solid" size="sm" disabled={pending || !value.trim()}>
            {pending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("save")}
          </SellerButton>
          {editing && (
            <SellerButton variant="mini" size="sm" disabled={pending} onClick={() => setEditing(false)}>
              {t("cancel")}
            </SellerButton>
          )}
        </form>
      )}
    </div>
  );
}
