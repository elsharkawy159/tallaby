import {
  GENERATION_PHASE_ORDER,
  parseGenerationProgress,
  type GenerationPhaseId,
  type GenerationProgress,
  type PhaseState,
} from '@/lib/ai/generation-phases'

/** Shape returned by GET /api/ai/generate-site/status/[generationId]. */
export type GenerationStatus = {
  status: string
  websiteId: string
  jobStatus: string | null
  /** Fine-grained phase currently running (null when terminal or legacy row). */
  phase?: string | null
  /** Durable per-phase progress written by the orchestrator's phase tracker. */
  progress?: unknown
  qaStatus: string | null
  pages: GenerationTaskPage[]
  error: string | null
}

/** One `generation_page_tasks` row as the status route reports it. */
export type GenerationTaskPage = {
  slug: string
  status: string
  name?: string
  orderIndex?: number
  /** Changes whenever the page's staged sections change — drives preview refetches. */
  updatedAt?: string
  sectionCount?: number
}

export const STEP_SEQUENCE = GENERATION_PHASE_ORDER

/** Terminal job statuses — the run is over, one way or another. */
export function isTerminalJobStatus(jobStatus: string | null | undefined): boolean {
  return jobStatus === 'completed' || jobStatus === 'degraded' || jobStatus === 'failed'
}

/**
 * Derive per-phase state from a status response.
 *
 * Prefers the durable `progress` payload (real work, real counters). Falls back
 * to the coarse `jobStatus` for rows written before phase tracking existed, so
 * an in-flight legacy run still shows sensible steps.
 */
export function phasesFromStatus(data: GenerationStatus): PhaseState[] {
  const durable = parseGenerationProgress(data.progress)
  if (durable) return orderPhases(durable)

  return legacyPhases(data)
}

function orderPhases(progress: GenerationProgress): PhaseState[] {
  const byId = new Map(progress.phases.map((p) => [p.id, p]))
  return GENERATION_PHASE_ORDER.map(
    (id) => byId.get(id) ?? { id, status: 'pending' as const }
  )
}

/** Coarse `generation_jobs.status` → the phase it corresponds to. */
function legacyActivePhase(data: GenerationStatus): GenerationPhaseId | null {
  switch (data.jobStatus) {
    case 'queued':
    case 'planning':
      return 'planning'
    case 'generating':
      return 'content'
    case 'seo':
      return 'seo'
    case 'qa':
      return 'review'
    case 'persisting':
      return 'saving'
    case 'completed':
    case 'degraded':
    case 'failed':
      return null
    default:
      // No durable job row yet — fall back to the top-level generation status.
      return data.status === 'failed' || data.status === 'completed' ? null : 'planning'
  }
}

function legacyPhases(data: GenerationStatus): PhaseState[] {
  const active = legacyActivePhase(data)
  if (!active) {
    const done = !isFailed(data)
    return GENERATION_PHASE_ORDER.map((id) => ({
      id,
      status: done ? ('done' as const) : ('pending' as const),
    }))
  }

  const activeIdx = GENERATION_PHASE_ORDER.indexOf(active)
  return GENERATION_PHASE_ORDER.map((id, idx) => {
    if (idx < activeIdx) return { id, status: 'done' as const }
    if (idx > activeIdx) return { id, status: 'pending' as const }

    const state: PhaseState = { id, status: 'running' }
    if (id === 'content' && data.pages.length) {
      state.done = data.pages.filter((p) => p.status === 'succeeded').length
      state.total = data.pages.length
    }
    return state
  })
}

export function isFailed(data: GenerationStatus): boolean {
  return data.status === 'failed' || data.jobStatus === 'failed'
}

export function isComplete(data: GenerationStatus): boolean {
  return (
    data.status === 'completed' ||
    data.jobStatus === 'completed' ||
    data.jobStatus === 'degraded'
  )
}

/** Every phase marked finished — used to fill the checklist on completion. */
export function allPhasesDone(phases: PhaseState[]): PhaseState[] {
  return phases.map((p) =>
    p.status === 'skipped' || p.status === 'done' ? p : { ...p, status: 'done' as const }
  )
}
