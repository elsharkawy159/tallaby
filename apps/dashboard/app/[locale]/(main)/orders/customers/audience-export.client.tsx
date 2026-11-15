"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Target } from "lucide-react";
import { AUDIENCE_FORMATS, AUDIENCE_SEGMENTS, type AudienceFormat, type AudienceSegment } from "@workspace/lib/audiences";
import { Modal, OptionCard, OptionCards, SellerButton } from "@/components/seller-ui";
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
      <SellerButton variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Target aria-hidden />
        {t("button")}
      </SellerButton>
      <Modal
        open={open}
        onOpenChange={setOpen}
        width={512}
        className="max-h-[90dvh] overflow-y-auto"
        title={t("title")}
        description={t("description")}
        footer={
          <>
            <SellerButton variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              {t("cancel")}
            </SellerButton>
            <SellerButton variant="solid" onClick={download} disabled={pending}>
              {pending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("download")}
            </SellerButton>
          </>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("segmentLabel")}</legend>
          <OptionCards className="grid-cols-1">
            {AUDIENCE_SEGMENTS.map((s) => (
              <OptionCard
                key={s}
                name="audience-segment"
                title={t(`segments.${s}.title`)}
                description={t(`segments.${s}.body`)}
                checked={segment === s}
                onChange={() => setSegment(s)}
              />
            ))}
          </OptionCards>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("formatLabel")}</legend>
          <OptionCards>
            {AUDIENCE_FORMATS.map((f) => (
              <OptionCard key={f} name="audience-format" title={t(`formats.${f}`)} checked={format === f} onChange={() => setFormat(f)} />
            ))}
          </OptionCards>
          <p className="text-xs text-(--s-subtle)">{t(`formatHints.${format}`)}</p>
        </fieldset>

        <p className="text-xs text-(--s-subtle)">{t("privacy")}</p>
      </Modal>
    </>
  );
}
