"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, CircleHelp, Copy, Info } from "lucide-react";
import { siGoogle, siMeta, siTiktok } from "simple-icons";
import { Note, SellerButton, SellerCard } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
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
    <section aria-labelledby="apps-feeds" className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2.5">
        <h2 id="apps-feeds" className="text-base font-bold text-(--s-ink)">
          {t("title")}
        </h2>
        <span className="text-[12.5px] text-(--s-faint)">{t("count", { count: FEED_PLATFORMS.length })}</span>
      </div>
      <p className="max-w-[640px] text-pretty text-[13px] text-(--s-muted)">{t("description")}</p>
      {!published && (
        <Note tone="amber" icon={Info}>
          {t("notPublished")}
        </Note>
      )}
      <SellerCard className="flex flex-col overflow-hidden">
        {FEED_PLATFORMS.map((platform) => (
          <FeedRow key={platform} platform={platform} urls={urls} />
        ))}
      </SellerCard>
    </section>
  );
}

function FeedRow({ platform, urls }: { platform: FeedPlatform; urls: StoreFeedUrls }) {
  const t = useTranslations("productFeeds");
  const [open, setOpen] = useState(false);
  const brand = BRANDS[platform];
  const stepsId = `feed-steps-${platform}`;

  return (
    <div className="flex flex-col gap-3 px-[18px] py-3.5 [&+&]:border-t [&+&]:border-(--s-line-soft)">
      <div className="grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1.3fr)_auto] items-center gap-3.5 max-[860px]:grid-cols-[44px_minmax(0,1fr)_auto]">
        <span className="grid size-11 place-items-center rounded-[14px] border border-(--s-line)" style={{ background: brand.bg }}>
          <svg viewBox="0 0 24 24" aria-hidden className="size-[52%]" style={{ fill: brand.fg }}>
            <path d={brand.path} />
          </svg>
        </span>
        <div className="min-w-0">
          <b className="block text-sm font-bold text-(--s-ink)">{t(`${platform}.name`)}</b>
          <small className="block text-xs text-(--s-subtle)">{t(`${platform}.vendor`)}</small>
        </div>
        <div className="flex min-w-0 flex-col gap-2 max-[860px]:order-5 max-[860px]:col-span-full">
          <FeedUrl label={t("feedUrl")} url={urls.xml} />
          {urls.xmlEnglish && <FeedUrl label={t("feedUrlEnglish")} url={urls.xmlEnglish} />}
        </div>
        <SellerButton variant="mini" size="xs" aria-expanded={open} aria-controls={stepsId} onClick={() => setOpen((value) => !value)}>
          <CircleHelp aria-hidden />
          {t("howTo")}
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden />
        </SellerButton>
      </div>
      {open && (
        <div id={stepsId} className="flex flex-col gap-2.5 rounded-2xl bg-(--s-tint) p-3.5">
          <p className="text-pretty text-[13px] text-(--s-muted)">{t(`${platform}.description`)}</p>
          <ol className="flex flex-col gap-2.5">
            {FEED_STEP_KEYS.map((step, index) => (
              <li key={step} className="flex gap-2.5 text-[12.5px] leading-[1.7] text-(--s-muted)">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-montserrat text-[11.5px] font-bold text-primary-ink">{index + 1}</span>
                <span className="min-w-0 pt-0.5">
                  {t.rich(`${platform}.${step}`, { b: (chunks) => <b className="font-semibold text-(--s-text)">{chunks}</b> })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
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
