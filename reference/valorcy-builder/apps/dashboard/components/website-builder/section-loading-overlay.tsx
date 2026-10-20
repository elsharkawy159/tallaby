'use client'

import { AlertCircle, CheckCircle2, Loader2, RotateCcw, X } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import type { SectionAiStatus } from '@/lib/builder/store'

const LABELS: Record<SectionAiStatus, string> = {
  preparing: 'Preparing section',
  writing: 'Writing content',
  translating: 'Translating',
  images: 'Finding images',
  ready: 'Section ready',
  error: 'Could not prepare section',
}

export function SectionLoadingOverlay({
  kind,
  error,
  onCancel,
  onRetry,
}: {
  kind: SectionAiStatus
  error?: string
  onCancel?: () => void
  onRetry?: () => void
}) {
  const isDone = kind === 'ready'
  const isError = kind === 'error'
  const label = LABELS[kind]

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-background/35 backdrop-blur-[1px]">
      <div className="pointer-events-auto flex max-w-[min(92%,320px)] items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground shadow-sm">
        {isError ? (
          <AlertCircle className="size-4 shrink-0 text-destructive" />
        ) : isDone ? (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        ) : (
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {isError && error ? error : label}
        </span>
        {isError && onRetry ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-xs"
            onClick={(event) => {
              event.stopPropagation()
              onRetry()
            }}
          >
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        ) : null}
        {!isDone && !isError && onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label="Cancel section preparation"
            onClick={(event) => {
              event.stopPropagation()
              onCancel()
            }}
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
