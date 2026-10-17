'use client'

import { useId, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Palette } from 'lucide-react'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@/lib/utils'
import { useSitePlanStore } from '@/lib/ai/use-site-plan-store'
import { applyPlanDesign, PLAN_DESIGN_FONTS, PLAN_DESIGN_RADII, shouldApplyPlanDesign } from '@/lib/ai/plan-design'
import { mapDbDesignSystemToBuilder, type BuilderDesignSystemState } from '@/lib/builder/design-system-map'
import { buildGoogleFontsHref } from '@/lib/builder/design-system-fonts'
import type { PlanDesign, WebsitePlan } from '@/lib/ai/site-plan-schema'
import { FieldLabel, PlanCard } from './plan-overview'

const MODES = ['light', 'dark'] as const
const RADII = ['sharp', 'soft', 'round'] as const

/**
 * The look the brief asked for — brand color, light/dark, fonts, corners —
 * with a live preview tile. Applied to the project's design system at build
 * unless switched off.
 */
export function PlanDesignCard ({
  plan,
  currentDesign,
}: {
  plan: WebsitePlan
  /** The project's design system today — the base the plan's look is applied on. */
  currentDesign?: BuilderDesignSystemState
}) {
  const t = useTranslations('aiCreate.plan.overview.design')
  const apply = useSitePlanStore((s) => s.apply)
  const ids = useId()
  const design: PlanDesign = plan.design ?? {}
  const enabled = design.apply !== false
  const hasLook = shouldApplyPlanDesign({ ...design, apply: true })

  const base = useMemo(() => currentDesign ?? mapDbDesignSystemToBuilder(null), [currentDesign])
  const preview = hasLook && enabled ? applyPlanDesign(base, design) : base
  const fontsHref = buildGoogleFontsHref([preview.typography.headingFont, preview.typography.bodyFont])

  const update = (patch: { [K in keyof PlanDesign]?: PlanDesign[K] | null }) => apply({ op: 'design.update', patch })

  const colors = preview.colors
  const radius = preview.spacing.borderRadius ?? PLAN_DESIGN_RADII.soft

  return (
    <PlanCard
      title={t('title')}
      icon={<Palette />}
      action={
        hasLook ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            {t('apply')}
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => update({ apply: checked })}
              aria-describedby={`${ids}-apply-hint`}
            />
          </label>
        ) : null
      }
    >
      {fontsHref ? <link rel="stylesheet" href={fontsHref} precedence="default" /> : null}

      <p id={`${ids}-apply-hint`} className="mb-3 text-xs text-muted-foreground">
        {!hasLook ? t('empty') : enabled ? (design.rationale ?? t('hint')) : t('applyHint')}
      </p>

      {/* Preview tile — the user's chosen colors, rendered as data. */}
      <div
        className={cn('mb-4 overflow-hidden border p-4 transition-opacity', !enabled && 'opacity-50')}
        style={{
          background: colors.background,
          color: colors.foreground,
          borderColor: colors.border,
          borderRadius: radius,
        }}
      >
        <p
          className="text-lg font-semibold leading-tight"
          style={{ fontFamily: preview.typography.headingFont }}
          dir="auto"
        >
          {plan.website?.name || t('previewHeading')}
        </p>
        <p className="mt-1 text-xs" style={{ color: colors.muted, fontFamily: preview.typography.bodyFont }} dir="auto">
          {plan.website?.metaDescription?.slice(0, 80) || t('hint')}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-flex px-3 py-1.5 text-xs font-medium"
            style={{ background: colors.primary, color: colors.background, borderRadius: radius }}
          >
            {t('previewButton')}
          </span>
          {[colors.primary, colors.secondary, colors.accent].map((c, i) => (
            <span key={i} className="size-4 rounded-full border" style={{ background: c, borderColor: colors.border }} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <FieldLabel htmlFor={`${ids}-primary`}>{t('primary')}</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                id={`${ids}-primary`}
                type="color"
                value={design.primaryColor ?? base.colors.primary ?? '#000000'}
                onChange={(e) => update({ primaryColor: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded-md border bg-background p-0.5"
              />
              <span className="text-xs uppercase text-muted-foreground" dir="ltr">
                {design.primaryColor ?? t('keepCurrent')}
              </span>
            </div>
          </div>
          <Segmented
            label={t('mode')}
            value={design.mode}
            options={MODES.map((m) => ({ value: m, label: t(m) }))}
            onChange={(mode) => update({ mode })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FontSelect
            id={`${ids}-heading`}
            label={t('headingFont')}
            value={design.headingFont}
            onChange={(headingFont) => update({ headingFont })}
          />
          <FontSelect
            id={`${ids}-body`}
            label={t('bodyFont')}
            value={design.bodyFont}
            onChange={(bodyFont) => update({ bodyFont })}
          />
        </div>

        <Segmented
          label={t('radius')}
          value={design.radius}
          options={RADII.map((r) => ({ value: r, label: t(r) }))}
          onChange={(radius) => update({ radius })}
        />
      </div>
    </PlanCard>
  )
}

function Segmented<T extends string> ({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | undefined
  options: { value: T; label: string }[]
  onChange: (value: T | null) => void
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="inline-flex rounded-md border bg-muted/40 p-0.5">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              // Clicking the active option clears it ("keep current").
              onClick={() => onChange(active ? null : option.value)}
              className={cn(
                'rounded px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FontSelect ({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string | undefined
  onChange: (value: string | null) => void
}) {
  const t = useTranslations('aiCreate.plan.overview.design')
  const groups = [
    { key: 'fontGroupSans', fonts: PLAN_DESIGN_FONTS.sans },
    { key: 'fontGroupSerif', fonts: PLAN_DESIGN_FONTS.serif },
    { key: 'fontGroupDisplay', fonts: PLAN_DESIGN_FONTS.display },
  ] as const
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{t('keepCurrent')}</option>
        {groups.map((group) => (
          <optgroup key={group.key} label={t(group.key)}>
            {group.fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
