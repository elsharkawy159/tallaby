'use client'

import { cloneElement, isValidElement, type ReactElement } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Minus, Plus } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@/lib/utils'

/*
 * Dashboard form kit: the section cards, field chrome and small controls the
 * seller pages (settings, add/edit product) share, sized to the Claude design.
 */

/** Text inputs and textareas: 44px tall with a soft teal focus ring. */
export const FIELD_CLASS =
  'h-11 rounded-[10px] bg-card px-3.5 shadow-none transition-[border-color,box-shadow] hover:border-faint focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 dark:bg-card'

export const TEXTAREA_CLASS = cn(FIELD_CLASS, 'h-auto min-h-[104px] py-3 leading-relaxed')

/** Bordered wrapper that joins an addon (icon, `https://`) to an input. */
export const INPUT_GROUP_CLASS =
  'flex items-stretch overflow-hidden rounded-[10px] border border-input bg-card transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20'

export const INPUT_IN_GROUP_CLASS =
  'h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3.5 shadow-none focus-visible:ring-0 dark:bg-transparent'

export const ADDON_CLASS =
  'flex items-center whitespace-nowrap bg-muted px-3 font-mono text-[13px] text-muted-foreground'

/** A native `<select>` sitting at the end of an input group (unit / discount type). */
export const GROUP_SELECT_CLASS =
  'h-11 cursor-pointer border-0 border-s border-border bg-muted px-2.5 text-xs text-muted-foreground outline-none'

/**
 * The design's compact button: 34px, 10px corners (Button `sm` is a pill).
 * `rtl:flex-row` keeps the icon at the start in Arabic, as in the design.
 */
export const SMALL_BUTTON_CLASS = 'h-[34px] rounded-[10px] px-3 text-[13px] font-medium rtl:flex-row'

/** Regular action buttons: 42px tall, 12px corners. */
export const BUTTON_CLASS = 'h-[42px] px-[18px] font-medium rtl:flex-row'

/** Red ring for a field the publish check flagged. */
export const INVALID_FIELD_CLASS = 'border-destructive focus-within:border-destructive'

export function SectionCard ({
  id,
  icon: Icon,
  title,
  description,
  tag,
  action,
  divided = true,
  invalid = false,
  children,
  className,
}: {
  id: string
  /** From a server component pass a rendered icon (`<Gem />`): a component can't cross into this client file. */
  icon: SectionIconProp
  title: React.ReactNode
  description: React.ReactNode
  /** Small badge in the header; hidden on phones. */
  tag?: React.ReactNode
  /** Header button that stays visible on every breakpoint. */
  action?: React.ReactNode
  /** Rule between header and body. The product form runs them together. */
  divided?: boolean
  invalid?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card
      id={id}
      className={cn(
        'scroll-mt-[136px] gap-0 rounded-2xl py-0 transition-colors md:scroll-mt-[88px] dark:shadow-none',
        invalid && 'border-destructive/45',
        className
      )}
    >
      <CardHeader
        className={cn(
          'flex items-start px-4',
          divided
            ? 'gap-3.5 border-b py-4 sm:px-6 sm:py-5 [.border-b]:pb-4 sm:[.border-b]:pb-5'
            : 'gap-3 pt-4 pb-0 sm:px-[22px] sm:pt-5'
        )}
      >
        <SectionIcon icon={Icon} compact={!divided} />
        <div className='min-w-0 flex-1'>
          <CardTitle className='text-base leading-normal font-bold'>
            <h2>{title}</h2>
          </CardTitle>
          <CardDescription
            className={cn('mt-0.5 leading-relaxed text-pretty', divided ? 'text-[13px]' : 'text-xs')}
          >
            {description}
          </CardDescription>
        </div>
        {tag ? <div className='hidden shrink-0 sm:block'>{tag}</div> : null}
        {action ? <div className='shrink-0'>{action}</div> : null}
      </CardHeader>
      <CardContent
        className={cn(
          'flex flex-col gap-4 p-4',
          divided ? 'sm:gap-5 sm:p-6' : 'sm:px-[22px] sm:pt-[18px] sm:pb-[22px]'
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
}

export type SectionIconProp = LucideIcon | ReactElement<{ className?: string }>

export function SectionIcon ({ icon: Icon, compact = false }: { icon: SectionIconProp; compact?: boolean }) {
  const className = compact ? 'size-[17px]' : 'size-[18px]'
  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary-ink',
        compact ? 'size-9' : 'size-9.5'
      )}
    >
      {isValidElement(Icon) ? cloneElement(Icon, { className }) : <Icon className={className} />}
    </div>
  )
}

/** Field label with an optional muted note on the opposite side. */
export function LabelNote ({ children }: { children: React.ReactNode }) {
  return (
    <span className='text-xs font-normal whitespace-nowrap text-faint'>
      {children}
    </span>
  )
}

export function FieldHint ({
  children,
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}

/** Tiny "AR"/"EN" chip marking a field that is written once per language. */
export function LocaleTag ({ locale }: { locale: string }) {
  return (
    <span className='rounded-[5px] bg-primary-soft px-[5px] font-sans text-[10px] leading-[18px] font-bold text-primary-ink'>
      {locale.toUpperCase()}
    </span>
  )
}

/**
 * The design's field label: required star, optional language chip, and a note
 * (counter, "Optional") pushed to the far end.
 */
export function FieldLabel ({
  htmlFor,
  required,
  locale,
  note,
  children,
  className,
}: {
  htmlFor?: string
  required?: boolean
  locale?: string
  note?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const Comp = htmlFor ? 'label' : 'span'
  return (
    <Comp
      htmlFor={htmlFor}
      className={cn(
        'flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap',
        className
      )}
    >
      {required && <span className='font-bold text-destructive'>*</span>}
      {children}
      {locale && <LocaleTag locale={locale} />}
      {note != null && <span className='ms-auto'><LabelNote>{note}</LabelNote></span>}
    </Comp>
  )
}

export function FieldError ({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p className='text-xs text-destructive'>{children}</p>
}

/** Group wrapper + end/start addon, for "price | ج.م" style inputs. */
export function InputGroup ({
  invalid,
  className,
  ...props
}: React.ComponentProps<'div'> & { invalid?: boolean }) {
  return (
    <div
      className={cn(INPUT_GROUP_CLASS, 'h-11', invalid && INVALID_FIELD_CLASS, className)}
      {...props}
    />
  )
}

export function InputAddon ({
  position = 'end',
  className,
  ...props
}: React.ComponentProps<'span'> & { position?: 'start' | 'end' }) {
  return (
    <span
      className={cn(
        'flex items-center whitespace-nowrap bg-muted px-3 text-xs text-muted-foreground',
        position === 'start' ? 'border-e border-border' : 'border-s border-border',
        className
      )}
      {...props}
    />
  )
}

/** Plain input used inside an InputGroup. */
export function GroupInput ({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
}

/** Arabic-Indic and Persian digits typed on an Arabic keyboard count as digits. */
export const toAsciiDigits = (text: string) =>
  text.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) & 0xf))

/**
 * − value + control for whole-number counts (stock, handling days). The
 * number in the middle is a normal input: click it and type a value.
 */
export function NumberStepper ({
  id,
  value,
  onChange,
  onBlur,
  min = 0,
  max,
  suffix,
  disabled,
  invalid,
  decrementLabel,
  incrementLabel,
  inputLabel,
  size = 'default',
}: {
  id?: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  onBlur?: () => void
  min?: number
  max?: number
  suffix?: React.ReactNode
  disabled?: boolean
  invalid?: boolean
  decrementLabel: string
  incrementLabel: string
  /** Accessible name for the number when no <label htmlFor> points at it. */
  inputLabel?: string
  /** 'sm' fits table cells such as the variant rows. */
  size?: 'default' | 'sm'
}) {
  const current = typeof value === 'number' && !Number.isNaN(value) ? value : undefined
  const clamp = (n: number) => Math.max(min, max != null ? Math.min(max, n) : n)
  const bump = (delta: number) => onChange(clamp((current ?? min) + delta))
  const small = size === 'sm'
  const buttonClass = cn(
    'grid shrink-0 place-items-center bg-muted text-muted-foreground transition-colors hover:text-primary-ink disabled:cursor-not-allowed disabled:opacity-50',
    small ? 'w-8' : 'w-11'
  )
  const iconClass = small ? 'size-3.5' : 'size-4'

  return (
    <div
      className={cn(
        INPUT_GROUP_CLASS,
        small ? 'h-9 rounded-[10px]' : 'h-11',
        disabled && 'opacity-60',
        invalid && INVALID_FIELD_CLASS
      )}
    >
      <button
        type='button'
        onClick={() => bump(-1)}
        disabled={disabled || (current ?? min) <= min}
        aria-label={decrementLabel}
        className={buttonClass}
      >
        <Minus className={iconClass} />
      </button>
      <input
        id={id}
        dir='ltr'
        inputMode='numeric'
        aria-label={inputLabel}
        value={current ?? ''}
        disabled={disabled}
        // Clicking the number selects it, so typing replaces it.
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const digits = toAsciiDigits(e.target.value).replace(/\D/g, '')
          onChange(digits === '' ? undefined : clamp(Number(digits)))
        }}
        onBlur={onBlur}
        className={cn(
          'min-w-0 flex-1 bg-transparent text-center font-sans font-semibold tabular-nums outline-none disabled:cursor-not-allowed',
          small && 'text-[13px]'
        )}
      />
      {suffix && (
        <span className='flex items-center border-s border-border px-3 text-xs text-muted-foreground'>
          {suffix}
        </span>
      )}
      <button
        type='button'
        onClick={() => bump(1)}
        disabled={disabled || (max != null && (current ?? min) >= max)}
        aria-label={incrementLabel}
        className={buttonClass}
      >
        <Plus className={iconClass} />
      </button>
    </div>
  )
}

/** Switch with a bold title and a one-line explanation; `boxed` gives it the option-tile look. */
export function ToggleRow ({
  id,
  checked,
  onCheckedChange,
  title,
  description,
  boxed = false,
  disabled,
  className,
}: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  boxed?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-3',
        boxed && 'rounded-xl border bg-muted px-4 py-3.5',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <span className='min-w-0'>
        <span className='block text-[13px] font-semibold'>{title}</span>
        {description && (
          <span className='block text-xs leading-normal text-muted-foreground'>{description}</span>
        )}
      </span>
    </label>
  )
}

/** Selectable card with an icon tile — a radio choice with room to explain itself. */
export function ChoiceCard ({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
  disabled = false,
  badge,
}: {
  icon: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  /** Small tag beside the title, e.g. "Soon". */
  badge?: React.ReactNode
}) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-xl border-[1.5px] bg-card p-3.5 text-start transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-60',
        selected
          ? 'border-primary ring-[3px] ring-primary/20'
          : 'border-border enabled:hover:border-input'
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-[10px] transition-colors',
          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary-ink'
        )}
      >
        <Icon className='size-[17px]' />
      </span>
      <span className='min-w-0'>
        <span className='flex flex-wrap items-center gap-1.5 text-sm font-semibold'>
          {title}
          {badge && (
            <span className='rounded-full bg-muted px-2 py-px text-[11px] font-semibold text-muted-foreground'>
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className='block text-xs leading-relaxed text-muted-foreground'>{description}</span>
        )}
      </span>
    </button>
  )
}

/** Heading inside a section body, trailed by a hairline. */
export function SubHeading ({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex items-center gap-2 pt-1 text-[13px] font-bold after:h-px after:flex-1 after:bg-border'>
      {children}
    </div>
  )
}

/** Character counter + bar that turns green inside the recommended range. */
export function LengthMeter ({
  length,
  min,
  max,
}: {
  length: number
  min: number
  max: number
}) {
  const state = length >= min && length <= max ? 'ok' : length > max ? 'over' : 'idle'
  return (
    <div className='h-1 overflow-hidden rounded-full bg-border'>
      <i
        className={cn(
          'block h-full transition-[width,background-color] duration-200',
          state === 'ok' ? 'bg-success' : state === 'over' ? 'bg-accent' : 'bg-faint'
        )}
        style={{ width: `${Math.min(100, (length / max) * 100)}%` }}
      />
    </div>
  )
}

export function LengthCount ({ length, min, max }: { length: number; min: number; max: number }) {
  const state = length >= min && length <= max ? 'ok' : length > max ? 'over' : 'idle'
  return (
    <span
      className={cn(
        'font-sans text-[11px] tabular-nums',
        state === 'ok' ? 'text-success' : state === 'over' ? 'text-accent-ink' : 'text-faint'
      )}
    >
      {length} / {max}
    </span>
  )
}
