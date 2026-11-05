"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Activity, Copy, ExternalLink, FileCode, Lightbulb } from "lucide-react";
import { Field, Note, SectionCard, SellerButton, StatusBadge, TextInput } from "@/components/seller-ui";
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
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-2 max-[720px]:[&>button]:flex-1 max-[720px]:[&>a]:flex-1">
        <TextInput readOnly dir="ltr" value={url} aria-label={label} className="min-w-[220px] flex-1 font-mono text-[13px] max-[720px]:basis-full" />
        <SellerButton variant="mini" size="sm" onClick={() => void copy(url)}>
          <Copy aria-hidden />
          {t("copy")}
        </SellerButton>
        <SellerButton asChild variant="mini" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden className="rtl:-scale-x-100" />
            {t("open")}
          </a>
        </SellerButton>
      </div>
    </Field>
  );

  return (
    <>
      <SectionCard
        id="status"
        icon={Activity}
        title={
          <>
            {t("status.title")}
            <StatusBadge tone={indexed ? "success" : "warning"}>{indexed ? t("status.indexedBadge") : t("status.notIndexedBadge")}</StatusBadge>
          </>
        }
        description={indexed ? t("status.indexed") : t("status.notIndexed")}
      >
        {indexed ? (
          <Note>{t("status.indexedHint")}</Note>
        ) : (
          <ul className="flex flex-col gap-2">
            {status.reasons.map((reason) => (
              <li key={reason} className="flex flex-wrap items-center justify-between gap-2.5 rounded-[18px] border border-(--s-line) bg-(--s-tint) px-4 py-3">
                <b className="min-w-0 text-[13.5px] font-bold text-(--s-text)">{t(`reasons.${reason}`)}</b>
                <SellerButton asChild variant="mini" size="xs">
                  <Link href={reasonHref(storeId, reason)}>{t(`fix.${reason}`)}</Link>
                </SellerButton>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard id="sitemap-files" icon={FileCode} title={t("files.title")} description={t("files.description")}>
        {urlRow(t("files.sitemap"), status.sitemapUrl)}
        {urlRow(t("files.robots"), status.robotsUrl)}
        <Note icon={Lightbulb}>
          {t("files.contents")} {t("files.searchConsole")} {t("pagesNote")}
        </Note>
      </SectionCard>
    </>
  );
}
