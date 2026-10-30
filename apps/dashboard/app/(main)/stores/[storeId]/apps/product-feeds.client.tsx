"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, Copy, Info } from "lucide-react";
import { siGoogle, siMeta, siTiktok } from "simple-icons";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { FEED_PLATFORMS, FEED_STEP_KEYS, type FeedPlatform, type StoreFeedUrls } from "./product-feeds.lib";

const BRANDS: Record<FeedPlatform, { path: string; bg: string; fg: string }> = {
  meta: { path: siMeta.path, bg: "#0866FF", fg: "#FFFFFF" },
  google: { path: siGoogle.path, bg: "#FFFFFF", fg: "#4285F4" },
  tiktok: { path: siTiktok.path, bg: "#000000", fg: "#FFFFFF" },
};

/**
 * Apps › Product feeds (ROADMAP.md F-11b): the store's feed address for
 * Meta catalog, Google Merchant Center and TikTok catalog, with setup steps.
 * Nothing to connect: each platform fetches the public feed on its schedule.
 */
export function ProductFeeds({ urls, published }: { urls: StoreFeedUrls; published: boolean }) {
  const t = useTranslations("productFeeds");
  return (
    <section aria-labelledby="apps-feeds">
      <div className="mb-3 flex items-baseline gap-2.5">
        <h2 id="apps-feeds" className="text-[13px] font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase">
          {t("title")}
        </h2>
        <span className="text-xs text-faint">{t("count", { count: FEED_PLATFORMS.length })}</span>
      </div>
      <p className="mb-3.5 max-w-[640px] text-[13px] text-pretty text-muted-foreground">{t("description")}</p>
      {!published && (
        <p role="note" className="mb-3.5 flex gap-2 rounded-xl bg-accent-soft p-3 text-[13px] text-accent-ink">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t("notPublished")}
        </p>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
        {FEED_PLATFORMS.map((platform) => (
          <FeedCard key={platform} platform={platform} urls={urls} />
        ))}
      </div>
    </section>
  );
}

function FeedCard({ platform, urls }: { platform: FeedPlatform; urls: StoreFeedUrls }) {
  const t = useTranslations("productFeeds");
  const [open, setOpen] = useState(false);
  const brand = BRANDS[platform];
  const stepsId = `feed-steps-${platform}`;

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border bg-card p-[18px] shadow-xs">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-[14px] border" style={{ background: brand.bg }}>
          <svg viewBox="0 0 24 24" aria-hidden className="size-[52%]" style={{ fill: brand.fg }}>
            <path d={brand.path} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-snug font-bold">{t(`${platform}.name`)}</h3>
          <small className="mt-0.5 block text-xs text-faint">{t(`${platform}.vendor`)}</small>
        </div>
      </div>
      <p className="flex-1 text-[13px] leading-relaxed text-pretty text-muted-foreground">{t(`${platform}.description`)}</p>

      <FeedUrl label={t("feedUrl")} url={urls.xml} />
      {urls.xmlEnglish && <FeedUrl label={t("feedUrlEnglish")} url={urls.xmlEnglish} />}

      <div className="border-t pt-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={stepsId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-2 text-[13px] font-semibold"
        >
          {t("howTo")}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        {open && (
          <ol id={stepsId} className="mt-3 flex flex-col">
            {FEED_STEP_KEYS.map((step, index) => (
              <li key={step} className="relative flex gap-3 pb-4 text-[13px] text-muted-foreground last:pb-0">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-ink">
                  {index + 1}
                </span>
                {index < FEED_STEP_KEYS.length - 1 && <span className="absolute start-[11.5px] top-7 bottom-1 w-px bg-border" aria-hidden />}
                <span className="pt-0.5">
                  {t.rich(`${platform}.${step}`, { b: (chunks) => <b className="font-semibold text-foreground">{chunks}</b> })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function FeedUrl({ label, url }: { label: string; url: string }) {
  const t = useTranslations("productFeeds");
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
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          readOnly
          dir="ltr"
          value={url}
          aria-label={label}
          onFocus={(event) => event.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-[10px] border bg-muted/40 px-3 font-mono text-xs outline-none focus:border-primary"
        />
        <Button type="button" variant="outline" className="h-9 shrink-0 rounded-[10px] px-3 text-[13px] font-semibold" onClick={copy}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? t("copiedShort") : t("copy")}
        </Button>
      </div>
    </div>
  );
}
