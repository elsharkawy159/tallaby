'use client'

import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@workspace/ui/components/accordion'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Separator } from '@workspace/ui/components/separator'
import { ClipboardPaste, Copy } from 'lucide-react'
import { useBuilderStore } from '@/lib/builder/store'
import { sectionRegistry } from '@/components/sections'
import {
  ColorInput,
  ControlSection,
  FontFamilySelect,
  NumberField,
  SizeInput,
  StyleSelect
} from '@/components/website-builder/controls'
import {
  type ComponentStyle,
  type DeepPartial,
  withDefaultUnit
} from '@/lib/builder/component-style'
import { getSectionPanelStyle } from '@/components/sections/section-surface'
import {
  GridLayoutControls,
  LayoutFlexVisualCards,
  TextAlignVisualRow
} from '@/components/website-builder/panels/design-panel-visual-groups'

export function DesignPanel () {
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const sections = useBuilderStore((s) => s.sections)
  const sharedHeader = useBuilderStore((s) => s.sharedHeader)
  const sharedFooter = useBuilderStore((s) => s.sharedFooter)
  const activePageId = useBuilderStore((s) => s.activePageId)
  const pages = useBuilderStore((s) => s.pages)
  const togglePageUseSharedHeader = useBuilderStore((s) => s.togglePageUseSharedHeader)
  const togglePageUseSharedFooter = useBuilderStore((s) => s.togglePageUseSharedFooter)
  const deviceMode = useBuilderStore((s) => s.deviceMode)
  const designSystem = useBuilderStore((s) => s.designSystem)
  const updateSectionStyle = useBuilderStore((s) => s.updateSectionStyle)
  const copySectionStyle = useBuilderStore((s) => s.copySectionStyle)
  const pasteSectionStyle = useBuilderStore((s) => s.pasteSectionStyle)
  const styleClipboard = useBuilderStore((s) => s.styleClipboard)
  const updateSectionAnimation = useBuilderStore((s) => s.updateSectionAnimation)

  const activePage = pages.find((p) => p.id === activePageId)
  const isSharedHeader = sharedHeader?.id === selectedSectionId
  const isSharedFooter = sharedFooter?.id === selectedSectionId

  const instance =
    sections.find((s) => s.id === selectedSectionId) ??
    (isSharedHeader ? sharedHeader : null) ??
    (isSharedFooter ? sharedFooter : null)
  const def = instance ? sectionRegistry.get(instance.sectionId) : undefined

  if (!instance || !def) {
    return <p className="text-sm text-muted-foreground">Select a section to edit design.</p>
  }

  const style = getSectionPanelStyle({
    instance,
    defaultStyle: def.defaultStyle,
    rootOptions: def.rootStyleOptions,
    viewport: deviceMode,
    designSystem,
    category: def.category,
  })

  const patch = (key: string, value: string) => {
    const normalized = withDefaultUnit(key, value)
    const v = normalized == null ? '' : String(normalized)
    updateSectionStyle(instance.id, { [key]: v || undefined } as DeepPartial<ComponentStyle>)
  }

  const str = (k: keyof ComponentStyle | string) => String(style[k] ?? '')

  return (
    <div className="flex flex-col gap-3 px-1 py-2">
      {(isSharedHeader || isSharedFooter) && activePage && (
        <div className="flex items-center gap-2 rounded-md border border-[#146EF5]/30 bg-[#146EF5]/5 px-3 py-2">
          <Checkbox
            id="share-across-pages"
            checked={isSharedHeader ? (activePage.useSharedHeader ?? true) : (activePage.useSharedFooter ?? true)}
            onCheckedChange={() => {
              if (!activePageId) return
              if (isSharedHeader) togglePageUseSharedHeader(activePageId)
              else togglePageUseSharedFooter(activePageId)
            }}
          />
          <label htmlFor="share-across-pages" className="cursor-pointer text-xs font-medium">
            Show on this page
          </label>
          <span className="ms-auto text-[10px] text-muted-foreground">
            Shared {isSharedHeader ? 'header' : 'footer'}
          </span>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Styles target the current canvas size. Use the top bar to switch desktop, tablet, or mobile.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => copySectionStyle(instance.id)}
        >
          <Copy className="size-4" />
          Copy
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!styleClipboard}
          onClick={() => pasteSectionStyle(instance.id)}
        >
          <ClipboardPaste className="size-4" />
          Paste
        </Button>
      </div>
      <Separator />

      <Accordion defaultValue="layout" type="single" className="w-full">
        <AccordionItem value="layout">
          <AccordionTrigger className="py-2 text-sm font-medium">
            Layout
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 pb-4">
            <ControlSection>
              <StyleSelect
                label="Display"
                value={str('display')}
                onValueChange={(v) => patch('display', v)}
                options={[
                  { value: 'block', label: 'Block' },
                  { value: 'flex', label: 'Flex' },
                  { value: 'inline-flex', label: 'Inline flex' },
                  { value: 'grid', label: 'Grid' },
                  { value: 'inline-block', label: 'Inline block' },
                  { value: 'none', label: 'None' }
                ]}
              />
            </ControlSection>
            {(str('display') === 'flex' || str('display') === 'inline-flex') && (
              <>
                <LayoutFlexVisualCards str={str} patch={patch} />
                <ControlSection>
                  <StyleSelect
                    label="Flex wrap"
                    value={str('flexWrap')}
                    onValueChange={(v) => patch('flexWrap', v)}
                    options={[
                      { value: 'nowrap', label: 'No wrap' },
                      { value: 'wrap', label: 'Wrap' },
                      { value: 'wrap-reverse', label: 'Wrap reverse' }
                    ]}
                  />
                  <SizeInput
                    id="style-gap"
                    label="Gap"
                    value={str('gap')}
                    onValueChange={(v) => patch('gap', v)}
                  />
                </ControlSection>
              </>
            )}
            {str('display') === 'grid' && <GridLayoutControls str={str} patch={patch} />}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sizing">
          <AccordionTrigger className="py-2 text-sm">Sizing</AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2">
            <SizeInput label="Width" value={str('width')} onValueChange={(v) => patch('width', v)} />
            <SizeInput label="Height" value={str('height')} onValueChange={(v) => patch('height', v)} />
            <SizeInput label="Min width" value={str('minWidth')} onValueChange={(v) => patch('minWidth', v)} />
            <SizeInput label="Max width" value={str('maxWidth')} onValueChange={(v) => patch('maxWidth', v)} />
            <SizeInput label="Min height" value={str('minHeight')} onValueChange={(v) => patch('minHeight', v)} />
            <SizeInput label="Max height" value={str('maxHeight')} onValueChange={(v) => patch('maxHeight', v)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spacing">
          <AccordionTrigger className="py-2 text-sm">Spacing</AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2">
            <SizeInput label="Padding top" value={str('paddingTop')} onValueChange={(v) => patch('paddingTop', v)} />
            <SizeInput label="Padding right" value={str('paddingRight')} onValueChange={(v) => patch('paddingRight', v)} />
            <SizeInput label="Padding bottom" value={str('paddingBottom')} onValueChange={(v) => patch('paddingBottom', v)} />
            <SizeInput label="Padding left" value={str('paddingLeft')} onValueChange={(v) => patch('paddingLeft', v)} />
            <SizeInput label="Margin top" value={str('marginTop')} onValueChange={(v) => patch('marginTop', v)} />
            <SizeInput label="Margin right" value={str('marginRight')} onValueChange={(v) => patch('marginRight', v)} />
            <SizeInput label="Margin bottom" value={str('marginBottom')} onValueChange={(v) => patch('marginBottom', v)} />
            <SizeInput label="Margin left" value={str('marginLeft')} onValueChange={(v) => patch('marginLeft', v)} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="typography">
          <AccordionTrigger className="py-2 text-sm font-medium">
            Typography
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextAlignVisualRow str={str} patch={patch} />
            </div>
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
                { value: '800', label: '800' }
              ]}
            />
            <div className="sm:col-span-2">
              <FontFamilySelect
                id="ff-preset"
                inputId="ff"
                label="Font family"
                value={str('fontFamily')}
                onValueChange={(v) => patch('fontFamily', v)}
              />
            </div>
            <SizeInput label="Line height" value={str('lineHeight')} onValueChange={(v) => patch('lineHeight', v)} />
            <SizeInput label="Letter spacing" value={str('letterSpacing')} onValueChange={(v) => patch('letterSpacing', v)} />
            <StyleSelect
              label="Text transform"
              value={str('textTransform')}
              onValueChange={(v) => patch('textTransform', v)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'uppercase', label: 'Uppercase' },
                { value: 'lowercase', label: 'Lowercase' },
                { value: 'capitalize', label: 'Capitalize' }
              ]}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="background">
          <AccordionTrigger className="py-2 text-sm">Background &amp; text</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 pb-4">
            <ColorInput
              id="bgc"
              label="Background color"
              value={str('backgroundColor')}
              onValueChange={(v) => patch('backgroundColor', v)}
            />
            <ColorInput
              id="txc"
              label="Text color"
              value={str('color')}
              onValueChange={(v) => patch('color', v)}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bgi" className="text-xs">Background image (CSS)</Label>
              <Input
                id="bgi"
                className="font-mono text-xs"
                value={str('backgroundImage')}
                onChange={(e) => patch('backgroundImage', e.target.value)}
                placeholder={'url("https://…")'}
              />
            </div>
            <StyleSelect
              label="Background size"
              value={str('backgroundSize')}
              onValueChange={(v) => patch('backgroundSize', v)}
              options={[
                { value: 'cover', label: 'Cover' },
                { value: 'contain', label: 'Contain' },
                { value: 'auto', label: 'Auto' }
              ]}
            />
            <StyleSelect
              label="Background position"
              value={str('backgroundPosition')}
              onValueChange={(v) => patch('backgroundPosition', v)}
              options={[
                { value: 'center', label: 'Center' },
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' }
              ]}
            />
            <StyleSelect
              label="Background repeat"
              value={str('backgroundRepeat')}
              onValueChange={(v) => patch('backgroundRepeat', v)}
              options={[
                { value: 'no-repeat', label: 'No repeat' },
                { value: 'repeat', label: 'Repeat' },
                { value: 'repeat-x', label: 'Repeat X' },
                { value: 'repeat-y', label: 'Repeat Y' }
              ]}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="borders">
          <AccordionTrigger className="py-2 text-sm">Borders</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 pb-4">
            <p className="text-xs text-muted-foreground">Border radius presets</p>
            <div className="flex flex-wrap gap-1">
              {(['4px', '8px', '12px', '16px'] as const).map((px) => (
                <Button
                  key={px}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => patch('borderRadius', px)}
                >
                  {px}
                </Button>
              ))}
            </div>
            <SizeInput
              id="br"
              label="Border radius (custom)"
              value={str('borderRadius')}
              onValueChange={(v) => patch('borderRadius', v)}
            />
            <ColorInput
              id="bc"
              label="Border color"
              value={str('borderColor')}
              onValueChange={(v) => patch('borderColor', v)}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="border-all" className="text-xs">Border (CSS shorthand)</Label>
              <Input
                id="border-all"
                className="font-mono text-xs"
                value={str('border')}
                onChange={(e) => patch('border', e.target.value)}
                placeholder="1px solid var(--border)"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="effects">
          <AccordionTrigger className="py-2 text-sm">Effects</AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2">
            <NumberField
              id="op"
              label="Opacity (0–1)"
              value={str('opacity')}
              onValueChange={(v) => patch('opacity', v === '' ? '' : v)}
              min={0}
              max={1}
              step={0.05}
              placeholder="e.g. 0.9"
            />
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sh" className="text-xs">Box shadow</Label>
              <Input
                id="sh"
                className="font-mono text-xs"
                value={str('boxShadow')}
                onChange={(e) => patch('boxShadow', e.target.value)}
                placeholder="0 1px 2px rgba(0,0,0,0.05)"
              />
            </div>
            <StyleSelect
              label="Overflow"
              value={str('overflow')}
              onValueChange={(v) => patch('overflow', v)}
              options={[
                { value: 'visible', label: 'Visible' },
                { value: 'hidden', label: 'Hidden' },
                { value: 'auto', label: 'Auto' },
                { value: 'scroll', label: 'Scroll' }
              ]}
            />
            <StyleSelect
              label="Position"
              value={str('position')}
              onValueChange={(v) => patch('position', v)}
              options={[
                { value: 'static', label: 'Static' },
                { value: 'relative', label: 'Relative' },
                { value: 'absolute', label: 'Absolute' },
                { value: 'fixed', label: 'Fixed' },
                { value: 'sticky', label: 'Sticky' }
              ]}
            />
            <SizeInput label="Top" value={str('top')} onValueChange={(v) => patch('top', v)} />
            <SizeInput label="Right" value={str('right')} onValueChange={(v) => patch('right', v)} />
            <SizeInput label="Bottom" value={str('bottom')} onValueChange={(v) => patch('bottom', v)} />
            <SizeInput label="Left" value={str('left')} onValueChange={(v) => patch('left', v)} />
            <NumberField
              id="z"
              label="Z-index"
              value={str('zIndex')}
              onValueChange={(v) => patch('zIndex', v === '' ? '' : v)}
              step={1}
              placeholder="0"
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="animations">
          <AccordionTrigger className="py-2 text-sm font-medium">
            Animations
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 pb-4">
            <StyleSelect
              label="Animation"
              value={(instance.animation as { type?: string } | undefined)?.type ?? '__none__'}
              allowEmpty={false}
              options={[
                { value: '__none__', label: 'None' },
                { value: 'fade', label: 'Fade In' },
                { value: 'slide', label: 'Slide Up' },
                { value: 'zoom', label: 'Zoom In' }
              ]}
              onValueChange={(v) => {
                if (v === '__none__') {
                  updateSectionAnimation(instance.id, undefined)
                } else {
                  updateSectionAnimation(instance.id, { type: v as 'fade' | 'slide' | 'zoom' })
                }
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
