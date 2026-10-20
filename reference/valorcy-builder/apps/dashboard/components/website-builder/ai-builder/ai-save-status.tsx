'use client'

import { memo, useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { formatRelativeTime } from '@workspace/i18n'
import { AlertCircle, Check, Loader2, RotateCw } from 'lucide-react'
import { useBuilderStore } from '@/lib/builder/store'
import { retryBuilderAutosave } from '@/components/website-builder/use-builder-autosave'
import { cn } from '@/lib/utils'

export const AiSaveStatus = memo(function AiSaveStatus () {
  const t = useTranslations('aiBuilder.saveStatus')
  const locale = useLocale()
  const saveStatus = useBuilderStore((s) => s.saveStatus)
  const isDirty = useBuilderStore((s) => s.isDirty)
  const lastSavedAt = useBuilderStore((s) => s.lastSavedAt)
  const [, force] = useState(0)

  // Re-render every 15s so timestamp stays fresh while idle.
  useEffect(() => {
    if (saveStatus !== 'saved' || !lastSavedAt) return
    const id = setInterval(() => force((n) => n + 1), 15000)
    return () => clearInterval(id)
  }, [saveStatus, lastSavedAt])

  if (saveStatus === 'saving') {
    return (
      <StatusRow className="text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {t('saving')}
      </StatusRow>
    )
  }
  if (saveStatus === 'error') {
    return (
      <StatusRow className="text-destructive">
        <AlertCircle className="size-3.5" />
        {t('failed')}
        <button
          type="button"
          onClick={() => {
            void retryBuilderAutosave()
          }}
          className="ms-1 inline-flex items-center gap-1 rounded-sm border border-destructive/30 px-1.5 py-0.5 text-[11px] font-medium hover:bg-destructive/10"
        >
          <RotateCw className="size-3" />
          {t('retry')}
        </button>
      </StatusRow>
    )
  }
  if (isDirty) {
    return <span className="text-xs text-amber-600 dark:text-amber-500">{t('unsaved')}</span>
  }
  return (
    <StatusRow className="text-muted-foreground">
      <Check className="size-3.5 text-emerald-600" />
      <span>
        {t('saved')}
        {lastSavedAt ? (
          <span className="ms-1 text-muted-foreground/70">· {formatRelativeTime(lastSavedAt, locale)}</span>
        ) : null}
      </span>
    </StatusRow>
  )
})

function StatusRow ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs', className)}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  )
}
