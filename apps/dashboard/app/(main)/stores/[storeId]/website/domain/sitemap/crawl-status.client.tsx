"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CircleAlert, CircleCheck, Copy, ExternalLink, FileText, Map as MapIcon } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { FieldHint, SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import type { CrawlStatus, NoindexReason } from "../domain-seo.data";

/** Where the seller fixes each reason. */
function reasonHref(storeId: string, reason: NoindexReason): string {
  if (reason === "indexingOff") return `/stores/${storeId}/website/domain#seo`;
  if (reason === "noProducts") return `/stores/${storeId}/settings#catalog-mode`;
  return "/stores";
}

/** Website › Domain & SEO › Sitemap & indexing section (P4-14): read-only URLs and status. */
export function CrawlStatusView({ storeId, status }: { storeId: string; status: CrawlStatus }) {
  const t = useTranslations("domainSeo.sitemap");
  const indexed = status.reasons.length === 0;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const urlRow = (label: string, url: string) => (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] font-semibold">{label}</p>
      <div className="flex flex-wrap items-stretch gap-2">
        <span
          dir="ltr"
          className="flex h-[34px] min-w-[220px] flex-1 items-center truncate rounded-[10px] border border-input bg-muted px-3 font-mono text-[13px]"
        >
          {url}
        </span>
        <Button type="button" variant="neutral" className={SMALL_BUTTON_CLASS} onClick={() => void copy(url)}>
          <Copy />
          {t("copy")}
        </Button>
        <Button variant="neutral" className={SMALL_BUTTON_CLASS} asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="rtl:-scale-x-100" />
            {t("open")}
          </a>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <SectionCard
        id="status"
        icon={indexed ? CircleCheck : CircleAlert}
        title={t("status.title")}
        description={indexed ? t("status.indexed") : t("status.notIndexed")}
        tag={
          indexed ? (
            <Badge variant="success">{t("status.indexedBadge")}</Badge>
          ) : (
            <Badge variant="warning">{t("status.notIndexedBadge")}</Badge>
          )
        }
      >
        {indexed ? (
          <FieldHint>{t("status.indexedHint")}</FieldHint>
        ) : (
          <ul className="flex flex-col gap-2">
            {status.reasons.map((reason) => (
              <li key={reason} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3">
                <span className="text-[13px]">{t(`reasons.${reason}`)}</span>
                <Link href={reasonHref(storeId, reason)} className="text-xs font-medium text-primary-ink hover:underline">
                  {t(`fix.${reason}`)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard id="sitemap-files" icon={MapIcon} title={t("files.title")} description={t("files.description")}>
        {urlRow(t("files.sitemap"), status.sitemapUrl)}
        {urlRow(t("files.robots"), status.robotsUrl)}
        <FieldHint>{t("files.contents")}</FieldHint>
        <FieldHint>{t("files.searchConsole")}</FieldHint>
      </SectionCard>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t("pagesNote")}
      </p>
    </div>
  );
}
