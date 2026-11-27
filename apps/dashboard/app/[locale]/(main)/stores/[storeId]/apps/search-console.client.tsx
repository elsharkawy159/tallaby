"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Info, LoaderCircle } from "lucide-react";
import { Field, Note, SellerButton, SellerCard, StatusBadge, TextInput } from "@/components/seller-ui";
import { saveSearchConsoleVerification } from "./search-console.server";
import { SEARCH_CONSOLE_URL, extractVerificationToken, isVerificationToken } from "./search-console.lib";

/** What Search Console shows; kept in code (not translated). */
const PLACEHOLDER = '<meta name="google-site-verification" content="…" />';

const bold = (chunks: React.ReactNode) => <b className="font-semibold text-(--s-text)">{chunks}</b>;

/**
 * Apps › Google Search Console (moved from Website › SEO, 2026-11-27): three
 * steps (add the store address, paste the HTML tag code, submit the sitemap).
 * The code is saved to `stores.seo.googleSiteVerification`, as before.
 */
export function SearchConsoleApp({
  storeId,
  initial,
  urls,
  published,
  readOnly,
}: {
  storeId: string;
  initial: string | null;
  urls: { property: string; sitemap: string; robots: string };
  published: boolean;
  readOnly: boolean;
}) {
  const t = useTranslations("searchConsoleApp");
  const tApps = useTranslations("storeApps");
  const router = useRouter();
  const [saved, setSaved] = useState(initial ?? "");
  const [value, setValue] = useState(initial ?? "");
  const [isPending, startTransition] = useTransition();
  const token = extractVerificationToken(value);
  const valid = token === "" || isVerificationToken(token);
  const dirty = token !== saved;

  const save = () => {
    if (!valid) return;
    startTransition(async () => {
      const result = await saveSearchConsoleVerification(storeId, token);
      if (!result.success) {
        toast.error(result.error === "invalidId" ? t("invalid") : tApps(`errors.${result.error}`));
        return;
      }
      const next = result.data.token ?? "";
      setSaved(next);
      setValue(next);
      toast.success(next ? t("saved") : t("removed"));
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="apps-search-console" className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 id="apps-search-console" className="text-base font-bold text-(--s-ink)">
          <bdi dir="ltr">Google Search Console</bdi>
        </h2>
        <StatusBadge tone={saved ? "success" : "muted"}>{saved ? t("added") : t("notAdded")}</StatusBadge>
      </div>
      <p className="max-w-[640px] text-pretty text-[13px] text-(--s-muted)">{t("description")}</p>
      {!published && (
        <Note tone="amber" icon={Info}>
          {t("notPublished")}
        </Note>
      )}

      <SellerCard className="flex flex-col overflow-hidden">
        <Step index={1} title={t.rich("step1", { b: bold })}>
          <CopyUrl label={t("storeAddress")} url={urls.property} />
          <SellerButton asChild variant="mini" size="xs" className="self-start">
            <a href={SEARCH_CONSOLE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden className="rtl:-scale-x-100" />
              {t("open")}
            </a>
          </SellerButton>
        </Step>

        <Step index={2} title={t.rich("step2", { b: bold })}>
          <Field label={t("label")} htmlFor="search-console-token">
            <TextInput
              id="search-console-token"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              className="text-start font-mono text-xs"
              value={value}
              placeholder={PLACEHOLDER}
              disabled={readOnly || isPending}
              aria-invalid={!valid || undefined}
              onChange={(event) => setValue(event.target.value)}
              // A pasted tag becomes its token right away.
              onBlur={() => setValue(token)}
            />
            {!valid ? (
              <p className="text-xs font-semibold text-destructive">{t("invalid")}</p>
            ) : saved && !dirty ? (
              <p className="text-xs text-success">{t("live")}</p>
            ) : (
              <p className="text-xs text-(--s-subtle)">{t("hint")}</p>
            )}
          </Field>
          <SellerButton variant="solid" size="sm" className="self-start" disabled={readOnly || isPending || !dirty || !valid} onClick={save}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("save")}
          </SellerButton>
        </Step>

        <Step index={3} title={t.rich("step3", { b: bold })}>
          <CopyUrl label={t("sitemap")} url={urls.sitemap} />
          <p className="text-xs text-(--s-subtle)">
            {t("sitemapHint")}{" "}
            <a href={urls.robots} target="_blank" rel="noopener noreferrer" className="font-semibold text-(--s-link) hover:underline">
              {t("robots")}
            </a>
          </p>
        </Step>
      </SellerCard>
    </section>
  );
}

function Step({ index, title, children }: { index: number; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-[18px] py-4 [&+&]:border-t [&+&]:border-(--s-line-soft) max-[600px]:px-4">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-montserrat text-[11.5px] font-bold text-primary-ink">{index}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <p className="pt-0.5 text-pretty text-[13px] leading-[1.7] text-(--s-muted)">{title}</p>
        {children}
      </div>
    </div>
  );
}

function CopyUrl({ label, url }: { label: string; url: string }) {
  const t = useTranslations("searchConsoleApp");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        readOnly
        dir="ltr"
        value={url}
        aria-label={label}
        title={label}
        onFocus={(event) => event.currentTarget.select()}
        className="h-9 min-w-0 flex-1 rounded-xl border-[1.5px] border-(--s-field) bg-(--s-surface-2) px-2.5 font-mono text-[11.5px] text-(--s-body) outline-none focus:border-(--s-primary) max-[600px]:h-10"
      />
      <SellerButton variant="mini" size="xs" onClick={copy}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? t("copiedShort") : t("copy")}
      </SellerButton>
    </div>
  );
}
