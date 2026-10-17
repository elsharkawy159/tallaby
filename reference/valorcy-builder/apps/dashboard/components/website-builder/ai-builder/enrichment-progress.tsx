"use client"

import { useTranslations } from "next-intl"
import {
  Loader2,
  Check,
  Sparkles,
  Database,
  PenLine,
  Image as ImageIcon,
  Languages,
  ShieldCheck,
  Save,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sectionRegistry } from "@/components/sections"
import type {
  EnrichmentTask,
  EnrichmentPhase,
} from "@/lib/ai/section-enrichment-queue"

const STEP_ICONS: Record<string, React.ElementType> = {
  connecting: Database,
  writing: PenLine,
  translating: Languages,
  images: ImageIcon,
}

/**
 * Chat-side progress chips for the post-turn section enrichment pipeline.
 * The AI shell renders the preview in an iframe, so the canvas per-section
 * AI overlays are invisible here — this is the user's only progress surface.
 */
export function EnrichmentProgress({
  tasks,
  phase,
}: {
  tasks: EnrichmentTask[]
  phase: EnrichmentPhase | null
}) {
  const t = useTranslations("aiBuilder.enrichment")
  if (!tasks.length || !phase) return null

  const settled = tasks.every(
    (task) =>
      task.step === "done" || task.step === "error" || task.step === "skipped"
  )
  const isFinished = phase === "done"

  const stepLabel = (task: EnrichmentTask): string => {
    switch (task.step) {
      case "queued":
        return t("queued")
      case "connecting":
        return t("connecting")
      case "writing":
        return t("writing")
      case "translating":
        return t("translating")
      case "images":
        return t("images")
      case "skipped":
        return t("skipped")
      case "error":
        return t("failed")
      default:
        return t("ready")
    }
  }

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {isFinished ? (
          <Check className="size-3 text-emerald-500/80" />
        ) : (
          <Sparkles className="size-3 animate-pulse text-violet-500/80" />
        )}
        <span>{isFinished ? t("titleDone") : t("title")}</span>
      </div>
      <div className="mt-1.5 flex flex-col gap-1">
        {tasks.map((task) => {
          const def = sectionRegistry.get(task.sectionId)
          const name = def?.displayName ?? task.sectionId
          const running =
            !isFinished &&
            (task.step === "connecting" ||
              task.step === "writing" ||
              task.step === "translating" ||
              task.step === "images")
          const Icon = STEP_ICONS[task.step] ?? Check
          return (
            <div
              key={task.instanceId}
              className={cn(
                "flex items-start gap-1.5 text-[10px] leading-tight",
                task.step === "error"
                  ? "text-rose-500/80"
                  : task.step === "skipped"
                    ? "text-muted-foreground/50"
                    : running
                      ? "text-violet-600/80 dark:text-violet-300/80"
                      : "text-muted-foreground/70"
              )}
            >
              {running || task.step === "queued" ? (
                <Loader2
                  className={cn(
                    "mt-0.5 size-2.5 shrink-0",
                    running && "animate-spin"
                  )}
                />
              ) : task.step === "error" ? (
                <AlertTriangle className="mt-0.5 size-2.5 shrink-0" />
              ) : (
                <Icon className="mt-0.5 size-2.5 shrink-0 opacity-70" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {name} — {stepLabel(task)}
              </span>
              {task.step === "done" && (
                <Check className="size-2.5 shrink-0 text-emerald-500/70" />
              )}
            </div>
          )
        })}
        {settled && (phase === "validating" || phase === "saving") && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
            {phase === "validating" ? (
              <ShieldCheck className="size-2.5 shrink-0" />
            ) : (
              <Save className="size-2.5 shrink-0" />
            )}
            <span>{phase === "validating" ? t("validating") : t("saving")}</span>
            <Loader2 className="size-2.5 shrink-0 animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
