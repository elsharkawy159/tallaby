'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, Check, Circle, Database, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sectionProgressCounts,
  type BuildItemStatus,
  type CollectionProgress,
  type PageProgress,
} from '@/lib/ai/generation-phases'

export function BuildStatusIcon ({ status, className }: { status: BuildItemStatus; className?: string }) {
  const base = cn('size-4 shrink-0', className)
  switch (status) {
    case 'done':
      return <Check className={cn(base, 'text-primary')} aria-hidden />
    case 'running':
      return <Loader2 className={cn(base, 'animate-spin text-primary')} aria-hidden />
    case 'failed':
      return <AlertCircle className={cn(base, 'text-destructive')} aria-hidden />
    default:
      return <Circle className={cn(base, 'text-muted-foreground/50')} aria-hidden />
  }
}

/**
 * The page → section build tree: which page the AI is creating, which of its
 * sections are written, and "12 / 18 sections completed" — all from the run's
 * durable progress, never estimated.
 */
export function BuildTree ({
  pages,
  collections = [],
}: {
  pages: PageProgress[]
  collections?: CollectionProgress[]
}) {
  const t = useTranslations('aiCreate.build')
  if (!pages.length && !collections.length) return null
  const { done, total } = sectionProgressCounts(pages)

  return (
    <div className="rounded-2xl border bg-card p-3.5 text-card-foreground shadow-sm">
      {collections.length > 0 && (
        <div className="mb-3 border-b pb-3">
          <p className="mb-2 text-xs font-medium">{t('collectionsTitle')}</p>
          <ol className="space-y-1.5">
            {collections.map((collection) => (
              <li key={collection.key} className="flex items-center gap-2 text-sm">
                <BuildStatusIcon status={collection.status} />
                <Database className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className={cn('min-w-0 flex-1 truncate', collection.status === 'pending' && 'text-muted-foreground')}>
                  {collection.status === 'running'
                    ? t('creatingCollection', { name: collection.name })
                    : collection.name}
                </span>
                {collection.status === 'done' && typeof collection.items === 'number' && (
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {t('collectionItems', { count: collection.items })}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="mb-2.5 flex items-center justify-between gap-2 text-xs font-medium">
        <span>{t('title')}</span>
        <span className="tabular-nums text-muted-foreground">{t('sectionsCompleted', { done, total })}</span>
      </div>
      <ol className="space-y-2">
        {pages.map((page) => (
          <li key={page.slug}>
            <div className="flex items-center gap-2 text-sm">
              <BuildStatusIcon status={page.status} />
              <span className={cn('min-w-0 truncate', page.status === 'pending' && 'text-muted-foreground')}>
                {page.status === 'running' ? t('creatingPage', { name: page.name }) : page.name}
              </span>
            </div>
            {page.status === 'running' && page.sections.length > 0 && (
              <ol className="ms-2 mt-1.5 space-y-1 border-s ps-4">
                {page.sections.map((section) => (
                  <li key={section.key} className="flex items-center gap-2 text-xs">
                    <BuildStatusIcon status={section.status} className="size-3.5" />
                    <span className={cn('min-w-0 truncate', section.status === 'pending' && 'text-muted-foreground')}>
                      {section.label}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {page.status === 'failed' && (
              <p className="ms-6 mt-0.5 text-xs text-destructive">{t('pageFailed')}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
