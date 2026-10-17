'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { notify } from '@/services/toast'
import { Button } from '@workspace/ui/components/button'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@workspace/ui/components/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@workspace/ui/components/accordion'
import { Textarea } from '@workspace/ui/components/textarea'
import {
  ColorInput,
  FontFamilySelect,
  NumberField,
  StyleSelect
} from '@/components/website-builder/controls'
import { useBuilderStore, DEFAULT_DESIGN_SYSTEM, type DesignSystem } from '@/lib/builder/store'
import { updateDesignSystem } from '@/actions/design-system-actions'
import { DESIGN_SYSTEM_PRESETS } from '@/lib/builder/design-system-presets'
import { suggestPalette, type SuggestedPalette } from '@/actions/design-ai-actions'

type ColorState = {
  primary: string
  secondary: string
  background: string
  foreground: string
  muted: string
  border: string
  accent: string
  destructive: string
}

type FormState = {
  colors: ColorState
  headingFont: string
  bodyFont: string
  arabicFont: string
  baseFontSize: string
  scaleRatio: string
  containerMax: string
  sectionPad: string
  radius: string
  customCss: string
}

const COLOR_KEYS: (keyof ColorState)[] = [
  'primary',
  'secondary',
  'background',
  'foreground',
  'muted',
  'border',
  'accent',
  'destructive'
]

function buildColorPatch (c: ColorState) {
  return {
    primary: c.primary || undefined,
    secondary: c.secondary || undefined,
    background: c.background || undefined,
    foreground: c.foreground || undefined,
    muted: c.muted || undefined,
    border: c.border || undefined,
    accent: c.accent || undefined,
    destructive: c.destructive || undefined
  }
}

function formFromDesign (d: DesignSystem, customCss?: string): FormState {
  const c = d.colors
  return {
    colors: {
      primary: c.primary ?? '',
      secondary: c.secondary ?? '',
      background: c.background ?? '',
      foreground: c.foreground ?? '',
      muted: c.muted ?? '',
      border: c.border ?? '',
      accent: c.accent ?? '',
      destructive: c.destructive ?? ''
    },
    headingFont: d.typography.headingFont ?? '',
    bodyFont: d.typography.bodyFont ?? '',
    arabicFont: d.typography.arabicFont ?? '',
    baseFontSize: d.typography.baseFontSize === undefined ? '' : String(d.typography.baseFontSize),
    scaleRatio: d.typography.scaleRatio === undefined ? '' : String(d.typography.scaleRatio),
    containerMax: String(d.spacing.containerMaxWidth ?? ''),
    sectionPad: String(d.spacing.sectionPaddingY ?? ''),
    radius: String(d.spacing.borderRadius ?? ''),
    customCss: customCss ?? ''
  }
}

/**
 * Brand tab of the builder's left rail — the project design system (colors,
 * typography, spacing, custom CSS). Edits preview on the canvas; Save persists
 * them to the project's `designSystems` row.
 */
export function BrandPanel ({ projectId }: { projectId: string }) {
  const t = useTranslations('dialogs.designSystem')
  const designSystem = useBuilderStore((s) => s.designSystem)
  const dsVersion = useBuilderStore((s) => s.dsVersion)
  const updateDesignSystemLocal = useBuilderStore((s) => s.updateDesignSystem)
  const setDsVersion = useBuilderStore((s) => s.setDsVersion)

  const [form, setForm] = useState<FormState>(() =>
    formFromDesign(designSystem, designSystem.customCss)
  )
  const [resetOpen, setResetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedPalette[]>([])

  // Re-sync when the persisted design system changes underneath us (a save
  // from another surface bumps the version).
  useEffect(() => {
    const ds = useBuilderStore.getState().designSystem
    setForm(formFromDesign(ds, ds.customCss))
  }, [dsVersion])

  const patchForm = (patch: Partial<FormState>) => setForm((s) => ({ ...s, ...patch }))
  const setColor = (key: keyof ColorState, v: string) =>
    setForm((s) => ({ ...s, colors: { ...s.colors, [key]: v } }))

  const buildLocalPatch = (f: FormState) => ({
    colors: buildColorPatch(f.colors),
    typography: {
      headingFont: f.headingFont || undefined,
      bodyFont: f.bodyFont || undefined,
      arabicFont: f.arabicFont || undefined,
      baseFontSize: f.baseFontSize ? Number(f.baseFontSize) : undefined,
      scaleRatio: f.scaleRatio ? Number(f.scaleRatio) : undefined
    },
    spacing: {
      containerMaxWidth: f.containerMax ? Number(f.containerMax) : undefined,
      sectionPaddingY: f.sectionPad ? Number(f.sectionPad) : undefined,
      borderRadius: f.radius ? Number(f.radius) : undefined
    },
    customCss: f.customCss || undefined
  })

  /** Populate the form from a preset and push it to the live canvas immediately. */
  const applyPreset = (d: DesignSystem) => {
    setForm((s) => ({ ...formFromDesign(d), customCss: s.customCss }))
    updateDesignSystemLocal({
      colors: { ...d.colors },
      typography: { ...d.typography },
      spacing: { ...d.spacing }
    })
  }

  const handleSuggestPalette = async () => {
    setSuggesting(true)
    try {
      const res = await suggestPalette({ projectId })
      if (res.ok) {
        setSuggestions(res.palettes)
        notify.success(t('toastPaletteReady'), t('toastPaletteReadyDescription'))
      } else {
        notify.error(res.error)
      }
    } catch {
      notify.error(t('toastPaletteFailed'))
    } finally {
      setSuggesting(false)
    }
  }

  const applySuggestedPalette = (p: SuggestedPalette) => {
    const next: ColorState = {
      ...form.colors,
      primary: p.primary,
      secondary: p.secondary,
      accent: p.accent,
      background: p.background,
      foreground: p.foreground
    }
    patchForm({ colors: next })
    updateDesignSystemLocal({ colors: buildColorPatch(next) })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      updateDesignSystemLocal(buildLocalPatch(form))
      const row = await updateDesignSystem(projectId, {
        colors: buildColorPatch(form.colors),
        typography: {
          headingFont: form.headingFont,
          bodyFont: form.bodyFont,
          arabicFont: form.arabicFont || undefined,
          baseFontSize: form.baseFontSize ? Number(form.baseFontSize) : undefined,
          scaleRatio: form.scaleRatio ? Number(form.scaleRatio) : undefined
        },
        spacing: {
          containerMaxWidth: form.containerMax ? Number(form.containerMax) : undefined,
          sectionPaddingY: form.sectionPad ? Number(form.sectionPad) : undefined,
          borderRadius: form.radius ? Number(form.radius) : undefined
        },
        customCss: form.customCss || null
      })
      if (row?.version !== undefined) setDsVersion(row.version)
      notify.success(t('toastSaved'))
    } catch (e) {
      console.error(e)
      notify.error(t('toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const d = DEFAULT_DESIGN_SYSTEM
    setForm(formFromDesign(d))
    updateDesignSystemLocal({
      colors: { ...d.colors },
      typography: { ...d.typography },
      spacing: { ...d.spacing },
      customCss: undefined
    })
    try {
      const row = await updateDesignSystem(projectId, {
        colors: d.colors as Record<string, unknown>,
        typography: {
          headingFont: d.typography.headingFont,
          bodyFont: d.typography.bodyFont,
          arabicFont: d.typography.arabicFont,
          baseFontSize: d.typography.baseFontSize,
          scaleRatio: d.typography.scaleRatio
        } as Record<string, unknown>,
        spacing: {
          containerMaxWidth: d.spacing.containerMaxWidth,
          sectionPaddingY: d.spacing.sectionPaddingY,
          borderRadius: d.spacing.borderRadius
        } as Record<string, unknown>,
        customCss: null
      })
      if (row?.version !== undefined) setDsVersion(row.version)
      notify.success(t('toastReset'))
      setResetOpen(false)
    } catch (err) {
      console.error(err)
      notify.error(t('toastResetFailed'))
    }
  }

  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Brand</p>
          <p className="truncate text-xs text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => setResetOpen(true)}
          aria-label={t('resetToDefaults')}
          title={t('resetToDefaults')}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <Accordion
          type="multiple"
          defaultValue={['presets', 'colors']}
          className="w-full px-3 pb-4"
        >
          <AccordionItem value="presets">
            <AccordionTrigger className="text-sm">{t('presetsGroup')}</AccordionTrigger>
            <AccordionContent className="grid grid-cols-2 gap-2 pb-3">
              {DESIGN_SYSTEM_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.design)}
                  title={preset.description}
                  className="group flex flex-col gap-1.5 rounded-lg border border-border p-1.5 text-start transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className="flex h-8 w-full items-center gap-1 overflow-hidden rounded-md px-1.5"
                    style={{ background: preset.design.colors.background }}
                  >
                    <span
                      className="size-4 shrink-0 rounded-full"
                      style={{ background: preset.design.colors.primary }}
                    />
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: preset.design.colors.accent }}
                    />
                    <span
                      className="ms-auto text-[11px] font-semibold"
                      style={{
                        color: preset.design.colors.foreground,
                        fontFamily: preset.design.typography.headingFont
                      }}
                    >
                      Aa
                    </span>
                  </span>
                  <span className="truncate text-[11px] font-medium">{preset.name}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm">{t('colorsGroup')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3 pb-3">
              <p className="text-xs text-muted-foreground">{t('colorsHint')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1"
                disabled={suggesting}
                onClick={handleSuggestPalette}
              >
                {suggesting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {t('suggestPalette')}
              </Button>
              {suggestions.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((p, i) => (
                    <button
                      key={`${p.name}-${i}`}
                      type="button"
                      onClick={() => applySuggestedPalette(p)}
                      className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-start hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex shrink-0 overflow-hidden rounded">
                        {[p.primary, p.secondary, p.accent, p.background, p.foreground].map(
                          (c, j) => (
                            <span key={j} className="size-4" style={{ background: c }} />
                          )
                        )}
                      </span>
                      <span className="truncate text-xs font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {COLOR_KEYS.map((key) => (
                <ColorInput
                  key={key}
                  id={`brand-${key}`}
                  label={t(key)}
                  value={form.colors[key]}
                  onValueChange={(v) => setColor(key, v)}
                />
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="type">
            <AccordionTrigger className="text-sm">{t('typographyGroup')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3 pb-3">
              <FontFamilySelect
                id="brand-heading-preset"
                inputId="brand-heading"
                label={t('headingFont')}
                value={form.headingFont}
                onValueChange={(v) => patchForm({ headingFont: v })}
              />
              <FontFamilySelect
                id="brand-body-preset"
                inputId="brand-body"
                label={t('bodyFont')}
                value={form.bodyFont}
                onValueChange={(v) => patchForm({ bodyFont: v })}
              />
              <FontFamilySelect
                id="brand-ar-preset"
                inputId="brand-ar"
                label={t('arabicFontOptional')}
                value={form.arabicFont}
                onValueChange={(v) => patchForm({ arabicFont: v })}
              />
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  id="brand-base"
                  label={t('baseSizePx')}
                  value={form.baseFontSize}
                  onValueChange={(v) => patchForm({ baseFontSize: v })}
                  min={10}
                  max={32}
                  step={1}
                />
                <StyleSelect
                  id="brand-scale"
                  label={t('typeScaleRatio')}
                  value={form.scaleRatio}
                  onValueChange={(v) => patchForm({ scaleRatio: v })}
                  allowEmpty
                  emptyLabel={t('default')}
                  options={[
                    { value: '1.125', label: '1.125' },
                    { value: '1.2', label: '1.2' },
                    { value: '1.25', label: '1.25' },
                    { value: '1.33', label: '1.33' },
                    { value: '1.5', label: '1.5' }
                  ]}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="space">
            <AccordionTrigger className="text-sm">{t('spacingGroup')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3 pb-3">
              <NumberField
                id="brand-max"
                label={t('containerMaxPx')}
                value={form.containerMax}
                onValueChange={(v) => patchForm({ containerMax: v })}
                min={320}
                step={8}
              />
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  id="brand-pad"
                  label={t('sectionYPx')}
                  value={form.sectionPad}
                  onValueChange={(v) => patchForm({ sectionPad: v })}
                  min={0}
                  step={4}
                />
                <NumberField
                  id="brand-rad"
                  label={t('radiusPx')}
                  value={form.radius}
                  onValueChange={(v) => patchForm({ radius: v })}
                  min={0}
                  step={1}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="css">
            <AccordionTrigger className="text-sm">{t('customCssGroup')}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">{t('customCssHint')}</p>
                <Textarea
                  id="brand-css"
                  value={form.customCss}
                  onChange={(e) => patchForm({ customCss: e.target.value })}
                  rows={5}
                  className="font-mono text-xs"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>

      <div className="flex shrink-0 gap-2 border-t border-border p-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            updateDesignSystemLocal(buildLocalPatch(form))
            notify.info(t('toastPreviewUpdated'), t('toastPreviewUpdatedDescription'))
          }}
        >
          {t('applyPreview')}
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {t('save')}
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('resetTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('resetDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleReset()
              }}
            >
              {t('resetAndSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
