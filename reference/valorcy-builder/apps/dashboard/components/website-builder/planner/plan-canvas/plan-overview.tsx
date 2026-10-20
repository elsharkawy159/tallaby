'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, EyeOff, FileText, Globe, Home, Languages, PanelTop, SlidersHorizontal } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@/lib/utils'
import { useSitePlanStore } from '@/lib/ai/use-site-plan-store'
import type { PlanValidation, ReadinessItem } from '@/lib/ai/plan-validation'
import { planReadiness } from '@/lib/ai/plan-validation'
import type { WebsitePlan } from '@/lib/ai/site-plan-schema'
import { DraftField } from './inline-edit'
import { ReadinessChecklist } from './plan-issues'
import { isChromePlanSection, planSectionLabel } from './plan-labels'
import { PlanDesignCard } from './plan-design-card'
import type { BuilderDesignSystemState } from '@/lib/builder/design-system-map'

const META_TITLE_SOFT_MAX = 60
const META_DESCRIPTION_SOFT_MAX = 160

export function PlanCard ({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border bg-card text-card-foreground', className)}>
      <header className="flex items-center gap-2 border-b px-4 py-2.5">
        {icon ? <span className="text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
        <h3 className="min-w-0 flex-1 text-sm font-semibold">{title}</h3>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function FieldLabel ({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {children}
      </label>
      {hint}
    </div>
  )
}

interface PlanOverviewProps {
  plan: WebsitePlan
  validation: PlanValidation
  onOpenPage: (pageId: string) => void
  onReadinessSelect: (area: ReadinessItem['id']) => void
  /** The project's current design system — base for the look & feel preview. */
  currentDesign?: BuilderDesignSystemState
}

/**
 * The plan at a glance: the website (name + search metadata) and every page
 * with its purpose and the sections it will be generated with — exactly what
 * the build follows.
 */
export function PlanOverview ({ plan, validation, onOpenPage, onReadinessSelect, currentDesign }: PlanOverviewProps) {
  const t = useTranslations('aiCreate.plan.overview')
  const apply = useSitePlanStore((s) => s.apply)
  const website = plan.website ?? {}
  const readiness = planReadiness(plan, validation)
  const locales = plan.summary?.language?.locales ?? []

  return (
    <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <PlanCard title={t('websiteTitle')} icon={<Globe />}>
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="plan-website-name">{t('websiteName')}</FieldLabel>
              <DraftField
                id="plan-website-name"
                maxLength={80}
                value={website.name ?? ''}
                placeholder={t('websiteNamePlaceholder')}
                onCommit={(name) => apply({ op: 'website.update', patch: { name } })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="plan-meta-title">{t('metaTitle')}</FieldLabel>
              <DraftField
                id="plan-meta-title"
                maxLength={90}
                softMax={META_TITLE_SOFT_MAX}
                showCount
                value={website.metaTitle ?? ''}
                placeholder={t('metaTitlePlaceholder')}
                onCommit={(metaTitle) => apply({ op: 'website.update', patch: { metaTitle } })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="plan-meta-description">{t('metaDescription')}</FieldLabel>
              <DraftField
                id="plan-meta-description"
                multiline
                maxLength={220}
                softMax={META_DESCRIPTION_SOFT_MAX}
                showCount
                value={website.metaDescription ?? ''}
                placeholder={t('metaDescriptionPlaceholder')}
                onCommit={(metaDescription) => apply({ op: 'website.update', patch: { metaDescription } })}
              />
            </div>
          </div>
        </PlanCard>

        <PlanCard title={t('pagesTitle')} icon={<FileText />}>
          <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <PanelTop className="size-3.5 shrink-0" />
            {t('sharedChrome')}
          </p>
          <ol className="space-y-2.5">
            {plan.pages.map((page, index) => (
              <PageOutline
                key={page.id}
                page={page}
                index={index}
                hasError={validation.issues.some((i) => i.pageId === page.id && i.severity === 'error')}
                onOpen={() => onOpenPage(page.id)}
              />
            ))}
          </ol>
        </PlanCard>

        <MoreDetails plan={plan} />
      </div>

      <aside className="min-w-0 space-y-4">
        <PlanCard title={t('readiness')}>
          <div className="-m-2">
            <ReadinessChecklist items={readiness} onSelect={onReadinessSelect} />
          </div>
        </PlanCard>

        <PlanDesignCard plan={plan} currentDesign={currentDesign} />

        {locales.length > 0 && (
          <PlanCard title={t('language')} icon={<Languages />}>
            <div className="flex flex-wrap gap-1.5">
              {locales.map((locale) => (
                <span
                  key={locale}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs uppercase',
                    locale === plan.summary?.language?.primary && 'border-primary/40 bg-primary/10 text-primary'
                  )}
                >
                  {locale}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">{t('languageHint')}</p>
          </PlanCard>
        )}
      </aside>
    </div>
  )
}

function PageOutline ({
  page,
  index,
  hasError,
  onOpen,
}: {
  page: WebsitePlan['pages'][number]
  index: number
  hasError: boolean
  onOpen: () => void
}) {
  const t = useTranslations('aiCreate.plan.overview')
  const tc = useTranslations('aiCreate.categories')
  const categoryLabel = (category: string) => (tc.has(category) ? tc(category) : category)
  const body = page.sections.filter((s) => !isChromePlanSection(s))

  return (
    <li className={cn('rounded-lg border bg-background', hasError && 'border-destructive/40')}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('editPage', { name: page.name })}
        className="group flex w-full items-start gap-3 rounded-lg px-3 pt-3 pb-2 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-medium tabular-nums',
            index === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {index === 0 ? <Home className="size-3.5" /> : index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold" dir="auto">{page.name}</span>
            <span className="text-xs text-muted-foreground" dir="ltr">/{page.slug}</span>
            {hasError && <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden />}
            {page.showInNav === false && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <EyeOff className="size-3" />
                {t('hiddenFromNav')}
              </span>
            )}
          </span>
          {page.purpose && (
            <span className="mt-0.5 block text-xs text-muted-foreground" dir="auto">
              {page.purpose}
            </span>
          )}
        </span>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
      </button>

      {body.length === 0 ? (
        <p className="px-3 pb-3 ps-13 text-xs text-destructive">{t('noSections')}</p>
      ) : (
        <ul className="space-y-1 px-3 pb-3 ps-13">
          {body.map((section) => (
            <li key={section.id} className="flex gap-2 text-sm leading-snug">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
              <span className="min-w-0" dir="auto">
                <span className="font-medium">{planSectionLabel(section, categoryLabel)}</span>
                {section.purpose && <span className="text-muted-foreground"> — {section.purpose}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/** Brand direction and shared navigation briefs — tucked away, still editable. */
function MoreDetails ({ plan }: { plan: WebsitePlan }) {
  const t = useTranslations('aiCreate.plan.overview')
  const apply = useSitePlanStore((s) => s.apply)
  const [open, setOpen] = useState(false)
  const summary = plan.summary ?? {}

  return (
    <PlanCard
      title={t('detailsTitle')}
      icon={<SlidersHorizontal />}
      action={
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-muted-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? t('hideDetails') : t('showDetails')}
          <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        </Button>
      }
    >
      {!open ? (
        <p className="text-xs text-muted-foreground">{t('detailsHint')}</p>
      ) : (
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="plan-description">{t('description')}</FieldLabel>
            <DraftField
              id="plan-description"
              multiline
              maxLength={800}
              value={summary.description ?? ''}
              placeholder={t('descriptionPlaceholder')}
              onCommit={(description) => apply({ op: 'summary.update', patch: { description } })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
            <div>
              <FieldLabel htmlFor="plan-audience">{t('audience')}</FieldLabel>
              <DraftField
                id="plan-audience"
                maxLength={300}
                value={summary.audience ?? ''}
                placeholder={t('audiencePlaceholder')}
                onCommit={(audience) => apply({ op: 'summary.update', patch: { audience } })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="plan-tone">{t('tone')}</FieldLabel>
              <DraftField
                id="plan-tone"
                maxLength={60}
                value={summary.tone ?? ''}
                placeholder={t('tonePlaceholder')}
                onCommit={(tone) => apply({ op: 'summary.update', patch: { tone } })}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="plan-navbar-brief">{t('navbarBrief')}</FieldLabel>
              <DraftField
                id="plan-navbar-brief"
                multiline
                maxLength={300}
                value={plan.sharedSections?.navbarBrief ?? ''}
                placeholder={t('navbarBriefPlaceholder')}
                onCommit={(navbarBrief) => apply({ op: 'shared.update', patch: { navbarBrief } })}
              />
            </div>
            <div>
              <FieldLabel htmlFor="plan-footer-brief">{t('footerBrief')}</FieldLabel>
              <DraftField
                id="plan-footer-brief"
                multiline
                maxLength={300}
                value={plan.sharedSections?.footerBrief ?? ''}
                placeholder={t('footerBriefPlaceholder')}
                onCommit={(footerBrief) => apply({ op: 'shared.update', patch: { footerBrief } })}
              />
            </div>
          </div>
        </div>
      )}
    </PlanCard>
  )
}
