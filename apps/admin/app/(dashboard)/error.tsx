'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'

/**
 * Without this, any thrown error inside a dashboard page/Suspense boundary
 * (a timed-out Supabase call, a DB statement_timeout, ...) fell through to
 * Next's generic unstyled crash page instead of something recoverable.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[dashboard]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          This page failed to load — often a slow or unreachable database/auth
          request. Try again.
        </p>
      </div>
      <Button onClick={() => reset()} variant="outline" className="gap-2">
        <RotateCw className="size-4" />
        Retry
      </Button>
    </div>
  )
}
