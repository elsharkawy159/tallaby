'use client'

import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'
import { Textarea } from '@workspace/ui/components/textarea'

import { LinkPicker, NumberField, StyleSelect } from '@/components/website-builder/controls'
import { IconPicker } from '@/components/website-builder/icons/icon-picker'
import type { ChromeComponent } from '@/lib/builder/shared-chrome/types'

/**
 * The nested settings form for one built-in component.
 *
 * Dispatches on `component.type`; anything without a bespoke form falls back to
 * the generic link/label pair, so a newly registered component is editable the
 * moment its descriptor exists.
 */
export function ComponentSettings ({
  component,
  onPatch,
}: {
  component: ChromeComponent
  onPatch: (patch: Partial<ChromeComponent>) => void
}) {
  const s = component.settings as Record<string, unknown>
  const set = (patch: Record<string, unknown>) =>
    onPatch({ settings: { ...s, ...patch } })

  const text = (key: string, fallback = '') =>
    typeof s[key] === 'string' ? (s[key] as string) : fallback
  const num = (key: string, fallback: number) =>
    typeof s[key] === 'number' ? (s[key] as number) : fallback

  switch (component.type) {
    case 'logo':
      return (
        <>
          <Field label="Logo text" id={`logo-text-${component.id}`}>
            <Input
              id={`logo-text-${component.id}`}
              className="h-7 text-xs"
              value={text('text')}
              onChange={(e) => set({ text: e.target.value })}
            />
          </Field>
          <Field label="Image URL" id={`logo-image-${component.id}`}>
            <Input
              id={`logo-image-${component.id}`}
              className="h-7 font-mono text-[10px]"
              placeholder="https://…"
              value={text('image')}
              onChange={(e) => set({ image: e.target.value })}
            />
          </Field>
          <Field label="Alt text" id={`logo-alt-${component.id}`}>
            <Input
              id={`logo-alt-${component.id}`}
              className="h-7 text-xs"
              value={text('alt')}
              onChange={(e) => set({ alt: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Height"
              value={String(num('height', 28))}
              onValueChange={(v) => set({ height: Number(v) || undefined })}
              min={8}
              max={200}
            />
            <NumberField
              label="Max width"
              value={s.maxWidth == null ? '' : String(s.maxWidth)}
              onValueChange={(v) => set({ maxWidth: v ? Number(v) : undefined })}
              min={8}
              max={600}
            />
          </div>
          <NumberField
            label="Mobile height"
            value={s.responsiveHeight == null ? '' : String(s.responsiveHeight)}
            onValueChange={(v) => set({ responsiveHeight: v ? Number(v) : undefined })}
            min={8}
            max={200}
          />
          <StyleSelect
            label="Click action"
            value={text('clickAction', 'home')}
            onValueChange={(clickAction) => set({ clickAction })}
            options={[
              { value: 'home', label: 'Go to homepage' },
              { value: 'top', label: 'Scroll to top' },
              { value: 'custom', label: 'Custom link' },
              { value: 'none', label: 'Do nothing' },
            ]}
            allowEmpty={false}
          />
          {text('clickAction', 'home') === 'custom' ? (
            <LinkPicker
              label="Custom link"
              value={s.customLink}
              onChange={(customLink) => set({ customLink })}
            />
          ) : null}
        </>
      )

    case 'navigation':
      return (
        <>
          <StyleSelect
            label="Desktop layout"
            value={text('desktopLayout', 'inline')}
            onValueChange={(desktopLayout) => set({ desktopLayout })}
            options={[
              { value: 'inline', label: 'Inline' },
              { value: 'centered', label: 'Centered' },
              { value: 'stacked', label: 'Stacked' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Mobile layout"
            value={text('mobileLayout', 'drawer')}
            onValueChange={(mobileLayout) => set({ mobileLayout })}
            options={[
              { value: 'drawer', label: 'Drawer' },
              { value: 'accordion', label: 'Accordion' },
              { value: 'inline', label: 'Inline' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Alignment"
            value={text('alignment', 'center')}
            onValueChange={(alignment) => set({ alignment })}
            options={[
              { value: 'start', label: 'Start' },
              { value: 'center', label: 'Center' },
              { value: 'end', label: 'End' },
            ]}
            allowEmpty={false}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Gap"
              value={String(num('gap', 4))}
              onValueChange={(v) => set({ gap: Number(v) || 0 })}
              min={0}
              max={64}
            />
            <NumberField
              label="Hover delay"
              hint="ms"
              value={String(num('hoverDelay', 120))}
              onValueChange={(v) => set({ hoverDelay: Number(v) || 0 })}
              min={0}
              max={1000}
              step={10}
            />
          </div>
          <StyleSelect
            label="Open dropdowns on"
            value={text('trigger', 'hover')}
            onValueChange={(trigger) => set({ trigger })}
            options={[
              { value: 'hover', label: 'Hover' },
              { value: 'click', label: 'Click' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Dropdown animation"
            value={text('dropdownAnimation', 'fade')}
            onValueChange={(dropdownAnimation) => set({ dropdownAnimation })}
            options={[
              { value: 'fade', label: 'Fade' },
              { value: 'slide', label: 'Slide' },
              { value: 'scale', label: 'Scale' },
              { value: 'none', label: 'None' },
            ]}
            allowEmpty={false}
          />
        </>
      )

    case 'themeToggle':
      return (
        <>
          <StyleSelect
            label="Style"
            value={text('style', 'icon')}
            onValueChange={(style) => set({ style })}
            options={[
              { value: 'icon', label: 'Icon button' },
              { value: 'switch', label: 'Switch' },
              { value: 'segmented', label: 'Segmented' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Default theme"
            value={text('defaultTheme', 'system')}
            onValueChange={(defaultTheme) => set({ defaultTheme })}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Icon style"
            value={text('iconStyle', 'sun-moon')}
            onValueChange={(iconStyle) => set({ iconStyle })}
            options={[
              { value: 'sun-moon', label: 'Sun / moon' },
              { value: 'contrast', label: 'Contrast' },
              { value: 'lightbulb', label: 'Lightbulb' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Animation"
            value={text('animation', 'fade')}
            onValueChange={(animation) => set({ animation })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'fade', label: 'Fade' },
              { value: 'rotate', label: 'Rotate' },
            ]}
            allowEmpty={false}
          />
          <SwitchRow
            id={`tt-label-${component.id}`}
            label="Show label"
            checked={Boolean(s.showLabel)}
            onChange={(showLabel) => set({ showLabel })}
          />
          <SwitchRow
            id={`tt-icon-${component.id}`}
            label="Show icon"
            checked={s.showIcon !== false}
            onChange={(showIcon) => set({ showIcon })}
          />
          <Field label="Tooltip" id={`tt-tip-${component.id}`}>
            <Input
              id={`tt-tip-${component.id}`}
              className="h-7 text-xs"
              value={text('tooltip')}
              onChange={(e) => set({ tooltip: e.target.value })}
            />
          </Field>
        </>
      )

    case 'languageSwitcher':
      return (
        <>
          <StyleSelect
            label="Display"
            value={text('display', 'code')}
            onValueChange={(display) => set({ display })}
            options={[
              { value: 'code', label: 'ISO code (EN)' },
              { value: 'name', label: 'Language name' },
              { value: 'flag', label: 'Flag' },
              { value: 'flagName', label: 'Flag + name' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Dropdown style"
            value={text('dropdownStyle', 'menu')}
            onValueChange={(dropdownStyle) => set({ dropdownStyle })}
            options={[
              { value: 'menu', label: 'Menu' },
              { value: 'inline', label: 'Inline' },
              { value: 'select', label: 'Select' },
            ]}
            allowEmpty={false}
          />
          <Field label="Default language" id={`ls-default-${component.id}`}>
            <Input
              id={`ls-default-${component.id}`}
              className="h-7 text-xs"
              placeholder="en"
              value={text('defaultLanguage')}
              onChange={(e) => set({ defaultLanguage: e.target.value })}
            />
          </Field>
          <Field label="Fallback language" id={`ls-fallback-${component.id}`}>
            <Input
              id={`ls-fallback-${component.id}`}
              className="h-7 text-xs"
              placeholder="en"
              value={text('fallbackLanguage')}
              onChange={(e) => set({ fallbackLanguage: e.target.value })}
            />
          </Field>
          <SwitchRow
            id={`ls-rtl-${component.id}`}
            label="RTL support"
            checked={s.rtlSupport !== false}
            onChange={(rtlSupport) => set({ rtlSupport })}
          />
          <SwitchRow
            id={`ls-auto-${component.id}`}
            label="Auto-detect browser language"
            checked={Boolean(s.autoDetect)}
            onChange={(autoDetect) => set({ autoDetect })}
          />
        </>
      )

    case 'cta':
    case 'customButton':
      return (
        <>
          <Field label="Text" id={`cta-text-${component.id}`}>
            <Input
              id={`cta-text-${component.id}`}
              className="h-7 text-xs"
              value={text('text')}
              onChange={(e) => set({ text: e.target.value })}
            />
          </Field>
          <LinkPicker label="Link" value={s.link} onChange={(link) => set({ link })} />
          <div className="grid grid-cols-2 gap-2">
            <StyleSelect
              label="Variant"
              value={text('variant', 'primary')}
              onValueChange={(variant) => set({ variant })}
              options={[
                { value: 'primary', label: 'Primary' },
                { value: 'secondary', label: 'Secondary' },
                { value: 'outline', label: 'Outline' },
                { value: 'ghost', label: 'Ghost' },
                { value: 'link', label: 'Link' },
              ]}
              allowEmpty={false}
            />
            <StyleSelect
              label="Size"
              value={text('size', 'md')}
              onValueChange={(size) => set({ size })}
              options={[
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
              ]}
              allowEmpty={false}
            />
          </div>
          <NumberField
            label="Corner radius"
            value={s.radius == null ? '' : String(s.radius)}
            onValueChange={(v) => set({ radius: v ? Number(v) : undefined })}
            min={0}
            max={99}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px]">Icon left</Label>
              <IconPicker
                value={text('iconLeft')}
                onChange={(iconLeft) => set({ iconLeft })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px]">Icon right</Label>
              <IconPicker
                value={text('iconRight')}
                onChange={(iconRight) => set({ iconRight })}
              />
            </div>
          </div>
          <SwitchRow
            id={`cta-tab-${component.id}`}
            label="Open in new tab"
            checked={Boolean(s.newTab)}
            onChange={(newTab) => set({ newTab })}
          />
          <SwitchRow
            id={`cta-loading-${component.id}`}
            label="Loading state"
            checked={Boolean(s.loading)}
            onChange={(loading) => set({ loading })}
          />
          <Field label="Analytics event" id={`cta-analytics-${component.id}`}>
            <Input
              id={`cta-analytics-${component.id}`}
              className="h-7 text-xs"
              placeholder="e.g. nav_cta_click"
              value={text('analyticsEvent')}
              onChange={(e) => set({ analyticsEvent: e.target.value })}
            />
          </Field>
        </>
      )

    case 'search':
      return (
        <>
          <StyleSelect
            label="Style"
            value={text('style', 'icon')}
            onValueChange={(style) => set({ style })}
            options={[
              { value: 'icon', label: 'Icon only' },
              { value: 'input', label: 'Input field' },
            ]}
            allowEmpty={false}
          />
          <Field label="Placeholder" id={`search-ph-${component.id}`}>
            <Input
              id={`search-ph-${component.id}`}
              className="h-7 text-xs"
              value={text('placeholder', 'Search…')}
              onChange={(e) => set({ placeholder: e.target.value })}
            />
          </Field>
        </>
      )

    case 'cart':
    case 'wishlist':
    case 'notifications':
      return (
        <>
          <SwitchRow
            id={`count-${component.id}`}
            label="Show count badge"
            checked={Boolean(s.showCount)}
            onChange={(showCount) => set({ showCount })}
          />
          <LinkPicker label="Link" value={s.link} onChange={(link) => set({ link })} />
        </>
      )

    case 'avatar':
      return (
        <>
          <SwitchRow
            id={`avatar-name-${component.id}`}
            label="Show name"
            checked={Boolean(s.showName)}
            onChange={(showName) => set({ showName })}
          />
          <Field label="Fallback initials" id={`avatar-initials-${component.id}`}>
            <Input
              id={`avatar-initials-${component.id}`}
              className="h-7 text-xs"
              maxLength={3}
              value={text('initials')}
              onChange={(e) => set({ initials: e.target.value })}
            />
          </Field>
          <LinkPicker label="Account link" value={s.link} onChange={(link) => set({ link })} />
        </>
      )

    case 'social':
      return (
        <>
          <StyleSelect
            label="Style"
            value={text('style', 'icon')}
            onValueChange={(style) => set({ style })}
            options={[
              { value: 'icon', label: 'Icons only' },
              { value: 'iconLabel', label: 'Icon + label' },
            ]}
            allowEmpty={false}
          />
          <NumberField
            label="Icon size"
            value={String(num('size', 18))}
            onValueChange={(v) => set({ size: Number(v) || 18 })}
            min={10}
            max={48}
          />
          <IconLinkList
            items={(s.items as IconLinkItem[]) ?? []}
            onChange={(items) => set({ items })}
            addLabel="Add social link"
          />
        </>
      )

    case 'legal':
      return (
        <IconLinkList
          items={(s.items as IconLinkItem[]) ?? []}
          onChange={(items) => set({ items })}
          addLabel="Add policy link"
          withIcon={false}
        />
      )

    case 'newsletter':
      return (
        <>
          <Field label="Title" id={`nl-title-${component.id}`}>
            <Input
              id={`nl-title-${component.id}`}
              className="h-7 text-xs"
              value={text('title')}
              onChange={(e) => set({ title: e.target.value })}
            />
          </Field>
          <Field label="Description" id={`nl-desc-${component.id}`}>
            <Textarea
              id={`nl-desc-${component.id}`}
              className="min-h-14 text-xs"
              value={text('description')}
              onChange={(e) => set({ description: e.target.value })}
            />
          </Field>
          <Field label="Placeholder" id={`nl-ph-${component.id}`}>
            <Input
              id={`nl-ph-${component.id}`}
              className="h-7 text-xs"
              value={text('placeholder')}
              onChange={(e) => set({ placeholder: e.target.value })}
            />
          </Field>
          <Field label="Button text" id={`nl-btn-${component.id}`}>
            <Input
              id={`nl-btn-${component.id}`}
              className="h-7 text-xs"
              value={text('buttonText')}
              onChange={(e) => set({ buttonText: e.target.value })}
            />
          </Field>
          <Field label="Success message" id={`nl-success-${component.id}`}>
            <Input
              id={`nl-success-${component.id}`}
              className="h-7 text-xs"
              value={text('successMessage')}
              onChange={(e) => set({ successMessage: e.target.value })}
            />
          </Field>
        </>
      )

    case 'copyright':
      return (
        <>
          <Field label="Text" id={`cr-text-${component.id}`}>
            <Input
              id={`cr-text-${component.id}`}
              className="h-7 text-xs"
              value={text('text')}
              onChange={(e) => set({ text: e.target.value })}
            />
          </Field>
          <SwitchRow
            id={`cr-year-${component.id}`}
            label="Replace {year} with the current year"
            checked={Boolean(s.autoYear)}
            onChange={(autoYear) => set({ autoYear })}
          />
        </>
      )

    case 'linkColumn':
      return (
        <Field label="Column title" id={`col-title-${component.id}`}>
          <Input
            id={`col-title-${component.id}`}
            className="h-7 text-xs"
            value={text('title')}
            onChange={(e) => set({ title: e.target.value })}
          />
        </Field>
      )

    case 'customBlock':
      return (
        <Field label="Text" id={`cb-text-${component.id}`}>
          <Textarea
            id={`cb-text-${component.id}`}
            className="min-h-16 text-xs"
            value={text('text')}
            onChange={(e) => set({ text: e.target.value })}
          />
        </Field>
      )

    // login / register and any future link-shaped component
    default:
      return (
        <>
          <Field label="Text" id={`gen-text-${component.id}`}>
            <Input
              id={`gen-text-${component.id}`}
              className="h-7 text-xs"
              value={text('text')}
              onChange={(e) => set({ text: e.target.value })}
            />
          </Field>
          <LinkPicker label="Link" value={s.link} onChange={(link) => set({ link })} />
          <SwitchRow
            id={`gen-tab-${component.id}`}
            label="Open in new tab"
            checked={Boolean(s.newTab)}
            onChange={(newTab) => set({ newTab })}
          />
        </>
      )
  }
}

// ── Small shared building blocks ───────────────────────────────────────────

function Field ({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      {children}
    </div>
  )
}

function SwitchRow ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

interface IconLinkItem {
  icon?: string
  label?: string
  href?: string
}

/** Editable list of `{ icon?, label, href }` rows — socials and policy links. */
function IconLinkList ({
  items,
  onChange,
  addLabel,
  withIcon = true,
}: {
  items: IconLinkItem[]
  onChange: (items: IconLinkItem[]) => void
  addLabel: string
  withIcon?: boolean
}) {
  const patch = (index: number, next: Partial<IconLinkItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)))

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-1 rounded border border-border p-1.5">
          <div className="flex items-center gap-1">
            <Input
              className="h-6 flex-1 text-[11px]"
              placeholder="Label"
              value={item.label ?? ''}
              onChange={(e) => patch(index, { label: e.target.value })}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-6 text-muted-foreground hover:text-destructive"
              aria-label="Remove link"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
          <Input
            className="h-6 font-mono text-[10px]"
            placeholder="https://…"
            value={item.href ?? ''}
            onChange={(e) => patch(index, { href: e.target.value })}
          />
          {withIcon ? (
            <IconPicker
              value={item.icon ?? ''}
              onChange={(icon) => patch(index, { icon })}
            />
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-[11px]"
        onClick={() => onChange([...items, { label: 'Link', href: '#' }])}
      >
        <Plus className="size-3" />
        {addLabel}
      </Button>
    </div>
  )
}
