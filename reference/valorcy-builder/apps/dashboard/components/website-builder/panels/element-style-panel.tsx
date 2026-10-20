'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Separator } from '@workspace/ui/components/separator'
import { ToggleGroup, ToggleGroupItem } from '@workspace/ui/components/toggle-group'
import { ChevronDown, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react'
import { Slider } from '@workspace/ui/components/slider'
import { useBuilderStore } from '@/lib/builder/store'
import { MediaLibraryDialog } from '@/components/website-builder/media/media-library-dialog'
import { isContainerType } from '@/lib/builder/component-node'
import {
  ColorInput,
  FontFamilySelect,
  NumberField,
  SizeInput,
  StyleSelect,
} from '@/components/website-builder/controls'
import {
  FlexSubControls,
  GridLayoutControls,
  GridSubControls,
  LayoutDisplayModeCards,
  LayoutFlexVisualCards,
  TextAlignVisualRow,
} from '@/components/website-builder/panels/design-panel-visual-groups'
import { SpacingBoxModel } from '@/components/website-builder/panels/spacing-box-model'
import { elementVisualDefaults } from '@/lib/builder/node-visual-defaults'
import { findComponentNodeInTree } from '@/lib/builder/find-tree-node'
import {
  componentStyleToCss,
  getEffectiveComponentStyleForBreakpoint,
  withDefaultUnit,
} from '@/lib/builder/component-style'

type Props = {
  elementId: string
}

function hasVal (v: unknown) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}

function parseElementId (elementId: string) {
  const sep = elementId.indexOf('::')
  if (sep <= 0) return { sectionInstId: '', nodeId: '' }
  return {
    sectionInstId: elementId.slice(0, sep),
    nodeId: elementId.slice(sep + 2),
  }
}

function StyleSection ({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/60 py-1">
      <CollapsibleTrigger className="flex w-full items-center gap-1 py-1.5 text-start">
        <ChevronDown
          className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pb-2 pt-0.5 data-[state=closed]:animate-none">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ElementStylePanel ({ elementId }: Props) {
  const elementStyles = useBuilderStore((s) => s.elementStyles)
  const elementBreakpointStyles = useBuilderStore((s) => s.elementBreakpointStyles)
  const setElementStyles = useBuilderStore((s) => s.setElementStyles)
  const setElementStyleAtBreakpoint = useBuilderStore((s) => s.setElementStyleAtBreakpoint)
  const clearElementStyleAtBreakpoint = useBuilderStore((s) => s.clearElementStyleAtBreakpoint)
  const sections = useBuilderStore((s) => s.sections)
  const deviceMode = useBuilderStore((s) => s.deviceMode)
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint)
  const projectId = useBuilderStore((s) => s.projectId)
  const [bgPickerOpen, setBgPickerOpen] = useState(false)

  const { sectionInstId, nodeId } = parseElementId(elementId)
  const isInstrumented = nodeId.startsWith('__i:')
  const node = useMemo(() => {
    if (isInstrumented) return undefined
    const section = sections.find((x) => x.id === sectionInstId)
    if (!section?.componentTree || !nodeId) return undefined
    return findComponentNodeInTree(section.componentTree, nodeId)
  }, [sections, sectionInstId, nodeId, isInstrumented])

  // Read computed styles for instrumented elements so controls pre-populate
  // from the actual DOM (Tailwind classes + cascade) instead of blank.
  const [computedDefaults, setComputedDefaults] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!isInstrumented) {
      setComputedDefaults({})
      return
    }
    const el = document.querySelector<HTMLElement>(`[data-element-id="${CSS.escape(elementId)}"]`)
    if (!el) return
    const cs = window.getComputedStyle(el)
    const wanted: (keyof CSSStyleDeclaration & string)[] = [
      'display', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'flexWrap',
      'gridTemplateColumns', 'gridTemplateRows',
      'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
      'textAlign', 'textDecoration', 'textTransform',
      'backgroundColor', 'backgroundImage', 'opacity',
      'borderRadius', 'borderColor', 'borderWidth', 'borderStyle',
      'boxShadow', 'overflow', 'position', 'zIndex', 'top', 'right', 'bottom', 'left',
    ]
    const out: Record<string, string> = {}
    for (const k of wanted) {
      const v = cs.getPropertyValue(k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()))
      if (v && v !== 'auto' && v !== 'normal' && v !== 'none' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') {
        out[k] = v.trim()
      }
    }
    setComputedDefaults(out)
  }, [elementId, isInstrumented])

  const defaults = useMemo(() => {
    if (isInstrumented) return computedDefaults
    if (!node) return {} as Record<string, string>
    const flex = elementVisualDefaults(node.type, deviceMode) ?? {}
    const fromStyle = componentStyleToCss(
      getEffectiveComponentStyleForBreakpoint(
        node.style,
        {},
        node.breakpointStyles,
        deviceMode
      )
    ) as Record<string, string | number | undefined>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries({ ...flex, ...fromStyle })) {
      if (v != null && String(v).trim() !== '') out[k] = String(v)
    }
    return out
  }, [node, deviceMode, isInstrumented, computedDefaults])

  // Resolved current style: desktop base + active breakpoint override.
  const style = useMemo(() => {
    const base = elementStyles[elementId] ?? {}
    if (activeBreakpoint === 'desktop') return base
    const bpOverride = elementBreakpointStyles[elementId]?.[activeBreakpoint] ?? {}
    return { ...base, ...bpOverride } as CSSProperties
  }, [elementStyles, elementBreakpointStyles, elementId, activeBreakpoint])

  const str = (k: string) => {
    const raw = style[k as keyof typeof style]
    if (raw != null && String(raw).trim() !== '') return String(raw)
    return defaults[k] ?? ''
  }

  const patch = (key: string, value: string) => {
    // Default bare numeric dimensions to px (width/padding/gap/border-radius…).
    const normalized = withDefaultUnit(key, value)
    const v = normalized == null ? '' : String(normalized)
    // At non-desktop breakpoints, write into elementBreakpointStyles so the
    // override is isolated and can be cleared independently. At desktop,
    // continue mutating elementStyles directly (preserves existing behavior).
    if (activeBreakpoint !== 'desktop') {
      if (!v || v.trim() === '') {
        clearElementStyleAtBreakpoint(elementId, activeBreakpoint, [key as keyof CSSProperties])
      } else {
        setElementStyleAtBreakpoint(elementId, activeBreakpoint, {
          [key]: v,
        } as unknown as CSSProperties)
      }
      return
    }
    const cur = useBuilderStore.getState().elementStyles[elementId] ?? {}
    const next = { ...cur } as Record<string, string | number>
    if (!v || v.trim() === '') delete next[key]
    else next[key] = v
    setElementStyles(elementId, next as CSSProperties)
  }

  const displayVal = str('display') || (defaults.display ?? 'block')
  const showFlexControls =
    displayVal === 'flex' || displayVal === 'inline-flex'
  const showGridControls = displayVal === 'grid'

  const customVars = useMemo(() => {
    return Object.entries(style)
      .filter(([k]) => k.startsWith('--'))
      .map(([k, v]) => ({ key: k, value: String(v ?? '') }))
  }, [style])

  const [newVarName, setNewVarName] = useState('')

  const addCustomVar = () => {
    const name = newVarName.trim().replace(/^\s*--\s*/, '')
    if (!name) return
    const key = name.startsWith('--') ? name : `--${name}`
    patch(key, 'initial')
    setNewVarName('')
  }

  const removeCustomVar = (key: string) => {
    const cur = useBuilderStore.getState().elementStyles[elementId] ?? {}
    const next = { ...cur } as Record<string, string | number>
    delete next[key]
    setElementStyles(elementId, next as CSSProperties)
  }

  return (
    <div className="space-y-0.5 px-1 py-1 text-xs">
      <p className="px-0.5 pb-1 text-[10px] leading-snug text-muted-foreground">
        Styles target this element. Values shown may include layout defaults until you override them.
      </p>
      <Separator className="my-1" />

      <StyleSection title="Layout" defaultOpen>
        <div className="space-y-2">
          <LayoutDisplayModeCards displayVal={displayVal} patch={patch} />
          {showFlexControls ? <FlexSubControls str={str} patch={patch} /> : null}
          {showGridControls ? <GridSubControls str={str} patch={patch} /> : null}
          {showFlexControls || showGridControls ? null : (
            node && isContainerType(node.type) ? null : (
              <p className="text-[10px] text-muted-foreground">
                Set display to flex or grid to unlock direction, gap, and alignment controls.
              </p>
            )
          )}
        </div>
      </StyleSection>

      <StyleSection title="Spacing" defaultOpen>
        <SpacingBoxModel str={str} patch={patch} />
      </StyleSection>

      <StyleSection title="Size" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <SizeInput label="Width" value={str('width')} onValueChange={(v) => patch('width', v)} />
          <SizeInput label="Height" value={str('height')} onValueChange={(v) => patch('height', v)} />
          <SizeInput label="Min W" value={str('minWidth')} onValueChange={(v) => patch('minWidth', v)} />
          <SizeInput label="Min H" value={str('minHeight')} onValueChange={(v) => patch('minHeight', v)} />
          <SizeInput label="Max W" value={str('maxWidth')} onValueChange={(v) => patch('maxWidth', v)} />
          <SizeInput label="Max H" value={str('maxHeight')} onValueChange={(v) => patch('maxHeight', v)} />
        </div>
        <div>
          <Label className="mb-1 block text-[10px] text-muted-foreground">Overflow</Label>
          <ToggleGroup
            type="single"
            value={str('overflow') || 'visible'}
            onValueChange={(v) => {
              if (v) patch('overflow', v)
            }}
            variant="outline"
            size="sm"
            className="flex flex-wrap gap-0.5"
          >
            {(['visible', 'hidden', 'auto', 'scroll'] as const).map((v) => (
              <ToggleGroupItem key={v} value={v} className="h-7 px-2 text-[10px] capitalize">
                {v}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </StyleSection>

      <StyleSection title="Position" defaultOpen={false}>
        <StyleSelect
          label="Position"
          value={str('position')}
          onValueChange={(v) => patch('position', v)}
          options={[
            { value: 'static', label: 'Static' },
            { value: 'relative', label: 'Relative' },
            { value: 'absolute', label: 'Absolute' },
            { value: 'fixed', label: 'Fixed' },
            { value: 'sticky', label: 'Sticky' },
          ]}
        />
        {(str('position') || 'static') !== 'static' ? (
          <div className="grid grid-cols-2 gap-2">
            <SizeInput label="Top" value={str('top')} onValueChange={(v) => patch('top', v)} />
            <SizeInput label="Right" value={str('right')} onValueChange={(v) => patch('right', v)} />
            <SizeInput label="Bottom" value={str('bottom')} onValueChange={(v) => patch('bottom', v)} />
            <SizeInput label="Left" value={str('left')} onValueChange={(v) => patch('left', v)} />
          </div>
        ) : null}
        <NumberField
          id="el-z"
          label="Z-index"
          value={str('zIndex')}
          onValueChange={(v) => patch('zIndex', v === '' ? '' : v)}
          step={1}
          placeholder="0"
        />
      </StyleSection>

      <StyleSection title="Typography" defaultOpen={false}>
        <div className="space-y-2">
          <TextAlignVisualRow str={str} patch={patch} />
          <div className="grid grid-cols-2 gap-2">
            <SizeInput label="Font size" value={str('fontSize')} onValueChange={(v) => patch('fontSize', v)} />
            <StyleSelect
              label="Font weight"
              value={str('fontWeight')}
              onValueChange={(v) => patch('fontWeight', v)}
              options={[
                { value: '300', label: '300' },
                { value: '400', label: '400' },
                { value: '500', label: '500' },
                { value: '600', label: '600' },
                { value: '700', label: '700' },
                { value: '800', label: '800' },
              ]}
            />
          </div>
          <FontFamilySelect
            id="el-ff"
            inputId="el-ff-inp"
            label="Font family"
            value={str('fontFamily')}
            onValueChange={(v) => patch('fontFamily', v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <ColorInput id="el-color" label="Color" value={str('color')} onValueChange={(v) => patch('color', v)} />
            <SizeInput label="Line height" value={str('lineHeight')} onValueChange={(v) => patch('lineHeight', v)} />
          </div>
          <SizeInput label="Letter spacing" value={str('letterSpacing')} onValueChange={(v) => patch('letterSpacing', v)} />
          <StyleSelect
            label="Text decoration"
            value={str('textDecoration')}
            onValueChange={(v) => patch('textDecoration', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'underline', label: 'Underline' },
              { value: 'line-through', label: 'Line through' },
            ]}
          />
          <StyleSelect
            label="Text transform"
            value={str('textTransform')}
            onValueChange={(v) => patch('textTransform', v)}
            options={[
              { value: 'none', label: 'None' },
              { value: 'uppercase', label: 'Uppercase' },
              { value: 'lowercase', label: 'Lowercase' },
              { value: 'capitalize', label: 'Capitalize' },
            ]}
          />
        </div>
      </StyleSection>

      <StyleSection title="Background" defaultOpen={false}>
        {(() => {
          // Parse current backgroundImage to extract raw URL and optional overlay
          const rawBgi = str('backgroundImage')
          const urlMatch = rawBgi.match(/url\(["']?([^"')]+)["']?\)/)
          const imgUrl = urlMatch?.[1] ?? ''

          // Overlay stored as CSS custom properties so they survive URL rebuilds
          const overlayColor = str('--bg-overlay-color')
          const overlayOpacity = Math.round(parseFloat(str('--bg-overlay-opacity') || '0') * 100) / 100

          // Filter values
          const filterStr = str('filter') || ''
          const blurMatch = filterStr.match(/blur\(([\d.]+)px\)/)
          const blurPx = parseFloat(blurMatch?.[1] ?? '0')
          const brightnessMatch = filterStr.match(/brightness\(([\d.]+)\)/)
          const brightnessPct = Math.round((parseFloat(brightnessMatch?.[1] ?? '1')) * 100)

          const buildBackgroundImage = (url: string, oColor: string, oOpacity: number) => {
            if (!url) return ''
            const overlayLayer = oColor && oOpacity > 0
              ? `linear-gradient(color-mix(in srgb, ${oColor} ${Math.round(oOpacity * 100)}%, transparent), color-mix(in srgb, ${oColor} ${Math.round(oOpacity * 100)}%, transparent)), `
              : ''
            return `${overlayLayer}url("${url}")`
          }

          const buildFilter = (blur: number, brightness: number) => {
            const parts: string[] = []
            if (blur > 0) parts.push(`blur(${blur}px)`)
            if (brightness !== 100) parts.push(`brightness(${brightness / 100})`)
            return parts.join(' ')
          }

          const patchOverlay = (oColor: string, oOpacity: number) => {
            patch('--bg-overlay-color', oColor)
            patch('--bg-overlay-opacity', oOpacity > 0 ? String(oOpacity) : '')
            if (imgUrl) patch('backgroundImage', buildBackgroundImage(imgUrl, oColor, oOpacity))
          }

          const patchFilter = (blur: number, brightness: number) => {
            patch('filter', buildFilter(blur, brightness))
          }

          return (
            <div className="space-y-3">
              <ColorInput
                id="el-bg"
                label="Background color"
                value={str('backgroundColor')}
                onValueChange={(v) => patch('backgroundColor', v)}
              />

              {/* Background image */}
              <div className="space-y-1">
                <Label className="text-[10px]">Background image</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 justify-start gap-2 text-[10px]"
                    onClick={() => setBgPickerOpen(true)}
                    disabled={!projectId}
                  >
                    {imgUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt="" className="size-4 shrink-0 rounded object-cover" />
                        <span className="truncate">Change image</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="size-3.5 shrink-0" />
                        <span>Choose image…</span>
                      </>
                    )}
                  </Button>
                  {imgUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      aria-label="Remove background image"
                      onClick={() => {
                        patch('backgroundImage', '')
                        patch('backgroundSize', '')
                        patch('backgroundRepeat', '')
                        patch('backgroundPosition', '')
                        patch('--bg-overlay-color', '')
                        patch('--bg-overlay-opacity', '')
                        patch('filter', '')
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  ) : null}
                  {projectId ? (
                    <MediaLibraryDialog
                      open={bgPickerOpen}
                      onOpenChange={setBgPickerOpen}
                      projectId={projectId}
                      previousUrl={imgUrl}
                      onCommit={(next) => {
                        if (!next) return
                        patch('backgroundImage', buildBackgroundImage(next, overlayColor, overlayOpacity))
                        patch('backgroundSize', 'cover')
                        patch('backgroundRepeat', 'no-repeat')
                        patch('backgroundPosition', 'center')
                      }}
                    />
                  ) : null}
                </div>
              </div>

              {/* Image filters — only shown when an image is set */}
              {imgUrl ? (
                <div className="space-y-2 rounded-md border border-border/50 bg-muted/30 p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Image filters</p>

                  {/* Blur */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px]">Blur</Label>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{blurPx}px</span>
                    </div>
                    <Slider
                      min={0} max={20} step={1}
                      value={[blurPx]}
                      onValueChange={([v]) => patchFilter(v ?? 0, brightnessPct)}
                    />
                  </div>

                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px]">Brightness</Label>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{brightnessPct}%</span>
                    </div>
                    <Slider
                      min={0} max={200} step={5}
                      value={[brightnessPct]}
                      onValueChange={([v]) => patchFilter(blurPx, v ?? 100)}
                    />
                  </div>

                  {/* Overlay color */}
                  <ColorInput
                    label="Overlay color"
                    value={overlayColor}
                    onValueChange={(color) => patchOverlay(color, overlayOpacity)}
                  />

                  {/* Overlay opacity — only when color is set */}
                  {overlayColor ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px]">Overlay opacity</Label>
                        <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round(overlayOpacity * 100)}%</span>
                      </div>
                      <Slider
                        min={0} max={1} step={0.05}
                        value={[overlayOpacity]}
                        onValueChange={([v]) => patchOverlay(overlayColor, v ?? 0)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <NumberField
                id="el-bgo"
                label="Opacity (0–1)"
                value={str('opacity')}
                onValueChange={(v) => patch('opacity', v === '' ? '' : v)}
                min={0}
                max={1}
                step={0.05}
                placeholder="1"
              />
            </div>
          )
        })()}
      </StyleSection>

      <StyleSection title="Borders" defaultOpen={false}>
        <div className="flex flex-wrap gap-1">
          {(['4px', '8px', '12px', '16px'] as const).map((px) => (
            <Button key={px} type="button" size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => patch('borderRadius', px)}>
              {px}
            </Button>
          ))}
        </div>
        <SizeInput label="Border radius" value={str('borderRadius')} onValueChange={(v) => patch('borderRadius', v)} />
        <ColorInput id="el-bc" label="Border color" value={str('borderColor')} onValueChange={(v) => patch('borderColor', v)} />
        <SizeInput label="Border width" value={str('borderWidth')} onValueChange={(v) => patch('borderWidth', v)} />
        <StyleSelect
          label="Border style"
          value={str('borderStyle')}
          onValueChange={(v) => patch('borderStyle', v)}
          options={[
            { value: 'none', label: 'None' },
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
          ]}
        />
        <div className="space-y-1">
          <Label htmlFor="el-border-all" className="text-[10px]">Border (shorthand)</Label>
          <Input
            id="el-border-all"
            className="h-7 font-mono text-[10px]"
            value={str('border')}
            onChange={(e) => patch('border', e.target.value)}
            placeholder="1px solid var(--border)"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SizeInput label="Border top" value={str('borderTop')} onValueChange={(v) => patch('borderTop', v)} />
          <SizeInput label="Border right" value={str('borderRight')} onValueChange={(v) => patch('borderRight', v)} />
          <SizeInput label="Border bottom" value={str('borderBottom')} onValueChange={(v) => patch('borderBottom', v)} />
          <SizeInput label="Border left" value={str('borderLeft')} onValueChange={(v) => patch('borderLeft', v)} />
        </div>
      </StyleSection>

      <StyleSection title="Effects" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {!hasVal(style.opacity) ? (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[10px] sm:col-span-2" onClick={() => patch('opacity', '1')}>
              <Plus className="size-3" />
              Opacity
            </Button>
          ) : (
            <NumberField
              id="el-op"
              label="Opacity (0–1)"
              value={str('opacity')}
              onValueChange={(v) => patch('opacity', v === '' ? '' : v)}
              min={0}
              max={1}
              step={0.05}
              placeholder="1"
            />
          )}
          {!hasVal(style.boxShadow) ? (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[10px] sm:col-span-2" onClick={() => patch('boxShadow', '0 1px 2px rgba(0,0,0,0.06)')}>
              <Plus className="size-3" />
              Box shadow
            </Button>
          ) : (
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="el-sh" className="text-[10px]">Box shadow</Label>
              <Input
                id="el-sh"
                className="h-7 font-mono text-[10px]"
                value={str('boxShadow')}
                onChange={(e) => patch('boxShadow', e.target.value)}
              />
            </div>
          )}
          {!hasVal(style.filter) ? (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[10px] sm:col-span-2" onClick={() => patch('filter', 'none')}>
              <Plus className="size-3" />
              Filter
            </Button>
          ) : (
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="el-fi" className="text-[10px]">Filter</Label>
              <Input
                id="el-fi"
                className="h-7 font-mono text-[10px]"
                value={str('filter')}
                onChange={(e) => patch('filter', e.target.value)}
              />
            </div>
          )}
          {!hasVal(style.backdropFilter) ? (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[10px] sm:col-span-2" onClick={() => patch('backdropFilter', 'none')}>
              <Plus className="size-3" />
              Backdrop filter
            </Button>
          ) : (
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="el-bf" className="text-[10px]">Backdrop filter</Label>
              <Input
                id="el-bf"
                className="h-7 font-mono text-[10px]"
                value={str('backdropFilter')}
                onChange={(e) => patch('backdropFilter', e.target.value)}
              />
            </div>
          )}
          {!hasVal(style.transition) ? (
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-[10px] sm:col-span-2" onClick={() => patch('transition', 'opacity 0.2s ease')}>
              <Plus className="size-3" />
              Transition
            </Button>
          ) : (
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="el-tr" className="text-[10px]">Transition</Label>
              <Input
                id="el-tr"
                className="h-7 font-mono text-[10px]"
                value={str('transition')}
                onChange={(e) => patch('transition', e.target.value)}
              />
            </div>
          )}
        </div>
      </StyleSection>

      <StyleSection title="Custom properties" defaultOpen={false}>
        <div className="space-y-2">
          {customVars.map(({ key, value }) => (
            <div key={key} className="flex gap-1">
              <Input className="h-7 font-mono text-[10px]" value={key} readOnly />
              <Input
                className="h-7 flex-1 font-mono text-[10px]"
                value={value}
                onChange={(e) => patch(key, e.target.value)}
              />
              <Button type="button" size="icon" variant="ghost" className="size-7 shrink-0" aria-label="Remove" onClick={() => removeCustomVar(key)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex gap-1">
            <Input
              placeholder="--my-var"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              className="h-7 font-mono text-[10px]"
            />
            <Button type="button" variant="secondary" size="sm" className="h-7 text-[10px]" onClick={addCustomVar}>
              <Plus className="me-1 size-3" />
              Add
            </Button>
          </div>
        </div>
      </StyleSection>
    </div>
  )
}
