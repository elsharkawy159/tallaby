'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2, Coins, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs'
import { cn } from '@/lib/utils'
import { sectionRegistry } from '@/components/sections'
import type { SectionCategory } from '@/components/sections/registry.types'
import { useSitePlanStore, useSitePlanStoreApi } from '@/lib/ai/use-site-plan-store'
import {
  deriveFunctionality,
  functionalityToggleOps,
  type FunctionalityId,
} from '@/lib/ai/plan-functionality'
import { defaultCollectionForCategory, planId } from '@/lib/ai/plan-cms'
import type { PlanPartTarget } from '@/lib/ai/plan-ops'
import { validatePlan, type PlanIssue, type ReadinessItem } from '@/lib/ai/plan-validation'
import { PlanOverview } from './plan-overview'
import { PlanPages } from './plan-pages'
import { PlanCms } from './plan-cms'
import { PlanFunctionalityList } from './plan-functionality-list'
import { IssueList } from './plan-issues'
import { isChromePlanSection } from './plan-labels'
import type { BuilderDesignSystemState } from '@/lib/builder/design-system-map'

export type CreditInfo = {
  cost: number
  creditsRemaining: number | null
  message: string | null
}

type PlanTab = 'overview' | 'pages' | 'cms' | 'features'

interface PlanCanvasProps {
  /** Brief facts that decide which functionality the plan implies. */
  brief: { features?: string[]; industry?: string; prompt?: string }
  onApprove: () => void
  approving?: boolean
  onRedo?: () => void
  redoing?: boolean
  /** Any AI task (chat change, regeneration) running — approval waits for it. */
  aiBusy?: boolean
  creditInfo?: CreditInfo | null
  onRegenerate: (target: PlanPartTarget) => void
  /** The project's current design system (base for the plan's look & feel). */
  currentDesign?: BuilderDesignSystemState
}

/**
 * The website blueprint: overview (summary, sitemap, shared chrome,
 * readiness), pages with their section stacks, CMS collections with fields and
 * sample items, and functionality — all editable, with "Approve & Generate"
 * enabled only while the plan validates.
 */
export function PlanCanvas ({
  brief,
  onApprove,
  approving,
  onRedo,
  redoing,
  aiBusy,
  creditInfo,
  onRegenerate,
  currentDesign,
}: PlanCanvasProps) {
  const t = useTranslations('aiCreate.plan')
  const planStore = useSitePlanStoreApi()
  const plan = useSitePlanStore((s) => s.plan)
  const apply = useSitePlanStore((s) => s.apply)
  const [tab, setTab] = useState<PlanTab>('overview')
  const [pageId, setPageId] = useState<string | null>(null)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null)
  const [issuesOpen, setIssuesOpen] = useState(false)

  const validation = useMemo(() => (plan ? validatePlan(plan) : null), [plan])
  const { features, industry, prompt } = brief
  const functionality = useMemo(
    () => (plan ? deriveFunctionality(plan, { features, industry, prompt }) : []),
    [plan, features, industry, prompt]
  )

  const openPage = useCallback((id: string, sectionId?: string) => {
    setPageId(id)
    setFocusSectionId(sectionId ?? null)
    setTab('pages')
  }, [])

  const openCollection = useCallback((id: string) => {
    setCollectionId(id)
    setTab('cms')
  }, [])

  const handleIssue = useCallback(
    (issue: PlanIssue) => {
      setIssuesOpen(false)
      if (issue.area === 'cms' && issue.collectionId && !issue.sectionId) openCollection(issue.collectionId)
      else if (issue.pageId) openPage(issue.pageId, issue.sectionId)
      else setTab('overview')
    },
    [openCollection, openPage]
  )

  const handleReadiness = useCallback(
    (area: ReadinessItem['id']) => {
      const first = validation?.issues.find((i) => i.area === area)
      if (first) handleIssue(first)
      else if (area === 'cms') setTab('cms')
      else if (area === 'functionality') setTab('features')
      else if (area !== 'navigation') setTab('pages')
    },
    [validation, handleIssue]
  )

  if (!plan || !validation) return null

  const sectionCount = plan.pages.reduce((n, p) => n + p.sections.filter((s) => !isChromePlanSection(s)).length, 0)
  const collectionCount = plan.cmsCollections?.length ?? 0

  function handleToggle (id: FunctionalityId, enabled: boolean) {
    const current = planStore.getState().plan
    if (!current) return
    const used = new Set(current.pages.flatMap((p) => p.sections.map((s) => s.variant ?? '')))
    apply(
      functionalityToggleOps(current, id, enabled, {
        newId: planId,
        variantFor: (category) => {
          const defs = sectionRegistry
            .getByCategory(category as SectionCategory)
            .filter((d) => !(d as { hidden?: boolean }).hidden)
          return (defs.find((d) => !used.has(d.id)) ?? defs[0])?.id
        },
        collectionFor: defaultCollectionForCategory,
      })
    )
  }

  const blocked = !validation.valid
  const approveDisabled = approving || redoing || aiBusy || blocked || !!creditInfo?.message

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-background px-4 py-2.5 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{t('title')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('summary', { pages: plan.pages.length, sections: sectionCount, collections: collectionCount })}
          </p>
        </div>

        <Popover open={issuesOpen} onOpenChange={setIssuesOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={validation.issues.length === 0}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                validation.errors
                  ? 'border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10'
                  : 'border-primary/30 bg-primary/5 text-primary enabled:hover:bg-primary/10'
              )}
            >
              {validation.errors ? <AlertCircle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
              {validation.errors
                ? t('issuesCount', { count: validation.errors })
                : validation.warnings
                  ? t('readyWithSuggestions', { count: validation.warnings })
                  : t('ready')}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <p className="px-2 pt-1 pb-2 text-xs font-semibold">{t('issuesTitle')}</p>
            <div className="max-h-80 overflow-y-auto">
              <IssueList issues={validation.issues} onSelect={handleIssue} />
            </div>
          </PopoverContent>
        </Popover>

        {onRedo && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onRedo} disabled={redoing || approving || aiBusy}>
            {redoing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {t('redo')}
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as PlanTab)} className="min-h-0 flex-1 gap-0">
        <div className="border-b bg-background px-2 sm:px-4">
          <TabsList variant="underline" className="h-10">
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="pages">
              {t('tabs.pages')}
              <TabBadge count={plan.pages.length} error={validation.issues.some((i) => i.severity === 'error' && i.area !== 'cms')} />
            </TabsTrigger>
            <TabsTrigger value="cms">
              {t('tabs.cms')}
              <TabBadge count={collectionCount} error={validation.issues.some((i) => i.severity === 'error' && i.area === 'cms')} />
            </TabsTrigger>
            <TabsTrigger value="features">{t('tabs.features')}</TabsTrigger>
          </TabsList>
        </div>

        <div className={cn('min-h-0 flex-1 overflow-auto', redoing && 'pointer-events-none opacity-60')}>
          <TabsContent value="overview" className="mt-0">
            <PlanOverview
              plan={plan}
              validation={validation}
              onOpenPage={(id) => openPage(id)}
              onReadinessSelect={handleReadiness}
              currentDesign={currentDesign}
            />
          </TabsContent>
          <TabsContent value="pages" className="mt-0 h-full">
            <PlanPages
              plan={plan}
              validation={validation}
              selectedPageId={pageId}
              onSelectPage={(id) => {
                setPageId(id)
                setFocusSectionId(null)
              }}
              focusSectionId={focusSectionId}
              onRegenerate={onRegenerate}
              onOpenCollection={openCollection}
            />
          </TabsContent>
          <TabsContent value="cms" className="mt-0 h-full">
            <PlanCms
              plan={plan}
              validation={validation}
              selectedCollectionId={collectionId}
              onSelectCollection={setCollectionId}
              onRegenerate={onRegenerate}
              onOpenSection={(id, sectionId) => openPage(id, sectionId)}
            />
          </TabsContent>
          <TabsContent value="features" className="mt-0">
            <PlanFunctionalityList plan={plan} items={functionality} onToggle={handleToggle} />
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="min-w-0 flex-1 text-xs">
            {blocked ? (
              <button
                type="button"
                onClick={() => setIssuesOpen(true)}
                className="inline-flex items-center gap-1.5 text-destructive hover:underline"
              >
                <AlertCircle className="size-3.5 shrink-0" />
                {t('fixIssuesHint', { count: validation.errors })}
              </button>
            ) : creditInfo?.message ? (
              <p className="text-destructive">{creditInfo.message}</p>
            ) : creditInfo ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Coins className="size-3.5 shrink-0" />
                {creditInfo.creditsRemaining !== null
                  ? t('creditsRemaining', { cost: creditInfo.cost, remaining: creditInfo.creditsRemaining })
                  : t('credits', { cost: creditInfo.cost })}
              </p>
            ) : null}
          </div>
          <Button size="lg" className="gap-2" onClick={onApprove} disabled={approveDisabled}>
            {approving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {approving ? t('approving') : t('approve')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TabBadge ({ count, error }: { count: number; error?: boolean }) {
  return (
    <span
      className={cn(
        'ms-0.5 rounded-full px-1.5 text-[10px] tabular-nums',
        error ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
      )}
    >
      {count}
    </span>
  )
}
