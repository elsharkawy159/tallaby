'use client'

import { useEffect, useRef, useState } from 'react'
import {
  GENERATION_PHASE_ORDER,
  parseGenerationProgress,
  type CollectionProgress,
  type PageProgress,
  type PhaseState,
} from '@/lib/ai/generation-phases'
import {
  allPhasesDone,
  isComplete,
  isFailed,
  phasesFromStatus,
  type GenerationStatus,
  type GenerationTaskPage,
} from './status-mapping'

const POLL_INTERVAL_MS = 2000
const DEFAULT_MAX_DURATION_MS = 10 * 60 * 1000

function pendingPhases(): PhaseState[] {
  return GENERATION_PHASE_ORDER.map((id) => ({ id, status: 'pending' as const }))
}

type Snapshot = {
  runId: string | null
  phases: PhaseState[]
  degraded: boolean
  /** Per-page / per-section build tree (from `progress.pages`). */
  buildPages: PageProgress[]
  /** Per-collection CMS build list (from `progress.collections`). */
  buildCollections: CollectionProgress[]
  /** Raw page-task rows — their `updatedAt` tells the live preview to refetch. */
  taskPages: GenerationTaskPage[]
}

function emptySnapshot(): Snapshot {
  return {
    runId: null,
    phases: pendingPhases(),
    degraded: false,
    buildPages: [],
    buildCollections: [],
    taskPages: [],
  }
}

/**
 * Polls the durable generation status and exposes real per-phase progress.
 *
 * Every phase the orchestrator writes (planning → sections → content → images →
 * seo → review → saving) is surfaced as it happens; the run is only considered
 * over when the job reaches a terminal state, so the UI never claims a site is
 * ready before it is.
 *
 * Pass `generationId: null` to stay idle (nothing is polled).
 */
export function useGenerationProgress({
  generationId,
  onComplete,
  onFailed,
  onTimeout,
  maxDurationMs = DEFAULT_MAX_DURATION_MS,
}: {
  generationId: string | null
  onComplete?: (data: GenerationStatus) => void
  onFailed?: (message: string, data: GenerationStatus | null) => void
  /** Called when the run exceeds `maxDurationMs`. Defaults to `onFailed`. */
  onTimeout?: () => void
  maxDurationMs?: number
}): {
  phases: PhaseState[]
  degraded: boolean
  buildPages: PageProgress[]
  buildCollections: CollectionProgress[]
  taskPages: GenerationTaskPage[]
  reset: () => void
} {
  // Progress is stored alongside the run it came from, so switching runs (a
  // retry starts a NEW generation id) can never show the previous run's state.
  // A failed run keeps its last snapshot (runId stays set) until reset.
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot)

  const current = snapshot.runId !== null && (snapshot.runId === generationId || generationId === null)
    ? snapshot
    : emptySnapshot()

  // Keep callbacks in refs so re-renders don't restart the poll loop.
  const onCompleteRef = useRef(onComplete)
  const onFailedRef = useRef(onFailed)
  const onTimeoutRef = useRef(onTimeout)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onFailedRef.current = onFailed
    onTimeoutRef.current = onTimeout
  })

  useEffect(() => {
    if (!generationId) return

    let stopped = false
    const startedAt = Date.now()

    const apply = (data: GenerationStatus, phases: PhaseState[], degraded?: boolean) =>
      setSnapshot((prev) => ({
        runId: generationId,
        phases,
        degraded: degraded ?? (prev.runId === generationId ? prev.degraded : false),
        buildPages: parseGenerationProgress(data.progress)?.pages ?? [],
        buildCollections: parseGenerationProgress(data.progress)?.collections ?? [],
        taskPages: [...(data.pages ?? [])].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        ),
      }))

    async function poll() {
      while (!stopped) {
        if (Date.now() - startedAt > maxDurationMs) {
          if (onTimeoutRef.current) onTimeoutRef.current()
          else onFailedRef.current?.('Generation timed out. Please try again.', null)
          return
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        if (stopped) return

        let data: GenerationStatus
        try {
          const res = await fetch(`/api/ai/generate-site/status/${generationId}`, {
            cache: 'no-store',
          })
          if (!res.ok) continue // transient — keep polling
          data = (await res.json()) as GenerationStatus
        } catch {
          continue // network blip — keep polling
        }
        if (stopped) return

        const next = phasesFromStatus(data)

        if (isFailed(data)) {
          apply(data, next)
          onFailedRef.current?.(data.error || 'Generation failed', data)
          return
        }

        if (isComplete(data)) {
          apply(data, allPhasesDone(next), data.jobStatus === 'degraded')
          onCompleteRef.current?.(data)
          return
        }

        apply(data, next)
      }
    }

    void poll()
    return () => {
      stopped = true
    }
  }, [generationId, maxDurationMs])

  return {
    phases: current.phases,
    degraded: current.degraded,
    buildPages: current.buildPages,
    buildCollections: current.buildCollections,
    taskPages: current.taskPages,
    reset: () => setSnapshot(emptySnapshot()),
  }
}
