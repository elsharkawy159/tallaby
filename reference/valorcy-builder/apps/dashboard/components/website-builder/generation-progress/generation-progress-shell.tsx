'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Minus, RefreshCw, Sparkles, X } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@/lib/utils'
import {
  GENERATION_PHASE_ORDER,
  PHASE_META,
  type GenerationPhaseId,
  type PhaseState,
} from '@/lib/ai/generation-phases'

export type { GenerationPhaseId }
/** @deprecated Use GenerationPhaseId — kept so existing imports keep compiling. */
export type GenerationStep = GenerationPhaseId

interface GenerationProgressShellProps {
  /**
   * Durable per-phase state, newest snapshot from the status endpoint. Every
   * phase is backed by real work in the orchestrator — see generation-phases.ts.
   */
  phases: PhaseState[]
  error?: string | null
  /** Completed but with QA warnings (job status = degraded). */
  degraded?: boolean
  onCancel?: () => void
  onRetry?: () => void
  /** Shown alongside Retry after a failure, to return to the wizard. */
  onBack?: () => void
  /** Label for the `onBack` button. Defaults to the wizard's wording. */
  backLabel?: string
  cancelling?: boolean
}

function phaseById(phases: PhaseState[], id: GenerationPhaseId): PhaseState {
  return phases.find((p) => p.id === id) ?? { id, status: 'pending' }
}

export function GenerationProgressShell({
  phases,
  error,
  degraded,
  onCancel,
  onRetry,
  onBack,
  backLabel = 'Back to details',
  cancelling,
}: GenerationProgressShellProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500)
    return () => clearInterval(id)
  }, [])

  const running = phases.find((p) => p.status === 'running')
  const finished = phases.filter((p) => p.status === 'done' || p.status === 'skipped').length
  const overallPct = Math.round((finished / GENERATION_PHASE_ORDER.length) * 100)

  const headline = running
    ? `${running.detail || PHASE_META[running.id].detail}${dots}`
    : error
      ? 'Generation stopped'
      : finished === GENERATION_PHASE_ORDER.length
        ? 'All done — opening your website…'
        : 'Starting up…'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="size-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Building your website</h2>
          <p className="mt-1 min-h-[20px] text-sm text-muted-foreground">{headline}</p>

          {/* Overall progress across all phases. */}
          <div className="mx-auto mt-4 h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Step {Math.min(finished + (running ? 1 : 0), GENERATION_PHASE_ORDER.length)} of{' '}
            {GENERATION_PHASE_ORDER.length}
          </p>
        </motion.div>

        <div className="space-y-2.5">
          {GENERATION_PHASE_ORDER.map((id, idx) => {
            const phase = phaseById(phases, id)
            const meta = PHASE_META[id]
            const isDone = phase.status === 'done'
            const isSkipped = phase.status === 'skipped'
            const isActive = phase.status === 'running'
            const isFailed = phase.status === 'failed'
            const isPending = phase.status === 'pending'

            const showCount =
              typeof phase.total === 'number' &&
              phase.total > 0 &&
              (isActive || (isDone && meta.unit))

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: isPending ? 0.4 : 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                className={cn(
                  'flex items-start gap-3 rounded-xl border bg-card px-4 py-3',
                  isActive && 'border-primary/40',
                  isFailed && 'border-destructive/40'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
                    isDone && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary/20 text-primary',
                    isSkipped && 'bg-muted text-muted-foreground',
                    isFailed && 'bg-destructive/15 text-destructive',
                    isPending && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" />
                  ) : isActive ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isSkipped ? (
                    <Minus className="size-4" />
                  ) : isFailed ? (
                    <X className="size-4" />
                  ) : (
                    <span className="text-xs font-medium">{idx + 1}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isPending ? 'text-muted-foreground' : 'text-foreground'
                      )}
                    >
                      {meta.label}
                    </p>
                    {showCount && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {phase.done ?? 0}/{phase.total} {meta.unit}
                      </span>
                    )}
                  </div>
                  {(isActive || isSkipped || isFailed) && phase.detail && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {phase.detail}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
          {degraded && !error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400"
            >
              Your website was generated, but some sections may need a quick review.
            </motion.div>
          )}
        </AnimatePresence>

        {error && (onRetry || onBack) && (
          <div className="mt-6 flex justify-center gap-2">
            {onRetry && (
              <Button size="sm" className="gap-1.5" onClick={onRetry}>
                <RefreshCw className="size-4" />
                Try again
              </Button>
            )}
            {onBack && (
              <Button size="sm" variant="outline" onClick={onBack}>
                {backLabel}
              </Button>
            )}
          </div>
        )}

        {onCancel && !error && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={onCancel}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              {cancelling ? 'Cancelling…' : 'Cancel generation'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
