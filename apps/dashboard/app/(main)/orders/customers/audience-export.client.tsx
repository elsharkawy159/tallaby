"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Target } from "lucide-react";
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
import { AUDIENCE_FORMATS, AUDIENCE_SEGMENTS, type AudienceFormat, type AudienceSegment } from "@workspace/lib/audiences";
import { formatNumber } from "@/lib/i18n/format";
import { exportAudience } from "./audience.server";

/**
 * Downloads text as a UTF-8 file. No BOM: the ad platforms read the first
 * header literally, and a BOM would hide Meta's `email` column.
 */
function downloadText(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const option = (active: boolean) =>
  cn(
    "flex w-full flex-col items-start gap-0.5 rounded-lg border p-3 text-start transition-colors",
    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
  );

/**
 * "Export audience" on Orders › Customers (ROADMAP.md F-16b): pick a segment
 * and the ad platform, get a custom-audience CSV of the store's own customers.
 */
export function AudienceExportButton({ storeId }: { storeId: string }) {
  const t = useTranslations("customers.audience");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [segment, setSegment] = useState<AudienceSegment>("buyers");
  const [format, setFormat] = useState<AudienceFormat>("meta");
  const [pending, startTransition] = useTransition();

  const download = () =>
    startTransition(async () => {
      const res = await exportAudience({ storeId, segment, format });
      if (!res.success) {
        toast.error(t(`errors.${res.error}`));
        return;
      }
      downloadText(res.csv, res.fileName);
      toast.success(t("done", { count: formatNumber(res.count, locale) }));
      setOpen(false);
    });

  return (
    <>
      <Button type="button" size="sm" variant="neutral" onClick={() => setOpen(true)}>
        <Target aria-hidden />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t("segmentLabel")}</legend>
            {AUDIENCE_SEGMENTS.map((s) => (
              <button key={s} type="button" className={option(segment === s)} aria-pressed={segment === s} onClick={() => setSegment(s)}>
                <span className="text-sm font-medium">{t(`segments.${s}.title`)}</span>
                <span className="text-xs text-muted-foreground">{t(`segments.${s}.body`)}</span>
              </button>
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t("formatLabel")}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {AUDIENCE_FORMATS.map((f) => (
                <button key={f} type="button" className={option(format === f)} aria-pressed={format === f} onClick={() => setFormat(f)}>
                  <span className="text-sm font-medium">{t(`formats.${f}`)}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t(`formatHints.${format}`)}</p>
          </fieldset>

          <p className="text-xs text-muted-foreground">{t("privacy")}</p>

          <DialogFooter>
            <Button type="button" variant="neutral" onClick={() => setOpen(false)} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={download} disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
