"use client";

import { ArrowUpRight, Brush, Check, Copy, ExternalLink, Loader2, PenLine, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Confetti } from "@/app/(main)/_components/publish-celebration.client";
import { SellerButton, TextAction } from "@/components/seller-ui";
import type { BuilderReview } from "@/app/(main)/ai-builder/builder.dto";
import { whatsappShare } from "./workspace.lib";

/**
 * The end of a v2 build (spec §10): confetti once, "your store is ready and
 * published", the address, Open store, Edit in the builder, Share on
 * WhatsApp, the to-do list with its fix links and "Request a custom design"
 * (F-77). The store is public from day one (F-84), activated or not.
 */

const CONFETTI_KEY = (buildId: string) => `tallaby.aiBuilder.confetti.${buildId}`;

/** Read once per build and page load, then kept: the confetti never repeats in this browser. */
const firstTimes = new Map<string, boolean>();
function firstTime(buildId: string): boolean {
  let first = firstTimes.get(buildId);
  if (first === undefined) {
    try {
      first = !window.localStorage.getItem(CONFETTI_KEY(buildId));
      window.localStorage.setItem(CONFETTI_KEY(buildId), "1");
    } catch {
      // Storage blocked: celebrate anyway, once per page load.
      first = true;
    }
    firstTimes.set(buildId, first);
  }
  return first;
}
const noSubscribe = () => () => {};

/** True the first time this build's done card shows in this browser (false on the server). */
function useFirstTime(buildId: string): boolean {
  return useSyncExternalStore(noSubscribe, () => firstTime(buildId), () => false);
}

export function DoneCard({
  buildId,
  review,
  address,
  busy,
  error,
  onRegenerate,
  onNew,
}: {
  buildId: string;
  review: BuilderReview;
  /** "oud.tallaby.com", once known. */
  address: string | null;
  busy: boolean;
  error: string | null;
  onRegenerate: () => void;
  onNew: () => void;
}) {
  const t = useTranslations("aiBuilder");
  const first = useFirstTime(buildId);
  const [copied, setCopied] = useState(false);
  const shown = address ?? (review.subdomain ? `${review.subdomain}.tallaby.com` : null);
  const url = shown ? `https://${shown}` : null;
  const editor = review.storeId ? `/stores/${review.storeId}/editor` : null;
  const issues = review.issues;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li className="ms-10 motion-safe:animate-[ai-fade-up_.3s_ease-out]">
      {first && review.published && <Confetti />}
      <section aria-labelledby="ai-done-title" className="flex flex-col gap-4 rounded-[20px] border border-(--s-line) bg-(--s-surface) p-5 shadow-(--s-shadow-card)">
        <div className="flex flex-col gap-1">
          <h2 id="ai-done-title" className="text-[18px] font-bold leading-snug text-(--s-ink)">
            {review.published ? t("ws.done.title") : t("ws.done.titleNotPublished")}
          </h2>
          <p className="text-[13px] leading-[1.7] text-(--s-muted)">
            {review.published ? t("v2.done.published") : t("v2.done.notPublished")}
          </p>
        </div>

        {shown && (
          <div className="flex items-center gap-2 rounded-xl border border-(--s-line) bg-(--s-tint) py-1 ps-3 pe-1">
            <span className="min-w-0 flex-1 truncate font-montserrat text-[13.5px] font-semibold text-(--s-ink)" dir="ltr">
              {shown}
            </span>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold text-(--s-link) hover:bg-(--s-hover)"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              <span aria-live="polite">{copied ? t("ws.done.copied") : t("ws.done.copy")}</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {review.viewUrl && (
            <SellerButton asChild>
              <a href={review.viewUrl} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                {t("ws.openStore")}
              </a>
            </SellerButton>
          )}
          {editor && (
            <SellerButton variant="outline" asChild>
              <Link href={editor}>
                <PenLine aria-hidden />
                {t("ws.editInBuilder")}
              </Link>
            </SellerButton>
          )}
          {url && review.published && (
            <SellerButton variant="whatsapp" asChild>
              <a href={whatsappShare(t("ws.done.shareText", { url }))} target="_blank" rel="noreferrer">
                {t("ws.done.share")}
              </a>
            </SellerButton>
          )}
        </div>

        {review.stopReason && (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-[12.5px] text-accent-ink">
            {t.has(`stops.${review.stopReason}` as never) ? t(`stops.${review.stopReason}` as never) : t("stops.other")}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <h3 className="text-[13.5px] font-bold text-(--s-ink)">{issues.length ? t("ws.done.todo", { count: issues.length }) : t("review.nothingMissing")}</h3>
          {issues.length > 0 && (
            <ul className="flex flex-col divide-y divide-(--s-line-soft) rounded-xl border border-(--s-line)">
              {issues.map((issue, index) => (
                <li key={`${issue.code}:${index}`} className="flex min-h-12 items-center gap-2.5 px-3 py-1.5 text-[13px] text-(--s-body)">
                  <TriangleAlert className="size-4 shrink-0 text-accent-ink" aria-hidden />
                  <span className="min-w-0 flex-1">{t(`issues.${issue.code}` as never, (issue.params ?? {}) as never)}</span>
                  {issue.href && (
                    <TextAction asChild className="min-h-11">
                      <Link href={issue.href}>
                        {t("review.fix")}
                        <ArrowUpRight className="rtl:-scale-x-100" aria-hidden />
                      </Link>
                    </TextAction>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-[12.5px] font-semibold text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 border-t border-(--s-line-soft) pt-3">
          <SellerButton variant="mini" size="sm" className="min-h-11" disabled={busy || review.regenerationsLeft === 0 || !review.storeId} onClick={onRegenerate}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
            {t("review.regenerate", { count: review.regenerationsLeft })}
          </SellerButton>
          <SellerButton variant="mini" size="sm" className="min-h-11" disabled={busy} onClick={onNew}>
            {t("review.another")}
          </SellerButton>
          {review.storeId && (
            <TextAction asChild className="min-h-11">
              <Link href={`/stores/${review.storeId}/website/templates#theme-requests`}>
                <Brush aria-hidden />
                {t("ws.done.customDesign")}
              </Link>
            </TextAction>
          )}
        </div>
      </section>
    </li>
  );
}
