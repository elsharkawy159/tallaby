'use client'

import { useTranslations } from 'next-intl'
import { Check, Circle, Loader2, Minus, X } from 'lucide-react'
import { Progress } from '@workspace/ui/components/progress'
import { cn } from '@/lib/utils'
import type { PhaseState } from '@/lib/ai/generation-phases'

/** Compact, real per-phase progress for the create studio's chat column. */
export function GenerationPhaseList ({ phases, degraded }: { phases: PhaseState[]; degraded?: boolean }) {
  const t = useTranslations('aiCreate.phases')
  const finished = phases.filter((p) => p.status === 'done' || p.status === 'skipped').length

  return (
    <div className="rounded-2xl border bg-card p-3.5 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs font-medium">
        <span>{t('title')}</span>
        <span className="tabular-nums text-muted-foreground">
          {t('stepCount', { done: finished, total: phases.length })}
        </span>
      </div>
      <Progress value={phases.length ? (finished / phases.length) * 100 : 0} className="h-1.5" />

      <ol className="mt-3 space-y-2.5">
        {phases.map((phase) => (
          <li key={phase.id} className="flex gap-2.5 text-sm">
            <PhaseIcon status={phase.status} />
            <div className="min-w-0 flex-1">
              <p className={cn('leading-5', phase.status === 'pending' && 'text-muted-foreground')}>
                {t(`labels.${phase.id}`)}
                {phase.total && phase.status !== 'pending' ? (
                  <span className="ms-1.5 text-xs tabular-nums text-muted-foreground">
                    {phase.done ?? 0}/{phase.total}
                  </span>
                ) : null}
              </p>
              {phase.status === 'running' && phase.detail ? (
                <p className="truncate text-xs text-muted-foreground">{phase.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {degraded ? <p className="mt-3 text-xs text-muted-foreground">{t('degraded')}</p> : null}
    </div>
  )
}

function PhaseIcon ({ status }: { status: PhaseState['status'] }) {
  const base = 'mt-0.5 size-4 shrink-0'
  switch (status) {
    case 'done':
      return <Check className={cn(base, 'text-primary')} aria-hidden />
    case 'skipped':
      return <Minus className={cn(base, 'text-muted-foreground')} aria-hidden />
    case 'running':
      return <Loader2 className={cn(base, 'animate-spin text-primary')} aria-hidden />
    case 'failed':
      return <X className={cn(base, 'text-destructive')} aria-hidden />
    default:
      return <Circle className={cn(base, 'text-muted-foreground/50')} aria-hidden />
  }
}
