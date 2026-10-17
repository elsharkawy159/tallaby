'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanIssue, ReadinessItem } from '@/lib/ai/plan-validation'

export function IssueIcon ({ severity, className }: { severity: 'error' | 'warning' | 'ok'; className?: string }) {
  if (severity === 'error') return <AlertCircle className={cn('size-3.5 shrink-0 text-destructive', className)} aria-hidden />
  if (severity === 'warning') {
    return <AlertTriangle className={cn('size-3.5 shrink-0 text-amber-600 dark:text-amber-400', className)} aria-hidden />
  }
  return <CheckCircle2 className={cn('size-3.5 shrink-0 text-primary', className)} aria-hidden />
}

/** Every issue as a clickable row that jumps to the item it's about. */
export function IssueList ({
  issues,
  onSelect,
  className,
}: {
  issues: PlanIssue[]
  onSelect: (issue: PlanIssue) => void
  className?: string
}) {
  const t = useTranslations('aiCreate.plan.issues')
  const sorted = [...issues].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1))
  return (
    <ul className={cn('space-y-1', className)}>
      {sorted.map((issue, i) => (
        <li key={`${issue.code}-${issue.pageId ?? ''}-${issue.sectionId ?? ''}-${issue.collectionId ?? ''}-${issue.fieldId ?? ''}-${i}`}>
          <button
            type="button"
            onClick={() => onSelect(issue)}
            className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-start text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IssueIcon severity={issue.severity} className="mt-0.5" />
            <span className="min-w-0 flex-1" dir="auto">
              {t(issue.code, issue.params)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/** The generation readiness checklist. */
export function ReadinessChecklist ({
  items,
  onSelect,
}: {
  items: ReadinessItem[]
  onSelect?: (area: ReadinessItem['id']) => void
}) {
  const t = useTranslations('aiCreate.plan.readiness')
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={!onSelect}
            onClick={() => onSelect?.(item.id)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-start text-sm transition-colors enabled:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IssueIcon severity={item.status} className="size-4" />
            <span className="min-w-0 flex-1">{t(item.id)}</span>
            <span
              className={cn(
                'shrink-0 text-xs',
                item.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {item.id === 'functionality'
                ? t('modules', { count: item.count })
                : item.status === 'ok'
                  ? t('ok')
                  : item.status === 'error'
                    ? t('error')
                    : t('warning', { count: item.count })}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
