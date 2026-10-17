"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { AlertCircle, AlertTriangle, Check, CheckCircle2, Loader2, Sparkles, Wrench, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { parseGenerationProgress } from "@/lib/ai/generation-phases"
import type { SiteQaCheck, SiteQaCheckId, SiteQaReport } from "@/lib/ai/site-qa"

interface SiteQaCardProps {
  /** The generation whose final QA report to show. */
  runId: string
  /** Pre-fill the chat to fix one check, scoped to the affected pages. */
  onFix: (checkId: SiteQaCheckId, pageSlugs: string[]) => void
  onDismiss: () => void
}

type LoadState = { kind: "loading" } | { kind: "ready"; report: SiteQaReport } | { kind: "unavailable" }

/**
 * The final QA report of a finished generation, shown on top of the website
 * overview: "Website complete · Ready to publish", or what's worth a look, each
 * with a one-click "Fix with AI" that opens a scoped chat request.
 */
export function SiteQaCard ({ runId, onFix, onDismiss }: SiteQaCardProps) {
  const t = useTranslations("aiBuilder.qa")
  const [state, setState] = useState<LoadState>({ kind: "loading" })

  useEffect(() => {
    let cancelled = false
    fetch(`/api/ai/generate-site/status/${runId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { progress?: unknown } | null) => {
        if (cancelled) return
        const report = parseGenerationProgress(data?.progress)?.qa
        setState(report ? { kind: "ready", report } : { kind: "unavailable" })
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "unavailable" })
      })
    return () => {
      cancelled = true
    }
  }, [runId])

  if (state.kind === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </div>
    )
  }

  if (state.kind === "unavailable") return null

  const { report } = state
  const issues = report.checks.filter((c) => c.status === "warn" || c.status === "fail")
  const issueCount = issues.reduce((n, c) => n + Math.max(1, c.count), 0)
  const HeaderIcon = report.status === "failed" ? AlertTriangle : CheckCircle2

  return (
    <section
      aria-labelledby="site-qa-title"
      className="rounded-2xl border bg-card p-4 text-card-foreground shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            report.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}
        >
          <HeaderIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="site-qa-title" className="text-base font-semibold">
            {t(`${report.status}Title`)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {report.status === "warnings"
              ? t("warningsSubtitle", { count: issueCount })
              : t(`${report.status}Subtitle`)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          onClick={onDismiss}
          aria-label={t("dismiss")}
        >
          <X className="size-4" />
        </Button>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {report.checks.map((check) => (
          <QaCheckRow key={check.id} check={check} onFix={onFix} />
        ))}
      </ul>
    </section>
  )
}

function QaCheckRow ({
  check,
  onFix,
}: {
  check: SiteQaCheck
  onFix: SiteQaCardProps["onFix"]
}) {
  const t = useTranslations("aiBuilder.qa")
  const needsWork = check.status === "warn" || check.status === "fail"
  const pageSlugs = [
    ...new Set(check.items.map((i) => i.pageSlug).filter((s): s is string => Boolean(s))),
  ]

  const Icon =
    check.status === "fail"
      ? AlertTriangle
      : check.status === "warn"
        ? AlertCircle
        : check.status === "fixed"
          ? Wrench
          : Check

  return (
    <li className="flex items-start gap-2.5 rounded-xl border bg-background px-3 py-2.5">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          check.status === "fail" && "text-destructive",
          check.status === "warn" && "text-muted-foreground",
          (check.status === "pass" || check.status === "fixed") && "text-primary"
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5">{t(`checks.${check.id}`)}</p>
        <p className="text-xs text-muted-foreground">
          {needsWork
            ? t("issues", { count: Math.max(1, check.count) })
            : check.status === "fixed"
              ? t("autoFixed")
              : t("passed")}
          {needsWork && check.items.some((i) => i.label) ? (
            <span>
              {" · "}
              {[...new Set(check.items.map((i) => i.label).filter(Boolean))].slice(0, 3).join(", ")}
            </span>
          ) : null}
        </p>
        {needsWork && (
          <Button
            variant="link"
            size="sm"
            className="h-auto gap-1 px-0 py-0.5 text-xs"
            onClick={() => onFix(check.id, pageSlugs)}
          >
            <Sparkles className="size-3" />
            {t("fixWithAi")}
          </Button>
        )}
      </div>
    </li>
  )
}
