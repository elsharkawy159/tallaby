'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, FileClock, History, ListPlus, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@/lib/utils'
import { DetailsForm } from './details-form'
import { CreateChatPanel, type ChatEntry } from './create-chat-panel'
import { CreateComposer } from './create-composer'
import { BriefQuestionCard } from './brief-question-card'
import { GenerationPhaseList } from './generation-phase-list'
import { BuildTree } from './build-tree'
import { GenerationLiveCanvas, type LivePreviewContext } from './generation-live-canvas'
import { PlanCanvas, type CreditInfo } from './plan-canvas/plan-canvas'
import { useGenerationProgress } from '@/components/website-builder/generation-progress/use-generation-progress'
import {
  cancelSiteGeneration,
  checkDailyGenerationLimit,
  createSiteGeneration,
  enqueueSiteGeneration,
  getSiteGenerationInfo,
  updateSiteGenerationPlan,
} from '@/actions/ai-site-generation-actions'
import {
  analyzeSiteBrief,
  draftSitePlan,
  refineSitePlan,
  regeneratePlanPart,
} from '@/actions/ai-site-brief-actions'
import {
  answersToBrandContext,
  describeAnswer,
  isDeferredAnswer,
  type BriefAnswer,
  type BriefQuestion,
  type BriefUnderstanding,
} from '@/lib/ai/brief-answers'
import { deriveFunctionality, toPlanFunctionality } from '@/lib/ai/plan-functionality'
import { planPartKey, type PlanPartTarget } from '@/lib/ai/plan-ops'
import { validatePlan } from '@/lib/ai/plan-validation'
import { SitePlanStoreProvider, useSitePlanStore, useSitePlanStoreApi } from '@/lib/ai/use-site-plan-store'
import { clearPlanDraft, loadPlanDraft, savePlanDraft, type PlanDraft } from '@/lib/ai/plan-draft-storage'
import type { SiteBrandContext, SiteExtraDetails, WebsitePlan } from '@/lib/ai/site-plan-schema'
import type { ProjectGuesses } from '@/lib/ai/project-guesses'
import { applyPlanDesign, shouldApplyPlanDesign } from '@/lib/ai/plan-design'
import { DeadlineError, withDeadline } from '@/lib/async/with-deadline'

/**
 * AI website creation studio — compact chat on the left, canvas on the right:
 *
 *   describe → (at most 3 questions) → editable blueprint → Approve & Generate → build
 *
 * Everything before approval is free. The blueprint is structured JSON the
 * user edits directly; chat requests and per-item regeneration change it
 * through plan operations, so manual edits survive. Approval reuses the durable
 * pipeline (createSiteGeneration → updateSiteGenerationPlan →
 * enqueueSiteGeneration); a user-supplied plan makes the orchestrator skip its
 * own planner, so the plan the user approved is exactly what gets built.
 */
type Stage =
  | 'describe'
  | 'analyzing'
  | 'questions'
  | 'planning'
  | 'planning-failed'
  | 'plan'
  | 'generating'

const PROMPT_MAX = 2000
const EXAMPLE_KEYS = ['restaurant', 'saas', 'clinic', 'portfolio'] as const
const DRAFT_TASK = 'draft'
const REFINE_TASK = 'refine'
/**
 * Client-side ceilings on the AI calls, a little above the server's own worst
 * case (per-attempt timeout × attempts). Hitting one means the call was lost,
 * not slow — the user gets an error and a retry instead of an endless spinner.
 */
const BRIEF_DEADLINE_MS = 90_000
const PLAN_DEADLINE_MS = 330_000
/** A build with no phase started after this long gets started from the client. */
const RUN_KICKSTART_MS = 20_000

interface SitePlannerWizardProps {
  websiteId: string
  projectId: string
  locale: string
  projectContext: {
    name?: string | null
    industry?: string | null
    description?: string | null
    onboardingBrief?: string | null
    /** Placeholder name / keyword-matched industry from the hero handoff. */
    guessed?: ProjectGuesses
  }
  previewContext: LivePreviewContext
  /** A prompt handed off from outside the studio (homepage hero). */
  initialPrompt?: string
  /** Submit `initialPrompt` as soon as the studio opens. */
  autoStart?: boolean
  /** A build already running for this site (e.g. the studio was refreshed mid-build). */
  activeRun?: ActiveRun | null
}

export interface ActiveRun {
  id: string
  prompt: string
  brandContext: SiteBrandContext
  plan: WebsitePlan
}

// A module counter alone collides once the module is re-evaluated (Fast
// Refresh) while the chat log keeps its old ids — the random part keeps keys unique.
let entrySeq = 0
const entryPrefix = Math.random().toString(36).slice(2, 8)
function entry (role: ChatEntry['role'], text: string, tone?: ChatEntry['tone']): ChatEntry {
  entrySeq += 1
  return { id: `e${entryPrefix}${entrySeq}`, role, text, tone }
}

/** Each studio gets its own plan store — see `createSitePlanStore`. */
export function SitePlannerWizard (props: SitePlannerWizardProps) {
  return (
    <SitePlanStoreProvider>
      <SitePlannerStudio {...props} />
    </SitePlanStoreProvider>
  )
}

function SitePlannerStudio ({
  websiteId,
  projectId,
  projectContext,
  previewContext,
  initialPrompt,
  autoStart = false,
  activeRun = null,
}: SitePlannerWizardProps) {
  const t = useTranslations('aiCreate')
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('describe')
  const [draft, setDraft] = useState(
    initialPrompt ?? projectContext.description ?? projectContext.onboardingBrief ?? ''
  )
  const autoStarted = useRef(false)
  const [details, setDetails] = useState<SiteExtraDetails>({})
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [log, setLog] = useState<ChatEntry[]>(() => [entry('assistant', t('chat.welcome'))])

  const [prompt, setPrompt] = useState('')
  const [understood, setUnderstood] = useState<BriefUnderstanding | null>(null)
  const [questions, setQuestions] = useState<BriefQuestion[]>([])
  const [answers, setAnswers] = useState<BriefAnswer[]>([])
  const [brandContext, setBrandContext] = useState<SiteBrandContext>({})
  const [savedDraft, setSavedDraft] = useState<PlanDraft | null>(null)

  const planStore = useSitePlanStoreApi()
  const plan = useSitePlanStore((s) => s.plan)
  const manualEdits = useSitePlanStore((s) => s.manualEdits)
  const busy = useSitePlanStore((s) => s.busy)
  const setPlan = useSitePlanStore((s) => s.setPlan)
  const clearPlan = useSitePlanStore((s) => s.clearPlan)
  const applyAi = useSitePlanStore((s) => s.applyAi)
  const applyRegenerated = useSitePlanStore((s) => s.applyRegenerated)
  const runAiTask = useSitePlanStore((s) => s.runAiTask)

  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
  const [approving, setApproving] = useState(false)
  const approveLock = useRef(false)
  const [cancelling, setCancelling] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [activeGenerationId, setActiveGenerationId] = useState<string | null>(null)
  /** The run shown in the live canvas — kept after a failure so partial work stays visible. */
  const [runId, setRunId] = useState<string | null>(null)
  const generationIdRef = useRef<string | null>(null)

  const say = useCallback((...entries: ChatEntry[]) => setLog((prev) => [...prev, ...entries]), [])
  const aiErrorMessage = (err: unknown) =>
    err instanceof DeadlineError ? t('errors.timeout') : t('errors.generic')

  // The plan store belongs to this studio instance (see `SitePlannerWizard`),
  // so it starts empty — a blueprint saved for THIS site is offered back instead.
  useEffect(() => {
    setSavedDraft(loadPlanDraft(websiteId))
  }, [websiteId])

  // Keep the unapproved blueprint safe across a refresh.
  useEffect(() => {
    if (stage !== 'plan' || !plan || !prompt) return
    savePlanDraft(websiteId, { plan, manualEdits, prompt, brandContext })
  }, [stage, plan, manualEdits, prompt, brandContext, websiteId])

  // Opening the studio, once:
  //  1. a build is already running for this site (refreshed mid-build) → follow it
  //  2. a hero handoff whose blueprint was already drafted → reopen that plan
  //     instead of paying for (and waiting on) the brief + plan again
  //  3. a fresh hero handoff → start immediately
  // The handoff params are removed through the router — a bare
  // `history.replaceState` is restored by the App Router, so a reload used to
  // re-submit the prompt and hide the saved plan.
  //
  // ORDER MATTERS: the `router.replace` must be dispatched before ANY Server
  // Action. A navigation that arrives while an action is pending discards that
  // action without updating the router queue's tail, so every action queued
  // behind it until the navigation lands is silently dropped — the brief call
  // never left the browser and the studio spun on "Reading your request…"
  // forever. Actions queued AFTER the navigation run normally once it lands.
  useEffect(() => {
    if (autoStarted.current) return
    autoStarted.current = true
    openStudio()
    getSiteGenerationInfo()
      .then((info) =>
        setCreditInfo({ cost: info.cost, creditsRemaining: info.creditsRemaining, message: info.message })
      )
      .catch(() => {})
    // Runs once, on mount — later prop changes come from our own URL cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openStudio () {
    if (activeRun) {
      setPrompt(activeRun.prompt)
      setBrandContext(activeRun.brandContext)
      setPlan(activeRun.plan)
      setDraft('')
      generationIdRef.current = activeRun.id
      say(entry('assistant', t('chat.resumedBuild')))
      setStage('generating')
      setRunId(activeRun.id)
      setActiveGenerationId(activeRun.id)
      return
    }
    if (!autoStart || !initialPrompt) return
    router.replace(`/website-builder/new/${websiteId}`, { scroll: false })

    const saved = loadPlanDraft(websiteId)
    if (saved && saved.prompt.trim() === initialPrompt.trim()) {
      setPrompt(saved.prompt)
      setBrandContext(saved.brandContext)
      setPlan(saved.plan, { manualEdits: saved.manualEdits })
      setSavedDraft(null)
      setDraft('')
      say(entry('user', saved.prompt), entry('assistant', t('chat.planRestored')))
      setStage('plan')
      return
    }
    void handleDescribe()
  }

  const {
    phases,
    degraded,
    buildPages,
    buildCollections,
    taskPages,
    reset: resetProgress,
  } = useGenerationProgress({
    generationId: activeGenerationId,
    onComplete: () => {
      const id = generationIdRef.current
      say(entry('assistant', t('chat.completed')))
      router.push(`/website-builder/ai/${websiteId}?view=overview${id ? `&run=${id}` : ''}`)
    },
    onFailed: (message) => failRun(message),
  })

  function failRun (message: string) {
    setActiveGenerationId(null)
    setGenError(message)
    say(entry('assistant', t('chat.failed', { message }), 'error'))
  }

  /**
   * Run a queued generation inside a real request (work detached from a Server
   * Action is discarded when its response flushes). Not awaited — the request
   * stays open for the whole build and progress arrives through polling — but
   * its answer is checked: a run that couldn't even start (auth, a crash, a
   * timeout) used to leave "Creating your website 0 / 7" spinning.
   */
  function startRun (id: string) {
    void fetch(`/api/ai/generate-site/run/${id}`, { method: 'POST' })
      .then((res) => {
        // `redirected`: an expired session lands on the login page with a 200.
        if ((!res.ok || res.redirected) && generationIdRef.current === id) failRun(t('errors.buildStart'))
      })
      // The connection dropped mid-build — polling still reports the outcome.
      .catch(() => {})
  }

  // A queued run nobody picked up (the run request was lost, or the Inngest
  // engine has no worker) is kicked off from here once. The DB claim makes a
  // late second runner a no-op, so this can never build the site twice.
  const runStarted = phases.some((p) => p.status !== 'pending')
  const kickedRun = useRef<string | null>(null)
  useEffect(() => {
    const id = activeGenerationId
    if (!id || stage !== 'generating' || runStarted || kickedRun.current === id) return
    const timer = setTimeout(() => {
      kickedRun.current = id
      startRun(id)
    }, RUN_KICKSTART_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenerationId, stage, runStarted])

  const brief = useMemo(
    () => ({
      features: brandContext.features,
      industry: brandContext.industry,
      prompt,
    }),
    [brandContext.features, brandContext.industry, prompt]
  )

  const redoing = busy.includes(DRAFT_TASK) && stage === 'plan'
  const refining = busy.includes(REFINE_TASK)
  const regenerating = busy.some((key) => key.startsWith('regen:'))

  // ── Planning ─────────────────────────────────────────────────────────────
  async function runPlanning (
    nextPrompt: string,
    nextUnderstood: BriefUnderstanding | null,
    nextQuestions: BriefQuestion[],
    nextAnswers: BriefAnswer[]
  ) {
    const base: SiteBrandContext = {
      ...details,
      prompt: nextPrompt,
      // Guessed values are placeholders — the analyst's understanding and the
      // user's answers must win over them.
      businessName: projectContext.guessed?.name ? undefined : projectContext.name ?? undefined,
      industry: projectContext.guessed?.industry ? undefined : projectContext.industry ?? undefined,
    }
    const context = answersToBrandContext(base, nextUnderstood, nextQuestions, nextAnswers)
    setBrandContext(context)
    setStage('planning')

    const res = await runAiTask(DRAFT_TASK, () =>
      withDeadline(draftSitePlan({ websiteId, prompt: nextPrompt, brandContext: context }), PLAN_DEADLINE_MS)
    )
    if (res.status === 'duplicate') return
    if (res.status === 'error' || !res.value.ok) {
      const message =
        res.status === 'error' ? aiErrorMessage(res.error) : !res.value.ok ? res.value.error : t('errors.generic')
      say(entry('assistant', message, 'error'))
      setStage('planning-failed')
      return
    }
    setPlan(res.value.plan)
    say(entry('assistant', t('chat.planReady')))
    setStage('plan')
  }

  // ── Describe → analyze ───────────────────────────────────────────────────
  async function handleDescribe () {
    const typed = draft.trim()
    const nextPrompt = typed || fallbackPrompt(projectContext)
    setPrompt(nextPrompt)
    setDraft('')
    say(entry('user', typed || t('chat.usingProjectDetails')))
    setStage('analyzing')

    const res = await withDeadline(
      analyzeSiteBrief({ websiteId, prompt: nextPrompt, details }),
      BRIEF_DEADLINE_MS
    ).catch((err: unknown) => ({ ok: false as const, error: aiErrorMessage(err) }))
    if (!res.ok) {
      say(entry('assistant', res.error, 'error'))
      setDraft(typed)
      setStage('describe')
      return
    }

    setUnderstood(res.understood)
    say(entry('assistant', t('chat.understood', { summary: res.understood.summary })))

    if (res.questions.length === 0) {
      await runPlanning(nextPrompt, res.understood, [], [])
      return
    }
    setQuestions(res.questions)
    setAnswers([])
    say(entry('assistant', t('chat.askingIntro'), 'muted'))
    setStage('questions')
  }

  function handleResumeDraft () {
    if (!savedDraft) return
    setPrompt(savedDraft.prompt)
    setBrandContext(savedDraft.brandContext)
    setPlan(savedDraft.plan, { manualEdits: savedDraft.manualEdits })
    setSavedDraft(null)
    setDraft('')
    say(entry('assistant', t('chat.planRestored')))
    setStage('plan')
  }

  function handleDiscardDraft () {
    clearPlanDraft(websiteId)
    setSavedDraft(null)
  }

  // ── Questions ────────────────────────────────────────────────────────────
  function handleAnswer (answer: BriefAnswer) {
    const question = questions[answers.length]
    if (!question) return
    const next = [...answers, answer]
    setAnswers(next)
    say(
      entry('assistant', question.question),
      entry(
        'user',
        isDeferredAnswer(answer) ? t('questions.youDecide') : describeAnswer(question, answer)
      )
    )
    if (next.length >= questions.length) {
      void runPlanning(prompt, understood, questions, next)
    }
  }

  function handleSkipQuestions () {
    void runPlanning(prompt, understood, questions, answers)
  }

  // ── Plan review ──────────────────────────────────────────────────────────
  /**
   * A targeted change from chat. The server returns plan operations; they are
   * applied to the CURRENT plan (edits made while the model worked included),
   * and never overwrite a manual edit unless the request names that item.
   */
  async function handleRefine () {
    const request = draft.trim()
    const current = planStore.getState().plan
    if (!request || !current) return
    setDraft('')
    say(entry('user', request))

    const res = await runAiTask(REFINE_TASK, () =>
      withDeadline(
        refineSitePlan({ websiteId, prompt, brandContext, plan: current, changeRequest: request }),
        PLAN_DEADLINE_MS
      )
    )
    if (res.status === 'duplicate') {
      say(entry('assistant', t('chat.alreadyWorking'), 'muted'))
      setDraft(request)
      return
    }
    if (res.status === 'error' || !res.value.ok) {
      const message = res.status === 'error' ? aiErrorMessage(res.error) : !res.value.ok ? res.value.error : t('errors.generic')
      say(entry('assistant', `${message} ${t('chat.planUnchanged')}`, 'error'))
      setDraft(request)
      return
    }

    const outcome = applyAi(res.value.ops, request)
    const kept = outcome?.skipped.filter((s) => s.reason === 'protected').length ?? 0
    if (!outcome?.applied.length) {
      say(entry('assistant', res.value.reply || t('chat.nothingChanged')))
    } else {
      say(entry('assistant', res.value.reply || t('chat.planUpdated')))
    }
    if (kept) say(entry('assistant', t('chat.refineSkipped', { count: kept }), 'muted'))
  }

  async function handleRegenerate (target: PlanPartTarget) {
    const current = planStore.getState().plan
    if (!current) return
    const name = partName(current, target)

    const res = await runAiTask(planPartKey(target), () =>
      withDeadline(regeneratePlanPart({ websiteId, prompt, brandContext, plan: current, target }), PLAN_DEADLINE_MS)
    )
    if (res.status === 'duplicate') return
    if (res.status === 'error' || !res.value.ok) {
      const message = t('chat.regenerateFailed', { name })
      say(entry('assistant', message, 'error'))
      toast.error(message)
      return
    }
    const outcome = applyRegenerated(target, res.value.ops)
    if (outcome?.applied.length) say(entry('assistant', t('chat.regenerated', { name })))
    else say(entry('assistant', t('chat.regenerateFailed', { name }), 'error'))
  }

  async function handleRedo () {
    const current = planStore.getState().plan
    const res = await runAiTask(DRAFT_TASK, () =>
      withDeadline(draftSitePlan({ websiteId, prompt, brandContext, basePlan: current }), PLAN_DEADLINE_MS)
    )
    if (res.status === 'duplicate') return
    if (res.status === 'error' || !res.value.ok) {
      const message = res.status === 'error' ? aiErrorMessage(res.error) : !res.value.ok ? res.value.error : t('errors.generic')
      say(entry('assistant', `${message} ${t('chat.planUnchanged')}`, 'error'))
      return
    }
    setPlan(res.value.plan)
    say(entry('assistant', t('chat.planUpdated')))
  }

  // ── Approve → generate ───────────────────────────────────────────────────
  async function handleApprove () {
    const current = planStore.getState().plan
    // A ref, not state: two clicks in the same tick must not start two runs.
    if (!current || approveLock.current) return
    if (!validatePlan(current).valid) {
      toast.error(t('chat.invalidPlan'))
      return
    }
    approveLock.current = true
    setApproving(true)
    setGenError(null)
    resetProgress()

    try {
      const limit = await checkDailyGenerationLimit()
      if (!limit.allowed) {
        const message = t('errors.dailyLimit', { used: limit.used, limit: limit.limit })
        say(entry('assistant', message, 'error'))
        toast.error(message)
        return
      }

      const approvedPlan: WebsitePlan = {
        ...current,
        functionality: toPlanFunctionality(deriveFunctionality(current, brief)),
      }

      const { id, cached, active } = await createSiteGeneration({
        websiteId,
        projectId,
        prompt,
        brandContext,
        plan: approvedPlan,
      })
      generationIdRef.current = id

      // This exact request already produced a finished site — go straight to it.
      if (cached) {
        clearPlanDraft(websiteId)
        router.push(`/website-builder/ai/${websiteId}?view=overview&run=${id}`)
        return
      }

      // `active`: the same approved plan is already building (another tab, a
      // retried click) — follow that run instead of starting a second one.
      if (!active) {
        await updateSiteGenerationPlan(id, approvedPlan)
        const { runInline } = await enqueueSiteGeneration(id)

        // In-process engine: the pipeline must run inside a real request (work
        // detached from a Server Action is discarded when its response flushes).
        // Fire it without awaiting — progress arrives through the polling hook.
        if (runInline) startRun(id)
      }

      clearPlanDraft(websiteId)
      say(entry('assistant', t('chat.generating')))
      setStage('generating')
      setRunId(id)
      setActiveGenerationId(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.generic')
      say(entry('assistant', message, 'error'))
      toast.error(message)
    } finally {
      approveLock.current = false
      setApproving(false)
    }
  }

  async function handleCancel () {
    setCancelling(true)
    setActiveGenerationId(null)
    try {
      if (generationIdRef.current) await cancelSiteGeneration(generationIdRef.current)
      toast.info(t('chat.cancelled'))
      say(entry('assistant', t('chat.cancelled'), 'muted'))
    } catch {
      // The run may already be over — either way the user returns to the plan.
    } finally {
      setCancelling(false)
      generationIdRef.current = null
      resetProgress()
      setStage('plan')
    }
  }

  function handleBackToPlan () {
    setGenError(null)
    generationIdRef.current = null
    resetProgress()
    setStage('plan')
  }

  function handleStartOver () {
    clearPlan()
    setUnderstood(null)
    setQuestions([])
    setAnswers([])
    setDraft(prompt)
    setStage('describe')
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const busyText =
    stage === 'analyzing'
      ? t('chat.analyzing')
      : stage === 'planning'
        ? t('chat.planning')
        : refining || redoing
          ? t('chat.replanning')
          : regenerating
            ? t('chat.regenerating')
            : null
  const entries: ChatEntry[] = busyText
    ? [...log, { id: 'busy', role: 'assistant', text: busyText, pending: true }]
    : log

  const currentQuestion = stage === 'questions' ? questions[answers.length] : undefined
  const hasDetails = Boolean(
    details.additionalDetails?.trim() ||
      details.services?.length ||
      details.features?.length ||
      details.contact?.email ||
      details.contact?.phone ||
      details.contact?.address
  )

  let active: React.ReactNode = null
  if (currentQuestion) {
    active = (
      <BriefQuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        index={answers.length}
        total={questions.length}
        onAnswer={handleAnswer}
        onSkipAll={handleSkipQuestions}
      />
    )
  } else if (stage === 'planning-failed') {
    active = (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void runPlanning(prompt, understood, questions, answers)}>
          {t('chat.retryPlan')}
        </Button>
        <Button size="sm" variant="outline" onClick={handleStartOver}>
          {t('chat.startOver')}
        </Button>
      </div>
    )
  } else if (stage === 'generating') {
    active = (
      <div className="space-y-2">
        <GenerationPhaseList phases={phases} degraded={degraded} />
        <BuildTree pages={buildPages} collections={buildCollections} />
        {genError ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void handleApprove()} disabled={approving}>
              {t('chat.retry')}
            </Button>
            <Button size="sm" variant="outline" onClick={handleBackToPlan}>
              {t('chat.backToPlan')}
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => void handleCancel()}
            disabled={cancelling}
          >
            {cancelling ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {cancelling ? t('chat.cancelling') : t('chat.cancel')}
          </Button>
        )}
      </div>
    )
  }

  let composer: React.ReactNode = null
  if (stage === 'describe' || stage === 'analyzing') {
    composer = (
      <CreateComposer
        value={draft}
        onChange={setDraft}
        onSubmit={() => void handleDescribe()}
        placeholder={t('describe.placeholder')}
        busy={stage === 'analyzing'}
        allowEmpty
        maxLength={PROMPT_MAX}
        autoFocus
        footer={
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-1 text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {hasDetails ? <Check className="size-3.5 text-primary" /> : <ListPlus className="size-3.5" />}
            {hasDetails ? t('describe.detailsAdded') : t('describe.addDetails')}
          </button>
        }
      />
    )
  } else if (stage === 'plan') {
    composer = (
      <CreateComposer
        value={draft}
        onChange={setDraft}
        onSubmit={() => void handleRefine()}
        placeholder={t('chat.refinePlaceholder')}
        busy={refining}
        disabled={approving || redoing}
        maxLength={500}
      />
    )
  }

  let canvas: React.ReactNode
  if (stage === 'plan') {
    canvas = (
      <PlanCanvas
        brief={brief}
        onApprove={() => void handleApprove()}
        approving={approving}
        onRedo={() => void handleRedo()}
        redoing={redoing}
        aiBusy={refining || regenerating}
        creditInfo={creditInfo}
        onRegenerate={(target) => void handleRegenerate(target)}
        currentDesign={previewContext.designSystem}
      />
    )
  } else if (stage === 'generating') {
    canvas = (
      <GenerationLiveCanvas
        websiteId={websiteId}
        generationId={runId}
        plan={plan}
        buildPages={buildPages}
        taskPages={taskPages}
        chromeReady={phases.some((p) => p.id === 'seo' && p.status === 'done')}
        context={
          shouldApplyPlanDesign(plan?.design)
            ? { ...previewContext, designSystem: applyPlanDesign(previewContext.designSystem, plan.design) }
            : previewContext
        }
      />
    )
  } else if (stage === 'planning') {
    canvas = <PlanSkeleton />
  } else {
    canvas = (
      <DescribeHero
        stage={stage}
        onPickExample={(text) => setDraft(text)}
        disabled={stage !== 'describe'}
        savedDraft={stage === 'describe' ? savedDraft : null}
        onResumeDraft={handleResumeDraft}
        onDiscardDraft={handleDiscardDraft}
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t('header.back')}
        </Button>
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <span className="truncate">{projectContext.name || t('header.title')}</span>
        </div>
        <div className="flex-1" />
        <StageSteps stage={stage} />
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href={`/website-builder/ai/${websiteId}/history`}>
            <History className="size-4" />
            <span className="hidden sm:inline">{t('header.history')}</span>
          </Link>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <CreateChatPanel
          className="h-[45dvh] shrink-0 border-b lg:h-auto lg:w-[320px] lg:border-b-0 lg:border-e"
          entries={entries}
          active={active}
          composer={composer}
        />
        <main className="min-h-0 flex-1 overflow-hidden bg-muted/30">{canvas}</main>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('describe.detailsTitle')}</DialogTitle>
            <DialogDescription>{t('describe.detailsDescription')}</DialogDescription>
          </DialogHeader>
          <DetailsForm value={details} onChange={setDetails} embedded />
          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>{t('describe.detailsDone')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** A readable name for the part being regenerated, for chat messages. */
function partName (plan: WebsitePlan, target: PlanPartTarget): string {
  if (target.kind === 'collection') return plan.cmsCollections?.find((c) => c.id === target.collectionId)?.name ?? ''
  const page = plan.pages.find((p) => p.id === target.pageId)
  if (target.kind === 'page') return page?.name ?? ''
  const section = page?.sections.find((s) => s.id === target.sectionId)
  return section?.label || section?.type || ''
}

const STEP_KEYS = ['describe', 'questions', 'plan', 'build'] as const

function stageStep (stage: Stage): number {
  switch (stage) {
    case 'describe':
    case 'analyzing':
      return 0
    case 'questions':
      return 1
    case 'generating':
      return 3
    default:
      return 2
  }
}

function StageSteps ({ stage }: { stage: Stage }) {
  const t = useTranslations('aiCreate.steps')
  const current = stageStep(stage)
  return (
    <ol className="hidden items-center gap-1 md:flex" aria-label={t('label')}>
      {STEP_KEYS.map((key, i) => (
        <li key={key} className="flex items-center gap-1" aria-current={i === current ? 'step' : undefined}>
          {i > 0 && <span className="h-px w-4 bg-border" aria-hidden />}
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs transition-colors',
              i === current && 'bg-primary text-primary-foreground',
              i < current && 'text-primary',
              i > current && 'text-muted-foreground'
            )}
          >
            {t(key)}
          </span>
        </li>
      ))}
    </ol>
  )
}

function DescribeHero ({
  stage,
  onPickExample,
  disabled,
  savedDraft,
  onResumeDraft,
  onDiscardDraft,
}: {
  stage: Stage
  onPickExample: (text: string) => void
  disabled: boolean
  savedDraft: PlanDraft | null
  onResumeDraft: () => void
  onDiscardDraft: () => void
}) {
  const t = useTranslations('aiCreate.describe')
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6 sm:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl text-center"
      >
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {stage === 'analyzing' ? <Loader2 className="size-6 animate-spin" /> : <Sparkles className="size-6" />}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{t('subtitle')}</p>

        {savedDraft && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 text-start">
            <FileClock className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t('resumeTitle')}</p>
              <p className="truncate text-xs text-muted-foreground" dir="auto">
                {t('resumeHint', {
                  pages: savedDraft.plan.pages.length,
                  date: new Date(savedDraft.savedAt),
                })}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={onDiscardDraft}>
              {t('discard')}
            </Button>
            <Button size="sm" onClick={onResumeDraft}>
              {t('resume')}
            </Button>
          </div>
        )}

        <p className="mt-8 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('examplesLabel')}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {EXAMPLE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onPickExample(t(`examples.${key}`))}
              className="rounded-xl border bg-card px-3.5 py-3 text-start text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {t(`examples.${key}`)}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function PlanSkeleton () {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b px-4 py-3 sm:px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="flex gap-4 border-b px-4 py-2 sm:px-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-5 w-16" />
        ))}
      </div>
      <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full" />
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-20" />
            {[0, 1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <Skeleton key={j} className="h-7 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Used when the user leaves the box empty — onboarding already told us enough. */
function fallbackPrompt (ctx: SitePlannerWizardProps['projectContext']): string {
  const name = ctx?.guessed?.name ? undefined : ctx?.name?.trim()
  const industry = ctx?.guessed?.industry ? undefined : ctx?.industry?.trim()
  return `A professional website for this ${industry || 'business'}${
    name ? ` called "${name}"` : ''
  }, with real content, SEO metadata, and everything ready to publish.`
}
