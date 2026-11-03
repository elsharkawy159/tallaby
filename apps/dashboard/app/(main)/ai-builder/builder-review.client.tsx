"use client";

import { Check, ExternalLink, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import type { BuilderErrorCode, BuilderReview } from "./builder.dto";

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
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">{t("review.title")}</h1>
        {review.storeName && <p className="text-sm text-muted-foreground">{t("review.subtitle", { name: review.storeName, address: review.subdomain ?? "" })}</p>}
      </div>

      {review.stopReason && <p className="rounded-lg border bg-muted/40 p-3 text-sm">{t.has(`stops.${review.stopReason}`) ? t(`stops.${review.stopReason}` as never) : t("stops.other")}</p>}

      <section className="space-y-2 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">{review.issues.length ? t("review.missing", { count: review.issues.length }) : t("review.nothingMissing")}</h2>
        <ul className="space-y-2 text-sm">
          {review.issues.map((issue, index) => (
            <li key={index} className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <span className="flex-1">{t(`issues.${issue.code}` as never, (issue.params ?? {}) as never)}</span>
              {issue.href && (
                <Link href={issue.href} className="shrink-0 text-primary underline">
                  {t("review.fix")}
                </Link>
              )}
            </li>
          ))}
        </ul>
        {review.notes.length > 0 && (
          <>
            <h3 className="pt-2 text-sm font-medium">{t("review.notes")}</h3>
            <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
              {review.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {review.products.length > 0 && (
        <section className="space-y-2 rounded-xl border p-4">
          <h2 className="text-sm font-semibold">{t("review.products", { count: review.products.length })}</h2>
          <ul className="space-y-1 text-sm">
            {review.products.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-2">
                <Link href={`/products/${product.id}/edit`} className="truncate underline-offset-2 hover:underline">
                  {product.title}
                </Link>
                <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status === "active" ? t("review.live") : t("review.draft")}</Badge>
              </li>
            ))}
          </ul>
          {review.draftProducts > 0 && (
            <div className="space-y-1 pt-1">
              <Button variant="outline" size="sm" disabled={busy} onClick={onActivate}>
                <Check className="size-4" aria-hidden />
                {t("review.makeLive", { count: review.draftProducts })}
              </Button>
              {review.otherStoresShowAll > 0 && <p className="text-xs text-muted-foreground">{t("review.otherStores", { count: review.otherStoresShowAll })}</p>}
            </div>
          )}
        </section>
      )}

      {error && <p className="text-sm text-destructive">{t(`errors.${error}`)}</p>}

      <div className="flex flex-wrap gap-2">
        {editor && (
          <Button asChild>
            <Link href={editor}>
              <ExternalLink className="size-4" aria-hidden />
              {t("review.openEditor")}
            </Link>
          </Button>
        )}
        {review.storeId && (
          <Button variant="outline" asChild>
            <Link href={`/stores/${review.storeId}/settings/payments`}>{t("review.payments")}</Link>
          </Button>
        )}
        <Button variant="outline" disabled={busy || review.regenerationsLeft === 0 || !review.storeId} onClick={onRegenerate}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
          {t("review.regenerate", { count: review.regenerationsLeft })}
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onNew}>
          {t("review.another")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("review.publishNote")}</p>
    </div>
  );
}
