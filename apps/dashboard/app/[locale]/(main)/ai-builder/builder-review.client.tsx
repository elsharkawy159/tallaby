"use client";

import { Check, ClipboardCheck, ExternalLink, Loader2, Package, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Note, PageHeader, SectionCard, SellerButton, StatusBadge, TextAction } from "@/components/seller-ui";
import type { BuilderErrorCode, BuilderReview } from "./builder.dto";
import { storeProductsHref } from "@/lib/products/product-routes.lib";

/**
 * The end of the AI Store Builder (ROADMAP.md F-54d): what was built, what's
 * missing and where to fix it. Nothing here publishes: making products live and
 * the editor's Publish are the seller's own steps.
 */
export function BuilderReviewPanel({
  review,
  busy,
  error,
  onRegenerate,
  onActivate,
  onNew,
}: {
  review: BuilderReview | null;
  busy: boolean;
  error: BuilderErrorCode | null;
  onRegenerate: () => void;
  onActivate: () => void;
  onNew: () => void;
}) {
  const t = useTranslations("aiBuilder");
  if (!review) return <Loader2 className="mx-auto size-5 animate-spin" aria-label={t("reviewLoading")} />;

  const editor = review.storeId ? `/stores/${review.storeId}/editor` : null;
  return (
    <>
      <PageHeader
        title={t("review.title")}
        description={review.storeName ? t("review.subtitle", { name: review.storeName, address: review.subdomain ?? "" }) : undefined}
      />

      {review.flow === "v2" && (
        <Note tone={review.published ? "success" : "amber"}>
          {review.published ? t("v2.done.published") : t("v2.done.notPublished")}
          {review.viewUrl && (
            <>
              {" "}
              <a className="font-semibold underline" href={review.viewUrl} target="_blank" rel="noreferrer">
                {t("v2.done.open")}
              </a>
            </>
          )}
        </Note>
      )}

      {review.stopReason && <Note tone="amber">{t.has(`stops.${review.stopReason}`) ? t(`stops.${review.stopReason}` as never) : t("stops.other")}</Note>}

      <SectionCard icon={ClipboardCheck} title={review.issues.length ? t("review.missing", { count: review.issues.length }) : t("review.nothingMissing")}>
        {review.issues.length > 0 && (
          <ul className="flex flex-col gap-2 text-[13.5px] text-(--s-body)">
            {review.issues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
                <span className="flex-1">{t(`issues.${issue.code}` as never, (issue.params ?? {}) as never)}</span>
                {issue.href && (
                  <TextAction asChild>
                    <Link href={issue.href}>{t("review.fix")}</Link>
                  </TextAction>
                )}
              </li>
            ))}
          </ul>
        )}
        {review.notes.length > 0 && (
          <>
            <h3 className="text-[13.5px] font-bold text-(--s-text)">{t("review.notes")}</h3>
            <ul className="list-disc space-y-1 ps-5 text-[13px] text-(--s-muted)">
              {review.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      {review.products.length > 0 && (
        <SectionCard icon={Package} title={t("review.products", { count: review.products.length })}>
          <ul className="flex flex-col gap-1.5 text-[13.5px]">
            {review.products.map((product) => (
              <li key={product.id} className="flex min-h-10 items-center justify-between gap-2">
                <Link href={storeProductsHref(review.storeId, `/${product.id}/edit`)} className="truncate font-semibold text-(--s-text) underline-offset-2 hover:underline">
                  {product.title}
                </Link>
                <StatusBadge tone={product.status === "active" ? "success" : "muted"}>{product.status === "active" ? t("review.live") : t("review.draft")}</StatusBadge>
              </li>
            ))}
          </ul>
          {review.draftProducts > 0 && (
            <div className="flex flex-col gap-1">
              <SellerButton variant="solid" size="sm" className="self-start" disabled={busy} onClick={onActivate}>
                <Check aria-hidden />
                {t("review.makeLive", { count: review.draftProducts })}
              </SellerButton>
              {review.otherStoresShowAll > 0 && <p className="text-xs text-(--s-faint)">{t("review.otherStores", { count: review.otherStoresShowAll })}</p>}
            </div>
          )}
        </SectionCard>
      )}

      {error && <Note tone="danger">{t(`errors.${error}`)}</Note>}

      <div className="flex flex-wrap gap-2">
        {editor && (
          <SellerButton asChild>
            <Link href={editor}>
              <ExternalLink aria-hidden />
              {t("review.openEditor")}
            </Link>
          </SellerButton>
        )}
        {review.storeId && (
          <SellerButton variant="outline" asChild>
            <Link href={`/stores/${review.storeId}/settings/payments`}>{t("review.payments")}</Link>
          </SellerButton>
        )}
        <SellerButton variant="outline" disabled={busy || review.regenerationsLeft === 0 || !review.storeId} onClick={onRegenerate}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
          {t("review.regenerate", { count: review.regenerationsLeft })}
        </SellerButton>
        <SellerButton variant="mini" disabled={busy} onClick={onNew}>
          {t("review.another")}
        </SellerButton>
      </div>
      <p className="text-xs text-(--s-faint)">{t("review.publishNote")}</p>
    </>
  );
}
