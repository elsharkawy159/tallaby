'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

export const PAGE_TITLE_CLASS = 'text-lg font-semibold tracking-tight truncate'
export const PAGE_DESCRIPTION_CLASS = 'text-sm text-muted-foreground mt-1'

type PageHeaderContextValue = {
  title: string | null
  setTitle: (title: string | null) => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

export function PageHeaderProvider ({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)

  const value = useMemo(
    () => ({ title, setTitle }),
    [title],
  )

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeaderContext () {
  const ctx = useContext(PageHeaderContext)
  if (!ctx) {
    throw new Error('usePageHeaderContext must be used within PageHeaderProvider')
  }
  return ctx
}

export function useOptionalPageHeaderContext () {
  return useContext(PageHeaderContext)
}

export function PageDescription ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn(PAGE_DESCRIPTION_CLASS, className)}>
      {children}
    </p>
  )
}

export function PageHeader ({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  const { setTitle } = usePageHeaderContext()

  useEffect(() => {
    setTitle(title)
    return () => setTitle(null)
  }, [title, setTitle])

  if (!description && !actions) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4',
        className,
      )}
    >
      {description ? (
        <div className="min-w-0 flex-1">
          <PageDescription>{description}</PageDescription>
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
