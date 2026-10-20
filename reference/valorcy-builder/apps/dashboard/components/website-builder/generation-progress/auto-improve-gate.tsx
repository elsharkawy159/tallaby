'use client'

import { useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cancelSiteGeneration } from '@/actions/ai-site-generation-actions'
import { GenerationProgressShell } from './generation-progress-shell'
import { useGenerationProgress } from './use-generation-progress'

/**
 * Wraps the AI builder while a generation run is in flight (entered via
 * `?generation=<id>`, e.g. resuming a run started in the wizard). Polls the
 * durable status and shows the same honest phase-by-phase progress as the
 * wizard; on success it refreshes the route (so the server component re-reads
 * the freshly populated pages) and reveals the builder.
 *
 * A failed or stalled run is NOT silently swallowed. It used to call the same
 * `finish()` as success, which dropped the user into the editor mid-run and made
 * a pipeline that died in phase 1 look like "it skipped all the steps". The
 * failure is now shown on the progress screen, with opening the builder anyway
 * left as the user's choice.
 */
export function AutoImproveGate({
  generationId,
  children,
}: {
  generationId: string
  children: ReactNode
}) {
  const router = useRouter()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const cancelledRef = useRef(false)

  function finish() {
    // Re-fetch the server component so `children` reflect the new page content,
    // then reveal the builder.
    router.refresh()
    setDone(true)
  }

  const { phases, degraded } = useGenerationProgress({
    generationId: done || cancelledRef.current || error ? null : generationId,
    onComplete: finish,
    onFailed: (message) => {
      setError(message || 'Generation failed before your site was finished.')
    },
    onTimeout: () => {
      setError('Generation is taking longer than expected and may have stopped.')
    },
  })

  async function handleCancel() {
    setCancelling(true)
    cancelledRef.current = true
    try {
      await cancelSiteGeneration(generationId)
    } catch {
      // ignore — reveal the builder regardless
    } finally {
      setCancelling(false)
      finish()
    }
  }

  if (done) return <>{children}</>

  return (
    <GenerationProgressShell
      phases={phases}
      degraded={degraded}
      error={error}
      onBack={error ? finish : undefined}
      backLabel="Open builder anyway"
      onCancel={error ? undefined : handleCancel}
      cancelling={cancelling}
    />
  )
}
